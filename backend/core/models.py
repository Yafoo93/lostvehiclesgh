from django.conf import settings
from django.db import models


class ActivityLog(models.Model):
    """
    Generic audit trail for key actions in the system.
    Example: case status changes, vehicle updates, document uploads, etc.
    """

    class ActionType(models.TextChoices):
        LOGIN = "LOGIN", "User Login"
        LOGOUT = "LOGOUT", "User Logout"
        CREATE_VEHICLE = "CREATE_VEHICLE", "Create Vehicle"
        UPDATE_VEHICLE = "UPDATE_VEHICLE", "Update Vehicle"
        DELETE_VEHICLE = "DELETE_VEHICLE", "Delete Vehicle"
        CREATE_CASE = "CREATE_CASE", "Create Case"
        UPDATE_CASE = "UPDATE_CASE", "Update Case"
        CHANGE_CASE_STATUS = "CHANGE_CASE_STATUS", "Change Case Status"
        UPLOAD_DOCUMENT = "UPLOAD_DOCUMENT", "Upload Document"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activity_logs",
        help_text="User who performed the action (if known).",
    )

    action = models.CharField(
        max_length=64,
        choices=ActionType.choices,
        help_text="High-level type of action.",
    )

    description = models.TextField(
        blank=True,
        help_text="Human-readable description of what happened.",
    )

    # Generic target object info (no FK to avoid circular imports)
    target_app_label = models.CharField(
        max_length=100,
        blank=True,
        help_text="Django app label of the target object.",
    )
    target_model = models.CharField(
        max_length=100,
        blank=True,
        help_text="Model name of the target object.",
    )
    target_object_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="Primary key of the target object as string.",
    )

    # Request context (optional)
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address of the client (if available).",
    )
    user_agent = models.CharField(
        max_length=255,
        blank=True,
        help_text="User agent string (if available).",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Activity Log"
        verbose_name_plural = "Activity Logs"

    def __str__(self) -> str:
        user_str = self.user.username if self.user else "System"
        return f"[{self.action}] by {user_str} at {self.created_at:%Y-%m-%d %H:%M:%S}"
