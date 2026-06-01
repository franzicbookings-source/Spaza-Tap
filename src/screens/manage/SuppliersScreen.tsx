import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { Supplier } from '../../types';
import { Plus, X, Search, Truck, Phone } from 'lucide-react';

interface SuppliersScreenProps {
  shopId: string;
  ownerUserId: string;
}

export default function SuppliersScreen({ shopId, ownerUserId }: SuppliersScreenProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  
  const [form, setForm] = useState({
    name: "",
    contactName: "",
    phone: "",
    notes: ""
  });

  useEffect(() => {
    if (!shopId || !ownerUserId) return;
    const q = query(collection(db, "suppliers"), where("shopId", "==", shopId), where("ownerUserId", "==", ownerUserId));
    const unsub = onSnapshot(q, (snap) => {
      const s: Supplier[] = [];
      snap.forEach(d => s.push({ id: d.id, ...d.data() } as Supplier));
      s.sort((a,b) => a.name.localeCompare(b.name));
      setSuppliers(s);
    });
    return () => unsub();
  }, [shopId, ownerUserId]);

  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    
    setIsSaving(true);
    try {
      const supplierId = `sup_${Date.now()}`;
      const supRef = doc(db, "suppliers", supplierId);
      
      await setDoc(supRef, {
        id: supplierId,
        shopId,
        ownerUserId,
        name: form.name.trim(),
        contactName: form.contactName.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setShowAdd(false);
      setForm({ name: "", contactName: "", phone: "", notes: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to add supplier");
    }
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#F5EDE0] font-sans pb-24 md:pb-6 relative">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black font-display text-[#3B1A1A] uppercase tracking-tighter">Suppliers</h1>
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
            placeholder="Search suppliers..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white pl-11 pr-4 py-3 rounded-2xl shadow-sm outline-none font-medium border border-[#E8D0BB] focus:border-[#C8521A]"
          />
        </div>

        <div className="space-y-3 pb-4">
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-10 opacity-50">
              <Truck className="mx-auto w-12 h-12 mb-3 text-[#3B1A1A]" />
              <p className="font-bold">No suppliers found</p>
            </div>
          ) : (
            filteredSuppliers.map(sup => (
              <div key={sup.id} className="bg-white p-4 rounded-2xl shadow-sm border border-[#E8D0BB] flex flex-col gap-2">
                <span className="font-bold text-[#3B1A1A]">{sup.name}</span>
                {sup.contactName && <span className="text-xs text-gray-500 font-medium">Contact: {sup.contactName}</span>}
                {sup.phone && (
                  <a href={`tel:${sup.phone}`} className="text-xs bg-[#C8521A]/10 text-[#C8521A] px-3 py-1.5 rounded-lg flex items-center gap-2 self-start font-bold">
                    <Phone className="w-3 h-3" />
                    {sup.phone}
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full rounded-t-3xl p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black font-display text-[#3B1A1A] uppercase tracking-tight">Add Supplier</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-600" /></button>
            </div>
            
            <form onSubmit={handleSaveSupplier} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mb-1 block">Company Name</label>
                <input 
                  type="text" required
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#C8521A]" 
                  placeholder="e.g. Coca-Cola"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mb-1 block">Contact Person</label>
                <input 
                  type="text"
                  value={form.contactName} onChange={e => setForm({...form, contactName: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#C8521A]" 
                  placeholder="e.g. Sipho"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mb-1 block">Phone Number</label>
                <input 
                  type="tel"
                  value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#C8521A]" 
                  placeholder="e.g. 082 123 4567"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full mt-4 h-14 bg-[#3B1A1A] text-white rounded-full font-display font-black uppercase tracking-widest shadow-md active:scale-95 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Supplier"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
