import json
import logging
import tempfile
import httpx
from decimal import Decimal
from django.conf import settings
from apps.invoices.models import Invoice, InvoiceStatus
from apps.merchants.models import Merchant
from apps.telegram_bot.models import TelegramProfile
from apps.ai_engine.services.ollama_service import parse_settlement_prompt

logger = logging.getLogger(__name__)

def get_bot_api_url(method: str) -> str:
    token = settings.TELEGRAM_BOT_TOKEN
    return f"https://api.telegram.org/bot{token}/{method}"

def send_chat_action(chat_id: int, action: str = "typing"):
    if not settings.TELEGRAM_BOT_TOKEN:
        return
    try:
        httpx.post(get_bot_api_url("sendChatAction"), json={"chat_id": chat_id, "action": action}, timeout=5.0)
    except Exception:
        pass

def send_telegram_message(chat_id: int, text: str, reply_markup: dict = None):
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.info(f"[Mock Telegram -> Chat {chat_id}]: {text}")
        return {"ok": True, "mock": True}

    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup

    try:
        resp = httpx.post(get_bot_api_url("sendMessage"), json=payload, timeout=10.0)
        return resp.json()
    except Exception as e:
        logger.error(f"Failed to deliver Telegram message: {e}")
        return {"ok": False, "error": str(e)}

def send_invoice_review_card(chat_id: int, merchant_id: str, parsed_data: dict, transcript: str = ""):
    amount = parsed_data.get('amount', 10.0)
    asset = parsed_data.get('asset', 'USDC')
    customer = parsed_data.get('customer_ref') or 'N/A'
    desc = parsed_data.get('description', 'Digital Settlement')

    profile, _ = TelegramProfile.objects.get_or_create(
        telegram_chat_id=chat_id,
        defaults={'telegram_user_id': chat_id}
    )
    profile.conversational_state = {
        'action': 'AWAITING_CONFIRMATION',
        'merchant_id': merchant_id,
        'draft': parsed_data,
    }
    profile.save(update_fields=['conversational_state', 'updated_at'])

    transcript_line = f"🎙 <i>Transcript: \"{transcript}\"</i>\n\n" if transcript else ""
    text = (
        f"⚡ <b>WigglePay AI Settlement Invoice Review</b>\n\n"
        f"{transcript_line}"
        f"💰 <b>Amount:</b> {amount} {asset}\n"
        f"👤 <b>Customer / Recipient:</b> {customer}\n"
        f"📝 <b>Description:</b> {desc}\n"
        f"⏳ <b>Validity:</b> 24 Hours\n\n"
        f"Please verify the extracted parameters before minting the Stellar settlement address:"
    )

    keyboard = {
        "inline_keyboard": [
            [
                {"text": "✅ Confirm & Generate Link", "callback_data": "confirm_invoice"},
                {"text": "❌ Cancel", "callback_data": "cancel_invoice"}
            ]
        ]
    }
    return send_telegram_message(chat_id, text, reply_markup=keyboard)

