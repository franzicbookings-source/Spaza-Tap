import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { CashUp, Sale, Expense } from '../../types';
import { Check, Loader, ClipboardList } from 'lucide-react';
import { formatTxDate } from '../../utils';

interface CashUpScreenProps {
  shopId: string;
  ownerUserId: string;
}

export default function CashUpScreen({ shopId, ownerUserId }: CashUpScreenProps) {
  const [cashUps, setCashUps] = useState<CashUp[]>([]);
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [todayExpenses, setTodayExpenses] = useState<Expense[]>([]);
  const [todayPayments, setTodayPayments] = useState<any[]>([]);
  const [openingCash, setOpeningCash] = useState("");
  const [actualCash, setActualCash] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasCashedUpToday, setHasCashedUpToday] = useState(false);

  useEffect(() => {
    if (!shopId || !ownerUserId) return;
    
    // Load past cash ups
    const qC = query(collection(db, "cash_ups"), where("shopId", "==", shopId), where("ownerUserId", "==", ownerUserId));
    const unsubC = onSnapshot(qC, (snap) => {
      const c: CashUp[] = [];
      snap.forEach(d => c.push({ id: d.id, ...d.data() } as CashUp));
      c.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setCashUps(c);
      
      const todayString = new Date().toISOString().split("T")[0];
      setHasCashedUpToday(c.some(cu => cu.date.startsWith(todayString)));
    });
    
    // Load today's sales (since midnight)
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    
    const qS = query(collection(db, "sales"), where("shopId", "==", shopId), where("ownerUserId", "==", ownerUserId));
    const unsubS = onSnapshot(qS, (snap) => {
      const s: Sale[] = [];
      snap.forEach(d => {
        const sale = { id: d.id, ...d.data() } as Sale;
        if (new Date(sale.saleDate).getTime() >= startOfToday.getTime()) {
          s.push(sale);
        }
      });
      setTodaySales(s);
    });

    const qE = query(collection(db, "expenses"), where("shopId", "==", shopId), where("ownerUserId", "==", ownerUserId));
    const unsubE = onSnapshot(qE, (snap) => {
      const e: Expense[] = [];
      snap.forEach(d => {
        const exp = { id: d.id, ...d.data() } as Expense;
        if (new Date(exp.expenseDate).getTime() >= startOfToday.getTime()) {
          e.push(exp);
        }
      });
      setTodayExpenses(e);
    });

    const qTx = query(collection(db, "transactions"), where("shopId", "==", shopId), where("ownerUserId", "==", ownerUserId));
    const unsubTx = onSnapshot(qTx, (snap) => {
      const txs: any[] = [];
      snap.forEach(d => {
        const t = d.data();
        if (t.type === "payment" && new Date(t.transactionDate).getTime() >= startOfToday.getTime()) {
           txs.push(t);
        }
      });
      setTodayPayments(txs);
    });

    return () => { unsubC(); unsubS(); unsubE(); unsubTx(); };
  }, [shopId, ownerUserId]);

  const openingCashNum = parseFloat(openingCash) || 0;
  const totalCashSales = todaySales.filter(s => s.paymentMethod === "cash").reduce((acc, s) => acc + s.totalAmount, 0);
  const totalCardSales = todaySales.filter(s => s.paymentMethod === "card").reduce((acc, s) => acc + s.totalAmount, 0);
  const totalCreditSales = todaySales.filter(s => s.paymentMethod === "credit").reduce((acc, s) => acc + s.totalAmount, 0);
  
  const totalCashExpenses = todayExpenses.filter(e => e.paymentMethod.toLowerCase() === "cash" || e.paymentMethod.toLowerCase() === "till_cash").reduce((acc, e) => acc + e.amount, 0);
  const totalCashPayments = todayPayments.reduce((acc, t) => acc + t.amount, 0);

  const expectedCashInTill = openingCashNum + totalCashSales + totalCashPayments - totalCashExpenses;
  const actualCashNum = parseFloat(actualCash) || 0;
  const difference = actualCashNum - expectedCashInTill;

  const handleCashUp = async () => {
    if (actualCash === "" || openingCash === "") {
        alert("Please enter both opening and actual cash amounts.");
        return;
    }
    
    setIsSaving(true);
    try {
      const cashUpId = `cu_${Date.now()}`;
      const cuRef = doc(db, "cash_ups", cashUpId);
      
      await setDoc(cuRef, {
        id: cashUpId,
        shopId,
        ownerUserId,
        date: new Date().toISOString(),
        openingCash: openingCashNum,
        expectedCash: expectedCashInTill,
        actualCash: actualCashNum,
        difference: difference,
        notes: difference !== 0 ? `Discrepancy of R${difference.toFixed(2)}` : "",
        createdAt: serverTimestamp()
      });

      setActualCash("");
      setOpeningCash("");
    } catch (err) {
      console.error(err);
      alert("Failed to submit cash-up");
    }
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#F5EDE0] font-sans pb-24 md:pb-6 relative overflow-y-auto">
      <header className="px-6 pt-6 pb-4 shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black font-display text-[#3B1A1A] uppercase tracking-tighter">Shift Cash-Up</h1>
        </div>
      </header>

      <div className="px-6 space-y-6">
        {!hasCashedUpToday ? (
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#E8D0BB]">
            <h2 className="text-sm font-black text-[#3B1A1A] uppercase tracking-widest mb-4">Today's Summary</h2>
            
            <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Opening Cash</span>
                <input 
                  type="number"
                  placeholder="0"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="font-mono font-bold text-[#3B1A1A] w-24 text-right bg-gray-50 rounded"
                />
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Cash Sales</span>
                <span className="font-mono font-bold text-[#3B1A1A]">R {totalCashSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Customer Payments</span>
                <span className="font-mono font-bold text-[#3B1A1A]">R {totalCashPayments.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Card/EFT Sales</span>
                <span className="font-mono font-bold text-[#3B1A1A]">R {totalCardSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Credit Sales</span>
                <span className="font-mono font-bold text-[#C8521A]">R {totalCreditSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Cash Expenses</span>
                <span className="font-mono font-bold text-[#BA1A1A]">-R {totalCashExpenses.toFixed(2)}</span>
                </div>
            </div>

            <div className="bg-[#3B1A1A] text-[#F5EDE0] p-4 rounded-xl mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#F5EDE0]/70 mb-1">Expected Cash In Till</p>
                <p className="text-3xl font-display font-black tracking-tight">R {expectedCashInTill.toFixed(2)}</p>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mb-2 block">Counted Cash Amount</label>
                <input 
                    type="number" step="0.01"
                    value={actualCash} onChange={e => setActualCash(e.target.value)}
                    className="w-full bg-gray-50 border border-[#E8D0BB] rounded-xl px-4 py-4 font-mono text-xl outline-none focus:border-[#C8521A] text-center font-bold" 
                    placeholder="0.00"
                />
            </div>

            {actualCash !== "" && (
                <div className={`mt-4 p-3 rounded-xl border flex justify-between items-center text-sm font-bold ${difference === 0 ? "bg-green-50 border-green-200 text-green-700" : difference > 0 ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                <span>Difference:</span>
                <span>{difference > 0 ? "+" : ""}R {difference.toFixed(2)}</span>
                </div>
            )}

            <button 
                onClick={handleCashUp}
                disabled={isSaving || actualCash === ""}
                className="w-full mt-6 h-14 bg-[#C8521A] text-white rounded-full font-display font-black uppercase tracking-widest shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isSaving ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                Confirm Cash-Up
            </button>
            </div>
        ) : (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-lg font-black text-green-800 uppercase tracking-tighter">Day Cashed Up</h2>
                <p className="text-sm font-bold text-green-600/80">You have already completed the shift cash-up for today.</p>
            </div>
        )}

        <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1 mb-3">Previous Cash-Ups</h2>
            <div className="space-y-3">
            {cashUps.length === 0 ? (
                <div className="text-center py-6 opacity-50 bg-white rounded-2xl shadow-sm border border-[#E8D0BB]">
                    <ClipboardList className="mx-auto w-8 h-8 mb-2 text-[#3B1A1A]" />
                    <p className="text-xs font-bold">No records found</p>
                </div>
            ) : (
                cashUps.map(cu => (
                    <div key={cu.id} className="bg-white p-4 rounded-xl shadow-sm border border-[#E8D0BB] flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="font-bold text-[#3B1A1A]">{formatTxDate(cu.date)}</span>
                            {cu.difference !== 0 && (
                                <span className={`text-[10px] font-bold ${cu.difference > 0 ? "text-blue-600" : "text-red-500"}`}>
                                    Diff: {cu.difference > 0 ? "+" : ""}R{cu.difference.toFixed(2)}
                                </span>
                            )}
                        </div>
                        <div className="text-right">
                            <span className="font-mono font-bold text-[#3B1A1A] block">R {cu.actualCash.toFixed(2)}</span>
                        </div>
                    </div>
                ))
            )}
            </div>
        </div>
      </div>
    </div>
  );
}
