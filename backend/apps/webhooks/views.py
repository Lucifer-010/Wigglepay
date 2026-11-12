from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .models import WebhookDelivery
from .serializers import WebhookDeliverySerializer
from .tasks import dispatch_webhook_task
from apps.invoices.models import Invoice

@extend_schema(tags=['Webhooks'])
class WebhookDeliveryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Audit log of outbound HTTP webhook dispatches, HMAC signatures, and response payloads.
    """
    queryset = WebhookDelivery.objects.select_related('merchant', 'invoice').all()
    serializer_class = WebhookDeliverySerializer
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Trigger a test webhook dispatch for an invoice",
        description="Enqueues a test webhook to the merchant's configured endpoint."
    )
    @action(detail=False, methods=['post'], url_path='test-dispatch')
    def test_dispatch(self, request):
        invoice_id = request.data.get('invoice_id')
        invoice = Invoice.objects.filter(id=invoice_id).first() if invoice_id else Invoice.objects.first()
        if not invoice:
            return Response({'error': 'No invoice found to test webhook dispatch.'}, status=status.HTTP_400_BAD_REQUEST)

        test_payload = {
            'event': 'test.ping',
            'invoice_id': str(invoice.id),
            'amount': str(invoice.expected_amount),
            'asset': invoice.asset_code,
            'merchant': invoice.merchant.business_name,
            'message': 'WigglePay Webhook verification ping',
        }

        task = dispatch_webhook_task.delay(str(invoice.id), 'test.ping', test_payload)
        return Response({
            'message': 'Webhook test dispatch queued in Celery webhook_queue.',
            'task_id': task.id,
            'target_url': invoice.merchant.webhook_url or 'None configured',
        })

