from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source="tenant.name", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "tenant",
            "tenant_name",
            "invoice_number",
            "amount",
            "currency",
            "status",
            "payment_method",
            "description",
            "failure_reason",
            "refunded_amount",
            "paid_at",
            "stripe_payment_intent_id",
            "stripe_invoice_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "invoice_number", "created_at", "updated_at"]
