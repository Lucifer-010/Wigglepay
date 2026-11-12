export type AssetType = 'USDC' | 'XLM' | 'USDT';
export type InvoiceStatus = 'Active' | 'Settled' | 'Expired';
export type UnifiedNavId =
  | 'overview'
  | 'invoices'
  | 'tiplinks'
  | 'embedcode'
  | 'widget'
  | 'livealerts'
  | 'webhooks'
  | 'telegram'
  | 'specs'
  | 'settings';

export type EnvironmentSurface = 'portal' | 'widget' | 'overlay' | 'telegram' | 'specs';
export type PortalSection = 'overview' | 'invoices' | 'widgets' | 'overlays' | 'webhooks' | 'settings';
export type WidgetVisualTheme = 'Light' | 'Dark' | 'Midnight' | 'Cyber';
export type BannerStylePreset = 'violet-gradient' | 'crimson-aurora' | 'emerald-mesh';

export interface Invoice {
  id: string;
  customerHandle: string;
  customerName: string;
  asset: AssetType;
  amount: number;
  multiplexedAddress: string;
  baseAddress: string;
  memoId: string;
  description: string;
  paylinkSlug?: string;
  status: InvoiceStatus;
  createdAt: string;
  timestampMs: number;
  expiryHours: number;
  txHash?: string;
  ledgerIndex?: number;
  feeSavedUsd: number;
}

export interface TipLinkCard {
  id: string;
  title: string;
  publicTitle: string;
  slugQuery: string;
  description: string;
  url: string;
  themeBadge: WidgetVisualTheme;
  bannerStyle: BannerStylePreset;
  avatarInitials: string;
  avatarUrl?: string;
  bannerUrl?: string;
  isPrimary: boolean;
  defaultAmount: number;
  defaultAsset: AssetType;
  usdcPresets: [number, number, number, number];
  xlmPresets: [number, number, number, number];
  usdtPresets: [number, number, number, number];
  moderationEnabled: boolean;
  blockedKeywords?: string;
}

export interface TipSourceSite {
  id: string;
  domain: string;
  badgeLetter: string;
  badgeBg: string;
  format: 'Widget' | 'Button' | 'Paylink';
  tipsCount: number;
  lastTipAgo: string;
}

export interface StreamAlertEvent {
  id: string;
  donorName: string;
  donorHandle: string;
  amount: number;
  asset: AssetType;
  message: string;
  txHash: string;
  ledgerIndex: number;
  timestamp: string;
}

export interface WebhookDelivery {
  id: string;
  invoiceId: string;
  event: 'invoice.settled' | 'invoice.created' | 'invoice.expired';
  endpoint: string;
  hmacSignature: string;
  statusCode: number;
  latencyMs: number;
  timestamp: string;
  payloadPreview: string;
}

export const MERCHANT_IDENTITY = {
  name: 'Monkey D Luffy',
  brandTitle: 'WigglePay',
  handle: '@luffy',
  initials: 'ML',
  balanceUsdc: '36.91 USDC',
  shortStellarKey: 'GBDF...H7Q2M',
  verified: true,
  baseStellarAccount: 'GBDF2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG7Q2M',
  webhookUrl: 'https://api.wigglepay.io/v1/webhooks/stellar',
  overlayToken: 'obs_live_99481a7c',
  commissionRate: 0.1,
};

export const INITIAL_TIP_LINKS: TipLinkCard[] = [
  {
    id: 'tl-main',
    title: 'Main Paylink',
    publicTitle: 'Support this Creator',
    slugQuery: '?widget=main',
    description: 'Support my journey and content creation with instant Stellar payments!',
    url: 'https://wigglepay.app/luffy?widget=main',
    themeBadge: 'Dark',
    bannerStyle: 'violet-gradient',
    avatarInitials: 'M',
    isPrimary: true,
    defaultAmount: 5.0,
    defaultAsset: 'USDC',
    usdcPresets: [1, 2, 5, 10],
    xlmPresets: [5, 10, 25, 50],
    usdtPresets: [1, 2, 5, 10],
    moderationEnabled: false,
    blockedKeywords: 'spam, scam, phishing',
  },
  {
    id: 'tl-marathon',
    title: 'YouTube Marathon Widget',
    publicTitle: 'Join the Marathon Stream',
    slugQuery: '?widget=youtube-marathon',
    description: 'Thanks for supporting my pirate journey & open-source stream tools',
    url: 'https://wigglepay.app/luffy?widget=youtube-marathon',
    themeBadge: 'Light',
    bannerStyle: 'crimson-aurora',
    avatarInitials: 'ML',
    isPrimary: false,
    defaultAmount: 25.0,
    defaultAsset: 'USDC',
    usdcPresets: [5, 10, 25, 50],
    xlmPresets: [10, 25, 50, 100],
    usdtPresets: [5, 10, 25, 50],
    moderationEnabled: true,
    blockedKeywords: 'spam, links',
  },
];

