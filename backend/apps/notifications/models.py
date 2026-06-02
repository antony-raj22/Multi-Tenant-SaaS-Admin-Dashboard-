from django.db import models
from apps.users.models import User
import uuid


class Notification(models.Model):
    class Type(models.TextChoices):
        PAYMENT_FAILED = "payment_failed", "Payment Failed"
        TRIAL_EXPIRING = "trial_expiring", "Trial Expiring"
        NEW_SIGNUP = "new_signup", "New Signup"
        SEAT_LIMIT = "seat_limit", "Seat Limit"
        MILESTONE = "milestone", "Milestone"
        SYSTEM = "system", "System"

    class Severity(models.TextChoices):
        INFO = "info", "Info"
        WARNING = "warning", "Warning"
        ERROR = "error", "Error"
        SUCCESS = "success", "Success"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications", null=True, blank=True
    )
    type = models.CharField(max_length=30, choices=Type.choices)
    severity = models.CharField(max_length=10, choices=Severity.choices, default=Severity.INFO)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    action_url = models.CharField(max_length=500, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
