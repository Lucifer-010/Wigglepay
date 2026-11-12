import io
import secrets
from decimal import Decimal
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
import qrcode
import qrcode.image.svg

from .models import Invoice, InvoiceStatus
from .serializers import (
    InvoiceSerializer,
    InvoiceCreateSerializer,
    PathPaymentQuoteSerializer,
    SimulateSettleSerializer,
)
from apps.transactions.models import TransactionRecord
from apps.core.stellar_utils import get_path_payment_quote

@extend_schema(tags=['Invoices'])
class InvoiceViewSet(viewsets.ModelViewSet):
    """
    Complete lifecycle management for WigglePay invoices, deposit attribution,
    path payment quotes, and real-time checkout state.
    """
    queryset = Invoice.objects.select_related('merchant').all()
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'asset_code', 'merchant']
    search_fields = ['title', 'customer_ref', 'memo_value', 'multiplexed_address']
    ordering_fields = ['created_at', 'expected_amount', 'expires_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return InvoiceCreateSerializer
        return InvoiceSerializer

    @extend_schema(
        summary="Cancel an active invoice",
        responses={200: InvoiceSerializer}
    )
    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status == InvoiceStatus.SETTLED:
            return Response({'error': 'Cannot cancel a settled invoice.'}, status=status.HTTP_400_BAD_REQUEST)
        invoice.status = InvoiceStatus.CANCELLED
        invoice.save(update_fields=['status', 'updated_at'])
        return Response(InvoiceSerializer(invoice, context={'request': request}).data)

    @extend_schema(
        summary="Simulate payment settlement (Testing / Sandbox)",
        request=SimulateSettleSerializer,
        responses={200: InvoiceSerializer}
    )
    @action(detail=True, methods=['post'], url_path='simulate-settle')
    def simulate_settle(self, request, pk=None):
        invoice = self.get_object()
        serializer = SimulateSettleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        tx_hash = data.get('tx_hash') or secrets.token_hex(32)
        amount = data.get('amount') or invoice.expected_amount
        sender = data.get('sender') or 'GBSIMULATEDPAYER7777777777777777777777777777777777777777777'

        # Create Transaction Record for replay protection & ledger audit
        tx_record, _ = TransactionRecord.objects.get_or_create(
            tx_hash=tx_hash,
            defaults={
                'invoice': invoice,
                'ledger_index': 54000000 + secrets.randbelow(99999),
                'sender_address': sender,
                'destination_address': invoice.destination_address,
                'asset_code': invoice.asset_code,
                'amount': amount,
                'fee_paid': Decimal('0.00001'),
                'memo': invoice.memo_value,
                'status': 'SUCCESS',
            }
        )

        # Mark invoice settled & emit events
        invoice.mark_settled(settled_amount=amount, tx_hash=tx_hash, sender=sender)

        return Response(InvoiceSerializer(invoice, context={'request': request}).data)

    @extend_schema(
        summary="Generate SVG QR code for payment checkout",
        responses={200: OpenApiResponse(description="SVG Image stream")}
    )
    @action(detail=True, methods=['get'], url_path='qr')
    def qr_code(self, request, pk=None):
        invoice = self.get_object()
        # SEP-0007 URI or multiplexed address
        uri = f"web+stellar:pay?destination={invoice.destination_address}&amount={invoice.expected_amount}&memo={invoice.memo_value}&memo_type=id"
        
        factory = qrcode.image.svg.SvgPathImage
        img = qrcode.make(uri, image_factory=factory, box_size=12)
        stream = io.BytesIO()
        img.save(stream)
        svg_content = stream.getvalue()

        return HttpResponse(svg_content, content_type='image/svg+xml')

    @extend_schema(
        summary="Query SDEX Path Payment quote (e.g. paying XLM to settle USDC)",
        parameters=[
            OpenApiParameter(name='destination_asset', type=str, default='USDC'),
            OpenApiParameter(name='destination_amount', type=float, default=25.0),
            OpenApiParameter(name='source_asset', type=str, default='XLM'),
        ],
        responses={200: PathPaymentQuoteSerializer}
    )
    @action(detail=False, methods=['get'], url_path='quote')
    def quote(self, request):
        dest_asset = request.query_params.get('destination_asset', 'USDC').upper()
        amount_str = request.query_params.get('destination_amount', '10.0')
        source_asset = request.query_params.get('source_asset', 'XLM').upper()

        try:
            dest_amount = Decimal(amount_str)
        except Exception:
            return Response({'error': 'Invalid destination_amount'}, status=status.HTTP_400_BAD_REQUEST)

        quote_data = get_path_payment_quote(
            destination_asset_code=dest_asset,
            destination_amount=dest_amount,
            source_asset_code=source_asset
        )
        return Response(PathPaymentQuoteSerializer(quote_data).data)

