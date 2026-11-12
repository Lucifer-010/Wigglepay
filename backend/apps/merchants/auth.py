from rest_framework import authentication, exceptions
from drf_spectacular.extensions import OpenApiAuthenticationExtension
from .models import Merchant

class ApiKeyAuthentication(authentication.BaseAuthentication):
    """
    Authenticate API requests via X-WigglePay-Key and optional X-WigglePay-Secret headers.
    """
    def authenticate(self, request):
        api_key = request.headers.get('X-WigglePay-Key') or request.META.get('HTTP_X_WIGGLEPAY_KEY')
        if not api_key:
            return None

        try:
            merchant = Merchant.objects.get(api_public_key=api_key, is_active=True)
        except Merchant.DoesNotExist:
            raise exceptions.AuthenticationFailed('Invalid or inactive API Key.')

        api_secret = request.headers.get('X-WigglePay-Secret') or request.META.get('HTTP_X_WIGGLEPAY_SECRET')
        if api_secret and merchant.api_secret_key != api_secret:
            raise exceptions.AuthenticationFailed('Invalid API Secret.')

        return (merchant.user or merchant, merchant)

class ApiKeyAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = 'apps.merchants.auth.ApiKeyAuthentication'
    name = 'ApiKeyAuth'

    def get_security_definition(self, auto_schema):
        return {
            'type': 'apiKey',
            'in': 'header',
            'name': 'X-WigglePay-Key',
            'description': 'Merchant Public API Key (e.g. pub_live_...)',
        }
