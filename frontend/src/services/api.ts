/**
 * WigglePay Gateway & Settlement API Service Client
 * Connects React UI to the Django REST Framework backend & Daphne WebSockets
 */

export interface ApiInvoice {
  id: string;
  merchant: string;
  merchant_name: string;
  title: string;
  description: string;
  customer_ref: string | null;
  asset_code: string;
  asset_issuer: string | null;
  expected_amount: string;
  settled_amount: string;
  memo_type: string;
  memo_value: string;
  multiplexed_address: string;
  destination_address: string;
  status: 'DRAFT' | 'PENDING' | 'SETTLED' | 'PARTIALLY_PAID' | 'EXPIRED' | 'CANCELLED';
  expires_at: string;
  settled_at: string | null;
  checkout_url: string;
  deep_link: string;
  qr_svg_url: string;
  created_at: string;
}

export interface PathPaymentQuote {
  destination_asset: string;
  destination_amount: string;
  source_asset: string;
  source_amount: string;
  quote_valid_seconds: number;
  path: any[];
  note?: string;
}

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';

export class WigglePayApi {
  /**
   * Fetch invoices from backend
   */
  static async getInvoices(params?: { status?: string; asset_code?: string }): Promise<ApiInvoice[]> {
    try {
      const url = new URL('/api/v1/invoices/', BASE_URL);
      if (params?.status) url.searchParams.set('status', params.status);
      if (params?.asset_code) url.searchParams.set('asset_code', params.asset_code);

      const res = await fetch(url.toString(), {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      const data = await res.json();
      return data.results || data;
    } catch (err) {
      console.warn('Backend unavailable, using local mock data fallback:', err);
      return [];
    }
  }

  /**
   * Create new invoice on backend
   */
  static async createInvoice(payload: {
    merchant?: string;
    title: string;
    description?: string;
    customer_ref?: string;
    asset_code: string;
    expected_amount: number;
    expiry_hours?: number;
  }): Promise<ApiInvoice | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/invoices/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed to create invoice: ${res.statusText}`);
      return await res.json();
    } catch (err) {
      console.error('Invoice creation API call failed:', err);
      return null;
    }
  }

  /**
   * Simulate invoice settlement on backend
   */
  static async simulateSettle(invoiceId: string, amount?: number, txHash?: string): Promise<ApiInvoice | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/invoices/${invoiceId}/simulate-settle/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ amount, tx_hash: txHash }),
      });
      if (!res.ok) throw new Error(`Simulate settle failed: ${res.statusText}`);
      return await res.json();
    } catch (err) {
      console.error('Simulation API call failed:', err);
      return null;
    }
  }

  /**
   * Get SDEX Path Payment Quote
   */
  static async getPathQuote(destAsset: string, destAmount: number, sourceAsset: string = 'XLM'): Promise<PathPaymentQuote | null> {
    try {
      const url = new URL('/api/v1/invoices/quote/', BASE_URL);
      url.searchParams.set('destination_asset', destAsset);
      url.searchParams.set('destination_amount', destAmount.toString());
      url.searchParams.set('source_asset', sourceAsset);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Path quote failed: ${res.statusText}`);
      return await res.json();
    } catch (err) {
      console.warn('Quote fallback:', err);
      return null;
    }
  }

  /**
   * Connect to real-time WebSocket for invoice settlement
   */
  static connectInvoiceWebSocket(invoiceId: string, onUpdate: (data: any) => void): WebSocket | null {
    try {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const ws = new WebSocket(`${proto}//${host}/ws/invoices/${invoiceId}/`);

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          onUpdate(parsed);
        } catch (e) {
          console.error('Failed to parse WS frame:', e);
        }
      };

      return ws;
    } catch (err) {
      console.warn('Could not establish invoice WebSocket:', err);
      return null;
    }
  }

  /**
   * Connect to real-time WebSocket for OBS Live Stream alerts
   */
  static connectOverlayWebSocket(overlayToken: string, onAlert: (alert: any) => void): WebSocket | null {
    try {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const ws = new WebSocket(`${proto}//${host}/ws/overlays/${overlayToken}/`);

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          onAlert(parsed);
        } catch (e) {
          console.error('Failed to parse WS overlay alert:', e);
        }
      };

      return ws;
    } catch (err) {
      console.warn('Could not establish overlay WebSocket:', err);
      return null;
    }
  }
}

