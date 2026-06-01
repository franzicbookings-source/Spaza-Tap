import React, { useState } from "react";
import { ScreenState } from "../types";
import {
  ShoppingBag,
  Phone,
  Lock,
  MessageSquare,
  LogOut,
  ChevronRight,
  Coins,
  Smartphone,
  Check,
  User,
  Save,
  HelpCircle,
  X,
  QrCode,
  Users,
  ShieldCheck,
  Calendar,
  Key,
  RefreshCw
} from "lucide-react";

interface SettingsScreenProps {
  shopName: string;
  ownerName: string;
  phone: string;
  defaultLimit: number;
  whatsappTemplate: string;
  onSaveSettings: (data: {
    shopName: string;
    ownerName: string;
    phone: string;
    defaultLimit: number;
    whatsappTemplate: string;
  }) => void;
  onLogout: () => void;
  pendingRequestsCount?: number;
  onNavigateToQr?: () => void;
  onNavigateToRequests?: () => void;
  onNavigateToScreen?: (screen: ScreenState) => void;
  authEmail?: string | null;
  authUid?: string | null;
  authProvider?: string | null;
  shopId?: string | null;
  userRole?: string | null;
  lastLoginAt?: string | null;
  onRunRepairTool?: () => void;
}

export default function SettingsScreen({
  shopName,
  ownerName,
  phone,
  defaultLimit,
  whatsappTemplate,
  onSaveSettings,
  onLogout,
  pendingRequestsCount = 0,
  onNavigateToQr = () => {},
  onNavigateToRequests = () => {},
  onNavigateToScreen = () => {},
  authEmail = "",
  authUid = "",
  authProvider = "Email",
  shopId = "",
  userRole = "Shop Owner",
  lastLoginAt = "",
  onRunRepairTool
}: SettingsScreenProps) {
  // Local editable states initialized with current props
  const [localShopName, setLocalShopName] = useState(shopName || "");
  const [localOwnerName, setLocalOwnerName] = useState(ownerName || "");
  const [localPhone, setLocalPhone] = useState(phone || "");
  const [localLimit, setLocalLimit] = useState((defaultLimit !== undefined && defaultLimit !== null) ? defaultLimit.toString() : "500");
  const [localTemplate, setLocalTemplate] = useState(whatsappTemplate || "");

  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showPwaGuide, setShowPwaGuide] = useState(false);

  const initials = localOwnerName
    ? localOwnerName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
    : "ZM";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStatus("saving");

    onSaveSettings({
      shopName: localShopName.trim(),
      ownerName: localOwnerName.trim(),
      phone: localPhone.trim(),
      defaultLimit: parseFloat(localLimit) || 500,
      whatsappTemplate: localTemplate.trim()
    });

    setTimeout(() => {
      setSavingStatus("saved");
      setTimeout(() => {
        setSavingStatus("idle");
      }, 1500);
    }, 600);
  };

  return (
    <div className="w-full min-h-screen bg-[#F5EDE0] flex flex-col pb-28 font-sans">
      <header className="w-full pt-12 pb-6 px-6">
        <div className="max-w-[480px] md:max-w-2xl lg:max-w-4xl mx-auto">
          <h1 className="text-[26px] md:text-3xl font-display font-black text-[#3B1A1A] leading-none uppercase tracking-tighter">
            Shop Settings
          </h1>
        </div>
      </header>

      <main className="max-w-[480px] md:max-w-4xl lg:max-w-6xl mx-auto w-full flex-1 flex flex-col px-6">
        <div className="md:grid md:grid-cols-[1fr_2fr] lg:grid-cols-[1fr_2.5fr] md:gap-8 flex-col flex space-y-6 md:space-y-0">
          
          {/* Left Column */}
          <div className="space-y-6">
            {/* Profile Card */}
            <section className="bg-[#C8521A] rounded-[2rem] flex flex-col items-center justify-center p-6 shadow-xl text-center">
              <div className="w-14 h-14 rounded-full bg-[#F5EDE0] flex items-center justify-center text-[#C8521A] font-display font-black text-xl mb-3 shadow animate-fade-in">
                {initials}
              </div>
              <h2 className="text-lg font-display font-black text-[#F5EDE0] uppercase tracking-tighter leading-none mb-1">
                {localShopName || "My Shop"}
              </h2>
              <p className="text-xs font-bold text-white/80">{localOwnerName || "Owner Account"}</p>
            </section>

            {/* Account Info Card */}
            <section className="space-y-3">
              <p className="text-xs font-display font-black text-[#3B1A1A] tracking-wider uppercase pl-1">
                Developer Identity Info
              </p>
              <div className="bg-white border border-[#E8D0BB] p-4 rounded-2xl flex flex-col gap-3 shadow-xs font-mono text-[10px]">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-indigo-500"/> System UID</span>
                  <span className="font-extrabold text-[#3B1A1A]">{authUid ? `${authUid.substring(0, 8)}...` : 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1"><Key className="w-3 h-3 text-indigo-500"/> Auth Log</span>
                  <span className="font-extrabold text-[#3B1A1A] max-w-[120px] truncate" title={authEmail || ''}>{authEmail}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1"><ShoppingBag className="w-3 h-3 text-indigo-500"/> DB Shop ID</span>
                  <span className="font-extrabold text-[#3B1A1A] text-[9px] bg-slate-100 px-1.5 py-0.5 rounded">{shopId || 'None'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3 text-indigo-500"/> Date / Provider</span>
                  <span className="font-extrabold text-[#3B1A1A]">{lastLoginAt} - {authProvider}</span>
                </div>
                {onRunRepairTool && (
                  <button 
                    onClick={onRunRepairTool}
                    type="button" 
                    className="mt-2 w-full bg-slate-100 text-[#3B1A1A] py-2 rounded font-bold uppercase tracking-widest text-[10px] active:bg-slate-200 border border-slate-300"
                  >
                    Scan & Fix Duplicate Data
                  </button>
                )}
              </div>
            </section>

            {/* Customer Access QR & Approvals Section */}
            <section className="space-y-3">
              <p className="text-xs font-display font-black text-[#3B1A1A] tracking-wider uppercase pl-1">
                Customer Tools
              </p>

              <div
                onClick={onNavigateToQr}
                className="bg-[#f9ede0] border border-[#E8D0BB] p-4 rounded-2xl flex items-center justify-between active:scale-95 transition-transform cursor-pointer shadow-xs animate-fade-in"
              >
                <div className="flex items-center">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center mr-3 shrink-0">
                    <QrCode className="w-4 h-4 text-[#C8521A]" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-extrabold text-[#3B1A1A]">
                      QR Poster
                    </span>
                  </div>
                </div>
                <ChevronRight className="text-[#C8521A] w-4 h-4 shrink-0" />
              </div>

              <div
                onClick={onNavigateToRequests}
                className="bg-[#f9ede0] border border-[#E8D0BB] p-4 rounded-2xl flex items-center justify-between active:scale-95 transition-transform cursor-pointer shadow-xs relative animate-fade-in"
              >
                <div className="flex items-center">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center mr-3 shrink-0">
                    <Users className="w-4 h-4 text-[#C8521A]" />
                  </div>
                  <div className="flex flex-col text-left max-w-[120px]">
                    <span className="text-xs font-extrabold text-[#3B1A1A] flex items-center gap-1.5 leading-none">
                      <span>Requests</span>
                      {pendingRequestsCount > 0 && (
                        <span className="bg-[#BA1A1A] text-white text-[9px] font-display font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                          {pendingRequestsCount} Pending
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <ChevronRight className="text-[#C8521A] w-4 h-4 shrink-0" />
              </div>
            </section>

            {/* Compliance Hub Section */}
            <section className="space-y-3">
              <p className="text-xs font-display font-black text-[#3B1A1A] tracking-wider uppercase pl-1">
                Northern KZN Help
              </p>

              <div
                onClick={() => onNavigateToScreen("hub")}
                className="bg-[#3B1A1A] border border-[#3B1A1A] p-4 rounded-2xl flex items-center justify-between active:scale-95 transition-transform cursor-pointer shadow-xs animate-fade-in"
              >
                <div className="flex items-center">
                  <div className="w-9 h-9 rounded-full bg-[#F5EDE0] flex items-center justify-center mr-3 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#3B1A1A]"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path></svg>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-extrabold text-[#F5EDE0]">
                      Help & Compliance Hub
                    </span>
                    <span className="text-[10px] text-[#F5EDE0]/70 font-bold">
                      Permits, docs, alerts
                    </span>
                  </div>
                </div>
                <ChevronRight className="text-[#F5EDE0] w-4 h-4 shrink-0" />
              </div>
            </section>

            {/* Platform Analytics for Creator */}
            <section className="space-y-3">
              <p className="text-xs font-display font-black text-[#3B1A1A] tracking-wider uppercase pl-1">
                Website Owner Tools
              </p>
              <div
                onClick={() => onNavigateToScreen("platform_analytics")}
                className="bg-[#C8521A] border border-[#C8521A] p-4 rounded-2xl flex items-center justify-between active:scale-95 transition-transform cursor-pointer shadow-md animate-fade-in"
                id="btn-platform-analytics"
              >
                <div className="flex items-center">
                  <div className="w-9 h-9 rounded-full bg-[#F5EDE0] flex items-center justify-center mr-3 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#C8521A] w-4 h-4"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-extrabold text-[#F5EDE0]">
                      Platform Analytics Panel
                    </span>
                    <span className="text-[10px] text-[#F5EDE0]/85 font-mono">
                      {authEmail === "franzic.bookings@gmail.com" 
                        ? "Creator Access Verified" 
                        : "Developer Demo Mode"}
                    </span>
                  </div>
                </div>
                <ChevronRight className="text-[#F5EDE0] w-4 h-4 shrink-0" />
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div>
            {/* Mobile-Only Navigation Hub */}
            <section className="space-y-3 mb-6 md:hidden animate-fade-in delay-100">
              <p className="text-xs font-display font-black text-[#3B1A1A] tracking-wider uppercase pl-1">
                Shop Management
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => onNavigateToScreen("hub")} className="bg-[#f9ede0] border border-[#E8D0BB] p-3 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform shadow-xs col-span-2">
                   <div className="w-8 h-8 rounded-full bg-[#3B1A1A] flex items-center justify-center">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F5EDE0]"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path></svg>
                   </div>
                   <span className="text-xs font-extrabold text-[#3B1A1A]">Help & Compliance Hub</span>
                 </button>

                 <button onClick={() => onNavigateToScreen("sales")} className="bg-[#f9ede0] border border-[#E8D0BB] p-3 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform shadow-xs">
                   <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#C8521A]"><line x1="12" y1="2" x2="12" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                   </div>
                   <span className="text-xs font-extrabold text-[#3B1A1A]">Sales</span>
                 </button>

                 <button onClick={() => onNavigateToScreen("expenses")} className="bg-[#f9ede0] border border-[#E8D0BB] p-3 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform shadow-xs">
                   <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#C8521A]"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                   </div>
                   <span className="text-xs font-extrabold text-[#3B1A1A]">Expenses</span>
                 </button>

                 <button onClick={() => onNavigateToScreen("suppliers")} className="bg-[#f9ede0] border border-[#E8D0BB] p-3 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform shadow-xs">
                   <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#C8521A]"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                   </div>
                   <span className="text-xs font-extrabold text-[#3B1A1A]">Suppliers</span>
                 </button>

                 <button onClick={() => onNavigateToScreen("purchases")} className="bg-[#f9ede0] border border-[#E8D0BB] p-3 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform shadow-xs">
                   <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#C8521A]"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
                   </div>
                   <span className="text-xs font-extrabold text-[#3B1A1A]">Purchases</span>
                 </button>

                 <button onClick={() => onNavigateToScreen("cash_ups")} className="bg-[#f9ede0] border border-[#E8D0BB] p-3 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform shadow-xs">
                   <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#BA1A1A]"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                   </div>
                   <span className="text-xs font-extrabold text-[#3B1A1A]">Cash-Up</span>
                 </button>

                 <button onClick={() => onNavigateToScreen("reports")} className="bg-[#f9ede0] border border-[#E8D0BB] p-3 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform shadow-xs">
                   <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#C8521A]"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                   </div>
                   <span className="text-xs font-extrabold text-[#3B1A1A]">Reports</span>
                 </button>
              </div>
            </section>

            {/* Unified Editable Settings Form */}
            <form onSubmit={handleSave} className="space-y-4 mb-6">
          <p className="text-xs font-display font-black text-[#3B1A1A] tracking-wider uppercase mb-1 pl-1">
            Edit Shop Information
          </p>

          <div className="bg-[#f9ede0] border border-[#E8D0BB] p-4 rounded-2xl flex flex-col gap-1.5 shadow-xs">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-[#C8521A]" />
              <label className="text-[10px] font-display font-black tracking-widest text-[#C8521A] uppercase">Shop Name</label>
            </div>
            <input
              type="text"
              required
              value={localShopName}
              onChange={(e) => setLocalShopName(e.target.value)}
              className="w-full bg-transparent text-[#3B1A1A] text-sm font-bold outline-none border-b border-[#3B1A1A]/10 py-1 focus:border-[#C8521A]"
            />
          </div>

          <div className="bg-[#f9ede0] border border-[#E8D0BB] p-4 rounded-2xl flex flex-col gap-1.5 shadow-xs">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#C8521A]" />
              <label className="text-[10px] font-display font-black tracking-widest text-[#C8521A] uppercase">Owner Name</label>
            </div>
            <input
              type="text"
              required
              value={localOwnerName}
              onChange={(e) => setLocalOwnerName(e.target.value)}
              className="w-full bg-transparent text-[#3B1A1A] text-sm font-bold outline-none border-b border-[#3B1A1A]/10 py-1 focus:border-[#C8521A]"
            />
          </div>

          <div className="bg-[#f9ede0] border border-[#E8D0BB] p-4 rounded-2xl flex flex-col gap-1.5 shadow-xs">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-[#C8521A]" />
              <label className="text-[10px] font-display font-black tracking-widest text-[#C8521A] uppercase">Phone Number</label>
            </div>
            <input
              type="text"
              required
              value={localPhone}
              onChange={(e) => setLocalPhone(e.target.value)}
              className="w-full bg-transparent text-[#3B1A1A] text-sm font-bold outline-none border-b border-[#3B1A1A]/10 py-1 focus:border-[#C8521A]"
            />
          </div>

          <div className="bg-[#f9ede0] border border-[#E8D0BB] p-4 rounded-2xl flex flex-col gap-1.5 shadow-xs">
            <div className="flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-[#C8521A]" />
              <label className="text-[10px] font-display font-black tracking-widest text-[#C8521A] uppercase">Default Credit Limit (R)</label>
            </div>
            <input
              type="number"
              required
              value={localLimit}
              onChange={(e) => setLocalLimit(e.target.value)}
              className="w-full bg-transparent text-[#3B1A1A] text-sm font-bold outline-none border-b border-[#3B1A1A]/10 py-1 focus:border-[#C8521A] font-mono"
            />
          </div>

          <div className="bg-[#f9ede0] border border-[#E8D0BB] p-4 rounded-2xl flex flex-col gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-[#C8521A]" />
              <label className="text-[10px] font-display font-black tracking-widest text-[#C8521A] uppercase">WhatsApp Message Template</label>
            </div>
            <textarea
              value={localTemplate}
              onChange={(e) => setLocalTemplate(e.target.value)}
              className="w-full bg-white/50 p-3 rounded-xl border border-[#E8D0BB] text-xs font-medium text-[#3B1A1A] outline-none focus:bg-white focus:border-[#C8521A] resize-none"
              rows={3}
            />
            <p className="text-[10px] text-[#6E463B] font-bold">
              Tip: Use [Customer Name], [Amount], [Days] and [Shop Name] to auto-fill customer info.
            </p>
          </div>

          <button
            type="submit"
            disabled={savingStatus !== "idle"}
            className="w-full h-12 bg-[#3B1A1A] text-[#F5EDE0] rounded-xl flex items-center justify-center gap-2 font-display font-bold text-xs uppercase tracking-wider shadow active:scale-95 transition-all disabled:opacity-50"
          >
            {savingStatus === "saving" ? (
              <span>Saving...</span>
            ) : savingStatus === "saved" ? (
              <>
                <Check className="w-4 h-4" />
                <span>Settings Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </form>



        {/* Proposal Section */}
        <section className="space-y-3 mb-8">
          <p className="text-xs font-display font-black text-[#3B1A1A] tracking-wider uppercase pl-1">
            Business Opportunities
          </p>

          <div
            onClick={async () => {
              try {
                const { jsPDF } = await import("jspdf");
                const doc = new jsPDF();
                doc.setFontSize(22);
                doc.setTextColor(59, 26, 26);
                doc.text("Spaza Tap", 20, 30);
                
                doc.setFontSize(14);
                doc.setTextColor(200, 82, 26);
                doc.text("Digital Spaza Shop Partner Proposal", 20, 40);

                doc.setFontSize(11);
                doc.setTextColor(110, 70, 59);
                
                const proposalText = `To the Municipality / Local Partners,

We present Spaza Tap, an innovative offline-first digital tab management 
platform designed to empower informal economy spaza shops across South Africa 
and specifically in Northern KZN.

THE PROBLEM:
Local township and rural merchants rely heavily on informal lending (ukukweleta) 
to their regular customers. The traditional "black book" is prone to physical 
loss, fire, disputes, and mismanagement, leaving spaza owners vulnerable to 
crippling bad debt and missing vital cash-ups.

THE SOLUTION:
Spaza Tap replaces the black book with a secure, cloud-synced digital 
platform accessible from any smartphone. 

KEY FEATURES:
- Digital Tab Management: Real-time debt logging with dispute-proof records.
- Customer Mobile Portals: Customers can scan QR codes to view their own 
  tabs, request credit limits, and verify purchases on their own phones.
- Automated WhatsApp Reminders: Gentle, one-click payment nudges to recover debt.
- Compliance & Support Hub: Direct channels for municipality permits, health 
  inspections, and government support applications.
- Offline Capability: Critical read access to records even during load-shedding 
  or network outages.

MUNICIPALITY PARTNERSHIP POTENTIAL:
By endorsing Spaza Tap, the municipality can foster financial inclusion, 
help formalize informal businesses, collect macro-level economic data on 
township economies, and disseminate vital compliance guidelines directly to 
merchants.

We seek your partnership in reaching unbanked and informal merchants to propel 
grassroots economic growth.

Sincerely,
${localShopName} / ${localOwnerName}
`;

                const splitText = doc.splitTextToSize(proposalText, 170);
                doc.text(splitText, 20, 60);

                doc.save("Spaza_Tap_Spaza_Proposal.pdf");
              } catch (e) {
                 alert("Could not generate PDF");
              }
            }}
            className="bg-[#f9ede0] border border-[#E8D0BB] p-4 rounded-2xl flex items-center justify-between active:scale-95 transition-transform cursor-pointer shadow-xs"
          >
            <div className="flex items-center">
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center mr-3 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#C8521A]"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-xs font-extrabold text-[#3B1A1A]">
                  Generate Funding Proposal
                </span>
                <span className="text-[10px] font-bold text-[#6E463B] leading-tight mt-0.5 max-w-[200px]">
                  Download a PDF business pitch for municipalities/partners.
                </span>
              </div>
            </div>
            <ChevronRight className="text-[#C8521A] w-4 h-4 shrink-0" />
          </div>
        </section>

        {/* PWA Section */}
        <section className="space-y-3 mb-8">
          <p className="text-xs font-display font-black text-[#3B1A1A] tracking-wider uppercase pl-1">
            App Information
          </p>

          <div
            onClick={() => setShowPwaGuide(true)}
            className="bg-[#f9ede0] border border-[#E8D0BB] p-4 rounded-2xl flex items-center justify-between active:scale-95 transition-transform cursor-pointer shadow-xs"
          >
            <div className="flex items-center">
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center mr-3 shrink-0">
                <Smartphone className="w-4 h-4 text-[#C8521A]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-[#3B1A1A]">
                  How to Install PWA
                </span>
                <span className="text-[10px] font-bold text-[#6E463B]">
                  Install Spaza Tap directly on your Android / iOS home screen.
                </span>
              </div>
            </div>
            <ChevronRight className="text-[#C8521A] w-4 h-4 shrink-0" />
          </div>

          <div
            onClick={() => {
              window.dispatchEvent(new Event("spaza-tap-reset-pwa"));
              alert("Install Banner has been reset. It will now appear on your screen if applicable.");
            }}
            className="bg-[#f9ede0] border border-[#E8D0BB] p-4 rounded-2xl flex items-center justify-between active:scale-95 transition-transform cursor-pointer shadow-xs"
          >
            <div className="flex items-center">
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center mr-3 shrink-0">
                <RefreshCw className="w-4 h-4 text-[#C8521A]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-[#3B1A1A]">
                  Reset Install Banner
                </span>
                <span className="text-[10px] font-bold text-[#6E463B]">
                  Make the installation prompt reappear.
                </span>
              </div>
            </div>
            <ChevronRight className="text-[#C8521A] w-4 h-4 shrink-0" />
          </div>
        </section>

        {/* Logout */}
        <section className="mb-8">
          <button
            onClick={onLogout}
            type="button"
            className="w-full bg-[#BA1A1A] flex items-center justify-center py-4 rounded-full active:scale-95 transition-transform shadow"
          >
            <LogOut className="w-4 h-4 text-white mr-2" />
            <span className="text-xs font-display font-black uppercase text-white tracking-widest">
              Log Out
            </span>
          </button>
        </section>
        </div>
        </div>
      </main>

      {/* PWA GUIDE MODAL POPUP */}
      {showPwaGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#F5EDE0] rounded-3xl max-w-[420px] w-full p-6 border border-[#E8D0BB] shadow-2xl relative">
            <button
              onClick={() => setShowPwaGuide(false)}
              className="absolute right-4 top-4 w-7 h-7 bg-[#E5DACB] rounded-full flex items-center justify-center text-[#3B1A1A] font-bold"
            >
              ✕
            </button>
            <h3 className="text-lg font-display font-black text-[#3B1A1A] mb-3 uppercase tracking-tighter flex items-center gap-2">
              <Smartphone className="text-[#C8521A] w-5 h-5" />
              <span>INSTALL ON PHONE</span>
            </h3>

            <div className="space-y-4 text-xs font-semibold text-[#3B1A1A] leading-relaxed">
              <div className="p-3 bg-[#FFE5D8] rounded-xl border border-[#F8B79B]">
                <p className="font-bold text-[#C8521A] mb-1">Android (Chrome / Edge):</p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] font-medium text-[#6E463B]" style={{ listStyleType: "decimal" }}>
                  <li>Tap the browser options button (3 dots) near the URL box.</li>
                  <li>Select "Add to Home Screen" or "Install App".</li>
                  <li>Confirm, and the app will load directly on your phone launcher with offline utility.</li>
                </ol>
              </div>

              <div className="p-3 bg-white/40 border border-[#E8D0BB] rounded-xl">
                <p className="font-bold text-[#3B1A1A] mb-1">Apple iOS (Safari):</p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] font-medium text-[#6E463B]" style={{ listStyleType: "decimal" }}>
                  <li>Tap the Share button (square icon with upward arrow) at Safari's options drawer.</li>
                  <li>Scroll down the share drawer options list.</li>
                  <li>Tap "Add to Home Screen".</li>
                  <li>Tap Add in top right corner. Sharp sharp!</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setShowPwaGuide(false)}
              className="w-full mt-4 h-11 bg-[#3B1A1A] text-[#F5EDE0] rounded-full font-display font-bold text-xs uppercase tracking-wider"
            >
              Got It, Sharp!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