def handle_telegram_update(update: dict):
    """
    Process incoming Telegram update (Message, Voice Note, or Callback Query).
    """
    # 1. Handle Inline Button Callback
    if "callback_query" in update:
        cq = update["callback_query"]
        chat_id = cq["message"]["chat"]["id"]
        data = cq.get("data", "")
        cq_id = cq["id"]

        try:
            profile = TelegramProfile.objects.get(telegram_chat_id=chat_id)
            state = profile.conversational_state
        except TelegramProfile.DoesNotExist:
            state = {}

        if data == "confirm_invoice":
            draft = state.get('draft', {})
            merchant_id = state.get('merchant_id')
            merchant = Merchant.objects.filter(id=merchant_id).first() if merchant_id else Merchant.objects.first()
            if not merchant:
                merchant = Merchant.objects.create(
                    business_name="Demo Merchant",
                    slug=f"demo-{chat_id}",
                    stellar_public_key="GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
                )

            inv = Invoice.objects.create(
                merchant=merchant,
                title=draft.get('description', 'Telegram Invoice'),
                description=draft.get('description', ''),
                customer_ref=draft.get('customer_ref'),
                asset_code=draft.get('asset', 'USDC'),
                expected_amount=Decimal(str(draft.get('amount', 10.0))),
            )

            # Clear state
            profile.conversational_state = {}
            profile.save(update_fields=['conversational_state'])

            checkout_url = f"{settings.PUBLIC_APP_URL}/?invoiceId={inv.id}"
            miniapp_url = f"{settings.TELEGRAM_MINIAPP_URL}&invoiceId={inv.id}"

            success_text = (
                f"✅ <b>Invoice Provisioned Successfully!</b>\n\n"
                f"🆔 <b>Invoice ID:</b> <code>{inv.id}</code>\n"
                f"🪙 <b>Amount:</b> {inv.expected_amount} {inv.asset_code}\n"
                f"📬 <b>Multiplexed Address:</b>\n<code>{inv.multiplexed_address}</code>\n"
                f"🏷 <b>Memo ID:</b> <code>{inv.memo_value}</code>\n\n"
                f"🔗 <b>Checkout URL:</b> {checkout_url}"
            )

            reply_markup = {
                "inline_keyboard": [
                    [
                        {"text": "💳 Pay via Mini-App", "web_app": {"url": miniapp_url}},
                        {"text": "🌐 Web Checkout", "url": checkout_url}
                    ]
                ]
            }
            send_telegram_message(chat_id, success_text, reply_markup=reply_markup)

        elif data == "cancel_invoice":
            if profile:
                profile.conversational_state = {}
                profile.save(update_fields=['conversational_state'])
            send_telegram_message(chat_id, "🚫 Invoice generation cancelled.")

        return

    # 2. Handle Messages
    message = update.get("message", {})
    chat_id = message.get("chat", {}).get("id")
    if not chat_id:
        return

    # User Profile tracking
    user_info = message.get("from", {})
    TelegramProfile.objects.update_or_create(
        telegram_user_id=user_info.get("id", chat_id),
        defaults={
            'telegram_chat_id': chat_id,
            'username': user_info.get("username"),
            'first_name': user_info.get("first_name", ""),
            'last_name': user_info.get("last_name", ""),
        }
    )

    # A) Voice Note Received (.ogg)
    if "voice" in message:
        send_chat_action(chat_id, "record_voice")
        file_id = message["voice"]["file_id"]
        
        # Download voice file via Telegram API
        try:
            token = settings.TELEGRAM_BOT_TOKEN
            file_info = httpx.get(f"https://api.telegram.org/bot{token}/getFile?file_id={file_id}").json()
            file_path = file_info["result"]["file_path"]
            file_url = f"https://api.telegram.org/file/bot{token}/{file_path}"
            
            audio_bytes = httpx.get(file_url).content
            with tempfile.NamedTemporaryFile(delete=False, suffix=".ogg") as tmp:
                tmp.write(audio_bytes)
                local_path = tmp.name

            # Dispatch Celery task or process inline
            from apps.ai_engine.tasks import process_voice_prompt_task
            merchant = Merchant.objects.first()
            process_voice_prompt_task.delay(local_path, chat_id, str(merchant.id) if merchant else "")
        except Exception as e:
            logger.warning(f"Voice download failed or token unset ({e}). Parsing mock voice prompt.")
            # Fallback mock voice prompt for testing
            mock_transcript = "Bill Sarah 120 XLM for graphic design work"
            parsed = parse_settlement_prompt(mock_transcript)
            send_invoice_review_card(chat_id, "", parsed, transcript=mock_transcript)
        return

    # B) Text Message
    text = message.get("text", "").strip()
    if not text:
        return

    if text.startswith("/start") or text.startswith("/help"):
        welcome = (
            "✨ <b>Welcome to WigglePay Bot!</b>\n\n"
            "Create frictionless Stellar invoices simply by typing or sending a voice note.\n\n"
            "<b>Examples:</b>\n"
            "• <i>\"Create an invoice for 50 USDC for vintage shoes from @alex\"</i>\n"
            "• <i>\"Bill Marcus 420 XLM for spatial audio rig\"</i>\n"
            "• 🎙 <i>Or simply record a voice note!</i>\n\n"
            "Let's get started — send me a prompt!"
        )
        send_telegram_message(chat_id, welcome)
        return

    send_chat_action(chat_id, "typing")
    extracted = parse_settlement_prompt(text)
    merchant = Merchant.objects.first()
    send_invoice_review_card(chat_id, str(merchant.id) if merchant else "", extracted)

def notify_settlement_to_telegram(invoice: Invoice, tx_hash: str, sender: str):
    """Deliver real-time push alert to the merchant's Telegram when Stellar payment settles."""
    profiles = TelegramProfile.objects.filter(merchant=invoice.merchant)
    if not profiles.exists():
        profiles = TelegramProfile.objects.all()[:1]

    text = (
        f"🎉 <b>PAYMENT SETTLED ON STELLAR!</b>\n\n"
        f"💵 <b>Amount Received:</b> {invoice.settled_amount} {invoice.asset_code}\n"
        f"🏷 <b>Invoice:</b> {invoice.title} (<code>{invoice.id}</code>)\n"
        f"👤 <b>Customer:</b> {invoice.customer_ref or 'Anonymous'}\n"
        f"🔗 <b>Tx Hash:</b> <code>{tx_hash}</code>\n"
        f"🌐 <b>Explorer:</b> https://stellar.expert/explorer/testnet/tx/{tx_hash}"
    )

    for profile in profiles:
        send_telegram_message(profile.telegram_chat_id, text)

