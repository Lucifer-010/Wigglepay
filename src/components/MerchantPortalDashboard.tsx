import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Inbox,
  Send,
  Play,
  TrendingUp,
  Mic,
  Bot,
  Code2,
  ChevronRight,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  Invoice,
  AssetType,
  WebhookDelivery,
  TipLinkCard,
  MERCHANT_IDENTITY,
  VOICE_PRESET_PROMPTS,
  generateMemo64Bit,
  generateMultiplexedAddress,
} from '../data/wigglePayData';

interface MerchantPortalDashboardProps {
  invoices: Invoice[];
  webhooks: WebhookDelivery[];
  tipLinks: TipLinkCard[];
  activeView: 'overview' | 'invoices' | 'webhooks' | 'settings';
  onOpenInvoiceInWidget: (inv: Invoice) => void;
  onSettleInvoice: (invoiceId: string) => void;
  onExpireInvoice: (invoiceId: string) => void;
  onCreateInvoice: (newInv: Invoice) => void;
  onDispatchTestWebhook: () => void;
  onJumpToTipLinks: () => void;
  onOpenEmbedCode: () => void;
  onOpenTelegram: () => void;
  onSwitchToHistory: () => void;
  onTestTipFlow: (amount: number, asset: AssetType, message: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCommandPalette: () => void;
}

type StatusFilter = 'All' | 'Settled' | 'Active' | 'Expired';
type AssetFilter = 'All' | 'USDC' | 'XLM';
type SortField = 'id' | 'customerHandle' | 'asset' | 'amount' | 'status' | 'timestampMs';
type ChartRange = '24H' | '7D' | '30D';

interface ChartPoint {
  label: string;
  sublabel: string;
  usdcVolume: number;
  xlmVolumeUsd: number;
  txCount: number;
}

const CHART_DATASETS: Record<ChartRange, ChartPoint[]> = {
  '24H': [
    { label: '00:00', sublabel: 'Midnight – 04:00', usdcVolume: 180, xlmVolumeUsd: 45, txCount: 4 },
    { label: '04:00', sublabel: '04:00 – 08:00', usdcVolume: 120, xlmVolumeUsd: 30, txCount: 3 },
    { label: '08:00', sublabel: '08:00 – 12:00', usdcVolume: 340, xlmVolumeUsd: 85, txCount: 7 },
    { label: '12:00', sublabel: '12:00 – 16:00', usdcVolume: 510, xlmVolumeUsd: 110, txCount: 11 },
    { label: '16:00', sublabel: '16:00 – 20:00', usdcVolume: 460, xlmVolumeUsd: 95, txCount: 9 },
    { label: '20:00', sublabel: '20:00 – Now', usdcVolume: 690, xlmVolumeUsd: 140, txCount: 15 },
  ],
  '7D': [
    { label: 'Fri', sublabel: 'Nov 6', usdcVolume: 820, xlmVolumeUsd: 190, txCount: 18 },
    { label: 'Sat', sublabel: 'Nov 7', usdcVolume: 1140, xlmVolumeUsd: 260, txCount: 24 },
    { label: 'Sun', sublabel: 'Nov 8', usdcVolume: 980, xlmVolumeUsd: 210, txCount: 21 },
    { label: 'Mon', sublabel: 'Nov 9', usdcVolume: 1390, xlmVolumeUsd: 310, txCount: 29 },
    { label: 'Tue', sublabel: 'Nov 10', usdcVolume: 1260, xlmVolumeUsd: 245, txCount: 26 },
    { label: 'Wed', sublabel: 'Nov 11', usdcVolume: 1680, xlmVolumeUsd: 380, txCount: 35 },
    { label: 'Thu', sublabel: 'Today · Nov 12', usdcVolume: 2130, xlmVolumeUsd: 420, txCount: 42 },
  ],
  '30D': [
    { label: 'W1', sublabel: 'Oct 15 – Oct 21', usdcVolume: 4200, xlmVolumeUsd: 890, txCount: 84 },
    { label: 'W2', sublabel: 'Oct 22 – Oct 28', usdcVolume: 5180, xlmVolumeUsd: 1120, txCount: 106 },
    { label: 'W3', sublabel: 'Oct 29 – Nov 4', usdcVolume: 6340, xlmVolumeUsd: 1410, txCount: 129 },
    { label: 'W4', sublabel: 'Nov 5 – Nov 12', usdcVolume: 8420, xlmVolumeUsd: 1950, txCount: 168 },
  ],
};

export const MerchantPortalDashboard: React.FC<MerchantPortalDashboardProps> = ({
  invoices,
  webhooks,
  tipLinks,
  activeView,
  onOpenInvoiceInWidget,
  onSettleInvoice,
  onExpireInvoice,
  onCreateInvoice,
  onDispatchTestWebhook,
  onJumpToTipLinks,
  onOpenEmbedCode,
  onOpenTelegram,
  onSwitchToHistory,
  onTestTipFlow,
  searchQuery,
  onSearchChange,
  onOpenCommandPalette,
}) => {
  // Clean History Table State
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [assetFilter, setAssetFilter] = useState<AssetFilter>('All');
  const [sortField, setSortField] = useState<SortField>('timestampMs');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [inspectedInvoice, setInspectedInvoice] = useState<Invoice | null>(null);
  const [isSimulatingLoading, setIsSimulatingLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [csvExported, setCsvExported] = useState(false);

  // Overview Mini Chart State
  const [chartRange, setChartRange] = useState<ChartRange>('7D');
  const [selectedPointIdx, setSelectedPointIdx] = useState<number | null>(null);

  // Featured Widget & Paylink + Bot Quick State
  const [copiedWidgetUrl, setCopiedWidgetUrl] = useState(false);
  const [selectedQuickPayAmt, setSelectedQuickPayAmt] = useState<number>(25);
  const [voiceQuickSimulating, setVoiceQuickSimulating] = useState(false);

  // Quick Invoice Modal State
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState('@jordan_lee');
  const [newAmount, setNewAmount] = useState('125.00');
  const [newAsset, setNewAsset] = useState<AssetType>('USDC');
  const [newDescription, setNewDescription] = useState('macOS Sequoia Audio Plugin License');

  // Settings State
  const [payoutAddress, setPayoutAddress] = useState(MERCHANT_IDENTITY.baseStellarAccount);
  const [multiplexedEnabled, setMultiplexedEnabled] = useState(true);
  const [pathPaymentsEnabled, setPathPaymentsEnabled] = useState(true);
  const [savedSettingsBanner, setSavedSettingsBanner] = useState(false);

  // Featured Primary Widget & Paylink
  const featuredWidget = useMemo(
    () => tipLinks.find((t) => t.isPrimary) || tipLinks[0],
    [tipLinks]
  );

  // Summary KPI Calculations
  const metrics = useMemo(() => {
    const settledInvoices = invoices.filter((i) => i.status === 'Settled');
    const activeInvoices = invoices.filter((i) => i.status === 'Active');
    const expiredInvoices = invoices.filter((i) => i.status === 'Expired');

    const totalSettledUsd = settledInvoices.reduce((acc, inv) => {
      const usdVal = inv.asset === 'USDC' || inv.asset === 'USDT' ? inv.amount : inv.amount * 0.12;
      return acc + usdVal;
    }, 0);

    const pendingEscrowUsd = activeInvoices.reduce((acc, inv) => {
      const usdVal = inv.asset === 'USDC' || inv.asset === 'USDT' ? inv.amount : inv.amount * 0.12;
      return acc + usdVal;
    }, 0);

    const settlementRate =
      invoices.length > 0 ? ((settledInvoices.length / invoices.length) * 100).toFixed(1) : '0.0';
    const feesSaved = settledInvoices.reduce((acc, inv) => acc + inv.feeSavedUsd, 0);

    return {
      totalSettledUsd,
      pendingEscrowUsd,
      settledCount: settledInvoices.length,
      activeCount: activeInvoices.length,
      expiredCount: expiredInvoices.length,
      settlementRate,
      feesSaved,
    };
  }, [invoices]);

  // Mini Chart Data & Computed Points
  const currentChartData = CHART_DATASETS[chartRange];
  const activePoint =
    selectedPointIdx !== null && currentChartData[selectedPointIdx]
      ? currentChartData[selectedPointIdx]
      : currentChartData[currentChartData.length - 1];

  const chartMaxTotal = useMemo(() => {
    return Math.max(...currentChartData.map((d) => d.usdcVolume + d.xlmVolumeUsd), 100);
  }, [currentChartData]);

  // Filtered and Sorted Invoices
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        if (statusFilter !== 'All' && inv.status !== statusFilter) return false;
        if (assetFilter !== 'All' && inv.asset !== assetFilter) return false;

        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          return (
            inv.id.toLowerCase().includes(q) ||
            inv.customerHandle.toLowerCase().includes(q) ||
            inv.customerName.toLowerCase().includes(q) ||
            inv.description.toLowerCase().includes(q) ||
            inv.memoId.includes(q) ||
            inv.multiplexedAddress.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === 'amount') {
          comparison = a.amount - b.amount;
        } else if (sortField === 'timestampMs') {
          comparison = a.timestampMs - b.timestampMs;
        } else {
          comparison = String(a[sortField]).localeCompare(String(b[sortField]));
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [invoices, statusFilter, assetFilter, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const triggerSkeletonRefresh = () => {
    setIsSimulatingLoading(true);
    setTimeout(() => setIsSimulatingLoading(false), 500);
  };

  const handleCopyText = (text: string, idTag: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(idTag);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const handleExportCsv = () => {
    const headers = [
      'Invoice ID',
      'Date',
      'Supporter',
      'Paylink',
      'Asset',
      'Amount',
      'Status',
      'Memo ID',
      'M-Address',
    ];
    const rows = filteredInvoices.map((i) => [
      i.id,
      i.createdAt,
      i.customerHandle,
      i.paylinkSlug || '?widget=main',
      i.asset,
      i.amount.toFixed(2),
      i.status,
      i.memoId,
      i.multiplexedAddress,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    navigator.clipboard?.writeText(csv);
    setCsvExported(true);
    setTimeout(() => setCsvExported(false), 2000);
  };

  const handleInstantVoiceInvoice = () => {
    setVoiceQuickSimulating(true);
    const preset = VOICE_PRESET_PROMPTS[0];
    setTimeout(() => {
      const memoId = generateMemo64Bit();
      const mAddress = generateMultiplexedAddress(memoId);
      const created: Invoice = {
        id: `INV-${Math.floor(9055 + Math.random() * 900)}`,
        customerHandle: preset.extracted.customerHandle,
        customerName: preset.extracted.customerName,
        asset: preset.extracted.asset,
        amount: preset.extracted.amount,
        multiplexedAddress: mAddress,
        baseAddress: payoutAddress,
        memoId,
        description: `${preset.extracted.description} (via @WigglePayBot)`,
        paylinkSlug: '?widget=main',
        status: 'Active',
        createdAt: 'Just now',
        timestampMs: Date.now(),
        expiryHours: preset.extracted.expiryHours,
        feeSavedUsd: Number((preset.extracted.amount * 0.029 + 0.3).toFixed(2)),
      };
      onCreateInvoice(created);
      setVoiceQuickSimulating(false);
    }, 650);
  };

  const handleCreateQuickInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const memoId = generateMemo64Bit();
    const mAddress = generateMultiplexedAddress(memoId);
    const parsedAmt = Math.max(0.01, parseFloat(newAmount) || 50);
    const handle = newCustomer.startsWith('@') ? newCustomer : `@${newCustomer}`;

    const created: Invoice = {
      id: `INV-${Math.floor(9050 + Math.random() * 900)}`,
      customerHandle: handle,
      customerName: handle.replace('@', '').replace(/_/g, ' '),
      asset: newAsset,
      amount: parsedAmt,
      multiplexedAddress: mAddress,
      baseAddress: payoutAddress,
      memoId,
      description: newDescription.trim() || 'Direct Paylink Invoice',
      paylinkSlug: '?widget=main',
      status: 'Active',
      createdAt: 'Just now',
      timestampMs: Date.now(),
      expiryHours: 24,
      feeSavedUsd: Number((parsedAmt * 0.029 + 0.3).toFixed(2)),
    };

    onCreateInvoice(created);
    setShowNewInvoiceModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="sf-title-1 text-black dark:text-white">
            {activeView === 'overview' && 'Merchant Overview'}
            {activeView === 'invoices' && 'Payment & Paylink History'}
            {activeView === 'webhooks' && 'HMAC-SHA256 Webhook Dispatches'}
            {activeView === 'settings' && 'Stellar Routing & Settings'}
          </h1>
          <p className="sf-subheadline text-black/60 dark:text-white/60 mt-0.5">
            {activeView === 'overview' &&
              'Real-time Stellar settlement analytics, active widget & paylink, and Telegram AI bot companion'}
            {activeView === 'invoices' &&
              'Clean non-custodial transaction ledger with CAP-0027 M-address routing and instant settlement receipts'}
            {activeView === 'webhooks' &&
              'Cryptographically signed outbound HTTP notifications dispatched via Celery workers'}
            {activeView === 'settings' &&
              'Manage your non-custodial destination public key, SDEX path payment slippage, and API secrets'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowNewInvoiceModal(true)}
            className="apple-pressable px-4 py-2 rounded-[10px] bg-[#007AFF] dark:bg-[#0A84FF] hover:opacity-95 text-white sf-footnote font-semibold flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Paylink Invoice</span>
          </button>

          <button
            type="button"
            onClick={onJumpToTipLinks}
            className="apple-pressable px-4 py-2 rounded-[10px] bg-[#F2F2F7] dark:bg-[#1C1C1E] text-black dark:text-white sf-footnote font-semibold flex items-center gap-1.5 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#007AFF]" />
            <span>Widgets &amp; Paylinks</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          VIEW 1: MERCHANT OVERVIEW (KPIs + MINI CHART + 1 WIDGET + BOT INFO + RECENT LEDGER)
         ===================================================================== */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Row 1: 4 Summary Metrics (KPI Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-[18px] p-5 space-y-1.5">
              <div className="sf-footnote font-medium text-black/60 dark:text-white/60">
                Total Settled Volume
              </div>
              <div className="sf-title-1 sf-mono-tabular text-black dark:text-white">
                $
                {metrics.totalSettledUsd.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="sf-caption text-[#34C759] dark:text-[#30D158] font-medium">
                +18.4% this week · 3.8s avg finality
              </div>
            </div>

            <div className="bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-[18px] p-5 space-y-1.5">
              <div className="sf-footnote font-medium text-black/60 dark:text-white/60">
                Active Paylink Invoices
              </div>
              <div className="sf-title-1 sf-mono-tabular text-black dark:text-white">
                {metrics.activeCount}
              </div>
              <div className="sf-caption text-black/50 dark:text-white/50">
                ${metrics.pendingEscrowUsd.toFixed(2)} monitored via Horizon SSE
              </div>
            </div>

            <div className="bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-[18px] p-5 space-y-1.5">
              <div className="sf-footnote font-medium text-black/60 dark:text-white/60">
                Settlement Rate
              </div>
              <div className="sf-title-1 sf-mono-tabular text-black dark:text-white">
                {metrics.settlementRate}%
              </div>
              <div className="sf-caption text-[#007AFF] dark:text-[#0A84FF] font-medium">
                Zero base-reserve overhead (CAP-0027)
              </div>
            </div>

            <div className="bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-[18px] p-5 space-y-1.5">
              <div className="sf-footnote font-medium text-black/60 dark:text-white/60">
                Network Fees Saved
              </div>
              <div className="sf-title-1 sf-mono-tabular text-[#34C759] dark:text-[#30D158]">
                ${metrics.feesSaved.toFixed(2)}
              </div>
              <div className="sf-caption text-black/50 dark:text-white/50">
                vs. 2.9% + $0.30 legacy card rails
              </div>
            </div>
          </div>

          {/* Row 2: Interactive Mini Chart + 1 Featured Widget & Paylink + Telegram Bot Companion */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT (5 Cols): Settlement Velocity Mini Chart */}
            <div className="lg:col-span-5 bg-white dark:bg-[#1C1C1E] rounded-[20px] p-5 apple-card-elevated border border-black/6 dark:border-white/8 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#007AFF] dark:text-[#0A84FF]" />
                    <span className="sf-caption font-semibold uppercase tracking-wider text-black/45 dark:text-white/45">
                      Settlement Velocity
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="sf-title-2 sf-mono-tabular text-black dark:text-white">
                      ${(activePoint.usdcVolume + activePoint.xlmVolumeUsd).toLocaleString()}
                    </span>
                    <span className="sf-caption font-semibold text-[#34C759] dark:text-[#30D158] sf-mono-tabular">
                      {activePoint.txCount} settlements
                    </span>
                  </div>
                  <div className="sf-caption text-black/50 dark:text-white/50">
                    {activePoint.sublabel} ·{' '}
                    <span className="sf-mono-tabular text-[#007AFF] dark:text-[#0A84FF]">
                      ${activePoint.usdcVolume} USDC
                    </span>{' '}
                    +{' '}
                    <span className="sf-mono-tabular text-[#5856D6] dark:text-[#5E5CE6]">
                      ${activePoint.xlmVolumeUsd} XLM
                    </span>
                  </div>
                </div>

                {/* Apple Segmented Range Control: 24H | 7D | 30D */}
                <div className="inline-flex p-0.5 rounded-[8px] bg-[#F2F2F7] dark:bg-[#2C2C2E] shrink-0">
                  {(['24H', '7D', '30D'] as ChartRange[]).map((rng) => (
                    <button
                      key={rng}
                      type="button"
                      onClick={() => {
                        setChartRange(rng);
                        setSelectedPointIdx(null);
                      }}
                      className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-all ${
                        chartRange === rng
                          ? 'bg-white dark:bg-[#3A3A3C] text-black dark:text-white shadow-2xs'
                          : 'text-black/55 dark:text-white/55'
                      }`}
                    >
                      {rng}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Stacked Bar Mini Chart */}
              <div className="pt-2">
                <div className="h-36 flex items-end justify-between gap-2.5 px-1">
                  {currentChartData.map((pt, idx) => {
                    const total = pt.usdcVolume + pt.xlmVolumeUsd;
                    const heightPct = Math.max(16, Math.round((total / chartMaxTotal) * 100));
                    const usdcRatio = Math.round((pt.usdcVolume / total) * 100);
                    const isSelected =
                      selectedPointIdx === idx ||
                      (selectedPointIdx === null && idx === currentChartData.length - 1);

                    return (
                      <button
                        key={pt.label}
                        type="button"
                        onMouseEnter={() => setSelectedPointIdx(idx)}
                        onClick={() => setSelectedPointIdx(idx)}
                        className="flex-1 h-full flex flex-col items-center justify-end gap-2 group focus:outline-none"
                      >
                        <div className="w-full h-28 flex items-end justify-center">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPct}%` }}
                            transition={{ type: 'spring', duration: 0.45, bounce: 0.12 }}
                            className={`w-full max-w-[34px] rounded-[8px] overflow-hidden flex flex-col justify-end transition-opacity ${
                              isSelected
                                ? 'opacity-100 ring-2 ring-[#007AFF]/40 dark:ring-[#0A84FF]/50'
                                : 'opacity-65 group-hover:opacity-95'
                            }`}
                          >
                            <div
                              style={{ height: `${100 - usdcRatio}%` }}
                              className="w-full bg-[#5856D6] dark:bg-[#5E5CE6]"
                            />
                            <div
                              style={{ height: `${usdcRatio}%` }}
                              className="w-full bg-[#007AFF] dark:bg-[#0A84FF]"
                            />
                          </motion.div>
                        </div>
                        <span
                          className={`sf-mono-tabular text-[11px] ${
                            isSelected
                              ? 'font-bold text-[#007AFF] dark:text-[#0A84FF]'
                              : 'text-black/45 dark:text-white/45'
                          }`}
                        >
                          {pt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-black/6 dark:border-white/8 flex items-center justify-between sf-caption text-black/55 dark:text-white/55">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#007AFF] dark:bg-[#0A84FF]" />
                    <span>USDC (81%)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#5856D6] dark:bg-[#5E5CE6]" />
                    <span>XLM (19%)</span>
                  </span>
                </div>
                <span className="sf-mono-tabular text-[#34C759] dark:text-[#30D158] font-medium">
                  Horizon SSE Live
                </span>
              </div>
            </div>

            {/* MIDDLE (4 Cols): 1 Featured Widget & Paylink Showcase */}
            {featuredWidget && (
              <div className="lg:col-span-4 bg-white dark:bg-[#1C1C1E] rounded-[20px] overflow-hidden apple-card-elevated border border-black/6 dark:border-white/8 flex flex-col justify-between">
                <div>
                  <div
                    className="h-20 px-4 pt-3 flex items-start justify-between relative"
                    style={{
                      background:
                        'linear-gradient(135deg, #007AFF 0%, #5856D6 55%, #34C759 100%)',
                    }}
                  >
                    <span className="px-2.5 py-0.5 rounded-full bg-black/45 backdrop-blur-md text-white sf-caption font-semibold">
                      Featured Widget &amp; Paylink
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white sf-mono-tabular text-[11px] font-semibold">
                      {featuredWidget.slugQuery}
                    </span>
                  </div>

                  <div className="px-5 pb-4 -mt-6 relative z-10 space-y-3">
                    <div className="flex items-end justify-between gap-2">
                      <div className="w-12 h-12 rounded-full bg-[#1C1C1E] text-white font-bold text-base flex items-center justify-center border-[3px] border-white dark:border-[#1C1C1E] shadow-sm">
                        {featuredWidget.avatarInitials}
                      </div>
                      <button
                        type="button"
                        onClick={onJumpToTipLinks}
                        className="sf-caption font-semibold text-[#007AFF] dark:text-[#0A84FF] hover:underline flex items-center gap-0.5"
                      >
                        <span>All Widgets ({tipLinks.length})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <div className="sf-headline text-black dark:text-white">
                        {featuredWidget.title}
                      </div>
                      <p className="sf-caption text-black/55 dark:text-white/55 line-clamp-1">
                        {featuredWidget.description}
                      </p>
                    </div>

                    {/* Interactive Preset Amount Selector inside Featured Widget */}
                    <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                      {[10, 25, 50].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setSelectedQuickPayAmt(amt)}
                          className={`py-1.5 rounded-[8px] sf-mono-tabular sf-caption font-semibold transition-all ${
                            selectedQuickPayAmt === amt
                              ? 'bg-[#007AFF] text-white shadow-2xs'
                              : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-black/75 dark:text-white/75 hover:bg-black/8'
                          }`}
                        >
                          {amt} USDC
                        </button>
                      ))}
                    </div>

                    {/* Copyable Paylink URL Bar */}
                    <div className="px-3 py-1.5 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-between gap-2">
                      <span className="sf-mono-tabular text-[11px] text-black/65 dark:text-white/65 truncate">
                        {featuredWidget.url}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(featuredWidget.url);
                          setCopiedWidgetUrl(true);
                          setTimeout(() => setCopiedWidgetUrl(false), 1500);
                        }}
                        className="text-[#007AFF] dark:text-[#0A84FF] shrink-0"
                        title="Copy Paylink URL"
                      >
                        {copiedWidgetUrl ? (
                          <Check className="w-3.5 h-3.5 text-[#34C759]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="px-5 py-3.5 border-t border-black/6 dark:border-white/8 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onTestTipFlow(
                        selectedQuickPayAmt,
                        'USDC',
                        `Quick ${selectedQuickPayAmt} USDC payment from Featured Paylink!`
                      )
                    }
                    className="apple-pressable flex-1 py-2 rounded-[10px] bg-[#007AFF] dark:bg-[#0A84FF] text-white sf-caption font-semibold flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Pay {selectedQuickPayAmt} USDC</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenEmbedCode}
                    className="apple-pressable px-3 py-2 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] text-black dark:text-white sf-caption font-semibold flex items-center gap-1"
                  >
                    <Code2 className="w-3.5 h-3.5 text-[#007AFF]" />
                    <span>Embed</span>
                  </button>
                </div>
              </div>
            )}

            {/* RIGHT (3 Cols): Telegram Bot & AI Voice-to-Invoice Companion Info */}
            <div className="lg:col-span-3 bg-white dark:bg-[#1C1C1E] rounded-[20px] p-5 apple-card-elevated border border-black/6 dark:border-white/8 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-[12px] bg-[#007AFF]/12 dark:bg-[#0A84FF]/20 text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="sf-headline text-black dark:text-white leading-tight">
                        @WigglePayBot
                      </div>
                      <div className="sf-caption text-[#34C759] dark:text-[#30D158] font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                        <span>Telegram Bot Active</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="sf-caption text-black/60 dark:text-white/60 leading-relaxed">
                  Voice-to-Paylink NLP engine converts spoken Telegram audio notes into non-custodial Stellar `M...` invoices in under 1.2s.
                </p>

                <div className="p-3 rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E] space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-black/50 dark:text-white/50">
                    <span className="flex items-center gap-1 text-[#007AFF] dark:text-[#0A84FF]">
                      <Mic className="w-3 h-3" />
                      <span>Sample Voice Command</span>
                    </span>
                    <span className="sf-mono-tabular">99.4% NLP</span>
                  </div>
                  <p className="sf-caption italic text-black/80 dark:text-white/80">
                    “Create a paylink invoice for 50 USDC for 2 pairs of vintage shoes from @alex”
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleInstantVoiceInvoice}
                  disabled={voiceQuickSimulating}
                  className="apple-pressable w-full py-2 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-black/8 dark:hover:bg-white/12 text-black dark:text-white sf-caption font-semibold flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#007AFF]" />
                  <span>
                    {voiceQuickSimulating
                      ? 'Parsing Voice Note…'
                      : 'Simulate 50 USDC Voice Paylink'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onOpenTelegram}
                  className="apple-pressable w-full py-2 rounded-[10px] bg-[#007AFF] dark:bg-[#0A84FF] text-white sf-caption font-semibold flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Open Telegram Mini-App</span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 3: Clean Recent Settlements Table Preview in Overview */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] apple-card-elevated border border-black/6 dark:border-white/8 overflow-hidden">
            <div className="px-5 py-4 border-b border-black/6 dark:border-white/8 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="sf-headline text-black dark:text-white">
                  Recent Widget &amp; Paylink Activity
                </h2>
                <p className="sf-caption text-black/55 dark:text-white/55">
                  Latest settlements across your embedded widgets and shareable paylinks
                </p>
              </div>

              <button
                type="button"
                onClick={onSwitchToHistory}
                className="apple-pressable px-3.5 py-1.5 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#007AFF] dark:text-[#0A84FF] sf-footnote font-semibold flex items-center gap-1"
              >
                <span>View Full History ({invoices.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/6 dark:border-white/8 sf-caption font-semibold text-black/45 dark:text-white/45">
                    <th className="py-3 pl-5 pr-3">Invoice</th>
                    <th className="py-3 px-3">Supporter &amp; Note</th>
                    <th className="py-3 px-3">Widget / Paylink</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 pl-3 pr-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/6 sf-footnote">
                  {invoices.slice(0, 4).map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-[#F2F2F7]/60 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3.5 pl-5 pr-3 whitespace-nowrap">
                        <div className="sf-mono-tabular font-semibold text-black dark:text-white">
                          {inv.id}
                        </div>
                        <div className="sf-caption text-black/45 dark:text-white/45">
                          {inv.createdAt}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 max-w-[240px]">
                        <div className="font-semibold text-black dark:text-white truncate">
                          {inv.customerHandle}
                        </div>
                        <div className="sf-caption text-black/55 dark:text-white/55 truncate">
                          {inv.description}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-[8px] bg-[#5856D6]/10 text-[#5856D6] dark:text-[#A78BFA] sf-mono-tabular sf-caption font-semibold">
                          {inv.paylinkSlug || '?widget=main'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap sf-mono-tabular font-bold text-black dark:text-white">
                        {inv.amount.toFixed(2)}{' '}
                        <span className="text-xs font-semibold text-[#007AFF] dark:text-[#0A84FF]">
                          {inv.asset}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full sf-caption font-semibold ${
                            inv.status === 'Settled'
                              ? 'bg-[#34C759]/14 text-[#248A3D] dark:text-[#30D158]'
                              : inv.status === 'Active'
                              ? 'bg-[#007AFF]/14 text-[#007AFF] dark:text-[#0A84FF]'
                              : 'bg-[#FF3B30]/14 text-[#FF3B30] dark:text-[#FF453A]'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {inv.status === 'Active' && (
                            <button
                              type="button"
                              onClick={() => onSettleInvoice(inv.id)}
                              className="apple-pressable px-2.5 py-1 rounded-[8px] bg-[#34C759]/15 text-[#248A3D] dark:text-[#30D158] sf-caption font-semibold"
                            >
                              Settle
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setInspectedInvoice(inv)}
                            className="apple-pressable px-2.5 py-1 rounded-[8px] bg-[#F2F2F7] dark:bg-[#2C2C2E] text-black dark:text-white sf-caption font-medium"
                          >
                            Receipt
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 2: CLEAN, WELL-ORGANIZED PAYMENT & PAYLINK HISTORY
         ===================================================================== */}
      {activeView === 'invoices' && (
        <div className="space-y-5">
          {/* 4-Card Analytical Summary Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-[16px] p-4 flex items-center justify-between">
              <div>
                <div className="sf-caption text-black/55 dark:text-white/55">Settled Volume</div>
                <div className="sf-title-2 sf-mono-tabular text-black dark:text-white mt-0.5">
                  ${metrics.totalSettledUsd.toFixed(2)}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#34C759]/14 text-[#248A3D] dark:text-[#30D158] sf-mono-tabular sf-caption font-semibold">
                {metrics.settledCount} settled
              </span>
            </div>

            <div className="bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-[16px] p-4 flex items-center justify-between">
              <div>
                <div className="sf-caption text-black/55 dark:text-white/55">Pending Horizon</div>
                <div className="sf-title-2 sf-mono-tabular text-black dark:text-white mt-0.5">
                  ${metrics.pendingEscrowUsd.toFixed(2)}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#007AFF]/14 text-[#007AFF] dark:text-[#0A84FF] sf-mono-tabular sf-caption font-semibold">
                {metrics.activeCount} active
              </span>
            </div>

            <div className="bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-[16px] p-4 flex items-center justify-between">
              <div>
                <div className="sf-caption text-black/55 dark:text-white/55">Expired Quotes</div>
                <div className="sf-title-2 sf-mono-tabular text-black dark:text-white mt-0.5">
                  {metrics.expiredCount}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#FF3B30]/14 text-[#FF3B30] dark:text-[#FF453A] sf-caption font-semibold">
                24h TTL
              </span>
            </div>

            <div className="bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-[16px] p-4 flex items-center justify-between">
              <div>
                <div className="sf-caption text-black/55 dark:text-white/55">Card Fees Saved</div>
                <div className="sf-title-2 sf-mono-tabular text-[#34C759] dark:text-[#30D158] mt-0.5">
                  ${metrics.feesSaved.toFixed(2)}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-black/6 dark:bg-white/10 text-black/70 dark:text-white/70 sf-mono-tabular sf-caption font-semibold">
                0.1% Fee
              </span>
            </div>
          </div>

          {/* Clean Structured Ledger Card */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] apple-card-elevated border border-black/6 dark:border-white/8 overflow-hidden">
            {/* Single Clean Filter & Search Toolbar */}
            <div className="p-4 sm:px-5 border-b border-black/6 dark:border-white/8 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Status Segmented Control */}
                <div
                  role="tablist"
                  aria-label="Filter by Status"
                  className="inline-flex p-1 rounded-[8px] bg-[#F2F2F7] dark:bg-[#2C2C2E]"
                >
                  {(['All', 'Settled', 'Active', 'Expired'] as StatusFilter[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      role="tab"
                      aria-selected={statusFilter === st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded-[6px] sf-caption font-semibold transition-all ${
                        statusFilter === st
                          ? 'bg-white dark:bg-[#3A3A3C] text-black dark:text-white shadow-2xs'
                          : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      {st === 'Active' ? 'Pending' : st}
                    </button>
                  ))}
                </div>

                {/* Asset Segmented Control */}
                <div className="inline-flex p-1 rounded-[8px] bg-[#F2F2F7] dark:bg-[#2C2C2E]">
                  {(['All', 'USDC', 'XLM'] as AssetFilter[]).map((ast) => (
                    <button
                      key={ast}
                      type="button"
                      onClick={() => setAssetFilter(ast)}
                      className={`px-2.5 py-1 rounded-[6px] sf-caption font-semibold transition-all ${
                        assetFilter === ast
                          ? 'bg-[#007AFF] text-white shadow-2xs'
                          : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      {ast === 'All' ? 'All Assets' : ast}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Search Input + CSV Export + Sync */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 text-black/40 dark:text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Filter by supporter, memo, or ID…"
                    className="w-full sm:w-56 pl-8 pr-3 py-1.5 rounded-[8px] bg-[#F2F2F7] dark:bg-[#2C2C2E] sf-caption text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="apple-pressable px-3 py-1.5 rounded-[8px] bg-[#F2F2F7] dark:bg-[#2C2C2E] sf-caption font-medium text-black/80 dark:text-white/80 flex items-center gap-1.5"
                >
                  {csvExported ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#34C759]" />
                      <span className="text-[#34C759] font-semibold">Copied CSV</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={triggerSkeletonRefresh}
                  className="apple-pressable px-3 py-1.5 rounded-[8px] bg-[#F2F2F7] dark:bg-[#2C2C2E] sf-caption font-medium text-black/80 dark:text-white/80 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingLoading ? 'animate-spin' : ''}`} />
                  <span>Sync</span>
                </button>
              </div>
            </div>

            {/* Clean 6-Column Payment History Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/8 dark:border-white/10 bg-[#F2F2F7]/50 dark:bg-white/[0.02] sf-caption font-semibold text-black/50 dark:text-white/50 select-none">
                    <th className="py-3 pl-5 pr-3">
                      <button
                        type="button"
                        onClick={() => handleSort('timestampMs')}
                        className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white"
                      >
                        <span>Invoice &amp; Date</span>
                        {sortField === 'timestampMs' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleSort('customerHandle')}
                        className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white"
                      >
                        <span>Supporter &amp; Remark</span>
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      </button>
                    </th>
                    <th className="py-3 px-3">Widget / Paylink</th>
                    <th className="py-3 px-3">Stellar Routing (CAP-0027)</th>
                    <th className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort('amount')}
                        className="inline-flex items-center gap-1 ml-auto hover:text-black dark:hover:text-white"
                      >
                        <span>Amount</span>
                        {sortField === 'amount' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleSort('status')}
                        className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white"
                      >
                        <span>Status</span>
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      </button>
                    </th>
                    <th className="py-3 pl-3 pr-5 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-black/6 dark:divide-white/8 sf-footnote">
                  {isSimulatingLoading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="h-16">
                        <td colSpan={7} className="px-5 py-3">
                          <div className="h-8 rounded-[8px] apple-skeleton" />
                        </td>
                      </tr>
                    ))
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="max-w-xs mx-auto flex flex-col items-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-center text-black/40 dark:text-white/40">
                            <Inbox className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <div className="sf-headline text-black dark:text-white">
                              No Matching Records
                            </div>
                            <p className="sf-footnote text-black/55 dark:text-white/55">
                              No Stellar paylink transactions match your current filter criteria.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setStatusFilter('All');
                              setAssetFilter('All');
                              onSearchChange('');
                            }}
                            className="apple-pressable px-3.5 py-1.5 rounded-[10px] bg-[#007AFF] text-white sf-footnote font-semibold"
                          >
                            Reset Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-[#F2F2F7]/60 dark:hover:bg-white/[0.03] transition-colors"
                      >
                        {/* 1. Invoice & Date */}
                        <td className="py-3.5 pl-5 pr-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setInspectedInvoice(inv)}
                            className="sf-mono-tabular font-semibold text-[#007AFF] dark:text-[#0A84FF] hover:underline block"
                          >
                            {inv.id}
                          </button>
                          <span className="sf-caption text-black/45 dark:text-white/45 sf-mono-tabular">
                            {inv.createdAt}
                          </span>
                        </td>

                        {/* 2. Supporter & Remark */}
                        <td className="py-3.5 px-3 max-w-[240px]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] text-black dark:text-white font-bold sf-caption flex items-center justify-center shrink-0">
                              {inv.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-black dark:text-white truncate">
                                {inv.customerHandle}
                              </div>
                              <div className="sf-caption text-black/55 dark:text-white/55 truncate">
                                {inv.description}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3. Widget / Paylink */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-[8px] bg-[#5856D6]/10 text-[#5856D6] dark:text-[#A78BFA] sf-mono-tabular sf-caption font-semibold">
                            {inv.paylinkSlug || '?widget=main'}
                          </span>
                        </td>

                        {/* 4. Stellar Routing (M-Address + Memo) */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyText(inv.multiplexedAddress, inv.id)}
                              className="px-2 py-0.5 rounded-[6px] bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-black/8 dark:hover:bg-white/12 sf-mono-tabular text-[11px] text-black/80 dark:text-white/80 inline-flex items-center gap-1"
                              title="Copy Multiplexed M-Address"
                            >
                              <span>
                                {inv.multiplexedAddress.slice(0, 6)}…
                                {inv.multiplexedAddress.slice(-5)}
                              </span>
                              {copiedId === inv.id ? (
                                <Check className="w-3 h-3 text-[#34C759]" />
                              ) : (
                                <Copy className="w-3 h-3 text-[#007AFF]" />
                              )}
                            </button>
                          </div>
                          <div className="sf-mono-tabular text-[11px] text-black/45 dark:text-white/45 mt-0.5">
                            Memo #{inv.memoId.slice(0, 8)}…
                          </div>
                        </td>

                        {/* 5. Amount */}
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <div className="sf-mono-tabular font-bold text-black dark:text-white">
                            {inv.amount.toFixed(2)}{' '}
                            <span className="text-xs font-semibold text-[#007AFF] dark:text-[#0A84FF]">
                              {inv.asset}
                            </span>
                          </div>
                          {inv.feeSavedUsd > 0 && (
                            <div className="sf-mono-tabular text-[11px] text-[#34C759]">
                              Saved ${inv.feeSavedUsd.toFixed(2)}
                            </div>
                          )}
                        </td>

                        {/* 6. Status */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full sf-caption font-semibold ${
                              inv.status === 'Settled'
                                ? 'bg-[#34C759]/14 text-[#248A3D] dark:text-[#30D158]'
                                : inv.status === 'Active'
                                ? 'bg-[#007AFF]/14 text-[#007AFF] dark:text-[#0A84FF]'
                                : 'bg-[#FF3B30]/14 text-[#FF3B30] dark:text-[#FF453A]'
                            }`}
                          >
                            {inv.status === 'Settled' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : inv.status === 'Active' ? (
                              <Clock className="w-3 h-3" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            <span>{inv.status}</span>
                          </span>
                        </td>

                        {/* 7. Clean Actions */}
                        <td className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {inv.status === 'Active' && (
                              <button
                                type="button"
                                onClick={() => onSettleInvoice(inv.id)}
                                className="apple-pressable px-2.5 py-1 rounded-[8px] bg-[#34C759]/15 hover:bg-[#34C759]/25 text-[#248A3D] dark:text-[#30D158] sf-caption font-semibold"
                              >
                                Settle
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => onOpenInvoiceInWidget(inv)}
                              className="apple-pressable px-2.5 py-1 rounded-[8px] bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-black/8 dark:hover:bg-white/12 text-black dark:text-white sf-caption font-medium"
                            >
                              Widget
                            </button>

                            <button
                              type="button"
                              onClick={() => setInspectedInvoice(inv)}
                              className="apple-pressable px-2.5 py-1 rounded-[8px] bg-[#007AFF]/10 text-[#007AFF] dark:text-[#0A84FF] sf-caption font-semibold"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* WEBHOOKS SECTION */}
      {activeView === 'webhooks' && (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-5 sm:p-6 apple-card-elevated border border-black/6 dark:border-white/8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="sf-title-2 text-black dark:text-white">
                Outbound Webhook Deliveries
              </h2>
              <p className="sf-footnote text-black/55 dark:text-white/55 sf-mono-tabular truncate">
                Endpoint: {MERCHANT_IDENTITY.webhookUrl}
              </p>
            </div>
            <button
              type="button"
              onClick={onDispatchTestWebhook}
              className="apple-pressable px-4 py-2 rounded-[10px] bg-[#007AFF] text-white sf-footnote font-semibold flex items-center gap-2 self-start"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Test HMAC Webhook</span>
            </button>
          </div>

          <div className="space-y-3">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="p-4 rounded-[14px] bg-[#F2F2F7] dark:bg-[#2C2C2E] space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#34C759]/15 text-[#248A3D] dark:text-[#30D158] sf-mono-tabular sf-caption font-semibold">
                      {wh.statusCode} OK
                    </span>
                    <span className="sf-mono-tabular sf-footnote font-semibold text-black dark:text-white">
                      {wh.event}
                    </span>
                    <span className="sf-caption text-black/50 dark:text-white/50">
                      · {wh.invoiceId}
                    </span>
                  </div>
                  <span className="sf-mono-tabular sf-caption text-black/50 dark:text-white/50">
                    {wh.latencyMs}ms · {wh.timestamp}
                  </span>
                </div>
                <div className="sf-mono-tabular text-[11px] text-black/60 dark:text-white/60 truncate">
                  X-WigglePay-Signature: {wh.hmacSignature}
                </div>
                <pre className="p-2.5 rounded-[10px] bg-black/85 text-[#30D158] sf-mono-tabular text-xs overflow-x-auto">
                  {wh.payloadPreview}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SETTINGS SUB-VIEW */}
      {activeView === 'settings' && (
        <div className="max-w-3xl bg-white dark:bg-[#1C1C1E] rounded-[20px] p-5 sm:p-6 apple-card-elevated border border-black/6 dark:border-white/8 space-y-5">
          <h2 className="sf-title-2 text-black dark:text-white">
            Non-Custodial Stellar Settlement Configuration
          </h2>

          <div>
            <label className="block sf-footnote font-semibold text-black dark:text-white mb-1">
              Merchant Base Stellar Public Key (ED25519 G-Address)
            </label>
            <input
              type="text"
              value={payoutAddress}
              onChange={(e) => setPayoutAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] sf-mono-tabular sf-footnote text-black dark:text-white"
            />
            <p className="sf-caption text-black/50 dark:text-white/50 mt-1">
              WigglePay never holds your private keys. All widgets and paylinks encode a unique 64-bit sub-account ID onto this destination key.
            </p>
          </div>

          <div className="divide-y divide-black/8 dark:divide-white/10">
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <div className="sf-subheadline font-semibold text-black dark:text-white">
                  Multiplexed Account Routing (CAP-0027 MED25519)
                </div>
                <div className="sf-caption text-black/55 dark:text-white/55">
                  Generates virtual M-addresses per paylink invoice to eliminate 1 XLM base-reserve overhead.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMultiplexedEnabled((v) => !v)}
                className={`w-12 h-7 rounded-full p-0.5 transition-colors shrink-0 ${
                  multiplexedEnabled ? 'bg-[#34C759]' : 'bg-black/20 dark:bg-white/20'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white shadow-xs transition-transform ${
                    multiplexedEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <div className="sf-subheadline font-semibold text-black dark:text-white">
                  Stellar DEX Path Payment Auto-Conversion
                </div>
                <div className="sf-caption text-black/55 dark:text-white/55">
                  Allows supporters to pay in native XLM while you receive exact USDC via Horizon strict-receive paths.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPathPaymentsEnabled((v) => !v)}
                className={`w-12 h-7 rounded-full p-0.5 transition-colors shrink-0 ${
                  pathPaymentsEnabled ? 'bg-[#34C759]' : 'bg-black/20 dark:bg-white/20'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white shadow-xs transition-transform ${
                    pathPaymentsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {savedSettingsBanner ? (
              <span className="sf-footnote font-semibold text-[#34C759] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Configuration synced to Horizon Daemon
              </span>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => {
                setSavedSettingsBanner(true);
                setTimeout(() => setSavedSettingsBanner(false), 2500);
              }}
              className="apple-pressable px-5 py-2.5 rounded-[12px] bg-[#007AFF] text-white sf-subheadline font-semibold"
            >
              Save Routing Preferences
            </button>
          </div>
        </div>
      )}

      {/* Clean Apple HIG Receipt & Attribution Inspector Modal */}
      <AnimatePresence>
        {inspectedInvoice && (
          <div
            onClick={() => setInspectedInvoice(null)}
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg apple-material-floating rounded-[22px] p-6 space-y-5 text-black dark:text-white"
            >
              <div className="flex items-center justify-between border-b border-black/8 dark:border-white/10 pb-3.5">
                <div>
                  <span className="sf-caption font-semibold text-[#007AFF] dark:text-[#0A84FF]">
                    Stellar Paylink Attribution Receipt
                  </span>
                  <h3 className="sf-title-2">
                    {inspectedInvoice.id} · {inspectedInvoice.amount.toFixed(2)}{' '}
                    {inspectedInvoice.asset}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedInvoice(null)}
                  className="w-7 h-7 rounded-full bg-black/8 dark:bg-white/12 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 sf-footnote">
                <div className="p-3.5 rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-black/55 dark:text-white/55">Supporter</span>
                    <span className="font-semibold">{inspectedInvoice.customerHandle}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-black/55 dark:text-white/55">Widget / Paylink</span>
                    <span className="sf-mono-tabular font-semibold text-[#5856D6] dark:text-[#A78BFA]">
                      {inspectedInvoice.paylinkSlug || '?widget=main'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-black/55 dark:text-white/55">64-Bit Memo ID</span>
                    <span className="sf-mono-tabular font-semibold">
                      #{inspectedInvoice.memoId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-black/55 dark:text-white/55">Status</span>
                    <span className="font-semibold text-[#34C759]">
                      {inspectedInvoice.status}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E] space-y-1.5">
                  <div className="flex items-center justify-between sf-caption text-black/55 dark:text-white/55">
                    <span>Multiplexed Destination (CAP-0027 MED25519)</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(inspectedInvoice.multiplexedAddress, 'modal-m')
                      }
                      className="text-[#007AFF] font-semibold"
                    >
                      {copiedId === 'modal-m' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="sf-mono-tabular text-xs break-all">
                    {inspectedInvoice.multiplexedAddress}
                  </div>
                </div>

                {inspectedInvoice.txHash && (
                  <div className="flex items-center justify-between px-1 sf-caption">
                    <span className="text-black/55 dark:text-white/55">
                      Ledger #{inspectedInvoice.ledgerIndex || 54192840}
                    </span>
                    <a
                      href={`https://stellar.expert/explorer/public/tx/${inspectedInvoice.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#007AFF] font-semibold inline-flex items-center gap-1 hover:underline"
                    >
                      <span>View on Stellar.Expert</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {inspectedInvoice.status === 'Active' && (
                  <button
                    type="button"
                    onClick={() => {
                      onSettleInvoice(inspectedInvoice.id);
                      setInspectedInvoice(null);
                    }}
                    className="apple-pressable px-4 py-2 rounded-[10px] bg-[#34C759] text-white sf-footnote font-semibold"
                  >
                    Simulate Settlement
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onOpenInvoiceInWidget(inspectedInvoice);
                    setInspectedInvoice(null);
                  }}
                  className="apple-pressable px-4 py-2 rounded-[10px] bg-[#007AFF] text-white sf-footnote font-semibold"
                >
                  Open in Checkout Sheet
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick New Paylink Invoice Modal */}
      <AnimatePresence>
        {showNewInvoiceModal && (
          <div
            onClick={() => setShowNewInvoiceModal(false)}
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: 'spring', duration: 0.45, bounce: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleCreateQuickInvoice}
              className="w-full max-w-md apple-material-floating rounded-[20px] p-6 space-y-4 text-black dark:text-white"
            >
              <div className="flex items-center justify-between">
                <h3 className="sf-title-2">Create Paylink Invoice</h3>
                <button
                  type="button"
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="px-2.5 py-1 rounded-full bg-black/8 dark:bg-white/12 sf-caption font-semibold"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block sf-caption font-medium text-black/60 dark:text-white/60 mb-1">
                    Supporter Handle
                  </label>
                  <input
                    type="text"
                    value={newCustomer}
                    onChange={(e) => setNewCustomer(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] sf-subheadline"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block sf-caption font-medium text-black/60 dark:text-white/60 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] sf-mono-tabular sf-subheadline"
                      required
                    />
                  </div>
                  <div>
                    <label className="block sf-caption font-medium text-black/60 dark:text-white/60 mb-1">
                      Asset
                    </label>
                    <select
                      value={newAsset}
                      onChange={(e) => setNewAsset(e.target.value as AssetType)}
                      className="w-full px-3.5 py-2 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] sf-subheadline"
                    >
                      <option value="USDC">USDC</option>
                      <option value="XLM">XLM</option>
                      <option value="USDT">USDT</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block sf-caption font-medium text-black/60 dark:text-white/60 mb-1">
                    Memo / Item Description
                  </label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] sf-subheadline"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="apple-pressable w-full h-[48px] rounded-[12px] bg-[#007AFF] text-white sf-headline"
              >
                Provision M-Address &amp; Add to History
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
