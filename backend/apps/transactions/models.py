import uuid
from decimal import Decimal
from django.db import models
from apps.invoices.models import Invoice

class TransactionRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions'
    )
    # Replay Protection: Transaction hash must be globally unique
    tx_hash = models.CharField(max_length=64, unique=True, db_index=True, help_text="Stellar transaction hash (HEX 64)")
    ledger_index = models.BigIntegerField(db_index=True, help_text="Stellar ledger sequence number")
    
    sender_address = models.CharField(max_length=56, help_text="Stellar payer account (G...)")
    destination_address = models.CharField(max_length=56, help_text="Merchant destination account (G...)")
    
    asset_code = models.CharField(max_length=12, default='USDC')
    asset_issuer = models.CharField(max_length=56, blank=True, null=True)
    
    amount = models.DecimalField(max_digits=18, decimal_places=7)
    fee_paid = models.DecimalField(max_digits=18, decimal_places=7, default=Decimal('0.00001'))
    
    memo = models.CharField(max_length=64, blank=True, null=True)
    routing_path = models.JSONField(default=list, blank=True, help_text="Path payment hops if executed on SDEX")
    soroban_contract_call = models.BooleanField(default=False, help_text="Whether settled via Soroban split contract")
    
    status = models.CharField(max_length=20, default='SUCCESS')
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    raw_payload = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['tx_hash']),
            models.Index(fields=['ledger_index']),
        ]

    def __str__(self):
        return f"Tx {self.tx_hash[:10]}... | {self.amount} {self.asset_code} | Ledger {self.ledger_index}"

