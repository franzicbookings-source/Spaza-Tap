import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product } from '../../types';
import { Plus, Search, Tag, X, AlertTriangle, Package, Layers, Activity, ChevronRight, Bookmark, CheckSquare, Check } from 'lucide-react';

interface StockScreenProps {
  shopId: string;
  ownerUserId: string;
}

export default function StockScreen({ shopId, ownerUserId }: StockScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditType, setBulkEditType] = useState<'sellingPrice' | 'stockQuantity' | null>(null);
  const [bulkEditValue, setBulkEditValue] = useState("");
  
  const [form, setForm] = useState({
    name: "",
    category: "Other",
    buyingPrice: "",
    sellingPrice: "",
    stockQuantity: "",
    lowStockLevel: "5",
    sku: ""
  });

  useEffect(() => {
    if (!shopId || !ownerUserId) return;
    const q = query(collection(db, "products"), where("shopId", "==", shopId), where("ownerUserId", "==", ownerUserId));
    const unsub = onSnapshot(q, (snap) => {
      const p: Product[] = [];
      snap.forEach(d => p.push({ id: d.id, ...d.data() } as Product));
      setProducts(p);
    });
    return () => unsub();
  }, [shopId, ownerUserId]);

  const filteredProducts = products.filter(p => (p.name || "").toLowerCase().includes(search.toLowerCase()) || (p.category || "").toLowerCase().includes(search.toLowerCase()));
  const lowStockCount = products.filter(p => (p.stockQuantity || 0) <= (p.lowStockLevel || 0)).length;
  const activeCount = products.filter(p => p.isActive).length;

  const toggleSelection = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkEditType || !bulkEditValue || selectedProductIds.length === 0) return;
    
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      selectedProductIds.forEach(id => {
        const prodRef = doc(db, "products", id);
        batch.update(prodRef, {
          [bulkEditType]: bulkEditType === 'sellingPrice' ? parseFloat(bulkEditValue) : parseInt(bulkEditValue, 10),
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
      
      setShowBulkEditModal(false);
      setIsBulkEditMode(false);
      setSelectedProductIds([]);
      setBulkEditValue("");
      setBulkEditType(null);
    } catch (err) {
      console.error(err);
      alert("Failed to perform bulk update");
    }
    setIsSaving(false);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.buyingPrice || !form.sellingPrice || !form.stockQuantity) return;
    
    setIsSaving(true);
    try {
      const productId = `prod_${Date.now()}`;
      const prodRef = doc(db, "products", productId);
      
      await setDoc(prodRef, {
        id: productId,
        shopId,
        ownerUserId,
        name: form.name.trim(),
        category: form.category,
        buyingPrice: parseFloat(form.buyingPrice),
        sellingPrice: parseFloat(form.sellingPrice),
        stockQuantity: parseInt(form.stockQuantity, 10),
        lowStockLevel: parseInt(form.lowStockLevel, 10) || 0,
        sku: form.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setShowAdd(false);
      setForm({ name: "", category: "Other", buyingPrice: "", sellingPrice: "", stockQuantity: "", lowStockLevel: "5", sku: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to add product");
    }
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#FBF5EC] font-sans pb-32 relative text-text-main">
      
      {/* Redesigned Header */}
      <header className="px-5 pt-5 pb-4 bg-white border-b border-[#2B1114]/8 shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black font-display uppercase tracking-tight leading-none text-text-main">Stock</h1>
          <p className="text-[10px] font-bold text-text-light uppercase tracking-wider mt-1.5 leading-none">Track your inventory and stock levels.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setIsBulkEditMode(!isBulkEditMode);
              if (isBulkEditMode) setSelectedProductIds([]);
            }}
            className={`p-3 rounded-full transition-transform active:scale-95 ${isBulkEditMode ? 'bg-[#2B1114] text-white shadow-2xs' : 'bg-[#FBF5EC] text-text-main hover:bg-[#EBE2D4]'}`}
            title="Bulk Edit Mode"
          >
            <CheckSquare className="w-5 h-5 stroke-[2]" />
          </button>
          <button 
            onClick={() => setShowAdd(true)}
            className="bg-[#D94F12] text-white p-3 rounded-full shadow-[0_4px_12px_rgba(217,79,18,0.2)] hover:bg-[#C9460B] active:scale-95 transition-transform"
            title="Add New Stock"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </header>

      <div className="p-5 space-y-4">
        
        {/* Summary horizontal columns cards exact matches */}
        <section className="grid grid-cols-3 gap-2.5">
          
          <div className="h-[112px] rounded-[22px] p-4 bg-white border border-[#2B1114]/8 flex flex-col justify-between shadow-2xs">
            <span className="text-[9px] text-text-muted font-black uppercase tracking-wider block leading-tight">Total Items</span>
            <div className="mb-0.5">
              <span className="text-2xl font-black text-text-main font-display block leading-none">{products.length}</span>
              <span className="text-[8px] text-text-light uppercase font-bold tracking-wider mt-1 block">Cataloged</span>
            </div>
          </div>

          <div className="h-[112px] rounded-[22px] p-4 bg-white border border-[#2B1114]/8 flex flex-col justify-between shadow-2xs">
            <span className="text-[9px] text-text-muted font-black uppercase tracking-wider block leading-tight">Low Stock</span>
            <div className="mb-0.5">
              <span className={`text-2xl font-black font-display block leading-none ${lowStockCount > 0 ? "text-danger" : "text-emerald-600"}`}>
                {lowStockCount}
              </span>
              <span className="text-[8px] text-text-light uppercase font-bold tracking-wider mt-1 block">Restock Due</span>
            </div>
          </div>

          <div className="h-[112px] rounded-[22px] p-4 bg-white border border-[#2B1114]/8 flex flex-col justify-between shadow-2xs">
            <span className="text-[9px] text-text-muted font-black uppercase tracking-wider block leading-tight">Active Items</span>
            <div className="mb-0.5">
              <span className="text-2xl font-black text-emerald-600 font-display block leading-none">{activeCount}</span>
              <span className="text-[8px] text-text-light uppercase font-bold tracking-wider mt-1 block">Online</span>
            </div>
          </div>

        </section>

        {/* Search tool row */}
        <div className="relative bg-white rounded-[18px] border border-text-main/10 h-14 flex items-center px-4.5 shadow-2xs">
          <Search className="text-text-muted w-5 h-5 shrink-0 select-none mr-2.5" />
          <input 
            type="text" 
            placeholder="Search stock, catalog, or categories..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent text-text-main text-sm font-semibold outline-none placeholder:text-text-muted"
          />
        </div>

        {/* Low-stock Warning Bar matching bottom constraint if low stock items exist */}
        {lowStockCount > 0 && (
          <div className="flex items-center gap-2.5 p-3.5 bg-[#FFEFE2] border border-[#ffdbbc] rounded-2xl">
            <AlertTriangle className="w-4 h-4 text-[#D94F12] shrink-0" />
            <p className="text-[11px] font-bold text-[#A63F10]">
              Warning: {lowStockCount} items have reached low stock threshold level. Restock soon!
            </p>
          </div>
        )}

        {/* Product listing cards */}
        <div className="space-y-3 pb-8">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-text-main/5">
              <Package className="mx-auto w-10 h-10 mb-2.5 text-text-muted" />
              <p className="text-xs font-bold text-text-light">No matching product records.</p>
            </div>
          ) : (
            filteredProducts.map(p => {
              const profitMargin = p.sellingPrice - p.buyingPrice;
              const markupPercent = p.buyingPrice > 0 ? ((profitMargin / p.buyingPrice) * 100).toFixed(0) : "0";
              const isLow = p.stockQuantity <= p.lowStockLevel;
              const isOut = p.stockQuantity <= 0;
              
              return (
                <div 
                  key={p.id} 
                  onClick={() => {
                    if (isBulkEditMode) toggleSelection(p.id);
                  }}
                  className={`bg-white p-5 rounded-[24px] border shadow-2xs space-y-4 transition-all ${
                    isBulkEditMode ? 'cursor-pointer select-none active:scale-[0.98]' : ''
                  } ${
                    selectedProductIds.includes(p.id) ? 'border-[#D94F12] ring-2 ring-[#D94F12]/20' : 'border-text-main/10'
                  }`}
                >
                  
                  {/* Top row elements */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-row items-start gap-3">
                      {isBulkEditMode && (
                        <div className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center mt-0.5 transition-colors ${selectedProductIds.includes(p.id) ? 'bg-[#D94F12] border-[#D94F12]' : 'border-text-main/20 bg-[#FBF5EC]'}`}>
                          {selectedProductIds.includes(p.id) && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-extrabold text-sm uppercase text-text-main tracking-tight font-sans block">{p.name}</span>
                          <span className="text-[8px] font-extrabold px-2 py-0.5 rounded-full border bg-[#FBF5EC] text-text-light uppercase tracking-wider">{p.category}</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-[10px] text-text-light leading-none">
                          <Bookmark className="w-3.5 h-3.5 text-text-muted" />
                          <span>Ref ID: <span className="font-mono font-bold tracking-wider">{p.sku || p.barcode || "No Code"}</span></span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-display font-black text-base text-[#D94F12] block leading-none">R {p.sellingPrice.toFixed(2)}</span>
                      <span className="text-[9px] text-text-light font-bold block mt-1">Cost: R{p.buyingPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Quantity metrics ledger footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-text-main/5 text-[11px] font-semibold text-text-light">
                    <div>
                      <span className="text-[9px] text-text-muted uppercase tracking-wider block mb-0.5">Stock Level</span>
                      <span className={`font-extrabold text-xs uppercase ${isOut ? "text-danger" : isLow ? "text-warning" : "text-emerald-600"}`}>
                        {isOut ? "Out of Stock" : `${p.stockQuantity} in stock`}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-text-muted uppercase tracking-wider block mb-0.5">Est Markup</span>
                      <span className="font-extrabold text-[#2B1114] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {markupPercent}% Markup
                      </span>
                    </div>
                  </div>

                </div>
              )
            })
          )}
        </div>

      </div>

      {/* Slide-Up Bottom Drawer modal exact matches */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-xs">
          <div className="bg-[#FBF5EC] w-full rounded-t-[28px] p-6 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto border-t border-[#2B1114]/15">
            <div className="flex justify-between items-center mb-5 shrink-0">
              <h2 className="text-base font-black font-display text-text-main uppercase tracking-tight">Add New Product</h2>
              <button 
                onClick={() => setShowAdd(false)} 
                className="p-1.5 bg-white/60 rounded-full active:scale-95 text-text-main"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="space-y-4">
              
              <div>
                <label className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider block mb-1">Product Name</label>
                <input 
                  type="text" required
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full h-12 bg-white border border-text-main/10 rounded-xl px-4 text-xs font-bold outline-none" 
                  placeholder="e.g. Albany White Bread"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider block mb-1">Category</label>
                <select 
                  value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full h-12 bg-white border border-text-main/10 rounded-xl px-4 text-xs font-bold outline-none"
                >
                  <option>Bread</option>
                  <option>Dairy</option>
                  <option>Cooldrinks</option>
                  <option>Snacks</option>
                  <option>Maize meal</option>
                  <option>Airtime</option>
                  <option>Electricity</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider block mb-1">Buying Cost (R)</label>
                  <input 
                    type="number" step="0.01" required
                    value={form.buyingPrice} onChange={e => setForm({...form, buyingPrice: e.target.value})}
                    className="w-full h-12 bg-white border border-text-main/10 rounded-xl px-4 text-xs font-bold outline-none font-mono" 
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider block mb-1">Selling Price (R)</label>
                  <input 
                    type="number" step="0.01" required
                    value={form.sellingPrice} onChange={e => setForm({...form, sellingPrice: e.target.value})}
                    className="w-full h-12 bg-white border border-text-main/10 rounded-xl px-4 text-xs font-bold outline-none font-mono" 
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider block mb-1">Current Quantity</label>
                  <input 
                    type="number" required
                    value={form.stockQuantity} onChange={e => setForm({...form, stockQuantity: e.target.value})}
                    className="w-full h-12 bg-white border border-text-main/10 rounded-xl px-4 text-xs font-bold outline-none font-mono" 
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider block mb-1">Low Alert Limit</label>
                  <input 
                    type="number" required
                    value={form.lowStockLevel} onChange={e => setForm({...form, lowStockLevel: e.target.value})}
                    className="w-full h-12 bg-white border border-text-main/10 rounded-xl px-4 text-xs font-bold outline-none font-mono" 
                    placeholder="5"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider block mb-1">Reference Code / SKU (Optional)</label>
                <input 
                  type="text"
                  value={form.sku} onChange={e => setForm({...form, sku: e.target.value})}
                  className="w-full h-12 bg-white border border-text-main/10 rounded-xl px-4 text-xs font-bold outline-none font-mono" 
                  placeholder="e.g. BR-103"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full h-14 bg-burgundy hover:bg-[#2B1114] text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-xs mt-4 disabled:opacity-50"
              >
                {isSaving ? "Saving details..." : "Save Product Into Stock"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {isBulkEditMode && selectedProductIds.length > 0 && (
        <div className="fixed bottom-[88px] md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[400px] bg-[#2B1114] text-white p-4 rounded-[24px] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 animate-slide-up z-20 border border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#D94F12] text-white flex items-center justify-center font-black text-sm">
              {selectedProductIds.length}
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Items Selected</span>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => { setBulkEditType('sellingPrice'); setBulkEditValue(""); setShowBulkEditModal(true); }}
              className="flex-1 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-[12px] text-white text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all"
            >
              Update Price
            </button>
            <button 
              onClick={() => { setBulkEditType('stockQuantity'); setBulkEditValue(""); setShowBulkEditModal(true); }}
              className="flex-1 bg-white hover:bg-gray-100 px-4 py-2.5 rounded-[12px] text-[#2B1114] text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all"
            >
              Update Stock
            </button>
          </div>
        </div>
      )}

      {/* Bulk Update Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-xs">
          <div className="bg-[#FBF5EC] w-full rounded-t-[28px] p-6 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto border-t border-[#2B1114]/15">
            <div className="flex justify-between items-center mb-5 shrink-0">
              <h2 className="text-base font-black font-display text-text-main uppercase tracking-tight">
                Bulk Update: {bulkEditType === 'sellingPrice' ? 'Selling Price' : 'Stock Quantity'}
              </h2>
              <button 
                onClick={() => setShowBulkEditModal(false)} 
                className="p-1.5 bg-white/60 rounded-full active:scale-95 text-text-main"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleBulkUpdate} className="space-y-4">
              <div className="p-4 bg-white rounded-[16px] border border-text-main/10 shadow-2xs flex items-center justify-between mb-4">
                 <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">Items Being Updated</span>
                 <span className="font-display font-black text-base text-[#D94F12]">{selectedProductIds.length}</span>
              </div>

              <div>
                <label className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider block mb-1">
                  New {bulkEditType === 'sellingPrice' ? 'Selling Price (R)' : 'Stock Quantity'}
                </label>
                <input 
                  type="number" step={bulkEditType === 'sellingPrice' ? "0.01" : "1"} required
                  value={bulkEditValue} onChange={e => setBulkEditValue(e.target.value)}
                  className="w-full h-14 bg-white border border-text-main/10 rounded-xl px-4 text-sm font-bold outline-none font-mono text-text-main" 
                  placeholder={bulkEditType === 'sellingPrice' ? "0.00" : "0"}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[16px] font-black text-xs uppercase tracking-wider shadow-xs mt-4 disabled:opacity-50"
              >
                {isSaving ? "Updating..." : "Confirm Update"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
