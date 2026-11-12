import os
from pathlib import Path
from decouple import Config, RepositoryEnv
import dj_database_url

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent

# Load global .env file from root directory
env_path = ROOT_DIR / '.env'
if env_path.exists():
    config = Config(RepositoryEnv(str(env_path)))
else:
    from decouple import config

# Quick-start development settings - unsuitable for production
SECRET_KEY = config('SECRET_KEY', default='wigglepay-secret-key-development-stellar-settlement-2026')
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*').split(',')

# Application definition
INSTALLED_APPS = [
    # Daphne ASGI for WebSockets (must be before django.contrib.staticfiles)
    'daphne',
    
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',
    'corsheaders',
    'django_filters',
    'drf_spectacular',

    # WigglePay Internal Apps
    'apps.core',
    'apps.merchants',
    'apps.invoices',
    'apps.transactions',
    'apps.widgets',
    'apps.ai_engine',
    'apps.stellar_engine',
    'apps.telegram_bot',
    'apps.realtime',
    'apps.webhooks',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'wigglepay.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'wigglepay.wsgi.application'
ASGI_APPLICATION = 'wigglepay.asgi.application'

# Database Configuration with PostgreSQL and seamless SQLite fallback
use_sqlite = config('USE_SQLITE_FALLBACK', default=True, cast=bool)
database_url = config('DATABASE_URL', default='')

if database_url and not use_sqlite:
    try:
        DATABASES = {
            'default': dj_database_url.config(
                default=database_url,
                conn_max_age=600,
                conn_health_checks=True,
            )
        }
    except Exception:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PAGINATION_CLASS': 'apps.core.pagination.WigglePayPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'apps.merchants.auth.ApiKeyAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
}

# OpenAPI & Swagger / ReDoc (drf-spectacular)
SPECTACULAR_SETTINGS = {
    'TITLE': 'WigglePay Gateway & Settlement API',
    'DESCRIPTION': (
        'High-performance Stellar-powered payment gateway enabling decentralized low-cost '
        'settlement, AI-driven conversational invoice creation via Telegram, OBS Stream Overlays, '
        'and Multiplexed (M-address / 64-bit Memo) payment routing.'
    ),
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'TAGS': [
        {'name': 'Merchants', 'description': 'Merchant accounts, API keys & payout settings'},
        {'name': 'Invoices', 'description': 'Deposit attribution, memos, M-addresses, quotes & settlement state'},
        {'name': 'Transactions', 'description': 'Ledger records, replay protection & verification proofs'},
        {'name': 'Widgets', 'description': 'Embeddable checkout widgets & OBS stream overlay configuration'},
        {'name': 'Telegram', 'description': 'AI voice ingestion & conversational entity parsing'},
        {'name': 'Webhooks', 'description': 'HMAC-SHA256 signed event dispatches & retry logs'},
    ],
}

# CORS & CSRF Configuration
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in config(
        'CSRF_TRUSTED_ORIGINS',
        default='http://localhost:3000,http://localhost:8000,http://127.0.0.1:3000,http://127.0.0.1:8000'
    ).split(',')
    if origin.strip()
]

# Redis & Celery Settings
REDIS_URL = config('REDIS_URL', default='redis://redis:6379/0')
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://redis:6379/1')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://redis:6379/2')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'

# Channels / WebSocket Configuration
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [REDIS_URL],
        },
    },
}
# Fallback to In-Memory Channel Layer if Redis is offline during tests/local run
try:
    import redis
    r = redis.from_url(REDIS_URL, socket_connect_timeout=1)
    r.ping()
except Exception:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        }
    }

# --- STELLAR BLOCKCHAIN SETTINGS ---
STELLAR_NETWORK = config('STELLAR_NETWORK', default='TESTNET')
STELLAR_HORIZON_URL = config('STELLAR_HORIZON_URL', default='https://horizon-testnet.stellar.org')
STELLAR_SOROBAN_RPC_URL = config('STELLAR_SOROBAN_RPC_URL', default='https://soroban-testnet.stellar.org')
STELLAR_NETWORK_PASSPHRASE = config('STELLAR_NETWORK_PASSPHRASE', default='Test SDF Network ; September 2015')
STELLAR_PLATFORM_PUBLIC_KEY = config('STELLAR_PLATFORM_PUBLIC_KEY', default='GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5')
STELLAR_PLATFORM_SECRET_KEY = config('STELLAR_PLATFORM_SECRET_KEY', default='')
STELLAR_USDC_ISSUER_TESTNET = config('STELLAR_USDC_ISSUER_TESTNET', default='GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5')
STELLAR_USDC_ISSUER_PUBLIC = config('STELLAR_USDC_ISSUER_PUBLIC', default='GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN')
SOROBAN_ESCROW_CONTRACT_ID = config('SOROBAN_ESCROW_CONTRACT_ID', default='CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC')

# --- AI & OLLAMA SETTINGS ---
OLLAMA_BASE_URL = config('OLLAMA_BASE_URL', default='http://localhost:11434')
OLLAMA_MODEL = config('OLLAMA_MODEL', default='qwen2.5:3b')
WHISPER_MODEL_SIZE = config('WHISPER_MODEL_SIZE', default='base')
WHISPER_DEVICE = config('WHISPER_DEVICE', default='cpu')
WHISPER_COMPUTE_TYPE = config('WHISPER_COMPUTE_TYPE', default='int8')

# --- TELEGRAM BOT SETTINGS ---
TELEGRAM_BOT_TOKEN = config('TELEGRAM_BOT_TOKEN', default='')
TELEGRAM_WEBHOOK_URL = config('TELEGRAM_WEBHOOK_URL', default='')
TELEGRAM_MINIAPP_URL = config('TELEGRAM_MINIAPP_URL', default='http://localhost:3000/?view=miniapp')

# --- MERCHANT SECURITY ---
WIGGLEPAY_DEFAULT_WEBHOOK_SECRET = config('WIGGLEPAY_DEFAULT_WEBHOOK_SECRET', default='wp_whsec_fallback_secret_demo')
WIGGLEPAY_API_KEY_SALT = config('WIGGLEPAY_API_KEY_SALT', default='wp_salt_stellar_settlement_2026')
PLATFORM_FEE_BPS = config('PLATFORM_FEE_BPS', default=50, cast=int)

