/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Check,
  AlertTriangle,
  XCircle,
  Code2,
  Radio,
  Sparkles,
  Shirt,
  Box,
  Layers,
  ChevronRight,
  TrendingUp,
  Tag,
  Hash,
  Coins,
  ArrowUpRight,
  RefreshCw,
  FolderPlus,
  SlidersHorizontal,
  FileText,
} from 'lucide-react';
import {
  InventoryCategory,
  InventoryProduct,
  AssetType,
} from '../data/wigglePayData';
import { WigglePayApi } from '../services/api';
import { loadFormCache, saveFormCache, clearFormCache } from '../utils/formCache';

interface InventoryManagerProps {
  categories: InventoryCategory[];
  products: InventoryProduct[];
  onAddCategory: (category: InventoryCategory) => void;
  onAddProduct: (product: InventoryProduct) => void;
  onUpdateProductStock: (productId: string, newStock: number) => void;
  onQuickInvoiceProduct?: (product: InventoryProduct) => void;
}

const SHELF_COLORS = [
  { name: 'System Blue', hex: '#007AFF' },
  { name: 'System Orange', hex: '#FF9500' },
  { name: 'System Purple', hex: '#AF52DE' },
  { name: 'System Green', hex: '#34C759' },
  { name: 'System Pink', hex: '#FF2D55' },
  { name: 'System Indigo', hex: '#5856D6' },
  { name: 'System Teal', hex: '#5AC8FA' },
];

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  categories,
  products,
  onAddCategory,
  onAddProduct,
  onUpdateProductStock,
  onQuickInvoiceProduct,
}) => {
  const [selectedShelfId, setSelectedShelfId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  // Modal States
  const [isAddShelfOpen, setIsAddShelfOpen] = useState<boolean>(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false);

  // Cached Shelf Draft
  const cachedShelf = useMemo(() => {
    return loadFormCache('inventory_shelf_draft', {
      name: '',
      desc: '',
      color: '#007AFF',
    });
  }, []);

  // New Shelf Form
  const [newShelfName, setNewShelfName] = useState<string>(cachedShelf.name);
  const [newShelfDesc, setNewShelfDesc] = useState<string>(cachedShelf.desc);
  const [newShelfColor, setNewShelfColor] = useState<string>(cachedShelf.color);
  const [isCreatingShelf, setIsCreatingShelf] = useState<boolean>(false);

  // Cached Product Draft
  const cachedProduct = useMemo(() => {
    return loadFormCache('inventory_product_draft', {
      category: categories[0]?.id || '',
      title: '',
      sku: '',
      price: 25,
      currency: 'USDC' as AssetType,
      stock: 50,
      trackStock: true,
      badge: '',
      desc: '',
    });
  }, [categories]);

  // New Product Form
  const [newProdCategory, setNewProdCategory] = useState<string>(cachedProduct.category || categories[0]?.id || '');
  const [newProdTitle, setNewProdTitle] = useState<string>(cachedProduct.title);
  const [newProdSku, setNewProdSku] = useState<string>(cachedProduct.sku);
  const [newProdPrice, setNewProdPrice] = useState<number>(cachedProduct.price);
  const [newProdCurrency, setNewProdCurrency] = useState<AssetType>(cachedProduct.currency);
  const [newProdStock, setNewProdStock] = useState<number>(cachedProduct.stock);
  const [newProdTrackStock, setNewProdTrackStock] = useState<boolean>(cachedProduct.trackStock);
  const [newProdBadge, setNewProdBadge] = useState<string>(cachedProduct.badge);
  const [newProdDesc, setNewProdDesc] = useState<string>(cachedProduct.desc);
  const [isCreatingProduct, setIsCreatingProduct] = useState<boolean>(false);

  // Save drafts on change
  useEffect(() => {
    saveFormCache('inventory_shelf_draft', {
      name: newShelfName,
      desc: newShelfDesc,
      color: newShelfColor,
    });
  }, [newShelfName, newShelfDesc, newShelfColor]);

  useEffect(() => {
    saveFormCache('inventory_product_draft', {
      category: newProdCategory,
      title: newProdTitle,
      sku: newProdSku,
      price: newProdPrice,
      currency: newProdCurrency,
      stock: newProdStock,
      trackStock: newProdTrackStock,
      badge: newProdBadge,
      desc: newProdDesc,
    });
  }, [newProdCategory, newProdTitle, newProdSku, newProdPrice, newProdCurrency, newProdStock, newProdTrackStock, newProdBadge, newProdDesc]);

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesShelf = selectedShelfId === 'all' || p.categoryId === selectedShelfId;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStock = true;
    if (stockFilter === 'in_stock') matchesStock = p.stockQuantity > 10;
    else if (stockFilter === 'low_stock') matchesStock = p.stockQuantity > 0 && p.stockQuantity <= 10;
    else if (stockFilter === 'out_of_stock') matchesStock = p.stockQuantity <= 0;

    return matchesShelf && matchesSearch && matchesStock;
  });

  // Calculate shelf stats
  const totalItemsCount = products.reduce((acc, p) => acc + p.stockQuantity, 0);
  const lowStockCount = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 10).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity <= 0).length;

  const handleCreateShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShelfName.trim()) return;

    setIsCreatingShelf(true);
    const slug = newShelfName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const localId = `cat-${Date.now()}`;

    // Try backend API sync
    const backendCat = await WigglePayApi.createCategory({
      name: newShelfName.trim(),
      color: newShelfColor,
      description: newShelfDesc.trim(),
      display_order: categories.length + 1,
    });

    const categoryObj: InventoryCategory = {
      id: backendCat?.id || localId,
      name: backendCat?.name || newShelfName.trim(),
      slug: backendCat?.slug || slug,
      icon: 'Package',
      color: backendCat?.color || newShelfColor,
      description: backendCat?.description || newShelfDesc.trim(),
      display_order: categories.length + 1,
      is_active: true,
      products_count: 0,
    };

    onAddCategory(categoryObj);
    clearFormCache('inventory_shelf_draft');
    setNewShelfName('');
    setNewShelfDesc('');
    setIsCreatingShelf(false);
    setIsAddShelfOpen(false);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdTitle.trim() || !newProdCategory) return;

    setIsCreatingProduct(true);
    const localId = `prod-${Date.now()}`;
    const targetCat = categories.find((c) => c.id === newProdCategory);

    // Try backend API sync
    const backendProd = await WigglePayApi.createProduct({
      category: newProdCategory,
      title: newProdTitle.trim(),
      sku: newProdSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      price: newProdPrice,
      currency: newProdCurrency,
      stock_quantity: newProdStock,
      track_stock: newProdTrackStock,
      badge: newProdBadge.trim(),
      description: newProdDesc.trim(),
    });

    const productObj: InventoryProduct = {
      id: backendProd?.id || localId,
      categoryId: newProdCategory,
      categoryName: targetCat?.name || 'General Shelf',
      categoryColor: targetCat?.color || '#007AFF',
      title: backendProd?.title || newProdTitle.trim(),
      sku: backendProd?.sku || newProdSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      description: backendProd?.description || newProdDesc.trim(),
      price: newProdPrice,
      currency: newProdCurrency,
      stockQuantity: newProdStock,
      trackStock: newProdTrackStock,
      isInStock: newProdStock > 0,
      badge: newProdBadge.trim() || undefined,
      isActive: true,
      createdAt: 'Just now',
    };

    onAddProduct(productObj);
    clearFormCache('inventory_product_draft');
    setNewProdTitle('');
    setNewProdSku('');
    setNewProdDesc('');
    setNewProdBadge('');
    setIsCreatingProduct(false);
    setIsAddProductOpen(false);
  };

  const handleStockAdjust = async (productId: string, delta: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const newStock = Math.max(0, prod.stockQuantity + delta);
    onUpdateProductStock(productId, newStock);

    // Sync to backend if UUID
    if (productId.includes('-') && productId.length > 20) {
      await WigglePayApi.adjustProductStock(productId, delta);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Metric Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#007AFF]" />
            <h1 className="sf-title-2 font-semibold text-black dark:text-white">
              Inventory & Shelves
            </h1>
          </div>
          <p className="sf-subheadline text-black/55 dark:text-white/55 mt-1">
            Organize digital goods, gear & services into shelves. Pick items directly when issuing payable invoices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddShelfOpen(true)}
            className="apple-pressable px-3.5 py-2 rounded-[11px] bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-black dark:text-white sf-footnote font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-[#007AFF] dark:text-[#0A84FF]" />
            <span>New Shelf</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (categories.length > 0 && !newProdCategory) {
                setNewProdCategory(categories[0].id);
              }
              setIsAddProductOpen(true);
            }}
            className="apple-pressable px-4 py-2 rounded-[11px] bg-[#007AFF] dark:bg-[#0A84FF] text-white sf-footnote font-semibold flex items-center gap-1.5 shadow-2xs hover:opacity-95 transition-opacity cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="apple-glass p-3.5 rounded-[14px]">
          <div className="sf-caption-2 text-black/45 dark:text-white/45 uppercase tracking-wider font-semibold">
            Shelves (Categories)
          </div>
          <div className="text-xl font-bold text-black dark:text-white mt-1">
            {categories.length}
          </div>
          <div className="text-[11px] text-black/50 dark:text-white/50 mt-0.5">
            Catalog partitions
          </div>
        </div>

        <div className="apple-glass p-3.5 rounded-[14px]">
          <div className="sf-caption-2 text-black/45 dark:text-white/45 uppercase tracking-wider font-semibold">
            Active Products
          </div>
          <div className="text-xl font-bold text-black dark:text-white mt-1">
            {products.length}
          </div>
          <div className="text-[11px] text-[#007AFF] dark:text-[#0A84FF] mt-0.5">
            {totalItemsCount} units in stock
          </div>
        </div>

        <div className="apple-glass p-3.5 rounded-[14px]">
          <div className="sf-caption-2 text-black/45 dark:text-white/45 uppercase tracking-wider font-semibold">
            Low Stock Alerts
          </div>
          <div className="text-xl font-bold text-[#FF9500] mt-1">
            {lowStockCount}
          </div>
          <div className="text-[11px] text-black/50 dark:text-white/50 mt-0.5">
            ≤ 10 units remaining
          </div>
        </div>

        <div className="apple-glass p-3.5 rounded-[14px]">
          <div className="sf-caption-2 text-black/45 dark:text-white/45 uppercase tracking-wider font-semibold">
            Out of Stock
          </div>
          <div className="text-xl font-bold text-[#FF3B30] mt-1">
            {outOfStockCount}
          </div>
          <div className="text-[11px] text-black/50 dark:text-white/50 mt-0.5">
            Needs replenishment
          </div>
        </div>
      </div>

      {/* Shelf (Category) Selector Strip */}
      <div className="apple-glass p-2.5 rounded-[16px] overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          <button
            type="button"
            onClick={() => setSelectedShelfId('all')}
            className={`px-3.5 py-1.5 rounded-[10px] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              selectedShelfId === 'all'
                ? 'bg-[#007AFF] text-white shadow-2xs'
                : 'bg-black/4 dark:bg-white/6 text-black/70 dark:text-white/70 hover:bg-black/8 dark:hover:bg-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Shelves</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                selectedShelfId === 'all'
                  ? 'bg-white/25 text-white'
                  : 'bg-black/10 dark:bg-white/15 text-black/60 dark:text-white/60'
              }`}
            >
              {products.length}
            </span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedShelfId === cat.id;
            const count = products.filter((p) => p.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedShelfId(cat.id)}
                className={`px-3.5 py-1.5 rounded-[10px] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'text-white shadow-2xs'
                    : 'bg-black/4 dark:bg-white/6 text-black/70 dark:text-white/70 hover:bg-black/8 dark:hover:bg-white/10'
                }`}
                style={isSelected ? { backgroundColor: cat.color || '#007AFF' } : undefined}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: isSelected ? '#ffffff' : cat.color || '#007AFF' }}
                />
                <span>{cat.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected
                      ? 'bg-white/25 text-white'
                      : 'bg-black/10 dark:bg-white/15 text-black/60 dark:text-white/60'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-black/40 dark:text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, SKU, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-[11px] bg-black/4 dark:bg-white/6 border border-black/8 dark:border-white/10 sf-subheadline text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
          />
        </div>

        {/* Stock Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-black/4 dark:bg-white/6 rounded-[11px] self-start sm:self-auto">
          {(
            [
              { id: 'all', label: 'All Stock' },
              { id: 'in_stock', label: 'In Stock' },
              { id: 'low_stock', label: 'Low Stock' },
              { id: 'out_of_stock', label: 'Depleted' },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStockFilter(filter.id)}
              className={`px-2.5 py-1 rounded-[8px] text-[11px] font-semibold transition-all cursor-pointer ${
                stockFilter === filter.id
                  ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-2xs'
                  : 'text-black/55 dark:text-white/55 hover:text-black dark:hover:text-white'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="apple-glass p-12 rounded-[20px] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center mx-auto text-black/40 dark:text-white/40">
            <Package className="w-6 h-6" />
          </div>
          <div className="sf-headline text-black dark:text-white">No products found</div>
          <p className="sf-subheadline text-black/50 dark:text-white/50 max-w-sm mx-auto">
            {searchQuery
              ? `No items match "${searchQuery}". Try clearing search or switching shelves.`
              : 'Add your first product to this shelf to start building payable invoices.'}
          </p>
          <button
            type="button"
            onClick={() => setIsAddProductOpen(true)}
            className="apple-pressable px-4 py-2 rounded-[10px] bg-[#007AFF] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Product</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((prod) => {
            const isOutOfStock = prod.stockQuantity <= 0;
            const isLowStock = prod.stockQuantity > 0 && prod.stockQuantity <= 10;

            return (
              <motion.div
                key={prod.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="apple-glass rounded-[18px] p-4 flex flex-col justify-between hover:shadow-md transition-shadow group relative overflow-hidden"
              >
                {/* Top: Shelf Pill & Badges */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: prod.categoryColor || '#007AFF' }}
                      />
                      <span className="text-[11px] font-semibold text-black/60 dark:text-white/60">
                        {prod.categoryName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {prod.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#007AFF]/10 text-[#007AFF] dark:bg-[#0A84FF]/20 dark:text-[#0A84FF]">
                          {prod.badge}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-black/40 dark:text-white/40">
                        {prod.sku}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="sf-headline font-semibold text-black dark:text-white line-clamp-1">
                    {prod.title}
                  </h3>
                  <p className="text-xs text-black/55 dark:text-white/55 line-clamp-2 mt-1 leading-relaxed">
                    {prod.description}
                  </p>
                </div>

                {/* Bottom: Price, Stock & Quick Actions */}
                <div className="mt-4 pt-3 border-t border-black/6 dark:border-white/8 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-black/40 dark:text-white/40 font-mono uppercase">
                        Unit Price
                      </div>
                      <div className="text-lg font-bold text-black dark:text-white font-mono">
                        {prod.price.toFixed(2)}{' '}
                        <span className="text-xs font-normal text-black/60 dark:text-white/60">
                          {prod.currency}
                        </span>
                      </div>
                    </div>

                    {/* Stock status indicator */}
                    <div className="text-right">
                      <div className="text-[10px] text-black/40 dark:text-white/40 font-mono uppercase">
                        Stock Count
                      </div>
                      <div className="flex items-center justify-end gap-1.5 mt-0.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            isOutOfStock
                              ? 'bg-[#FF3B30]/12 text-[#FF3B30]'
                              : isLowStock
                              ? 'bg-[#FF9500]/12 text-[#FF9500]'
                              : 'bg-[#34C759]/12 text-[#34C759]'
                          }`}
                        >
                          {isOutOfStock ? (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Depleted</span>
                            </>
                          ) : isLowStock ? (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              <span>{prod.stockQuantity} left</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3" />
                              <span>{prod.stockQuantity} in stock</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {/* Stock Quick +/- */}
                    <div className="flex items-center gap-1 bg-black/4 dark:bg-white/8 p-1 rounded-[9px]">
                      <button
                        type="button"
                        onClick={() => handleStockAdjust(prod.id, -1)}
                        disabled={prod.stockQuantity <= 0}
                        title="Decrement stock by 1"
                        className="w-6 h-6 rounded-[6px] hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-xs font-bold disabled:opacity-30 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-1 text-xs font-mono font-semibold text-black dark:text-white min-w-[20px] text-center">
                        {prod.stockQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStockAdjust(prod.id, 1)}
                        title="Increment stock by 1"
                        className="w-6 h-6 rounded-[6px] hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-xs font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Quick Invoice Button */}
                    {onQuickInvoiceProduct && (
                      <button
                        type="button"
                        onClick={() => onQuickInvoiceProduct(prod)}
                        className="apple-pressable px-3 py-1.5 rounded-[9px] bg-black/5 dark:bg-white/10 hover:bg-[#007AFF] hover:text-white dark:hover:bg-[#0A84FF] text-black dark:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Create Invoice</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal: New Shelf */}
      <AnimatePresence>
        {isAddShelfOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="apple-glass bg-white/95 dark:bg-[#1C1C1E]/95 border border-black/10 dark:border-white/15 rounded-[22px] max-w-md w-full p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-black/8 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-[#007AFF]" />
                  <h3 className="sf-headline font-semibold text-black dark:text-white">
                    Create New Inventory Shelf
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddShelfOpen(false)}
                  className="w-7 h-7 rounded-full bg-black/6 dark:bg-white/10 flex items-center justify-center text-xs text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateShelf} className="mt-4 space-y-4">
                <div>
                  <label className="sf-caption-1 font-semibold text-black/70 dark:text-white/70 block mb-1">
                    Shelf / Category Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Digital Subscriptions, Studio Merch..."
                    value={newShelfName}
                    onChange={(e) => setNewShelfName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-[10px] bg-black/4 dark:bg-white/6 border border-black/10 dark:border-white/15 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
                  />
                </div>

                <div>
                  <label className="sf-caption-1 font-semibold text-black/70 dark:text-white/70 block mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Short description of items in this category"
                    value={newShelfDesc}
                    onChange={(e) => setNewShelfDesc(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-[10px] bg-black/4 dark:bg-white/6 border border-black/10 dark:border-white/15 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
                  />
                </div>

                <div>
                  <label className="sf-caption-1 font-semibold text-black/70 dark:text-white/70 block mb-2">
                    Shelf Accent Color
                  </label>
                  <div className="flex items-center gap-2.5">
                    {SHELF_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setNewShelfColor(c.hex)}
                        className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                          newShelfColor === c.hex ? 'scale-125 ring-2 ring-offset-2 ring-black dark:ring-white' : ''
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/8 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddShelfOpen(false)}
                    className="px-4 py-2 rounded-[10px] bg-black/5 dark:bg-white/10 text-xs font-semibold text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/15 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingShelf || !newShelfName.trim()}
                    className="apple-pressable px-4 py-2 rounded-[10px] bg-[#007AFF] text-xs font-semibold text-white shadow-2xs disabled:opacity-40 cursor-pointer"
                  >
                    {isCreatingShelf ? 'Creating...' : 'Create Shelf'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Add Product */}
      <AnimatePresence>
        {isAddProductOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="apple-glass bg-white/95 dark:bg-[#1C1C1E]/95 border border-black/10 dark:border-white/15 rounded-[22px] max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-black/8 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#007AFF]" />
                  <h3 className="sf-headline font-semibold text-black dark:text-white">
                    Add Product to Shelf
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="w-7 h-7 rounded-full bg-black/6 dark:bg-white/10 flex items-center justify-center text-xs text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="mt-4 space-y-4">
                {/* Category Shelf Selection */}
                <div>
                  <label className="sf-caption-1 font-semibold text-black/70 dark:text-white/70 block mb-1">
                    Select Shelf (Category)
                  </label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-[10px] bg-black/4 dark:bg-white/6 border border-black/10 dark:border-white/15 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="sf-caption-1 font-semibold text-black/70 dark:text-white/70 block mb-1">
                    Product Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sonoma SF Pro Vector Pack"
                    value={newProdTitle}
                    onChange={(e) => setNewProdTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-[10px] bg-black/4 dark:bg-white/6 border border-black/10 dark:border-white/15 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
                  />
                </div>

                {/* SKU & Badge */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="sf-caption-1 font-semibold text-black/70 dark:text-white/70 block mb-1">
                      SKU (Stock Identifier)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DIG-SONOMA-01"
                      value={newProdSku}
                      onChange={(e) => setNewProdSku(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-[10px] bg-black/4 dark:bg-white/6 border border-black/10 dark:border-white/15 text-sm text-black dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
                    />
                  </div>
                  <div>
                    <label className="sf-caption-1 font-semibold text-black/70 dark:text-white/70 block mb-1">
                      Badge Tag (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Popular, New, Sale"
                      value={newProdBadge}
                      onChange={(e) => setNewProdBadge(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-[10px] bg-black/4 dark:bg-white/6 border border-black/10 dark:border-white/15 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
                    />
                  </div>
                </div>

                {/* Price & Currency */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="sf-caption-1 font-semibold text-black/70 dark:text-white/70 block mb-1">
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 rounded-[10px] bg-black/4 dark:bg-white/6 border border-black/10 dark:border-white/15 text-sm font-mono text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
                    />
                  </div>
                  <div>
                    <label className="sf-caption-1 font-semibold text-black/70 dark:text-white/70 block mb-1">
                      Settlement Currency
                    </label>
                    <select
                      value={newProdCurrency}
                      onChange={(e) => setNewProdCurrency(e.target.value as AssetType)}
                      className="w-full px-3.5 py-2 rounded-[10px] bg-black/4 dark:bg-white/6 border border-black/10 dark:border-white/15 text-sm text-black dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
                    >
                      <option value="USDC">USDC (USD Coin)</option>
                      <option value="XLM">XLM (Stellar Lumens)</option>
                      <option value="USDT">USDT (Tether)</option>
                    </select>
                  </div>
                </div>

                {/* Stock Quantity */}
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="sf-caption-1 font-semibold text-black/70 dark:text-white/70 block mb-1">
                      Initial Stock Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={newProdStock}
                      onChange={(e) => setNewProdStock(parseInt(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 rounded-[10px] bg-black/4 dark:bg-white/6 border border-black/10 dark:border-white/15 text-sm font-mono text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
                    />
                  </div>
                  <div className="pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newProdTrackStock}
                        onChange={(e) => setNewProdTrackStock(e.target.checked)}
                        className="rounded text-[#007AFF] focus:ring-[#007AFF]"
                      />
                      <span className="text-xs font-semibold text-black/75 dark:text-white/75">
                        Track stock upon settlement
                      </span>
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="sf-caption-1 font-semibold text-black/70 dark:text-white/70 block mb-1">
                    Description & Specs
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Details about product deliverables, formats, or physical dimensions..."
                    value={newProdDesc}
                    onChange={(e) => setNewProdDesc(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-[10px] bg-black/4 dark:bg-white/6 border border-black/10 dark:border-white/15 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/8 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(false)}
                    className="px-4 py-2 rounded-[10px] bg-black/5 dark:bg-white/10 text-xs font-semibold text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/15 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingProduct || !newProdTitle.trim()}
                    className="apple-pressable px-4 py-2 rounded-[10px] bg-[#007AFF] text-xs font-semibold text-white shadow-2xs disabled:opacity-40 cursor-pointer"
                  >
                    {isCreatingProduct ? 'Saving...' : 'Add Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

