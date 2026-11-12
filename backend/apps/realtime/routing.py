from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/invoices/(?P<invoice_id>[0-9a-f-]+)/$', consumers.InvoiceConsumer.as_asgi()),
    re_path(r'^ws/overlays/(?P<overlay_token>[a-zA-Z0-9_-]+)/$', consumers.OverlayConsumer.as_asgi()),
    re_path(r'^ws/merchants/(?P<merchant_id>[0-9a-f-]+)/$', consumers.MerchantConsumer.as_asgi()),
]

