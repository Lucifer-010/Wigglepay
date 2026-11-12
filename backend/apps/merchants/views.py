from decimal import Decimal
from django.db.models import Sum, Count, Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse
from .models import Merchant
from .serializers import MerchantSerializer, MerchantStatsSerializer

@extend_schema(tags=['Merchants'])
class MerchantViewSet(viewsets.ModelViewSet):
    """
    Manage Merchant profiles, API credentials, and financial metrics.
    """
    queryset = Merchant.objects.all()
    serializer_class = MerchantSerializer
    permission_classes = [permissions.AllowAny] # In production: IsAuthenticated or API key

    @extend_schema(
        summary="Rotate merchant API keys",
        description="Generates a new public and secret API key pair, instantly invalidating the previous keys."
    )
    @action(detail=True, methods=['post'], url_path='rotate-keys')
    def rotate_keys(self, request, pk=None):
        merchant = self.get_object()
        pub, sec = merchant.rotate_keys()
        return Response({
            'message': 'API keys successfully rotated.',
            'api_public_key': pub,
            'api_secret_key': sec,
        })

    @extend_schema(
        summary="Get merchant aggregated financial metrics",
        responses={200: MerchantStatsSerializer}
    )
    @action(detail=True, methods=['get'], url_path='stats')
    def stats(self, request, pk=None):
        merchant = self.get_object()
        invoices = merchant.invoices.all()

        total = invoices.count()
        settled = invoices.filter(status='SETTLED').count()
        active = invoices.filter(status='PENDING').count()
        expired = invoices.filter(status='EXPIRED').count()

        usdc_vol = invoices.filter(status='SETTLED', asset_code='USDC').aggregate(s=Sum('settled_amount'))['s'] or Decimal('0')
        xlm_vol = invoices.filter(status='SETTLED', asset_code='XLM').aggregate(s=Sum('settled_amount'))['s'] or Decimal('0')

        settled_rate = (settled / total * 100.0) if total > 0 else 0.0

        data = {
            'total_invoices': total,
            'settled_invoices': settled,
            'active_invoices': active,
            'expired_invoices': expired,
            'settled_rate_percentage': round(settled_rate, 2),
            'usdc_volume': usdc_vol,
            'xlm_volume': xlm_vol,
            'recent_transactions_count': merchant.invoices.filter(status='SETTLED').count(),
        }
        return Response(MerchantStatsSerializer(data).data)

