/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutGrid,
  Sparkles,
  Code2,
  CreditCard,
  FileText,
  Radio,
  Webhook,
  Mic,
  Palette,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  ArrowUpRight,
  Check,
  Search,
  Command,
  Menu,
  X,
  ChevronDown,
  Package,
  Plus,
  Globe2,
} from 'lucide-react';
import {
  Invoice,
  AssetType,
  UnifiedNavId,
  EnvironmentSurface,
  StreamAlertEvent,
  WebhookDelivery,
  TipLinkCard,
  TipSourceSite,
  InventoryCategory,
  InventoryProduct,
  INITIAL_INVOICES,
  INITIAL_WEBHOOKS,
  INITIAL_TIP_LINKS,
  INITIAL_TIP_SOURCES,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  MERCHANT_IDENTITY,
  generateMemo64Bit,
  generateMultiplexedAddress,
  generateStellarTxHash,
} from './data/wigglePayData';
import { GlobalDynamicIsland, ObsOverlayStudio } from './components/DynamicIslandHud';
import { EmbeddableCheckoutWidget } from './components/EmbeddableCheckoutWidget';
import { MerchantPortalDashboard } from './components/MerchantPortalDashboard';
import { TelegramMiniApp } from './components/TelegramMiniApp';
import { DesignSystemDeliverables } from './components/DesignSystemDeliverables';
import { TipLinksAndEmbedStudio } from './components/TipLinksAndEmbedStudio';
import { InventoryManager } from './components/InventoryManager';
import { InvoiceCreationStudio } from './components/InvoiceCreationStudio';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { WigglePayApi } from './services/api';

