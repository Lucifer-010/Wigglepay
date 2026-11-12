import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Play,
  Copy,
  Check,
  Share2,
  Code2,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Lock,
  Sliders,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Shield,
  Layers,
  Palette,
  X,
} from 'lucide-react';
import {
  TipLinkCard,
  TipSourceSite,
  AssetType,
  WidgetVisualTheme,
  BannerStylePreset,
  MERCHANT_IDENTITY,
} from '../data/wigglePayData';

interface TipLinksAndEmbedStudioProps {
  mode: 'tiplinks' | 'embedcode';
  onSwitchMode: (mode: 'tiplinks' | 'embedcode') => void;
  tipLinks: TipLinkCard[];
  tipSources: TipSourceSite[];
  onCreateTipLink: (link: TipLinkCard) => void;
  onDeleteTipLink: (id: string) => void;
  onSetPrimaryTipLink: (id: string) => void;
  onTestTipFlow: (amount: number, asset: AssetType, message: string) => void;
  onOpenFullCheckoutWidget: () => void;
}

export const TipLinksAndEmbedStudio: React.FC<TipLinksAndEmbedStudioProps> = ({
  mode,
  onSwitchMode,
  tipLinks,
  tipSources,
  onCreateTipLink,
  onDeleteTipLink,
  onSetPrimaryTipLink,
  onTestTipFlow,
  onOpenFullCheckoutWidget,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Full-Page Builder State ("Create a New Widget & Paylink")
  const [isBuilderOpen, setIsBuilderOpen] = useState<boolean>(false);
  const [editingLink, setEditingLink] = useState<TipLinkCard | null>(null);

  // Builder Form Fields matching the Reference Design
  const [formTitle, setFormTitle] = useState('Main Paylink');
  const [formSlug, setFormSlug] = useState('main');
  const [formPublicTitle, setFormPublicTitle] = useState('Support this Creator');
  const [formVisualTheme, setFormVisualTheme] = useState<WidgetVisualTheme>('Dark');
  const [formDesc, setFormDesc] = useState(
    'Support my journey and content creation with instant Stellar payments!'
  );
  const [formAvatarInitials, setFormAvatarInitials] = useState('M');
  const [formAvatarUrl, setFormAvatarUrl] = useState('');
  const [formBannerStyle, setFormBannerStyle] = useState<BannerStylePreset>('violet-gradient');
  const [formBannerUrl, setFormBannerUrl] = useState('');
  const [formUsdcPresets, setFormUsdcPresets] = useState<[number, number, number, number]>([
    1, 2, 5, 10,
  ]);
  const [formXlmPresets, setFormXlmPresets] = useState<[number, number, number, number]>([
    5, 10, 25, 50,
  ]);
  const [formUsdtPresets, setFormUsdtPresets] = useState<[number, number, number, number]>([
    1, 2, 5, 10,
  ]);
  const [formIsPrimary, setFormIsPrimary] = useState<boolean>(false);
  const [formModerationEnabled, setFormModerationEnabled] = useState<boolean>(false);
  const [formBlockedKeywords, setFormBlockedKeywords] = useState<string>('spam, scam, phishing');
  const [showModerationModal, setShowModerationModal] = useState<boolean>(false);

  // Builder Live Supporter Preview Interactive State
  const [builderPreviewAsset, setBuilderPreviewAsset] = useState<AssetType>('USDC');
  const [builderSelectedIdx, setBuilderSelectedIdx] = useState<number>(2); // defaults to 3rd preset (e.g. 5 USDC)

  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);

  // Embed Code Studio State
  const [embedFormat, setEmbedFormat] = useState<'Widget' | 'Button' | 'Paylink'>('Widget');
  const [embedMethod, setEmbedMethod] = useState<'javascript' | 'iframe'>('javascript');
  const [selectedGuide, setSelectedGuide] = useState<string>('HTML');
  const [copiedCode, setCopiedCode] = useState(false);

  // Interactive Live Safari Preview Widget State
  const [previewAsset, setPreviewAsset] = useState<AssetType>('USDC');
  const [previewAmount, setPreviewAmount] = useState<number>(5);
  const [customPreviewAmount, setCustomPreviewAmount] = useState<string>('');
  const [previewDonorMessage, setPreviewDonorMessage] = useState<string>('');
  const [showDonorInput, setShowDonorInput] = useState<boolean>(false);

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard?.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const openCreateBuilder = () => {
    setEditingLink(null);
    setFormTitle('Main Paylink');
    setFormSlug('main');
    setFormPublicTitle('Support this Creator');
    setFormVisualTheme('Dark');
    setFormDesc('Support my journey and content creation with instant Stellar payments!');
    setFormAvatarInitials('M');
    setFormAvatarUrl('');
    setFormBannerStyle('violet-gradient');
    setFormBannerUrl('');
    setFormUsdcPresets([1, 2, 5, 10]);
    setFormXlmPresets([5, 10, 25, 50]);
    setFormUsdtPresets([1, 2, 5, 10]);
    setFormIsPrimary(false);
    setFormModerationEnabled(false);
    setFormBlockedKeywords('spam, scam, phishing');
    setBuilderPreviewAsset('USDC');
    setBuilderSelectedIdx(2);
    setIsBuilderOpen(true);
  };

  const openEditBuilder = (card: TipLinkCard) => {
    setEditingLink(card);
    setFormTitle(card.title);
    setFormSlug(card.slugQuery.replace('?widget=', ''));
    setFormPublicTitle(card.publicTitle || card.title);
    setFormVisualTheme(card.themeBadge || 'Dark');
    setFormDesc(card.description);
    setFormAvatarInitials(card.avatarInitials || 'M');
    setFormAvatarUrl(card.avatarUrl || '');
    setFormBannerStyle(card.bannerStyle);
    setFormBannerUrl(card.bannerUrl || '');
    setFormUsdcPresets(card.usdcPresets || [1, 2, 5, 10]);
    setFormXlmPresets(card.xlmPresets || [5, 10, 25, 50]);
    setFormUsdtPresets(card.usdtPresets || [1, 2, 5, 10]);
    setFormIsPrimary(card.isPrimary);
    setFormModerationEnabled(card.moderationEnabled || false);
    setFormBlockedKeywords(card.blockedKeywords || 'spam, scam, phishing');
    setBuilderPreviewAsset(card.defaultAsset || 'USDC');
    setBuilderSelectedIdx(2);
    setIsBuilderOpen(true);
  };

  const handleSaveWidgetAndPaylink = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanSlug =
      formSlug
        .trim()
        .toLowerCase()
        .replace(/^\?widget=/, '')
        .replace(/[^a-z0-9-_]/g, '') || 'main';

    const newCard: TipLinkCard = {
      id: editingLink ? editingLink.id : `tl-${Date.now()}`,
      title: formTitle.trim() || 'Main Paylink',
      publicTitle: formPublicTitle.trim() || 'Support this Creator',
      slugQuery: `?widget=${cleanSlug}`,
      description:
        formDesc.trim() || 'Support my journey and content creation with instant Stellar payments!',
      url: `https://wigglepay.app/luffy?widget=${cleanSlug}`,
      themeBadge: formVisualTheme,
      bannerStyle: formBannerStyle,
      avatarInitials: formAvatarInitials || 'M',
      avatarUrl: formAvatarUrl.trim() || undefined,
      bannerUrl: formBannerUrl.trim() || undefined,
      isPrimary: formIsPrimary,
      defaultAmount: formUsdcPresets[2] || 5,
      defaultAsset: 'USDC',
      usdcPresets: formUsdcPresets,
      xlmPresets: formXlmPresets,
      usdtPresets: formUsdtPresets,
      moderationEnabled: formModerationEnabled,
      blockedKeywords: formBlockedKeywords,
    };

    onCreateTipLink(newCard);
    if (formIsPrimary) {
      onSetPrimaryTipLink(newCard.id);
    }
    setIsBuilderOpen(false);
  };

  const handlePresetChange = (
    asset: 'USDC' | 'XLM' | 'USDT',
    index: number,
    rawValue: string
  ) => {
    const val = Math.max(0.1, parseFloat(rawValue) || 0);
    if (asset === 'USDC') {
      const next = [...formUsdcPresets] as [number, number, number, number];
      next[index] = val;
      setFormUsdcPresets(next);
    } else if (asset === 'XLM') {
      const next = [...formXlmPresets] as [number, number, number, number];
      next[index] = val;
      setFormXlmPresets(next);
    } else {
      const next = [...formUsdtPresets] as [number, number, number, number];
      next[index] = val;
      setFormUsdtPresets(next);
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'avatar' | 'banner'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (target === 'avatar') setFormAvatarUrl(reader.result);
        if (target === 'banner') setFormBannerUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const getBannerGradientClass = (preset: BannerStylePreset) => {
    if (preset === 'crimson-aurora') {
      return 'bg-gradient-to-r from-[#1C1C1E] via-[#FF3B30] to-[#FF9500]';
    }
    if (preset === 'emerald-mesh') {
      return 'bg-gradient-to-br from-[#0B1026] via-[#007AFF] to-[#34C759]';
    }
    return 'bg-gradient-to-br from-[#6A4CF5] via-[#8B5CF6] to-[#C4B5FD]';
  };

  const activeBuilderPresets =
    builderPreviewAsset === 'USDC'
      ? formUsdcPresets
      : builderPreviewAsset === 'XLM'
      ? formXlmPresets
      : formUsdtPresets;

  const activeBuilderAmount = activeBuilderPresets[builderSelectedIdx] ?? activeBuilderPresets[0];

  const getEmbedSnippet = () => {
    if (embedFormat === 'Paylink') {
      return `https://wigglepay.app/luffy?widget=main`;
    }
    if (embedMethod === 'iframe') {
      return `<iframe src="https://wigglepay.app/embed/luffy?format=${embedFormat.toLowerCase()}" width="420" height="540" style="border:none;border-radius:20px;"></iframe>`;
    }
    return `<div data-wigglepay="luffy" data-format="${embedFormat.toLowerCase()}"></div>\n<script src="https://wigglepay.app/w.js" async></script>`;
  };

  const guideInstructions: Record<string, string> = {
    WordPress:
      'Add a "Custom HTML" Gutenberg block anywhere on your page or post and paste the snippet above.',
    Webflow:
      'Drag an "Embed" element from the Add panel into your canvas and paste the JavaScript snippet.',
    Framer:
      'Insert an "Embed" component (Insert → Utility → Embed), select HTML mode, and paste the snippet.',
    Ghost: 'Type /html in the Ghost editor to insert an HTML card and paste the WigglePay script.',
    Notion: 'Type /embed in Notion and paste the direct WigglePay embed URL.',
    HTML: 'Paste the snippet right before the closing </body> tag or inside the container where the widget should appear.',
  };

  /* =========================================================================
     FULL-PAGE CREATE / EDIT WIDGET & PAYLINK BUILDER (MATCHING REFERENCE DESIGN)
     ========================================================================= */
  if (isBuilderOpen) {
    const cleanPreviewSlug =
      formSlug
        .trim()
        .toLowerCase()
        .replace(/^\?widget=/, '')
        .replace(/[^a-z0-9-_]/g, '') || 'main';

    return (
      <div className="space-y-6">
        {/* Hidden File Inputs for Avatar & Banner Upload */}
        <input
          ref={avatarFileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileUpload(e, 'avatar')}
          className="hidden"
        />
        <input
          ref={bannerFileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileUpload(e, 'banner')}
          className="hidden"
        />

        {/* Top Sticky Header Card */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-4 sm:px-6 sm:py-4 border border-black/8 dark:border-white/10 apple-card-elevated flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setIsBuilderOpen(false)}
              className="apple-pressable px-3.5 py-2 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-black/8 dark:hover:bg-white/15 text-black dark:text-white sf-caption font-semibold inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all widgets</span>
            </button>

            <div className="h-7 w-[1px] bg-black/10 dark:bg-white/10 hidden sm:block" />

            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#5856D6] dark:text-[#5E5CE6]">
                <Sparkles className="w-3 h-3" />
                <span>
                  {editingLink ? 'EDIT WIDGET & PAYLINK PAGE' : 'NEW WIDGET & PAYLINK PAGE'}
                </span>
              </div>
              <h1 className="sf-title-2 text-black dark:text-white leading-tight">
                {editingLink
                  ? `Configure ${editingLink.title}`
                  : 'Create a New Widget & Paylink'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setIsBuilderOpen(false)}
              className="apple-pressable px-4 py-2 rounded-full border border-black/12 dark:border-white/15 bg-white dark:bg-[#2C2C2E] text-black/75 dark:text-white/80 sf-caption font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSaveWidgetAndPaylink()}
              className="apple-pressable px-5 py-2.5 rounded-full bg-[#007AFF] dark:bg-[#0A84FF] text-white sf-caption font-semibold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{editingLink ? 'Save & Continue' : 'Create & Continue'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main 2-Column Split Layout: Left 4 Config Cards + Right Sticky Live Supporter Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN (7 Cols): 4 Numbered Builder Cards */}
          <form
            onSubmit={handleSaveWidgetAndPaylink}
            className="lg:col-span-7 space-y-6"
          >
            {/* CARD 1: 1. Purpose & Paylink Identity */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-5 sm:p-6 border border-black/8 dark:border-white/10 apple-card-elevated space-y-5">
              <div className="pb-3 border-b border-black/6 dark:border-white/8 flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-[#5856D6] dark:text-[#5E5CE6]" />
                <h2 className="sf-headline text-black dark:text-white">
                  1. Purpose &amp; Paylink Identity
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block sf-caption font-semibold text-black dark:text-white mb-1.5">
                    Purpose / Paylink Name *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Main Paylink"
                    required
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-white dark:bg-[#2C2C2E] border border-black/12 dark:border-white/12 sf-footnote text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>

                <div>
                  <label className="block sf-caption font-semibold text-black dark:text-white mb-1.5">
                    Custom URL Slug *
                  </label>
                  <div className="px-3.5 py-2.5 rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-black/8 dark:border-white/10 flex items-center">
                    <span className="sf-mono-tabular sf-caption text-black/45 dark:text-white/45 select-none">
                      ?widget=
                    </span>
                    <input
                      type="text"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      placeholder="main"
                      required
                      className="w-full bg-transparent sf-mono-tabular sf-caption font-bold text-black dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Full URL Read-Only Preview Pill */}
              <div className="px-4 py-2.5 rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E] sf-mono-tabular sf-caption text-black/60 dark:text-white/65 truncate">
                https://wigglepay.app/luffy?widget={cleanPreviewSlug}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block sf-caption font-semibold text-black dark:text-white mb-1.5">
                    Public Widget Title
                  </label>
                  <input
                    type="text"
                    value={formPublicTitle}
                    onChange={(e) => setFormPublicTitle(e.target.value)}
                    placeholder="Support this Creator"
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-white dark:bg-[#2C2C2E] border border-black/12 dark:border-white/12 sf-footnote text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>

                <div>
                  <label className="block sf-caption font-semibold text-black dark:text-white mb-1.5">
                    Visual Theme
                  </label>
                  <div className="grid grid-cols-4 p-1 rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E]">
                    {(['Light', 'Dark', 'Midnight', 'Cyber'] as WidgetVisualTheme[]).map(
                      (thm) => (
                        <button
                          key={thm}
                          type="button"
                          onClick={() => setFormVisualTheme(thm)}
                          className={`py-1.5 rounded-[8px] sf-caption font-semibold transition-all ${
                            formVisualTheme === thm
                              ? 'bg-white dark:bg-[#3A3A3C] text-black dark:text-white shadow-2xs'
                              : 'text-black/55 dark:text-white/55 hover:text-black dark:hover:text-white'
                          }`}
                        >
                          {thm}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block sf-caption font-semibold text-black dark:text-white mb-1.5">
                  Welcome / Supporter Message
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Support my journey and content creation with instant Stellar payments!"
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-white dark:bg-[#2C2C2E] border border-black/12 dark:border-white/12 sf-footnote text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>
            </div>

            {/* CARD 2: 2. Custom Avatar & Header Banner */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-5 sm:p-6 border border-black/8 dark:border-white/10 apple-card-elevated space-y-5">
              <div className="pb-3 border-b border-black/6 dark:border-white/8 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Palette className="w-4 h-4 text-[#5856D6] dark:text-[#5E5CE6]" />
                  <h2 className="sf-headline text-black dark:text-white">
                    2. Custom Avatar &amp; Header Banner
                  </h2>
                </div>
                <span className="sf-caption text-black/45 dark:text-white/45">
                  Upload from device or enter URL
                </span>
              </div>

              {/* Avatar / Profile Picture Section */}
              <div className="space-y-3">
                <label className="block sf-caption font-semibold text-black dark:text-white">
                  Paylink Avatar / Profile Picture
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#0B1026] text-white font-bold sf-headline flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    {formAvatarUrl ? (
                      <img
                        src={formAvatarUrl}
                        alt="Paylink Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{formAvatarInitials}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="apple-pressable px-4 py-2 rounded-[10px] bg-[#0B1026] dark:bg-white text-white dark:text-black sf-caption font-semibold inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#34C759] dark:text-[#007AFF]" />
                    <span>Upload Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormAvatarUrl('');
                      setFormAvatarInitials('ML');
                    }}
                    className="apple-pressable px-4 py-2 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-black/8 dark:border-white/10 text-black dark:text-white sf-caption font-semibold"
                  >
                    Use Profile Avatar
                  </button>
                </div>

                <input
                  type="url"
                  value={formAvatarUrl}
                  onChange={(e) => setFormAvatarUrl(e.target.value)}
                  placeholder="Or enter image URL: https://... (PNG, JPG, WEBP, SVG)"
                  className="w-full px-3.5 py-2 rounded-[10px] bg-white dark:bg-[#2C2C2E] border border-black/10 dark:border-white/12 sf-caption text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>

              {/* Header Banner Section */}
              <div className="space-y-3 pt-1">
                <label className="block sf-caption font-semibold text-black dark:text-white">
                  Paylink Header Banner
                </label>

                <div
                  className={`relative h-28 rounded-[16px] border border-black/10 dark:border-white/12 overflow-hidden flex flex-col items-center justify-center p-4 ${
                    formBannerUrl ? '' : 'bg-[#F2F2F7] dark:bg-[#2C2C2E]'
                  }`}
                >
                  {formBannerUrl ? (
                    <img
                      src={formBannerUrl}
                      alt="Header Banner"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center space-y-1">
                      <ImageIcon className="w-6 h-6 text-black/35 dark:text-white/35 mx-auto" />
                      <div className="sf-caption text-black/50 dark:text-white/50">
                        No custom image uploaded (selected gradient preset will be used)
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    className="apple-pressable absolute top-3 right-3 z-10 px-3.5 py-1.5 rounded-[10px] bg-[#0B1026] text-white sf-caption font-semibold inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#34C759]" />
                    <span>Upload Banner</span>
                  </button>
                </div>

                <input
                  type="url"
                  value={formBannerUrl}
                  onChange={(e) => setFormBannerUrl(e.target.value)}
                  placeholder="Or enter banner URL: https://... (Unsplash, Imgur, or direct link)"
                  className="w-full px-3.5 py-2 rounded-[10px] bg-white dark:bg-[#2C2C2E] border border-black/10 dark:border-white/12 sf-caption text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <span className="sf-caption text-black/50 dark:text-white/50">
                    Banner Presets:
                  </span>
                  {(
                    [
                      { id: 'emerald-mesh', label: 'Retro Tech' },
                      { id: 'violet-gradient', label: 'Violet Flow' },
                      { id: 'crimson-aurora', label: 'Gradient Glow' },
                    ] as { id: BannerStylePreset; label: string }[]
                  ).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setFormBannerUrl('');
                        setFormBannerStyle(preset.id);
                      }}
                      className={`px-3 py-1 rounded-[8px] sf-caption font-medium border transition-all ${
                        !formBannerUrl && formBannerStyle === preset.id
                          ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF] dark:text-[#0A84FF] font-semibold'
                          : 'border-black/10 dark:border-white/12 bg-[#F2F2F7] dark:bg-[#2C2C2E] text-black/70 dark:text-white/70'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CARD 3: 3. Suggested Payment Amounts */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-5 sm:p-6 border border-black/8 dark:border-white/10 apple-card-elevated space-y-5">
              <div className="pb-3 border-b border-black/6 dark:border-white/8 flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#5856D6] dark:text-[#5E5CE6]" />
                <h2 className="sf-headline text-black dark:text-white">
                  3. Suggested Payment Amounts
                </h2>
              </div>

              {/* USDC Presets */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 sf-caption font-semibold text-black/75 dark:text-white/80">
                  <span className="w-4 h-4 rounded-full bg-[#007AFF] text-white text-[10px] font-bold inline-flex items-center justify-center">
                    $
                  </span>
                  <span>USDC Presets ($ Dollar Value)</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {formUsdcPresets.map((val, idx) => (
                    <input
                      key={`usdc-${idx}`}
                      type="number"
                      step="any"
                      value={val}
                      onChange={(e) => handlePresetChange('USDC', idx, e.target.value)}
                      className="w-full py-2 px-3 rounded-[10px] bg-white dark:bg-[#2C2C2E] border border-black/12 dark:border-white/12 text-center sf-mono-tabular sf-footnote font-bold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                    />
                  ))}
                </div>
              </div>

              {/* XLM Presets */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 sf-caption font-semibold text-black/75 dark:text-white/80">
                  <span className="w-4 h-4 rounded-full bg-[#0B1026] dark:bg-white text-white dark:text-black text-[10px] font-bold inline-flex items-center justify-center">
                    ✦
                  </span>
                  <span>XLM Presets (Stroops / Lumens)</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {formXlmPresets.map((val, idx) => (
                    <input
                      key={`xlm-${idx}`}
                      type="number"
                      step="any"
                      value={val}
                      onChange={(e) => handlePresetChange('XLM', idx, e.target.value)}
                      className="w-full py-2 px-3 rounded-[10px] bg-white dark:bg-[#2C2C2E] border border-black/12 dark:border-white/12 text-center sf-mono-tabular sf-footnote font-bold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                    />
                  ))}
                </div>
              </div>

              {/* USDT Presets */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 sf-caption font-semibold text-black/75 dark:text-white/80">
                  <span className="w-4 h-4 rounded-full bg-[#34C759] text-white text-[10px] font-bold inline-flex items-center justify-center">
                    ₮
                  </span>
                  <span>USDT Presets (Tether)</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {formUsdtPresets.map((val, idx) => (
                    <input
                      key={`usdt-${idx}`}
                      type="number"
                      step="any"
                      value={val}
                      onChange={(e) => handlePresetChange('USDT', idx, e.target.value)}
                      className="w-full py-2 px-3 rounded-[10px] bg-white dark:bg-[#2C2C2E] border border-black/12 dark:border-white/12 text-center sf-mono-tabular sf-footnote font-bold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                    />
                  ))}
                </div>
              </div>

              {/* Primary Default Paylink Toggle Row */}
              <label className="pt-3 border-t border-black/6 dark:border-white/8 flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <div className="sf-footnote font-semibold text-black dark:text-white">
                    Primary Default Paylink
                  </div>
                  <div className="sf-caption text-black/55 dark:text-white/55">
                    Make this your default landing page widget when visiting your main profile URL.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formIsPrimary}
                  onChange={(e) => setFormIsPrimary(e.target.checked)}
                  className="w-5 h-5 rounded-[6px] accent-[#007AFF] cursor-pointer"
                />
              </label>
            </div>

            {/* CARD 4: 4. Supporter Remark & Comment Moderation */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-5 sm:p-6 border border-black/8 dark:border-white/10 apple-card-elevated space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-[#5856D6] dark:text-[#5E5CE6]" />
                  <h2 className="sf-headline text-black dark:text-white">
                    4. Supporter Remark &amp; Comment Moderation
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] sf-caption text-black/55 dark:text-white/55">
                    Optional
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowModerationModal(true)}
                    className="apple-pressable px-3.5 py-1.5 rounded-[10px] bg-[#5856D6]/12 text-[#5856D6] dark:text-[#5E5CE6] sf-caption font-semibold inline-flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Configure Filter Rules</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-[14px] bg-[#F2F2F7] dark:bg-[#2C2C2E] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 sf-footnote font-semibold text-black dark:text-white">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        formModerationEnabled ? 'bg-[#34C759]' : 'bg-black/35 dark:bg-white/35'
                      }`}
                    />
                    <span>
                      {formModerationEnabled
                        ? 'Filter Active (Profanity & blocked terms filtered)'
                        : 'Filter Disabled (All remarks accepted)'}
                    </span>
                  </div>
                  <p className="sf-caption text-black/55 dark:text-white/55">
                    Optional protection against spam, harassment, and inappropriate remarks when supporters send you payments.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setFormModerationEnabled((v) => !v)}
                    className="px-3 py-1.5 rounded-full bg-white dark:bg-[#1C1C1E] border border-black/8 dark:border-white/10 sf-caption font-semibold text-black/70 dark:text-white/75"
                  >
                    {formModerationEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModerationModal(true)}
                    className="apple-pressable px-3.5 py-1.5 rounded-full bg-[#0B1026] dark:bg-white text-white dark:text-black sf-caption font-semibold inline-flex items-center gap-1"
                  >
                    <span>Manage Rules</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Action Bar Card */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] p-4 sm:px-6 border border-black/8 dark:border-white/10 apple-card-elevated flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setIsBuilderOpen(false)}
                className="apple-pressable px-5 py-2.5 rounded-full border border-black/12 dark:border-white/15 bg-white dark:bg-[#2C2C2E] text-black/75 dark:text-white/80 sf-caption font-semibold"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="apple-pressable px-6 py-2.5 rounded-full bg-[#007AFF] dark:bg-[#0A84FF] text-white sf-caption font-semibold inline-flex items-center gap-2 shadow-sm"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{editingLink ? 'Save & Continue' : 'Create & Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* RIGHT COLUMN (5 Cols, Sticky): Dark Stage with [ Live Supporter Preview ] */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="rounded-[24px] bg-[#0B1026] dark:bg-[#12131A] p-6 sm:p-7 shadow-xl border border-white/10 space-y-5">
              <div className="flex items-center justify-center gap-2 text-xs font-mono font-semibold text-[#34C759]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>[ Live Supporter Preview ]</span>
              </div>

              {/* Inner Supporter Widget Card */}
              <div
                className={`rounded-[22px] overflow-hidden shadow-2xl border transition-colors ${
                  formVisualTheme === 'Dark' || formVisualTheme === 'Midnight'
                    ? 'bg-[#1C1C1E] text-white border-white/12'
                    : formVisualTheme === 'Cyber'
                    ? 'bg-[#0F172A] text-white border-[#007AFF]/40'
                    : 'bg-white text-[#0B1026] border-black/8'
                }`}
              >
                {/* Banner */}
                <div
                  className={`relative h-24 w-full p-3 flex justify-end items-start ${
                    formBannerUrl ? '' : getBannerGradientClass(formBannerStyle)
                  }`}
                >
                  {formBannerUrl && (
                    <img
                      src={formBannerUrl}
                      alt="Preview Banner"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <span className="relative z-10 px-2.5 py-0.5 rounded-full bg-black/70 text-[#34C759] text-[10px] font-bold backdrop-blur-md">
                    Stellar Live
                  </span>
                </div>

                {/* Overlapping Avatar + #slug Badge */}
                <div className="px-5 -mt-7 relative z-10 flex items-end justify-between">
                  <div className="w-14 h-14 rounded-full bg-[#0B1026] text-[#34C759] font-extrabold text-lg border-[3px] border-white dark:border-[#1C1C1E] flex items-center justify-center overflow-hidden shadow-md">
                    {formAvatarUrl ? (
                      <img
                        src={formAvatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{formAvatarInitials}</span>
                    )}
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-[#5856D6]/15 text-[#5856D6] dark:text-[#A78BFA] sf-mono-tabular text-xs font-bold">
                    #{cleanPreviewSlug}
                  </span>
                </div>

                {/* Widget Content */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="sf-title-2 font-bold">
                      {formPublicTitle || 'Support this Creator'}
                    </h3>
                    <p
                      className={`sf-caption mt-1 leading-relaxed ${
                        formVisualTheme === 'Light' ? 'text-black/60' : 'text-white/65'
                      }`}
                    >
                      {formDesc ||
                        'Support my journey and content creation with instant Stellar payments!'}
                    </p>
                  </div>

                  {/* Asset Switcher: USDC | XLM | USDT */}
                  <div
                    className={`grid grid-cols-3 p-1 rounded-[12px] ${
                      formVisualTheme === 'Light' ? 'bg-[#F2F2F7]' : 'bg-white/10'
                    }`}
                  >
                    {(['USDC', 'XLM', 'USDT'] as AssetType[]).map((ast) => (
                      <button
                        key={ast}
                        type="button"
                        onClick={() => setBuilderPreviewAsset(ast)}
                        className={`py-1.5 rounded-[9px] sf-caption font-bold transition-all ${
                          builderPreviewAsset === ast
                            ? formVisualTheme === 'Light'
                              ? 'bg-white text-black shadow-2xs'
                              : 'bg-white text-[#0B1026] shadow-2xs'
                            : formVisualTheme === 'Light'
                            ? 'text-black/55'
                            : 'text-white/65'
                        }`}
                      >
                        {ast}
                      </button>
                    ))}
                  </div>

                  {/* 4 Suggested Preset Amount Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {activeBuilderPresets.map((amt, idx) => {
                      const isSelected = builderSelectedIdx === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setBuilderSelectedIdx(idx)}
                          className={`py-2.5 rounded-[12px] sf-mono-tabular sf-footnote font-bold border transition-all ${
                            isSelected
                              ? 'bg-[#0B1026] dark:bg-[#007AFF] text-white border-transparent shadow-xs'
                              : formVisualTheme === 'Light'
                              ? 'bg-white border-black/10 text-black hover:bg-black/4'
                              : 'bg-white/6 border-white/10 text-white hover:bg-white/12'
                          }`}
                        >
                          {amt}
                        </button>
                      );
                    })}
                  </div>

                  {/* Primary Action CTA Button */}
                  <button
                    type="button"
                    onClick={() =>
                      onTestTipFlow(
                        activeBuilderAmount,
                        builderPreviewAsset,
                        `Live test payment from ${formTitle}!`
                      )
                    }
                    className="apple-pressable w-full py-3 rounded-[14px] bg-[#007AFF] hover:bg-[#0071EB] text-white sf-subheadline font-bold flex items-center justify-center gap-2 shadow-md"
                  >
                    <span className="w-5 h-5 rounded-full bg-white/20 text-white text-xs font-bold inline-flex items-center justify-center">
                      $
                    </span>
                    <span>
                      Pay {activeBuilderAmount} {builderPreviewAsset}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Moderation Rules Modal */}
        <AnimatePresence>
          {showModerationModal && (
            <div
              onClick={() => setShowModerationModal(false)}
              className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md apple-material-floating rounded-[20px] p-6 space-y-4 text-black dark:text-white"
              >
                <div className="flex items-center justify-between">
                  <h3 className="sf-title-2">Supporter Remark Moderation</h3>
                  <button
                    type="button"
                    onClick={() => setShowModerationModal(false)}
                    className="w-7 h-7 rounded-full bg-black/8 dark:bg-white/12 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <label className="flex items-center justify-between p-3.5 rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E] cursor-pointer">
                  <div>
                    <div className="sf-footnote font-semibold">Enable Automated Remark Filter</div>
                    <div className="sf-caption text-black/55 dark:text-white/55">
                      Blocks profanity and suspicious URLs from triggering OBS overlays
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formModerationEnabled}
                    onChange={(e) => setFormModerationEnabled(e.target.checked)}
                    className="w-5 h-5 accent-[#007AFF]"
                  />
                </label>

                <div>
                  <label className="block sf-caption font-semibold mb-1.5">
                    Blocked Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formBlockedKeywords}
                    onChange={(e) => setFormBlockedKeywords(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] sf-footnote"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowModerationModal(false)}
                  className="apple-pressable w-full py-2.5 rounded-[12px] bg-[#007AFF] text-white sf-subheadline font-semibold"
                >
                  Done
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* =========================================================================
     STANDARD STUDIO VIEW: WIDGETS & PAYLINKS GRID OR EMBED CODE STUDIO
     ========================================================================= */
  return (
    <div className="space-y-6">
      {/* Apple Segmented Control (8px radius) + Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Widget Studio Views"
          className="inline-flex p-1 rounded-[8px] bg-[#E5E5EA] dark:bg-[#2C2C2E] self-start"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'tiplinks'}
            onClick={() => onSwitchMode('tiplinks')}
            className={`px-3.5 py-1.5 rounded-[6px] sf-footnote font-semibold transition-all ${
              mode === 'tiplinks'
                ? 'bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-xs'
                : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
            }`}
          >
            Widgets &amp; Paylinks
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'embedcode'}
            onClick={() => onSwitchMode('embedcode')}
            className={`px-3.5 py-1.5 rounded-[6px] sf-footnote font-semibold transition-all ${
              mode === 'embedcode'
                ? 'bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-xs'
                : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
            }`}
          >
            Embed Studio &amp; Live Preview
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={openCreateBuilder}
            className="apple-pressable px-4 py-2.5 rounded-[12px] bg-[#007AFF] dark:bg-[#0A84FF] hover:opacity-95 text-white sf-footnote font-semibold flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create New Widget &amp; Paylink</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onTestTipFlow(50, 'USDC', 'Testing Paylink settlement from Widget Studio!');
            }}
            className="apple-pressable px-4 py-2.5 rounded-[12px] bg-black dark:bg-white text-white dark:text-black sf-footnote font-semibold flex items-center gap-2 shadow-xs whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current text-[#34C759] dark:text-[#007AFF]" />
            <span>Test Paylink Flow</span>
          </button>
        </div>
      </div>

      {/* MODE 1: WIDGETS & PAYLINKS GRID */}
      {mode === 'tiplinks' && (
        <div className="space-y-6">
          <div className="max-w-2xl">
            <h1 className="sf-large-title text-black dark:text-white">
              Widgets &amp; Paylinks
            </h1>
            <p className="sf-body text-black/60 dark:text-white/60 mt-1">
              Create multiple branded checkout widgets and shareable paylinks for Twitch, YouTube, Discord, or your website.
            </p>
          </div>

          {/* 3-Column Responsive Widget & Paylink Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {tipLinks.map((card) => (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', duration: 0.45, bounce: 0.15 }}
                className="bg-white dark:bg-[#1C1C1E] rounded-[20px] border border-black/8 dark:border-white/10 apple-card-elevated overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Top Banner Header */}
                  <div
                    className={`relative h-28 w-full p-3 flex justify-end items-start ${
                      card.bannerUrl ? '' : getBannerGradientClass(card.bannerStyle)
                    }`}
                  >
                    {card.bannerUrl && (
                      <img
                        src={card.bannerUrl}
                        alt={card.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <span className="relative z-10 px-2.5 py-0.5 rounded-full bg-black/65 text-white sf-caption font-medium backdrop-blur-md">
                      {card.themeBadge}
                    </span>
                  </div>

                  {/* Overlapping Avatar + Query Slug Row */}
                  <div className="px-5 -mt-7 relative z-10 flex items-end justify-between">
                    <div className="w-14 h-14 rounded-full bg-black dark:bg-[#2C2C2E] border-[3px] border-white dark:border-[#1C1C1E] flex items-center justify-center overflow-hidden shadow-sm">
                      {card.avatarUrl ? (
                        <img
                          src={card.avatarUrl}
                          alt={card.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="sf-headline font-bold text-white">
                          {card.avatarInitials}
                        </span>
                      )}
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-[#5856D6]/12 sf-mono-tabular sf-caption text-[#5856D6] dark:text-[#5E5CE6] font-semibold">
                      {card.slugQuery}
                    </span>
                  </div>

                  {/* Card Body Copy */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h2 className="sf-title-2 text-black dark:text-white">
                        {card.title}
                      </h2>
                      <p className="sf-footnote text-black/60 dark:text-white/60 mt-1 line-clamp-2 min-h-[36px]">
                        {card.description}
                      </p>
                    </div>

                    {/* Copyable Paylink URL Box */}
                    <div className="px-3.5 py-2.5 rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-between gap-2">
                      <span className="sf-mono-tabular sf-caption text-black/75 dark:text-white/80 truncate">
                        {card.url}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(card.id, card.url)}
                        aria-label="Copy paylink URL"
                        className="apple-pressable text-[#007AFF] dark:text-[#0A84FF] shrink-0"
                      >
                        {copiedId === card.id ? (
                          <Check className="w-4 h-4 text-[#34C759]" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* 3 Action Buttons */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(card.id, card.url)}
                        className="apple-pressable py-2 px-3 rounded-[10px] bg-[#007AFF]/12 text-[#007AFF] dark:text-[#0A84FF] sf-caption font-semibold flex items-center justify-center gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{copiedId === card.id ? 'Copied' : 'Share'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSwitchMode('embedcode')}
                        className="apple-pressable py-2 px-3 rounded-[10px] bg-black dark:bg-white text-white dark:text-black sf-caption font-semibold flex items-center justify-center gap-1.5"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Embed</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditBuilder(card)}
                        className="apple-pressable py-2 px-3 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] text-black dark:text-white sf-caption font-semibold flex items-center justify-center gap-1.5"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Set as Primary & Delete */}
                <div className="px-5 py-3.5 border-t border-black/6 dark:border-white/8 flex items-center justify-between sf-caption">
                  <button
                    type="button"
                    onClick={() => onSetPrimaryTipLink(card.id)}
                    className={`font-semibold transition-colors ${
                      card.isPrimary
                        ? 'text-[#34C759] dark:text-[#30D158]'
                        : 'text-[#007AFF] dark:text-[#0A84FF] hover:underline'
                    }`}
                  >
                    {card.isPrimary ? '✓ Primary Paylink' : 'Set as Primary'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteTipLink(card.id)}
                    className="apple-pressable text-[#FF3B30] dark:text-[#FF453A] hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </motion.div>
            ))}

            {/* Dashed "Create New Widget & Paylink" Card */}
            <button
              type="button"
              onClick={openCreateBuilder}
              className="apple-pressable min-h-[340px] rounded-[20px] border border-dashed border-black/20 dark:border-white/20 bg-white/50 dark:bg-[#1C1C1E]/50 hover:bg-white dark:hover:bg-[#1C1C1E] hover:border-[#007AFF] transition-all p-6 flex flex-col items-center justify-center text-center group"
            >
              <div className="w-12 h-12 rounded-[12px] bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-center text-[#007AFF] dark:text-[#0A84FF] group-hover:bg-[#007AFF] group-hover:text-white transition-colors mb-3">
                <Plus className="w-6 h-6" />
              </div>
              <div className="sf-headline text-black dark:text-white">
                Create New Widget &amp; Paylink
              </div>
              <p className="sf-footnote text-black/55 dark:text-white/55 max-w-[220px] mt-1">
                Configure custom presets, themes, and banners with live supporter preview.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* MODE 2: EMBED STUDIO & WELL-PADDED LIVE SAFARI PREVIEW */}
      {mode === 'embedcode' && (
        <div className="space-y-6">
          <div className="max-w-2xl">
            <h1 className="sf-large-title text-black dark:text-white">
              Embed Code Studio
            </h1>
            <p className="sf-body text-black/60 dark:text-white/60 mt-1">
              Drop your non-custodial Stellar checkout widget or paylink button onto any website.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (7 cols): "Your Embed Code" Card + "Active Paylink Domains" Card */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card 1: Your Embed Code */}
              <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] border border-black/8 dark:border-white/10 p-5 sm:p-6 apple-card-elevated space-y-5">
                <div>
                  <h2 className="sf-title-2 text-black dark:text-white">
                    Your Embed Code
                  </h2>
                  <p className="sf-caption text-black/55 dark:text-white/55 mt-0.5">
                    Pick a surface format, copy the snippet, and paste it into your site.
                  </p>
                </div>

                {/* 3 Format Cards: Widget | Button | Paylink */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(
                    [
                      { id: 'Widget', desc: 'Inline interactive checkout card' },
                      { id: 'Button', desc: 'Opens the widget in a modal sheet' },
                      { id: 'Paylink', desc: 'Direct URL for bios & socials' },
                    ] as const
                  ).map((item) => {
                    const isSelected = embedFormat === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setEmbedFormat(item.id)}
                        className={`apple-pressable p-3.5 rounded-[12px] border text-left transition-all flex flex-col justify-between min-h-[76px] ${
                          isSelected
                            ? 'border-[#007AFF] dark:border-[#0A84FF] bg-[#007AFF]/5 dark:bg-[#0A84FF]/10'
                            : 'border-black/10 dark:border-white/10 bg-[#F2F2F7]/50 dark:bg-[#2C2C2E]/50'
                        }`}
                      >
                        <div className="w-full flex items-center justify-between">
                          <span className="sf-subheadline font-semibold text-black dark:text-white">
                            {item.id}
                          </span>
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              isSelected
                                ? 'bg-[#007AFF] dark:bg-[#0A84FF] text-white'
                                : 'border border-black/20 dark:border-white/25'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                        </div>
                        <span className="sf-caption text-black/55 dark:text-white/55 mt-1">
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Dark Code Container */}
                <div className="rounded-[16px] bg-[#1C1C1E] dark:bg-black p-4 space-y-4 text-white border border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex p-1 rounded-[8px] bg-white/10">
                      {(['javascript', 'iframe'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setEmbedMethod(m)}
                          className={`px-3 py-1 rounded-[6px] sf-caption font-semibold transition-colors ${
                            embedMethod === m
                              ? 'bg-white text-black'
                              : 'text-white/65 hover:text-white'
                          }`}
                        >
                          {m === 'javascript' ? 'JavaScript' : 'iframe'}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(getEmbedSnippet());
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 1800);
                      }}
                      className="apple-pressable px-3.5 py-1.5 rounded-[10px] bg-[#007AFF] hover:bg-[#0071EB] text-white sf-caption font-semibold flex items-center gap-1.5"
                    >
                      {copiedCode ? (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>

                  <pre className="px-2 py-1 sf-mono-tabular text-xs sm:text-sm text-[#30D158] overflow-x-auto leading-relaxed">
                    {getEmbedSnippet()}
                  </pre>

                  <p className="px-2 sf-caption text-white/60">
                    {guideInstructions[selectedGuide]}
                  </p>
                </div>

                {/* Step-by-step platform guides */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 sf-footnote">
                    <span className="font-semibold text-black/60 dark:text-white/60">
                      Platform guides:
                    </span>
                    {(['WordPress', 'Webflow', 'Framer', 'Ghost', 'Notion', 'HTML'] as const).map(
                      (platform) => (
                        <button
                          key={platform}
                          type="button"
                          onClick={() => setSelectedGuide(platform)}
                          className={`font-medium underline transition-colors ${
                            selectedGuide === platform
                              ? 'text-[#007AFF] dark:text-[#0A84FF] font-semibold'
                              : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                          }`}
                        >
                          {platform}
                        </button>
                      )
                    )}
                  </div>

                  <div className="flex items-center gap-2 sf-footnote text-[#34C759] dark:text-[#30D158]">
                    <Check className="w-4 h-4 stroke-[2.5] shrink-0" />
                    <span>
                      Automatically inherits your primary Paylink presets and non-custodial Stellar destination.
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Active Paylink & Widget Domains */}
              <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] border border-black/8 dark:border-white/10 p-5 sm:p-6 apple-card-elevated space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="sf-title-2 text-black dark:text-white">
                      Active Widget &amp; Paylink Domains
                    </h2>
                    <p className="sf-caption text-black/55 dark:text-white/55">
                      Host websites and paylinks generating Stellar settlements in the last 30 days.
                    </p>
                  </div>
                  <div className="sf-footnote text-black/60 dark:text-white/60 sf-mono-tabular">
                    <span className="font-semibold text-black dark:text-white">
                      {tipSources.length}
                    </span>{' '}
                    verified hosts
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black/8 dark:border-white/10 sf-caption font-semibold text-black/55 dark:text-white/55">
                        <th className="pb-2.5">Domain</th>
                        <th className="pb-2.5">Format</th>
                        <th className="pb-2.5 text-right">Settlements</th>
                        <th className="pb-2.5 text-right">Latest Activity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/6 dark:divide-white/8 sf-footnote">
                      {tipSources.map((site) => (
                        <tr key={site.id} className="h-14">
                          <td className="py-2.5 pr-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-[8px] text-white font-bold sf-footnote flex items-center justify-center shrink-0"
                                style={{ backgroundColor: site.badgeBg }}
                              >
                                {site.badgeLetter}
                              </div>
                              <span className="sf-mono-tabular font-medium text-black dark:text-white">
                                {site.domain}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] sf-caption font-medium text-black/75 dark:text-white/75">
                              {site.format}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right sf-mono-tabular font-semibold text-black dark:text-white">
                            {site.tipsCount}
                          </td>
                          <td className="py-2.5 pl-3 text-right text-black/55 dark:text-white/55 sf-mono-tabular">
                            {site.lastTipAgo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Properly Padded & Contained Live Safari Preview */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 bg-white dark:bg-[#1C1C1E] rounded-[20px] border border-black/8 dark:border-white/10 p-5 sm:p-6 apple-card-elevated space-y-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="sf-title-2 text-black dark:text-white">
                    Live Safari Preview
                  </h2>
                  <p className="sf-caption text-black/55 dark:text-white/55">
                    Full-width interactive preview of your embedded widget inside a host page.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#34C759]/12 text-[#248A3D] dark:text-[#30D158] sf-caption font-semibold shrink-0">
                  Interactive
                </span>
              </div>

              {/* Well-Padded Simulated macOS Safari Window */}
              <div className="rounded-[20px] border border-black/10 dark:border-white/12 bg-[#F2F2F7] dark:bg-[#0B0D13] shadow-lg overflow-hidden">
                {/* macOS Safari Titlebar */}
                <div className="px-4 py-3 bg-white/90 dark:bg-[#1C1C1E] border-b border-black/8 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#FF3B30]" />
                    <span className="w-3 h-3 rounded-full bg-[#FF9500]" />
                    <span className="w-3 h-3 rounded-full bg-[#34C759]" />
                  </div>
                  <div className="px-3.5 py-1 rounded-[8px] bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center gap-1.5 sf-mono-tabular text-xs text-black/75 dark:text-white/80">
                    <Lock className="w-3 h-3 text-[#34C759]" />
                    <span>tobi.dev/support</span>
                  </div>
                  <div className="w-10" />
                </div>

                {/* Generously Padded Host Canvas Containing the Full-Width Widget Card */}
                <div className="p-5 sm:p-7 flex flex-col items-center justify-center">
                  {/* Contained Full-Width Embedded Widget Card */}
                  <div className="w-full max-w-[380px] rounded-[22px] border border-black/8 dark:border-white/15 bg-white dark:bg-[#1C1C1E] shadow-xl overflow-hidden">
                    {/* Top Gradient Header */}
                    <div className="relative h-20 bg-gradient-to-r from-[#5856D6] via-[#007AFF] to-[#34C759] px-4 pt-3 flex justify-end items-start">
                      <span className="px-2.5 py-0.5 rounded-full bg-black/50 text-white text-[11px] font-semibold backdrop-blur-md">
                        Stellar Live
                      </span>
                    </div>

                    {/* Avatar overlapping banner + #main badge */}
                    <div className="px-5 -mt-6 relative z-10 flex items-end justify-between">
                      <div className="w-12 h-12 rounded-full bg-[#0B1026] dark:bg-[#2C2C2E] border-[3px] border-white dark:border-[#1C1C1E] flex items-center justify-center shadow-sm">
                        <span className="sf-subheadline font-bold text-white">
                          {MERCHANT_IDENTITY.initials}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#007AFF]/12 text-[#007AFF] dark:text-[#0A84FF] sf-mono-tabular text-[11px] font-semibold">
                        ?widget=main
                      </span>
                    </div>

                    {/* Well-Padded Widget Body */}
                    <div className="p-5 pt-3 space-y-4">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="sf-headline text-black dark:text-white">
                            {MERCHANT_IDENTITY.name}
                          </span>
                          <span className="sf-caption text-black/50 dark:text-white/50">
                            {MERCHANT_IDENTITY.handle}
                          </span>
                        </div>
                        <p className="sf-caption text-black/60 dark:text-white/60 leading-relaxed mt-1">
                          Support open-source development with instant non-custodial Stellar settlements.
                        </p>
                      </div>

                      {/* USDC | XLM | USDT Segmented Toggle */}
                      <div className="grid grid-cols-3 p-1 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E]">
                        {(['USDC', 'XLM', 'USDT'] as AssetType[]).map((assetItem) => (
                          <button
                            key={assetItem}
                            type="button"
                            onClick={() => setPreviewAsset(assetItem)}
                            className={`py-1.5 rounded-[7px] sf-caption font-semibold transition-all ${
                              previewAsset === assetItem
                                ? 'bg-white dark:bg-[#3A3A3C] text-black dark:text-white shadow-2xs'
                                : 'text-black/55 dark:text-white/55'
                            }`}
                          >
                            {assetItem}
                          </button>
                        ))}
                      </div>

                      {/* Selected Amount Display */}
                      <div className="text-center py-1">
                        <span className="sf-title-1 font-bold text-black dark:text-white sf-mono-tabular">
                          {customPreviewAmount ? customPreviewAmount : previewAmount}
                        </span>{' '}
                        <span className="sf-subheadline font-semibold text-[#007AFF] dark:text-[#0A84FF]">
                          {previewAsset}
                        </span>
                      </div>

                      {/* Preset Amount Buttons: 1 | 2 | 5 | 10 */}
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 5, 10].map((val) => {
                          const active = !customPreviewAmount && previewAmount === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => {
                                setCustomPreviewAmount('');
                                setPreviewAmount(val);
                              }}
                              className={`py-2 rounded-[10px] sf-footnote font-semibold sf-mono-tabular transition-all ${
                                active
                                  ? 'bg-[#007AFF] text-white shadow-2xs'
                                  : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-black dark:text-white hover:bg-black/8'
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom amount input */}
                      <div className="px-3.5 py-2 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-between">
                        <input
                          type="number"
                          value={customPreviewAmount}
                          onChange={(e) => setCustomPreviewAmount(e.target.value)}
                          placeholder="Custom amount…"
                          className="w-full sf-footnote bg-transparent text-black dark:text-white focus:outline-none sf-mono-tabular"
                        />
                        <span className="sf-caption font-semibold text-black/50 dark:text-white/50">
                          {previewAsset}
                        </span>
                      </div>

                      {/* + Add supporter note */}
                      {!showDonorInput ? (
                        <button
                          type="button"
                          onClick={() => setShowDonorInput(true)}
                          className="sf-caption font-semibold text-[#007AFF] dark:text-[#0A84FF] hover:underline block"
                        >
                          + Add supporter remark for stream overlay
                        </button>
                      ) : (
                        <input
                          type="text"
                          value={previewDonorMessage}
                          onChange={(e) => setPreviewDonorMessage(e.target.value)}
                          placeholder="Your message for the live stream…"
                          className="w-full px-3.5 py-2 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] sf-footnote text-black dark:text-white focus:outline-none"
                        />
                      )}

                      {/* Apple Pay-style CTA */}
                      <button
                        type="button"
                        onClick={() => {
                          const finalAmt =
                            parseFloat(customPreviewAmount) || previewAmount || 5;
                          onTestTipFlow(
                            finalAmt,
                            previewAsset,
                            previewDonorMessage.trim() ||
                              'Paid directly from the embedded Safari preview!'
                          );
                        }}
                        className="apple-pressable w-full py-3 px-4 rounded-[12px] bg-[#007AFF] hover:bg-[#0071EB] text-white sf-subheadline font-semibold flex items-center justify-between shadow-sm"
                      >
                        <span>
                          Pay {customPreviewAmount ? customPreviewAmount : previewAmount}{' '}
                          {previewAsset}
                        </span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>

                      <p className="text-[11px] text-center text-black/45 dark:text-white/45">
                        Non-custodial MED25519 routing · Zero base reserve
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Row inside Preview Card */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="sf-caption text-black/55 dark:text-white/55">
                  Inspect full checkout states &amp; QR manual flow:
                </span>
                <button
                  type="button"
                  onClick={onOpenFullCheckoutWidget}
                  className="apple-pressable px-3.5 py-2 rounded-[10px] bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#007AFF] dark:text-[#0A84FF] sf-caption font-semibold flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Open Full Checkout Sheet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
