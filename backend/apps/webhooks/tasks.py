import json
import time
import httpx
from celery import shared_task
from django.utils import timezone
from .models import WebhookDelivery
from apps.invoices.models import Invoice
from apps.core.crypto_utils import sign_payload

@shared_task(bind=True, max_retries=5, default_retry_delay=10, queue='webhook_queue')
def dispatch_webhook_task(self, invoice_id: str, event_type: str, payload_data: dict):
    """
    Asynchronous Webhook Dispatcher Engine:
    Signs outbound payload with HMAC-SHA256 and executes delivery with exponential backoff.
    """
    try:
        invoice = Invoice.objects.select_related('merchant').get(id=invoice_id)
        merchant = invoice.merchant
    except Invoice.DoesNotExist:
        return f"Invoice {invoice_id} not found."

    target_url = merchant.webhook_url
    if not target_url:
        return f"No webhook_url configured for merchant {merchant.business_name}."

    payload_json = json.dumps(payload_data, sort_keys=True)
    signature = sign_payload(payload_json.encode('utf-8'), merchant.webhook_secret)
    timestamp = str(int(time.time()))

    delivery = WebhookDelivery.objects.create(
        merchant=merchant,
        invoice=invoice,
        event_type=event_type,
        target_url=target_url,
        payload=payload_data,
        signature=signature,
        status='PENDING',
        attempts=self.request.retries + 1,
        last_attempt_at=timezone.now()
    )

    headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'WigglePay-Webhook-Engine/1.0',
        'X-WigglePay-Signature': signature,
        'X-WigglePay-Timestamp': timestamp,
        'X-WigglePay-Event': event_type,
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(target_url, content=payload_json, headers=headers)
            delivery.response_status_code = response.status_code
            delivery.response_body = response.text[:2000]

            if response.status_code in [200, 201, 202, 204]:
                delivery.status = 'SUCCESS'
                delivery.save(update_fields=['status', 'response_status_code', 'response_body', 'attempts', 'last_attempt_at'])
                return f"Webhook successfully delivered to {target_url} (HTTP {response.status_code})"
            else:
                delivery.status = 'FAILED'
                delivery.save(update_fields=['status', 'response_status_code', 'response_body', 'attempts', 'last_attempt_at'])
                # Retry with exponential backoff
                retry_delay = 10 * (2 ** self.request.retries)
                raise self.retry(exc=Exception(f"Non-2xx HTTP code: {response.status_code}"), countdown=retry_delay)

    except Exception as exc:
        delivery.status = 'FAILED'
        delivery.response_body = str(exc)[:2000]
        delivery.save(update_fields=['status', 'response_body', 'attempts', 'last_attempt_at'])
        retry_delay = 10 * (2 ** self.request.retries)
        raise self.retry(exc=exc, countdown=retry_delay)

@shared_task(queue='webhook_queue')
def retry_failed_webhooks():
    """Celery Beat periodic task: Scans pending/failed webhooks and queues retries."""
    deliveries = WebhookDelivery.objects.filter(status='FAILED', attempts__lt=5)[:25]
    for d in deliveries:
        dispatch_webhook_task.delay(str(d.invoice_id), d.event_type, d.payload)
    return f"Queued {deliveries.count()} webhook retries."

