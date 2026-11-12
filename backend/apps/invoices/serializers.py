from decimal import Decimal
from rest_framework import serializers
from .models import Invoice, InvoiceStatus
from apps.merchants.models import Merchant

class InvoiceSerializer(serializers.ModelSerializer):
    merchant_name = serializers.CharField(source='merchant.business_name', read_only=True)
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
            'status', 'settled_at', 'created_at', 'updated_at'
        ]

    def get_checkout_url(self, obj) -> str:
        request = self.context.get('request')
        base = request.build_absolute_uri('/')[:-1] if request else 'http://localhost:3000'
        return f"{base}/?invoiceId={obj.id}"

    def get_deep_link(self, obj) -> str:
        # Standard Stellar SEP-0007 URI
        asset_clause = f"&asset_code={obj.asset_code}" if obj.asset_code != 'XLM' else ""
        issuer_clause = f"&asset_issuer={obj.asset_issuer}" if obj.asset_issuer else ""
        return f"web+stellar:pay?destination={obj.destination_address}&amount={obj.expected_amount}&memo={obj.memo_value}&memo_type=id{asset_clause}{issuer_clause}"

    def get_qr_svg_url(self, obj) -> str:
        request = self.context.get('request')
        base = request.build_absolute_uri('/')[:-1] if request else 'http://localhost:8000'
        return f"{base}/api/v1/invoices/{obj.id}/qr/"

class InvoiceCreateSerializer(serializers.ModelSerializer):
    expiry_hours = serializers.IntegerField(default=24, write_only=True, required=False)

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
            'metadata',
        ]

    def create(self, validated_data):
        from django.utils import timezone
        from datetime import timedelta
        expiry_hours = validated_data.pop('expiry_hours', 24)
        validated_data['expires_at'] = timezone.now() + timedelta(hours=expiry_hours)
        return super().create(validated_data)

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

