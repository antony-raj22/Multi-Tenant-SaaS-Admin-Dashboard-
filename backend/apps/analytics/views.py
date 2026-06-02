from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
from apps.users.models import Tenant, User
from apps.subscriptions.models import Subscription
from apps.payments.models import Payment
from apps.users.permissions import IsSuperAdmin


class DashboardSummaryView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        active_subs = Subscription.objects.filter(status="active").select_related("plan")
        mrr = sum(subscription.mrr for subscription in active_subs)

        return Response(
            {
                "total_tenants": Tenant.objects.count(),
                "active_users": User.objects.filter(status="active").count(),
                "total_users": User.objects.count(),
                "mrr": round(mrr, 2),
                "active_subscriptions": active_subs.count(),
                "trial_subscriptions": Subscription.objects.filter(status="trial").count(),
                "revenue_mtd": float(
                    Payment.objects.filter(status="paid", paid_at__gte=start_of_month).aggregate(
                        total=Sum("amount")
                    )["total"]
                    or 0
                ),
                "churn_rate": self._churn_rate(),
            }
        )

    def _churn_rate(self):
        thirty_days_ago = timezone.now() - timedelta(days=30)
        cancelled = Subscription.objects.filter(cancelled_at__gte=thirty_days_ago).count()
        total = Subscription.objects.count()
        return round(cancelled / max(total, 1) * 100, 2)


class RevenueChartView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        months = int(request.query_params.get("months", 6))
        start = timezone.now() - timedelta(days=30 * months)
        data = (
            Payment.objects.filter(status="paid", paid_at__gte=start)
            .annotate(month=TruncMonth("paid_at"))
            .values("month")
            .annotate(revenue=Sum("amount"), count=Count("id"))
            .order_by("month")
        )

        return Response(
            [
                {
                    "month": row["month"].strftime("%b %Y"),
                    "revenue": float(row["revenue"]),
                    "count": row["count"],
                }
                for row in data
            ]
        )


class UserGrowthView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        months = int(request.query_params.get("months", 12))
        start = timezone.now() - timedelta(days=30 * months)
        new_users = (
            User.objects.filter(date_joined__gte=start)
            .annotate(month=TruncMonth("date_joined"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )
        churned = (
            Subscription.objects.filter(cancelled_at__gte=start, cancelled_at__isnull=False)
            .annotate(month=TruncMonth("cancelled_at"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )

        return Response(
            {
                "new_users": [
                    {"month": row["month"].strftime("%b %Y"), "count": row["count"]}
                    for row in new_users
                ],
                "churned": [
                    {"month": row["month"].strftime("%b %Y"), "count": row["count"]}
                    for row in churned
                ],
            }
        )


class PlanDistributionView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        data = (
            Subscription.objects.filter(status="active")
            .values("plan__tier", "plan__name")
            .annotate(count=Count("id"))
            .order_by("plan__tier")
        )
        return Response(list(data))
