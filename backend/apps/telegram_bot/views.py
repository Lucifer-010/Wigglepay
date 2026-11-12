from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, serializers
from drf_spectacular.utils import extend_schema
from .services.bot_service import handle_telegram_update

class TelegramUpdateSerializer(serializers.Serializer):
    update_id = serializers.IntegerField(required=False)
    message = serializers.DictField(required=False)
    callback_query = serializers.DictField(required=False)

class TelegramWebhookResponseSerializer(serializers.Serializer):
    status = serializers.CharField(default='ok')

@extend_schema(tags=['Telegram'])
class TelegramWebhookView(APIView):
    """
    Receives incoming updates from Telegram Bot API via Webhook.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = TelegramUpdateSerializer

    @extend_schema(
        summary="Telegram Bot Webhook endpoint",
        request=TelegramUpdateSerializer,
        responses={200: TelegramWebhookResponseSerializer}
    )
    def post(self, request, *args, **kwargs):
        update = request.data
        if update:
            handle_telegram_update(update)
        return Response({'status': 'ok'})
