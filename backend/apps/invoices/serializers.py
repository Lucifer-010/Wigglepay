from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from rest_framework import serializers
from .models import Invoice, InvoiceItem, InvoiceStatus
from apps.merchants.models import Merchant
from apps.inventory.models import Product

class InvoiceItemSerializer(serializers.ModelSerializer):
    product_id = serializers.UUIDField(source='product.id', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_image_url = serializers.CharField(source='product.image_url', read_only=True)

    class Meta:
        model = InvoiceItem
        fields = [
            'id',
            'product',
            'product_id',
            'product_sku',
            'product_image_url',
            'title',
            'quantity',
            'unit_price',
            'total_price',
            'metadata',
            'created_at',
        ]
        read_only_fields = ['id', 'total_price', 'created_at']


class InvoiceItemInputSerializer(serializers.Serializer):
    """
    Input schema for attaching an inventory product or custom item to an invoice.
    """
    product_id = serializers.UUIDField(required=False, allow_null=True)
    title = serializers.CharField(required=False, max_length=255)
    quantity = serializers.IntegerField(default=1, min_value=1)
    unit_price = serializers.DecimalField(required=False, max_digits=18, decimal_places=4)
    metadata = serializers.DictField(required=False, default=dict)


class InvoiceSerializer(serializers.ModelSerializer):
    merchant_name = serializers.CharField(source='merchant.business_name', read_only=True)
    items = InvoiceItemSerializer(many=True, read_only=True)
    items_count = serializers.IntegerField(source='total_items_count', read_only=True)
    checkout_url = serializers.SerializerMethodField()
    deep_link = serializers.SerializerMethodField()
    qr_svg_url = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            'id',
            'merchant',
            'merchant_name',
            'title',
            'description',
            'customer_ref',
            'asset_code',
            'asset_issuer',
            'expected_amount',
            'settled_amount',
            'memo_type',
            'memo_value',
            'multiplexed_address',
            'destination_address',
            'status',
            'expires_at',
            'settled_at',
            'items',
            'items_count',
            'metadata',
            'checkout_url',
            'deep_link',
            'qr_svg_url',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 'settled_amount', 'memo_type', 'memo_value',
            'multiplexed_address', 'destination_address',
            'status', 'settled_at', 'items', 'items_count',
            'created_at', 'updated_at'
        ]

    def get_checkout_url(self, obj) -> str:
        request = self.context.get('request')
        base = request.build_absolute_uri('/')[:-1] if request else 'http://localhost:3000'
        return f"{base}/?invoiceId={obj.id}"

    def get_deep_link(self, obj) -> str:
        asset_clause = f"&asset_code={obj.asset_code}" if obj.asset_code != 'XLM' else ""
        issuer_clause = f"&asset_issuer={obj.asset_issuer}" if obj.asset_issuer else ""
        return f"web+stellar:pay?destination={obj.destination_address}&amount={obj.expected_amount}&memo={obj.memo_value}&memo_type=id{asset_clause}{issuer_clause}"

    def get_qr_svg_url(self, obj) -> str:
        request = self.context.get('request')
        base = request.build_absolute_uri('/')[:-1] if request else 'http://localhost:8000'
        return f"{base}/api/v1/invoices/{obj.id}/qr/"


class InvoiceCreateSerializer(serializers.ModelSerializer):
    merchant = serializers.PrimaryKeyRelatedField(queryset=Merchant.objects.all(), required=False)
    expiry_hours = serializers.IntegerField(default=24, write_only=True, required=False)
    items = InvoiceItemInputSerializer(many=True, required=False, write_only=True)
    expected_amount = serializers.DecimalField(max_digits=18, decimal_places=7, required=False)

    class Meta:
        model = Invoice
        fields = [
            'merchant',
            'title',
            'description',
            'customer_ref',
            'asset_code',
            'expected_amount',
            'expiry_hours',
            'items',
            'metadata',
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        expiry_hours = validated_data.pop('expiry_hours', 24)
        validated_data['expires_at'] = timezone.now() + timedelta(hours=expiry_hours)

        # If merchant not provided, default to first active merchant
        if 'merchant' not in validated_data or not validated_data['merchant']:
            request = self.context.get('request')
            if request and hasattr(request, 'user') and hasattr(request.user, 'merchant_profile'):
                validated_data['merchant'] = request.user.merchant_profile
            else:
                validated_data['merchant'] = Merchant.objects.first()

        resolved_items = []
        total_items_amount = Decimal('0')

        # Process and resolve line items
        for item_dict in items_data:
            product = None
            product_id = item_dict.get('product_id')
            qty = item_dict.get('quantity', 1)

            if product_id:
                try:
                    product = Product.objects.get(id=product_id)
                except Product.DoesNotExist:
                    pass

            item_title = item_dict.get('title') or (product.title if product else 'Custom Item')
            unit_price = item_dict.get('unit_price')
            if unit_price is None:
                unit_price = product.price if product else Decimal('0.00')
            else:
                unit_price = Decimal(str(unit_price))

            line_total = Decimal(str(qty)) * unit_price
            total_items_amount += line_total

            resolved_items.append({
                'product': product,
                'title': item_title,
                'quantity': qty,
                'unit_price': unit_price,
                'total_price': line_total,
                'metadata': item_dict.get('metadata', {}),
            })

        # Calculate or override expected_amount
        if not validated_data.get('expected_amount') or validated_data['expected_amount'] <= 0:
            if total_items_amount > 0:
                validated_data['expected_amount'] = total_items_amount
            else:
                validated_data['expected_amount'] = Decimal('10.0000000')

        with transaction.atomic():
            invoice = Invoice.objects.create(**validated_data)
            for item in resolved_items:
                InvoiceItem.objects.create(
                    invoice=invoice,
                    product=item['product'],
                    title=item['title'],
                    quantity=item['quantity'],
                    unit_price=item['unit_price'],
                    total_price=item['total_price'],
                    metadata=item['metadata'],
                )

        return invoice

    def to_representation(self, instance):
        return InvoiceSerializer(instance, context=self.context).data


class PathPaymentQuoteSerializer(serializers.Serializer):
    destination_asset = serializers.CharField(default='USDC')
    destination_amount = serializers.DecimalField(max_digits=18, decimal_places=7)
    source_asset = serializers.CharField(default='XLM')
    source_amount = serializers.DecimalField(max_digits=18, decimal_places=7, read_only=True)
    quote_valid_seconds = serializers.IntegerField(default=60, read_only=True)
    path = serializers.ListField(read_only=True)
    note = serializers.CharField(read_only=True, required=False)


class SimulateSettleSerializer(serializers.Serializer):
    tx_hash = serializers.CharField(required=False, max_length=64)
    amount = serializers.DecimalField(required=False, max_digits=18, decimal_places=7)
    sender = serializers.CharField(required=False, max_length=56)
