/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Plus,
  Trash2,
  Package,
  Layers,
  Search,
  Check,
  Copy,
  ArrowUpRight,
  Sparkles,
  QrCode,
  ShieldCheck,
  Clock,
  Coins,
  Send,
  AlertCircle,
  ExternalLink,
  Zap,
} from 'lucide-react';
import {
  Invoice,
  InvoiceItem,
  InventoryCategory,
  InventoryProduct,
  AssetType,
  MERCHANT_IDENTITY,
  generateMemo64Bit,
  generateMultiplexedAddress,
  generateStellarTxHash,
} from '../data/wigglePayData';
import { WigglePayApi } from '../services/api';
import { loadFormCache, saveFormCache, clearFormCache } from '../utils/formCache';

interface InvoiceCreationStudioProps {
  categories: InventoryCategory[];
  products: InventoryProduct[];
  onCreateInvoice: (newInvoice: Invoice) => void;
  onOpenInCheckoutWidget?: (invoice: Invoice) => void;
  onSimulateSettle?: (invoiceId: string) => void;
}

export const InvoiceCreationStudio: React.FC<InvoiceCreationStudioProps> = ({
  categories,
  products,
  onCreateInvoice,
  onOpenInCheckoutWidget,
  onSimulateSettle,
}) => {
  // Initialize from Form Cache (Preserves drafts across page reload)
  const cachedDraft = useMemo(() => {
    return loadFormCache('invoice_creation', {
      title: 'Custom Client Order',
      customerName: 'Alex Chen',
      customerHandle: '@alex',
      customerRef: '',
      selectedAsset: 'USDC' as AssetType,
      expiryHours: 24,
      notes: 'Deliverable via instant digital download or direct fulfillment.',
      selectedItems: [
        {
          id: `item-init-1`,
          productId: products[0]?.id || 'f2f53b8f-557f-4399-a1fd-eb7be06fbdf3',
          productSku: products[0]?.sku || 'DIG-MAC-01',
          title: products[0]?.title || 'macOS Iconography Pack 2026',
          quantity: 1,
          unitPrice: products[0]?.price || 45.0,
          totalPrice: products[0]?.price || 45.0,
        },
      ],
    });
  }, [products]);

  // Invoice Metadata Form State
  const [title, setTitle] = useState<string>(cachedDraft.title);
  const [customerName, setCustomerName] = useState<string>(cachedDraft.customerName);
  const [customerHandle, setCustomerHandle] = useState<string>(cachedDraft.customerHandle);
  const [customerRef, setCustomerRef] = useState<string>(cachedDraft.customerRef);
  const [selectedAsset, setSelectedAsset] = useState<AssetType>(cachedDraft.selectedAsset);
  const [expiryHours, setExpiryHours] = useState<number>(cachedDraft.expiryHours);
  const [notes, setNotes] = useState<string>(cachedDraft.notes);

  // Selected Line Items
  const [selectedItems, setSelectedItems] = useState<InvoiceItem[]>(
    cachedDraft.selectedItems && cachedDraft.selectedItems.length > 0
      ? cachedDraft.selectedItems
      : [
          {
            id: `item-${Date.now()}-1`,
            productId: products[0]?.id || 'f2f53b8f-557f-4399-a1fd-eb7be06fbdf3',
            productSku: products[0]?.sku || 'DIG-MAC-01',
            title: products[0]?.title || 'macOS Iconography Pack 2026',
            quantity: 1,
            unitPrice: products[0]?.price || 45.0,
            totalPrice: products[0]?.price || 45.0,
          },
        ]
  );

  // Automatically sync form state to local cache on changes
  useEffect(() => {
    saveFormCache('invoice_creation', {
      title,
      customerName,
      customerHandle,
      customerRef,
      selectedAsset,
      expiryHours,
      notes,
      selectedItems,
    });
  }, [title, customerName, customerHandle, customerRef, selectedAsset, expiryHours, notes, selectedItems]);

  const handleResetDraft = () => {
    clearFormCache('invoice_creation');
    setTitle('Custom Client Order');
    setCustomerName('Alex Chen');
    setCustomerHandle('@alex');
    setCustomerRef('');
    setSelectedAsset('USDC');
    setExpiryHours(24);
    setNotes('Deliverable via instant digital download or direct fulfillment.');
    setSelectedItems([]);
  };

  // Inventory Filter in Studio
  const [catalogShelfId, setCatalogShelfId] = useState<string>('all');
  const [catalogSearch, setCatalogSearch] = useState<string>('');

  // Custom Ad-hoc Item Form
  const [showCustomItemForm, setShowCustomItemForm] = useState<boolean>(false);
  const [customItemTitle, setCustomItemTitle] = useState<string>('');
  const [customItemPrice, setCustomItemPrice] = useState<number>(50);

  // Issued Invoice State (post-creation)
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);

  // Filter products for catalog picker
  const filteredCatalog = useMemo(() => {
    return products.filter((p) => {
      const matchShelf = catalogShelfId === 'all' || p.categoryId === catalogShelfId;
      const matchSearch =
        p.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(catalogSearch.toLowerCase());
      return matchShelf && matchSearch;
    });
  }, [products, catalogShelfId, catalogSearch]);

  // Calculate Subtotal & Totals
  const subtotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.totalPrice, 0);
  }, [selectedItems]);

  const stellarFeeEstimate = 0.00001; // ~0.00001 XLM / USDC
  const traditionalFee = subtotal * 0.029 + 0.3; // 2.9% + $0.30
  const savings = Math.max(0, traditionalFee - 0.01);

  // Add Item from Inventory Catalog
  const handleAddItemFromCatalog = (prod: InventoryProduct) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.productId === prod.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === prod.id
            ? {
                ...i,
                quantity: i.quantity + 1,
                totalPrice: (i.quantity + 1) * i.unitPrice,
              }
            : i
        );
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
          productId: prod.id,
          productSku: prod.sku,
          title: prod.title,
          quantity: 1,
          unitPrice: prod.price,
          totalPrice: prod.price,
        },
      ];
    });
  };

  // Add Custom Line Item
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemTitle.trim() || customItemPrice <= 0) return;

    setSelectedItems((prev) => [
      ...prev,
      {
        id: `item-custom-${Date.now()}`,
        title: customItemTitle.trim(),
        quantity: 1,
        unitPrice: customItemPrice,
        totalPrice: customItemPrice,
      },
    ]);
    setCustomItemTitle('');
    setCustomItemPrice(50);
    setShowCustomItemForm(false);
  };

  // Adjust Item Quantity
  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              totalPrice: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as InvoiceItem[]
    );
  };

  // Remove Item
  const handleRemoveItem = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Submit & Mint Invoice
  const handleMintInvoice = async () => {
    if (selectedItems.length === 0 || subtotal <= 0) return;

    setIsMinting(true);

    const memoId = generateMemo64Bit();
    const multiplexedAddress = generateMultiplexedAddress(memoId);
    const invoiceId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;

    const apiPayload = {
      title: title.trim() || 'Custom Order',
      description: notes.trim(),
      customer_ref: customerHandle.trim() || customerName.trim(),
      asset_code: selectedAsset,
      expected_amount: subtotal,
      expiry_hours: expiryHours,
      items: selectedItems.map((item) => ({
        product_id: item.productId,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
    };

    // Call backend API
    const apiResult = await WigglePayApi.createInvoice(apiPayload);

    const newInvoiceObj: Invoice = {
      id: apiResult?.id || invoiceId,
      customerHandle: customerHandle.startsWith('@') ? customerHandle : `@${customerHandle}`,
      customerName: customerName.trim() || 'Client',
      asset: selectedAsset,
      amount: subtotal,
      multiplexedAddress: apiResult?.multiplexed_address || multiplexedAddress,
      baseAddress: apiResult?.destination_address || MERCHANT_IDENTITY.baseStellarAccount,
      memoId: apiResult?.memo_value || memoId,
      description: title.trim() || 'Custom Order',
      paylinkSlug: `?invoiceId=${apiResult?.id || invoiceId}`,
      status: 'Active',
      createdAt: 'Just now',
      timestampMs: Date.now(),
      expiryHours,
      feeSavedUsd: parseFloat(savings.toFixed(2)),
      items: selectedItems,
    };

    onCreateInvoice(newInvoiceObj);
    setCreatedInvoice(newInvoiceObj);
    setIsMinting(false);
  };

  const copyPayableLink = () => {
    if (!createdInvoice) return;
    const link = `${window.location.origin}/?invoiceId=${createdInvoice.id}`;
    navigator.clipboard?.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyMultiplexed = () => {
    if (!createdInvoice) return;
    navigator.clipboard?.writeText(createdInvoice.multiplexedAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#34C759]" />
            <h1 className="sf-title-2 font-semibold text-black dark:text-white">
              Invoice Creation Studio
            </h1>
          </div>
          <p className="sf-subheadline text-black/55 dark:text-white/55 mt-1">
            Pick inventory items or add custom line items. Mint instant Stellar multiplexed invoices with real-time settlement tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/4 dark:bg-white/6 text-[11px] font-medium text-black/60 dark:text-white/60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
            <span>Draft Cached</span>
          </span>

          <button
            type="button"
            onClick={handleResetDraft}
            className="text-xs text-black/50 dark:text-white/50 hover:text-[#FF3B30] dark:hover:text-[#FF3B30] font-medium transition-colors cursor-pointer"
          >
            Reset Form
          </button>

          {createdInvoice && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#34C759]/15 text-[#34C759] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Invoice {createdInvoice.id} Minted</span>
            </span>
          )}
        </div>
      </div>

      {/* Main 2-Column Workstage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Builder Form & Inventory Catalog Picker */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section A: Customer & Meta Info */}
          <div className="apple-glass p-5 rounded-[20px] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/8 dark:border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#007AFF]" />
                <h3 className="sf-headline font-semibold text-black dark:text-white">
                  Invoice Details
                </h3>
              </div>
              <span className="text-xs text-black/45 dark:text-white/45">
                Stellar Layer-1 Compatible
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="sf-caption-1 font-semibold text-black/70 dark:text-white/70 block mb-1">
                  Invoice / Order Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Design Consulting & Icon Assets"
                  className="w-full px-3.5 py-2 rounded-[11px] bg-black/4 dark:bg-white/6 border border-black/8 dark:border-white/10 text-sm font-semibold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="sf-caption-1 font-semibold text-black/70 dark:text-white/70 block mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Alex Mercer"
                    className="w-full px-3.5 py-2 rounded-[11px] bg-black/4 dark:bg-white/6 border border-black/8 dark:border-white/10 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
                  />
                </div>
                <div>
                  <label className="sf-caption-1 font-semibold text-black/70 dark:text-white/70 block mb-1">
                    Client Handle / Tag
                  </label>
                  <input
                    type="text"
                    value={customerHandle}
                    onChange={(e) => setCustomerHandle(e.target.value)}
                    placeholder="e.g. @alex"
                    className="w-full px-3.5 py-2 rounded-[11px] bg-black/4 dark:bg-white/6 border border-black/8 dark:border-white/10 text-sm font-mono text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="sf-caption-1 font-semibold text-black/70 dark:text-white/70 block mb-1">
                    Settlement Asset
                  </label>
                  <select
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value as AssetType)}
                    className="w-full px-3.5 py-2 rounded-[11px] bg-black/4 dark:bg-white/6 border border-black/8 dark:border-white/10 text-sm font-semibold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
                  >
                    <option value="USDC">USDC (USD Coin · Soroban Escrow)</option>
                    <option value="XLM">XLM (Native Stellar Lumens)</option>
                    <option value="USDT">USDT (Tether USD)</option>
                  </select>
                </div>
                <div>
                  <label className="sf-caption-1 font-semibold text-black/70 dark:text-white/70 block mb-1">
                    Expiration Window
                  </label>
                  <select
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(parseInt(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-[11px] bg-black/4 dark:bg-white/6 border border-black/8 dark:border-white/10 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
                  >
                    <option value={1}>1 Hour (Flash Order)</option>
                    <option value={12}>12 Hours (Half Day)</option>
                    <option value={24}>24 Hours (Standard)</option>
                    <option value={72}>72 Hours (3 Days)</option>
                    <option value={168}>7 Days (Extended)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Pick from Inventory Shelves */}
          <div className="apple-glass p-5 rounded-[20px] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/8 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#007AFF]" />
                <h3 className="sf-headline font-semibold text-black dark:text-white">
                  Add Items from Inventory Shelves
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomItemForm(!showCustomItemForm)}
                className="text-xs text-[#007AFF] dark:text-[#0A84FF] font-semibold hover:underline cursor-pointer"
              >
                {showCustomItemForm ? 'Hide Custom Item' : '+ Custom Line Item'}
              </button>
            </div>

            {/* Custom Item Quick Form */}
            <AnimatePresence>
              {showCustomItemForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddCustomItem}
                  className="p-3.5 rounded-[14px] bg-black/4 dark:bg-white/6 border border-black/8 dark:border-white/10 space-y-3"
                >
                  <div className="text-xs font-semibold text-black/70 dark:text-white/70">
                    Add Ad-Hoc / Custom Service Item
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      required
                      placeholder="Item name (e.g. Express Expedited Delivery)"
                      value={customItemTitle}
                      onChange={(e) => setCustomItemTitle(e.target.value)}
                      className="sm:col-span-2 px-3 py-1.5 rounded-[9px] bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/15 text-xs text-black dark:text-white"
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        placeholder="Price"
                        value={customItemPrice}
                        onChange={(e) => setCustomItemPrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 rounded-[9px] bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/15 text-xs font-mono text-black dark:text-white"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-[9px] bg-[#007AFF] text-white text-xs font-semibold shrink-0 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Shelf Filter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                type="button"
                onClick={() => setCatalogShelfId('all')}
                className={`px-3 py-1 rounded-[8px] text-xs font-semibold transition-colors cursor-pointer ${
                  catalogShelfId === 'all'
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-black/5 dark:bg-white/8 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/12'
                }`}
              >
                All Shelves
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCatalogShelfId(c.id)}
                  className={`px-3 py-1 rounded-[8px] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    catalogShelfId === c.id
                      ? 'bg-[#007AFF] text-white'
                      : 'bg-black/5 dark:bg-white/8 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/12'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: catalogShelfId === c.id ? '#ffffff' : c.color }}
                  />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>

            {/* Search items in catalog */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-black/40 dark:text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter catalog by product title or SKU..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-[9px] bg-black/4 dark:bg-white/6 border border-black/8 dark:border-white/10 text-xs text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-none"
              />
            </div>

            {/* Catalog Item Picker Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {filteredCatalog.map((prod) => {
                const inInvoice = selectedItems.find((i) => i.productId === prod.id);
                const isOutOfStock = prod.stockQuantity <= 0;

                return (
                  <div
                    key={prod.id}
                    className={`p-3 rounded-[12px] border transition-all flex items-center justify-between gap-2.5 ${
                      inInvoice
                        ? 'bg-[#007AFF]/6 border-[#007AFF]/30 dark:bg-[#0A84FF]/10 dark:border-[#0A84FF]/30'
                        : 'bg-black/3 dark:bg-white/4 border-black/6 dark:border-white/8 hover:border-black/15 dark:hover:border-white/15'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: prod.categoryColor || '#007AFF' }}
                        />
                        <span className="text-[11px] font-semibold text-black dark:text-white truncate">
                          {prod.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-black/50 dark:text-white/50">
                        <span className="font-mono font-bold text-black/80 dark:text-white/80">
                          {prod.price.toFixed(2)} {prod.currency}
                        </span>
                        <span>·</span>
                        <span className={isOutOfStock ? 'text-[#FF3B30] font-semibold' : ''}>
                          {isOutOfStock ? 'Out of Stock' : `${prod.stockQuantity} in stock`}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddItemFromCatalog(prod)}
                      disabled={isOutOfStock}
                      className={`px-2.5 py-1.5 rounded-[8px] text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer ${
                        inInvoice
                          ? 'bg-[#007AFF] text-white shadow-2xs'
                          : 'bg-black/6 dark:bg-white/10 hover:bg-[#007AFF] hover:text-white text-black dark:text-white disabled:opacity-30'
                      }`}
                    >
                      {inInvoice ? (
                        <>
                          <span>+{inInvoice.quantity}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section C: Selected Line Items Summary */}
          <div className="apple-glass p-5 rounded-[20px] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/8 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#007AFF]" />
                <h3 className="sf-headline font-semibold text-black dark:text-white">
                  Invoice Line Items ({selectedItems.length})
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#007AFF] dark:text-[#0A84FF]">
                Subtotal: {subtotal.toFixed(2)} {selectedAsset}
              </span>
            </div>

            {selectedItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-black/45 dark:text-white/45">
                No items added yet. Click &quot;Add&quot; on any product shelf above.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-[12px] bg-black/3 dark:bg-white/4 border border-black/6 dark:border-white/8 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-black dark:text-white truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] font-mono text-black/50 dark:text-white/50">
                        {item.unitPrice.toFixed(2)} {selectedAsset} each
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Quantity Control */}
                      <div className="flex items-center gap-1 bg-black/5 dark:bg-white/8 p-0.5 rounded-[8px]">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="w-5 h-5 rounded-[5px] hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-xs font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-mono font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="w-5 h-5 rounded-[5px] hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-xs font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Total Line Price */}
                      <div className="w-20 text-right font-mono font-bold text-xs text-black dark:text-white">
                        {item.totalPrice.toFixed(2)} {selectedAsset}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-black/35 hover:text-[#FF3B30] dark:text-white/35 dark:hover:text-[#FF3B30] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Live macOS Receipt & Mint Action */}
        <div className="lg:col-span-5 space-y-5 sticky top-20">
          <div className="apple-glass rounded-[24px] p-6 shadow-xl border border-black/10 dark:border-white/15 relative overflow-hidden">
            {/* Top Badge */}
            <div className="flex items-center justify-between pb-4 border-b border-black/8 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[8px] bg-[#007AFF] flex items-center justify-center text-white">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                    <path d="M12 2L14.6 9.4L22 12L14.6 14.6L12 22L9.4 14.6L2 12L9.4 9.4L12 2Z" />
                  </svg>
                </div>
                <div>
                  <div className="sf-headline font-semibold text-black dark:text-white text-xs">
                    WigglePay Merchant Receipt
                  </div>
                  <div className="text-[10px] text-black/45 dark:text-white/45 font-mono">
                    Stellar Multiplexed (SEP-0023)
                  </div>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                  createdInvoice ? 'bg-[#34C759]/15 text-[#34C759]' : 'bg-[#FF9500]/15 text-[#FF9500]'
                }`}
              >
                {createdInvoice ? 'Minted · Active' : 'Draft / Ready'}
              </span>
            </div>

            {/* Receipt Body */}
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-base font-bold text-black dark:text-white">{title}</div>
                <div className="text-xs text-black/55 dark:text-white/55 mt-0.5">
                  Billed to: <span className="font-semibold">{customerName}</span> ({customerHandle})
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="py-3 border-y border-black/6 dark:border-white/8 space-y-2">
                {selectedItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span className="text-black/75 dark:text-white/75 truncate pr-2">
                      {item.quantity}x {item.title}
                    </span>
                    <span className="font-mono text-black dark:text-white font-medium shrink-0">
                      {item.totalPrice.toFixed(2)} {selectedAsset}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals & Fee Savings Calculation */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs text-black/60 dark:text-white/60">
                  <span>Subtotal</span>
                  <span className="font-mono">
                    {subtotal.toFixed(2)} {selectedAsset}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-black/60 dark:text-white/60">
                  <span className="flex items-center gap-1">
                    <span>Stellar Micro-Fee</span>
                    <span className="text-[10px] text-[#34C759] font-bold">~0.00001 XLM</span>
                  </span>
                  <span className="font-mono">$0.00</span>
                </div>

                <div className="flex items-center justify-between text-base font-bold text-black dark:text-white pt-2 border-t border-black/8 dark:border-white/10">
                  <span>Total Due</span>
                  <span className="font-mono text-[#007AFF] dark:text-[#0A84FF]">
                    {subtotal.toFixed(2)} {selectedAsset}
                  </span>
                </div>
              </div>

              {/* Traditional Processor Fee Savings Banner */}
              <div className="p-2.5 rounded-[12px] bg-[#34C759]/10 border border-[#34C759]/20 flex items-center justify-between text-xs text-[#34C759]">
                <div className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Processor Fee Saved</span>
                </div>
                <div className="font-mono font-bold">+${savings.toFixed(2)} USD</div>
              </div>

              {/* Mint & Issue Button */}
              {!createdInvoice ? (
                <button
                  type="button"
                  onClick={handleMintInvoice}
                  disabled={isMinting || selectedItems.length === 0 || subtotal <= 0}
                  className="apple-pressable w-full py-3 rounded-[13px] bg-[#007AFF] dark:bg-[#0A84FF] text-white sf-headline font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isMinting ? 'Minting on Stellar...' : 'Mint & Issue Payable Invoice'}</span>
                </button>
              ) : (
                <div className="space-y-2.5 pt-2">
                  <div className="p-3 rounded-[12px] bg-black/4 dark:bg-white/6 space-y-2">
                    <div className="text-[11px] font-semibold text-black/70 dark:text-white/70">
                      Multiplexed Address (SEP-0023):
                    </div>
                    <div className="text-[10px] font-mono break-all bg-white dark:bg-[#1C1C1E] p-2 rounded-[8px] border border-black/8 dark:border-white/10 text-black/80 dark:text-white/80">
                      {createdInvoice.multiplexedAddress}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-black/60 dark:text-white/60 pt-1">
                      <span>Memo ID (64-bit):</span>
                      <span className="font-mono font-semibold">{createdInvoice.memoId}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={copyPayableLink}
                      className="apple-pressable py-2 px-3 rounded-[10px] bg-black/5 dark:bg-white/10 text-xs font-semibold text-black dark:text-white flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied Link' : 'Copy Paylink'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={copyMultiplexed}
                      className="apple-pressable py-2 px-3 rounded-[10px] bg-black/5 dark:bg-white/10 text-xs font-semibold text-black dark:text-white flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedAddress ? <Check className="w-3.5 h-3.5 text-[#34C759]" /> : <QrCode className="w-3.5 h-3.5" />}
                      <span>{copiedAddress ? 'Copied M-Addr' : 'Copy M-Addr'}</span>
                    </button>
                  </div>

                  {/* Settlement Simulation & Checkout Sheet Shortcuts */}
                  {onSimulateSettle && (
                    <button
                      type="button"
                      onClick={() => onSimulateSettle(createdInvoice.id)}
                      className="apple-pressable w-full py-2.5 rounded-[11px] bg-[#34C759] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-white" />
                      <span>Simulate Instant Settlement (Sandbox)</span>
                    </button>
                  )}

                  {onOpenInCheckoutWidget && (
                    <button
                      type="button"
                      onClick={() => onOpenInCheckoutWidget(createdInvoice)}
                      className="apple-pressable w-full py-2 rounded-[10px] bg-black/5 dark:bg-white/8 hover:bg-black/10 text-black dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Open Customer Checkout Sheet</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setCreatedInvoice(null);
                      setTitle('Custom Client Order');
                    }}
                    className="w-full text-center text-xs text-black/45 dark:text-white/45 hover:underline pt-1 cursor-pointer"
                  >
                    + Create Another Invoice
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

