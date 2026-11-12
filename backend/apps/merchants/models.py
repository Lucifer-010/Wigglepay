import uuid
from decimal import Decimal
from django.db import models
from django.contrib.auth import get_user_model
from apps.core.crypto_utils import generate_api_keys

User = get_user_model()

class Merchant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='merchant_profile', null=True, blank=True)
    business_name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    stellar_public_key = models.CharField(max_length=56, help_text="Base Stellar destination account (G...)")
    stellar_secret_key = models.CharField(max_length=56, blank=True, null=True, help_text="Optional non-custodial or custodial secret key")
    
    # API Integration Keys
    api_public_key = models.CharField(max_length=64, unique=True, db_index=True)
    api_secret_key = models.CharField(max_length=64, db_index=True)
    
    # Webhook Notifications
    webhook_url = models.URLField(blank=True, null=True, help_text="HTTP endpoint for payment dispatch notifications")
    webhook_secret = models.CharField(max_length=64, blank=True, help_text="HMAC secret for signing outbound webhook deliveries")
    
    # Financial Configuration
    commission_rate = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal('0.0050'), help_text="Platform fee percentage (e.g. 0.005 = 0.5%)")
    fee_recipient_address = models.CharField(max_length=56, blank=True, null=True, help_text="Destination address for platform fee splits")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.api_public_key or not self.api_secret_key:
            pub, sec = generate_api_keys()
            self.api_public_key = pub
            self.api_secret_key = sec
        if not self.webhook_secret:
            _, sec = generate_api_keys()
            self.webhook_secret = f"wp_whsec_{sec[9:]}"
        super().save(*args, **kwargs)

    def rotate_keys(self):
        pub, sec = generate_api_keys()
        self.api_public_key = pub
        self.api_secret_key = sec
        self.save(update_fields=['api_public_key', 'api_secret_key', 'updated_at'])
        return pub, sec

    def __str__(self):
        return f"{self.business_name} ({self.stellar_public_key[:8]}...)"

