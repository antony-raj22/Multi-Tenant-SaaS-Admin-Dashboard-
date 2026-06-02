from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum
from .models import Payment
from .serializers import PaymentSerializer
from apps.users.permissions import IsTenantAdminOrAbove, IsSuperAdmin


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsTenantAdminOrAbove]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "currency", "tenant"]
    search_fields = ["invoice_number", "tenant__name", "payment_method"]
    ordering_fields = ["created_at", "amount", "paid_at"]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        qs = Payment.objects.select_related("tenant")
        if user.role != "super_admin":
            return qs.filter(tenant=user.tenant)
        return qs

    @action(detail=False, methods=["get"], permission_classes=[IsSuperAdmin])
    def summary(self, request):
        qs = Payment.objects.all()
        paid = qs.filter(status="paid")
        return Response(
            {
                "total_collected": paid.aggregate(total=Sum("amount"))["total"] or 0,
                "failed_count": qs.filter(status="failed").count(),
                "failed_amount": qs.filter(status="failed").aggregate(total=Sum("amount"))[
                    "total"
                ]
                or 0,
                "refunded": qs.filter(status="refunded").aggregate(total=Sum("amount"))[
                    "total"
                ]
                or 0,
                "success_rate": round(paid.count() / max(qs.count(), 1) * 100, 2),
            }
        )

    @action(detail=True, methods=["post"])
    def refund(self, request, pk=None):
        payment = self.get_object()
        amount = request.data.get("amount", payment.amount)
        payment.refunded_amount = amount
        payment.status = Payment.Status.REFUNDED
        payment.save()
        return Response({"detail": f"Refunded ${amount}"})
