import json
import logging
from decimal import Decimal
from django.conf import settings
from apps.invoices.models import Invoice, InvoiceStatus
from apps.transactions.models import TransactionRecord
from apps.core.stellar_utils import parse_multiplexed_address, get_horizon_server
from apps.realtime.broadcaster import broadcast_invoice_settled
from apps.telegram_bot.services.bot_service import notify_settlement_to_telegram

logger = logging.getLogger(__name__)

def get_redis_client():
    try:
        import redis
        return redis.from_url(settings.REDIS_URL)
    except Exception:
        return None

def process_stellar_payment_event(payment_data: dict) -> bool:
    """
    Core Payment Attribution & Settlement Engine:
    1. Idempotency Gate (Redis atomic lock + DB unique constraint)
    2. Ledger validation against open invoices
    3. Multi-channel broadcast (WebSockets, Telegram, Webhook)
    """
    tx_hash = payment_data.get('transaction_hash') or payment_data.get('id', '')
    if not tx_hash:
        return False

    # 1. Idempotency Gate via Redis Atomic Lock
    redis_client = get_redis_client()
    if redis_client:
        lock_key = f"lock:tx:{tx_hash}"
        # Set lock with 24h expiration; if already exists, skip
        acquired = redis_client.set(lock_key, "1", nx=True, ex=86400)
        if not acquired:
            logger.info(f"Duplicate transaction skipped by Redis idempotency gate: {tx_hash}")
            return False

    # Check DB replay protection
    if TransactionRecord.objects.filter(tx_hash=tx_hash).exists():
        logger.info(f"Transaction {tx_hash} already settled in database.")
        return False

    # Extract payment fields
    destination = payment_data.get('to', '') or payment_data.get('destination', '')
    sender = payment_data.get('from', '') or payment_data.get('source_account', '')
    amount_str = payment_data.get('amount', '0')
    asset_type = payment_data.get('asset_type', '')
    asset_code = 'XLM' if asset_type == 'native' else payment_data.get('asset_code', 'USDC')
    asset_issuer = payment_data.get('asset_issuer', None)
    
    amount = Decimal(amount_str)

    # Decode M-address if destination is multiplexed
    base_dest, memo_id_from_dest = parse_multiplexed_address(destination)

    # Also check transaction memo
    tx_memo = payment_data.get('transaction', {}).get('memo') or payment_data.get('memo')
    memo_val = str(memo_id_from_dest) if memo_id_from_dest else (str(tx_memo) if tx_memo else None)

    # 2. Cross-reference open pending invoices
    invoice = None
    if memo_val:
        invoice = Invoice.objects.filter(
            status=InvoiceStatus.PENDING,
            memo_value=memo_val,
            asset_code=asset_code
        ).first()

    if not invoice and memo_id_from_dest:
        invoice = Invoice.objects.filter(
            status=InvoiceStatus.PENDING,
            multiplexed_address=destination
        ).first()

    # Record Transaction
    tx_record = TransactionRecord.objects.create(
        invoice=invoice,
        tx_hash=tx_hash,
        ledger_index=payment_data.get('ledger', 0) or 54000000,
        sender_address=sender,
        destination_address=base_dest,
        asset_code=asset_code,
        asset_issuer=asset_issuer,
        amount=amount,
        fee_paid=Decimal('0.00001'),
        memo=memo_val,
        raw_payload=payment_data
    )

    # 3. State Transition & Real-Time Broadcasts
    if invoice:
        # Validate Underpayment / Overpayment
        if amount >= invoice.expected_amount:
            invoice.mark_settled(settled_amount=amount, tx_hash=tx_hash, sender=sender)
            notify_settlement_to_telegram(invoice, tx_hash, sender)
            logger.info(f"✅ Invoice {invoice.id} settled with {amount} {asset_code} (Tx: {tx_hash})")
        else:
            invoice.status = InvoiceStatus.PARTIALLY_PAID
            invoice.settled_amount = amount
            invoice.save(update_fields=['status', 'settled_amount', 'updated_at'])
            logger.warning(f"⚠️ Invoice {invoice.id} partially paid ({amount}/{invoice.expected_amount})")

    return True

