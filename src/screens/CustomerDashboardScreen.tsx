import React, { useState, useEffect } from "react";
import { 
  LogOut, 
  Wallet, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Building, 
  Phone, 
  History, 
  ShieldAlert, 
  Coins, 
  X,
  Megaphone,
  QrCode
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
        
        if (customer) {
          const isOwing = customer.owed > 0;
          const filteredUpdates = updates.filter(update => {
            if (update.targetGroup === "owing" && !isOwing) return false;
            if (update.targetGroup === "paid" && isOwing) return false;
            return true;
          });
          setShopUpdates(filteredUpdates.slice(0, 5));
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
      <div className="flex flex-col items-center justify-center p-8 min-h-[100dvh] bg-[#FBF5EC]">
        <p className="text-xs font-bold text-text-muted uppercase tracking-widest animate-pulse">Retrieving customer account details...</p>
      </div>
    );
  }

  const activeEntries = creditEntries.filter(c => c.remaining > 0);
  const totalAmountOwed = activeEntries.reduce((sum, entry) => sum + entry.remaining, 0);
  
  const limitValue = customer.limit || 500;
  const creditLeftSum = Math.max(0, limitValue - totalAmountOwed);

  // Status mapping and styling
  let statusBadgeColor = "bg-emerald-50 text-emerald-600 border-emerald-200/50";
  let statusText = "Good Status";
  let statusIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;

  const isPaused = customer.creditStatus === "paused";

  if (isPaused) {
    statusBadgeColor = "bg-red-50 text-red-600 border-red-200/50";
    statusText = "Credit Paused";
    statusIcon = <ShieldAlert className="w-3.5 h-3.5 text-red-600" />;
  } else if (totalAmountOwed === 0) {
    statusBadgeColor = "bg-emerald-50 text-emerald-600 border-emerald-200/50";
    statusText = "Paid up";
    statusIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
  } else if (customer.daysOwing >= 15) {
    statusBadgeColor = "bg-red-50 text-red-600 border-red-200/50";
    statusText = "Overdue Tab";
    statusIcon = <ShieldAlert className="w-3.5 h-3.5 text-red-600" />;
  } else if (customer.daysOwing >= 10) {
    statusBadgeColor = "bg-amber-50 text-amber-600 border-amber-200/50";
    statusText = "Warning Alert";
    statusIcon = <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
  }

  const creditTxHistory = transactions.filter(t => t.type === "credit");
  const paymentTxHistory = transactions.filter(t => t.type === "payment");

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR"
    }).format(val);
  };

  const customerQrData = `CWE_CUSTOMER_ID_${customer.id}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(customerQrData)}`;

  return (
    <div className="w-full min-h-[100dvh] bg-[#FBF5EC] flex flex-col relative text-text-main font-sans pb-16">
      
      {/* Redesigned Customer Top Header */}
      <header className="bg-white border-b border-[#2B1114]/8 px-5 py-5 sticky top-0 z-20">
        <div className="flex justify-between items-center">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider leading-none">
              {shopDetails?.shopName || "Spaza Tap Account"}
            </span>
            <h1 className="text-xl font-black text-text-main font-display uppercase tracking-tight mt-1.5 leading-none truncate">
              {customer.name}
            </h1>
            <span className="text-[9px] font-mono font-bold text-text-light mt-1.5 uppercase tracking-wider leading-none">
              REF CODE: {customer.customerReferenceNumber || "SPT-00000"}
            </span>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setShowQrModal(true)}
              className="w-10 h-10 bg-[#FFF0E7] text-[#D94F12] border border-primary/20 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              title="Show ID Card"
            >
              <QrCode className="w-4.5 h-4.5" />
            </button>
            <button 
              onClick={onLogout}
              className="w-10 h-10 bg-[#F1EBE4] text-text-main rounded-full flex items-center justify-center active:scale-95 transition-transform"
              title="Logout Portal"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main dashboard viewport */}
      <main className="flex-grow p-5 space-y-5">
        
        {/* Core Account overview ledger */}
        <section className="bg-white rounded-[24px] p-5 border border-[#2B1114]/8 relative overflow-hidden shadow-2xs">
          
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-text-main/5">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">Tab Status</span>
            <div className={`px-3 py-1 border text-[10px] font-extrabold uppercase tracking-wide rounded-full flex items-center gap-1.5 ${statusBadgeColor}`}>
              {statusIcon}
              <span>{statusText}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-black text-text-muted uppercase tracking-wider block">Total Outstanding</span>
              <p className="text-2xl font-black text-text-main font-display mt-1.5 leading-none">
                {formatMoney(totalAmountOwed)}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-black text-text-[#D94F12] uppercase tracking-wider block">Credit Left</span>
              <p className="text-2xl font-black text-[#D94F12] font-display mt-1.5 leading-none">
                {formatMoney(creditLeftSum)}
              </p>
            </div>
          </div>
        </section>

        {/* Warning card when paused */}
        {isPaused && (
          <div className="bg-red-50 border border-red-200/50 p-4.5 rounded-[18px] flex gap-3">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-red-800 leading-normal">
              Notice: Your credit bookings have been paused by the shop manager. You cannot register new credit sales until facility is unpaused. You can still pay towards your due balance anytime.
            </p>
          </div>
        )}

        {/* BENTO Grid breakdown stats list */}
        <section className="grid grid-cols-2 gap-4">
          
          {/* 1. Outstand Card */}
          <div className="bg-white border border-[#2B1114]/8 rounded-[22px] p-4.5 flex flex-col justify-between shadow-2xs">
            <div className="bg-[#FFF0E7] p-2 rounded-xl w-fit">
              <Wallet className="w-5 h-5 text-[#D94F12]" />
            </div>
            <div className="mt-4">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-wider block">Outstanding</span>
              <p className="text-lg font-black text-text-main font-display mt-1 leading-none">
                {formatMoney(totalAmountOwed)}
              </p>
            </div>
          </div>

          {/* 2. Facility limit Card */}
          <div className="bg-white border border-[#2B1114]/8 rounded-[22px] p-4.5 flex flex-col justify-between shadow-2xs">
            <div className="bg-[#FFF0E7] p-2 rounded-xl w-fit">
              <Coins className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="mt-4">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-wider block">Credit Limit</span>
              <p className="text-lg font-black text-text-main font-display mt-1 leading-none">
                {formatMoney(limitValue)}
              </p>
            </div>
          </div>

          {/* 3. Credit left Card */}
          <div className="bg-white border border-[#2B1114]/8 rounded-[22px] p-4.5 flex flex-col justify-between shadow-2xs">
            <div className="bg-[#FFF0E7] p-2 rounded-xl w-fit">
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="mt-4">
              <span className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider block">Remaining Credit</span>
              <p className="text-lg font-black text-[#D94F12] font-display mt-1 leading-none">
                {formatMoney(creditLeftSum)}
              </p>
            </div>
          </div>

          {/* 4. Days outstanding Card */}
          <div className="bg-white border border-[#2B1114]/8 rounded-[22px] p-4.5 flex flex-col justify-between shadow-2xs">
            <div className="bg-[#FFF0E7] p-2 rounded-xl w-fit">
              <Calendar className="w-5 h-5 text-[#D94F12]" />
            </div>
            <div className="mt-4">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-wider block">Days Outstanding</span>
              <p className="text-lg font-black text-text-main font-display mt-1 leading-none">
                {customer.daysOwing} {customer.daysOwing === 1 ? "Day" : "Days"}
              </p>
            </div>
          </div>

        </section>

        {/* 5. Shop owner contacts card */}
        <section className="bg-white border border-[#2B1114]/8 rounded-[24px] p-5 shadow-2xs">
          <h3 className="text-xs font-black text-text-main uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Building className="w-4.5 h-4.5 text-[#D94F12]" />
            Store Contact Numbers
          </h3>
          <div className="space-y-3.5">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-text-main/5">
              <span className="font-bold text-text-muted uppercase text-[9px] tracking-wider">Shop Name</span>
              <span className="font-bold text-text-main uppercase">{shopDetails?.shopName || "Spaza Shop"}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-2 border-b border-text-main/5">
              <span className="font-bold text-text-muted uppercase text-[9px] tracking-wider">Manager</span>
              <span className="font-bold text-text-main">{shopDetails?.ownerName || "Zola Mkhize"}</span>
            </div>
            {shopDetails?.phoneNumber && (
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-text-muted uppercase text-[9px] tracking-wider">Phone Call</span>
                <a 
                  href={`tel:${shopDetails.phoneNumber}`} 
                  className="font-extrabold text-[#D94F12] flex items-center border-b border-[#D94F12]/30 pb-0.5"
                >
                  <Phone className="w-3.5 h-3.5 mr-1" />
                  {shopDetails.phoneNumber}
                </a>
              </div>
            )}
          </div>
        </section>

        {/* 6. Promos Updates cards listings */}
        {shopUpdates.length > 0 && (
          <section className="bg-white border border-[#2B1114]/8 rounded-[24px] p-5 shadow-2xs">
            <h3 className="text-xs font-black text-text-main uppercase tracking-wider mb-3.5 flex items-center gap-1.5 animate-pulse">
              <Megaphone className="w-4.5 h-4.5 text-[#D94F12]" />
              Store Updates & Announcements
            </h3>
            <div className="space-y-3">
               {shopUpdates.map((update) => (
                 <div key={update.id} className="bg-[#FFEFE2] rounded-2xl p-4 border border-[#ffdbbc]">
                    <h4 className="font-black text-text-main text-xs uppercase tracking-tight leading-tight">{update.title}</h4>
                    <p className="text-xs text-[#A63F10] font-bold mt-1.5 leading-relaxed">{update.message}</p>
                 </div>
               ))}
            </div>
          </section>
        )}

        {/* 7. Detailed transaction histories tabs */}
        <section className="space-y-4">
          
          {/* Credit purchases booking list */}
          <div className="bg-white border border-[#2B1114]/8 rounded-[24px] p-5 shadow-2xs">
            <h3 className="text-xs font-black text-text-main uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <History className="w-4.5 h-4.5 text-[#D94F12]" />
              Debtor Bookings Ledger
            </h3>
            
            {creditTxHistory.length === 0 ? (
              <p className="text-xs text-center italic py-6 text-text-light font-medium bg-[#FBF5EC] rounded-2xl border border-text-main/5">No credit orders registered yet.</p>
            ) : (
              <div className="space-y-3 divide-y divide-text-main/5 max-h-[220px] overflow-y-auto pr-1">
                {creditTxHistory.map((tx, idx) => (
                  <div key={tx.id || idx} className="flex justify-between items-start text-xs pt-3 first:pt-0">
                    <div>
                      <p className="font-extrabold text-text-main uppercase tracking-tight">{tx.description || "Credit purchase order"}</p>
                      <p className="text-[9px] font-mono font-bold text-text-light mt-0.5">{tx.date}</p>
                    </div>
                    <span className="font-black text-danger">+{formatMoney(tx.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payments list history */}
          <div className="bg-white border border-[#2B1114]/8 rounded-[24px] p-5 shadow-2xs">
            <h3 className="text-xs font-black text-text-main uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
              Recorded Payments Logs
            </h3>
            
            {paymentTxHistory.length === 0 ? (
              <p className="text-xs text-center italic py-6 text-text-light font-medium bg-[#FBF5EC] rounded-2xl border border-text-main/5">No payments recorded yet.</p>
            ) : (
              <div className="space-y-3 divide-y divide-text-main/5 max-h-[220px] overflow-y-auto pr-1">
                {paymentTxHistory.map((tx, idx) => (
                  <div key={tx.id || idx} className="flex justify-between items-start text-xs pt-3 first:pt-0">
                    <div>
                      <p className="font-extrabold text-text-main uppercase tracking-tight">{tx.description || "Cash payment"}</p>
                      <p className="text-[9px] font-mono font-bold text-text-light mt-0.5">{tx.date}</p>
                    </div>
                    <span className="font-black text-emerald-600">-{formatMoney(tx.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </section>

      </main>
      
      {/* Footer message built by Ntombii Tech */}
      <footer className="p-6 text-center text-[10px] font-bold text-text-light border-t border-[#2B1114]/5 space-y-1">
        <p>This is a read-only customer terminal. For limit changes, speak to the store manager directly.</p>
        <p className="text-[9px] tracking-wider text-text-muted mt-2">BUILT BY NTOMBII TECH</p>
      </footer>

      {/* CUSTOMER PROFILE QR CARD MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white rounded-[28px] max-w-[320px] w-full p-6 text-center shadow-2xl relative border border-[#2B1114]/8">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center bg-[#FBF5EC] text-text-main rounded-full font-bold active:scale-95 transition-transform"
            >
              ✕
            </button>
            <h3 className="font-display font-black text-base text-text-main uppercase tracking-tight mt-2 mb-1">
              My ID Access Card
            </h3>
            <p className="text-[10px] font-bold text-text-light uppercase tracking-wider mb-4">
              Present this code for the shop till scanner
            </p>
            <div className="bg-slate-50 border-4 border-text-main rounded-[18px] p-2.5 w-[190px] h-[190px] mx-auto mb-4 flex items-center justify-center">
              <img src={qrImageUrl} alt="Customer QR Code" className="w-full h-full object-contain" />
            </div>
            <p className="text-xs font-mono font-black bg-[#FFF0E7] text-[#D94F12] py-2 rounded-xl uppercase tracking-wider">
              {customer.customerReferenceNumber}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
