import uuid
from decimal import Decimal
from datetime import timedelta
from django.db import models
from django.utils import timezone
from django.conf import settings
from apps.merchants.models import Merchant
from apps.core.stellar_utils import (
    generate_memo_id_64,
    create_multiplexed_address,
)

class InvoiceStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    PENDING = 'PENDING', 'Pending Payment'
    SETTLED = 'SETTLED', 'Settled'
    PARTIALLY_PAID = 'PARTIALLY_PAID', 'Partially Paid'
    EXPIRED = 'EXPIRED', 'Expired'
    CANCELLED = 'CANCELLED', 'Cancelled'

class AssetType(models.TextChoices):
    USDC = 'USDC', 'USD Coin'
    XLM = 'XLM', 'Stellar Lumens'
    CUSTOM = 'CUSTOM', 'Custom Token'

class Invoice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='invoices')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    customer_ref = models.CharField(max_length=255, blank=True, null=True, help_text="e.g. @alex, donor handle, or email")
    
    asset_code = models.CharField(max_length=12, default='USDC')
    asset_issuer = models.CharField(max_length=56, blank=True, null=True)
    
    expected_amount = models.DecimalField(max_digits=18, decimal_places=7)
    settled_amount = models.DecimalField(max_digits=18, decimal_places=7, default=Decimal('0'))
    
    # Stellar Deposit Attribution: M-address + 64-bit Memo ID
    memo_type = models.CharField(max_length=10, default='id')
    memo_value = models.CharField(max_length=64, db_index=True)
    multiplexed_address = models.CharField(max_length=70, blank=True, db_index=True)
    destination_address = models.CharField(max_length=56)
    
    status = models.CharField(
        max_length=20,
        choices=InvoiceStatus.choices,
        default=InvoiceStatus.PENDING,
        db_index=True
    )
    
    expires_at = models.DateTimeField(db_index=True)
    settled_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'expires_at']),
            models.Index(fields=['memo_value']),
            models.Index(fields=['multiplexed_address']),
        ]

    def save(self, *args, **kwargs):
        if not self.destination_address:
            self.destination_address = self.merchant.stellar_public_key
            
        if not self.memo_value:
            memo_int = generate_memo_id_64()
            self.memo_value = str(memo_int)
        else:
            try:
                memo_int = int(self.memo_value)
            except ValueError:
                memo_int = generate_memo_id_64()
                self.memo_value = str(memo_int)

        if not self.multiplexed_address and self.destination_address:
            self.multiplexed_address = create_multiplexed_address(self.destination_address, memo_int)

        if not self.expires_at:
            # Default validity window: 24 hours
            self.expires_at = timezone.now() + timedelta(hours=24)

        if not self.asset_issuer and self.asset_code == 'USDC':
            self.asset_issuer = (
                settings.STELLAR_USDC_ISSUER_TESTNET
                if settings.STELLAR_NETWORK == 'TESTNET'
                else settings.STELLAR_USDC_ISSUER_PUBLIC
            )

        super().save(*args, **kwargs)

    @property
    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at and self.status == InvoiceStatus.PENDING

    @property
    def total_items_count(self) -> int:
        return sum(item.quantity for item in self.items.all())

    def mark_settled(self, settled_amount: Decimal, tx_hash: str, sender: str = ''):
        """Transition invoice to SETTLED and trigger real-time dispatches."""
        self.status = InvoiceStatus.SETTLED
        self.settled_amount = settled_amount
        self.settled_at = timezone.now()
        self.save(update_fields=['status', 'settled_amount', 'settled_at', 'updated_at'])

        # Automatically decrement inventory stock for tracked products
        for item in self.items.select_related('product').all():
            if item.product and item.product.track_stock:
                item.product.stock_quantity = max(0, item.product.stock_quantity - item.quantity)
                item.product.save(update_fields=['stock_quantity', 'updated_at'])

        # Broadcast via WebSockets & trigger Celery tasks
        try:
            from apps.realtime.broadcaster import broadcast_invoice_settled
            broadcast_invoice_settled(self, tx_hash, sender)
        except Exception:
            pass

        try:
            from apps.webhooks.tasks import dispatch_webhook_task
            dispatch_webhook_task.delay(str(self.id), 'invoice.settled', {
                'invoice_id': str(self.id),
                'status': 'SETTLED',
                'amount': str(self.settled_amount),
                'asset': self.asset_code,
                'customer_ref': self.customer_ref,
                'tx_hash': tx_hash,
                'sender': sender,
                'settled_at': self.settled_at.isoformat(),
            })
        except Exception:
            pass

    def __str__(self):
        return f"Invoice {self.id} - {self.expected_amount} {self.asset_code} [{self.status}]"


class InvoiceItem(models.Model):
    """
    Individual line item in a payable invoice, referencing an inventory product or custom item.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(
        'inventory.Product',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoice_items'
    )
    title = models.CharField(max_length=255, help_text="Product or item title at time of invoicing")
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=18, decimal_places=4)
    total_price = models.DecimalField(max_digits=18, decimal_places=4)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def save(self, *args, **kwargs):
        if not self.total_price:
            self.total_price = Decimal(str(self.quantity)) * Decimal(str(self.unit_price))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.title} ({self.total_price})"
