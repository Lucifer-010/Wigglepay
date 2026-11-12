import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Copy,
  Check,
  Play,
  Volume2,
  VolumeX,
  Radio,
  ExternalLink,
  Sliders,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AssetType, StreamAlertEvent, MERCHANT_IDENTITY, generateStellarTxHash } from '../data/wigglePayData';

interface GlobalDynamicIslandProps {
  activeAlert: StreamAlertEvent | null;
  onDismiss: () => void;
}

/**
 * Persistent top-center Dynamic Island pill that expands with Apple spring physics
 * (damping: 15, stiffness: 120) whenever a settlement occurs across any surface.
 */
export const GlobalDynamicIsland: React.FC<GlobalDynamicIslandProps> = ({
  activeAlert,
  onDismiss,
}) => {
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center">
      <AnimatePresence mode="wait">
        {activeAlert && (
          <motion.div
            key={activeAlert.id}
            initial={{ opacity: 0, scale: 0.45, y: -18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.55, y: -12 }}
            transition={{
              type: 'spring',
              damping: 15,
              stiffness: 120,
            }}
            onClick={onDismiss}
            role="status"
            aria-live="polite"
            className="pointer-events-auto cursor-pointer bg-black text-white rounded-full px-4 py-2.5 flex items-center gap-3.5 border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.45)] max-w-[92vw] sm:max-w-[540px]"
          >
            {/* Left Icon: Merchant / Asset Badge */}
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#30D158] flex items-center justify-center shrink-0 shadow-inner">
              <span className="sf-mono-tabular font-bold text-xs tracking-tight text-white">
                {activeAlert.asset}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#30D158] border-2 border-black flex items-center justify-center">
                <Check className="w-2 h-2 text-black stroke-[3]" />
              </span>
            </div>

            {/* Middle: SF Pro Semibold Headline + Italicized Donor Caption */}
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="sf-headline text-white truncate">
                  {activeAlert.donorName} sent {activeAlert.amount} {activeAlert.asset}
                </span>
              </div>
              <p className="sf-footnote text-white/75 italic truncate">
                "{activeAlert.message}"
              </p>
            </div>

            {/* Right: Floating Micro-Pill with Exact Ledger Proof */}
            <div className="shrink-0 bg-white/12 border border-white/15 rounded-full px-2.5 py-1 flex flex-col items-end">
              <span className="sf-mono-tabular text-[11px] font-medium text-[#30D158] whitespace-nowrap">
                #{activeAlert.ledgerIndex}
              </span>
              <span className="sf-mono-tabular text-[10px] text-white/60 whitespace-nowrap">
                {activeAlert.txHash.slice(0, 6)}…{activeAlert.txHash.slice(-4)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ObsOverlayStudioProps {
  activeAlert: StreamAlertEvent | null;
  alertHistory: StreamAlertEvent[];
  onTriggerAlert: (alert: Omit<StreamAlertEvent, 'id' | 'timestamp'>) => void;
  onDismissAlert: () => void;
}

export const ObsOverlayStudio: React.FC<ObsOverlayStudioProps> = ({
  activeAlert,
  alertHistory,
  onTriggerAlert,
  onDismissAlert,
}) => {
  const [donorName, setDonorName] = useState('Alex');
  const [amount, setAmount] = useState('50');
  const [asset, setAsset] = useState<AssetType>('USDC');
  const [message, setMessage] = useState('Keep crushing the stream!');
  const [minThreshold, setMinThreshold] = useState('5');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [showZeroStateGuide, setShowZeroStateGuide] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [countdownMs, setCountdownMs] = useState<number>(0);

  const overlayUrl = `https://wigglepay.io/overlay/${MERCHANT_IDENTITY.overlayToken}`;

  useEffect(() => {
    if (!activeAlert) {
      setCountdownMs(0);
      return;
    }
    setCountdownMs(6000);
    const interval = setInterval(() => {
      setCountdownMs((prev) => Math.max(0, prev - 100));
    }, 100);
    return () => clearInterval(interval);
  }, [activeAlert]);

  const handleFireTestAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount) || 50;
    onTriggerAlert({
      donorName: donorName.trim() || 'Alex',
      donorHandle: `@${(donorName.trim() || 'alex').toLowerCase().replace(/\s+/g, '_')}`,
      amount: parsedAmount,
      asset,
      message: message.trim() || 'Keep crushing the stream!',
      txHash: generateStellarTxHash(),
      ledgerIndex: 54192900 + Math.floor(Math.random() * 900),
    });
  };

  const handleCopyOverlayUrl = () => {
    navigator.clipboard?.writeText(overlayUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1800);
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="sf-title-1 text-black dark:text-white">
            Live Stream HUD · Dynamic Island Engine
          </h1>
          <p className="sf-subheadline text-black/60 dark:text-white/60 mt-0.5">
            Zero-config OBS Browser Source powered by Stellar Horizon SSE &amp; Apple spring physics (damping: 15, stiffness: 120)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowZeroStateGuide((v) => !v)}
            className="apple-pressable px-3.5 py-2 rounded-[10px] bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 sf-footnote font-medium text-black dark:text-white flex items-center gap-2 whitespace-nowrap"
          >
            {showZeroStateGuide ? <Eye className="w-4 h-4 text-[#007AFF]" /> : <EyeOff className="w-4 h-4" />}
            <span>{showZeroStateGuide ? 'OBS Safe-Frame Visible' : 'True Transparent Zero-State'}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onTriggerAlert({
                donorName: 'Alex',
                donorHandle: '@alex',
                amount: 50,
                asset: 'USDC',
                message: 'Keep crushing the stream!',
                txHash: generateStellarTxHash(),
                ledgerIndex: 54193104,
              })
            }
            className="apple-pressable px-4 py-2 rounded-[10px] bg-[#007AFF] hover:bg-[#0071EB] text-white sf-footnote font-semibold flex items-center gap-2 shadow-xs whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Trigger 50 USDC Alert</span>
          </button>
        </div>
      </div>

      {/* Main OBS Preview Stage */}
      <div className="relative rounded-[22px] overflow-hidden border border-black/10 dark:border-white/12 bg-[#0B0C10] min-h-[340px] flex flex-col justify-between p-6 shadow-lg">
        {/* Simulated Stream Canvas Grid Pattern */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 20%, rgba(10, 132, 255, 0.28), transparent 60%), linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '100% 100%, 32px 32px, 32px 32px',
          }}
        />

        {/* Top Bar inside OBS Viewport */}
        <div className="relative z-10 flex items-center justify-between text-xs text-white/60">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-[#30D158]" />
            <span className="sf-mono-tabular">OBS Browser Source · 1920×1080 · 60fps</span>
          </div>
          <div className="sf-mono-tabular">
            {activeAlert
              ? `ACTIVE ALERT · Auto-collapse in ${(countdownMs / 1000).toFixed(1)}s`
              : 'DEFAULT STATE · 0% Opacity (Hidden)'}
          </div>
        </div>

        {/* Center Dynamic Island Stage */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center py-10">
          <AnimatePresence mode="wait">
            {activeAlert ? (
              <motion.div
                key={activeAlert.id}
                initial={{ opacity: 0, scale: 0.4, y: -24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -16 }}
                transition={{
                  type: 'spring',
                  damping: 15,
                  stiffness: 120,
                }}
                className="bg-black/95 text-white rounded-full px-5 py-3.5 flex items-center gap-4 border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.65)] max-w-xl w-full sm:w-auto"
              >
                {/* Left Icon: Merchant avatar or Stellar asset logo */}
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-[#007AFF] via-[#5856D6] to-[#30D158] flex items-center justify-center shrink-0 shadow-md">
                  <span className="sf-mono-tabular font-bold text-sm text-white">
                    {activeAlert.asset}
                  </span>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#30D158] border-2 border-black flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
                  </div>
                </div>

                {/* Middle: SF Pro Semibold headline + italicized donor message */}
                <div className="flex flex-col min-w-0 pr-2">
                  <div className="sf-headline text-white text-[18px] tracking-[-0.43px] whitespace-nowrap">
                    {activeAlert.donorName} sent {activeAlert.amount} {activeAlert.asset}
                  </div>
                  <div className="sf-subheadline text-white/80 italic truncate max-w-[280px] sm:max-w-[320px]">
                    "{activeAlert.message}"
                  </div>
                </div>

                {/* Right: Floating micro-pill showing exact ledger proof */}
                <div className="ml-auto shrink-0 bg-white/10 border border-white/15 rounded-full px-3.5 py-1.5 flex flex-col items-end">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[#30D158] sf-mono-tabular">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Ledger #{activeAlert.ledgerIndex}</span>
                  </div>
                  <span className="sf-mono-tabular text-[11px] text-white/65">
                    {activeAlert.txHash.slice(0, 6)}…{activeAlert.txHash.slice(-4)}
                  </span>
                </div>
              </motion.div>
            ) : (
              showZeroStateGuide && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border border-dashed border-white/20 rounded-full px-6 py-3 text-center"
                >
                  <p className="sf-footnote text-white/50">
                    Dynamic Island Zero-State (Completely transparent in live OBS until Horizon SSE event fires)
                  </p>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Preset Quick-Triggers inside Stage */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="sf-caption text-white/50 mr-1">Quick Presets:</span>
            <button
              type="button"
              onClick={() =>
                onTriggerAlert({
                  donorName: 'Alex',
                  donorHandle: '@alex',
                  amount: 50,
                  asset: 'USDC',
                  message: 'Keep crushing the stream!',
                  txHash: generateStellarTxHash(),
                  ledgerIndex: 54193210,
                })
              }
              className="apple-pressable px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white sf-caption font-medium"
            >
              Alex · 50 USDC
            </button>
            <button
              type="button"
              onClick={() =>
                onTriggerAlert({
                  donorName: 'Sarah',
                  donorHandle: '@sarah_chen',
                  amount: 250,
                  asset: 'XLM',
                  message: 'Drop the custom Xcode theme link!',
                  txHash: generateStellarTxHash(),
                  ledgerIndex: 54193219,
                })
              }
              className="apple-pressable px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white sf-caption font-medium"
            >
              Sarah · 250 XLM
            </button>
            <button
              type="button"
              onClick={() =>
                onTriggerAlert({
                  donorName: 'Kaito',
                  donorHandle: '@kaito',
                  amount: 100,
                  asset: 'USDC',
                  message: 'Instant settlement via Freighter!',
                  txHash: generateStellarTxHash(),
                  ledgerIndex: 54193245,
                })
              }
              className="apple-pressable px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white sf-caption font-medium"
            >
              Kaito · 100 USDC
            </button>
          </div>

          {activeAlert && (
            <button
              type="button"
              onClick={onDismissAlert}
              className="apple-pressable px-3 py-1 rounded-full bg-white/15 text-white/80 hover:text-white sf-caption"
            >
              Collapse Now
            </button>
          )}
        </div>
      </div>

      {/* Configuration & Custom Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Custom Alert Simulator */}
        <form
          onSubmit={handleFireTestAlert}
          className="lg:col-span-7 bg-white dark:bg-[#1C1C1E] rounded-[20px] p-6 apple-card-elevated border border-black/5 dark:border-white/8 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="sf-title-2 text-black dark:text-white">Custom Event Payload Simulator</h2>
            <span className="sf-caption text-black/50 dark:text-white/50 sf-mono-tabular">
              spring(damping: 15, stiffness: 120)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block sf-caption font-medium text-black/60 dark:text-white/60 mb-1">
                Donor Display Name
              </label>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] text-black dark:text-white sf-subheadline focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                placeholder="Alex"
              />
            </div>

            <div>
              <label className="block sf-caption font-medium text-black/60 dark:text-white/60 mb-1">
                Tip Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] text-black dark:text-white sf-subheadline sf-mono-tabular focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                placeholder="50"
              />
            </div>

            <div>
              <label className="block sf-caption font-medium text-black/60 dark:text-white/60 mb-1">
                Stellar Asset
              </label>
              <div className="grid grid-cols-2 p-1 rounded-[8px] bg-[#F2F2F7] dark:bg-[#2C2C2E]">
                {(['USDC', 'XLM'] as AssetType[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setAsset(item)}
                    className={`py-1.5 rounded-[6px] sf-footnote font-semibold transition-all ${
                      asset === item
                        ? 'bg-white dark:bg-[#3A3A3C] text-black dark:text-white shadow-xs'
                        : 'text-black/60 dark:text-white/60'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block sf-caption font-medium text-black/60 dark:text-white/60 mb-1">
              Donor Custom Message (Rendered in SF Pro Italic)
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] text-black dark:text-white sf-subheadline focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
              placeholder="Keep crushing the stream!"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTtsEnabled((v) => !v)}
                className="apple-pressable px-3 py-2 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] sf-footnote font-medium text-black dark:text-white flex items-center gap-2"
              >
                {ttsEnabled ? (
                  <Volume2 className="w-4 h-4 text-[#34C759]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-black/40 dark:text-white/40" />
                )}
                <span>{ttsEnabled ? 'Neural TTS Audio Active' : 'TTS Muted'}</span>
              </button>
            </div>

            <button
              type="submit"
              className="apple-pressable px-5 py-2.5 rounded-[12px] bg-[#007AFF] hover:bg-[#0071EB] text-white sf-subheadline font-semibold flex items-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Dispatch to Dynamic Island</span>
            </button>
          </div>
        </form>

        {/* Right: OBS Browser Source Integration & Recent Alerts */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1C1C1E] rounded-[20px] p-6 apple-card-elevated border border-black/5 dark:border-white/8 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="sf-title-2 text-black dark:text-white">OBS Browser Source</h2>
              <span className="sf-caption text-[#34C759] font-medium">WSS Connected</span>
            </div>

            <p className="sf-footnote text-black/60 dark:text-white/60">
              Paste this single URL into an OBS Browser Source. Configuration changes sync automatically via Django Channels WebSockets without restarting your broadcast.
            </p>

            <div className="p-3 rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-between gap-2">
              <code className="sf-mono-tabular text-xs text-black dark:text-white truncate">
                {overlayUrl}
              </code>
              <button
                type="button"
                onClick={handleCopyOverlayUrl}
                className="apple-pressable shrink-0 px-3 py-1.5 rounded-[8px] bg-white dark:bg-[#3A3A3C] text-black dark:text-white sf-caption font-semibold flex items-center gap-1.5 shadow-xs"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 sf-footnote text-black/70 dark:text-white/70">
                <Sliders className="w-4 h-4 text-[#007AFF]" />
                <span>Minimum Tip Threshold (USDC eq.)</span>
              </div>
              <input
                type="number"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                className="w-20 px-2.5 py-1 rounded-[8px] bg-[#F2F2F7] dark:bg-[#2C2C2E] text-right sf-mono-tabular sf-footnote text-black dark:text-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-black/8 dark:border-white/10">
            <div className="sf-caption font-semibold text-black/50 dark:text-white/50 mb-2">
              Recent Stream Settlements ({alertHistory.length})
            </div>
            <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
              {alertHistory.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-[10px] bg-[#F2F2F7]/70 dark:bg-[#2C2C2E]/60 sf-caption"
                >
                  <div className="truncate pr-2">
                    <span className="font-semibold text-black dark:text-white">{item.donorName}</span>
                    <span className="text-black/50 dark:text-white/50"> · "{item.message}"</span>
                  </div>
                  <span className="sf-mono-tabular font-semibold text-[#34C759] shrink-0">
                    +{item.amount} {item.asset}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
