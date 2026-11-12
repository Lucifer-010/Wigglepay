from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from apps.merchants.views import MerchantViewSet
from apps.invoices.views import InvoiceViewSet
from apps.transactions.views import TransactionViewSet
from apps.widgets.views import WidgetConfigViewSet, StreamOverlayViewSet, serve_widget_js
from apps.telegram_bot.views import TelegramWebhookView
from apps.webhooks.views import WebhookDeliveryViewSet
from apps.stellar_engine.services.soroban_bridge import SorobanEscrowBridge

router = DefaultRouter()
router.register(r'merchants', MerchantViewSet, basename='merchant')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'widgets', WidgetConfigViewSet, basename='widget')
router.register(r'overlays', StreamOverlayViewSet, basename='overlay')
router.register(r'webhooks', WebhookDeliveryViewSet, basename='webhook')

def health_check(request):
    """System health check endpoint verifying DB, Stellar Horizon and Soroban."""
    bridge = SorobanEscrowBridge()
    return JsonResponse({
        'status': 'HEALTHY',
        'gateway': 'WigglePay Gateway',
        'version': '1.0.0',
        'soroban_bridge': bridge.get_contract_status(),
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Standalone Embed Script
    path('widget.js', serve_widget_js, name='widget-script-root'),
    path('api/v1/widget.js', serve_widget_js, name='widget-script-v1'),

    # REST API v1
    path('api/v1/', include(router.urls)),
    path('api/v1/telegram/webhook/', TelegramWebhookView.as_view(), name='telegram-webhook'),
    path('api/v1/health/', health_check, name='health-check'),

    # OpenAPI 3.0 Documentation: Swagger UI & ReDoc
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

