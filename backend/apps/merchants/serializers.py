from rest_framework import serializers
from .models import Merchant

class MerchantSerializer(serializers.ModelSerializer):
    api_secret_key = serializers.CharField(read_only=True)

    class Meta:
        model = Merchant
        fields = [
            'id',
            'business_name',
            'slug',
            'stellar_public_key',
            'api_public_key',
            'api_secret_key',
            'webhook_url',
            'webhook_secret',
            'commission_rate',
            'fee_recipient_address',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'api_public_key', 'api_secret_key', 'webhook_secret', 'created_at', 'updated_at']

class MerchantStatsSerializer(serializers.Serializer):
    total_invoices = serializers.IntegerField()
    settled_invoices = serializers.IntegerField()
    active_invoices = serializers.IntegerField()
    expired_invoices = serializers.IntegerField()
    settled_rate_percentage = serializers.FloatField()
    usdc_volume = serializers.DecimalField(max_digits=18, decimal_places=4)
    xlm_volume = serializers.DecimalField(max_digits=18, decimal_places=4)
    recent_transactions_count = serializers.IntegerField()

