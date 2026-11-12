import json
from channels.generic.websocket import AsyncWebsocketConsumer

class InvoiceConsumer(AsyncWebsocketConsumer):
    """
    Real-time checkout modal state machine:
    IDLE -> SIGNING -> BROADCASTING -> SETTLED
    """
    async def connect(self):
        self.invoice_id = self.scope['url_route']['kwargs']['invoice_id']
        self.group_name = f"invoice_{self.invoice_id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Send initial connected handshake
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'invoice_id': self.invoice_id,
            'status': 'LISTENING'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def invoice_update(self, event):
        """Dispatched when invoice changes status."""
        await self.send(text_data=json.dumps(event['data']))

class OverlayConsumer(AsyncWebsocketConsumer):
    """
    OBS Live Stream Overlay WebSocket connection:
    Invokes on-screen animations, sound triggers, and Text-To-Speech audio.
    """
    async def connect(self):
        self.overlay_token = self.scope['url_route']['kwargs']['overlay_token']
        self.group_name = f"overlay_{self.overlay_token}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send(text_data=json.dumps({
            'type': 'overlay_connected',
            'token': self.overlay_token,
            'status': 'ONLINE'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def stream_alert(self, event):
        """Trigger visual animation and audio in OBS."""
        await self.send(text_data=json.dumps(event['alert']))

class MerchantConsumer(AsyncWebsocketConsumer):
    """
    Merchant Portal Dashboard WebSocket connection for live analytics & invoices.
    """
    async def connect(self):
        self.merchant_id = self.scope['url_route']['kwargs']['merchant_id']
        self.group_name = f"merchant_{self.merchant_id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def merchant_event(self, event):
        await self.send(text_data=json.dumps(event['data']))

