from typing import Optional

from django.db import models

from .models import ActivityLog


def log_activity(
    *,
    user,
    action: str,
    description: str = "",
    target: Optional[models.Model] = None,
    request=None,
) -> ActivityLog:
    """
    Convenience helper to record an ActivityLog.

    - user: request.user or None
    - action: one of ActivityLog.ActionType values (string)
    - description: human-readable summary
    - target: any model instance (Case, Vehicle, Document, etc.)
    - request: optional, to capture IP and user agent
    """
    target_app_label = ""
    target_model = ""
    target_object_id = ""

    if target is not None:
        meta = target._meta
        target_app_label = meta.app_label
        target_model = meta.model_name
        target_object_id = str(getattr(target, "pk", ""))

    ip_address = None
    user_agent = ""

    if request is not None:
        # Basic IP capture (behind proxies you might want HTTP_X_FORWARDED_FOR)
        ip_address = request.META.get("REMOTE_ADDR")
        user_agent = request.META.get("HTTP_USER_AGENT", "")[:255]

    log = ActivityLog.objects.create(
        user=user if getattr(user, "is_authenticated", False) else None,
        action=action,
        description=description,
        target_app_label=target_app_label,
        target_model=target_model,
        target_object_id=target_object_id,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    return log
