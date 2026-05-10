from django.conf import settings
from django.core.mail import send_mail


def send_email_notification(
    *,
    subject: str,
    message: str,
    recipient_list: list[str],
    async_send: bool = False,
) -> int:
    """
    Central email notification helper.

    If async_send=True, send through Celery.
    Otherwise send immediately using Django email backend.
    """
    if not recipient_list:
        return 0

    if async_send:
        from core.tasks import send_email_task

        send_email_task.delay(
            subject=subject,
            message=message,
            recipient_list=recipient_list,
        )
        return 1

    return send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipient_list,
        fail_silently=False,
    )