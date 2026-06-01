import React, { useState, useEffect } from "react";
import { Store, Search, Bell, PlusCircle, AlertTriangle, TrendingUp, Users, Calendar, QrCode, X, DollarSign, Package, Tag, ShoppingCart, Megaphone, ChevronRight, HelpCircle, ArrowUpRight, ArrowDownLeft } from "lucide-react";
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
  const [todayCashSales, setTodayCashSales] = useState(0);
  const [todayCreditSales, setTodayCreditSales] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!shopId) return;

    // Load today's sales & products
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    
    const qS = query(collection(db, "sales"), where("shopId", "==", shopId));
    const unsubS = onSnapshot(qS, (snap) => {
      let total = 0;
      let cash = 0;
      let credit = 0;
      snap.forEach(d => {
        const s = d.data() as Sale;
        if (new Date(s.saleDate).getTime() >= startOfToday.getTime()) {
          total += s.totalAmount;
          if (s.paymentMethod === "credit" || s.saleType === "credit_sale") {
            credit += s.totalAmount;
          } else {
            cash += s.totalAmount;
          }
        }
      });
      setTodaySalesTotal(total);
      setTodayCashSales(cash);
      setTodayCreditSales(credit);
    });

    // Load low stock products
    const qP = query(collection(db, "products"), where("shopId", "==", shopId));
    const unsubP = onSnapshot(qP, (snap) => {
      const items: Product[] = [];
      snap.forEach(d => {
        const p = d.data() as Product;
        if (p.stockQuantity <= p.lowStockLevel) {
          items.push({ ...p, id: d.id });
        }
      });
      setLowStockCount(items.length);
      setLowStockProducts(items);
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

  // Calculations for dashboard indicators
  const owingCustomers = customers.filter(c => c.owed > 0);
  const totalMoneyOwed = owingCustomers.reduce((acc, c) => acc + c.owed, 0);
  const overdueCustomers = owingCustomers.filter(c => c.daysOwing >= 15);
  const overdueCount = overdueCustomers.length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayFormatted = formatTxDate(todayStr);
  const collectedToday = transactions
    .filter(t => t.type === "payment" && (t.date === todayFormatted || t.date.includes(todayStr)))
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="min-h-screen bg-[#FBF5EC] pb-24 relative">
      
      {/* Top Professional Header Wrapper */}
      <header className="w-full pt-5 px-5 bg-white border-b border-[#2B1114]/8 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Logo Shop Mark */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E95A13] to-[#C9460B] flex items-center justify-center shadow-xs">
              <span className="text-white font-extrabold text-sm tracking-tight font-display">ST</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-text-light uppercase tracking-wider block">Spaza Tap Portal</span>
              {/* Dropdown switch / static pill styled shop switcher */}
              <div className="flex items-center gap-1 cursor-pointer hover:opacity-80">
                <h1 className="text-sm font-extrabold text-text-main uppercase font-display select-none">
                  {shopName || "Spaza Tap"}
                </h1>
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" title="Online" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* QR Scan Button */}
            <button 
              onClick={() => { setShowScanner(true); setScanError(""); }}
              className="p-2.5 bg-[#FFF0E7] text-[#D94F12] border border-primary/20 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              title="Scan Customer Card"
            >
              <QrCode className="w-4.5 h-4.5" />
            </button>

            {/* Notification Alert icon */}
            <button
              onClick={() => onNavigate("customerAccessRequests")}
              className="p-2.5 bg-[#F1EBE4] text-[#2B1114] rounded-full flex items-center justify-center relative active:scale-95 transition-transform"
            >
              <Bell className="w-4.5 h-4.5" />
              {pendingRequestsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D94F12] animate-bounce" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-5 mt-5 space-y-5">
        
        {/* Pending Requests Alert banner if pendingRequests > 0 */}
        {pendingRequestsCount > 0 && (
          <div 
            onClick={() => onNavigate("customerAccessRequests")}
            className="flex items-center justify-between p-4 bg-[#FFE9E8] border border-danger-bg rounded-[18px] cursor-pointer active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
              <p className="text-xs font-bold text-danger">
                {pendingRequestsCount === 1 
                  ? "1 customer awaiting access approval" 
                  : `${pendingRequestsCount} customers awaiting access approval`}
              </p>
            </div>
            <span className="text-[10px] uppercase font-bold text-danger bg-white/70 px-2 py-1 rounded-md">Review</span>
          </div>
        )}

        {/* Horizontal Quick Actions Slider section */}
        <section className="space-y-2">
          <h3 className="text-xs font-black text-text-muted uppercase tracking-wider select-none pl-1">
            Quick Actions
          </h3>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
            
            <button 
              onClick={() => onNavigate("till")}
              className="px-4.5 py-3.5 bg-[#D94F12] text-white rounded-2xl flex items-center gap-2 shrink-0 active:scale-95 transition-transform font-bold text-xs shadow-xs"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>New Sale</span>
            </button>

            <button 
              onClick={() => onNavigate("newCustomer")}
              className="px-4.5 py-3.5 bg-burgundy text-white rounded-2xl flex items-center gap-2 shrink-0 active:scale-95 transition-transform font-bold text-xs"
            >
              <PlusCircle className="w-4 h-4 text-primary" />
              <span>Add Customer</span>
            </button>

            <button 
              onClick={() => onNavigate("addCredit")}
              className="px-4.5 py-3.5 bg-white border border-text-main/10 text-text-main rounded-2xl flex items-center gap-2 shrink-0 active:scale-95 transition-transform font-bold text-xs"
            >
              <DollarSign className="w-4 h-4 text-primary" />
              <span>Add Credit</span>
            </button>

            <button 
              onClick={() => onNavigate("customers")}
              className="px-4.5 py-3.5 bg-white border border-text-main/10 text-text-main rounded-2xl flex items-center gap-2 shrink-0 active:scale-95 transition-transform font-bold text-xs"
            >
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Record Payment</span>
            </button>

            <button 
              onClick={() => onNavigate("reports")}
              className="px-4.5 py-3.5 bg-white border border-text-main/10 text-text-main rounded-2xl flex items-center gap-2 shrink-0 active:scale-95 transition-transform font-bold text-xs"
            >
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>Reports</span>
            </button>
            
          </div>
        </section>

        {/* 2-Column Grid for Stats - exact matches */}
        <section className="space-y-2">
          <h3 className="text-xs font-black text-text-muted uppercase tracking-wider select-none pl-1">
            Shop Performance
          </h3>
          <div className="grid grid-cols-2 gap-3.5">
            
            {/* Today's Sales */}
            <div 
              onClick={() => onNavigate("sales")}
              className="bg-white border border-text-main/5 rounded-[22px] p-4 min-h-[132px] flex flex-col justify-between cursor-pointer active:scale-98 transition-transform shadow-xs"
            >
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Today's Sales</span>
              <div className="my-1.5">
                <span className="text-2xl font-black text-text-main block">R{todaySalesTotal.toFixed(2)}</span>
              </div>
              <span className="text-[10px] text-[#D94F12] font-semibold flex items-center gap-0.5">
                View Ledger <ChevronRight className="w-3 h-3" />
              </span>
            </div>

            {/* Cash Sales */}
            <div 
              onClick={() => onNavigate("sales")}
              className="bg-white border border-text-main/5 rounded-[22px] p-4 min-h-[132px] flex flex-col justify-between cursor-pointer active:scale-98 transition-transform shadow-xs"
            >
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Cash Sales</span>
              <div className="my-1.5">
                <span className="text-2xl font-black text-emerald-600 block">R{todayCashSales.toFixed(2)}</span>
              </div>
              <span className="text-[10px] text-text-light font-extrabold font-mono uppercase tracking-widest block">Non-Credit</span>
            </div>

            {/* Credit Sales */}
            <div 
              onClick={() => onNavigate("sales")}
              className="bg-white border border-text-main/5 rounded-[22px] p-4 min-h-[132px] flex flex-col justify-between cursor-pointer active:scale-98 transition-transform shadow-xs"
            >
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Credit Sales</span>
              <div className="my-1.5">
                <span className="text-2xl font-black text-[#D94F12] block">R{todayCreditSales.toFixed(2)}</span>
              </div>
              <span className="text-[10px] text-text-light font-extrabold font-mono uppercase tracking-widest block">Active Tabs</span>
            </div>

            {/* Customer Payments */}
            <div 
              onClick={() => onNavigate("reports")}
              className="bg-white border border-text-main/5 rounded-[22px] p-4 min-h-[132px] flex flex-col justify-between cursor-pointer active:scale-98 transition-transform shadow-xs"
            >
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Customer Payments</span>
              <div className="my-1.5">
                <span className="text-2xl font-black text-purple-600 block">R{collectedToday.toFixed(2)}</span>
              </div>
              <span className="text-[10px] text-text-light font-extrabold font-mono uppercase tracking-widest block">Collected Today</span>
            </div>

            {/* Stock Alerts */}
            <div 
              onClick={() => onNavigate("stock")}
              className="bg-white border border-text-main/5 rounded-[22px] p-4 min-h-[132px] flex flex-col justify-between cursor-pointer active:scale-98 transition-transform shadow-xs"
            >
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Stock Alerts</span>
              <div className="my-1.5">
                <span className={`text-2xl font-black block ${lowStockCount > 0 ? "text-[#C9312C]" : "text-text-main"}`}>
                  {lowStockCount}
                </span>
              </div>
              <span className="text-[10px] text-[#C9312C] font-semibold flex items-center gap-0.5">
                {lowStockCount > 0 ? "Check Low Stock" : "All levels good"} <ChevronRight className="w-3 h-3" />
              </span>
            </div>

            {/* Total Customer Debt */}
            <div 
              onClick={() => onNavigate("customers")}
              className="bg-white border border-text-main/5 rounded-[22px] p-4 min-h-[132px] flex flex-col justify-between cursor-pointer active:scale-98 transition-transform shadow-xs"
            >
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Total Customer Debt</span>
              <div className="my-1.5">
                <span className="text-2xl font-black text-text-main block">
                  R{totalMoneyOwed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <span className="text-[10px] text-text-light font-extrabold font-mono uppercase tracking-wide block">
                {owingCustomers.length} Customers Owing
              </span>
            </div>

          </div>
        </section>

        {/* Attention Required Layout Section (Full width, Overdue Customers + Low Stock Items) */}
        <section className="space-y-2">
          <h3 className="text-xs font-black text-text-muted uppercase tracking-wider select-none pl-1">
            Attention Required
          </h3>

          <div className="bg-white border border-[#2B1114]/8 p-5 rounded-[24px] shadow-xs space-y-4">
            
            {/* Overdue Section */}
            <div>
              <div className="flex items-center justify-between border-b border-text-main/5 pb-2.5 mb-2.5">
                <h4 className="text-xs font-black text-text-main uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-danger inline-block" />
                  Overdue Accounts ({overdueCount})
                </h4>
                {overdueCount > 0 && (
                  <button onClick={() => onNavigate("customers")} className="text-[10px] font-bold text-[#D94F12] uppercase tracking-wider">
                    View All
                  </button>
                )}
              </div>

              {overdueCount === 0 ? (
                <p className="text-xs text-text-muted font-sans font-semibold leading-relaxed">No customers are overdue on payments. Keep it up! 🎉</p>
              ) : (
                <div className="space-y-2">
                  {owingCustomers.filter(c => c.daysOwing >= 15).slice(0, 3).map((cust) => (
                    <div 
                      key={cust.name} 
                      onClick={() => {
                        // find customer id matches or navigate to list
                        onNavigate("customers");
                      }}
                      className="flex items-center justify-between p-2.5 bg-danger-bg rounded-[14px] cursor-pointer active:scale-98 transition-transform"
                    >
                      <div>
                        <span className="text-xs font-bold text-text-main block">{cust.name}</span>
                        <span className="text-[10px] font-mono text-danger font-extrabold">{cust.daysOwing} Days Owed</span>
                      </div>
                      <span className="text-xs font-bold text-text-main bg-white px-2.5 py-1.5 rounded-lg border border-text-main/5">R{cust.owed.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low Stock Items Section */}
            <div>
              <div className="flex items-center justify-between border-b border-text-main/5 pb-2.5 mb-2.5">
                <h4 className="text-xs font-black text-text-main uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-warning inline-block" />
                  Low Stock Products ({lowStockCount})
                </h4>
                {lowStockCount > 0 && (
                  <button onClick={() => onNavigate("stock")} className="text-[10px] font-bold text-[#D94F12] uppercase tracking-wider">
                    View list
                  </button>
                )}
              </div>

              {lowStockCount === 0 ? (
                <p className="text-xs text-text-muted font-sans font-semibold leading-relaxed">All products are healthy. Double-check in inventory.</p>
              ) : (
                <div className="space-y-2">
                  {lowStockProducts.slice(0, 3).map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => onNavigate("stock")}
                      className="flex items-center justify-between p-2.5 bg-warning-bg rounded-[14px] cursor-pointer active:scale-98 transition-transform"
                    >
                      <div>
                        <span className="text-xs font-bold text-text-main block">{p.name}</span>
                        <span className="text-[10px] font-mono text-warning font-extrabold">{p.stockQuantity} left</span>
                      </div>
                      <span className="text-xs font-bold text-text-main bg-white px-2.5 py-1.5 rounded-lg border border-text-main/5">Limit: {p.lowStockLevel}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </section>

        {/* Hub and Supplier Extra navigation widgets */}
        <div className="grid grid-cols-2 gap-3 pb-8">
          
          <div 
            onClick={() => onNavigate("hub")}
            className="bg-white border border-text-main/8 p-3.5 rounded-2xl cursor-pointer active:scale-95 transition-transform text-left"
          >
            <div className="flex items-center gap-1.5 text-orange-600 mb-1">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span className="text-[9px] font-bold tracking-wider uppercase">Compliance Hub</span>
            </div>
            <span className="text-xs font-bold leading-tight block text-text-main">Tasks & Compliance</span>
          </div>

          <div 
            onClick={() => onNavigate("priceWatch")}
            className="bg-white border border-text-main/8 p-3.5 rounded-2xl cursor-pointer active:scale-95 transition-transform text-left"
          >
            <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span className="text-[9px] font-bold tracking-wider uppercase">Price Watch</span>
            </div>
            <span className="text-xs font-bold leading-tight block text-text-main">Wholesaler Price Watch</span>
          </div>

        </div>

      </main>

      {/* Full-Screen Scanner Modal */}
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
