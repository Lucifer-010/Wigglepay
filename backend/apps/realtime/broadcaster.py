import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from apps.widgets.models import StreamOverlay

logger = logging.getLogger(__name__)

def broadcast_invoice_settled(invoice, tx_hash: str, sender: str = ''):
    """
    Broadcast settlement event to:
    1. React Checkout Modal (/ws/invoices/<id>/)
    2. OBS Live Stream Overlays of this merchant (/ws/overlays/<token>/)
    3. Merchant Dashboard (/ws/merchants/<id>/)
    """
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    # 1. Update Checkout Modal
    invoice_payload = {
        'type': 'invoice_update',
        'data': {
            'event': 'INVOICE_SETTLED',
            'invoice_id': str(invoice.id),
            'status': 'SETTLED',
            'amount': str(invoice.settled_amount),
            'asset': invoice.asset_code,
            'tx_hash': tx_hash,
            'sender': sender,
            'customer_ref': invoice.customer_ref,
        }
    }
    try:
        async_to_sync(channel_layer.group_send)(f"invoice_{invoice.id}", invoice_payload)
    except Exception as e:
        logger.error(f"Error broadcasting invoice update: {e}")

    # 2. Trigger OBS Stream Overlays
    overlays = StreamOverlay.objects.filter(merchant=invoice.merchant, is_active=True)
    donor_name = invoice.customer_ref or "Anonymous Donor"
    message = invoice.metadata.get('donor_message') or invoice.description or "Support tip"

    alert_payload = {
        'type': 'stream_alert',
        'alert': {
            'event': 'NEW_STREAM_TIP',
            'id': f"al-{tx_hash[:8]}",
            'donorName': donor_name.replace('@', ''),
            'donorHandle': donor_name,
            'amount': float(invoice.settled_amount),
            'asset': invoice.asset_code,
            'message': message,
            'tx_hash': tx_hash,
            'timestamp': 'Just now',
            'sound_enabled': True,
            'tts_enabled': True,
        }
    }

    for overlay in overlays:
        if invoice.settled_amount >= overlay.min_tip_threshold:
            try:
                async_to_sync(channel_layer.group_send)(f"overlay_{overlay.overlay_token}", alert_payload)
            except Exception as e:
                logger.error(f"Error broadcasting overlay alert: {e}")

    # 3. Update Merchant Dashboard
    merchant_payload = {
        'type': 'merchant_event',
        'data': {
            'event': 'METRICS_UPDATED',
            'settled_invoice_id': str(invoice.id),
            'amount': str(invoice.settled_amount),
            'asset': invoice.asset_code,
        }
    }
    try:
        async_to_sync(channel_layer.group_send)(f"merchant_{invoice.merchant.id}", merchant_payload)
    except Exception as e:
        pass

