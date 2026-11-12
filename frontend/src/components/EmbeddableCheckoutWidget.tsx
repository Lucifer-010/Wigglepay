import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Check,
  Copy,
  ShieldCheck,
  Wallet,
  QrCode,
  ExternalLink,
  Smartphone,
  Monitor,
  ArrowRightLeft,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  Invoice,
  AssetType,
  MERCHANT_IDENTITY,
} from '../data/wigglePayData';

export type WidgetState =
  | 'IDLE'
  | 'SIGNING'
  | 'BROADCASTING'
  | 'SUCCESS'
  | 'ERROR_SHAKE'
  | 'EXPIRED'
  | 'SKELETON';

interface EmbeddableCheckoutWidgetProps {
  invoices: Invoice[];
  selectedInvoice: Invoice;
  onSelectInvoice: (inv: Invoice) => void;
  onSettleInvoice: (invoiceId: string) => void;
  onRegenerateInvoice: (invoiceId: string) => void;
}

/**
 * Deterministic high-contrast SVG QR code generator with embedded Stellar glyph.
 */
const StellarQrCode: React.FC<{ value: string }> = ({ value }) => {
  const size = 21;
  const seed = value.split('').reduce((acc, char, idx) => acc + char.charCodeAt(0) * (idx + 1), 0);

  const isFinderPattern = (r: number, c: number) => {
    const inTopLeft = r < 7 && c < 7;
    const inTopRight = r < 7 && c >= size - 7;
    const inBottomLeft = r >= size - 7 && c < 7;
    return inTopLeft || inTopRight || inBottomLeft;
  };

  const getFinderPixel = (r: number, c: number) => {
    const lr = r >= size - 7 ? r - (size - 7) : r;
    const lc = c >= size - 7 ? c - (size - 7) : c;
    if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
    if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
    return false;
  };

  const isCenterLogoZone = (r: number, c: number) => {
    return r >= 8 && r <= 12 && c >= 8 && c <= 12;
  };

  return (
    <div className="relative p-3.5 bg-white rounded-[18px] border border-black/10 shadow-xs inline-flex items-center justify-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-40 h-40 shape-rendering-crispEdges"
        aria-label="Stellar Multiplexed Payment QR Code"
      >
        {Array.from({ length: size }).map((_, r) =>
          Array.from({ length: size }).map((__, c) => {
            if (isCenterLogoZone(r, c)) return null;
            let filled = false;
            if (isFinderPattern(r, c)) {
              filled = getFinderPixel(r, c);
            } else {
              const hash = Math.sin(seed + r * 31 + c * 17) * 10000;
              filled = hash - Math.floor(hash) > 0.44;
            }
            if (!filled) return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={c}
                y={r}
                width={0.92}
                height={0.92}
                rx={0.2}
                fill="#000000"
              />
            );
          })
        )}
      </svg>

      {/* Center Embedded Stellar Logo Glyph */}
      <div className="absolute w-9 h-9 rounded-[10px] bg-black text-white flex items-center justify-center shadow-md border-2 border-white">
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M19.8 5.2L4.2 13.1c-.6.3-.9 1-.6 1.6.3.6 1 .9 1.6.6l15.6-7.9c.6-.3.9-1 .6-1.6-.3-.6-1-.9-1.6-.6zm-1.2 4.9L3 18c-.6.3-.9 1-.6 1.6.3.6 1 .9 1.6.6l15.6-7.9c.6-.3.9-1 .6-1.6-.3-.6-1-.9-1.6-.6z" />
        </svg>
      </div>
    </div>
  );
};

