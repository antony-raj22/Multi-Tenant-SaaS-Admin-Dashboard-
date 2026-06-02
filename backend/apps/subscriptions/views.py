from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count
from .models import Subscription
from .serializers import SubscriptionSerializer
from apps.users.permissions import IsSuperAdmin, IsTenantAdminOrAbove


class SubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = [IsTenantAdminOrAbove]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "billing_interval", "plan__tier"]
    search_fields = ["tenant__name", "plan__name"]
    ordering_fields = ["created_at", "current_period_end"]

    def get_queryset(self):
        user = self.request.user
        qs = Subscription.objects.select_related("tenant", "plan")
        if user.role != "super_admin":
            return qs.filter(tenant=user.tenant)
        return qs

    @action(detail=False, methods=["get"], permission_classes=[IsSuperAdmin])
    def summary(self, request):
        qs = Subscription.objects.select_related("plan")
        active = qs.filter(status="active")
        return Response({
            "total": qs.count(),
            "active": active.count(),
            "trial": qs.filter(status="trial").count(),
            "cancelled": qs.filter(status="cancelled").count(),
            "past_due": qs.filter(status="past_due").count(),
            "total_mrr": sum(s.mrr for s in active),
            "by_plan": list(
                qs.values("plan__tier").annotate(count=Count("id")).order_by("plan__tier")
            ),
        })

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        sub = self.get_object()
        from django.utils import timezone
        sub.status = Subscription.Status.CANCELLED
        sub.cancelled_at = timezone.now()
        sub.save()
        return Response({"detail": "Subscription cancelled."})

    @action(detail=True, methods=["post"])
    def reactivate(self, request, pk=None):
        sub = self.get_object()
        sub.status = Subscription.Status.ACTIVE
        sub.cancelled_at = None
        sub.save()
        return Response({"detail": "Subscription reactivated."})
