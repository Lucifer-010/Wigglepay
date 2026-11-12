import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  Mic,
  Square,
  Sparkles,
  Check,
  Share2,
  SlidersHorizontal,
  ArrowUpRight,
  Volume2,
  Code2,
} from 'lucide-react';
import {
  AssetType,
  Invoice,
  VOICE_PRESET_PROMPTS,
  MERCHANT_IDENTITY,
  generateMemo64Bit,
  generateMultiplexedAddress,
} from '../data/wigglePayData';

interface TelegramMiniAppProps {
  onCreateInvoice: (newInvoice: Invoice) => void;
  onOpenInWidget: (invoice: Invoice) => void;
  onSimulateInstantSettle: (invoice: Invoice) => void;
  onBackToPortal: () => void;
}

export const TelegramMiniApp: React.FC<TelegramMiniAppProps> = ({
  onCreateInvoice,
  onOpenInWidget,
  onSimulateInstantSettle,
  onBackToPortal,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(VOICE_PRESET_PROMPTS[0].id);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [transcript, setTranscript] = useState(VOICE_PRESET_PROMPTS[0].transcript);

  // Editable Entity State inside Apple-style grouped-table cells
  const [amount, setAmount] = useState<string>('50.00');
  const [asset, setAsset] = useState<AssetType>('USDC');
  const [recipientHandle, setRecipientHandle] = useState<string>('@alex');
  const [memoDescription, setMemoDescription] = useState<string>('2 pairs of vintage shoes');
  const [expiryHours, setExpiryHours] = useState<string>('24');

  const [isEditingUnlocked, setIsEditingUnlocked] = useState<boolean>(true);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [showJsonInspector, setShowJsonInspector] = useState<boolean>(false);
  const [waveBars, setWaveBars] = useState<number[]>(
    Array.from({ length: 28 }, (_, i) => 20 + ((i * 17) % 65))
  );

  const firstInputRef = useRef<HTMLInputElement | null>(null);

  // Animate waveform bars while recording or analyzing voice
  useEffect(() => {
    if (!isRecording && !isProcessingVoice) return;
    const interval = setInterval(() => {
      setWaveBars(
        Array.from({ length: 28 }, () => Math.floor(18 + Math.random() * 78))
      );
    }, 110);
    return () => clearInterval(interval);
  }, [isRecording, isProcessingVoice]);

  const parseTranscriptToEntities = (rawText: string) => {
    const amountMatch = rawText.match(/(\d+(?:\.\d+)?)\s*(USDC|XLM)?/i);
    const assetMatch = rawText.match(/\b(USDC|XLM)\b/i);
    const handleMatch = rawText.match(/@([a-zA-Z0-9_]+)/);
    const forMatch = rawText.match(/\bfor\s+(.+?)(?:\s+from|\s+due|$)/i);

    if (amountMatch) setAmount(parseFloat(amountMatch[1]).toFixed(2));
    if (assetMatch) setAsset(assetMatch[1].toUpperCase() as AssetType);
    if (handleMatch) setRecipientHandle(`@${handleMatch[1].toLowerCase()}`);
    if (forMatch && forMatch[1]) setMemoDescription(forMatch[1].trim());
  };

  const handleSelectPreset = (preset: (typeof VOICE_PRESET_PROMPTS)[0]) => {
    setSelectedPresetId(preset.id);
    setCreatedInvoice(null);
    setIsProcessingVoice(true);
    setTranscript(preset.transcript);

    setTimeout(() => {
      setAmount(preset.extracted.amount.toFixed(2));
      setAsset(preset.extracted.asset);
      setRecipientHandle(preset.extracted.customerHandle);
      setMemoDescription(preset.extracted.description);
      setExpiryHours(String(preset.extracted.expiryHours));
      setIsProcessingVoice(false);
    }, 520);
  };

  const handleToggleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsProcessingVoice(true);
      setTimeout(() => {
        parseTranscriptToEntities(transcript);
        setIsProcessingVoice(false);
      }, 600);
    } else {
      setCreatedInvoice(null);
      setIsRecording(true);
    }
  };

  const handleCreateAndShare = () => {
    const numericAmount = Math.max(0.01, parseFloat(amount) || 50);
    const memoId = generateMemo64Bit();
    const mAddress = generateMultiplexedAddress(memoId);
    const cleanHandle = recipientHandle.startsWith('@')
      ? recipientHandle
      : `@${recipientHandle || 'customer'}`;

    const newInv: Invoice = {
      id: `INV-${Math.floor(9050 + Math.random() * 900)}`,
      customerHandle: cleanHandle,
      customerName: cleanHandle.replace('@', '').replace(/_/g, ' '),
      asset,
      amount: numericAmount,
      multiplexedAddress: mAddress,
      baseAddress: MERCHANT_IDENTITY.baseStellarAccount,
      memoId,
      description: memoDescription.trim() || 'Telegram Voice Invoice',
      status: 'Active',
      createdAt: 'Just now',
      timestampMs: Date.now(),
      expiryHours: parseInt(expiryHours, 10) || 24,
      feeSavedUsd: Number((numericAmount * 0.029 + 0.3).toFixed(2)),
    };

    onCreateInvoice(newInv);
    setCreatedInvoice(newInv);
  };

  const handleEditParameters = () => {
    setCreatedInvoice(null);
    setIsEditingUnlocked(true);
    setTimeout(() => {
      firstInputRef.current?.focus();
    }, 60);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      {/* Left Column: Voice Pipeline Context & Preset Prompts */}
      <div className="lg:col-span-5 space-y-5">
        <div>
          <h1 className="sf-title-1 text-black dark:text-white">
            Telegram Mini-App · Voice-to-Invoice
          </h1>
          <p className="sf-subheadline text-black/60 dark:text-white/60 mt-1">
            iOS 18 native modal inside Telegram WebApp. Converts merchant voice notes into Stellar Multiplexed (MED25519) payment links via Whisper STT &amp; LLM structured extraction.
          </p>
        </div>

        {/* Voice Note Sample Triggers */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-5 apple-card-elevated border border-black/5 dark:border-white/8 space-y-3">
          <div className="flex items-center justify-between">
            <span className="sf-headline text-black dark:text-white">
              Simulated Voice Note Presets
            </span>
            <span className="sf-caption text-[#007AFF] font-medium">.ogg → Whisper STT</span>
          </div>

          <div className="space-y-2">
            {VOICE_PRESET_PROMPTS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`apple-pressable w-full text-left p-3 rounded-[12px] border transition-all flex items-start justify-between gap-2 ${
                  selectedPresetId === preset.id
                    ? 'bg-[#007AFF]/10 border-[#007AFF] text-black dark:text-white'
                    : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] border-transparent text-black/75 dark:text-white/75 hover:bg-black/8 dark:hover:bg-white/12'
                }`}
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="sf-footnote font-semibold truncate">{preset.label}</div>
                  <div className="sf-caption text-black/55 dark:text-white/55 line-clamp-2">
                    "{preset.transcript}"
                  </div>
                </div>
                <Volume2 className="w-4 h-4 text-[#007AFF] shrink-0 mt-0.5" />
              </button>
            ))}
          </div>

          {/* Toggle Structured JSON Output Preview */}
          <div className="pt-2 border-t border-black/6 dark:border-white/8">
            <button
              type="button"
              onClick={() => setShowJsonInspector((v) => !v)}
              className="apple-pressable w-full flex items-center justify-between sf-caption font-medium text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white py-1"
            >
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[#007AFF]" />
                <span>Inspect Extracted LLM JSON Schema</span>
              </span>
              <span>{showJsonInspector ? 'Hide' : 'Show'}</span>
            </button>

            <AnimatePresence>
              {showJsonInspector && (
                <motion.pre
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 p-3 rounded-[12px] bg-[#0B0C10] text-[#30D158] sf-mono-tabular text-xs overflow-x-auto"
                >
                  {JSON.stringify(
                    {
                      amount: parseFloat(amount) || 0,
                      asset,
                      customer_ref: recipientHandle,
                      description: memoDescription,
                      expiry_hours: parseInt(expiryHours, 10) || 24,
                    },
                    null,
                    2
                  )}
                </motion.pre>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right Column: iOS Native Modal inside Telegram Frame */}
      <div className="lg:col-span-7 flex justify-center">
        <div className="w-full max-w-[430px] rounded-[38px] bg-[#F2F2F7] dark:bg-[#000000] border-[5px] border-black/85 dark:border-white/15 shadow-2xl overflow-hidden flex flex-col">
          {/* Telegram Top Host Bar */}
          <div className="px-5 pt-3 pb-2 bg-[#FFFFFF]/80 dark:bg-[#1C1C1E]/85 backdrop-blur-xl border-b border-black/6 dark:border-white/10">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onBackToPortal}
                className="apple-pressable min-h-[44px] -ml-2 px-2 flex items-center gap-0.5 text-[#007AFF] dark:text-[#0A84FF] sf-body"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                <span>Bot Chat</span>
              </button>

              <span className="sf-caption font-semibold text-black/50 dark:text-white/50">
                WigglePay Mini-App
              </span>

              {/* Status Indicator */}
              <span
                className={`sf-caption font-semibold px-2.5 py-0.5 rounded-full ${
                  createdInvoice
                    ? 'bg-[#34C759]/15 text-[#34C759]'
                    : isRecording
                    ? 'bg-[#FF3B30]/15 text-[#FF3B30]'
                    : 'bg-[#007AFF]/15 text-[#007AFF]'
                }`}
              >
                {createdInvoice ? 'Link Ready' : isRecording ? 'Listening…' : 'Draft'}
              </span>
            </div>

            {/* iOS Large Title Style */}
            <div className="mt-1 pb-1">
              <h2 className="sf-large-title text-black dark:text-white">Voice Invoice</h2>
            </div>
          </div>

          {/* Modal Body Content */}
          <div className="p-4 space-y-4">
            {/* Waveform Visualizer Card */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[18px] p-4 apple-card-elevated space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleVoiceRecord}
                    aria-label={isRecording ? 'Stop Recording' : 'Record Voice Note'}
                    className={`apple-pressable w-11 h-11 rounded-full flex items-center justify-center text-white shadow-sm transition-colors ${
                      isRecording ? 'bg-[#FF3B30]' : 'bg-[#007AFF]'
                    }`}
                  >
                    {isRecording ? (
                      <Square className="w-4 h-4 fill-current" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </button>
                  <div>
                    <div className="sf-subheadline font-semibold text-black dark:text-white">
                      {isRecording
                        ? 'Recording Voice Note…'
                        : isProcessingVoice
                        ? 'Whisper STT Extracting…'
                        : 'Voice Note Analyzed'}
                    </div>
                    <div className="sf-caption text-black/50 dark:text-white/50 sf-mono-tabular">
                      {isRecording ? '00:04.2 · 48kHz Opus' : 'Confidence 99.4% · Stellar Parser'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleVoiceRecord}
                  className="apple-pressable px-3 py-1.5 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] sf-caption font-semibold text-[#007AFF]"
                >
                  {isRecording ? 'Parse Now' : 'Re-record'}
                </button>
              </div>

              {/* Real-time Audio Waveform Bars */}
              <div className="h-12 px-3 rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-between gap-1">
                {waveBars.map((heightPct, idx) => (
                  <motion.div
                    key={idx}
                    animate={{
                      height: `${isRecording || isProcessingVoice ? heightPct : Math.max(22, (heightPct % 55) + 20)}%`,
                    }}
                    transition={{ type: 'spring', duration: 0.25, bounce: 0.1 }}
                    className={`w-1.5 rounded-full ${
                      isRecording
                        ? 'bg-[#FF3B30]'
                        : isProcessingVoice
                        ? 'bg-[#FF9500]'
                        : 'bg-[#007AFF]'
                    }`}
                  />
                ))}
              </div>

              {/* Editable Natural Language Transcript */}
              <div>
                <label className="block sf-caption text-black/50 dark:text-white/50 mb-1">
                  Transcribed Voice Prompt (Edit &amp; press Enter to re-parse)
                </label>
                <input
                  type="text"
                  value={transcript}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    parseTranscriptToEntities(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] sf-footnote text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>
            </div>

            {/* Extracted Entity Card: Apple-Style Grouped-Table Cells */}
            <div className="space-y-1.5">
              <div className="px-3 flex items-center justify-between">
                <span className="sf-caption font-medium text-black/55 dark:text-white/55">
                  Extracted Payment Attributes
                </span>
                <span className="sf-caption text-[#007AFF] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Entity Card
                </span>
              </div>

              <div className="bg-white dark:bg-[#1C1C1E] rounded-[18px] overflow-hidden apple-card-elevated divide-y divide-black/8 dark:divide-white/10">
                {/* Cell 1: Amount */}
                <div className="px-4 min-h-[48px] py-2 flex items-center justify-between gap-4">
                  <label className="sf-body text-black dark:text-white shrink-0">Amount</label>
                  <input
                    ref={firstInputRef}
                    type="number"
                    step="0.01"
                    value={amount}
                    disabled={!isEditingUnlocked}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-36 text-right sf-body sf-mono-tabular font-semibold text-[#007AFF] dark:text-[#0A84FF] bg-transparent focus:outline-none"
                  />
                </div>

                {/* Cell 2: Asset Picker */}
                <div className="px-4 min-h-[48px] py-2 flex items-center justify-between gap-4">
                  <span className="sf-body text-black dark:text-white shrink-0">Settlement Asset</span>
                  <div className="inline-flex p-0.5 rounded-[8px] bg-[#F2F2F7] dark:bg-[#2C2C2E]">
                    {(['USDC', 'XLM'] as AssetType[]).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setAsset(item)}
                        className={`px-3 py-1 rounded-[6px] sf-footnote font-semibold transition-all ${
                          asset === item
                            ? 'bg-white dark:bg-[#3A3A3C] text-black dark:text-white shadow-xs'
                            : 'text-black/55 dark:text-white/55'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cell 3: Recipient @username */}
                <div className="px-4 min-h-[48px] py-2 flex items-center justify-between gap-4">
                  <label className="sf-body text-black dark:text-white shrink-0">Recipient</label>
                  <input
                    type="text"
                    value={recipientHandle}
                    disabled={!isEditingUnlocked}
                    onChange={(e) => setRecipientHandle(e.target.value)}
                    className="w-44 text-right sf-body text-black/80 dark:text-white/80 bg-transparent focus:outline-none"
                  />
                </div>

                {/* Cell 4: Memo Description */}
                <div className="px-4 min-h-[48px] py-2.5 flex items-center justify-between gap-4">
                  <label className="sf-body text-black dark:text-white shrink-0">Memo Note</label>
                  <input
                    type="text"
                    value={memoDescription}
                    disabled={!isEditingUnlocked}
                    onChange={(e) => setMemoDescription(e.target.value)}
                    className="w-full text-right sf-subheadline text-black/75 dark:text-white/75 bg-transparent focus:outline-none truncate"
                  />
                </div>
              </div>
            </div>

            {/* Generated Invoice Confirmation Drawer inside Telegram when Created */}
            <AnimatePresence>
              {createdInvoice && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ type: 'spring', duration: 0.45, bounce: 0.15 }}
                  className="p-4 rounded-[18px] bg-[#34C759]/12 border border-[#34C759]/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#34C759] text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="sf-headline text-black dark:text-white">
                        {createdInvoice.id} Provisioned
                      </span>
                    </div>
                    <span className="sf-mono-tabular sf-caption text-black/60 dark:text-white/60">
                      Memo #{createdInvoice.memoId.slice(0, 8)}…
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenInWidget(createdInvoice)}
                      className="apple-pressable py-2.5 px-3 rounded-[10px] bg-white dark:bg-[#1C1C1E] text-black dark:text-white sf-footnote font-semibold flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>Open Checkout</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#007AFF]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSimulateInstantSettle(createdInvoice)}
                      className="apple-pressable py-2.5 px-3 rounded-[10px] bg-[#34C759] text-white sf-footnote font-semibold flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Settle &amp; Pop OBS</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Footer: Two Full-Width Stacked Buttons (44pt+ Touch Target) */}
            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={handleCreateAndShare}
                className="apple-pressable w-full min-h-[50px] rounded-[12px] bg-[#007AFF] hover:bg-[#0071EB] text-white sf-headline flex items-center justify-center gap-2 shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                <span>Create &amp; Share Payment Link</span>
              </button>

              <button
                type="button"
                onClick={handleEditParameters}
                className="apple-pressable w-full min-h-[48px] rounded-[12px] bg-white dark:bg-[#1C1C1E] text-[#007AFF] dark:text-[#0A84FF] sf-headline flex items-center justify-center gap-2 border border-black/6 dark:border-white/10"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Edit Parameters</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
