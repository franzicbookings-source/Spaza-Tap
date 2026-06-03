import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Purchase, Supplier } from '../../types';
import { Plus, X, Search, Archive } from 'lucide-react';
import { formatTxDate } from '../../utils';

interface PurchasesScreenProps {
  shopId: string;
  ownerUserId: string;
}

export default function PurchasesScreen({ shopId, ownerUserId }: PurchasesScreenProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({
    supplierId: "",
    totalAmount: "",
    paymentStatus: "paid"
  });

  useEffect(() => {
    if (!shopId || !ownerUserId) return;
    const q = query(collection(db, "purchases"), where("shopId", "==", shopId), where("ownerUserId", "==", ownerUserId));
    const unsub = onSnapshot(q, (snap) => {
      const p: Purchase[] = [];
      snap.forEach(d => p.push({ id: d.id, ...d.data() } as Purchase));
      p.sort((a,b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
      setPurchases(p);
    });
    
    const qs = query(collection(db, "suppliers"), where("shopId", "==", shopId), where("ownerUserId", "==", ownerUserId));
    const unsubs = onSnapshot(qs, (snap) => {
      const s: Supplier[] = [];
      snap.forEach(d => s.push({ id: d.id, ...d.data() } as Supplier));
      setSuppliers(s);
    });
    
    return () => { unsub(); unsubs(); };
  }, [shopId, ownerUserId]);

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.totalAmount) return;
    
    setIsSaving(true);
    try {
      const purchaseId = `purch_${Date.now()}`;
      const purchRef = doc(db, "purchases", purchaseId);
      
      await setDoc(purchRef, {
        id: purchaseId,
        shopId,
        ownerUserId,
        supplierId: form.supplierId || null,
        purchaseDate: new Date().toISOString(),
        totalAmount: parseFloat(form.totalAmount),
        paymentStatus: form.paymentStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setShowAdd(false);
      setForm({ supplierId: "", totalAmount: "", paymentStatus: "paid" });
    } catch (err) {
      console.error(err);
      alert("Failed to add purchase");
    }
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F5EDE0] font-sans pb-24 md:pb-6 relative">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black font-display text-[#3B1A1A] uppercase tracking-tighter">Restock Log</h1>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-[#C8521A] text-white p-3 rounded-full shadow hover:bg-[#A63F10] transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-3">
          {purchases.length === 0 ? (
            <div className="text-center py-10 opacity-50">
              <Archive className="mx-auto w-12 h-12 mb-3 text-[#3B1A1A]" />
              <p className="font-bold">No restock purchases recorded</p>
            </div>
          ) : (
            purchases.map(p => {
              const supplier = suppliers.find(s => s.id === p.supplierId);
              return (
                <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-[#E8D0BB] flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-bold text-[#3B1A1A]">{supplier ? supplier.name : "Unknown Supplier"}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${p.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {p.paymentStatus}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold">{formatTxDate(p.purchaseDate)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="font-display font-black text-[#3B1A1A]">R {p.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full rounded-t-3xl p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black font-display text-[#3B1A1A] uppercase tracking-tight">Record Restock</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-600" /></button>
            </div>
            
            <form onSubmit={handleSavePurchase} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mb-1 block">Supplier</label>
                <select 
                  value={form.supplierId} onChange={e => setForm({...form, supplierId: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#C8521A]"
                >
                  <option value="">Select Supplier...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mb-1 block">Total Cost (R)</label>
                <input 
                  type="number" step="0.01" required
                  value={form.totalAmount} onChange={e => setForm({...form, totalAmount: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono outline-none focus:border-[#C8521A]" 
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mb-1 block">Payment Status</label>
                <select 
                  value={form.paymentStatus} onChange={e => setForm({...form, paymentStatus: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#C8521A]"
                >
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid / Credit</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full mt-4 h-14 bg-[#3B1A1A] text-white rounded-full font-display font-black uppercase tracking-widest shadow-md active:scale-95 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Restock"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
