from django.conf import settings
from django.core.mail import send_mail


def send_email_notification(*, subject: str, message: str, recipient_list: list[str]) -> int:
    """
    Central email notification helper.

    For development, this uses Django's configured EMAIL_BACKEND.
    Later, we can move this into Celery without changing calling code.
    """
    if not recipient_list:
        return 0

    return send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipient_list,
        fail_silently=False,
    )