export const INITIAL_TIP_SOURCES: TipSourceSite[] = [
  {
    id: 'src-1',
    domain: 'tobi.dev',
    badgeLetter: 'T',
    badgeBg: '#007AFF',
    format: 'Widget',
    tipsCount: 64,
    lastTipAgo: '2 min ago',
  },
  {
    id: 'src-2',
    domain: 'blog.tobi.dev',
    badgeLetter: 'B',
    badgeBg: '#5856D6',
    format: 'Button',
    tipsCount: 21,
    lastTipAgo: 'Today',
  },
  {
    id: 'src-3',
    domain: 'github.com/tobibuilds',
    badgeLetter: 'G',
    badgeBg: '#34C759',
    format: 'Paylink',
    tipsCount: 15,
    lastTipAgo: '3 days ago',
  },
];

export function generateMemo64Bit(): string {
  const part1 = Math.floor(10000000 + Math.random() * 89999999).toString();
  const part2 = Math.floor(10000000 + Math.random() * 89999999).toString();
  return `${part1}${part2}`;
}

export function generateMultiplexedAddress(memoId: string): string {
  const suffix = memoId
    .slice(-8)
    .replace(/[0-9]/g, (d) => 'ABCDEFGHJKLMNPQRSTUVWXYZ234567'[parseInt(d, 10) % 30]);
  return `MAQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4AAAA${suffix}Q2M`;
}

export function generateStellarTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'INV-9048',
    customerHandle: '@alex_mercer',
    customerName: 'Alex Mercer',
    asset: 'USDC',
    amount: 45.0,
    multiplexedAddress: 'MAQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4AAAAK7PQ2M',
    baseAddress: MERCHANT_IDENTITY.baseStellarAccount,
    memoId: '9048271649201842',
    description: 'Pro Shader Pack v4 · Direct Paylink',
    paylinkSlug: '?widget=main',
    status: 'Active',
    createdAt: 'Nov 12, 20:18',
    timestampMs: Date.now() - 2 * 60 * 1000,
    expiryHours: 24,
    feeSavedUsd: 1.61,
  },
  {
    id: 'INV-9047',
    customerHandle: '@sarah_chen',
    customerName: 'Sarah Chen',
    asset: 'USDC',
    amount: 240.0,
    multiplexedAddress: 'MAQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4AAAAB8RQ2M',
    baseAddress: MERCHANT_IDENTITY.baseStellarAccount,
    memoId: '8831049281746501',
    description: 'macOS Iconography & HIG Audit Retainer',
    paylinkSlug: '?widget=main',
    status: 'Settled',
    createdAt: 'Nov 12, 20:04',
    timestampMs: Date.now() - 14 * 60 * 1000,
    expiryHours: 24,
    txHash: '8f3a9d21c4e7b01948271635a9c8e7f6d5b4a39281706f5e4d3c2b1a09876543',
    ledgerIndex: 54192840,
    feeSavedUsd: 7.26,
  },
  {
    id: 'INV-9046',
    customerHandle: '@marcus_vance',
    customerName: 'Marcus Vance',
    asset: 'XLM',
    amount: 420.0,
    multiplexedAddress: 'MAQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4AAAAC9SQ2M',
    baseAddress: MERCHANT_IDENTITY.baseStellarAccount,
    memoId: '7749201847261920',
    description: 'Live stream Widget — Spatial Audio Rig',
    paylinkSlug: '?widget=youtube-marathon',
    status: 'Settled',
    createdAt: 'Nov 12, 19:37',
    timestampMs: Date.now() - 41 * 60 * 1000,
    expiryHours: 12,
    txHash: '3c1e7b90a2d4f681920384756a1b2c3d4e5f60718293a4b5c6d7e8f901234567',
    ledgerIndex: 54192512,
    feeSavedUsd: 1.85,
  },
  {
    id: 'INV-9045',
    customerHandle: '@elena_rostova',
    customerName: 'Elena Rostova',
    asset: 'USDC',
    amount: 1250.0,
    multiplexedAddress: 'MAQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4AAAAD2TQ2M',
    baseAddress: MERCHANT_IDENTITY.baseStellarAccount,
    memoId: '6619283746501928',
    description: 'Custom Soroban Escrow Split Module',
    paylinkSlug: '?widget=main',
    status: 'Settled',
    createdAt: 'Nov 12, 18:15',
    timestampMs: Date.now() - 120 * 60 * 1000,
    expiryHours: 48,
    txHash: '7a4b2c9d1e0f3847561029384756a1b2c3d4e5f60718293a4b5c6d7e8f901928',
    ledgerIndex: 54191104,
    feeSavedUsd: 36.55,
  },
  {
    id: 'INV-9044',
    customerHandle: '@kaito_takahashi',
    customerName: 'Kaito Takahashi',
    asset: 'XLM',
    amount: 180.0,
    multiplexedAddress: 'MAQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4AAAAE4UQ2M',
    baseAddress: MERCHANT_IDENTITY.baseStellarAccount,
    memoId: '5501928374659182',
    description: '2 pairs of vintage minimalist sneakers',
    paylinkSlug: '?widget=main',
    status: 'Active',
    createdAt: 'Nov 12, 17:10',
    timestampMs: Date.now() - 180 * 60 * 1000,
    expiryHours: 24,
    feeSavedUsd: 0.92,
  },
  {
    id: 'INV-9043',
    customerHandle: '@devon_miles',
    customerName: 'Devon Miles',
    asset: 'USDC',
    amount: 85.0,
    multiplexedAddress: 'MAQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4AAAAF5VQ2M',
    baseAddress: MERCHANT_IDENTITY.baseStellarAccount,
    memoId: '4491827364501923',
    description: 'Annual SwiftUI Component Kit License',
    paylinkSlug: '?widget=youtube-marathon',
    status: 'Expired',
    createdAt: 'Nov 11, 19:20',
    timestampMs: Date.now() - 25 * 3600 * 1000,
    expiryHours: 24,
    feeSavedUsd: 0,
  },
  {
    id: 'INV-9042',
    customerHandle: '@claire_dubois',
    customerName: 'Claire Dubois',
    asset: 'USDC',
    amount: 640.0,
    multiplexedAddress: 'MAQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4AAAAG6WQ2M',
    baseAddress: MERCHANT_IDENTITY.baseStellarAccount,
    memoId: '3381726354901827',
    description: 'Design Systems Workshop Seat x2',
    paylinkSlug: '?widget=main',
    status: 'Settled',
    createdAt: 'Nov 11, 15:40',
    timestampMs: Date.now() - 29 * 3600 * 1000,
    expiryHours: 24,
    txHash: '9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a094821',
    ledgerIndex: 54175920,
    feeSavedUsd: 18.86,
  },
];

