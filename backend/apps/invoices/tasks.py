from celery import shared_task
from django.utils import timezone
from .models import Invoice, InvoiceStatus

@shared_task(queue='stellar_queue')
def check_expired_invoices():
    """
    Celery Beat task: Scans pending invoices past their expiration timestamp
    and transitions them to EXPIRED.
    """
    now = timezone.now()
    expired_count = Invoice.objects.filter(
        status=InvoiceStatus.PENDING,
        expires_at__lt=now
    ).update(status=InvoiceStatus.EXPIRED, updated_at=now)
    
    return f"Marked {expired_count} invoices as EXPIRED."

