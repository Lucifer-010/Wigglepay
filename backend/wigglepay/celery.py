import os
from celery import Celery
from celery.schedules import crontab

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wigglepay.settings')

app = Celery('wigglepay')

# Load task configuration from Django settings with CELERY_ prefix
app.config_from_object('django.conf:settings', namespace='CELERY')

# Routing tasks to distinct queues as per architecture
app.conf.task_routes = {
    'apps.stellar_engine.tasks.*': {'queue': 'stellar_queue'},
    'apps.ai_engine.tasks.*': {'queue': 'ai_queue'},
    'apps.telegram_bot.tasks.*': {'queue': 'ai_queue'},
    'apps.webhooks.tasks.*': {'queue': 'webhook_queue'},
    'apps.invoices.tasks.*': {'queue': 'stellar_queue'},
}

# Beat scheduler for periodic tasks
app.conf.beat_schedule = {
    'expire-unpaid-invoices-every-minute': {
        'task': 'apps.invoices.tasks.check_expired_invoices',
        'schedule': 60.0,
    },
    'retry-pending-webhooks-every-two-minutes': {
        'task': 'apps.webhooks.tasks.retry_failed_webhooks',
        'schedule': 120.0,
    },
}

# Auto-discover tasks across all registered apps
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

