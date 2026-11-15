/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Play,
  ArrowRight,
  ShieldCheck,
  Globe2,
  Lock,
  ChevronDown,
  Copy,
  ExternalLink,
  CheckCircle2,
  Tv,
  Wallet,
  DollarSign,
  Package,
  Layers,
  Code2,
  Radio,
  FileText,
  CreditCard,
  Mic,
  Bot,
  QrCode,
  Share2,
} from 'lucide-react';
import { AssetType } from '../data/wigglePayData';

interface LandingPageProps {
  onNavigate: (route: string) => void;
  onOpenCheckoutDemo: () => void;
  onTriggerAlertDemo: (amount: number, asset: AssetType) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenCheckoutDemo,
  onTriggerAlertDemo,
}) => {
  // Interactive Hero Checkout Demo State
  const [selectedCurrency, setSelectedCurrency] = useState<'USDC' | 'XLM'>('USDC');
  const [selectedProductIdx, setSelectedProductIdx] = useState<number>(1);
  const [paymentSettled, setPaymentSettled] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Hero Preset Products / Services
  const products = [
    { title: 'Standard Access', usdc: 15, xlm: 75, desc: 'Digital asset download' },
    { title: 'Pro Merch Pack', usdc: 35, xlm: 175, desc: 'Fulfillment & sticker kit' },
    { title: 'Studio Bundle', usdc: 65, xlm: 325, desc: 'Full commercial license' },
    { title: 'Wholesale Tier', usdc: 120, xlm: 600, desc: 'Bulk inventory lot' },
  ];

  const currentProduct = products[selectedProductIdx];

  const handleSimulatePayment = () => {
    setPaymentSettled(true);
    const amount = selectedCurrency === 'USDC' ? currentProduct.usdc : currentProduct.xlm;
    onTriggerAlertDemo(amount, selectedCurrency as AssetType);
    setTimeout(() => setPaymentSettled(false), 4500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const faqItems = [
    {
      q: 'What is WigglePay and how does it work?',
      a: 'WigglePay is a high-performance Stellar payment gateway and merchant commerce suite. It allows businesses, creators, and developers to accept instant USDC and XLM payments across websites (embeddable widgets), live streams (OBS alerts), point-of-sale invoicing (inventory shelves), and Telegram (AI voice-to-invoice).',
    },
    {
      q: 'How does WigglePay compare to traditional processors like Stripe or PayPal?',
      a: 'Traditional card processors charge 2.9% + $0.30 per swipe, impose 2-7 day payout delays, and can arbitrarily freeze accounts. WigglePay settles in 3 to 5 seconds directly on Stellar with 0.00001 XLM (<$0.0001) network gas, zero protocol fees during beta, deterministic finality, and 100% non-custodial payouts.',
    },
    {
      q: 'What is a Multiplexed Address (M-Address) and why do you use it?',
      a: 'Opening a separate Stellar account for each customer order requires a minimum reserve balance in XLM. WigglePay utilizes Stellar Multiplexed Accounts (MED25519 M-addresses) and 64-bit Memo IDs. This automatically attributes every inbound payment to its exact invoice without extra wallet overhead or deposit fees.',
    },
    {
      q: 'How does the Telegram Voice-to-Invoice AI work?',
      a: 'Merchants can send a natural language voice note or text message to the WigglePay Telegram Bot (e.g., "Bill Sarah $35 for 2 custom mugs"). Our local Fast-Whisper STT engine and Qwen3-4B LLM extract the customer, quantities, line items, and prices, instantly generating a payable checkout link with a dynamic QR code.',
    },
    {
      q: 'Can I manage product inventory, shelves, and itemized invoices?',
      a: 'Yes. WigglePay features a complete Inventory Manager where you can organize products into color-coded shelves, set SKUs, descriptions, and tiered pricing. You can then assemble itemized invoices directly from your stock with auto-calculated subtotals and custom line items.',
    },
    {
      q: 'How do webhooks and merchant integrations work?',
      a: 'When an invoice is paid on the Stellar ledger, our Horizon SSE streaming daemon validates the transaction atomically with Redis idempotency. WigglePay then dispatches an HMAC-SHA256 signed JSON webhook to your server with exponential backoff, ensuring your e-commerce platform fulfills orders instantly.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070A1A] text-white font-onest selection:bg-[#C6FF3D] selection:text-[#0B1026] relative overflow-x-hidden">
      {/* Background Ambient Radial Glows (Exact Figma Prototype Gradients) */}
      <div
        className="pointer-events-none absolute -top-[200px] left-1/2 -translate-x-1/2 w-[1500px] h-[1500px] z-0"
        style={{
          background:
            'radial-gradient(50% 50% at 50% 50%, rgba(140, 115, 255, 0.35) 0%, rgba(74, 47, 194, 0.2) 30%, rgba(7, 10, 26, 0) 65%)',
        }}
      />
      <div
        className="pointer-events-none absolute top-[450px] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] z-0"
        style={{
          background:
            'radial-gradient(50% 50% at 50% 50%, rgba(198, 255, 61, 0.16) 0%, rgba(198, 255, 61, 0) 60%)',
        }}
      />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#070A1A]/80 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">
          {/* WigglePay Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full bg-[#C6FF3D] flex items-center justify-center text-[#0B1026] shadow-sm group-hover:scale-105 transition-transform">
                {/* WigglePay Sparkle / Lightning Icon */}
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#0B1026]">
                  <path d="M12 1.5L14.8 9.2L22.5 12L14.8 14.8L12 22.5L9.2 14.8L1.5 12L9.2 9.2L12 1.5Z" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-onest font-bold text-xl tracking-tight text-white group-hover:text-[#C6FF3D] transition-colors">
                  WigglePay
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-[10px] font-redhat text-[#C6FF3D]">
                  Stellar Gateway
                </span>
              </div>
            </button>
          </div>

          {/* Monospace Prototype Center Links */}
          <nav className="hidden lg:flex items-center gap-6 font-redhat text-[13px] tracking-wide text-white/70">
            <a
              href="#hero"
              className="hover:text-[#C6FF3D] transition-colors px-2 py-1"
            >
              [ Overview ]
            </a>
            <a
              href="#solutions"
              className="hover:text-[#C6FF3D] transition-colors px-2 py-1"
            >
              [ Solutions ]
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#C6FF3D] transition-colors px-2 py-1"
            >
              [ How it works ]
            </a>
            <a
              href="#fees"
              className="hover:text-[#C6FF3D] transition-colors px-2 py-1"
            >
              [ Fees ]
            </a>
            <a
              href="#dashboard"
              className="hover:text-[#C6FF3D] transition-colors px-2 py-1"
            >
              [ Portal ]
            </a>
            <a
              href="#faq"
              className="hover:text-[#C6FF3D] transition-colors px-2 py-1"
            >
              [ FAQ ]
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="px-5 py-2 rounded-full text-[14px] font-medium text-white bg-white/[0.04] border border-white/[0.16] hover:bg-white/[0.1] hover:border-white/[0.3] transition-all cursor-pointer"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/signup')}
              className="px-5 py-2 rounded-full text-[14px] font-semibold text-[#0B1026] bg-[#C6FF3D] hover:bg-[#b5f02c] shadow-[0_0_20px_rgba(198,255,61,0.25)] transition-all cursor-pointer"
            >
              Start for free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative z-10 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 flex flex-col items-center text-center">
          {/* Badge: Live on Stellar testnet */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.16] mb-8">
            <div className="w-2.5 h-2.5 rounded-full bg-[#C6FF3D] animate-pulse" />
            <span className="text-[13px] text-white/70 font-normal">Live on</span>
            <span className="text-[13px] text-white font-semibold">Stellar testnet</span>
            <span className="text-white/40">·</span>
            <span className="text-[12px] font-redhat text-[#C6FF3D]">Sub-Cent Gas</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-[68px] font-medium tracking-[-2px] sm:tracking-[-2.5px] leading-[1.08] max-w-[860px] mb-6">
            Next-gen checkout & invoicing,{' '}
            <span className="text-[#C6FF3D]">settled in seconds.</span>
          </h1>

          {/* Subtitle Tailored to WigglePay */}
          <p className="text-base sm:text-lg md:text-[18px] leading-[28px] text-white/[0.62] max-w-[640px] mb-9">
            Accept USDC and XLM payments anywhere. From embeddable web checkout and
            itemized inventory invoices to AI voice billing on Telegram and OBS stream
            overlays — non-custodial and direct to your wallet.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 mb-16">
            <button
              type="button"
              onClick={() => onNavigate('/overview')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full text-[15px] font-semibold text-[#0B1026] bg-[#C6FF3D] hover:bg-[#b5f02c] shadow-[0_0_25px_rgba(198,255,61,0.35)] flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <span>Launch Merchant Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenCheckoutDemo}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full text-[15px] font-semibold text-[#0B1026] bg-white hover:bg-white/90 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <div className="w-4 h-4 rounded-full bg-[#0B1026] flex items-center justify-center text-white">
                <Play className="w-2 h-2 fill-white ml-0.5" />
              </div>
              <span>Try Live Checkout Widget</span>
            </button>
          </div>

          {/* Hero Interactive Product Frame (Glassmorphism Frame with 4 Corner Brackets) */}
          <div className="relative w-full max-w-[620px] mx-auto">
            {/* The 4 Corner Brackets / Handles from the Prototype */}
            <span className="absolute -top-1.5 -left-1.5 w-2.5 h-2.5 bg-white rounded-[2px] z-20 pointer-events-none shadow-sm" />
            <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-white rounded-[2px] z-20 pointer-events-none shadow-sm" />
            <span className="absolute -bottom-1.5 -left-1.5 w-2.5 h-2.5 bg-white rounded-[2px] z-20 pointer-events-none shadow-sm" />
            <span className="absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 bg-white rounded-[2px] z-20 pointer-events-none shadow-sm" />

            {/* Glass Container */}
            <div className="relative rounded-[28px] p-6 sm:p-7 bg-white/[0.04] backdrop-blur-[10px] border border-white/[0.12] shadow-2xl text-left">
              {/* Merchant / Store Identity Card */}
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/[0.08]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#3D44FF] to-[#8C73FF] flex items-center justify-center text-white font-bold text-base shadow-inner">
                    WP
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold text-lg leading-tight">
                        Apex Studio Store
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 text-[#C6FF3D] text-[10px] font-redhat font-medium">
                        Verified Merchant
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-redhat text-[12px] text-[#A0A6C2] mt-0.5">
                      <span>wigglepay.io/pay/inv_9f3ce2</span>
                      <button
                        type="button"
                        onClick={() => handleCopy('https://wigglepay.io/pay/inv_9f3ce2')}
                        className="text-white/40 hover:text-white transition-colors"
                        title="Copy invoice URL"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-redhat text-white/50 block">
                    INVOICE #1048
                  </span>
                  <span className="text-xs text-[#34C759] font-medium">
                    Active · 24h Expiry
                  </span>
                </div>
              </div>

              {/* Invoice Description / Selected Item */}
              <div className="py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="text-white font-medium block">
                    {currentProduct.title}
                  </span>
                  <span className="text-xs text-white/50">
                    {currentProduct.desc} · Instant M-Address settlement
                  </span>
                </div>
                <span className="font-redhat font-bold text-base text-[#C6FF3D]">
                  {selectedCurrency === 'USDC'
                    ? `$${currentProduct.usdc}.00`
                    : `${currentProduct.xlm} XLM`}
                </span>
              </div>

              {/* Product Tier Selector */}
              <div className="mt-1 mb-3 flex items-center justify-between">
                <span className="text-[11px] font-redhat uppercase tracking-wider text-white/50 font-semibold">
                  SELECT INVENTORY ITEM
                </span>
                <div className="inline-flex rounded-lg bg-black/40 p-0.5 border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setSelectedCurrency('USDC')}
                    className={`px-2.5 py-0.5 rounded-md text-[12px] font-semibold transition-all ${
                      selectedCurrency === 'USDC'
                        ? 'bg-[#C6FF3D] text-[#0B1026]'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    USDC
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCurrency('XLM')}
                    className={`px-2.5 py-0.5 rounded-md text-[12px] font-semibold transition-all ${
                      selectedCurrency === 'XLM'
                        ? 'bg-[#C6FF3D] text-[#0B1026]'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    XLM
                  </button>
                </div>
              </div>

              {/* Inventory Preset Buttons */}
              <div className="grid grid-cols-4 gap-2 mb-5">
                {products.map((p, idx) => {
                  const isSelected = selectedProductIdx === idx;
                  return (
                    <button
                      key={p.title}
                      type="button"
                      onClick={() => setSelectedProductIdx(idx)}
                      className={`p-2 rounded-xl text-left font-redhat transition-all border ${
                        isSelected
                          ? 'bg-[#C6FF3D] text-[#0B1026] border-[#C6FF3D] shadow-sm scale-[1.02]'
                          : 'bg-white/[0.04] text-white border-white/[0.08] hover:border-white/[0.2] hover:bg-white/[0.08]'
                      }`}
                    >
                      <div className="text-[10px] truncate opacity-70">
                        Tier 0{idx + 1}
                      </div>
                      <div className="font-bold text-sm">
                        {selectedCurrency === 'USDC' ? `$${p.usdc}` : `${p.xlm} XLM`}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Settlement Action Button */}
              <button
                type="button"
                onClick={handleSimulatePayment}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#C6FF3D] hover:bg-[#b5f02c] text-[#0B1026] font-semibold text-base flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(198,255,61,0.25)] transition-all cursor-pointer"
              >
                {paymentSettled ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-[#0B1026]" />
                    <span>Settled on Stellar! Webhook Dispatched!</span>
                  </>
                ) : (
                  <span>
                    Pay {selectedCurrency === 'USDC' ? `$${currentProduct.usdc} USDC` : `${currentProduct.xlm} XLM`} via Stellar
                  </span>
                )}
              </button>

              <div className="text-center mt-2.5">
                <span className="text-[12px] text-white/40">
                  Multiplexed M-Address routing · 0.00001 XLM gas · No card fees
                </span>
              </div>
            </div>

            {/* Floating Settled Pill Badge */}
            <div className="mt-4 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#0B1026]/90 border border-white/[0.16] shadow-xl backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-[#C6FF3D] animate-ping" />
              <span className="text-[13px] font-medium text-white">Settled in 3.8s</span>
              <span className="text-[12px] font-redhat text-[#C6FF3D]">
                fee 0.00001 XLM
              </span>
              <span className="text-[12px] font-redhat text-white/60">
                · memo 84920491823
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stellar Wallet Strip */}
      <section className="relative z-10 border-y border-white/[0.08] bg-white/[0.01]">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-sm text-white/50 font-normal text-center md:text-left">
            Accept payments from any Stellar wallet:
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 text-white/80 font-medium text-sm">
            {/* Freighter */}
            <div className="flex items-center gap-2 hover:text-white transition-colors">
              <div className="w-7 h-7 rounded-lg bg-[#635BFF] flex items-center justify-center text-white text-xs font-bold">
                F
              </div>
              <span>Freighter</span>
            </div>

            {/* LOBSTR */}
            <div className="flex items-center gap-2 hover:text-white transition-colors">
              <div className="w-7 h-7 rounded-lg bg-[#0088FF] flex items-center justify-center text-white text-xs font-bold">
                L
              </div>
              <span>LOBSTR</span>
            </div>

            {/* xBull */}
            <div className="flex items-center gap-2 hover:text-white transition-colors">
              <div className="w-7 h-7 rounded-lg bg-[#FF453A] flex items-center justify-center text-white text-xs font-bold">
                X
              </div>
              <span>xBull</span>
            </div>

            {/* Albedo */}
            <div className="flex items-center gap-2 hover:text-white transition-colors">
              <div className="w-7 h-7 rounded-lg bg-[#FF9500] flex items-center justify-center text-white text-xs font-bold">
                A
              </div>
              <span>Albedo</span>
            </div>

            {/* WalletConnect */}
            <div className="flex items-center gap-2 hover:text-white transition-colors">
              <div className="w-7 h-7 rounded-lg bg-[#3396FF] flex items-center justify-center text-white text-xs font-bold">
                W
              </div>
              <span>WalletConnect</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.1]">
            <span className="text-xs text-white/50">Powered by</span>
            <span className="text-xs font-semibold text-white tracking-wide">
              Stellar Horizon SSE
            </span>
          </div>
        </div>
      </section>

      {/* Section: Solutions / The New Standard for Stellar Commerce (Light #F6F7FB Surface) */}
      <section id="solutions" className="relative z-10 py-20 px-6 sm:px-10">
        <div className="max-w-[1440px] mx-auto bg-[#F6F7FB] text-[#0B1026] rounded-[36px] p-8 sm:p-14 lg:p-16 shadow-2xl relative overflow-hidden">
          <div className="max-w-[840px] mb-14">
            <h2 className="text-3xl sm:text-5xl font-medium tracking-[-1.5px] leading-tight mb-4">
              The new standard for <span className="text-[#3D44FF]">Stellar commerce.</span>
            </h2>
            <p className="text-base sm:text-lg text-[#555C7E] leading-relaxed">
              A unified merchant platform: itemized inventory invoicing, embeddable
              checkout widgets, and live stream overlays — running on one
              high-performance backend.
            </p>
          </div>

          {/* 3 Core WigglePay Pillar Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Card 1: AI Voice-to-Invoice on Telegram */}
            <div className="bg-white rounded-[24px] p-7 shadow-sm border border-[#E4E6EF] flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#EBF0FF] text-[#3D44FF] flex items-center justify-center mb-5">
                  <Mic className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  AI Voice-to-Invoice on Telegram
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed mb-6">
                  Speak a voice message like “Bill Sarah 35 USDC for custom mechanical
                  keycaps”. Fast-Whisper + Qwen3 4B parse the request and return an
                  instant payable link.
                </p>
              </div>

              {/* Visual: Telegram Voice Message Mockup */}
              <div className="rounded-2xl p-4 bg-[#0B1026] text-white border border-[#1F2646] shadow-md">
                <div className="flex items-center gap-3 pb-3 border-b border-white/[0.1]">
                  <div className="w-8 h-8 rounded-full bg-[#0088CC] flex items-center justify-center text-white">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">WigglePay Bot</div>
                    <div className="text-[10px] text-white/50">Voice AI Pipeline</div>
                  </div>
                </div>
                <div className="mt-3 p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-[#C6FF3D]" />
                    <span className="text-xs font-redhat text-white/90">
                      voice_note_048.ogg (3.2s)
                    </span>
                  </div>
                  <span className="text-[10px] text-[#C6FF3D] font-mono">Parsed &rarr;</span>
                </div>
                <p className="text-xs text-white/80 mt-2 italic">
                  “Invoice #1048 generated for $35.00 USDC. QR ready.”
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('/telegram')}
                  className="mt-3.5 w-full py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-[12px] font-medium text-white transition-colors"
                >
                  Test Telegram Voice Bot
                </button>
              </div>
            </div>

            {/* Card 2: Inventory Shelves & POS Invoicing */}
            <div className="bg-white rounded-[24px] p-7 shadow-sm border border-[#E4E6EF] flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center mb-5">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Inventory Shelves & POS Invoicing
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed mb-6">
                  Organize products into color-coded shelves, set SKUs, descriptions, and
                  prices. Generate itemized invoices with dynamic QR codes in two clicks.
                </p>
              </div>

              {/* Visual: Inventory Catalog Mockup */}
              <div className="rounded-2xl p-4 bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#007AFF]" />
                    <span className="text-xs font-semibold text-[#0B1026]">
                      Mechanical Keyboard
                    </span>
                  </div>
                  <span className="font-redhat font-bold text-xs text-[#0B1026]">
                    $120.00 USDC
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#34C759]" />
                    <span className="text-xs font-semibold text-[#0B1026]">
                      Coiled USB-C Cable
                    </span>
                  </div>
                  <span className="font-redhat font-bold text-xs text-[#0B1026]">
                    $35.00 USDC
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('/inventory')}
                  className="w-full mt-2 py-2 rounded-xl bg-[#0B1026] hover:bg-[#1E2548] text-[12px] font-semibold text-white transition-colors"
                >
                  Manage Inventory & Shelves &rarr;
                </button>
              </div>
            </div>

            {/* Card 3: Fees you won't notice (Comparison) */}
            <div id="fees" className="bg-white rounded-[24px] p-7 shadow-sm border border-[#E4E6EF] flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center mb-5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Sub-Cent Gas vs. Card Fees</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed mb-6">
                  Traditional card processors take 2.9% + $0.30 on every order. WigglePay
                  settles on Stellar with fixed 0.00001 XLM gas. You keep 100%.
                </p>
              </div>

              {/* Fee Comparison Table from Prototype */}
              <div className="rounded-2xl p-4 bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 font-redhat text-xs">
                <div className="flex justify-between text-[#475569]">
                  <span>Customer pays</span>
                  <span className="font-semibold text-[#0B1026]">50.00 USDC</span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>Stellar network gas</span>
                  <span className="text-[#16A34A] font-semibold">&lt;$0.0001 (0.00001 XLM)</span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>WigglePay platform fee</span>
                  <span className="text-[#3D44FF] font-semibold">0.00 (Free on testnet)</span>
                </div>
                <div className="flex justify-between text-[#DC2626]">
                  <span>Credit Card / Stripe Fee</span>
                  <span className="font-medium line-through">-$1.75 (3.5%)</span>
                </div>
                <div className="pt-2 border-t border-[#E2E8F0] flex justify-between font-bold text-sm text-[#0B1026]">
                  <span>You receive</span>
                  <span className="text-[#16A34A]">50.00 USDC (100%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Live in three steps. Under five minutes. */}
      <section id="how-it-works" className="relative z-10 py-20 px-6 sm:px-10">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center max-w-[700px] mx-auto mb-16">
            <h2 className="text-3xl sm:text-5xl font-medium tracking-[-1.5px] leading-tight mb-4 text-white">
              Start accepting payments.{' '}
              <span className="text-[#C6FF3D]">Under five minutes.</span>
            </h2>
            <p className="text-base sm:text-lg text-white/60 leading-relaxed">
              No merchant underwriting delays, no multi-day account verification. Your
              Stellar public key is your bank.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-8 rounded-[28px] bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.2] transition-colors relative">
              <span className="font-redhat text-[13px] text-[#C6FF3D] font-bold block mb-4">
                [ 01 ]
              </span>
              <h3 className="text-2xl font-medium text-white mb-3">
                Connect your Stellar wallet
              </h3>
              <p className="text-sm text-white/60 leading-relaxed mb-6">
                Pick Freighter, LOBSTR, or enter any Stellar public G-address. M-addresses
                auto-generate for unique order isolation.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-xs font-redhat text-white/70">
                  freighter
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-xs font-redhat text-white/70">
                  lobstr
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-xs font-redhat text-white/70">
                  xbull
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-[28px] bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.2] transition-colors relative">
              <span className="font-redhat text-[13px] text-[#C6FF3D] font-bold block mb-4">
                [ 02 ]
              </span>
              <h3 className="text-2xl font-medium text-white mb-3">
                Add products or invoice
              </h3>
              <p className="text-sm text-white/60 leading-relaxed mb-6">
                Organize your inventory catalog or speak a voice note on Telegram to
                draft an itemized invoice instantly.
              </p>
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/50 border border-white/[0.1] font-redhat text-xs text-white/80">
                <span className="text-white/40">wigglepay.io/pay/</span>
                <span className="text-[#C6FF3D] font-semibold">invoice-1048</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-[28px] bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.2] transition-colors relative">
              <span className="font-redhat text-[13px] text-[#C6FF3D] font-bold block mb-4">
                [ 03 ]
              </span>
              <h3 className="text-2xl font-medium text-white mb-3">
                Share, embed & settle
              </h3>
              <p className="text-sm text-white/60 leading-relaxed mb-6">
                Share payment links, embed the 1-click modal on your website, or route
                stream alerts to OBS in real time.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('/create-invoice')}
                  className="px-3.5 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-xs font-medium text-white transition-colors"
                >
                  Create Invoice
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/livealerts')}
                  className="px-3.5 py-1.5 rounded-lg bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 hover:bg-[#C6FF3D]/20 text-xs font-medium text-[#C6FF3D] transition-colors"
                >
                  Stream Alerts
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: WigglePay Merchant Portal Showcase */}
      <section id="dashboard" className="relative z-10 py-20 px-6 sm:px-10 bg-[#0B0F24]/60 border-y border-white/[0.08]">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center max-w-[780px] mx-auto mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-[#C6FF3D]/10 border border-[#C6FF3D]/20 text-[#C6FF3D] text-[12px] font-redhat font-semibold mb-3">
              [ Merchant portal ]
            </span>
            <h2 className="text-3xl sm:text-5xl font-medium tracking-[-1.5px] leading-tight text-white mb-4">
              Every transaction, one unified portal.{' '}
              <span className="text-[#C6FF3D]">Zero reconciliation lag.</span>
            </h2>
            <p className="text-base sm:text-lg text-white/60 leading-relaxed">
              Real-time Server-Sent Events (SSE) feed from Stellar Horizon. Invoices,
              inventory shelves, webhook dispatches, and OBS alerts all in sync.
            </p>
          </div>

          {/* Full Dashboard Mockup Window Frame */}
          <div className="rounded-[28px] bg-[#070A1A] border border-white/[0.14] shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Window Topbar */}
            <div className="px-5 py-3.5 bg-[#0B1026] border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <span className="w-3 h-3 rounded-full bg-[#27C93F]" />
                <span className="ml-3 font-redhat text-[12px] text-white/40">
                  portal.wigglepay.io/overview
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-full bg-[#34C759]/15 text-[#34C759] text-[11px] font-redhat">
                  Horizon SSE Live
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('/overview')}
                  className="px-3 py-1 rounded-lg bg-[#C6FF3D] text-[#0B1026] font-semibold text-xs hover:bg-[#b5f02c] transition-colors"
                >
                  Open Live Dashboard &rarr;
                </button>
              </div>
            </div>

            {/* Dashboard Inner Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
              {/* Sidebar */}
              <div className="lg:col-span-3 bg-[#090D21] border-r border-white/[0.08] p-5 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-white font-bold text-base">
                    <div className="w-7 h-7 rounded-full bg-[#C6FF3D] flex items-center justify-center text-[#0B1026] text-xs">
                      ★
                    </div>
                    <span>WigglePay Portal</span>
                  </div>

                  <nav className="space-y-1">
                    {[
                      { name: 'Merchant Overview', route: '/overview', active: true },
                      { name: 'Inventory & Shelves', route: '/inventory' },
                      { name: 'Invoice Creation Studio', route: '/create-invoice' },
                      { name: 'Payment Links & Tips', route: '/tiplinks' },
                      { name: 'Live Stream HUD', route: '/livealerts', badge: '3' },
                      { name: 'Embed Code Studio', route: '/embedcode' },
                      { name: 'Invoices & History', route: '/invoices' },
                      { name: 'Stellar Settings', route: '/settings' },
                    ].map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => onNavigate(item.route)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors ${
                          item.active
                            ? 'bg-[#C6FF3D]/10 text-[#C6FF3D] font-semibold'
                            : 'text-white/70 hover:bg-white/[0.04] hover:text-white'
                        }`}
                      >
                        <span>{item.name}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#FF3B30] text-white text-[10px] font-bold">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Account card */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3D44FF] to-[#8C73FF] flex items-center justify-center text-white font-bold text-xs">
                    WP
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-semibold text-white truncate">
                      Apex Studio
                    </div>
                    <div className="text-[10px] font-redhat text-white/50 truncate">
                      GBXK…7Q2M · Connected
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Dashboard Panel */}
              <div className="lg:col-span-9 p-6 sm:p-8 space-y-6 bg-[#070A1A]">
                {/* Greeting & Top bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Good evening, Apex Merchant
                    </h3>
                    <p className="text-xs text-white/50">
                      Friday, 16 October · Real-time Stellar Horizon Stream
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onNavigate('/create-invoice')}
                      className="px-3.5 py-1.5 rounded-lg bg-[#C6FF3D] text-[#0B1026] text-xs font-semibold hover:bg-[#b5f02c] transition-colors"
                    >
                      + Create Invoice
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy('https://wigglepay.io/pay/inv_9f3ce2')}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-white text-xs font-medium hover:bg-white/[0.1] transition-colors flex items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{copiedLink ? 'Copied!' : 'Share store link'}</span>
                    </button>
                  </div>
                </div>

                {/* Stat Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-[11px] font-redhat uppercase text-white/50 block">
                      TOTAL VOLUME
                    </span>
                    <span className="text-xl font-bold text-white mt-1 block">
                      $48,250.00
                    </span>
                    <span className="text-[11px] text-[#34C759] font-medium">
                      +24.8% this month
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-[11px] font-redhat uppercase text-white/50 block">
                      NATIVE XLM
                    </span>
                    <span className="text-xl font-bold text-[#C6FF3D] mt-1 block">
                      14,280 XLM
                    </span>
                    <span className="text-[11px] text-white/40">~ $1,713.60 USD</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-[11px] font-redhat uppercase text-white/50 block">
                      SCP SETTLEMENT
                    </span>
                    <span className="text-xl font-bold text-white mt-1 block">
                      3.8s
                    </span>
                    <span className="text-[11px] text-white/40">Horizon Finality</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-[11px] font-redhat uppercase text-white/50 block">
                      SAVED FEES
                    </span>
                    <span className="text-xl font-bold text-[#34C759] mt-1 block">
                      $1,420.00
                    </span>
                    <span className="text-[11px] text-[#34C759]">vs Card Processors</span>
                  </div>
                </div>

                {/* Recent Invoices Ledger Table */}
                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/[0.08] flex items-center justify-between">
                    <span className="font-semibold text-xs text-white">
                      Recent Invoices & Transactions
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate('/invoices')}
                      className="text-xs text-[#C6FF3D] hover:underline"
                    >
                      View full ledger &rarr;
                    </button>
                  </div>

                  <div className="divide-y divide-white/[0.06] text-xs">
                    {[
                      {
                        name: 'Marcus Vance',
                        initial: 'M',
                        message: 'Inv #1048 · Studio Keycaps · M-Address Route',
                        amount: '$65.00 USDC',
                        status: 'SETTLED',
                        time: '1 min ago',
                      },
                      {
                        name: 'Sarah Jenkins',
                        initial: 'S',
                        message: 'Inv #1047 · Telegram Voice Order · Qwen3 Extracted',
                        amount: '$35.00 USDC',
                        status: 'SETTLED',
                        time: '8 min ago',
                      },
                      {
                        name: 'Alex Chen',
                        initial: 'A',
                        message: 'Inv #1046 · Custom Mechanical Board · Webhook Fulfill',
                        amount: '$120.00 USDC',
                        status: 'SETTLED',
                        time: '25 min ago',
                      },
                      {
                        name: 'Kemi Adebayo',
                        initial: 'K',
                        message: 'Inv #1045 · Live Stream Donation · OBS Overlay Pop',
                        amount: '50 XLM',
                        status: 'SETTLED',
                        time: '1 h ago',
                      },
                      {
                        name: 'Daniel Cruz',
                        initial: 'D',
                        message: 'Inv #1044 · Inventory Shelf Item · Direct QR Checkout',
                        amount: '$15.00 USDC',
                        status: 'SETTLED',
                        time: 'Yesterday',
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-white/[0.08] text-white flex items-center justify-center font-bold text-xs">
                            {row.initial}
                          </div>
                          <div>
                            <span className="font-semibold text-white">{row.name}</span>
                            <span className="text-white/40 block text-[11px] truncate max-w-[320px]">
                              {row.message}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-redhat font-bold text-white block">
                            {row.amount}
                          </span>
                          <span className="text-[10px] text-[#34C759]">
                            {row.status} · {row.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Feature Highlights beneath dashboard from prototype */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="w-8 h-8 rounded-xl bg-[#C6FF3D]/10 text-[#C6FF3D] flex items-center justify-center mb-3">
                <DollarSign className="w-4 h-4" />
              </div>
              <h4 className="text-base font-semibold text-white mb-1">
                Multi-Currency (USDC & XLM)
              </h4>
              <p className="text-xs text-white/50 leading-relaxed">
                Accept Circle USDC digital dollars or native XLM with automatic SDEX Path
                Payments.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="w-8 h-8 rounded-xl bg-[#C6FF3D]/10 text-[#C6FF3D] flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-base font-semibold text-white mb-1">
                Deterministic Idempotency
              </h4>
              <p className="text-xs text-white/50 leading-relaxed">
                Atomic Redis locking on transaction hashes eliminates double-crediting
                completely.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="w-8 h-8 rounded-xl bg-[#C6FF3D]/10 text-[#C6FF3D] flex items-center justify-center mb-3">
                <Code2 className="w-4 h-4" />
              </div>
              <h4 className="text-base font-semibold text-white mb-1">
                Signed HMAC-SHA256 Webhooks
              </h4>
              <p className="text-xs text-white/50 leading-relaxed">
                Automated webhook dispatches with exponential backoff to fulfill orders
                instantly.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="w-8 h-8 rounded-xl bg-[#C6FF3D]/10 text-[#C6FF3D] flex items-center justify-center mb-3">
                <Wallet className="w-4 h-4" />
              </div>
              <h4 className="text-base font-semibold text-white mb-1">
                100% Non-Custodial
              </h4>
              <p className="text-xs text-white/50 leading-relaxed">
                Customer funds transfer peer-to-peer into your own private keys without
                escrow holding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Built on Stellar. Fast by default. */}
      <section className="relative z-10 py-20 px-6 sm:px-10">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center max-w-[700px] mx-auto mb-16">
            <h2 className="text-3xl sm:text-5xl font-medium tracking-[-1.5px] leading-tight text-white mb-4">
              Built on Stellar.{' '}
              <span className="text-[#C6FF3D]">Engineered for scale.</span>
            </h2>
            <p className="text-base sm:text-lg text-white/60 leading-relaxed">
              Stellar is the world's premier payments network for low-cost, high-velocity
              commerce. USDC settles with sub-cent gas and deterministic finality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-[28px] bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.2] transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.06] text-[#C6FF3D] flex items-center justify-center mb-6">
                <Globe2 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-medium text-white mb-3">
                Multiplexed Account Routing
              </h3>
              <p className="text-sm text-white/60 leading-relaxed">
                WigglePay encodes 64-bit invoice IDs into M-addresses (`MED25519`). This
                eliminates base reserve account creation fees while providing deterministic
                order tracking.
              </p>
            </div>

            <div className="p-8 rounded-[28px] bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.2] transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.06] text-[#C6FF3D] flex items-center justify-center mb-6">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-medium text-white mb-3">
                SDEX Path Payments
              </h3>
              <p className="text-sm text-white/60 leading-relaxed">
                Customers can pay in native XLM or other assets, while you automatically
                receive Circle USDC settled on-chain via the Stellar Decentralized Exchange.
              </p>
            </div>

            <div className="p-8 rounded-[28px] bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.2] transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.06] text-[#C6FF3D] flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-medium text-white mb-3">
                Sub-Cent Micro-Transactions
              </h3>
              <p className="text-sm text-white/60 leading-relaxed">
                0.00001 XLM network gas enables micro-billing, metered API payments, and
                creator tipping that card rails render economically impossible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Questions, answered. (FAQ) */}
      <section id="faq" className="relative z-10 py-20 px-6 sm:px-10 border-t border-white/[0.08]">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* FAQ Left Column */}
          <div className="lg:col-span-4">
            <h2 className="text-4xl sm:text-5xl font-medium tracking-[-1.5px] leading-tight text-white">
              Questions,
            </h2>
            <h2 className="text-4xl sm:text-5xl font-medium tracking-[-1.5px] leading-tight text-[#7A809E]">
              answered.
            </h2>
            <p className="text-sm text-white/50 mt-4 leading-relaxed">
              Ready to integrate WigglePay into your online store, stream, or Telegram
              community?
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onNavigate('/specs')}
                className="text-xs text-[#C6FF3D] hover:underline flex items-center gap-1.5"
              >
                <span>Read HIG Design Specification &rarr;</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/telegram')}
                className="text-xs text-white/60 hover:text-white flex items-center gap-1.5"
              >
                <span>Try Telegram Voice AI Mini-App &rarr;</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/inventory')}
                className="text-xs text-white/60 hover:text-white flex items-center gap-1.5"
              >
                <span>Explore Inventory Shelves &rarr;</span>
              </button>
            </div>
          </div>

          {/* FAQ Accordion Right Column */}
          <div className="lg:col-span-8 divide-y divide-white/[0.08]">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-6 first:pt-0">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left gap-4 cursor-pointer group"
                  >
                    <span className="text-lg sm:text-xl font-medium text-white group-hover:text-[#C6FF3D] transition-colors">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-white/50 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-[#C6FF3D]' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="pt-3 text-sm text-white/60 leading-relaxed max-w-[650px]">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final Call to Action Section */}
      <section className="relative z-10 py-24 px-6 sm:px-10 bg-gradient-to-b from-[#070A1A] to-[#04060F] border-t border-white/[0.08] text-center">
        <div className="max-w-[800px] mx-auto">
          <h2 className="text-3xl sm:text-5xl font-medium tracking-[-1.5px] leading-tight text-white mb-4">
            Ready to modernize your payments?
          </h2>
          <p className="text-2xl sm:text-3xl font-medium text-[#C6FF3D] mb-6">
            Accept Stellar payments with sub-cent fees.
          </p>
          <p className="text-sm sm:text-base text-white/60 max-w-[500px] mx-auto mb-10 leading-relaxed">
            Create your merchant account in 2 minutes. Non-custodial settlement, instant
            webhooks, and zero testnet fees.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('/signup')}
              className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-semibold text-[#0B1026] bg-[#C6FF3D] hover:bg-[#b5f02c] shadow-[0_0_30px_rgba(198,255,61,0.35)] flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <span>Create Free Merchant Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenCheckoutDemo}
              className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-semibold text-[#0B1026] bg-white hover:bg-white/90 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <div className="w-4 h-4 rounded-full bg-[#0B1026] flex items-center justify-center text-white">
                <Play className="w-2 h-2 fill-white ml-0.5" />
              </div>
              <span>Test Live Checkout Widget</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 sm:px-10 border-t border-white/[0.08] bg-[#04060F] text-xs text-white/50">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#C6FF3D] flex items-center justify-center text-[#0B1026] text-xs font-bold">
              ★
            </div>
            <span className="font-semibold text-white text-sm">WigglePay</span>
            <span className="text-white/40">Stellar Gateway Suite</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => onNavigate('/overview')}
              className="hover:text-white transition-colors"
            >
              Merchant Portal
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/inventory')}
              className="hover:text-white transition-colors"
            >
              Inventory Shelves
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/create-invoice')}
              className="hover:text-white transition-colors"
            >
              Create Invoice
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/telegram')}
              className="hover:text-white transition-colors"
            >
              Telegram Voice Bot
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/specs')}
              className="hover:text-white transition-colors"
            >
              HIG System Specs
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="hover:text-white transition-colors"
            >
              Sign In
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#34C759]" />
            <span className="text-white/70">Stellar Testnet Horizon SSE 100% Uptime</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
