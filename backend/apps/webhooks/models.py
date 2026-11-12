import uuid
from django.db import models
from apps.merchants.models import Merchant
from apps.invoices.models import Invoice

class WebhookDelivery(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='webhook_deliveries')
    invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, null=True, blank=True, related_name='webhook_logs')
    
    event_type = models.CharField(max_length=64, default='invoice.settled')
    target_url = models.URLField()
    payload = models.JSONField()
    signature = models.CharField(max_length=64, help_text="HMAC-SHA256 signature")
    
    status = models.CharField(
        max_length=20,
        choices=[('PENDING', 'Pending'), ('SUCCESS', 'Success'), ('FAILED', 'Failed')],
        default='PENDING',
        db_index=True
    )
    attempts = models.IntegerField(default=0)
    response_status_code = models.IntegerField(null=True, blank=True)
    response_body = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    last_attempt_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event_type} -> {self.target_url} [{self.status} / {self.response_status_code}]"

