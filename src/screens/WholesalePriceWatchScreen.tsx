import React, { useState, useEffect } from "react";
import { ChevronLeft, Plus, Search, MapPin, Tag, Calendar, ShoppingCart, TrendingDown } from "lucide-react";
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { WholesalePrice } from "../types";

export function WholesalePriceWatchScreen({ onBack, shopId, ownerUserId }: { onBack: () => void, shopId: string, ownerUserId: string }) {
  const [prices, setPrices] = useState<WholesalePrice[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All");

  const [form, setForm] = useState({ itemName: "", supplierName: "", price: "", unit: "" });

  const categories = ["All", "Maize Meal", "Rice", "Sugar", "Cooking Oil", "Flour", "Beverages", "Other"];

  useEffect(() => {
    if (!shopId) return;
    const q = query(collection(db, "wholesale_prices"), where("shopId", "==", shopId));
    const unsub = onSnapshot(q, (snap) => {
      const arr: WholesalePrice[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() } as WholesalePrice));
      
      // sort by date descending
      arr.sort((a, b) => new Date(b.dateObserved).getTime() - new Date(a.dateObserved).getTime());
      
      setPrices(arr);
    });
    return () => unsub();
  }, [shopId]);

  const handleSave = async () => {
    if (!form.itemName || !form.price || !form.supplierName) return;
    
    // auto categorize basically just mapped for simplicity if we want, or leave as empty
    
    const id = `wp_${Date.now()}`;
    await setDoc(doc(db, "wholesale_prices", id), {
      id,
      shopId,
      ownerUserId,
      itemName: form.itemName,
      supplierName: form.supplierName,
      price: parseFloat(form.price),
      unit: form.unit || "Bulk",
      dateObserved: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    setForm({ itemName: "", supplierName: "", price: "", unit: "" });
    setShowAdd(false);
  };

  const filteredPrices = prices.filter(p => {
    const matchesSearch = p.itemName.toLowerCase().includes(search.toLowerCase()) || p.supplierName.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  // Group by item name to find best price
  const groupedByItem: Record<string, WholesalePrice[]> = {};
  filteredPrices.forEach(p => {
    const key = p.itemName.toLowerCase().trim();
    if (!groupedByItem[key]) groupedByItem[key] = [];
    groupedByItem[key].push(p);
  });

  return (
    <div className="min-h-screen bg-[#F5EDE0] font-sans pb-24 md:pb-6 relative overflow-y-auto w-full max-w-[480px] md:max-w-xl mx-auto shadow-xl">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm shrink-0 flex flex-col z-10 sticky top-0 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 bg-gray-100 rounded-full active:scale-95"><ChevronLeft className="w-5 h-5" /></button>
            <h1 className="text-xl font-black font-display text-[#3B1A1A] uppercase tracking-tighter">Price Watch</h1>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-[#1b4332] text-white p-2.5 rounded-full shadow-md active:scale-95">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search items or wholesalers..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F5EDE0] border-none rounded-xl py-3 pl-10 pr-4 text-sm font-bold placeholder-gray-500 focus:ring-2 focus:ring-[#1b4332] outline-none"
          />
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="bg-[#e8f5e9] border border-[#c8e6c9] p-4 rounded-xl flex gap-3 text-[#2e7d32] text-xs font-bold shadow-sm">
          <TrendingDown className="w-5 h-5 shrink-0" />
          <p>Track prices of bulk goods you observe at wholesalers to compare and buy where it's cheapest.</p>
        </div>

        {Object.keys(groupedByItem).length === 0 ? (
           <div className="bg-white p-8 rounded-2xl text-center border border-dashed border-[#c8e6c9]">
             <ShoppingCart className="w-12 h-12 text-[#a5d6a7] mx-auto mb-3 opacity-50" />
             <p className="font-bold text-gray-500 text-sm">No prices tracked yet.</p>
             <p className="text-xs text-gray-400 mt-1">Tap + to add a bulk item price you saw.</p>
           </div>
        ) : (
          Object.entries(groupedByItem).map(([itemKey, itemPrices]) => {
            // Sort by price to find cheapest
            itemPrices.sort((a, b) => a.price - b.price);
            const bestPrice = itemPrices[0];
            const originalName = bestPrice.itemName; // Use the cased name of the first entry

            return (
              <div key={itemKey} className="bg-white rounded-2xl shadow-sm border border-[#E8D0BB] overflow-hidden">
                <div className="bg-[#1b4332] text-white p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-display font-black text-lg">{originalName}</h3>
                    <p className="text-[10px] text-[#a5d6a7] uppercase tracking-widest font-bold">Best Price: R{bestPrice.price.toFixed(2)}</p>
                  </div>
                  <div className="w-10 h-10 bg-[#2d6a4f] rounded-full flex items-center justify-center">
                    <Tag className="w-5 h-5 text-[#95d5b2]" />
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  {itemPrices.map(p => (
                    <div key={p.id} className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0 border-gray-100">
                      <div>
                        <p className="text-sm font-bold text-[#3B1A1A] flex items-center gap-1.5">
                          {p.supplierName}
                          {p.id === bestPrice.id && <span className="bg-green-100 text-green-700 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded font-black">Best</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] uppercase font-bold tracking-widest text-gray-500">
                          <span>{p.unit}</span>
                          •
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(p.dateObserved).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-base font-black ${p.id === bestPrice.id ? 'text-[#2e7d32]' : 'text-gray-600'}`}>R{p.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex flex-col justify-end">
          <div className="bg-white p-6 rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <h2 className="font-display font-black text-xl mb-1 text-[#3B1A1A]">Track New Price</h2>
            <p className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-wider">Add observed wholesaler price</p>
            
            <div className="space-y-4 text-sm font-bold">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">Item Name & Brand</label>
                <input placeholder="e.g. White Star Maize Meal" value={form.itemName} onChange={e => setForm({...form, itemName: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl outline-none focus:border-[#1b4332]" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">Unit/Size</label>
                  <input placeholder="e.g. 10kg, 2L" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl outline-none focus:border-[#1b4332]" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">Price (R)</label>
                  <input type="number" step="0.01" placeholder="0.00" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl outline-none focus:border-[#1b4332]" />
                </div>
              </div>
              
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">Wholesaler / Supplier</label>
                <input placeholder="e.g. Devland, Makro, Jumbo" value={form.supplierName} onChange={e => setForm({...form, supplierName: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl outline-none focus:border-[#1b4332]" />
              </div>
              
              <div className="flex gap-3 pt-6">
                <button onClick={() => setShowAdd(false)} className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-black uppercase tracking-wider text-xs active:scale-95">Cancel</button>
                <button 
                  onClick={handleSave} 
                  disabled={!form.itemName || !form.price || !form.supplierName}
                  className="flex-1 bg-[#1b4332] text-white py-3.5 rounded-xl font-black uppercase tracking-wider text-xs shadow-md active:scale-95 disabled:opacity-50"
                >
                  Save Price
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
