import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { Product } from '../../types';
import { Plus, Search, Tag, X, AlertTriangle, Package } from 'lucide-react';

interface StockScreenProps {
  shopId: string;
  ownerUserId: string;
}

export default function StockScreen({ shopId, ownerUserId }: StockScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    category: "Other",
    buyingPrice: "",
    sellingPrice: "",
    stockQuantity: "",
    lowStockLevel: "5"
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

  const filteredProducts = products.filter(p => (p.name || "").toLowerCase().includes(search.toLowerCase()));
  const lowStockCount = products.filter(p => (p.stockQuantity || 0) <= (p.lowStockLevel || 0)).length;

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
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setShowAdd(false);
      setForm({ name: "", category: "Other", buyingPrice: "", sellingPrice: "", stockQuantity: "", lowStockLevel: "5" });
    } catch (err) {
      console.error(err);
      alert("Failed to add product");
    }
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#F5EDE0] font-sans pb-24 md:pb-6 relative">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black font-display text-[#3B1A1A] uppercase tracking-tighter">Stock</h1>
          {lowStockCount > 0 && <p className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1"><AlertTriangle className="w-3 h-3" /> {lowStockCount} items running low</p>}
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-[#C8521A] text-white p-3 rounded-full shadow hover:bg-[#A63F10] transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <div className="p-4 md:px-6">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search stock..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white pl-11 pr-4 py-3 rounded-2xl shadow-sm outline-none font-medium border border-[#E8D0BB] focus:border-[#C8521A]"
          />
        </div>

        <div className="space-y-3 pb-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-10 opacity-50">
              <Package className="mx-auto w-12 h-12 mb-3 text-[#3B1A1A]" />
              <p className="font-bold">No products found</p>
            </div>
          ) : (
            filteredProducts.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-[#E8D0BB] flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-bold text-[#3B1A1A]">{p.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">{p.category}</span>
                    <span className={`text-xs font-bold ${p.stockQuantity <= p.lowStockLevel ? "text-red-500" : "text-green-600"}`}>
                      Qty: {p.stockQuantity}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col text-right">
                  <span className="font-display font-black text-[#C8521A]">R {p.sellingPrice.toFixed(2)}</span>
                  <span className="text-[10px] text-gray-400 font-bold mt-1">Buy: R{p.buyingPrice.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full rounded-t-3xl p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black font-display text-[#3B1A1A] uppercase tracking-tight">Add Product</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-600" /></button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mb-1 block">Product Name</label>
                <input 
                  type="text" required
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#C8521A]" 
                  placeholder="e.g. Blue Ribbon Bread"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mb-1 block">Category</label>
                <select 
                  value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#C8521A]"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2 mb-1 block">Buying Price (R)</label>
                  <input 
                    type="number" step="0.01" required
                    value={form.buyingPrice} onChange={e => setForm({...form, buyingPrice: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono outline-none focus:border-[#C8521A]" 
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2 mb-1 block">Selling Price (R)</label>
                  <input 
                    type="number" step="0.01" required
                    value={form.sellingPrice} onChange={e => setForm({...form, sellingPrice: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono outline-none focus:border-[#C8521A]" 
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2 mb-1 block">Current Stock</label>
                  <input 
                    type="number" required
                    value={form.stockQuantity} onChange={e => setForm({...form, stockQuantity: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono outline-none focus:border-[#C8521A]" 
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2 mb-1 block">Low Stock Alert</label>
                  <input 
                    type="number" required
                    value={form.lowStockLevel} onChange={e => setForm({...form, lowStockLevel: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono outline-none focus:border-[#C8521A]" 
                    placeholder="5"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full mt-4 h-14 bg-[#3B1A1A] text-white rounded-full font-display font-black uppercase tracking-widest shadow-md active:scale-95 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Product"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
