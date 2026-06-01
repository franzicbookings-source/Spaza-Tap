import React, { useState, useEffect } from "react";
import { Store, Search, Bell, PlusCircle, AlertTriangle, TrendingUp, Users, Calendar, QrCode, X, DollarSign, Package, Tag, ShoppingCart, Megaphone } from "lucide-react";
import { Scanner } from '@yudiel/react-qr-scanner';
import { ScreenState, Customer, Transaction, Sale, Product } from "../types";
import { formatTxDate } from "../utils";
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface DashboardScreenProps {
  onNavigate: (screen: ScreenState) => void;
  onViewCustomer: (id: string) => void;
  customers: Customer[];
  transactions: Transaction[];
  pendingRequestsCount?: number;
  shopName?: string;
  shopId?: string;
}

export default function DashboardScreen({
  onNavigate,
  onViewCustomer,
  customers = [],
  transactions = [],
  pendingRequestsCount = 0,
  shopName,
  shopId
}: DashboardScreenProps) {
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState("");
  const [todaySalesTotal, setTodaySalesTotal] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    if (!shopId) return;

    // Load today's sales
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    
    const qS = query(collection(db, "sales"), where("shopId", "==", shopId));
    const unsubS = onSnapshot(qS, (snap) => {
      let total = 0;
      snap.forEach(d => {
        const s = d.data() as Sale;
        if (new Date(s.saleDate).getTime() >= startOfToday.getTime()) {
          total += s.totalAmount;
        }
      });
      setTodaySalesTotal(total);
    });

    // Load low stock
    const qP = query(collection(db, "products"), where("shopId", "==", shopId));
    const unsubP = onSnapshot(qP, (snap) => {
      let low = 0;
      snap.forEach(d => {
        const p = d.data() as Product;
        if (p.stockQuantity <= p.lowStockLevel) low++;
      });
      setLowStockCount(low);
    });

    return () => { unsubS(); unsubP(); };
  }, [shopId]);

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const value = detectedCodes[0].rawValue;
      if (value.startsWith("CWE_CUSTOMER_ID_")) {
        const resultId = value.replace("CWE_CUSTOMER_ID_", "");
        const matched = customers.find(c => c.id === resultId);
        if (matched) {
          setShowScanner(false);
          setScanError("");
          onViewCustomer(resultId);
        } else {
          setScanError("Customer not found in your database.");
        }
      } else {
        setScanError("Invalid QR Code FORMAT.");
      }
    }
  };

  // Outstanding filter calculations
  const owingCustomers = customers.filter(c => c.owed > 0);
  const totalMoneyOwed = owingCustomers.reduce((acc, c) => acc + c.owed, 0);
  const overdueCustomers = owingCustomers.filter(c => c.daysOwing >= 15);
  const overdueCount = overdueCustomers.length;

  const oldestDebtDays = owingCustomers.reduce((max, c) => Math.max(max, c.daysOwing), 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayFormatted = formatTxDate(todayStr);
  const collectedToday = transactions
    .filter(t => t.type === "payment" && (t.date === todayFormatted || t.date.includes(todayStr)))
    .reduce((acc, t) => acc + t.amount, 0);

  const needsAttention = owingCustomers.filter(
    (c) => c.status === "warning" || c.status === "serious",
  );

  return (
    <div className="min-h-screen bg-[#F5EDE0] pb-24 relative">
      <header className="w-full pt-6 pb-2 px-6">
        <div className="flex items-center justify-between w-full max-w-[480px] md:max-w-none mx-auto border-b-0 md:border-b border-[#3B1A1A]/10 md:pb-6">
          <h1 className="text-lg md:text-3xl font-display font-black text-[#3B1A1A] tracking-tight md:tracking-tighter uppercase">
            {shopName ? `Welcome back, ${shopName}` : "CWEBEZELA TAB"}
          </h1>
          <div className="flex flex-wrap md:flex-nowrap items-center gap-3 text-[#3B1A1A]">
            <button 
              onClick={() => { setShowScanner(true); setScanError(""); }}
              className="active:opacity-80 transition-opacity p-2 bg-[#3B1A1A] text-[#F5EDE0] rounded-full flex items-center justify-center gap-2 px-4 shadow-sm"
              title="Scan Customer ID"
            >
              <QrCode className="w-5 h-5 md:w-4 md:h-4" />
              <span className="hidden md:inline text-xs font-display font-bold uppercase tracking-widest">Scan ID</span>
            </button>
            <button 
              onClick={() => onNavigate("till")}
              className="active:opacity-80 transition-opacity p-2 bg-[#C8521A] text-[#F5EDE0] rounded-full flex items-center justify-center gap-2 px-4 shadow-sm"
              title="Till"
            >
              <DollarSign className="w-5 h-5 md:w-4 md:h-4" />
              <span className="hidden md:inline text-xs font-display font-bold uppercase tracking-widest">Till Point</span>
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[480px] md:max-w-none mx-auto px-6 mt-2 md:mt-3 space-y-6 md:space-y-0 md:grid md:grid-cols-[1.5fr_1fr] md:gap-10">
        
        {/* Left Column for Desktop */}
        <div className="space-y-6 md:mt-4">
          {pendingRequestsCount > 0 && (
            <div 
              onClick={() => onNavigate("customerAccessRequests")}
              className="bg-[#FFE5D8] border border-[#F8B79B] p-4 md:p-5 rounded-2xl flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-3 md:gap-4">
                <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#C8521A] animate-pulse" />
                <p className="text-xs md:text-sm font-bold text-[#3B1A1A]">
                  {pendingRequestsCount === 1 
                    ? "1 customer is waiting for access approval" 
                    : `${pendingRequestsCount} customers are waiting for access approval`}
                </p>
              </div>
              <span className="text-[10px] md:text-xs font-display font-black text-[#C8521A] uppercase tracking-wider bg-white/50 px-3 py-1.5 rounded-md">Review</span>
            </div>
          )}

          {/* New Shop Summary */}
          <div className="grid grid-cols-2 gap-4">
             <div onClick={() => onNavigate("sales")} className="bg-[#3B1A1A] p-5 rounded-[1.5rem] shadow-sm flex flex-col justify-between cursor-pointer active:scale-95 transition-transform text-[#F5EDE0]">
              <span className="text-[10px] font-bold tracking-widest uppercase mb-1 opacity-70 block">
                Today's Sales
              </span>
              <span className="text-3xl font-display font-black mb-4">R{todaySalesTotal.toFixed(2)}</span>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/50 uppercase tracking-widest">
                <DollarSign className="w-3.5 h-3.5" />
                <span>View Sales</span>
              </div>
            </div>

            <div onClick={() => onNavigate("stock")} className="bg-[#C8521A] p-5 rounded-[1.5rem] shadow-sm flex flex-col justify-between cursor-pointer active:scale-95 transition-transform text-[#F5EDE0]">
              <span className="text-[10px] font-bold tracking-widest uppercase mb-1 opacity-70 block">
                Stock Alerts
              </span>
              <span className="text-3xl font-display font-black mb-4">{lowStockCount}</span>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/50 uppercase tracking-widest">
                <Package className="w-3.5 h-3.5" />
                <span>Check Low Stock</span>
              </div>
            </div>
            {/* Hub Needs Attention Widget */}
            <div 
              onClick={() => onNavigate("hub")}
              className="bg-white border border-orange-200 p-5 rounded-[1.5rem] shadow-sm flex flex-col justify-between cursor-pointer active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-2 mb-2">
                 <AlertTriangle className="w-4 h-4 text-orange-600" />
                 <span className="text-[10px] font-bold tracking-widest text-[#3B1A1A] uppercase opacity-80">
                  Help & Compliance Hub Alerts
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-gray-600">Check for outstanding tasks and alerts.</span>
                <span className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mt-2 bg-orange-50 w-fit px-2 py-1 rounded">Open Hub to View</span>
              </div>
            </div>

            {/* Wholesaler Price Watch Widget */}
            <div 
              onClick={() => onNavigate("priceWatch")}
              className="col-span-2 md:col-span-1 bg-[#1b4332] border border-[#2d6a4f] p-5 rounded-[1.5rem] shadow-sm flex flex-col justify-between cursor-pointer active:scale-95 transition-transform text-[#F5EDE0] mt-2 md:mt-0"
            >
              <div className="flex items-center gap-2 mb-2">
                 <ShoppingCart className="w-4 h-4 text-[#74c69d]" />
                 <span className="text-[10px] font-bold tracking-widest text-[#95d5b2] uppercase opacity-80">
                  Bulk Buying
                </span>
              </div>
              <div className="flex flex-col gap-1 mt-2">
                <span className="text-[22px] leading-tight font-display font-black text-white">Wholesaler<br/>Price Watch</span>
                <span className="text-[10px] text-[#74c69d] font-bold uppercase tracking-widest mt-1">Compare Deals & Save</span>
              </div>
            </div>

            {/* Customer Promos Widget */}
            <div 
              onClick={() => onNavigate("promos")}
              className="col-span-2 md:col-span-1 bg-[#6b2c91] border border-[#521b72] p-5 rounded-[1.5rem] shadow-sm flex flex-col justify-between cursor-pointer active:scale-95 transition-transform text-[#F5EDE0] mt-2 md:mt-0"
            >
              <div className="flex items-center gap-2 mb-2">
                 <Megaphone className="w-4 h-4 text-[#e3a6ff]" />
                 <span className="text-[10px] font-bold tracking-widest text-[#e3a6ff] uppercase opacity-80">
                  Marketing
                </span>
              </div>
              <div className="flex flex-col gap-1 mt-2">
                <span className="text-[22px] leading-tight font-display font-black text-white">Send Promos<br/>& Deals</span>
                <span className="text-[10px] text-[#e3a6ff] font-bold uppercase tracking-widest mt-1">Engage Your Customers</span>
              </div>
            </div>
            
          </div>

          {/* Ledger Summary */}
          <div className="bg-white rounded-[1.5rem] shadow-sm p-6 border border-[#E8D0BB] relative">
            <div className="relative z-10">
              <p className="text-xs font-display font-bold text-gray-500 uppercase tracking-widest mb-1">
                Total Customer Debt
              </p>
              <h3 className="text-[28px] font-display font-black tracking-tight text-[#3B1A1A] mb-6 leading-none">
                R{totalMoneyOwed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              
              <div className="flex justify-between items-end border-t border-gray-100 pt-4">
                <div>
                  <p className="text-xl font-black text-[#3B1A1A] leading-none mb-1">{owingCustomers.length}</p>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500">Owing</p>
                </div>
                <div>
                  <p className="text-xl font-black text-[#BA1A1A] leading-none mb-1">{overdueCount}</p>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500">Overdue</p>
                </div>
                <button 
                  onClick={() => onNavigate("addCredit")}
                  className="bg-[#C8521A] text-white h-11 px-4 rounded-full font-bold text-xs shadow-md flex items-center justify-center gap-1 active:scale-[0.98] transition-transform uppercase tracking-wider"
                >
                  + Add Credit
                </button>
              </div>
            </div>
          </div>

          {/* Debt Quality Snippet */}
          {owingCustomers.length > 0 && (
            <div className="bg-white rounded-2xl p-4 md:p-6 border border-[#E8D0BB] flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#F5EDE0] flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-[#3B1A1A]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#6E463B] uppercase tracking-wider mb-0.5">Oldest Unpaid Debt</p>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-[#3B1A1A]">{oldestDebtDays} days</span>
                  {oldestDebtDays > 30 && <span className="bg-[#BA1A1A] text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">High Risk</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column for Desktop */}
        <div className="space-y-6 md:mt-0">
          <div className="flex items-center justify-between">
             <h2 className="text-xs font-black text-[#3B1A1A] uppercase tracking-widest pl-1">
               Attention Required
             </h2>
             {needsAttention.length > 5 && (
               <button onClick={() => onNavigate("customers")} className="text-[10px] font-bold text-[#C8521A] uppercase tracking-wider">
                 View All
               </button>
             )}
          </div>
          
          <div className="space-y-3 pb-8 md:pb-0">
            {needsAttention.length === 0 ? (
              <div className="bg-white border border-[#E8D0BB] p-6 rounded-2xl text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-2 border border-green-100">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-bold text-[#3B1A1A]">No accounts at risk</p>
                <p className="text-xs font-bold text-[#6E463B]">All customer payments are up to date.</p>
              </div>
            ) : (
              needsAttention.slice(0, 5).map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => onViewCustomer(customer.id)}
                  className={`p-4 rounded-xl shadow-xs border cursor-pointer active:scale-[0.98] transition-transform ${
                    customer.status === "serious" ? "bg-[#FFE5D8] border-[#F8B79B]" : "bg-white border-[#E8D0BB]"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-[#3B1A1A] text-sm truncate max-w-[150px] leading-none mb-1">
                        {customer.name}
                      </h3>
                      <p className="text-xs font-bold text-[#6E463B]">
                        Owes R{customer.owed}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm ${
                      customer.status === "serious" ? "bg-[#BA1A1A] text-white" : "bg-[#f8b79b] text-[#3B1A1A]"
                    }`}>
                      {customer.status === "serious" ? "Overdue" : "Warning"}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-[10px] font-bold text-[#3B1A1A] uppercase tracking-wider opacity-80 gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{customer.daysOwing} days outstanding</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Full-Screen QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between p-4 bg-black text-white shrink-0">
            <h2 className="text-sm font-display font-bold uppercase tracking-widest">Scan Customer QR</h2>
            <button onClick={() => setShowScanner(false)} className="p-2 bg-white/20 rounded-full active:bg-white/30">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 w-full bg-black relative flex items-center justify-center overflow-hidden">
            <div className="w-full max-w-sm aspect-square relative z-10">
              <Scanner 
                onScan={handleScan}
                onError={(err) => {
                  console.error(err);
                  setScanError(`Camera error: ${err instanceof Error ? err.message : String(err)}`);
                }}
                components={{
                    audio: false,
                    onOff: true,
                    torch: true,
                    zoom: true,
                    finder: true
                }}
                styles={{
                    container: { width: '100%', height: '100%' }
                }}
              />
            </div>
          </div>
          
          <div className="p-6 bg-black text-white text-center pb-12 shrink-0 h-32">
            <p className="text-sm font-bold opacity-80">Point camera at customer's phone to identify them.</p>
            {scanError && (
              <p className="mt-4 text-xs font-bold text-[#FFDAD4] bg-[#BA1A1A] p-2 rounded-lg inline-block">
                {scanError}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
