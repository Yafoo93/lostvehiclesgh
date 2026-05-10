from celery import shared_task

from core.notifications import send_email_notification


@shared_task
def send_email_task(subject: str, message: str, recipient_list: list[str]) -> int:
    """
    Async email task wrapper.
    """
    return send_email_notification(
        subject=subject,
        message=message,
        recipient_list=recipient_list,
    )