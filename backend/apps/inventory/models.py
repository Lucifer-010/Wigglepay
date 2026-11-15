import uuid
from decimal import Decimal
from django.db import models
from django.utils.text import slugify
from apps.merchants.models import Merchant

class Category(models.Model):
    """
    Inventory Category / Shelf for organizing products.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=120, help_text="Shelf or Category name, e.g. 'Digital Goods', 'Merchandise'")
    slug = models.SlugField(max_length=140, blank=True)
    description = models.TextField(blank=True, help_text="Optional shelf description")
    icon = models.CharField(max_length=60, default='box', help_text="Lucide icon identifier or category badge")
    color = models.CharField(max_length=32, default='#007AFF', help_text="Hex color accent for UI badges")
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'name']
        verbose_name = 'Inventory Category / Shelf'
        verbose_name_plural = 'Inventory Categories / Shelves'
        unique_together = ('merchant', 'slug')

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name) or 'category'
            slug = base_slug
            counter = 1
            while Category.objects.filter(merchant=self.merchant, slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.merchant.business_name})"

    @property
    def product_count(self) -> int:
        return self.products.filter(is_active=True).count()


class Product(models.Model):
    """
    Inventory Product item available for selection in payable invoices and checkouts.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
        help_text="Assigned category / shelf"
    )
    title = models.CharField(max_length=255, help_text="Product or item title")
    sku = models.CharField(max_length=64, blank=True, help_text="Stock keeping unit or item code")
    description = models.TextField(blank=True, help_text="Detailed product description")
    price = models.DecimalField(max_digits=18, decimal_places=4, default=Decimal('0.0000'))
    currency = models.CharField(max_length=12, default='USDC', help_text="Settlement asset code (USDC, XLM)")
    
    # Stock & Inventory tracking
    stock_quantity = models.IntegerField(default=100, help_text="Available inventory units")
    track_stock = models.BooleanField(default=True, help_text="Whether to enforce and decrement stock on payment")
    image_url = models.URLField(blank=True, null=True, help_text="Product image preview URL")
    badge = models.CharField(max_length=32, blank=True, help_text="Visual badge (e.g., 'Popular', 'Limited', 'Sale')")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['merchant', 'is_active']),
            models.Index(fields=['category', 'is_active']),
        ]

    def __str__(self):
        return f"{self.title} - {self.price} {self.currency}"

    @property
    def is_in_stock(self) -> bool:
        if not self.track_stock:
            return True
        return self.stock_quantity > 0

