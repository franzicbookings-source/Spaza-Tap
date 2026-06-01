import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Sale, Customer } from '../../types';
import { Search, DollarSign, Banknote, CreditCard, User, History, ChevronRight, ShoppingBag } from 'lucide-react';
import { formatTxDate } from '../../utils';

interface SalesScreenProps {
  shopId: string;
  ownerUserId: string;
}

export default function SalesScreen({ shopId, ownerUserId }: SalesScreenProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Load Sales History
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
  }, [shopId, ownerUserId]);

  // Load Customers for mapping customer identifiers to human names
  useEffect(() => {
    if (!shopId) return;
    const qC = query(collection(db, "customers"), where("shopId", "==", shopId));
    const unsubC = onSnapshot(qC, (snap) => {
      const list: Customer[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as any);
      });
      setCustomers(list);
    });
    return () => unsubC();
  }, [shopId]);

  const totalSalesThisWeek = sales
    .filter(s => new Date(s.saleDate).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000)
    .reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <div className="flex flex-col h-full bg-[#FBF5EC] font-sans pb-32 relative text-text-main">
      
      {/* Premium Header */}
      <header className="px-5 pt-5 pb-4 bg-white border-b border-[#2B1114]/8 shrink-0">
        <div>
          <h1 className="text-xl font-black font-display uppercase tracking-tight leading-none text-text-main">Sales History</h1>
          <p className="text-[10px] font-bold text-text-light uppercase tracking-wider mt-1.5 leading-none">Track your daily and periodic transactions.</p>
        </div>
      </header>

      {/* Structured metrics summary row - exact match parameters */}
      <div className="p-5 space-y-4">
        
        <div className="grid grid-cols-2 gap-3.5">
          
          <div className="bg-white border border-[#2B1114]/8 p-4 rounded-[22px] shadow-2xs flex flex-col justify-between h-[112px]">
            <span className="text-[9px] text-text-muted font-black uppercase tracking-wider block">Turnover (This Week)</span>
            <div className="mb-0.5">
              <span className="text-2xl font-black text-[#D94F12] block">R {totalSalesThisWeek.toFixed(2)}</span>
              <span className="text-[8px] text-text-light font-bold block mt-1">7 Days Window</span>
            </div>
          </div>

          <div className="bg-white border border-[#2B1114]/8 p-4 rounded-[22px] shadow-2xs flex flex-col justify-between h-[112px]">
            <span className="text-[9px] text-text-muted font-black uppercase tracking-wider block">Transactions count</span>
            <div className="mb-0.5">
              <span className="text-2xl font-black text-emerald-600 block">{sales.length}</span>
              <span className="text-[8px] text-text-light font-bold block mt-1">Life-time tickets</span>
            </div>
          </div>

        </div>

        {/* Section title */}
        <h3 className="text-xs font-black text-text-muted uppercase tracking-wider pl-1 pt-1 select-none">
          Sales Audit Ledger Tickets
        </h3>

        {/* Transaction cards feed */}
        <div className="space-y-3 pb-8">
          {sales.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-text-main/5">
              <History className="mx-auto w-10 h-10 mb-2.5 text-text-muted" />
              <p className="text-xs font-bold text-text-light">No sales transactions logged yet.</p>
            </div>
          ) : (
            sales.map(sale => {
              // Map customer ID to name if it is a credit sale
              const customerName = sale.customerId 
                ? (customers.find(c => c.id === sale.customerId)?.name || "Debtor Account")
                : "";

              let typeLabel = "Cash Register Sale";
              if (sale.saleType === "credit_sale" || sale.paymentMethod === "credit") {
                typeLabel = `On Tab: ${customerName}`;
              } else if (sale.paymentMethod === "card") {
                typeLabel = "Direct Card Swipe";
              }

              return (
                <div key={sale.id} className="bg-white p-5 rounded-[24px] border border-text-main/10 shadow-2xs flex justify-between items-center relative overflow-hidden transition-all hover:border-[#D94F12]/20">
                  
                  <div className="flex items-center gap-3.5">
                    {/* Visual icon badge */}
                    <div className="w-10 h-10 rounded-xl bg-[#FFF0E7] flex items-center justify-center shrink-0">
                      {sale.paymentMethod === "credit" ? (
                        <User className="w-4.5 h-4.5 text-[#D94F12]" />
                      ) : sale.paymentMethod === "card" ? (
                        <CreditCard className="w-4.5 h-4.5 text-purple-600" />
                      ) : (
                        <Banknote className="w-4.5 h-4.5 text-emerald-600" />
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="font-extrabold text-sm text-text-main uppercase tracking-tight leading-snug truncate max-w-[160px]">
                        {typeLabel}
                      </span>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-text-light font-mono font-bold leading-none">{formatTxDate(sale.saleDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price info right block */}
                  <div className="text-right pl-2">
                    <span className="font-display font-black text-text-main text-base block leading-none">
                      R {sale.totalAmount.toFixed(2)}
                    </span>
                    <span className="text-[8px] text-text-muted font-mono font-extrabold block mt-1 uppercase tracking-wider">
                      {sale.paymentMethod}
                    </span>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}
