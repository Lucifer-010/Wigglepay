import uuid
from django.db import models
from apps.merchants.models import Merchant

class TelegramProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(
        Merchant,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='telegram_profiles'
    )
    telegram_user_id = models.BigIntegerField(unique=True, db_index=True)
    telegram_chat_id = models.BigIntegerField()
    username = models.CharField(max_length=255, blank=True, null=True)
    first_name = models.CharField(max_length=255, blank=True)
    last_name = models.CharField(max_length=255, blank=True)
    
    # Stores interactive state (e.g. pending confirmation draft invoice)
    conversational_state = models.JSONField(default=dict, blank=True)
    is_authorized = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        user_label = f"@{self.username}" if self.username else f"User {self.telegram_user_id}"
        merchant_label = self.merchant.business_name if self.merchant else "Unlinked"
        return f"{user_label} -> {merchant_label}"

