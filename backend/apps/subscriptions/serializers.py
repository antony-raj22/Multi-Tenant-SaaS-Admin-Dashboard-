from rest_framework import serializers
from .models import Subscription


class SubscriptionSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source="tenant.name", read_only=True)
    plan_name = serializers.CharField(source="plan.name", read_only=True)
    plan_tier = serializers.CharField(source="plan.tier", read_only=True)
    mrr = serializers.FloatField(read_only=True)
    seats_limit = serializers.IntegerField(source="plan.max_seats", read_only=True)

    class Meta:
        model = Subscription
        fields = [
            "id", "tenant", "tenant_name", "plan", "plan_name", "plan_tier",
            "status", "billing_interval", "current_period_start",
            "current_period_end", "trial_end", "cancelled_at",
            "seats_used", "seats_limit", "mrr",
            "stripe_subscription_id", "stripe_customer_id",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
