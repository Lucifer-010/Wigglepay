from rest_framework import serializers
from .models import WidgetConfig, StreamOverlay

class WidgetConfigSerializer(serializers.ModelSerializer):
    embed_code_snippet = serializers.SerializerMethodField()

    class Meta:
        model = WidgetConfig
        fields = [
            'id',
            'merchant',
            'name',
            'layout',
            'default_asset',
            'preset_amounts',
            'allow_custom_amount',
            'collect_donor_name',
            'collect_message',
            'theme',
            'accent_color',
            'embed_code_snippet',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'embed_code_snippet', 'created_at', 'updated_at']

    def get_embed_code_snippet(self, obj) -> str:
        api_key = obj.merchant.api_public_key
        return (
            f'<script src="https://cdn.wigglepay.io/widget.js" '
            f'data-wiggle-key="{api_key}" '
            f'data-widget-id="{obj.id}" '
            f'data-asset="{obj.default_asset}" '
            f'data-theme="{obj.theme}"></script>'
        )

class StreamOverlaySerializer(serializers.ModelSerializer):
    browser_source_url = serializers.SerializerMethodField()
    websocket_url = serializers.SerializerMethodField()

    class Meta:
        model = StreamOverlay
        fields = [
            'id',
            'merchant',
            'name',
            'overlay_token',
            'min_tip_threshold',
            'sound_enabled',
            'sound_url',
            'tts_enabled',
            'animation_style',
            'is_active',
            'browser_source_url',
            'websocket_url',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'overlay_token', 'browser_source_url', 'websocket_url', 'created_at', 'updated_at']

    def get_browser_source_url(self, obj) -> str:
        request = self.context.get('request')
        base = request.build_absolute_uri('/')[:-1] if request else 'http://localhost:3000'
        return f"{base}/overlay/{obj.overlay_token}"

    def get_websocket_url(self, obj) -> str:
        return f"ws://localhost:8001/ws/overlays/{obj.overlay_token}/"

