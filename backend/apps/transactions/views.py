from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, permissions, filters
from drf_spectacular.utils import extend_schema
from .models import TransactionRecord
from .serializers import TransactionRecordSerializer

@extend_schema(tags=['Transactions'])
class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Query immutable Stellar ledger transaction proofs with replay protection.
    """
    queryset = TransactionRecord.objects.select_related('invoice').all()
    serializer_class = TransactionRecordSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'asset_code', 'invoice']
    search_fields = ['tx_hash', 'sender_address', 'destination_address', 'memo']
    ordering_fields = ['timestamp', 'amount', 'ledger_index']
    ordering = ['-timestamp']

