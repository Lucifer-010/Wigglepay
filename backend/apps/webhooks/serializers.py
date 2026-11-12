from rest_framework import serializers
from .models import WebhookDelivery

class WebhookDeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookDelivery
        fields = [
            'id',
            'merchant',
            'invoice',
            'event_type',
            'target_url',
            'payload',
            'signature',
            'status',
            'attempts',
            'response_status_code',
            'response_body',
            'created_at',
            'last_attempt_at',
        ]
        read_only_fields = fields

