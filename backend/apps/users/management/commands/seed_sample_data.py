from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.notifications.models import Notification
from apps.payments.models import Payment
from apps.plans.models import Plan
from apps.subscriptions.models import Subscription
from apps.users.models import Tenant, User


class Command(BaseCommand):
    help = "Create sample data for the SaaS admin dashboard."

    def handle(self, *args, **options):
        with transaction.atomic():
            plans = self.create_plans()
            tenants = self.create_tenants()
            users = self.create_users(tenants)
            self.create_subscriptions(tenants, plans)
            self.create_payments(tenants)
            self.create_notifications(users)

        self.stdout.write(self.style.SUCCESS("Sample data loaded successfully."))
        self.stdout.write("")
        self.stdout.write("Demo login:")
        self.stdout.write("  email: admin@nexasaas.io")
        self.stdout.write("  password: Admin@12345")

    def create_plans(self):
        plan_data = [
            {
                "name": "Starter",
                "tier": Plan.Tier.STARTER,
                "description": "For small teams validating their SaaS operations.",
                "price_monthly": Decimal("29.00"),
                "price_annual": Decimal("290.00"),
                "max_seats": 10,
                "max_storage_gb": 25,
                "features": [
                    {"name": "Tenant dashboard", "included": True},
                    {"name": "Basic analytics", "included": True},
                    {"name": "Priority support", "included": False},
                ],
                "is_featured": False,
                "sort_order": 1,
            },
            {
                "name": "Pro",
                "tier": Plan.Tier.PRO,
                "description": "For growing SaaS teams with billing and automation needs.",
                "price_monthly": Decimal("99.00"),
                "price_annual": Decimal("990.00"),
                "max_seats": 50,
                "max_storage_gb": 250,
                "features": [
                    {"name": "Advanced analytics", "included": True},
                    {"name": "Billing automation", "included": True},
                    {"name": "Priority support", "included": True},
                ],
                "is_featured": True,
                "sort_order": 2,
            },
            {
                "name": "Enterprise",
                "tier": Plan.Tier.ENTERPRISE,
                "description": "For large organizations that need unlimited scale.",
                "price_monthly": Decimal("299.00"),
                "price_annual": Decimal("2990.00"),
                "max_seats": None,
                "max_storage_gb": None,
                "features": [
                    {"name": "Custom roles", "included": True},
                    {"name": "Dedicated success manager", "included": True},
                    {"name": "SAML SSO", "included": True},
                ],
                "is_featured": False,
                "sort_order": 3,
            },
        ]

        plans = {}
        for data in plan_data:
            plan, _ = Plan.objects.update_or_create(
                tier=data["tier"],
                defaults={**data, "is_active": True},
            )
            plans[data["tier"]] = plan
        return plans

    def create_tenants(self):
        tenant_data = [
            ("Acme Cloud", "acme-cloud", "acme.example.com", True),
            ("Northstar Labs", "northstar-labs", "northstar.example.com", True),
            ("BluePeak Systems", "bluepeak-systems", "bluepeak.example.com", True),
            ("OrbitWorks", "orbitworks", "orbitworks.example.com", True),
            ("Legacy Retail", "legacy-retail", "legacy.example.com", False),
        ]

        tenants = {}
        for name, slug, domain, is_active in tenant_data:
            tenant, _ = Tenant.objects.update_or_create(
                slug=slug,
                defaults={"name": name, "domain": domain, "is_active": is_active},
            )
            tenants[slug] = tenant
        return tenants

    def create_users(self, tenants):
        admin = self.upsert_user(
            email="admin@nexasaas.io",
            password="Admin@12345",
            first_name="Nexa",
            last_name="Admin",
            tenant=None,
            role=User.Role.SUPER_ADMIN,
            status=User.Status.ACTIVE,
            is_staff=True,
            is_superuser=True,
        )

        users = {"admin": admin}
        sample_users = [
            ("maya@acme.example.com", "Maya", "Patel", "acme-cloud", User.Role.TENANT_ADMIN),
            ("leo@acme.example.com", "Leo", "Morgan", "acme-cloud", User.Role.MEMBER),
            ("ivy@northstar.example.com", "Ivy", "Chen", "northstar-labs", User.Role.TENANT_ADMIN),
            ("omar@northstar.example.com", "Omar", "Reed", "northstar-labs", User.Role.BILLING),
            ("nora@bluepeak.example.com", "Nora", "Diaz", "bluepeak-systems", User.Role.TENANT_ADMIN),
            ("eli@orbitworks.example.com", "Eli", "Stone", "orbitworks", User.Role.MEMBER),
            ("sam@legacy.example.com", "Sam", "Gray", "legacy-retail", User.Role.READ_ONLY),
        ]

        for email, first_name, last_name, tenant_slug, role in sample_users:
            tenant = tenants[tenant_slug]
            users[email] = self.upsert_user(
                email=email,
                password="Demo@12345",
                first_name=first_name,
                last_name=last_name,
                tenant=tenant,
                role=role,
                status=User.Status.ACTIVE if tenant.is_active else User.Status.SUSPENDED,
                is_staff=False,
                is_superuser=False,
            )
        return users

    def upsert_user(self, email, password, **defaults):
        user, created = User.objects.update_or_create(email=email, defaults=defaults)
        if created or not user.has_usable_password():
            user.set_password(password)
            user.save(update_fields=["password"])
        return user

    def create_subscriptions(self, tenants, plans):
        now = timezone.now()
        subscription_data = [
            ("acme-cloud", plans[Plan.Tier.PRO], Subscription.Status.ACTIVE, "monthly", 32),
            ("northstar-labs", plans[Plan.Tier.ENTERPRISE], Subscription.Status.ACTIVE, "annual", 84),
            ("bluepeak-systems", plans[Plan.Tier.PRO], Subscription.Status.TRIAL, "monthly", 18),
            ("orbitworks", plans[Plan.Tier.STARTER], Subscription.Status.PAST_DUE, "monthly", 9),
            ("legacy-retail", plans[Plan.Tier.STARTER], Subscription.Status.CANCELLED, "monthly", 4),
        ]

        for tenant_slug, plan, status, interval, seats_used in subscription_data:
            cancelled_at = now - timedelta(days=12) if status == Subscription.Status.CANCELLED else None
            Subscription.objects.update_or_create(
                tenant=tenants[tenant_slug],
                defaults={
                    "plan": plan,
                    "status": status,
                    "billing_interval": interval,
                    "current_period_start": now - timedelta(days=18),
                    "current_period_end": now + timedelta(days=12),
                    "trial_end": now + timedelta(days=10)
                    if status == Subscription.Status.TRIAL
                    else None,
                    "cancelled_at": cancelled_at,
                    "seats_used": seats_used,
                    "stripe_subscription_id": f"sub_demo_{tenant_slug.replace('-', '_')}",
                    "stripe_customer_id": f"cus_demo_{tenant_slug.replace('-', '_')}",
                    "metadata": {"source": "sample_data"},
                },
            )

    def create_payments(self, tenants):
        now = timezone.now()
        payment_data = [
            ("INV-1001", "acme-cloud", Decimal("99.00"), Payment.Status.PAID, now - timedelta(days=3)),
            ("INV-1002", "northstar-labs", Decimal("2990.00"), Payment.Status.PAID, now - timedelta(days=8)),
            ("INV-1003", "orbitworks", Decimal("29.00"), Payment.Status.FAILED, None),
            ("INV-1004", "acme-cloud", Decimal("99.00"), Payment.Status.PAID, now - timedelta(days=34)),
            ("INV-1005", "bluepeak-systems", Decimal("99.00"), Payment.Status.PENDING, None),
            ("INV-1006", "legacy-retail", Decimal("29.00"), Payment.Status.REFUNDED, now - timedelta(days=44)),
        ]

        for invoice, tenant_slug, amount, status, paid_at in payment_data:
            Payment.objects.update_or_create(
                invoice_number=invoice,
                defaults={
                    "tenant": tenants[tenant_slug],
                    "amount": amount,
                    "currency": "USD",
                    "status": status,
                    "payment_method": "Visa ending 4242",
                    "description": "Demo billing cycle",
                    "failure_reason": "Card declined" if status == Payment.Status.FAILED else "",
                    "refunded_amount": amount if status == Payment.Status.REFUNDED else Decimal("0.00"),
                    "paid_at": paid_at,
                    "stripe_payment_intent_id": f"pi_demo_{invoice.lower().replace('-', '_')}",
                    "stripe_invoice_id": f"in_demo_{invoice.lower().replace('-', '_')}",
                },
            )

    def create_notifications(self, users):
        admin = users["admin"]
        notifications = [
            (
                Notification.Type.PAYMENT_FAILED,
                Notification.Severity.ERROR,
                "Payment failed for OrbitWorks",
                "OrbitWorks has a failed invoice that needs billing follow-up.",
                "/payments",
            ),
            (
                Notification.Type.TRIAL_EXPIRING,
                Notification.Severity.WARNING,
                "BluePeak trial ends soon",
                "BluePeak Systems has 10 days left in trial.",
                "/subscriptions",
            ),
            (
                Notification.Type.NEW_SIGNUP,
                Notification.Severity.SUCCESS,
                "New tenant onboarded",
                "Northstar Labs completed onboarding on the Enterprise plan.",
                "/users/tenants",
            ),
        ]

        for item_type, severity, title, message, action_url in notifications:
            Notification.objects.update_or_create(
                recipient=admin,
                title=title,
                defaults={
                    "type": item_type,
                    "severity": severity,
                    "message": message,
                    "is_read": False,
                    "action_url": action_url,
                    "metadata": {"source": "sample_data"},
                },
            )