export const EmbeddableCheckoutWidget: React.FC<EmbeddableCheckoutWidgetProps> = ({
  invoices,
  selectedInvoice,
  onSelectInvoice,
  onSettleInvoice,
  onRegenerateInvoice,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'manual'>('wallet');
  const [selectedWallet, setSelectedWallet] = useState<'Freighter' | 'Albedo'>('Freighter');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [widgetState, setWidgetState] = useState<WidgetState>(
    selectedInvoice.status === 'Settled'
      ? 'SUCCESS'
      : selectedInvoice.status === 'Expired'
      ? 'EXPIRED'
      : 'IDLE'
  );
  const [copiedField, setCopiedField] = useState<'address' | 'memo' | null>(null);
  const [pathPaymentEnabled, setPathPaymentEnabled] = useState(false);
  const [greenFlash, setGreenFlash] = useState(false);
  const [donorNote, setDonorNote] = useState(selectedInvoice.description);
  const [customTestAddress, setCustomTestAddress] = useState('');

  useEffect(() => {
    setDonorNote(selectedInvoice.description);
    if (selectedInvoice.status === 'Settled') {
      setWidgetState('SUCCESS');
    } else if (selectedInvoice.status === 'Expired') {
      setWidgetState('EXPIRED');
    } else {
      setWidgetState('IDLE');
    }
  }, [selectedInvoice]);

  const handleCopy = (text: string, field: 'address' | 'memo') => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleExecutePayment = () => {
    if (widgetState === 'SIGNING' || widgetState === 'BROADCASTING') return;

    // Validate optional test address if user entered an invalid Stellar public key
    if (customTestAddress.trim() !== '' && !customTestAddress.startsWith('G') && !customTestAddress.startsWith('M')) {
      setWidgetState('ERROR_SHAKE');
      setTimeout(() => setWidgetState('IDLE'), 1200);
      return;
    }

    setWidgetState('SIGNING');
    setTimeout(() => {
      setWidgetState('BROADCASTING');
      setTimeout(() => {
        setGreenFlash(true);
        setWidgetState('SUCCESS');
        onSettleInvoice(selectedInvoice.id);
        setTimeout(() => setGreenFlash(false), 900);
      }, 1100);
    }, 850);
  };

  const triggerInvalidAddressShake = () => {
    setWidgetState('ERROR_SHAKE');
    setTimeout(() => {
      setWidgetState(selectedInvoice.status === 'Settled' ? 'SUCCESS' : 'IDLE');
    }, 900);
  };

  const convertedXlmAmount =
    selectedInvoice.asset === 'USDC'
      ? (selectedInvoice.amount * 8.42).toFixed(2)
      : (selectedInvoice.amount / 8.42).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Top Controls Bar for Inspecting the Embeddable Checkout Widget */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#1C1C1E] p-4 rounded-[18px] apple-card-elevated border border-black/8 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="sf-footnote font-semibold text-black/60 dark:text-white/60">
            Active Invoice:
          </span>
          <select
            value={selectedInvoice.id}
            onChange={(e) => {
              const found = invoices.find((inv) => inv.id === e.target.value);
              if (found) onSelectInvoice(found);
            }}
            aria-label="Select Active Invoice"
            className="px-3 py-1.5 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] text-black dark:text-white sf-footnote font-medium sf-mono-tabular focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
          >
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.id} · {inv.amount.toFixed(2)} {inv.asset} ({inv.customerHandle}) [{inv.status}]
              </option>
            ))}
          </select>

          {/* Form Factor Switcher: Desktop Centered Card vs Mobile Anchored Bottom-Sheet */}
          <div className="flex items-center p-1 rounded-[8px] bg-[#F2F2F7] dark:bg-[#2C2C2E]">
            <button
              type="button"
              onClick={() => setViewportMode('desktop')}
              className={`px-2.5 py-1 rounded-[6px] sf-caption font-medium flex items-center gap-1.5 transition-all ${
                viewportMode === 'desktop'
                  ? 'bg-white dark:bg-[#3A3A3C] text-black dark:text-white shadow-xs'
                  : 'text-black/60 dark:text-white/60'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop Sheet (420px)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewportMode('mobile')}
              className={`px-2.5 py-1 rounded-[6px] sf-caption font-medium flex items-center gap-1.5 transition-all ${
                viewportMode === 'mobile'
                  ? 'bg-white dark:bg-[#3A3A3C] text-black dark:text-white shadow-xs'
                  : 'text-black/60 dark:text-white/60'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>iOS Bottom Sheet</span>
            </button>
          </div>
        </div>

        {/* Interactive State Machine Triggers */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="sf-caption text-black/50 dark:text-white/50 mr-1">State Inspector:</span>
          {(['IDLE', 'SIGNING', 'BROADCASTING', 'SUCCESS', 'EXPIRED', 'SKELETON'] as WidgetState[]).map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => setWidgetState(st)}
                className={`px-2.5 py-1 rounded-[8px] sf-caption font-medium transition-all ${
                  widgetState === st
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white'
                }`}
              >
                {st === 'IDLE'
                  ? 'Default'
                  : st === 'SIGNING'
                  ? 'Signing'
                  : st === 'BROADCASTING'
                  ? 'Pulsing Ring'
                  : st === 'SUCCESS'
                  ? 'Settled'
                  : st === 'EXPIRED'
                  ? 'Expired'
                  : 'Skeleton'}
              </button>
            )
          )}
          <button
            type="button"
            onClick={triggerInvalidAddressShake}
            className="px-2.5 py-1 rounded-[8px] bg-[#FF3B30]/12 text-[#FF3B30] sf-caption font-semibold hover:bg-[#FF3B30]/20 transition-colors"
          >
            Haptic Shake
          </button>
        </div>
      </div>

      {/* Interactive Presentation Stage */}
      <div
        className={`relative rounded-[24px] border border-black/8 dark:border-white/10 overflow-hidden transition-colors duration-500 flex items-center justify-center ${
          viewportMode === 'mobile' ? 'min-h-[700px] bg-black/5 dark:bg-black/40 py-8' : 'min-h-[620px] py-10'
        }`}
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 0%, rgba(0, 122, 255, 0.08), transparent 65%)',
        }}
      >
        {/* Full-screen subtle green flash on settlement */}
        <AnimatePresence>
          {greenFlash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 bg-[#34C759]/20 backdrop-blur-[4px] pointer-events-none z-20"
            />
          )}
        </AnimatePresence>

        {/* Mobile Device Frame Wrapper if Mobile Bottom-Sheet Mode is active */}
        <div
          className={
            viewportMode === 'mobile'
              ? 'w-[390px] max-w-full bg-[#E5E5EA] dark:bg-[#09090B] rounded-[44px] pt-14 pb-0 px-0 border-[6px] border-black/80 dark:border-white/15 shadow-2xl overflow-hidden flex flex-col justify-end relative'
              : 'w-full flex items-center justify-center px-4'
          }
        >
          {viewportMode === 'mobile' && (
            <div className="px-6 pb-8 text-center opacity-50 select-none">
              <p className="sf-caption text-black dark:text-white">
                Merchant Storefront Context · Pull sheet with rubber-band physics
              </p>
            </div>
          )}

          {/* THE EMBEDDABLE CHECKOUT WIDGET CARD (Apple Pay Native Sheet) */}
          <motion.div
            key={`${viewportMode}-${selectedInvoice.id}`}
            drag={viewportMode === 'mobile' ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.22}
            animate={
              widgetState === 'ERROR_SHAKE'
                ? { x: [0, -10, 10, -7, 7, -4, 4, 0] }
                : { x: 0, scale: 1, opacity: 1 }
            }
            transition={
              widgetState === 'ERROR_SHAKE'
                ? { duration: 0.42 }
                : { type: 'spring', duration: 0.45, bounce: 0.15 }
            }
            className={`w-full max-w-[420px] apple-material-floating text-black dark:text-white relative z-10 overflow-hidden ${
              viewportMode === 'mobile'
                ? 'rounded-t-[24px] rounded-b-none pt-3 pb-7 px-5'
                : 'rounded-[22px] p-6'
            }`}
          >
            {/* Mobile Sheet Grabber Handle */}
            {viewportMode === 'mobile' && (
              <div className="w-9 h-1.5 rounded-full bg-black/20 dark:bg-white/25 mx-auto mb-3 cursor-grab active:cursor-grabbing" />
            )}

            {/* Header: Merchant Identity Lockup (36px circular avatar, name, verified checkmark) + Close button */}
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-black/8 dark:border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#007AFF] to-[#5856D6] text-white flex items-center justify-center font-bold sf-subheadline shrink-0 shadow-xs">
                  SO
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="sf-headline text-black dark:text-white truncate">
                      {MERCHANT_IDENTITY.name}
                    </span>
                    <span
                      title="Verified Stellar Merchant"
                      className="w-4 h-4 rounded-full bg-[#007AFF] text-white inline-flex items-center justify-center shrink-0"
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  </div>
                  <p className="sf-caption text-black/55 dark:text-white/55 truncate">
                    Invoice {selectedInvoice.id} · Non-Custodial Settlement
                  </p>
                </div>
              </div>

              {/* Subtle Close Button: xmark in enclosed light-gray circle at top-right */}
              <button
                type="button"
                onClick={() => setWidgetState('IDLE')}
                aria-label="Reset or Close Checkout Sheet"
                className="apple-pressable w-7 h-7 rounded-full bg-black/8 dark:bg-white/12 hover:bg-black/15 dark:hover:bg-white/20 flex items-center justify-center text-black/60 dark:text-white/70 shrink-0"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* SKELETON LOADING STATE */}
            {widgetState === 'SKELETON' ? (
              <div className="py-6 space-y-5" aria-busy="true">
                <div className="flex flex-col items-center space-y-2.5">
                  <div className="w-28 h-4 rounded-full apple-skeleton" />
                  <div className="w-48 h-10 rounded-[12px] apple-skeleton" />
                  <div className="w-36 h-3.5 rounded-full apple-skeleton" />
                </div>
                <div className="w-full h-9 rounded-[8px] apple-skeleton" />
                <div className="w-full h-28 rounded-[16px] apple-skeleton" />
                <div className="w-full h-[50px] rounded-[12px] apple-skeleton" />
              </div>
            ) : (
              <>
                {/* Prominent Transaction Amount: Dynamic Type Display size (34pt Bold) */}
                <div className="py-5 text-center space-y-1.5">
                  <div className="sf-caption font-medium text-black/55 dark:text-white/55">
                    Total Due · {selectedInvoice.customerHandle}
                  </div>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="sf-large-title sf-mono-tabular text-black dark:text-white tracking-tight">
                      {selectedInvoice.amount.toFixed(2)}
                    </span>
                    <span className="sf-title-2 font-semibold text-[#007AFF] dark:text-[#0A84FF]">
                      {selectedInvoice.asset}
                    </span>
                  </div>

                  {/* Path Payment SDEX Toggle */}
                  <div className="pt-1 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setPathPaymentEnabled((v) => !v)}
                      className="apple-pressable inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/8 hover:bg-black/10 dark:hover:bg-white/12 sf-caption text-black/70 dark:text-white/75"
                    >
                      <ArrowRightLeft className="w-3 h-3 text-[#007AFF]" />
                      <span className="sf-mono-tabular">
                        {pathPaymentEnabled
                          ? `SDEX Path Locked: Pay ${convertedXlmAmount} ${
                              selectedInvoice.asset === 'USDC' ? 'XLM' : 'USDC'
                            } (60s quote)`
                          : `Enable Path Payment (${
                              selectedInvoice.asset === 'USDC' ? 'Pay in XLM' : 'Pay in USDC'
                            })`}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Error Banner when Haptic Shake is triggered */}
                <AnimatePresence>
                  {widgetState === 'ERROR_SHAKE' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 p-3 rounded-[12px] bg-[#FF3B30]/12 border border-[#FF3B30]/25 flex items-center gap-2.5 text-[#FF3B30] sf-footnote"
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Invalid Stellar ED25519 / MED25519 checksum detected.</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* PROCESSING STATE: Subtle Pulsing Activity Ring */}
                {(widgetState === 'SIGNING' || widgetState === 'BROADCASTING') && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-8 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.24, 1], opacity: [0.65, 0.15, 0.65] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute inset-0 rounded-full border-2 border-[#007AFF]"
                      />
                      <motion.div
                        animate={{ scale: [0.88, 1.06, 0.88] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-11 h-11 rounded-full bg-[#007AFF]/15 border border-[#007AFF] flex items-center justify-center"
                      >
                        <Lock className="w-5 h-5 text-[#007AFF]" />
                      </motion.div>
                    </div>
                    <div className="space-y-1">
                      <div className="sf-headline text-black dark:text-white">
                        {widgetState === 'SIGNING'
                          ? `Awaiting ${selectedWallet} Signature…`
                          : 'Verifying on Stellar Horizon SSE…'}
                      </div>
                      <p className="sf-footnote text-black/60 dark:text-white/60 sf-mono-tabular">
                        Memo ID: {selectedInvoice.memoId}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* SUCCESS STATE: Spring-Animated Checkmark + Stellar Expert Receipt */}
                {widgetState === 'SUCCESS' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', duration: 0.45, bounce: 0.25 }}
                    className="py-4 space-y-4"
                  >
                    <div className="p-4 rounded-[16px] bg-[#34C759]/12 border border-[#34C759]/25 flex flex-col items-center text-center space-y-2">
                      <motion.div
                        initial={{ scale: 0.5 }}
                        animate={{ scale: [0.5, 1.15, 1] }}
                        transition={{ duration: 0.4 }}
                        className="w-12 h-12 rounded-full bg-[#34C759] text-white flex items-center justify-center shadow-sm"
                      >
                        <Check className="w-6 h-6 stroke-[3]" />
                      </motion.div>
                      <div className="sf-headline text-black dark:text-white">
                        Payment Settled on Stellar
                      </div>
                      <p className="sf-caption text-black/65 dark:text-white/65">
                        Finalized in 3.8 seconds · OBS Dynamic Island &amp; Webhook Dispatched
                      </p>
                    </div>

                    {/* Receipt Details Table */}
                    <div className="rounded-[14px] bg-[#F2F2F7] dark:bg-[#2C2C2E] p-3.5 space-y-2 sf-footnote">
                      <div className="flex items-center justify-between">
                        <span className="text-black/60 dark:text-white/60">Ledger Index</span>
                        <span className="sf-mono-tabular font-semibold text-black dark:text-white">
                          #{selectedInvoice.ledgerIndex || 54192840}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-black/60 dark:text-white/60">64-bit Memo ID</span>
                        <span className="sf-mono-tabular text-black dark:text-white">
                          {selectedInvoice.memoId}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-black/60 dark:text-white/60">Network Fee</span>
                        <span className="sf-mono-tabular text-[#34C759] font-medium">
                          0.00001 XLM ($0.000004)
                        </span>
                      </div>
                      <div className="pt-2 border-t border-black/8 dark:border-white/10 flex items-center justify-between">
                        <span className="text-black/60 dark:text-white/60">Transaction Proof</span>
                        <a
                          href={`https://stellar.expert/explorer/public/tx/${
                            selectedInvoice.txHash || '8f3a9d21c4e7b01948271635'
                          }`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#007AFF] dark:text-[#0A84FF] font-medium sf-mono-tabular hover:underline"
                        >
                          <span>
                            {(selectedInvoice.txHash || '8f3a9d21c4e7b01948271635').slice(0, 8)}…
                          </span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setWidgetState('IDLE')}
                      className="apple-pressable w-full h-[46px] rounded-[12px] bg-black/6 dark:bg-white/10 text-black dark:text-white sf-subheadline font-semibold"
                    >
                      Done
                    </button>
                  </motion.div>
                )}

                {/* EXPIRED STATE */}
                {widgetState === 'EXPIRED' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-6 text-center space-y-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#FF9500]/15 text-[#FF9500] flex items-center justify-center mx-auto">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="sf-headline text-black dark:text-white">
                        Invoice Validity Window Expired
                      </div>
                      <p className="sf-footnote text-black/60 dark:text-white/60">
                        This 64-bit Memo &amp; SDEX exchange rate quote has expired to prevent slippage.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onRegenerateInvoice(selectedInvoice.id);
                        setWidgetState('IDLE');
                      }}
                      className="apple-pressable w-full h-[50px] rounded-[12px] bg-[#007AFF] text-white sf-headline flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Regenerate Fresh Invoice</span>
                    </button>
                  </motion.div>
                )}

                {/* IDLE / ERROR_SHAKE DEFAULT CHECKOUT BODY */}
                {(widgetState === 'IDLE' || widgetState === 'ERROR_SHAKE') && (
                  <div className="space-y-4">
                    {/* Apple-Style Segmented Control: [One-Click Wallet] | [Manual Transfer] */}
                    <div
                      role="tablist"
                      aria-label="Payment Method"
                      className="grid grid-cols-2 p-1 rounded-[8px] bg-black/6 dark:bg-white/10 relative"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={paymentMethod === 'wallet'}
                        onClick={() => setPaymentMethod('wallet')}
                        className={`relative z-10 py-1.5 rounded-[6px] sf-footnote font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                          paymentMethod === 'wallet'
                            ? 'bg-white dark:bg-[#3A3A3C] text-black dark:text-white shadow-xs'
                            : 'text-black/60 dark:text-white/60'
                        }`}
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>One-Click Wallet</span>
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={paymentMethod === 'manual'}
                        onClick={() => setPaymentMethod('manual')}
                        className={`relative z-10 py-1.5 rounded-[6px] sf-footnote font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                          paymentMethod === 'manual'
                            ? 'bg-white dark:bg-[#3A3A3C] text-black dark:text-white shadow-xs'
                            : 'text-black/60 dark:text-white/60'
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Manual Transfer</span>
                      </button>
                    </div>

                    {paymentMethod === 'wallet' ? (
                      /* WALLET VIEW: Native detection card showing Freighter / Albedo + 50pt Apple Pay CTA */
                      <div className="space-y-3.5">
                        <div className="rounded-[14px] bg-[#F2F2F7] dark:bg-[#2C2C2E] p-3 space-y-2">
                          <div className="flex items-center justify-between sf-caption text-black/55 dark:text-white/55 px-1">
                            <span>Detected Web3 Signer</span>
                            <span className="text-[#34C759] font-medium">Extension Ready</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {(['Freighter', 'Albedo'] as const).map((wallet) => (
                              <button
                                key={wallet}
                                type="button"
                                onClick={() => setSelectedWallet(wallet)}
                                className={`apple-pressable p-2.5 rounded-[10px] border text-left transition-all flex items-center justify-between ${
                                  selectedWallet === wallet
                                    ? 'bg-white dark:bg-[#3A3A3C] border-[#007AFF] shadow-xs'
                                    : 'bg-white/50 dark:bg-white/5 border-transparent opacity-70 hover:opacity-100'
                                }`}
                              >
                                <div>
                                  <div className="sf-footnote font-semibold text-black dark:text-white">
                                    {wallet}
                                  </div>
                                  <div className="sf-caption text-black/50 dark:text-white/50">
                                    {wallet === 'Freighter' ? 'SEP-0043 Bridge' : 'Web Signer'}
                                  </div>
                                </div>
                                {selectedWallet === wallet && (
                                  <div className="w-4 h-4 rounded-full bg-[#007AFF] text-white flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Donor Stream Message Field */}
                        <div>
                          <label className="block sf-caption text-black/55 dark:text-white/55 mb-1">
                            Stream Alert Note (Optional)
                          </label>
                          <input
                            type="text"
                            value={donorNote}
                            onChange={(e) => setDonorNote(e.target.value)}
                            placeholder="Add a message for the live stream…"
                            className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] text-black dark:text-white sf-footnote focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                          />
                        </div>

                        {/* Apple Pay Style Single-Action Button: Full-width, 50pt height, continuous rectangle */}
                        <button
                          type="button"
                          onClick={handleExecutePayment}
                          className="apple-pressable w-full h-[50px] rounded-[12px] bg-black dark:bg-white text-white dark:text-black sf-headline flex items-center justify-center gap-2.5 shadow-sm hover:opacity-95"
                        >
                          <Sparkles className="w-4 h-4 text-[#0A84FF]" />
                          <span>
                            Pay {selectedInvoice.amount.toFixed(2)} {selectedInvoice.asset} with{' '}
                            {selectedWallet}
                          </span>
                        </button>
                      </div>
                    ) : (
                      /* MANUAL VIEW: High-contrast QR Code + SF Mono Copyable M-Address + 64-bit Memo ID Badge */
                      <div className="space-y-3.5">
                        <div className="flex flex-col items-center">
                          <StellarQrCode value={selectedInvoice.multiplexedAddress} />
                        </div>

                        {/* Copyable Multiplexed M-Address Pill with Instant "Copied" Popover */}
                        <div className="relative">
                          <div className="flex items-center justify-between mb-1">
                            <span className="sf-caption text-black/55 dark:text-white/55">
                              Multiplexed Destination (MED25519)
                            </span>
                            <AnimatePresence>
                              {copiedField === 'address' && (
                                <motion.span
                                  initial={{ opacity: 0, y: 4, scale: 0.9 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 2 }}
                                  className="px-2 py-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black sf-caption font-semibold"
                                >
                                  Copied
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(selectedInvoice.multiplexedAddress, 'address')}
                            className="apple-pressable w-full px-3.5 py-2.5 rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-black/8 dark:hover:bg-white/15 flex items-center justify-between gap-2 text-left"
                          >
                            <span className="sf-mono-tabular sf-caption text-black dark:text-white truncate">
                              {selectedInvoice.multiplexedAddress}
                            </span>
                            <Copy className="w-4 h-4 text-[#007AFF] shrink-0" />
                          </button>
                        </div>

                        {/* Dedicated 64-Bit Memo ID Badge */}
                        <div className="relative">
                          <div className="flex items-center justify-between mb-1">
                            <span className="sf-caption text-black/55 dark:text-white/55">
                              Fallback 64-Bit Memo ID (Required for non-M wallets)
                            </span>
                            <AnimatePresence>
                              {copiedField === 'memo' && (
                                <motion.span
                                  initial={{ opacity: 0, y: 4, scale: 0.9 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 2 }}
                                  className="px-2 py-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black sf-caption font-semibold"
                                >
                                  Copied
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(selectedInvoice.memoId, 'memo')}
                            className="apple-pressable w-full px-3.5 py-2 rounded-[12px] bg-[#007AFF]/10 border border-[#007AFF]/25 flex items-center justify-between"
                          >
                            <span className="sf-mono-tabular sf-subheadline font-semibold text-[#007AFF] dark:text-[#0A84FF]">
                              {selectedInvoice.memoId}
                            </span>
                            <span className="sf-caption font-medium text-[#007AFF] flex items-center gap-1">
                              <Copy className="w-3.5 h-3.5" />
                              Copy Memo
                            </span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleExecutePayment}
                          className="apple-pressable w-full h-[50px] rounded-[12px] bg-[#007AFF] hover:bg-[#0071EB] text-white sf-headline flex items-center justify-center gap-2 shadow-sm"
                        >
                          <span>Simulate Horizon Incoming Transfer</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Trust Badge */}
                <div className="mt-5 pt-3 border-t border-black/6 dark:border-white/8 flex items-center justify-between sf-caption text-black/45 dark:text-white/45">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#34C759]" />
                    <span>Powered by Stellar Horizon SSE</span>
                  </div>
                  <span className="sf-mono-tabular">~3.5s Finality</span>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
