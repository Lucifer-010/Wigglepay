from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from apps.merchants.models import Merchant
from apps.invoices.models import Invoice, InvoiceStatus
from apps.transactions.models import TransactionRecord
from apps.core.stellar_utils import parse_multiplexed_address, create_multiplexed_address
from apps.core.crypto_utils import sign_payload, verify_signature
from apps.ai_engine.services.ollama_service import fallback_regex_parser
from apps.stellar_engine.services.soroban_bridge import SorobanEscrowBridge

class WigglePayBackendTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.merchant = Merchant.objects.create(
            business_name="Monkey D Luffy Creator",
            slug="monkey-d-luffy",
            stellar_public_key="GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
            commission_rate=Decimal('0.0050')
        )

    def test_merchant_auto_keys_and_rotation(self):
        self.assertTrue(self.merchant.api_public_key.startswith('pub_live_'))
        self.assertTrue(self.merchant.api_secret_key.startswith('sec_live_'))
        self.assertTrue(self.merchant.webhook_secret.startswith('wp_whsec_'))

        old_pub = self.merchant.api_public_key
        new_pub, new_sec = self.merchant.rotate_keys()
        self.assertNotEqual(old_pub, new_pub)
        self.assertEqual(self.merchant.api_public_key, new_pub)

    def test_invoice_creation_multiplexed_address(self):
        invoice = Invoice.objects.create(
            merchant=self.merchant,
            title="Design Commission",
            customer_ref="@sarah",
            asset_code="USDC",
            expected_amount=Decimal('50.00')
        )
        self.assertEqual(invoice.status, InvoiceStatus.PENDING)
        self.assertTrue(invoice.memo_value.isdigit())
        self.assertTrue(invoice.multiplexed_address.startswith('M'))
        
        # Test M-address parsing back to base key and memo ID
        base, memo_id = parse_multiplexed_address(invoice.multiplexed_address)
        self.assertEqual(base, self.merchant.stellar_public_key)
        self.assertEqual(str(memo_id), invoice.memo_value)

    def test_simulate_settlement_and_replay_protection(self):
        invoice = Invoice.objects.create(
            merchant=self.merchant,
            title="Podcast Tip",
            customer_ref="@marcus",
            asset_code="XLM",
            expected_amount=Decimal('100.00')
        )
        url = f"/api/v1/invoices/{invoice.id}/simulate-settle/"
        tx_hash = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
        
        resp = self.client.post(url, {'tx_hash': tx_hash, 'amount': '100.00'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['status'], 'SETTLED')

        # Check transaction record created
        tx = TransactionRecord.objects.get(tx_hash=tx_hash)
        self.assertEqual(tx.amount, Decimal('100.00'))

        # Verify duplicate replay protection (cannot create another transaction with same hash)
        with self.assertRaises(Exception):
            TransactionRecord.objects.create(
                tx_hash=tx_hash,
                ledger_index=54123456,
                sender_address="GBTEST...",
                destination_address="GBDEST...",
                asset_code="XLM",
                amount=Decimal('100.00')
            )

    def test_path_payment_quote_endpoint(self):
        url = "/api/v1/invoices/quote/?destination_asset=USDC&destination_amount=25.0&source_asset=XLM"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['destination_asset'], 'USDC')
        self.assertTrue('source_amount' in resp.data)

    def test_ai_fallback_parser(self):
        prompt = "Create an invoice for 50 USDC for 2 pairs of vintage shoes from user @alex"
        parsed = fallback_regex_parser(prompt)
        self.assertEqual(parsed['amount'], 50.0)
        self.assertEqual(parsed['asset'], 'USDC')
        self.assertEqual(parsed['customer_ref'], '@alex')

    def test_hmac_signature(self):
        payload = b'{"event":"invoice.settled","amount":50}'
        secret = "wp_whsec_my_test_secret"
        sig = sign_payload(payload, secret)
        self.assertTrue(verify_signature(payload, secret, sig))
        self.assertFalse(verify_signature(payload, "wrong_secret", sig))

    def test_soroban_bridge_simulation(self):
        bridge = SorobanEscrowBridge()
        split = bridge.simulate_split_payout(Decimal('1000'), fee_bps=500) # 5%
        self.assertEqual(split['platform_fee'], Decimal('50.0000000'))
        self.assertEqual(split['merchant_payout'], Decimal('950.0000000'))

    def test_health_check_endpoint(self):
        resp = self.client.get('/api/v1/health/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['status'], 'HEALTHY')
