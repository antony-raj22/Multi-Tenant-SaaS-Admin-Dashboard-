from rest_framework import serializers
from .models import Plan


class PlanSerializer(serializers.ModelSerializer):
    active_subscriptions = serializers.SerializerMethodField()

    class Meta:
        model = Plan
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_active_subscriptions(self, obj):
        return obj.subscriptions.filter(status="active").count()
