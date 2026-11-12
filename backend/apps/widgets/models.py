import uuid
import secrets
from decimal import Decimal
from django.db import models
from apps.merchants.models import Merchant

class WidgetLayout(models.TextChoices):
    MODAL = 'modal', 'Modal Dialog'
    INLINE = 'inline', 'Inline Container'
    BUTTON_ONLY = 'button', 'Button Only'

class WidgetTheme(models.TextChoices):
    DARK = 'dark', 'Dark'
    LIGHT = 'light', 'Light'
    SYSTEM = 'system', 'System Default'

class WidgetConfig(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='widgets')
    name = models.CharField(max_length=255, default='Default Checkout Widget')
    layout = models.CharField(max_length=20, choices=WidgetLayout.choices, default=WidgetLayout.MODAL)
    
    default_asset = models.CharField(max_length=12, default='USDC')
    preset_amounts = models.JSONField(default=list, blank=True, help_text="e.g. [5, 10, 25, 50, 100]")
    allow_custom_amount = models.BooleanField(default=True)
    collect_donor_name = models.BooleanField(default=True)
    collect_message = models.BooleanField(default=True)
    
    theme = models.CharField(max_length=20, choices=WidgetTheme.choices, default=WidgetTheme.SYSTEM)
    accent_color = models.CharField(max_length=32, default='#06B6D4')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.preset_amounts:
            self.preset_amounts = [5, 15, 25, 50, 100]
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.merchant.business_name})"

class StreamOverlay(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='overlays')
    name = models.CharField(max_length=255, default='OBS Live Overlay')
    overlay_token = models.CharField(max_length=64, unique=True, db_index=True)
    
    min_tip_threshold = models.DecimalField(max_digits=18, decimal_places=4, default=Decimal('1.00'))
    sound_enabled = models.BooleanField(default=True)
    sound_url = models.CharField(max_length=512, blank=True, default='https://assets.wigglepay.io/sounds/chime.mp3')
    tts_enabled = models.BooleanField(default=True)
    animation_style = models.CharField(max_length=32, default='bounce')
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.overlay_token:
            self.overlay_token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Overlay {self.name} - token:{self.overlay_token[:8]}..."

