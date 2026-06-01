import React, { useState, useEffect } from "react";
import { 
  motion 
} from "motion/react";
import { 
  LogOut, 
  Wallet, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Building, 
  Phone, 
  User, 
  History, 
  ShieldAlert, 
  Coins, 
  FileText,
  QrCode,
  X,
  Megaphone
} from "lucide-react";
import { Customer, Transaction, CreditEntry, ShopUpdate } from "../types";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface CustomerDashboardScreenProps {
  customer: Customer | null;
  transactions: Transaction[];
  creditEntries: CreditEntry[];
  shopDetails: { shopName: string; phoneNumber: string; ownerName: string } | null;
  shopId?: string;
  onLogout: () => Promise<void>;
}

export default function CustomerDashboardScreen({
  customer,
  transactions,
  creditEntries,
  shopDetails,
  shopId,
  onLogout
}: CustomerDashboardScreenProps) {
  
  const [showQrModal, setShowQrModal] = useState(false);
  const [shopUpdates, setShopUpdates] = useState<ShopUpdate[]>([]);

  useEffect(() => {
    if (!shopId) return;
    
    const fetchUpdates = async () => {
      try {
        const q = query(
          collection(db, "shop_updates"),
          where("shopId", "==", shopId)
        );
        const snap = await getDocs(q);
        const updates: ShopUpdate[] = snap.docs.map(d => d.data() as ShopUpdate);
        updates.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
          return timeB - timeA;
        });
        
        // Filter updates if targetGroup is specific
        // For owing: show if owed > 0
        // For paid: show if owed === 0
        // For all: show always
        if (customer) {
          const isOwing = customer.owed > 0;
          const filteredUpdates = updates.filter(update => {
            if (update.targetGroup === "owing" && !isOwing) return false;
            if (update.targetGroup === "paid" && isOwing) return false;
            return true;
          });
          setShopUpdates(filteredUpdates.slice(0, 5)); // Show latest 5
        } else {
          setShopUpdates(updates.slice(0, 5));
        }
      } catch (e) {
        console.error("Error fetching shop updates:", e);
      }
    };
    
    fetchUpdates();
  }, [shopId, customer?.owed]);

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[100dvh] bg-[#F5EDE0]">
        <p className="text-sm font-mono text-[#6E463B]">Checking your account...</p>
      </div>
    );
  }

  // Double check our calculations directly to protect against latency/mismatches
  const activeEntries = creditEntries.filter(c => c.remaining > 0);
  const totalAmountOwed = activeEntries.reduce((sum, entry) => sum + entry.remaining, 0);
  
  // Credit left calculation: Credit Limit - Current Amount Owed. Limit defaults to 500
  const limitValue = customer.limit || 500;
  const creditLeftSum = Math.max(0, limitValue - totalAmountOwed);

  // Status mapping and styling
  let statusBadgeColor = "bg-green-100 text-green-800 border-green-300";
  let statusText = "Good";
  let statusIcon = <CheckCircle2 className="w-4 h-4 text-green-600 mr-1" />;

  // Pause credit status check first
  const isPaused = customer.creditStatus === "paused";

  if (isPaused) {
    statusBadgeColor = "bg-[#BA1A1A]/10 text-[#BA1A1A] border-[#BA1A1A]/30";
    statusText = "Credit Paused";
    statusIcon = <ShieldAlert className="w-4 h-4 text-[#BA1A1A] mr-1" />;
  } else if (totalAmountOwed === 0) {
    statusBadgeColor = "bg-emerald-100 text-emerald-800 border-emerald-300";
    statusText = "Paid up";
    statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1" />;
  } else if (customer.daysOwing >= 15) {
    statusBadgeColor = "bg-[#BA1A1A]/10 text-[#BA1A1A] border-[#BA1A1A]/30 font-black animate-pulse";
    statusText = "Overdue";
    statusIcon = <ShieldAlert className="w-4 h-4 text-[#BA1A1A] mr-1" />;
  } else if (customer.daysOwing >= 10) {
    statusBadgeColor = "bg-amber-100 text-amber-800 border-amber-300";
    statusText = "Warning";
    statusIcon = <AlertTriangle className="w-4 h-4 text-amber-600 mr-1" />;
  }

  // Filter credit entries and payments
  const creditTxHistory = transactions.filter(t => t.type === "credit");
  const paymentTxHistory = transactions.filter(t => t.type === "payment");

  // Format money beautifully
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR"
    }).format(val);
  };

  const customerQrData = `CWE_CUSTOMER_ID_${customer.id}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(customerQrData)}`;

  return (
    <div className="w-full min-h-[100dvh] bg-[#F5EDE0] flex flex-col relative">
      {/* Header with Shop reference and logout button */}
      <header className="bg-[#3B1A1A] text-[#F5EDE0] px-6 py-5 rounded-b-[32px] shadow-lg sticky top-0 z-20">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-[#C8521A] uppercase tracking-wider">
              {shopDetails?.shopName || "Cwebezela Spaza"}
            </span>
            <h1 className="text-xl font-display font-black uppercase tracking-tight leading-none mt-1">
              {customer.name}
            </h1>
            <span className="text-[10px] font-mono text-[#F5EDE0]/60 mt-1 uppercase tracking-widest">
              ID: {customer.customerReferenceNumber || "CWE-00000"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowQrModal(true)}
              className="w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center active:scale-95 transition-transform"
              title="Show My QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button 
              onClick={onLogout}
              className="w-10 h-10 bg-[#C8521A] text-[#F5EDE0] rounded-full flex items-center justify-center active:scale-95 transition-transform"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow p-6 space-y-6">
        
        {/* Status and Summary Header */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-[#E5DACB] relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute right-[-20px] top-[-20px] w-24 h-24 bg-[#E5DACB]/30 rounded-full"></div>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-display font-medium text-[#6E463B] uppercase tracking-wider">Account Status</span>
            <div className={`px-2.5 py-1 border text-[11px] font-display font-black uppercase tracking-wide rounded-full flex items-center ${statusBadgeColor}`}>
              {statusIcon}
              {statusText}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#F5EDE0]">
            <div>
              <p className="text-[10px] font-mono text-[#6E463B] uppercase">Total Owed</p>
              <p className="text-2xl font-display font-black text-[#3B1A1A] mt-1">
                {formatMoney(totalAmountOwed)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-[#6E463B] uppercase">Credit Left</p>
              <p className="text-2xl font-display font-black text-[#C8521A] mt-1">
                {formatMoney(creditLeftSum)}
              </p>
            </div>
          </div>
        </section>

        {/* Informative notice for credit left logic */}
        {isPaused && (
          <div className="bg-[#BA1A1A]/10 border-l-4 border-[#BA1A1A] p-4 rounded-r-2xl">
            <p className="text-xs font-display font-bold text-[#BA1A1A]">
              Notice: Your credit facility has been temporarily paused by the tuckshop owner. You cannot add new credit bookings until unpaused. Still, you can pay towards your outstanding balance.
            </p>
          </div>
        )}

        {/* Core Calculation Cards */}
        <section className="grid grid-cols-2 gap-4">
          
          {/* 1. You Owe */}
          <div className="bg-white border border-[#E5DACB] rounded-2xl p-4 flex flex-col justify-between shadow-sm">
            <div className="bg-[#F5EDE0]/60 p-2 rounded-lg w-fit">
              <Wallet className="w-5 h-5 text-[#3B1A1A]" />
            </div>
            <div className="mt-4">
              <span className="text-[10px] font-mono text-[#6E463B] uppercase">You Owe</span>
              <p className="text-lg font-display font-black text-[#3B1A1A] mt-1">
                {formatMoney(totalAmountOwed)}
              </p>
            </div>
          </div>

          {/* 2. Credit Limit */}
          <div className="bg-white border border-[#E5DACB] rounded-2xl p-4 flex flex-col justify-between shadow-sm">
            <div className="bg-[#F5EDE0]/60 p-2 rounded-lg w-fit">
              <Coins className="w-5 h-5 text-[#C8521A]" />
            </div>
            <div className="mt-4">
              <span className="text-[10px] font-mono text-[#6E463B] uppercase">Credit Limit</span>
              <p className="text-lg font-display font-black text-[#3B1A1A] mt-1">
                {formatMoney(limitValue)}
              </p>
            </div>
          </div>

          {/* 3. Credit Left */}
          <div className="bg-white border border-[#E5DACB] rounded-2xl p-4 flex flex-col justify-between shadow-sm">
            <div className="bg-orange-50 p-2 rounded-lg w-fit">
              <Wallet className="w-5 h-5 text-[#C8521A]" />
            </div>
            <div className="mt-4">
              <span className="text-[10px] font-mono text-[#6E463B] uppercase">Credit Left</span>
              <p className="text-lg font-display font-black text-[#C8521A] mt-1">
                {formatMoney(creditLeftSum)}
              </p>
            </div>
          </div>

          {/* 4. Days Owing */}
          <div className="bg-white border border-[#E5DACB] rounded-2xl p-4 flex flex-col justify-between shadow-sm">
            <div className="bg-[#F5EDE0]/60 p-2 rounded-lg w-fit">
              <Calendar className="w-5 h-5 text-[#3B1A1A]" />
            </div>
            <div className="mt-4">
              <span className="text-[10px] font-mono text-[#6E463B] uppercase">Days Owing</span>
              <p className="text-lg font-display font-black text-[#3B1A1A] mt-1">
                {customer.daysOwing} {customer.daysOwing === 1 ? "day" : "days"}
              </p>
            </div>
          </div>

        </section>

        {/* 5. Shop Details Card */}
        <section className="bg-white border border-[#E5DACB] rounded-3xl p-5 shadow-sm">
          <h3 className="text-xs font-display font-bold text-[#3B1A1A] uppercase tracking-wider mb-3.5 flex items-center">
            <Building className="w-4 h-4 mr-1.5 text-[#C8521A]" />
            Shop Details
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-[#F5EDE0]">
              <span className="text-[#6E463B]">Store Name</span>
              <span className="font-bold text-[#3B1A1A]">{shopDetails?.shopName || "Cwebezela Spaza"}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-2 border-b border-[#F5EDE0]">
              <span className="text-[#6E463B]">Owner Name</span>
              <span className="font-bold text-[#3B1A1A]">{shopDetails?.ownerName || "Zola Mkhize"}</span>
            </div>
            {shopDetails?.phoneNumber && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6E463B]">Phone Number</span>
                <a 
                  href={`tel:${shopDetails.phoneNumber}`} 
                  className="font-bold text-[#C8521A] flex items-center"
                >
                  <Phone className="w-3.5 h-3.5 mr-1" />
                  {shopDetails.phoneNumber}
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Shop Updates & Promos */}
        {shopUpdates.length > 0 && (
          <section className="bg-white border border-[#E5DACB] rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-display font-bold text-[#3B1A1A] uppercase tracking-wider mb-3.5 flex items-center">
              <Megaphone className="w-4 h-4 mr-1.5 text-[#C8521A]" />
              Shop Updates & Promos
            </h3>
            <div className="space-y-3">
               {shopUpdates.map((update) => (
                 <div key={update.id} className="bg-[#F5EDE0]/30 rounded-2xl p-4 border border-[#E5DACB]/50">
                    <h4 className="font-bold text-[#3B1A1A] text-sm leading-tight">{update.title}</h4>
                    <p className="text-xs text-[#6E463B] mt-1.5 leading-relaxed">{update.message}</p>
                 </div>
               ))}
            </div>
          </section>
        )}

        {/* Historical Tabs (Credit & Payments) */}
        <section className="space-y-4">
          
          {/* Credit history list card */}
          <div className="bg-white border border-[#E5DACB] rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-display font-bold text-[#3B1A1A] uppercase tracking-wider mb-3.5 flex items-center">
              <History className="w-4 h-4 mr-1.5 text-orange-600" />
              Credit Bookings History
            </h3>
            
            {creditTxHistory.length === 0 ? (
              <p className="text-xs text-center font-mono py-4 text-[#6E463B]">No credit entries to show.</p>
            ) : (
              <div className="space-y-3 divide-y divide-[#F5EDE0] max-h-[220px] overflow-y-auto pr-1">
                {creditTxHistory.map((tx, idx) => (
                  <div key={tx.id || idx} className="flex justify-between items-start text-xs pt-3 first:pt-0">
                    <div>
                      <p className="font-bold text-[#3B1A1A] capitalize">{tx.description || "Credit item"}</p>
                      <p className="text-[10px] font-mono text-[#6E463B] mt-0.5">{tx.date}</p>
                    </div>
                    <span className="font-bold text-red-600">+{formatMoney(tx.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment history list card */}
          <div className="bg-white border border-[#E5DACB] rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-display font-bold text-[#3B1A1A] uppercase tracking-wider mb-3.5 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
              Recorded Payments
            </h3>
            
            {paymentTxHistory.length === 0 ? (
              <p className="text-xs text-center font-mono py-4 text-[#6E463B]">No recorded payments yet.</p>
            ) : (
              <div className="space-y-3 divide-y divide-[#F5EDE0] max-h-[220px] overflow-y-auto pr-1">
                {paymentTxHistory.map((tx, idx) => (
                  <div key={tx.id || idx} className="flex justify-between items-start text-xs pt-3 first:pt-0">
                    <div>
                      <p className="font-bold text-[#3B1A1A]">{tx.description || "Payment recorded"}</p>
                      <p className="text-[10px] font-mono text-[#6E463B] mt-0.5">{tx.date}</p>
                    </div>
                    <span className="font-bold text-emerald-600">-{formatMoney(tx.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </section>

      </main>
      
      {/* Footer disclaimer */}
      <footer className="p-6 text-center text-[10px] font-mono text-[#6E463B] border-t border-[#E5DACB]/60">
        This is a read-only client ledger. Please arrange credit limit changes directly with the shop owner.
      </footer>

      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-[320px] w-full p-6 text-center shadow-2xl relative animate-fade-in border border-[#E5DACB]">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center bg-[#F5EDE0] text-[#3B1A1A] rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-display font-black text-lg text-[#3B1A1A] uppercase tracking-tight mt-2 mb-1">
              My ID QR Code
            </h3>
            <p className="text-[10px] font-semibold text-[#6E463B] uppercase mb-4">
              Show this to the shop owner to scan
            </p>
            <div className="bg-slate-50 border-4 border-[#3B1A1A] rounded-2xl p-2 w-[220px] h-[220px] mx-auto mb-4">
              <img src={qrImageUrl} alt="Customer QR Code" className="w-full h-full object-contain" />
            </div>
            <p className="text-xs font-mono font-bold bg-[#FFE5D8] text-[#C8521A] py-2 rounded-xl uppercase">
              {customer.customerReferenceNumber}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
