# WigglePay: Stellar Settlement & Payment Infrastructure

WigglePay is a decentralized, low-cost Stellar-powered payment gateway enabling frictionless settlements for internet businesses, creators, and social-first merchants.

The platform bridges three distinct environments:
1. **Merchant Portal & Embedded Widgets (React + Vite + Tailwind CSS)**: For e-commerce sites, custom web apps, and live stream OBS overlays.
2. **AI-Driven Telegram Interface (Ollama Qwen3 / Qwen2.5 + Fast-Whisper)**: For conversational invoice creation via voice notes and natural language prompts.
3. **Stellar & Soroban Settlement Layer**: Multiplexed Accounts (`MED25519` M-addresses), 64-bit Memo IDs, SDEX Path Payments, Horizon SSE streaming daemon, and Soroban escrow / split contracts.

---

## 🏗 System Architecture Topology

```
                   +------------------------+
                   |  Merchant / End User   |
                   +-----------+------------+
                               |
       +-----------------------+------------------------+
       |                       |                        |
       v                       v                        v
+--------------+      +-----------------+      +------------------+
| React Portal |      | Embedded Widget |      | Telegram Client  |
|  (Merchant)  |      | / OBS Overlay   |      | (Voice/Text Msg) |
+-------+------+      +--------+--------+      +--------+---------+
        |                      |                        |
        | HTTPS/WSS            | HTTPS/WSS              | Telegram Bot API
        |                      |                        |
        v                      v                        v
+-----------------------------------------------------------------+
|                       NGINX Reverse Proxy                       |
+-----------------------------------------------------------------+
                               |
                               v
+-----------------------------------------------------------------+
|               Django REST Framework API Gateway                 |
|  - Auth & Merchant Accounts      - Widget Configuration Engine  |
|  - Invoice Management & State    - Webhook Dispatcher Engine    |
|  - Telegram Webhook Handler      - Realtime (Channels/WSS)      |
+-------------+-------------------------------+-------------------+
              |                               |
       Tasks  v                        Data   v
+-------------+-------------+    +------------+-----------+
|      Redis Broker         |    | PostgreSQL Database    |
|  - Celery Queues          |    | - Merchants, Invoices, |
|  - WebSocket Pub/Sub      |    |   Transactions, Keys   |
+-------------+-------------+    +------------------------+
              |
              +-------------------------------+
              |                               |
              v                               v
+---------------------------+   +-------------------------------+
|      Celery Workers       |   |   Stellar Horizon Daemon      |
| - AI Pipeline (Audio/LLM) |   | - SSE Stream Transaction Feed |
| - Webhook Dispatches      |   | - Payment Verification        |
| - Notifications (TG/Mail) |   | - Account Reconciliation      |
+-------------+-------------+   +---------------+---------------+
              |                                 |
              v                                 v
+---------------------------+   +-------------------------------+
| External AI Providers     |   | Stellar Network               |
| (Whisper STT + LLM Parser)|   | (Horizon API / Soroban RPC)   |
+---------------------------+   +-------------------------------+
```

---

## ⚡ Key Architectural Features

### 1. Deposit Attribution Engine (M-addresses & 64-bit Memos)
- Eliminates the need to fund a dedicated base Stellar account per invoice.
- Mints `MED25519` multiplexed addresses (`M...`) combining the merchant's destination public key and a 64-bit invoice sub-ID.
- Provides fallback to explicit 64-bit Memo-IDs for legacy wallets.

### 2. Horizon SSE Streaming Daemon & Idempotency Gate
- Long-running listener continuously monitors `/accounts/{account_id}/payments`.
- Uses an atomic Redis lock (`lock:tx:{tx_hash}`) and database uniqueness constraint on `TransactionRecord.tx_hash` to guarantee double-crediting prevention.
- Automatically transitions invoices to `SETTLED` (or `PARTIALLY_PAID`) and dispatches:
  - WebSocket broadcast to React payment modal (`/ws/invoices/{id}/`).
  - Audio and animated triggers to OBS stream overlays (`/ws/overlays/{token}/`).
  - Push alerts to Telegram merchant profile.
  - Outbound HMAC-SHA256 signed webhooks with exponential backoff retries.

### 3. AI-Powered Telegram Settlement Engine
- **Voice Pipeline**: Converts `.ogg` Telegram voice notes using FFmpeg and transcribes speech using `faster-whisper`.
- **Entity Extraction**: Lightweight `Qwen3 4B` / `Qwen2.5 3B` via Ollama transforms natural language into strict JSON schema:
  ```json
  {
    "amount": 50.00,
    "asset": "USDC",
    "customer_ref": "@alex",
    "description": "2 pairs of vintage shoes",
    "expiry_hours": 24
  }
  ```
- **Bot Interactions**: Replies with Telegram inline review cards (`[✅ Confirm & Generate Link]`, `[❌ Cancel]`), deep-links, dynamic SVG QR codes, and Telegram WebApp Mini-App integration.

### 4. Soroban Smart Contract (Automated Payout Splitting & Escrow)
- Rust Soroban contract in `contracts/wigglepay_escrow/`.
- Permitted non-custodial secondary routing (e.g. 95% merchant payout, 5% platform fee).
- Built-in escrow pre-funding, release, and refund mechanisms.

---

## 🚀 Quickstart: Docker Compose

All credentials and configurations are unified in the global `.env` file at the root.

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Build and launch all multi-container services
docker-compose up --build -d

# 3. Pull the lightweight Qwen model in Ollama
docker-compose exec ollama ollama pull qwen2.5:3b
```

### Exposed Endpoints:
- **Merchant Portal & Widgets**: [http://localhost:3000](http://localhost:3000)
- **Django REST API**: [http://localhost:8000/api/v1/](http://localhost:8000/api/v1/)
- **OpenAPI Swagger UI**: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)
- **OpenAPI ReDoc**: [http://localhost:8000/api/redoc/](http://localhost:8000/api/redoc/)
- **System Health & Soroban Bridge**: [http://localhost:8000/api/v1/health/](http://localhost:8000/api/v1/health/)
- **NGINX Gateway**: [http://localhost](http://localhost)

---

## 🧪 Local Development & Testing

```bash
# Activate virtual environment
source .venv/bin/activate

# Apply database migrations
python backend/manage.py migrate

# Run all test suites
python backend/manage.py test apps.core

# Launch Django development server
python backend/manage.py runserver 0.0.0.0:8000

# Launch Daphne WebSockets
daphne -b 0.0.0.0 -p 8001 wigglepay.asgi:application

# Launch Celery worker
celery -A wigglepay worker -l info -Q stellar_queue,ai_queue,webhook_queue
```

