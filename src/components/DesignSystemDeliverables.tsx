import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Palette,
  Type,
  Layers,
  Code2,
  GitBranch,
  Copy,
  Check,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { EnvironmentSurface } from '../data/wigglePayData';

interface DesignSystemDeliverablesProps {
  onNavigateSurface: (surface: EnvironmentSurface) => void;
}

type InteractiveStateMode = 'default' | 'hover' | 'pressed' | 'loading' | 'success' | 'error';

export const DesignSystemDeliverables: React.FC<DesignSystemDeliverablesProps> = ({
  onNavigateSurface,
}) => {
  const [activeDeliverableTab, setActiveDeliverableTab] = useState<'tokens' | 'architecture' | 'flow'>('tokens');
  const [selectedStateMode, setSelectedStateMode] = useState<InteractiveStateMode>('default');
  const [copiedTokenBlock, setCopiedTokenBlock] = useState(false);
  const [copiedComponentCode, setCopiedComponentCode] = useState(false);

  const colorTokens = [
    {
      name: 'System Background (Primary)',
      cssVar: '--apple-bg-primary',
      lightHex: '#FFFFFF',
      darkHex: '#000000',
      usage: 'Base canvas, table surfaces, primary cards',
    },
    {
      name: 'Secondary Grouped Background',
      cssVar: '--apple-bg-secondary',
      lightHex: '#F2F2F7',
      darkHex: '#1C1C1E',
      usage: 'Grouped iOS table backgrounds, flat KPI cards',
    },
    {
      name: 'Tertiary System Background',
      cssVar: '--apple-bg-tertiary',
      lightHex: '#E5E5EA',
      darkHex: '#2C2C2E',
      usage: 'Input fields, segmented control tracks, nested wells',
    },
    {
      name: 'System Blue (Primary Accent)',
      cssVar: '--apple-blue',
      lightHex: '#007AFF',
      darkHex: '#0A84FF',
      usage: 'Primary CTAs, active sidebar selection, focus rings',
    },
    {
      name: 'System Green (Settled / Nominal)',
      cssVar: '--apple-green',
      lightHex: '#34C759',
      darkHex: '#30D158',
      usage: 'Horizon SSE live telemetry, settled invoices, checkmarks',
    },
    {
      name: 'System Orange (Warning / Slippage)',
      cssVar: '--apple-orange',
      lightHex: '#FF9500',
      darkHex: '#FF9F0A',
      usage: 'Expiring quotes, Whisper STT extraction progress',
    },
    {
      name: 'System Red (Error / Expired)',
      cssVar: '--apple-red',
      lightHex: '#FF3B30',
      darkHex: '#FF453A',
      usage: 'Invalid checksum shake state, expired invoice alerts',
    },
  ];

  const typographyScale = [
    {
      role: 'Large Title / Display',
      family: 'SF Pro Display',
      size: '34pt (34px)',
      weight: 'Bold (700)',
      tracking: '-0.45px',
      lineHeight: '41pt',
      className: 'sf-large-title',
      sample: '45.00 USDC',
    },
    {
      role: 'Title 1',
      family: 'SF Pro Display',
      size: '28pt (28px)',
      weight: 'Bold (700)',
      tracking: '-0.38px',
      lineHeight: '34pt',
      className: 'sf-title-1',
      sample: 'Merchant Overview',
    },
    {
      role: 'Title 2',
      family: 'SF Pro Display',
      size: '22pt (22px)',
      weight: 'Semibold (600)',
      tracking: '-0.26px',
      lineHeight: '28pt',
      className: 'sf-title-2',
      sample: 'OBS Browser Source',
    },
    {
      role: 'Headline',
      family: 'SF Pro Text',
      size: '17pt (17px)',
      weight: 'Semibold (600)',
      tracking: '-0.43px',
      lineHeight: '22pt',
      className: 'sf-headline',
      sample: 'Alex sent 50 USDC',
    },
    {
      role: 'Body',
      family: 'SF Pro Text',
      size: '17pt (17px)',
      weight: 'Regular (400)',
      tracking: '-0.43px',
      lineHeight: '22pt',
      className: 'sf-body',
      sample: 'Non-custodial Stellar settlement gateway.',
    },
    {
      role: 'Callout',
      family: 'SF Pro Text',
      size: '16pt (16px)',
      weight: 'Regular (400)',
      tracking: '-0.31px',
      lineHeight: '21pt',
      className: 'sf-callout',
      sample: 'Confirm & Share Payment Link',
    },
    {
      role: 'Subheadline',
      family: 'SF Pro Text',
      size: '15pt (15px)',
      weight: 'Regular (400)',
      tracking: '-0.23px',
      lineHeight: '20pt',
      className: 'sf-subheadline',
      sample: 'Keep crushing the stream!',
    },
    {
      role: 'Footnote / Caption',
      family: 'SF Pro Text',
      size: '13pt / 12pt',
      weight: 'Regular (400)',
      tracking: '0px',
      lineHeight: '18pt / 16pt',
      className: 'sf-footnote',
      sample: 'Powered by Stellar Horizon SSE · ~3.5s Finality',
    },
    {
      role: 'Monospace Tabular',
      family: 'SF Mono',
      size: '13pt (tabular-nums)',
      weight: 'Medium (500)',
      tracking: '0px',
      lineHeight: '18pt',
      className: 'sf-mono-tabular sf-footnote font-medium',
      sample: 'MAQP2KPQGKIHYJGX…K7PQ2M · Memo #9048271649201842',
    },
  ];

  const cssTokenExport = `:root {
  /* Apple SF Typography Stack */
  --font-sf-display: -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui;
  --font-sf-text: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui;
  --font-sf-mono: "SF Mono", ui-monospace, SFMono-Regular, monospace;

  /* Light Mode Semantic Surfaces */
  --apple-bg-primary: #FFFFFF;
  --apple-bg-secondary: #F2F2F7;
  --apple-bg-tertiary: #E5E5EA;
  --material-hairline: rgba(0, 0, 0, 0.08);

  /* Continuous Corner Radii (Squircle Profile) */
  --radius-modal: 20px;      /* 18px to 22px */
  --radius-control: 12px;    /* 10px to 12px */
  --radius-segmented: 8px;
  --radius-pill: 9999px;

  /* Soft Multi-Layered Elevation Shadows */
  --shadow-card: 0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
  --shadow-modal: 0 12px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06);
}

.dark {
  --apple-bg-primary: #000000;
  --apple-bg-secondary: #1C1C1E;
  --apple-bg-tertiary: #2C2C2E;
  --material-hairline: rgba(255, 255, 255, 0.12);
}`;

  const stateCodeMap: Record<InteractiveStateMode, string> = {
    default: `<button className="w-full h-[50px] rounded-[12px] bg-black dark:bg-white text-white dark:text-black sf-headline flex items-center justify-center gap-2.5 shadow-sm transition-transform">
  <span>Pay 45.00 USDC with Freighter</span>
</button>`,
    hover: `<button className="w-full h-[50px] rounded-[12px] bg-black/90 dark:bg-white/90 text-white dark:text-black sf-headline flex items-center justify-center gap-2.5 shadow-md ring-2 ring-[#007AFF]/40">
  <span>Pay 45.00 USDC with Freighter</span>
</button>`,
    pressed: `<button className="w-full h-[50px] rounded-[12px] bg-black dark:bg-white text-white dark:text-black sf-headline flex items-center justify-center gap-2.5 scale-[0.96] transition-transform duration-100">
  <span>Pay 45.00 USDC with Freighter</span>
</button>`,
    loading: `<div className="h-[50px] rounded-[12px] bg-[#007AFF]/12 border border-[#007AFF]/30 flex items-center justify-center gap-3">
  <span className="w-4 h-4 rounded-full border-2 border-[#007AFF] animate-ping" />
  <span className="sf-headline text-[#007AFF]">Verifying on Stellar Horizon SSE…</span>
</div>`,
    success: `<motion.div initial={{ scale: 0.88 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.45, bounce: 0.2 }} className="h-[50px] rounded-[12px] bg-[#34C759] text-white sf-headline flex items-center justify-center gap-2">
  <Check className="w-5 h-5 stroke-[3]" />
  <span>Settled · Ledger #54192840</span>
</motion.div>`,
    error: `<motion.div animate={{ x: [0, -10, 10, -6, 6, 0] }} transition={{ duration: 0.4 }} className="h-[50px] rounded-[12px] bg-[#FF3B30]/15 border border-[#FF3B30] text-[#FF3B30] sf-headline flex items-center justify-center gap-2">
  <AlertTriangle className="w-5 h-5" />
  <span>Invalid Stellar MED25519 Checksum</span>
</motion.div>`,
  };

  return (
    <div className="space-y-6">
      {/* Header & Deliverable Sub-Nav */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="sf-title-1 text-black dark:text-white">
            Apple HIG Design System &amp; Architecture Spec
          </h1>
          <p className="sf-subheadline text-black/60 dark:text-white/60 mt-0.5">
            Complete Design Token Dictionary, 6-State Component Matrix, and End-to-End UX Interaction Flow
          </p>
        </div>

        {/* Segmented Control for the 3 Required Deliverables */}
        <div className="inline-flex p-1 rounded-[10px] bg-white dark:bg-[#1C1C1E] border border-black/8 dark:border-white/10 self-start">
          <button
            type="button"
            onClick={() => setActiveDeliverableTab('tokens')}
            className={`px-3.5 py-1.5 rounded-[8px] sf-footnote font-semibold flex items-center gap-1.5 transition-all ${
              activeDeliverableTab === 'tokens'
                ? 'bg-[#007AFF] text-white shadow-xs'
                : 'text-black/65 dark:text-white/65 hover:text-black dark:hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>1. Token Dictionary</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDeliverableTab('architecture')}
            className={`px-3.5 py-1.5 rounded-[8px] sf-footnote font-semibold flex items-center gap-1.5 transition-all ${
              activeDeliverableTab === 'architecture'
                ? 'bg-[#007AFF] text-white shadow-xs'
                : 'text-black/65 dark:text-white/65 hover:text-black dark:hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>2. Component States</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDeliverableTab('flow')}
            className={`px-3.5 py-1.5 rounded-[8px] sf-footnote font-semibold flex items-center gap-1.5 transition-all ${
              activeDeliverableTab === 'flow'
                ? 'bg-[#007AFF] text-white shadow-xs'
                : 'text-black/65 dark:text-white/65 hover:text-black dark:hover:text-white'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>3. UX Interaction Flow</span>
          </button>
        </div>
      </div>

      {/* DELIVERABLE 1: DESIGN SYSTEM TOKEN DICTIONARY */}
      {activeDeliverableTab === 'tokens' && (
        <div className="space-y-6">
          {/* Semantic Color Tokens Grid */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-6 apple-card-elevated border border-black/5 dark:border-white/8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="sf-title-2 text-black dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#007AFF]" />
                <span>Semantic Color &amp; Surface Tokens (Light &amp; Dark)</span>
              </h2>
              <span className="sf-caption text-black/50 dark:text-white/50">
                WCAG AA Verified · 8pt Spatial Grid
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse sf-footnote">
                <thead>
                  <tr className="border-b border-black/8 dark:border-white/10 sf-caption font-semibold text-black/55 dark:text-white/55">
                    <th className="py-2.5 pr-4">Token Name</th>
                    <th className="py-2.5 px-4">CSS Custom Property</th>
                    <th className="py-2.5 px-4">Light Mode Value</th>
                    <th className="py-2.5 px-4">Dark Mode Value</th>
                    <th className="py-2.5 pl-4">HIG Application</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/6 dark:divide-white/8">
                  {colorTokens.map((tok) => (
                    <tr key={tok.cssVar}>
                      <td className="py-3 pr-4 font-semibold text-black dark:text-white">
                        {tok.name}
                      </td>
                      <td className="py-3 px-4 sf-mono-tabular text-[#007AFF] dark:text-[#0A84FF]">
                        {tok.cssVar}
                      </td>
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-full border border-black/15 shadow-2xs"
                            style={{ backgroundColor: tok.lightHex }}
                          />
                          <span className="sf-mono-tabular text-black dark:text-white">
                            {tok.lightHex}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-full border border-white/25 shadow-2xs"
                            style={{ backgroundColor: tok.darkHex }}
                          />
                          <span className="sf-mono-tabular text-black dark:text-white">
                            {tok.darkHex}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pl-4 text-black/60 dark:text-white/60">{tok.usage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Apple SF Typography Hierarchy */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-6 apple-card-elevated border border-black/5 dark:border-white/8 space-y-4">
            <h2 className="sf-title-2 text-black dark:text-white flex items-center gap-2">
              <Type className="w-5 h-5 text-[#007AFF]" />
              <span>Typography Hierarchy (Apple SF Pro &amp; SF Mono)</span>
            </h2>

            <div className="divide-y divide-black/6 dark:divide-white/8">
              {typographyScale.map((item) => (
                <div
                  key={item.role}
                  className="py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 lg:w-72 shrink-0">
                    <div className="sf-footnote font-semibold text-black dark:text-white">
                      {item.role}
                    </div>
                    <div className="sf-mono-tabular sf-caption text-black/50 dark:text-white/50">
                      {item.family} · {item.size} · {item.weight} · Tracking {item.tracking}
                    </div>
                  </div>
                  <div className={`${item.className} text-black dark:text-white truncate`}>
                    {item.sample}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Copyable CSS Variables Block */}
          <div className="bg-[#0B0C10] text-white rounded-[20px] p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sf-footnote font-semibold">
                <Layers className="w-4 h-4 text-[#0A84FF]" />
                <span>CSS / Tailwind Design Token Dictionary</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(cssTokenExport);
                  setCopiedTokenBlock(true);
                  setTimeout(() => setCopiedTokenBlock(false), 1800);
                }}
                className="apple-pressable px-3 py-1 rounded-[8px] bg-white/10 hover:bg-white/15 sf-caption font-semibold flex items-center gap-1.5"
              >
                {copiedTokenBlock ? (
                  <Check className="w-3.5 h-3.5 text-[#30D158]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedTokenBlock ? 'Copied CSS Tokens' : 'Copy CSS Dictionary'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-[14px] bg-black/60 border border-white/10 sf-mono-tabular text-xs text-[#30D158] overflow-x-auto leading-relaxed">
              {cssTokenExport}
            </pre>
          </div>
        </div>
      )}

      {/* DELIVERABLE 2: COMPLETE COMPONENT ARCHITECTURE & STATE MATRIX */}
      {activeDeliverableTab === 'architecture' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white dark:bg-[#1C1C1E] rounded-[20px] p-6 apple-card-elevated border border-black/5 dark:border-white/8 space-y-5">
            <div>
              <h2 className="sf-title-2 text-black dark:text-white">
                Interactive Component State Matrix
              </h2>
              <p className="sf-footnote text-black/60 dark:text-white/60 mt-1">
                Inspect every state required by Apple HIG (Default, Hover, Active/Pressed, Loading Ring, Success Checkmark, and Error Haptic Shake).
              </p>
            </div>

            {/* State Selector */}
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'default', label: '1. Default' },
                  { id: 'hover', label: '2. Hover' },
                  { id: 'pressed', label: '3. Pressed (0.96x)' },
                  { id: 'loading', label: '4. Pulsing Ring' },
                  { id: 'success', label: '5. Settled (Spring)' },
                  { id: 'error', label: '6. Haptic Shake' },
                ] as { id: InteractiveStateMode; label: string }[]
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStateMode(st.id)}
                  className={`py-2 px-3 rounded-[10px] sf-caption font-semibold transition-all ${
                    selectedStateMode === st.id
                      ? 'bg-[#007AFF] text-white shadow-xs'
                      : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-black/75 dark:text-white/75'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Live Rendered Specimen Box */}
            <div className="p-8 rounded-[18px] bg-[#F2F2F7] dark:bg-[#2C2C2E] flex flex-col items-center justify-center min-h-[160px]">
              {selectedStateMode === 'default' && (
                <button
                  type="button"
                  className="w-full max-w-sm h-[50px] rounded-[12px] bg-black dark:bg-white text-white dark:text-black sf-headline flex items-center justify-center gap-2.5 shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-[#0A84FF]" />
                  <span>Pay 45.00 USDC with Freighter</span>
                </button>
              )}

              {selectedStateMode === 'hover' && (
                <button
                  type="button"
                  className="w-full max-w-sm h-[50px] rounded-[12px] bg-black/90 dark:bg-white/90 text-white dark:text-black sf-headline flex items-center justify-center gap-2.5 shadow-md ring-2 ring-[#007AFF]/50"
                >
                  <Sparkles className="w-4 h-4 text-[#0A84FF]" />
                  <span>Pay 45.00 USDC with Freighter</span>
                </button>
              )}

              {selectedStateMode === 'pressed' && (
                <button
                  type="button"
                  className="w-full max-w-sm h-[50px] rounded-[12px] bg-black dark:bg-white text-white dark:text-black sf-headline flex items-center justify-center gap-2.5 scale-[0.96] shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-[#0A84FF]" />
                  <span>Pay 45.00 USDC with Freighter (scale: 0.96)</span>
                </button>
              )}

              {selectedStateMode === 'loading' && (
                <div className="w-full max-w-sm h-[50px] rounded-[12px] bg-[#007AFF]/12 border border-[#007AFF]/30 flex items-center justify-center gap-3">
                  <div className="relative w-5 h-5 flex items-center justify-center">
                    <span className="absolute inset-0 rounded-full border-2 border-[#007AFF] animate-ping" />
                    <Lock className="w-3 h-3 text-[#007AFF]" />
                  </div>
                  <span className="sf-headline text-[#007AFF]">Verifying on Stellar Horizon SSE…</span>
                </div>
              )}

              {selectedStateMode === 'success' && (
                <motion.div
                  key="success-spec"
                  initial={{ scale: 0.85 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.45, bounce: 0.25 }}
                  className="w-full max-w-sm h-[50px] rounded-[12px] bg-[#34C759] text-white sf-headline flex items-center justify-center gap-2 shadow-sm"
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>Settled · Ledger #54192840</span>
                </motion.div>
              )}

              {selectedStateMode === 'error' && (
                <motion.div
                  key="error-spec"
                  animate={{ x: [0, -10, 10, -6, 6, -3, 3, 0] }}
                  transition={{ duration: 0.42 }}
                  className="w-full max-w-sm h-[50px] rounded-[12px] bg-[#FF3B30]/15 border border-[#FF3B30] text-[#FF3B30] sf-headline flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span>Invalid Stellar MED25519 Checksum</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right: Semantic JSX / Tailwind Code Inspector */}
          <div className="lg:col-span-6 bg-[#0B0C10] text-white rounded-[20px] p-6 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="sf-footnote font-semibold text-white/85">
                JSX / Tailwind Markup ({selectedStateMode.toUpperCase()})
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(stateCodeMap[selectedStateMode]);
                  setCopiedComponentCode(true);
                  setTimeout(() => setCopiedComponentCode(false), 1800);
                }}
                className="apple-pressable px-3 py-1 rounded-[8px] bg-white/10 hover:bg-white/15 sf-caption font-semibold flex items-center gap-1.5"
              >
                {copiedComponentCode ? (
                  <Check className="w-3.5 h-3.5 text-[#30D158]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedComponentCode ? 'Copied Markup' : 'Copy JSX'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-[14px] bg-black/60 border border-white/10 sf-mono-tabular text-xs text-[#30D158] overflow-x-auto leading-relaxed">
              {stateCodeMap[selectedStateMode]}
            </pre>

            <div className="p-3.5 rounded-[12px] bg-white/5 border border-white/10 sf-caption text-white/70 space-y-1">
              <div className="font-semibold text-white">Direct Manipulation &amp; Accessibility Contract</div>
              <div>
                • Minimum 44pt × 44pt mobile touch targets; 28pt × 28pt dense desktop cursor targets.
              </div>
              <div>
                • Respects <code className="sf-mono-tabular">@media (prefers-reduced-motion: reduce)</code> and <code className="sf-mono-tabular">prefers-reduced-transparency</code>.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELIVERABLE 3: INTERACTION FLOW (TRIGGER TO FINAL CONFIRMATION) */}
      {activeDeliverableTab === 'flow' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: 'Step 01 · Creation Trigger',
              title: 'Voice or Portal Invoice Provisioning',
              surface: 'telegram' as EnvironmentSurface,
              surfaceLabel: 'Open Telegram Mini-App',
              details:
                'Merchant records a voice note in Telegram ("Bill @alex 50 USDC") or clicks New Invoice in the macOS Portal. Celery decodes Opus audio via Whisper STT, extracts JSON attributes, and encodes a 64-bit Sub-ID into a Stellar Multiplexed M-address (MED25519).',
            },
            {
              step: 'Step 02 · Payer Selection',
              title: 'Apple Pay Sheet · Wallet vs Manual QR',
              surface: 'widget' as EnvironmentSurface,
              surfaceLabel: 'Open Checkout Sheet',
              details:
                'Payer opens the payment link on desktop (420px centered card) or mobile (rubber-band bottom sheet). Payer toggles between One-Click Wallet (Freighter / Albedo SEP-0043 signature) or Manual Transfer (QR + Copyable M-address + 64-bit Memo ID).',
            },
            {
              step: 'Step 03 · Horizon Verification',
              title: 'SSE Stream & Idempotency Lock',
              surface: 'overlay' as EnvironmentSurface,
              surfaceLabel: 'Open OBS Stream Studio',
              details:
                'The Stellar Horizon Daemon receives the incoming transaction envelope in ~3.5s, locks tx_hash in Redis for replay protection, and broadcasts a pub/sub settlement event while the checkout widget morphs its pulsing ring into a spring checkmark.',
            },
            {
              step: 'Step 04 · Multimodal Confirmation',
              title: 'Dynamic Island HUD & HMAC Webhook',
              surface: 'portal' as EnvironmentSurface,
              surfaceLabel: 'Open Merchant Ledger',
              details:
                'Simultaneously: (1) OBS Dynamic Island expands with spring(damping:15, stiffness:120) for 6s showing donor message & ledger proof, (2) Merchant Portal updates KPIs, and (3) Celery dispatches an HMAC-SHA256 signed webhook.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-5 apple-card-elevated border border-black/5 dark:border-white/8 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="sf-caption font-semibold text-[#007AFF] dark:text-[#0A84FF]">
                  {item.step}
                </div>
                <h3 className="sf-headline text-black dark:text-white">{item.title}</h3>
                <p className="sf-footnote text-black/65 dark:text-white/65 leading-relaxed">
                  {item.details}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigateSurface(item.surface)}
                className="apple-pressable w-full py-2.5 px-3 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#007AFF] hover:text-white text-black dark:text-white sf-caption font-semibold flex items-center justify-between transition-colors"
              >
                <span>{item.surfaceLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
