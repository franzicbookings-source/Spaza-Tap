import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Sale } from '../../types';
import { Search, DollarSign, Banknote, CreditCard, User } from 'lucide-react';
import { formatTxDate } from '../../utils';

interface SalesScreenProps {
  shopId: string;
  ownerUserId: string;
}

export default function SalesScreen({ shopId, ownerUserId }: SalesScreenProps) {
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    if (!shopId || !ownerUserId) return;
    const q = query(collection(db, "sales"), where("shopId", "==", shopId), where("ownerUserId", "==", ownerUserId));
    const unsub = onSnapshot(q, (snap) => {
      const s: Sale[] = [];
      snap.forEach(d => s.push({ id: d.id, ...d.data() } as Sale));
      s.sort((a,b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
      setSales(s);
    });
    return () => unsub();
  }, [shopId]);

  const totalSalesThisWeek = sales.filter(s => new Date(s.saleDate).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <div className="flex flex-col h-full bg-[#F5EDE0] font-sans pb-24 md:pb-6 relative">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black font-display text-[#3B1A1A] uppercase tracking-tighter">Sales History</h1>
        </div>
      </header>

      <div className="py-4 px-6 shrink-0 flex gap-4 overflow-x-auto no-scrollbar">
        <div className="bg-[#3B1A1A] text-white p-4 rounded-2xl shadow-sm shrink-0 min-w-[140px]">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">This Week</p>
          <p className="font-display font-black text-xl mt-1">R {totalSalesThisWeek.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="space-y-3">
          {sales.length === 0 ? (
            <div className="text-center py-10 opacity-50">
              <DollarSign className="mx-auto w-12 h-12 mb-3 text-[#3B1A1A]" />
              <p className="font-bold">No sales recorded yet</p>
            </div>
          ) : (
            sales.map(sale => (
              <div key={sale.id} className="bg-white p-4 rounded-2xl shadow-sm border border-[#E8D0BB] flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-bold text-[#3B1A1A]">{sale.saleType === "credit_sale" ? "Customer Tab" : "Normal Sale"}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium capitalize flex items-center gap-1">
                      {sale.paymentMethod === "cash" && <Banknote className="w-3 h-3" />}
                      {sale.paymentMethod === "card" && <CreditCard className="w-3 h-3" />}
                      {sale.paymentMethod === "credit" && <User className="w-3 h-3" />}
                      {sale.paymentMethod}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">{formatTxDate(sale.saleDate)}</span>
                  </div>
                </div>
                <div className="flex flex-col text-right">
                  <span className="font-display font-black text-[#C8521A]">R {sale.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