function getInitialNav(): UnifiedNavId {
  if (typeof window === 'undefined') return 'landing';
  const path = window.location.pathname.replace(/^\//, '').toLowerCase();
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  const key = (hash || path) as UnifiedNavId;
  const validNavs: UnifiedNavId[] = [
    'landing',
    'login',
    'signup',
    'overview',
    'create-invoice',
    'invoices',
    'inventory',
    'tiplinks',
    'embedcode',
    'widget',
    'livealerts',
    'webhooks',
    'telegram',
    'specs',
    'settings',
  ];
  if (validNavs.includes(key)) return key;
  if (window.location.search.includes('invoiceId')) return 'widget';
  return path === '' ? 'landing' : 'overview';
}

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<UnifiedNavId>(getInitialNav);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [networkMode, setNetworkMode] = useState<'Testnet' | 'Mainnet'>('Mainnet');
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);

  // URL-synchronized router navigation
  const navigateTo = useCallback((navId: UnifiedNavId | string) => {
    const cleanId = (navId.replace(/^\//, '') || 'landing') as UnifiedNavId;
    setActiveNav(cleanId);
    const targetPath = cleanId === 'landing' ? '/' : `/${cleanId}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  }, []);

  // Listen to browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setActiveNav(getInitialNav());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Shared Reactive Data Stores
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(INITIAL_INVOICES[0].id);
  const [webhooks, setWebhooks] = useState<WebhookDelivery[]>(INITIAL_WEBHOOKS);
  const [tipLinks, setTipLinks] = useState<TipLinkCard[]>(INITIAL_TIP_LINKS);
  const [tipSources, setTipSources] = useState<TipSourceSite[]>(INITIAL_TIP_SOURCES);
  const [categories, setCategories] = useState<InventoryCategory[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<InventoryProduct[]>(INITIAL_PRODUCTS);

  // Sync Categories & Products from Backend API on mount
  useEffect(() => {
    async function syncBackendInventory() {
      try {
        const [apiCats, apiProds] = await Promise.all([
          WigglePayApi.getCategories(),
          WigglePayApi.getProducts(),
        ]);
        if (apiCats && apiCats.length > 0) {
          setCategories(
            apiCats.map((c) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              icon: c.icon || 'Package',
              color: c.color || '#007AFF',
              description: c.description,
              display_order: c.display_order,
              is_active: c.is_active,
              products_count: c.products_count,
            }))
          );
        }
        if (apiProds && apiProds.length > 0) {
          setProducts(
            apiProds.map((p) => ({
              id: p.id,
              categoryId: p.category,
              categoryName: p.category_name || 'General Shelf',
              categoryColor: p.category_color || '#007AFF',
              title: p.title,
              sku: p.sku,
              description: p.description,
              price: parseFloat(p.price) || 0,
              currency: (p.currency as AssetType) || 'USDC',
              stockQuantity: p.stock_quantity,
              trackStock: p.track_stock,
              isInStock: p.is_in_stock,
              badge: p.badge || undefined,
              isActive: p.is_active,
              createdAt: p.created_at,
            }))
          );
        }
      } catch (err) {
        console.warn('Backend inventory sync fallback to initial data:', err);
      }
    }
    syncBackendInventory();
  }, []);

  // Global Dynamic Island Alert State
  const [activeStreamAlert, setActiveStreamAlert] = useState<StreamAlertEvent | null>(null);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(3);
  const [alertHistory, setAlertHistory] = useState<StreamAlertEvent[]>([
    {
      id: 'al-init-1',
      donorName: 'Sarah',
      donorHandle: '@sarah_chen',
      amount: 240,
      asset: 'USDC',
      message: 'macOS Iconography & HIG Audit Retainer',
      txHash: '8f3a9d21c4e7b01948271635a9c8e7f6d5b4a39281706f5e4d3c2b1a09876543',
      ledgerIndex: 54192840,
      timestamp: '14 mins ago',
    },
    {
      id: 'al-init-2',
      donorName: 'Marcus',
      donorHandle: '@marcus_vance',
      amount: 420,
      asset: 'XLM',
      message: 'Live stream SuperTip — Spatial Audio Rig',
      txHash: '3c1e7b90a2d4f681920384756a1b2c3d4e5f60718293a4b5c6d7e8f901234567',
      ledgerIndex: 54192512,
      timestamp: '41 mins ago',
    },
    {
      id: 'al-init-3',
      donorName: 'Alex',
      donorHandle: '@alex_mercer',
      amount: 50,
      asset: 'USDC',
      message: 'Keep crushing the stream!',
      txHash: '7a4b2c9d1e0f3847561029384756a1b2c3d4e5f60718293a4b5c6d7e8f901928',
      ledgerIndex: 54191104,
      timestamp: '1 hour ago',
    },
  ]);

  // Search & Command Palette State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [paletteQuery, setPaletteQuery] = useState<string>('');

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Auto-collapse Dynamic Island after 6 seconds
  useEffect(() => {
    if (!activeStreamAlert) return;
    const timer = setTimeout(() => {
      setActiveStreamAlert(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeStreamAlert]);

  // Global Cmd + K / Ctrl + K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectedInvoice =
    invoices.find((inv) => inv.id === selectedInvoiceId) || invoices[0];

  const triggerDynamicIslandAlert = useCallback(
    (payload: Omit<StreamAlertEvent, 'id' | 'timestamp'>) => {
      const newAlert: StreamAlertEvent = {
        ...payload,
        id: `alert-${Date.now()}`,
        timestamp: 'Just now',
      };
      setActiveStreamAlert(newAlert);
      setAlertHistory((prev) => [newAlert, ...prev]);
      setUnreadAlertsCount((c) => c + 1);
    },
    []
  );

  // Settle an invoice across all surfaces
  const handleSettleInvoice = useCallback(
    (invoiceId: string) => {
      const target = invoices.find((i) => i.id === invoiceId);
      if (!target) return;

      const txHash = target.txHash || generateStellarTxHash();
      const ledgerIndex = target.ledgerIndex || 54193000 + Math.floor(Math.random() * 900);

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId
            ? {
                ...inv,
                status: 'Settled',
                txHash,
                ledgerIndex,
                createdAt: 'Just settled',
              }
            : inv
        )
      );

      const newWebhook: WebhookDelivery = {
        id: `wh_${Math.floor(993000 + Math.random() * 9000)}`,
        invoiceId: target.id,
        event: 'invoice.settled',
        endpoint: MERCHANT_IDENTITY.webhookUrl,
        hmacSignature: `sha256=${generateStellarTxHash()}`,
        statusCode: 200,
        latencyMs: Math.floor(45 + Math.random() * 35),
        timestamp: 'Just now',
        payloadPreview: JSON.stringify({
          event: 'invoice.settled',
          invoice_id: target.id,
          amount: target.amount.toFixed(2),
          asset: target.asset,
          ledger: ledgerIndex,
        }),
      };
      setWebhooks((prev) => [newWebhook, ...prev]);

      // Decrement stock for items attached to this invoice
      if (target.items && target.items.length > 0) {
        setProducts((prev) =>
          prev.map((p) => {
            const bought = target.items?.find((i) => i.productId === p.id);
            if (bought) {
              const newQty = Math.max(0, p.stockQuantity - bought.quantity);
              return {
                ...p,
                stockQuantity: newQty,
                isInStock: newQty > 0,
              };
            }
            return p;
          })
        );
      }

      const cleanName =
        target.customerName.split(' ')[0] ||
        target.customerHandle.replace('@', '');
      triggerDynamicIslandAlert({
        donorName: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        donorHandle: target.customerHandle,
        amount: target.amount,
        asset: target.asset,
        message: target.description || 'Keep crushing the stream!',
        txHash,
        ledgerIndex,
      });
    },
    [invoices, triggerDynamicIslandAlert]
  );

  const handleExpireInvoice = useCallback((invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: 'Expired' } : inv
      )
    );
  }, []);

  const handleRegenerateInvoice = useCallback((invoiceId: string) => {
    const newMemo = generateMemo64Bit();
    const newMAddress = generateMultiplexedAddress(newMemo);
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: 'Active',
              memoId: newMemo,
              multiplexedAddress: newMAddress,
              createdAt: 'Refreshed just now',
              timestampMs: Date.now(),
            }
          : inv
      )
    );
  }, []);

  const handleCreateInvoice = useCallback((newInv: Invoice) => {
    setInvoices((prev) => [newInv, ...prev]);
    setSelectedInvoiceId(newInv.id);
  }, []);

  const handleAddCategory = useCallback((cat: InventoryCategory) => {
    setCategories((prev) => [...prev, cat]);
  }, []);

  const handleAddProduct = useCallback((prod: InventoryProduct) => {
    setProducts((prev) => [prod, ...prev]);
  }, []);

  const handleUpdateProductStock = useCallback((productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, stockQuantity: newStock, isInStock: newStock > 0 }
          : p
      )
    );
  }, []);

  const handleDispatchTestWebhook = useCallback(() => {
    const sampleWebhook: WebhookDelivery = {
      id: `wh_${Math.floor(994000 + Math.random() * 9000)}`,
      invoiceId: selectedInvoice.id,
      event: 'invoice.settled',
      endpoint: MERCHANT_IDENTITY.webhookUrl,
      hmacSignature: `sha256=${generateStellarTxHash()}`,
      statusCode: 200,
      latencyMs: 54,
      timestamp: 'Just now',
      payloadPreview: JSON.stringify({
        event: 'invoice.settled',
        invoice_id: selectedInvoice.id,
        amount: selectedInvoice.amount.toFixed(2),
        asset: selectedInvoice.asset,
        test_ping: true,
      }),
    };
    setWebhooks((prev) => [sampleWebhook, ...prev]);
  }, [selectedInvoice]);

  const handleSaveTipLink = useCallback((card: TipLinkCard) => {
    setTipLinks((prev) => {
      const exists = prev.some((item) => item.id === card.id);
      if (exists) {
        return prev.map((item) => (item.id === card.id ? card : item));
      }
      return [...prev, card];
    });
  }, []);

  const handleDeleteTipLink = useCallback((id: string) => {
    setTipLinks((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleSetPrimaryTipLink = useCallback((id: string) => {
    setTipLinks((prev) =>
      prev.map((item) => ({
        ...item,
        isPrimary: item.id === id,
      }))
    );
  }, []);

  const handleTestTipFlow = useCallback(
    (amount: number, asset: AssetType, message: string) => {
      triggerDynamicIslandAlert({
        donorName: 'Alex',
        donorHandle: '@alex',
        amount,
        asset,
        message,
        txHash: generateStellarTxHash(),
        ledgerIndex: 54193610 + Math.floor(Math.random() * 200),
      });
      setTipSources((prev) =>
        prev.map((s, idx) =>
          idx === 0 ? { ...s, tipsCount: s.tipsCount + 1, lastTipAgo: 'Just now' } : s
        )
      );
    },
    [triggerDynamicIslandAlert]
  );

  const handleSharePage = () => {
    const primaryLink =
      tipLinks.find((t) => t.isPrimary)?.url || 'https://wigglepay.app/luffy';
    navigator.clipboard?.writeText(primaryLink);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 1800);
  };

  const handleSurfaceShortcut = (surface: EnvironmentSurface) => {
    if (surface === 'portal') navigateTo('overview');
    if (surface === 'widget') navigateTo('widget');
    if (surface === 'overlay') navigateTo('livealerts');
    if (surface === 'telegram') navigateTo('telegram');
    if (surface === 'specs') navigateTo('specs');
  };

  // Grouped macOS Sonoma/Sequoia Sidebar Navigation Items using SF Symbols 5
  // Arranged logically by level of importance & grouped by functional domain
  const navGroups: {
    title: string;
    items: {
      id: UnifiedNavId;
      label: string;
      icon: React.ReactNode;
      badgeCount?: number;
    }[];
  }[] = [
    {
      title: 'Core Commerce',
      items: [
        { id: 'overview', label: 'Overview', icon: <LayoutGrid className="w-[18px] h-[18px]" /> },
        { id: 'create-invoice', label: 'Create Invoice', icon: <Plus className="w-[18px] h-[18px]" /> },
        { id: 'invoices', label: 'History & Ledger', icon: <FileText className="w-[18px] h-[18px]" /> },
        { id: 'inventory', label: 'Shelves & Inventory', icon: <Package className="w-[18px] h-[18px]" /> },
      ],
    },
    {
      title: 'Payment Channels',
      items: [
        { id: 'tiplinks', label: 'Widgets & Paylinks', icon: <Sparkles className="w-[18px] h-[18px]" /> },
        { id: 'embedcode', label: 'Embed Studio', icon: <Code2 className="w-[18px] h-[18px]" /> },
        {
          id: 'livealerts',
          label: 'Stream Overlays',
          icon: <Radio className="w-[18px] h-[18px]" />,
          badgeCount: unreadAlertsCount,
        },
      ],
    },
    {
      title: 'Integrations & AI',
      items: [
        { id: 'telegram', label: 'Telegram Mini-App', icon: <Mic className="w-[18px] h-[18px]" /> },
        { id: 'webhooks', label: 'Webhooks & Events', icon: <Webhook className="w-[18px] h-[18px]" /> },
      ],
    },
    {
      title: 'Platform & Specs',
      items: [
        { id: 'widget', label: 'Checkout Demo', icon: <CreditCard className="w-[18px] h-[18px]" /> },
        { id: 'settings', label: 'Merchant Settings', icon: <Settings className="w-[18px] h-[18px]" /> },
        { id: 'specs', label: 'HIG Design Spec', icon: <Palette className="w-[18px] h-[18px]" /> },
      ],
    },
  ];

  const allNavItems = navGroups.flatMap((g) => g.items);

  const renderSidebarContent = (isMobile = false) => {
    const isCollapsed = !isMobile && sidebarCollapsed;

    return (
      <div className="h-full flex flex-col justify-between py-4 px-3 select-none">
        {/* Top Section: Brand Header + Collapse Toggle + Grouped Navigation List */}
        <div className="space-y-5 overflow-y-auto pr-0.5">
          <div
            className={`flex items-center ${
              isCollapsed ? 'justify-center px-0' : 'justify-between px-2'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                navigateTo('landing');
                if (isMobile) setMobileDrawerOpen(false);
              }}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              {/* 32x32 Apple Squircle with Stellar Spark Icon in System Blue */}
              <div className="w-8 h-8 rounded-[9px] bg-[#007AFF] dark:bg-[#0A84FF] flex items-center justify-center shrink-0 shadow-xs">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path d="M12 2L14.6 9.4L22 12L14.6 14.6L12 22L9.4 14.6L2 12L9.4 9.4L12 2Z" />
                </svg>
              </div>
              {!isCollapsed && (
                <div>
                  <div className="sf-headline text-black dark:text-white leading-tight">
                    WigglePay
                  </div>
                  <div className="text-[11px] text-black/45 dark:text-white/45 leading-tight">
                    Stellar Gateway
                  </div>
                </div>
              )}
            </button>

            {/* Desktop Collapse Button (< / >) or Mobile Close Button */}
            {isMobile ? (
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close navigation drawer"
                className="w-7 h-7 rounded-full bg-black/6 dark:bg-white/10 flex items-center justify-center text-black/65 dark:text-white/75"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSidebarCollapsed((c) => !c)}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className="apple-pressable w-7 h-7 rounded-[8px] bg-black/5 dark:bg-white/8 hover:bg-black/10 dark:hover:bg-white/15 flex items-center justify-center text-black/60 dark:text-white/70"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Grouped macOS Sidebar Navigation */}
          <nav aria-label="Main Navigation" className="space-y-4">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                    {group.title}
                  </div>
                )}
                {group.items.map((item) => {
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        navigateTo(item.id);
                        if (item.id === 'livealerts') {
                          setUnreadAlertsCount(0);
                        }
                        if (isMobile) setMobileDrawerOpen(false);
                      }}
                      title={isCollapsed ? item.label : undefined}
                      className={`apple-pressable w-full h-[36px] rounded-[9px] px-2.5 flex items-center ${
                        isCollapsed ? 'justify-center' : 'justify-between'
                      } transition-all ${
                        isActive
                          ? 'bg-[#007AFF] dark:bg-[#0A84FF] text-white font-semibold shadow-2xs'
                          : 'text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/8 font-medium'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={
                            isActive
                              ? 'text-white shrink-0'
                              : 'text-[#007AFF] dark:text-[#0A84FF] shrink-0'
                          }
                        >
                          {item.icon}
                        </span>
                        {!isCollapsed && (
                          <span className="sf-footnote truncate">{item.label}</span>
                        )}
                      </span>

                      {/* Unread Live Alerts Badge */}
                      {!isCollapsed && item.badgeCount !== undefined && item.badgeCount > 0 && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[11px] font-semibold sf-mono-tabular ${
                            isActive
                              ? 'bg-white/25 text-white'
                              : 'bg-[#007AFF]/12 text-[#007AFF] dark:text-[#0A84FF]'
                          }`}
                        >
                          {item.badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Section: Non-Custodial Merchant Account Card + Sign out */}
        <div className="space-y-2 pt-3 border-t border-black/6 dark:border-white/8">
          {isCollapsed ? (
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                title={`${MERCHANT_IDENTITY.name} (${MERCHANT_IDENTITY.handle}) · Connected`}
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#007AFF] to-[#5856D6] text-white font-semibold text-xs flex items-center justify-center shadow-xs"
              >
                ML
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-[12px] bg-black/4 dark:bg-white/6 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#007AFF] to-[#5856D6] text-white font-semibold text-xs flex items-center justify-center shrink-0">
                  ML
                </div>
                <div className="min-w-0">
                  <div className="sf-footnote font-semibold text-black dark:text-white truncate">
                    {MERCHANT_IDENTITY.name}
                  </div>
                  <div className="sf-caption text-black/50 dark:text-white/50 truncate">
                    {MERCHANT_IDENTITY.handle}
                  </div>
                </div>
              </div>

              {/* Connected Freighter Key Row */}
              <div className="px-2 py-1.5 rounded-[8px] bg-white/80 dark:bg-black/40 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-4 h-4 rounded-[5px] bg-[#5856D6] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                    F
                  </span>
                  <span className="sf-mono-tabular text-[11px] text-black/70 dark:text-white/75 truncate">
                    {MERCHANT_IDENTITY.shortStellarKey}
                  </span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full bg-[#34C759]/15 text-[#34C759] dark:text-[#30D158] text-[10px] font-semibold flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                  <span>Active</span>
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => navigateTo('login')}
            className={`apple-pressable w-full h-8 px-2.5 rounded-[8px] text-black/55 dark:text-white/55 hover:bg-black/5 dark:hover:bg-white/8 flex items-center ${
              isCollapsed ? 'justify-center' : 'gap-2'
            } sf-footnote font-medium cursor-pointer`}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {!isCollapsed && <span>Lock Session</span>}
          </button>
        </div>
      </div>
    );
  };

  // Fullscreen Public Landing Page
  if (activeNav === 'landing') {
    return (
      <>
        <GlobalDynamicIsland
          activeAlert={activeStreamAlert}
          onDismiss={() => setActiveStreamAlert(null)}
        />
        <LandingPage
          onNavigate={(r) => navigateTo(r)}
          onOpenCheckoutDemo={() => navigateTo('widget')}
          onTriggerAlertDemo={(amount, asset) => {
            triggerDynamicIslandAlert({
              donorName: 'Landing Visitor',
              donorHandle: '@guest',
              amount,
              asset,
              message: 'Stellar live stream checkout alert preview',
              txHash: generateStellarTxHash(),
              ledgerIndex: 54194000,
            });
          }}
        />
      </>
    );
  }

  // Fullscreen Authentication Page (Login / Sign Up)
  if (activeNav === 'login' || activeNav === 'signup') {
    return (
      <AuthPage
        initialMode={activeNav === 'signup' ? 'signup' : 'login'}
        onSuccess={(_user) => navigateTo('overview')}
        onNavigateHome={() => navigateTo('landing')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#000000] text-black dark:text-white flex transition-colors duration-200">
      {/* Persistent Global Dynamic Island OBS Alert Overlay */}
      <GlobalDynamicIsland
        activeAlert={activeStreamAlert}
        onDismiss={() => setActiveStreamAlert(null)}
      />

      {/* Desktop Unified Collapsible Sidenav: 240px Fixed Width in Ultra-Thin Material */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 240 }}
        transition={{ type: 'spring', duration: 0.35, bounce: 0.1 }}
        className="hidden lg:block shrink-0 apple-material-sidebar sticky top-0 h-screen z-30 overflow-hidden"
      >
        {renderSidebarContent(false)}
      </motion.aside>

      {/* Mobile Slide-Over Glass Sidenav Drawer */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', duration: 0.38, bounce: 0.1 }}
              className="relative z-10 w-[240px] max-w-[82vw] h-full apple-material-sidebar shadow-2xl"
            >
              {renderSidebarContent(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Column */}
      <div className="flex-1 min-w-0 flex flex-col pb-20 lg:pb-10">
        {/* Unified macOS Sonoma/Sequoia Top Toolbar */}
        <header className="sticky top-0 z-20 min-h-[60px] px-4 sm:px-7 py-2.5 bg-white/80 dark:bg-black/75 backdrop-blur-xl border-b border-black/8 dark:border-white/10 flex items-center justify-between gap-3">
          {/* Left: Mobile Menu Button + Workspace Switcher */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden apple-pressable w-9 h-9 rounded-[10px] bg-[#F2F2F7] dark:bg-[#1C1C1E] flex items-center justify-center text-black dark:text-white shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="sf-headline text-black dark:text-white truncate">
                  {MERCHANT_IDENTITY.name}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-[#F2F2F7] dark:bg-[#1C1C1E] sf-caption font-medium text-black/60 dark:text-white/60">
                  {MERCHANT_IDENTITY.handle}
                </span>
              </div>
              <div className="sf-caption text-black/50 dark:text-white/50 truncate">
                Non-Custodial Stellar Horizon SSE · 0.1% Flat Protocol Fee
              </div>
            </div>
          </div>

          {/* Center: macOS Spotlight Search Bar with Cmd + K shortcut hint */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden md:flex items-center justify-between gap-6 px-3 py-1.5 rounded-[10px] bg-[#F2F2F7] dark:bg-[#1C1C1E] hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E] text-black/50 dark:text-white/50 sf-footnote transition-colors w-64 lg:w-80"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Search invoices, M-addresses, memos…</span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded-[5px] bg-white dark:bg-[#2C2C2E] text-[10px] sf-mono-tabular text-black/60 dark:text-white/60 shadow-2xs shrink-0">
              ⌘K
            </kbd>
          </button>

          {/* Right: Stellar Network Status Indicator (Pulsing Green Dot) + Light/Dark Switch + Profile & Share */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Real-time Stellar Network Status Indicator */}
            <button
              type="button"
              onClick={() =>
                setNetworkMode((n) => (n === 'Mainnet' ? 'Testnet' : 'Mainnet'))
              }
              title="Toggle Stellar Horizon Network"
              className="apple-pressable hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F2F2F7] dark:bg-[#1C1C1E] sf-caption font-medium text-black dark:text-white"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34C759] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34C759]" />
              </span>
              <span>Stellar {networkMode}</span>
            </button>

            {/* Profile Balance Pill */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="apple-pressable hidden xl:flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-[#F2F2F7] dark:bg-[#1C1C1E] text-left"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#007AFF] to-[#5856D6] text-white font-semibold text-[10px] flex items-center justify-center">
                ML
              </div>
              <span className="sf-mono-tabular sf-caption font-medium text-black dark:text-white">
                {MERCHANT_IDENTITY.balanceUsdc}
              </span>
              <ChevronDown className="w-3 h-3 text-black/45 dark:text-white/45" />
            </button>

            {/* Instant macOS Toolbar Light / Dark Appearance Toggle */}
            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="apple-pressable p-1 rounded-[9px] bg-[#F2F2F7] dark:bg-[#1C1C1E] flex items-center gap-0.5"
            >
              <span
                className={`w-7 h-7 rounded-[7px] flex items-center justify-center transition-all ${
                  !darkMode
                    ? 'bg-white text-black shadow-2xs'
                    : 'text-white/45 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
              </span>
              <span
                className={`w-7 h-7 rounded-[7px] flex items-center justify-center transition-all ${
                  darkMode
                    ? 'bg-[#2C2C2E] text-[#0A84FF] shadow-2xs'
                    : 'text-black/45 hover:text-black'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Public Storefront Link */}
            <button
              type="button"
              onClick={() => navigateTo('landing')}
              title="View Public Storefront"
              className="apple-pressable hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#F2F2F7] dark:bg-[#1C1C1E] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white sf-footnote font-semibold cursor-pointer"
            >
              <Globe2 className="w-3.5 h-3.5 text-[#007AFF]" />
              <span>Storefront</span>
            </button>

            {/* Share Primary Paylink Button */}
            <button
              type="button"
              onClick={handleSharePage}
              className="apple-pressable px-3.5 py-1.5 rounded-[10px] bg-[#007AFF] dark:bg-[#0A84FF] text-white sf-footnote font-semibold flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
            >
              <span>{copiedShareLink ? 'Copied' : 'Share Paylink'}</span>
              {copiedShareLink ? (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </button>
          </div>
        </header>

        {/* Active View Stage */}
        <div className="flex-1 px-4 sm:px-7 py-6 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeNav}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
            >
              {activeNav === 'create-invoice' && (
                <InvoiceCreationStudio
                  categories={categories}
                  products={products}
                  onCreateInvoice={handleCreateInvoice}
                  onOpenInCheckoutWidget={(inv) => {
                    setSelectedInvoiceId(inv.id);
                    navigateTo('widget');
                  }}
                  onSimulateSettle={handleSettleInvoice}
                />
              )}

              {activeNav === 'inventory' && (
                <InventoryManager
                  categories={categories}
                  products={products}
                  onAddCategory={handleAddCategory}
                  onAddProduct={handleAddProduct}
                  onUpdateProductStock={handleUpdateProductStock}
                  onQuickInvoiceProduct={(_prod) => {
                    navigateTo('create-invoice');
                  }}
                />
              )}

              {(activeNav === 'tiplinks' || activeNav === 'embedcode') && (
                <TipLinksAndEmbedStudio
                  mode={activeNav}
                  onSwitchMode={(m) => navigateTo(m)}
                  tipLinks={tipLinks}
                  tipSources={tipSources}
                  onCreateTipLink={handleSaveTipLink}
                  onDeleteTipLink={handleDeleteTipLink}
                  onSetPrimaryTipLink={handleSetPrimaryTipLink}
                  onTestTipFlow={handleTestTipFlow}
                  onOpenFullCheckoutWidget={() => navigateTo('widget')}
                />
              )}

              {(activeNav === 'overview' ||
                activeNav === 'invoices' ||
                activeNav === 'webhooks' ||
                activeNav === 'settings') && (
                <MerchantPortalDashboard
                  invoices={invoices}
                  webhooks={webhooks}
                  tipLinks={tipLinks}
                  activeView={activeNav}
                  onOpenInvoiceInWidget={(inv) => {
                    setSelectedInvoiceId(inv.id);
                    navigateTo('widget');
                  }}
                  onSettleInvoice={handleSettleInvoice}
                  onExpireInvoice={handleExpireInvoice}
                  onCreateInvoice={handleCreateInvoice}
                  onDispatchTestWebhook={handleDispatchTestWebhook}
                  onJumpToTipLinks={() => navigateTo('tiplinks')}
                  onOpenEmbedCode={() => navigateTo('embedcode')}
                  onOpenTelegram={() => navigateTo('telegram')}
                  onSwitchToHistory={() => navigateTo('invoices')}
                  onJumpToCreateInvoice={() => navigateTo('create-invoice')}
                  onJumpToInventory={() => navigateTo('inventory')}
                  onTestTipFlow={handleTestTipFlow}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onOpenCommandPalette={() => setCommandPaletteOpen(true)}
                />
              )}

              {activeNav === 'widget' && (
                <EmbeddableCheckoutWidget
                  invoices={invoices}
                  selectedInvoice={selectedInvoice}
                  onSelectInvoice={(inv) => setSelectedInvoiceId(inv.id)}
                  onSettleInvoice={handleSettleInvoice}
                  onRegenerateInvoice={handleRegenerateInvoice}
                />
              )}

              {activeNav === 'livealerts' && (
                <ObsOverlayStudio
                  activeAlert={activeStreamAlert}
                  alertHistory={alertHistory}
                  onTriggerAlert={triggerDynamicIslandAlert}
                  onDismissAlert={() => setActiveStreamAlert(null)}
                />
              )}

              {activeNav === 'telegram' && (
                <TelegramMiniApp
                  onCreateInvoice={handleCreateInvoice}
                  onOpenInWidget={(inv) => {
                    setSelectedInvoiceId(inv.id);
                    navigateTo('widget');
                  }}
                  onSimulateInstantSettle={(inv) => {
                    handleSettleInvoice(inv.id);
                  }}
                  onBackToPortal={() => navigateTo('overview')}
                />
              )}

              {activeNav === 'specs' && (
                <DesignSystemDeliverables onNavigateSurface={handleSurfaceShortcut} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Responsive Mobile iOS 18 Bottom Tab Bar (< lg) */}
      <nav
        aria-label="Mobile Quick Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-16 bg-white/85 dark:bg-[#1C1C1E]/85 backdrop-blur-xl border-t border-black/8 dark:border-white/10 px-2 flex items-center justify-around"
      >
        {(
          [
            { id: 'overview', label: 'Overview', icon: <LayoutGrid className="w-5 h-5" /> },
            { id: 'create-invoice', label: 'Invoicing', icon: <Plus className="w-5 h-5" /> },
            { id: 'inventory', label: 'Inventory', icon: <Package className="w-5 h-5" /> },
            { id: 'invoices', label: 'History', icon: <FileText className="w-5 h-5" /> },
            { id: 'tiplinks', label: 'Paylinks', icon: <Sparkles className="w-5 h-5" /> },
          ] as { id: UnifiedNavId; label: string; icon: React.ReactNode }[]
        ).map((tab) => {
          const active =
            activeNav === tab.id ||
            (tab.id === 'tiplinks' && activeNav === 'embedcode');
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigateTo(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 rounded-[10px] transition-colors ${
                active
                  ? 'text-[#007AFF] dark:text-[#0A84FF] font-semibold'
                  : 'text-black/45 dark:text-white/45'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Spotlight Cmd + K Command Palette Modal */}
      <AnimatePresence>
        {commandPaletteOpen && (
          <div
            onClick={() => setCommandPaletteOpen(false)}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-20 px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg apple-material-popover rounded-[20px] overflow-hidden text-black dark:text-white"
            >
              <div className="p-3.5 border-b border-black/8 dark:border-white/10 flex items-center gap-3">
                <Search className="w-4 h-4 text-[#007AFF] shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={paletteQuery}
                  onChange={(e) => setPaletteQuery(e.target.value)}
                  placeholder="Jump to surface, fire Dynamic Island alert, or toggle theme…"
                  className="w-full bg-transparent sf-body focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setCommandPaletteOpen(false)}
                  className="w-6 h-6 rounded-full bg-black/8 dark:bg-white/12 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-2 max-h-80 overflow-y-auto space-y-1 sf-footnote">
                <div className="px-2.5 py-1 sf-caption font-semibold text-black/45 dark:text-white/45">
                  Apple HIG Views &amp; Surfaces
                </div>
                {allNavItems
                  .filter((l) =>
                    l.label.toLowerCase().includes(paletteQuery.toLowerCase())
                  )
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        navigateTo(item.id);
                        setCommandPaletteOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-[10px] hover:bg-[#007AFF] hover:text-white flex items-center justify-between transition-colors"
                    >
                      <span className="font-medium flex items-center gap-2.5">
                        {item.icon}
                        <span>{item.label}</span>
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
                    </button>
                  ))}

                <div className="px-2.5 pt-2 pb-1 sf-caption font-semibold text-black/45 dark:text-white/45">
                  Quick Actions
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerDynamicIslandAlert({
                      donorName: 'Alex',
                      donorHandle: '@alex',
                      amount: 50,
                      asset: 'USDC',
                      message: 'Keep crushing the stream!',
                      txHash: generateStellarTxHash(),
                      ledgerIndex: 54193550,
                    });
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-[10px] hover:bg-[#007AFF] hover:text-white flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Sparkles className="w-4 h-4 text-[#0A84FF]" />
                    <span>Fire 50 USDC Dynamic Island Stream Alert</span>
                  </span>
                  <Command className="w-3.5 h-3.5 opacity-60" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
