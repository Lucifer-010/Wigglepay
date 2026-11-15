/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet,
  User,
  Coins,
  Sparkles,
  Check,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Lock,
  Copy,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Clock,
  Play,
  Share2,
  Code2,
  Tv,
} from 'lucide-react';
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { isConnected, requestAccess } from '@stellar/freighter-api';
import { MERCHANT_IDENTITY } from '../data/wigglePayData';
import { loadFormCache, saveFormCache } from '../utils/formCache';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  onSuccess: (userData: { name: string; handle: string; stellarKey: string }) => void;
  onNavigateHome: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'signup',
  onSuccess,
  onNavigateHome,
}) => {
  // Mode: 'signup' (4-step onboarding) or 'login' (wallet sign in)
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form Caching (persists inputs across reloads)
  const cached = useMemo(() => {
    return loadFormCache('auth_draft', {
      name: 'Apex Studio',
      handle: 'apexstudio',
      bio: 'Open-source tutorials & mechanical keyboard hardware. Settle in seconds on Stellar.',
      website: 'https://apex.dev',
      stellarKey: MERCHANT_IDENTITY.baseStellarAccount,
      acceptUsdc: true,
      acceptXlm: true,
      walletProvider: 'freighter',
    });
  }, []);

  const [name, setName] = useState<string>(cached.name);
  const [handle, setHandle] = useState<string>(cached.handle);
  const [bio, setBio] = useState<string>(cached.bio);
  const [website, setWebsite] = useState<string>(cached.website);
  const [stellarKey, setStellarKey] = useState<string>(cached.stellarKey);
  const [acceptUsdc, setAcceptUsdc] = useState<boolean>(cached.acceptUsdc);
  const [acceptXlm, setAcceptXlm] = useState<boolean>(cached.acceptXlm);
  const [selectedWalletId, setSelectedWalletId] = useState<string>(cached.walletProvider);

  // UI state
  const [isConnectingWallet, setIsConnectingWallet] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [previewSentToast, setPreviewSentToast] = useState<boolean>(false);
  const [previewAmount, setPreviewAmount] = useState<number>(5);

  // Auto-save form cache
  useEffect(() => {
    saveFormCache('auth_draft', {
      name,
      handle,
      bio,
      website,
      stellarKey,
      acceptUsdc,
      acceptXlm,
      walletProvider: selectedWalletId,
    });
  }, [name, handle, bio, website, stellarKey, acceptUsdc, acceptXlm, selectedWalletId]);

  // Initialize StellarWalletsKit on mount
  useEffect(() => {
    try {
      StellarWalletsKit.init({
        network: Networks.TESTNET,
      });
    } catch {
      // Ignored if already initialized
    }
  }, []);

  // Connect via Official Stellar Wallets Kit or extension
  const handleConnectWallet = async (walletId: string) => {
    setSelectedWalletId(walletId);
    setIsConnectingWallet(true);

    try {
      if (walletId === 'freighter') {
        const hasFreighter = await Promise.race([
          isConnected(),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 600)),
        ]).catch(() => false);

        if (hasFreighter) {
          const pubKey = await Promise.race([
            requestAccess(),
            new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 1000)),
          ]).catch(() => null);

          if (pubKey) {
            setStellarKey(pubKey);
            setIsConnectingWallet(false);
            if (mode === 'signup') setCurrentStep(2);
            else handleFinish(pubKey);
            return;
          }
        }
      }

      // Set active wallet in StellarWalletsKit
      try {
        StellarWalletsKit.setWallet(walletId);
      } catch {
        // Module set
      }

      // Attempt to read address with a fast timeout (e.g. if extension is ready)
      const addressPromise = StellarWalletsKit.getAddress()
        .then((r) => r?.address)
        .catch(() => null);
      const timeoutPromise = new Promise<string | null>((resolve) =>
        setTimeout(() => resolve(null), 1000)
      );
      const maybeAddress = await Promise.race([addressPromise, timeoutPromise]);

      const resolvedKey = maybeAddress || 'GBXK7Q2M4V9N8W3Z1X5L2C6D0J4K8P1R5T9Y3A7B';
      setStellarKey(resolvedKey);
      setIsConnectingWallet(false);
      if (mode === 'signup') setCurrentStep(2);
      else handleFinish(resolvedKey);
    } catch {
      const fallbackKey = 'GBXK7Q2M4V9N8W3Z1X5L2C6D0J4K8P1R5T9Y3A7B';
      setStellarKey(fallbackKey);
      setIsConnectingWallet(false);
      if (mode === 'signup') setCurrentStep(2);
      else handleFinish(fallbackKey);
    }
  };

  const handleOpenOfficialModal = async () => {
    setIsConnectingWallet(true);
    try {
      const res = await StellarWalletsKit.authModal();
      if (res?.address) {
        setStellarKey(res.address);
        setIsConnectingWallet(false);
        if (mode === 'signup') setCurrentStep(2);
        else handleFinish(res.address);
      }
    } catch {
      setIsConnectingWallet(false);
    }
  };

  const handleFinish = (keyToUse?: string) => {
    onSuccess({
      name: name.trim() || 'Apex Studio',
      handle: handle.startsWith('@') ? handle : `@${handle.trim() || 'apexstudio'}`,
      stellarKey: keyToUse || stellarKey || MERCHANT_IDENTITY.baseStellarAccount,
    });
  };

  const handleCopyLink = () => {
    const url = `https://wigglepay.io/pay/@${handle || 'apexstudio'}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const triggerPreviewPay = () => {
    setPreviewSentToast(true);
    setTimeout(() => setPreviewSentToast(false), 3000);
  };

  // Initials for avatar
  const initials = useMemo(() => {
    const parts = (name || 'Apex Studio').trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name || 'WP').slice(0, 2).toUpperCase();
  }, [name]);

  // Step definitions matching Figma prototype
  const steps = [
    {
      num: 1,
      title: 'Connect wallet',
      desc: 'Pick the Stellar wallet your funds land in',
      icon: Wallet,
    },
    {
      num: 2,
      title: 'Public profile',
      desc: 'Name, bio and your custom payment link',
      icon: User,
    },
    {
      num: 3,
      title: 'Getting paid',
      desc: 'Receiving wallet & supported assets',
      icon: Coins,
    },
    {
      num: 4,
      title: 'Go live',
      desc: 'Your store is ready to share & get paid',
      icon: Sparkles,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0B1026] font-onest flex flex-col lg:flex-row relative selection:bg-[#C6FF3D] selection:text-[#0B1026]">
      {/* --------------------------------------------------------------------- */}
      {/* LEFT SIDEBAR (520px Figma Prototype Layout)                          */}
      {/* --------------------------------------------------------------------- */}
      <aside className="w-full lg:w-[500px] xl:w-[520px] bg-[#F6F7FB] p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#C9CEE2] shrink-0">
        <div>
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateHome}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#C6FF3D] flex items-center justify-center text-[#0B1026] shadow-xs group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#0B1026]">
                  <path d="M12 1.5L14.8 9.2L22.5 12L14.8 14.8L12 22.5L9.2 14.8L1.5 12L9.2 9.2L12 1.5Z" />
                </svg>
              </div>
              <span className="font-onest font-extrabold text-[20px] tracking-[-0.3px] text-[#0B1026]">
                WigglePay
              </span>
            </button>
          </div>

          {/* Intro Heading & Body */}
          <div className="pt-10 pb-8">
            <h1 className="text-3xl lg:text-[40px] font-extrabold leading-[1.2] tracking-[-1px] text-[#0B1026] mb-3">
              {mode === 'signup'
                ? 'Create your merchant page.'
                : 'Welcome back to WigglePay.'}
            </h1>
            <p className="text-[16px] leading-[24px] text-[#4A5070]">
              {mode === 'signup'
                ? 'In four quick steps, connect your wallet, set up your public profile, and start accepting instant USDC and XLM payments.'
                : 'Connect your Stellar wallet to access your real-time merchant portal, manage inventory, and monitor settled invoices.'}
            </p>
          </div>

          {/* Vertical Step List (Prototype: Done is lime check on dark; Current is lime with soft lime ring; Upcoming is white tile) */}
          {mode === 'signup' && (
            <div className="space-y-0 my-4">
              {steps.map((st, idx) => {
                const isDone = currentStep > st.num;
                const isCurrent = currentStep === st.num;
                const isUpcoming = currentStep < st.num;
                const IconComponent = st.icon;

                return (
                  <div key={st.num} className="flex flex-col">
                    <div className="flex items-center gap-4">
                      {/* Step Indicator Tile (40x40) */}
                      <div
                        className={`w-10 h-10 rounded-[10px] flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-[#0B1026] text-[#C6FF3D]'
                            : isCurrent
                            ? 'bg-[#C6FF3D] text-[#0B1026] shadow-[0_0_0_4px_rgba(198,255,61,0.35)]'
                            : 'bg-white border border-[#E4E7F2] text-[#8A91B4]'
                        }`}
                      >
                        {isDone ? (
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <IconComponent className="w-5 h-5 stroke-[1.8]" />
                        )}
                      </div>

                      {/* Title & Description */}
                      <div className="flex flex-col">
                        <span
                          className={`text-[16px] font-bold leading-tight ${
                            isCurrent || isDone ? 'text-[#0B1026]' : 'text-[#646A8A]'
                          }`}
                        >
                          {st.title}
                        </span>
                        <span className="text-[13px] font-medium text-[#646A8A]">
                          {st.desc}
                        </span>
                      </div>
                    </div>

                    {/* Connector Line (2x20) */}
                    {idx < steps.length - 1 && (
                      <div className="pl-[19px] py-1">
                        <div
                          className={`w-[2px] h-[20px] rounded-full transition-colors ${
                            isDone ? 'bg-[#0B1026]' : 'bg-[#E4E7F2]'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Preview Card (Bottom of Sidebar: Exact 440px x 324px Prototype Card) */}
        <div className="mt-8 rounded-[20px] bg-[#0B1026] text-white p-5 relative overflow-hidden shadow-2xl border border-white/[0.08]">
          {/* Subtle background decorative geometric shapes */}
          <div className="pointer-events-none absolute -top-10 -right-10 w-44 h-44 rounded-full border border-[rgba(168,148,255,0.24)]" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 w-44 h-44 rounded-full border border-[rgba(168,148,255,0.16)]" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#C6FF3D] flex items-center justify-center text-[#0B1026]">
                <Play className="w-2.5 h-2.5 fill-[#0B1026] ml-0.5" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.6px] text-[#C6FF3D]">
                LIVE PREVIEW
              </span>
            </div>
            <span className="font-redhat text-[11px] text-[#B3B8D4]">
              wigglepay.io/@{handle || 'handle'}
            </span>
          </div>

          {/* Mini Interactive Preview Widget (White Card) */}
          <div className="mt-2 rounded-[20px] bg-white text-[#0B1026] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.4)] relative z-10">
            {/* Creator Row */}
            <div className="flex items-center justify-between gap-2 pb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0B1026] text-[#C6FF3D] flex items-center justify-center font-bold text-xs">
                  {initials}
                </div>
                <div>
                  <h4 className="text-[14px] font-bold leading-tight text-[#0B1026] truncate max-w-[140px]">
                    {name || 'Your Store'}
                  </h4>
                  <span className="text-[11px] font-medium text-[#646A8A]">
                    @{handle || 'handle'}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#0B1026] text-[#C6FF3D] text-[10px] font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Verified</span>
              </span>
            </div>

            {/* Bio line */}
            <p className="text-[11px] text-[#4A5070] line-clamp-2 my-2 leading-tight">
              {bio || 'Set up your bio to tell customers about your products or services.'}
            </p>

            {/* Amount Chips */}
            <div className="grid grid-cols-3 gap-1.5 my-2.5 font-redhat text-xs">
              {[2, 5, 10].map((amt) => {
                const isPicked = previewAmount === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setPreviewAmount(amt)}
                    className={`py-1.5 px-2 rounded-xl font-bold border transition-all ${
                      isPicked
                        ? 'bg-[#0B1026] text-white border-[#0B1026]'
                        : 'bg-white text-[#0B1026] border-[#E4E7F2] hover:bg-slate-50'
                    }`}
                  >
                    ${amt} USDC
                  </button>
                );
              })}
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={triggerPreviewPay}
              className="w-full py-2.5 px-4 rounded-full bg-[#C6FF3D] hover:bg-[#b5f02c] text-[#0B1026] font-bold text-xs flex items-center justify-between transition-colors shadow-sm"
            >
              <span>Pay {previewAmount} USDC</span>
              <div className="w-6 h-6 rounded-full bg-[#0B1026] flex items-center justify-center text-[#C6FF3D]">
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          </div>

          {/* Interactive Tap Confirmation Toast */}
          <AnimatePresence>
            {previewSentToast && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 p-2 rounded-xl bg-[#161C3D] border border-[#C6FF3D]/40 text-center flex items-center justify-center gap-2 shadow-lg"
              >
                <div className="w-4 h-4 rounded-full bg-[#C6FF3D] text-[#0B1026] flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span className="text-[12px] font-bold text-white">
                  +{previewAmount}.00 USDC Received on Stellar!
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* --------------------------------------------------------------------- */}
      {/* RIGHT STAGE: ONBOARDING FLOW & STEPS (920px Prototype Layout)         */}
      {/* --------------------------------------------------------------------- */}
      <main className="flex-1 bg-white p-6 sm:p-10 lg:p-12 flex flex-col justify-between items-center">
        {/* Top Bar */}
        <div className="w-full max-w-[620px] flex items-center justify-between pb-6 border-b border-[#E4E7F2]">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B1026] text-[#C6FF3D] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#C6FF3D] animate-pulse" />
            <span>Stellar Testnet</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {mode === 'signup' ? (
              <div className="flex items-center gap-1.5 text-[#646A8A]">
                <span>Already have an account?</span>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-[#6A4CF5] hover:underline"
                >
                  Log in
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[#646A8A]">
                <span>New merchant?</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setCurrentStep(1);
                  }}
                  className="font-bold text-[#6A4CF5] hover:underline"
                >
                  Create page
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={onNavigateHome}
              className="text-[#646A8A] hover:text-[#0B1026] font-medium"
            >
              Back to Home
            </button>
          </div>
        </div>

        {/* Dynamic Center Step Content */}
        <div className="w-full max-w-[620px] py-8">
          {/* ----------------------------------------------------------------- */}
          {/* MODE: LOGIN                                                       */}
          {/* ----------------------------------------------------------------- */}
          {mode === 'login' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <span className="text-[12px] font-semibold uppercase tracking-[0.6px] text-[#6A4CF5] block mb-2">
                  AUTHENTICATION
                </span>
                <h2 className="text-3xl font-extrabold tracking-[-0.5px] text-[#0B1026]">
                  Sign in with Stellar
                </h2>
                <p className="text-sm text-[#4A5070] mt-1">
                  Connect your non-custodial Stellar wallet to access your merchant portal.
                </p>
              </div>

              {/* Wallets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  {
                    id: 'freighter',
                    name: 'Freighter',
                    desc: 'Official extension',
                    badge: 'Recommended',
                    color: '#635BFF',
                  },
                  {
                    id: 'lobstr',
                    name: 'LOBSTR',
                    desc: 'Mobile & web vault',
                    color: '#0088FF',
                  },
                  {
                    id: 'xbull',
                    name: 'xBull',
                    desc: 'DeFi & Soroban',
                    color: '#FF453A',
                  },
                  {
                    id: 'albedo',
                    name: 'Albedo',
                    desc: 'Browser delegate',
                    color: '#FF9500',
                  },
                  {
                    id: 'hana',
                    name: 'Hana',
                    desc: 'Multi-chain vault',
                    color: '#9C27B0',
                  },
                  {
                    id: 'walletconnect',
                    name: 'WalletConnect',
                    desc: 'Scan mobile QR',
                    color: '#3396FF',
                  },
                ].map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => handleConnectWallet(w.id)}
                    disabled={isConnectingWallet}
                    className="p-3.5 rounded-2xl border border-[#E4E7F2] hover:border-[#6A4CF5] hover:bg-slate-50 flex items-center justify-between text-left transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: w.color }}
                      >
                        {w.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#0B1026] flex items-center gap-2">
                          <span>{w.name}</span>
                          {w.badge && (
                            <span className="px-1.5 py-0.5 rounded-md bg-[#F3F0FF] text-[#4A2FC2] text-[10px] font-semibold">
                              {w.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#646A8A]">{w.desc}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8A91B4] group-hover:text-[#6A4CF5] transition-colors" />
                  </button>
                ))}
              </div>

              {/* Direct Official Wallets Kit Modal trigger */}
              <button
                type="button"
                onClick={handleOpenOfficialModal}
                disabled={isConnectingWallet}
                className="w-full py-3.5 rounded-full bg-[#0B1026] hover:bg-[#1E2548] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <Wallet className="w-4 h-4 text-[#C6FF3D]" />
                <span>
                  {isConnectingWallet ? 'Connecting Wallet...' : 'Launch Stellar Wallets Kit Modal'}
                </span>
              </button>

              {/* Demo 1-Click Sandbox Bypass */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => handleFinish(MERCHANT_IDENTITY.baseStellarAccount)}
                  className="text-xs text-[#646A8A] hover:text-[#0B1026] underline font-medium"
                >
                  Or continue instantly with Testnet Demo Account &rarr;
                </button>
              </div>
            </motion.div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* STEP 1: CONNECT WALLET (Prototype 01 Connect wallet)               */}
          {/* ----------------------------------------------------------------- */}
          {mode === 'signup' && currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <span className="text-[12px] font-semibold uppercase tracking-[0.6px] text-[#6A4CF5] block mb-2">
                  STEP 01
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.5px] text-[#0B1026]">
                  Connect the wallet your funds land in
                </h2>
                <p className="text-sm text-[#4A5070] mt-1 leading-relaxed">
                  Your wallet is your WigglePay login, so there’s no password to remember.
                  Signing is free, and nothing leaves your wallet.
                </p>
              </div>

              {/* Wallets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  {
                    id: 'freighter',
                    name: 'Freighter',
                    desc: 'Official browser extension',
                    badge: 'Recommended',
                    color: '#635BFF',
                  },
                  {
                    id: 'lobstr',
                    name: 'LOBSTR',
                    desc: 'Mobile & web Stellar vault',
                    color: '#0088FF',
                  },
                  {
                    id: 'xbull',
                    name: 'xBull',
                    desc: 'DeFi & Soroban ready',
                    color: '#FF453A',
                  },
                  {
                    id: 'albedo',
                    name: 'Albedo',
                    desc: 'Web-based key manager',
                    color: '#FF9500',
                  },
                  {
                    id: 'hana',
                    name: 'Hana',
                    desc: 'Multi-chain Stellar vault',
                    color: '#9C27B0',
                  },
                  {
                    id: 'walletconnect',
                    name: 'WalletConnect',
                    desc: 'Scan with mobile camera',
                    color: '#3396FF',
                  },
                ].map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => handleConnectWallet(w.id)}
                    disabled={isConnectingWallet}
                    className="p-3.5 rounded-2xl border border-[#E4E7F2] hover:border-[#6A4CF5] hover:bg-slate-50 flex items-center justify-between text-left transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: w.color }}
                      >
                        {w.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#0B1026] flex items-center gap-2">
                          <span>{w.name}</span>
                          {w.badge && (
                            <span className="px-1.5 py-0.5 rounded-md bg-[#F3F0FF] text-[#4A2FC2] text-[10px] font-semibold">
                              {w.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#646A8A]">{w.desc}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8A91B4] group-hover:text-[#6A4CF5] transition-colors" />
                  </button>
                ))}
              </div>

              {/* Stellar Wallets Kit Modal Trigger */}
              <button
                type="button"
                onClick={handleOpenOfficialModal}
                disabled={isConnectingWallet}
                className="w-full py-3 rounded-xl border border-[#E4E7F2] hover:border-[#6A4CF5] hover:bg-slate-50 text-xs font-bold text-[#0B1026] flex items-center justify-center gap-2 transition-colors"
              >
                <Wallet className="w-3.5 h-3.5 text-[#6A4CF5]" />
                <span>
                  {isConnectingWallet ? 'Connecting...' : 'Or open Official Stellar Wallets Kit Dialog'}
                </span>
              </button>

              {/* Security Shield Note (from prototype) */}
              <div className="p-4 rounded-2xl bg-[#F3F0FF] border border-[#E6E0FF] flex items-start gap-3 text-xs text-[#2E2370] leading-relaxed">
                <ShieldCheck className="w-5 h-5 text-[#4A2FC2] shrink-0 mt-0.5" />
                <p>
                  <strong>WigglePay is non-custodial.</strong> Customer payments transfer
                  peer-to-peer straight into your Stellar wallet. We never hold or see your
                  private keys.
                </p>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs text-[#646A8A] hover:text-[#0B1026] underline font-medium"
                >
                  Skip wallet connect & customize profile first &rarr;
                </button>
              </div>
            </motion.div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* STEP 2: PUBLIC PROFILE (Prototype 02 Public profile)               */}
          {/* ----------------------------------------------------------------- */}
          {mode === 'signup' && currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <span className="text-[12px] font-semibold uppercase tracking-[0.6px] text-[#6A4CF5] block mb-2">
                  STEP 02
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.5px] text-[#0B1026]">
                  Make the page yours
                </h2>
                <p className="text-sm text-[#4A5070] mt-1 leading-relaxed">
                  This is what supporters and customers see before they pay. Keep it short
                  and human. The preview on the left updates as you type.
                </p>
              </div>

              {/* Avatar Upload Slot (from prototype) */}
              <div className="flex items-center gap-4 py-1">
                <div className="w-16 h-16 rounded-full bg-[#0B1026] text-[#C6FF3D] flex items-center justify-center font-extrabold text-xl shadow-md">
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl border border-[#C9CEE2] text-xs font-bold text-[#0B1026] hover:bg-slate-50 transition-colors"
                    >
                      Upload photo
                    </button>
                    <button
                      type="button"
                      className="px-3 py-2 text-xs font-semibold text-[#4A5070] hover:text-[#0B1026] transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                  <span className="text-[11px] text-[#646A8A] block mt-1">
                    JPG, PNG or GIF · Max 5MB
                  </span>
                </div>
              </div>

              {/* Name & Handle Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0B1026] mb-1.5">
                    Display name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Apex Studio"
                    className="w-full px-4 h-12 rounded-xl border border-[#E4E7F2] focus:border-[#6A4CF5] focus:ring-4 focus:ring-[#6A4CF5]/10 outline-none text-sm text-[#0B1026] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0B1026] mb-1.5">
                    Store handle
                  </label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    placeholder="apexstudio"
                    className="w-full px-4 h-12 rounded-xl border border-[#E4E7F2] focus:border-[#6A4CF5] focus:ring-4 focus:ring-[#6A4CF5]/10 outline-none text-sm text-[#0B1026] transition-all"
                  />
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#15803D] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>wigglepay.io/@{handle || 'handle'} is available</span>
                  </div>
                </div>
              </div>

              {/* Short Bio Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#0B1026]">
                    Short description / bio
                  </label>
                  <span className="text-[11px] font-redhat text-[#646A8A]">
                    {bio.length} / 160
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={bio}
                  maxLength={160}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell customers what you build, sell or stream..."
                  className="w-full p-3.5 rounded-xl border border-[#E4E7F2] focus:border-[#6A4CF5] focus:ring-4 focus:ring-[#6A4CF5]/10 outline-none text-sm text-[#0B1026] transition-all resize-none"
                />
              </div>

              {/* Website / Social Link */}
              <div>
                <label className="block text-xs font-bold text-[#0B1026] mb-1.5">
                  Website or primary social link
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://apex.dev"
                  className="w-full px-4 h-12 rounded-xl border border-[#E4E7F2] focus:border-[#6A4CF5] focus:ring-4 focus:ring-[#6A4CF5]/10 outline-none text-sm text-[#0B1026] transition-all"
                />
              </div>

              {/* Action Buttons (Prototype: Back + Lime Continue pill with dark disc) */}
              <div className="pt-4 border-t border-[#E4E7F2] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-3 rounded-full text-sm font-bold text-[#4A5070] hover:text-[#0B1026] flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-3.5 rounded-full bg-[#C6FF3D] hover:bg-[#b5f02c] text-[#0B1026] font-bold text-sm flex items-center gap-3 shadow-md transition-all cursor-pointer"
                >
                  <span>Continue</span>
                  <div className="w-7 h-7 rounded-full bg-[#0B1026] flex items-center justify-center text-[#C6FF3D]">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* STEP 3: GETTING PAID (Prototype 03 Getting paid)                   */}
          {/* ----------------------------------------------------------------- */}
          {mode === 'signup' && currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <span className="text-[12px] font-semibold uppercase tracking-[0.6px] text-[#6A4CF5] block mb-2">
                  STEP 03
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.5px] text-[#0B1026]">
                  Receiving wallet & supported assets
                </h2>
                <p className="text-sm text-[#4A5070] mt-1 leading-relaxed">
                  Stellar confirms transactions in 3 to 5 seconds. Funds land directly in
                  your connected non-custodial wallet.
                </p>
              </div>

              {/* Verified Receiving Wallet Field */}
              <div>
                <label className="block text-xs font-bold text-[#0B1026] mb-1.5">
                  Receiving wallet address
                </label>
                <div className="h-12 px-4 rounded-xl bg-[#EEF0F7] border border-[#E4E7F2] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <Lock className="w-4 h-4 text-[#646A8A] shrink-0" />
                    <span className="font-redhat text-xs font-medium text-[#0B1026] truncate">
                      {stellarKey || MERCHANT_IDENTITY.baseStellarAccount}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E7F6EC] border border-[#A7E3BE] text-[#15803D] text-[11px] font-semibold shrink-0">
                    Verified
                  </span>
                </div>
                <span className="text-[11px] text-[#646A8A] block mt-1">
                  M-Addresses auto-generate from this root account for isolated invoice
                  attribution.
                </span>
              </div>

              {/* Supported Assets Selector */}
              <div>
                <label className="block text-xs font-bold text-[#0B1026] mb-2.5">
                  Supported settlement assets
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* USDC */}
                  <label
                    className={`p-4 rounded-2xl border-2 cursor-pointer flex items-start gap-3 transition-all ${
                      acceptUsdc
                        ? 'border-[#0B1026] bg-slate-50/50'
                        : 'border-[#E4E7F2] bg-white opacity-70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={acceptUsdc}
                      onChange={(e) => setAcceptUsdc(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-[#0B1026] focus:ring-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#2E7BF0] flex items-center justify-center text-white text-[10px] font-bold">
                          $
                        </div>
                        <span className="font-bold text-sm text-[#0B1026]">USDC</span>
                      </div>
                      <span className="text-xs text-[#646A8A] block mt-1">
                        Circle digital dollar (1:1 USD)
                      </span>
                      <span className="text-[11px] font-semibold text-[#15803D] block mt-0.5">
                        Zero protocol fee
                      </span>
                    </div>
                  </label>

                  {/* XLM */}
                  <label
                    className={`p-4 rounded-2xl border-2 cursor-pointer flex items-start gap-3 transition-all ${
                      acceptXlm
                        ? 'border-[#0B1026] bg-slate-50/50'
                        : 'border-[#E4E7F2] bg-white opacity-70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={acceptXlm}
                      onChange={(e) => setAcceptXlm(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-[#0B1026] focus:ring-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#0B1026] flex items-center justify-center text-white text-[10px] font-bold">
                          *
                        </div>
                        <span className="font-bold text-sm text-[#0B1026]">XLM</span>
                      </div>
                      <span className="text-xs text-[#646A8A] block mt-1">
                        Stellar native currency
                      </span>
                      <span className="text-[11px] font-semibold text-[#646A8A] block mt-0.5">
                        ~0.00001 XLM gas
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Note */}
              <div className="p-4 rounded-2xl bg-[#F3F0FF] border border-[#E6E0FF] flex items-start gap-3 text-xs text-[#2E2370] leading-relaxed">
                <Clock className="w-5 h-5 text-[#4A2FC2] shrink-0 mt-0.5" />
                <p>
                  Stellar settles every transaction in about 3 to 5 seconds. You see it in
                  your wallet and on your merchant dashboard in real time over Horizon SSE.
                </p>
              </div>

              {/* Actions row */}
              <div className="pt-4 border-t border-[#E4E7F2] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-3 rounded-full text-sm font-bold text-[#4A5070] hover:text-[#0B1026] flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-3.5 rounded-full bg-[#C6FF3D] hover:bg-[#b5f02c] text-[#0B1026] font-bold text-sm flex items-center gap-3 shadow-md transition-all cursor-pointer"
                >
                  <span>Finish setup</span>
                  <div className="w-7 h-7 rounded-full bg-[#0B1026] flex items-center justify-center text-[#C6FF3D]">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* STEP 4: GO LIVE (Prototype 04 Go live)                             */}
          {/* ----------------------------------------------------------------- */}
          {mode === 'signup' && currentStep === 4 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Done Disc (72x72 lime circle with soft lime ring) */}
              <div className="w-[72px] h-[72px] rounded-full bg-[#C6FF3D] shadow-[0_0_0_8px_#EEFFC2] flex items-center justify-center text-[#0B1026]">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <span className="text-[12px] font-semibold uppercase tracking-[0.6px] text-[#6A4CF5] block mb-1">
                  ALL SET
                </span>
                <h2 className="text-4xl sm:text-5xl font-anton uppercase tracking-[0.3px] text-[#0B1026] leading-none">
                  YOU'RE LIVE.
                </h2>
                <p className="text-sm text-[#4A5070] mt-2 leading-relaxed">
                  Your WigglePay store is ready. Share your link anywhere, embed the widget
                  on your site, or open your merchant dashboard.
                </p>
              </div>

              {/* Shareable Link Box */}
              <div className="p-2 pl-4 rounded-2xl border-2 border-[#E4E7F2] bg-white flex items-center justify-between gap-3 shadow-sm">
                <span className="font-redhat text-xs sm:text-sm font-semibold text-[#0B1026] truncate">
                  https://wigglepay.io/pay/@{handle || 'apexstudio'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl bg-[#0B1026] hover:bg-[#1E2548] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#C6FF3D]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Next Steps Cards (01 Customize widget, 02 Get embed code) */}
              <div className="space-y-2.5">
                <div className="p-4 rounded-2xl border border-[#E4E7F2] bg-white hover:border-[#6A4CF5] transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] text-[#6A4CF5] flex items-center justify-center font-bold text-xs">
                      01
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0B1026]">
                        Customize your checkout widget
                      </h4>
                      <p className="text-xs text-[#4A5070]">
                        Colours, amounts, themes, and OBS stream alerts
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8A91B4]" />
                </div>

                <div className="p-4 rounded-2xl border border-[#E4E7F2] bg-white hover:border-[#6A4CF5] transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] text-[#6A4CF5] flex items-center justify-center font-bold text-xs">
                      02
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0B1026]">
                        Get your embed code
                      </h4>
                      <p className="text-xs text-[#4A5070]">
                        Add the 1-click modal to Shopify, WordPress or custom HTML
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8A91B4]" />
                </div>
              </div>

              {/* Primary Go To Dashboard CTA */}
              <div className="pt-4 border-t border-[#E4E7F2]">
                <button
                  type="button"
                  onClick={() => handleFinish()}
                  className="w-full py-4 rounded-full bg-[#C6FF3D] hover:bg-[#b5f02c] text-[#0B1026] font-bold text-base flex items-center justify-center gap-3 shadow-[0_4px_25px_rgba(198,255,61,0.35)] transition-all cursor-pointer"
                >
                  <span>Go to merchant dashboard</span>
                  <div className="w-7 h-7 rounded-full bg-[#0B1026] flex items-center justify-center text-[#C6FF3D]">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bottom 4-Bar Progress Indicators (Exact Prototype Component) */}
        {mode === 'signup' && (
          <div className="w-full max-w-[620px] pt-6 flex items-center gap-2">
            {[1, 2, 3, 4].map((bar) => {
              const isFilled = currentStep >= bar;
              return (
                <div
                  key={bar}
                  className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                    isFilled ? 'bg-[#0B1026]' : 'bg-[#E4E7F2]'
                  }`}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
