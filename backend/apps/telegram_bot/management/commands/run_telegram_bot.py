import time
import httpx
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.telegram_bot.services.bot_service import handle_telegram_update

class Command(BaseCommand):
    help = 'Runs long-polling Telegram Bot daemon for local development'

    def handle(self, *args, **options):
        token = settings.TELEGRAM_BOT_TOKEN
        if not token or 'FakeToken' in token:
            self.stdout.write(self.style.WARNING("TELEGRAM_BOT_TOKEN is not configured or is demo token."))
            self.stdout.write("To test telegram bot locally, set TELEGRAM_BOT_TOKEN in .env.")
            return

        self.stdout.write(self.style.SUCCESS("🤖 Starting WigglePay Telegram Bot Polling Daemon..."))
        offset = None

        while True:
            try:
                params = {"timeout": 30}
                if offset:
                    params["offset"] = offset

                resp = httpx.get(
                    f"https://api.telegram.org/bot{token}/getUpdates",
                    params=params,
                    timeout=35.0
                )
                if resp.status_code == 200:
                    updates = resp.json().get("result", [])
                    for update in updates:
                        offset = update["update_id"] + 1
                        handle_telegram_update(update)
            except Exception as e:
                self.stderr.write(f"Error during telegram polling: {e}")
                time.sleep(3)

