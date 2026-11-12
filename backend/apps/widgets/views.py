from django.http import HttpResponse
from rest_framework import viewsets, permissions
from drf_spectacular.utils import extend_schema
from .models import WidgetConfig, StreamOverlay
from .serializers import WidgetConfigSerializer, StreamOverlaySerializer

@extend_schema(tags=['Widgets'])
class WidgetConfigViewSet(viewsets.ModelViewSet):
    """Manage embedded payment modal and button configurations."""
    queryset = WidgetConfig.objects.select_related('merchant').all()
    serializer_class = WidgetConfigSerializer
    permission_classes = [permissions.AllowAny]

@extend_schema(tags=['Widgets'])
class StreamOverlayViewSet(viewsets.ModelViewSet):
    """Manage real-time OBS live stream overlays and token endpoints."""
    queryset = StreamOverlay.objects.select_related('merchant').all()
    serializer_class = StreamOverlaySerializer
    permission_classes = [permissions.AllowAny]

def serve_widget_js(request):
    """
    Serves the standalone lightweight embeddable checkout script (widget.js)
    which builds a Shadow DOM modal and communicates directly with WigglePay API.
    """
    js_content = """/**
 * WigglePay Embedded Checkout Widget SDK
 * (c) WigglePay Protocol - High Performance Stellar Settlements
 */
(function() {
  'use strict';
  const currentScript = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  const API_KEY = currentScript.getAttribute('data-wiggle-key') || '';
  const DEFAULT_AMOUNT = currentScript.getAttribute('data-amount') || '10';
  const DEFAULT_ASSET = currentScript.getAttribute('data-asset') || 'USDC';
  const BASE_URL = window.location.origin;

  window.WigglePay = {
    openCheckout: function(options) {
      options = options || {};
      const amount = options.amount || DEFAULT_AMOUNT;
      const asset = options.asset || DEFAULT_ASSET;
      const customer = options.customer || '@donor';

      const overlay = document.createElement('div');
      overlay.id = 'wigglepay-modal-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.backgroundColor = 'rgba(10, 15, 29, 0.85)';
      overlay.style.backdropFilter = 'blur(8px)';
      overlay.style.zIndex = '999999';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';

      const iframe = document.createElement('iframe');
      iframe.src = BASE_URL + '/?embedded=true&amount=' + encodeURIComponent(amount) + '&asset=' + encodeURIComponent(asset) + '&apiKey=' + encodeURIComponent(API_KEY);
      iframe.style.width = '420px';
      iframe.style.maxWidth = '92vw';
      iframe.style.height = '620px';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '24px';
      iframe.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';

      overlay.appendChild(iframe);
      overlay.onclick = function(e) {
        if (e.target === overlay) {
          document.body.removeChild(overlay);
        }
      };
      document.body.appendChild(overlay);
    }
  };

  // Auto-bind click to any button with data-wiggle-checkout
  document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('[data-wiggle-checkout]');
    buttons.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        window.WigglePay.openCheckout();
      });
    });
  });
})();
"""
    return HttpResponse(js_content, content_type='application/javascript')

