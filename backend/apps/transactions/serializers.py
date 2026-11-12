from rest_framework import serializers
from .models import TransactionRecord

class TransactionRecordSerializer(serializers.ModelSerializer):
    stellar_expert_url = serializers.SerializerMethodField()

    class Meta:
        model = TransactionRecord
        fields = [
            'id',
            'invoice',
            'tx_hash',
            'ledger_index',
            'sender_address',
            'destination_address',
            'asset_code',
            'asset_issuer',
            'amount',
            'fee_paid',
            'memo',
            'routing_path',
            'soroban_contract_call',
            'status',
            'stellar_expert_url',
            'timestamp',
        ]
        read_only_fields = fields

    def get_stellar_expert_url(self, obj) -> str:
        from django.conf import settings
        net = 'testnet' if settings.STELLAR_NETWORK == 'TESTNET' else 'public'
        return f"https://stellar.expert/explorer/{net}/tx/{obj.tx_hash}"