export const INITIAL_WEBHOOKS: WebhookDelivery[] = [
  {
    id: 'wh_992841',
    invoiceId: 'INV-9047',
    event: 'invoice.settled',
    endpoint: MERCHANT_IDENTITY.webhookUrl,
    hmacSignature: 'sha256=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    statusCode: 200,
    latencyMs: 68,
    timestamp: '14 mins ago',
    payloadPreview: '{"event":"invoice.settled","invoice_id":"INV-9047","amount":"240.00","asset":"USDC","ledger":54192840}',
  },
  {
    id: 'wh_992819',
    invoiceId: 'INV-9046',
    event: 'invoice.settled',
    endpoint: MERCHANT_IDENTITY.webhookUrl,
    hmacSignature: 'sha256=4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    statusCode: 200,
    latencyMs: 74,
    timestamp: '41 mins ago',
    payloadPreview: '{"event":"invoice.settled","invoice_id":"INV-9046","amount":"420.00","asset":"XLM","ledger":54192512}',
  },
  {
    id: 'wh_992750',
    invoiceId: 'INV-9045',
    event: 'invoice.settled',
    endpoint: MERCHANT_IDENTITY.webhookUrl,
    hmacSignature: 'sha256=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    statusCode: 200,
    latencyMs: 52,
    timestamp: '2 hours ago',
    payloadPreview: '{"event":"invoice.settled","invoice_id":"INV-9045","amount":"1250.00","asset":"USDC","ledger":54191104}',
  },
];

export const VOICE_PRESET_PROMPTS = [
  {
    id: 'vp-1',
    label: '50 USDC · Vintage Shoes (@alex)',
    transcript: 'Create an invoice for 50 USDC for 2 pairs of vintage shoes from user @alex',
    extracted: {
      amount: 50.0,
      asset: 'USDC' as AssetType,
      customerHandle: '@alex',
      customerName: 'Alex Mercer',
      description: '2 pairs of vintage shoes',
      expiryHours: 24,
    },
  },
  {
    id: 'vp-2',
    label: '120 XLM · Graphic Design (@sarah)',
    transcript: 'Bill @sarah 120 XLM for graphic design work due within 12 hours',
    extracted: {
      amount: 120.0,
      asset: 'XLM' as AssetType,
      customerHandle: '@sarah',
      customerName: 'Sarah Chen',
      description: 'Graphic design work & vector icons',
      expiryHours: 12,
    },
  },
  {
    id: 'vp-3',
    label: '350 USDC · Stream Rig Audit (@marcus)',
    transcript: 'Send an invoice of 350 USDC to @marcus for OBS audio calibration and LUT pack',
    extracted: {
      amount: 350.0,
      asset: 'USDC' as AssetType,
      customerHandle: '@marcus',
      customerName: 'Marcus Vance',
      description: 'OBS audio calibration and LUT pack',
      expiryHours: 48,
    },
  },
];
