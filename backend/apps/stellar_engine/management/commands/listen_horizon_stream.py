import time
import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.core.stellar_utils import get_horizon_server
from apps.stellar_engine.services.horizon_listener import process_stellar_payment_event

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Runs long-running Stellar Horizon SSE stream listener daemon'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("🌟 Starting WigglePay Horizon Stream Daemon..."))
        account_id = settings.STELLAR_PLATFORM_PUBLIC_KEY
        self.stdout.write(f"Listening on destination account: {account_id}")

        server = get_horizon_server()
        cursor = 'now'

        while True:
            try:
                # Stream incoming payments via Server-Sent Events
                stream = server.payments().for_account(account_id).cursor(cursor).stream()
                for response in stream:
                    if isinstance(response, dict):
                        cursor = response.get('paging_token', cursor)
                        process_stellar_payment_event(response)
            except KeyboardInterrupt:
                self.stdout.write("Shutting down Horizon stream listener.")
                break
            except Exception as e:
                self.stderr.write(f"Horizon SSE connection dropped: {e}. Reconnecting in 5 seconds...")
                time.sleep(5)

