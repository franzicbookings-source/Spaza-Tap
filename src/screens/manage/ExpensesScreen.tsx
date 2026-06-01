import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { Expense } from '../../types';
import { Plus, X, Search, Receipt } from 'lucide-react';
import { formatTxDate } from '../../utils';

interface ExpensesScreenProps {
  shopId: string;
  ownerUserId: string;
}

export default function ExpensesScreen({ shopId, ownerUserId }: ExpensesScreenProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({
    amount: "",
    category: "Rent",
    description: "",
    paymentMethod: "Cash"
  });

  useEffect(() => {
    if (!shopId || !ownerUserId) return;
    const q = query(collection(db, "expenses"), where("shopId", "==", shopId), where("ownerUserId", "==", ownerUserId));
    const unsub = onSnapshot(q, (snap) => {
      const e: Expense[] = [];
      snap.forEach(d => e.push({ id: d.id, ...d.data() } as Expense));
      // Sort in JS instead of firestore index for mvp
      e.sort((a,b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
      setExpenses(e);
    });
    return () => unsub();
  }, [shopId]);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.description) return;
    
    setIsSaving(true);
    try {
      const expenseId = `exp_${Date.now()}`;
      const expRef = doc(db, "expenses", expenseId);
      
      await setDoc(expRef, {
        id: expenseId,
        shopId,
        ownerUserId,
        amount: parseFloat(form.amount),
        category: form.category,
        description: form.description.trim(),
        paymentMethod: form.paymentMethod,
        expenseDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setShowAdd(false);
      setForm({ amount: "", category: "Rent", description: "", paymentMethod: "Cash" });
    } catch (err) {
      console.error(err);
      alert("Failed to add expense");
    }
    setIsSaving(false);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex flex-col h-full bg-[#F5EDE0] font-sans pb-24 md:pb-6 relative">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black font-display text-[#3B1A1A] uppercase tracking-tighter">Expenses</h1>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-[#C8521A] text-white p-3 rounded-full shadow hover:bg-[#A63F10] transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <div className="py-4 px-6 shrink-0 flex gap-4 overflow-x-auto no-scrollbar">
        <div className="bg-[#BA1A1A] text-white p-4 rounded-2xl shadow-sm shrink-0 min-w-[140px]">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Value</p>
          <p className="font-display font-black text-xl mt-1">R {totalExpenses.toFixed(2)}</p>
        </div>
      </div>

      <div className="px-6 pb-2 shrink-0">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Recent Expenses</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="space-y-3">
          {expenses.length === 0 ? (
            <div className="text-center py-10 opacity-50">
              <Receipt className="mx-auto w-12 h-12 mb-3 text-[#3B1A1A]" />
              <p className="font-bold">No expenses recorded</p>
            </div>
          ) : (
            expenses.map(exp => (
              <div key={exp.id} className="bg-white p-4 rounded-2xl shadow-sm border border-[#E8D0BB] flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-bold text-[#3B1A1A]">{exp.description}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">{exp.category}</span>
                    <span className="text-[10px] text-gray-400 font-bold">{formatTxDate(exp.expenseDate)}</span>
                  </div>
                </div>
                <div className="flex flex-col text-right">
                  <span className="font-display font-black text-[#BA1A1A]">-R {exp.amount.toFixed(2)}</span>
                  <span className="text-[10px] text-gray-400 font-bold mt-1">{exp.paymentMethod}</span>
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
              <h2 className="text-xl font-black font-display text-[#3B1A1A] uppercase tracking-tight">Record Expense</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-600" /></button>
            </div>
            
            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mb-1 block">Description</label>
                <input 
                  type="text" required
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#C8521A]" 
                  placeholder="e.g. Weekly transport"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mb-1 block">Amount (R)</label>
                  <input 
                    type="number" step="0.01" required
                    value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono outline-none focus:border-[#C8521A]" 
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mb-1 block">Payment</label>
                  <select 
                    value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#C8521A]"
                  >
                    <option>Cash</option>
                    <option>Card / EFT</option>
                    <option>Bank transfer</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mb-1 block">Category</label>
                <select 
                  value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#C8521A]"
                >
                  <option>Rent</option>
                  <option>Electricity</option>
                  <option>Transport</option>
                  <option>Supplier payment</option>
                  <option>Staff wages</option>
                  <option>Airtime / Data</option>
                  <option>Repairs</option>
                  <option>Packaging</option>
                  <option>Cleaning</option>
                  <option>Other</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full mt-4 h-14 bg-[#3B1A1A] text-white rounded-full font-display font-black uppercase tracking-widest shadow-md active:scale-95 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Expense"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
