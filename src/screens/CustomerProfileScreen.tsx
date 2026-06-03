import React, { useState } from "react";
import {
  ArrowLeft,
  MoreVertical,
  PlusCircle,
  Banknote,
  AlertTriangle,
  Send,
  Save,
  Trash2,
  X,
  CreditCard,
  PhoneCall,
  Download,
  QrCode,
  FileText,
  FileSpreadsheet,
  ChevronRight,
  Shield,
  MapPin,
  Coins,
  History
} from "lucide-react";
import { ScreenState, Customer, Transaction } from "../types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface CustomerProfileScreenProps {
  customer: Customer;
  transactions: Transaction[];
  onBack: () => void;
  onNavigate: (screen: ScreenState) => void;
  onRecordPayment: (data: { customerId: string; amount: number; date: string; note: string }) => void;
  onUpdateCustomer: (id: string, fields: Partial<Customer>) => void;
  whatsappTemplate: string;
  shopName: string;
}

export default function CustomerProfileScreen({
  customer,
  transactions = [],
  onBack,
  onNavigate,
  onRecordPayment,
  onUpdateCustomer,
  whatsappTemplate,
  shopName,
}: CustomerProfileScreenProps) {
  // Action Modals State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payNote, setPayNote] = useState("");
  const [payError, setPayError] = useState("");
  const [showConfirmPay, setShowConfirmPay] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(customer.name);
  const [editPhone, setEditPhone] = useState(customer.phone);
  const [editArea, setEditArea] = useState(customer.area || "");
  const [editLimit, setEditLimit] = useState(customer.limit ? customer.limit.toString() : "2000");
  const [editNotes, setEditNotes] = useState(customer.notes || "");
  const [editError, setEditError] = useState("");

  const [showQrModal, setShowQrModal] = useState(false);

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info");

  // Show floating alert timer
  const triggerToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  // Record payment validation
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(payAmount);
    setPayError("");

    if (isNaN(amountNum) || amountNum <= 0) {
      setPayError("Please enter a valid amount.");
      return;
    }

    if (amountNum > customer.owed) {
      setPayError(`Payment cannot be higher than amount owed (R${customer.owed.toFixed(2)}).`);
      return;
    }

    setShowConfirmPay(true);
  };

  const finalizePayment = () => {
    const amountNum = parseFloat(payAmount);
    onRecordPayment({
      customerId: customer.id,
      amount: amountNum,
      date: payDate,
      note: payNote.trim() || "Payment received"
    });

    triggerToast("Payment recorded successfully", "success");
    setPayAmount("");
    setPayNote("");
    setShowPayModal(false);
    setShowConfirmPay(false);
  };

  // Edit details validations and submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");

    if (!editName.trim()) {
      setEditError("Name can't be empty.");
      return;
    }

    onUpdateCustomer(customer.id, {
      name: editName.trim(),
      phone: editPhone.trim(),
      area: editArea.trim(),
      limit: parseFloat(editLimit) || 2000,
      notes: editNotes.trim()
    });

    triggerToast("Customer details updated", "success");
    setShowEditModal(false);
  };

  // WA Reminder trigger
  const handleWhatsAppReminder = () => {
    if (customer.owed <= 0) {
      triggerToast("This customer is paid up.", "info");
      return;
    }

    if (!customer.phone || !customer.phone.trim()) {
      triggerToast("No phone number saved for this customer.", "error");
      return;
    }

    const template = whatsappTemplate || "Hi [Customer Name], this is a reminder that you owe R[Amount] at [Shop Name]. Your balance has been outstanding for [Days] days. Please pay when possible. Thank you.";
    
    let message = template
      .replace("[Customer Name]", customer.name)
      .replace("[Amount]", customer.owed.toFixed(2))
      .replace("[Days]", customer.daysOwing.toString())
      .replace("[Shop Name]", shopName);

    let cleanPhone = customer.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "27" + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith("+")) {
      cleanPhone = cleanPhone.substring(1);
    }
    
    const waUrl = `https://wa.me/${cleanPhone}/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  const relatedTxs = transactions.filter((t) => t.customerId === customer.id);

  const getStatusLabelAndStyles = () => {
    if (customer.owed === 0) {
      return { label: "PAID UP", bg: "bg-[#E6F4EA]", text: "text-[#137333] border-[#137333]/20" };
    }
    if (customer.status === "serious") {
      return { label: "SERIOUS OVERDUE", bg: "bg-[#FCE8E6]", text: "text-[#C5221F]" };
    }
    if (customer.status === "warning") {
      return { label: "WARNING", bg: "bg-[#FEF7E0]", text: "text-[#B06000]" };
    }
    return { label: "GOOD", bg: "bg-[#E6F4EA]", text: "text-[#137333]" };
  };

  const statusStyle = getStatusLabelAndStyles();

  const handleGeneratePDF = () => {
    try {
      const doc = new jsPDF();
      
      const title = `${shopName} - Customer Statement`;
      doc.setFontSize(18);
      doc.text(title, 14, 22);
      
      doc.setFontSize(12);
      doc.text(`Customer: ${customer.name}`, 14, 32);
      doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 38);
      doc.text(`Total Owed: R${customer.owed.toFixed(2)}`, 14, 44);
      doc.text(`Status: ${statusStyle.label}`, 14, 50);

      const tableData = relatedTxs.map(tx => {
        const isPayment = tx.type === "payment";
        return [
          tx.date,
          tx.description,
          isPayment ? "Payment" : "Credit",
          isPayment ? `-R${tx.amount.toFixed(2)}` : `+R${tx.amount.toFixed(2)}`,
          `R${tx.balanceAfter.toFixed(2)}`
        ];
      });

      autoTable(doc, {
        startY: 56,
        head: [['Date', 'Description', 'Type', 'Amount', 'Balance']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 26, 26] },
      });

      doc.save(`Statement_${customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      triggerToast("PDF Statement Downloaded", "success");
    } catch (e) {
      console.error(e);
      triggerToast("Failed to generate PDF.", "error");
    }
  };

  const handleGenerateCSV = () => {
    try {
      const headers = ["Date", "Description", "Type", "Amount", "Balance"];
      const rows = relatedTxs.map(tx => {
        const isPayment = tx.type === "payment";
        return [
          tx.date,
          `"${tx.description}"`,
          isPayment ? "Payment" : "Credit",
          isPayment ? `-${tx.amount.toFixed(2)}` : `${tx.amount.toFixed(2)}`,
          tx.balanceAfter.toFixed(2)
        ];
      });

      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Statement_${customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      triggerToast("CSV Statement Downloaded", "success");
    } catch (e) {
      console.error(e);
      triggerToast("Failed to generate CSV.", "error");
    }
  };

  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className="min-h-screen bg-[#FBF5EC] pb-28 font-sans relative">
      
      {/* Redesigned Premium Header Nav bar */}
      <header className="w-full pt-5 pb-4 px-5 bg-white border-b border-[#2B1114]/8">
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack} 
            className="w-10 h-10 bg-[#F1EBE4] hover:bg-[#E5DACB] rounded-full flex items-center justify-center active:scale-95 transition-transform text-[#2B1114]"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          
          <div className="flex items-center gap-2">
            
            {/* Show QR reference Code */}
            <button 
              onClick={() => setShowQrModal(true)}
              className="w-10 h-10 bg-[#FFF0E7] text-[#D94F12] border border-primary/20 rounded-full flex items-center justify-center active:scale-95 transition-all"
              title="QR Access Card"
            >
              <QrCode className="w-5 h-5" />
            </button>

            {/* Export menu dropdown list */}
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="w-10 h-10 bg-[#F1EBE4] text-[#2B1114] rounded-full flex items-center justify-center active:scale-95 transition-all"
                title="Statement Download"
              >
                <Download className="w-5 h-5" />
              </button>
              {showExportMenu && (
                <div className="absolute top-12 right-0 bg-white rounded-2xl shadow-lg w-40 border border-[#2B1114]/8 z-50 overflow-hidden py-1">
                  <button
                    onClick={() => { setShowExportMenu(false); handleGeneratePDF(); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-text-main flex items-center gap-2 hover:bg-[#FBF5EC]"
                  >
                    <FileText className="w-4 h-4 text-primary" />
                    Save PDF Card
                  </button>
                  <button
                    onClick={() => { setShowExportMenu(false); handleGenerateCSV(); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-text-main flex items-center gap-2 hover:bg-[#FBF5EC]"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Export CSV
                  </button>
                </div>
              )}
            </div>

            {/* Edit Profile details button */}
            <button 
              onClick={() => setShowEditModal(true)}
              className="w-10 h-10 bg-[#F1EBE4] text-[#2B1114] rounded-full flex items-center justify-center active:scale-95 transition-all"
              title="Edit Profile"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

          </div>
        </div>
      </header>

      {/* Embedded top notifications */}
      {toastMessage && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 max-w-[90%] uppercase ${
          toastType === "success" ? "bg-emerald-600 text-white" : toastType === "error" ? "bg-danger text-white" : "bg-text-main text-white"
        }`}>
          {toastMessage}
        </div>
      )}

      <main className="px-5 mt-5 space-y-5">
        
        {/* Profile Card details */}
        <section className="bg-white border border-[#2B1114]/8 rounded-[24px] p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center font-display font-black text-xl shrink-0 bg-[#FFF0E7] text-[#D94F12] border-2 border-primary/20 shadow-xs">
            {customer.photoUrl ? (
              <img src={customer.photoUrl} alt={customer.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
            ) : (
              customer.initials || "C"
            )}
          </div>
          <div>
            <h2 className="text-xl font-black text-text-main font-display tracking-tight uppercase leading-tight mb-1">
              {customer.name}
            </h2>
            <p className="text-xs font-bold text-text-light">{customer.phone || "No phone number saved"}</p>
          </div>
        </section>

        {/* Big Action buttons for Credit ledger record */}
        <section className="grid grid-cols-2 gap-4">
          
          <button 
            onClick={() => onNavigate('addCredit')}
            className="h-24 bg-[#D94F12] text-white rounded-[24px] flex flex-col items-center justify-center shadow-[0_8px_20px_rgba(217,79,18,0.15)] active:scale-98 transition-transform"
          >
            <PlusCircle className="w-7 h-7 mb-1.5 stroke-[2.5]" />
            <span className="font-bold text-xs uppercase tracking-wider">Add Credit</span>
          </button>

          <button 
            onClick={() => {
              if (customer.owed <= 0) {
                triggerToast("Customer has no outstanding balance.", "info");
              } else {
                setShowPayModal(true);
              }
            }}
            className="h-24 bg-burgundy text-white rounded-[24px] flex flex-col items-center justify-center active:scale-98 transition-transform"
          >
            <Banknote className="w-7 h-7 mb-1.5 text-primary stroke-[2.5]" />
            <span className="font-bold text-xs uppercase tracking-wider">Record Pay</span>
          </button>

        </section>

        {/* Ledger Balance Information Widget */}
        <section className="bg-white border border-[#2B1114]/8 rounded-[24px] p-5 space-y-4 shadow-2xs">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mb-1">Total Outstanding</span>
              <p className={`text-3xl font-black leading-none ${customer.owed > 0 ? "text-danger" : "text-emerald-600"}`}>
                R{customer.owed.toFixed(2)}
              </p>
            </div>
            
            {customer.limit && (
              <div className="text-right">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mb-1">Available Credit</span>
                <p className="text-base font-black text-text-main">
                  R{(customer.limit - customer.owed).toFixed(2)}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-text-main/5">
            <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Account standing</span>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold ${statusStyle.bg} ${statusStyle.text}`}>
              {customer.owed > 0 && customer.status !== "none" && <AlertTriangle className="w-3.5 h-3.5" />}
              <span className="uppercase tracking-wider">{statusStyle.label} ({customer.daysOwing} Days)</span>
            </div>
          </div>
        </section>

        {/* Highlighted WhatsApp Reminder trigger button */}
        {customer.owed > 0 && (
          <button
            onClick={handleWhatsAppReminder}
            className="w-full h-13 bg-[#25D366] text-white rounded-2xl font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-[0_4px_16px_rgba(37,211,102,0.15)]"
          >
            <Send className="w-4 h-4 fill-white text-white" />
            <span>Send WhatsApp Reminder</span>
          </button>
        )}

        {/* Facility Credit controls details */}
        <section className="bg-white border border-[#2B1114]/8 p-5 rounded-[24px] space-y-3">
          <h3 className="font-extrabold text-xs text-text-main uppercase tracking-wider leading-none">
            Facility Settings
          </h3>
          
          <div className="flex items-center justify-between py-1 border-b border-text-main/5">
            <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">Ref ID Code</span>
            <span className="font-mono text-xs font-black text-text-main tracking-widest">
              {customer.customerReferenceNumber || "N/A"}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-[#2B1114]/5">
            <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">Join Status</span>
            <span className={`text-[10px] font-black uppercase tracking-wider ${customer.linkedCustomerUserId ? "text-[#137333]" : "text-[#D94F12]"}`}>
              {customer.linkedCustomerUserId ? "Linked to App" : "Not Linked Yet"}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-text-main/5">
            <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">Credit Limit</span>
            <span className="text-xs font-extrabold text-text-main">
              R{(customer.limit || 2000).toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">Limit Status</span>
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${customer.creditStatus === "paused" ? "bg-danger animate-pulse" : "bg-emerald-600"}`} />
              <span className={`text-xs font-black uppercase tracking-wider ${customer.creditStatus === "paused" ? "text-danger" : "text-emerald-600"}`}>
                {customer.creditStatus === "paused" ? "Paused" : "Active"}
              </span>
            </div>
          </div>

          <div className="pt-2">
            {customer.creditStatus === "paused" ? (
              <button
                onClick={() => {
                  onUpdateCustomer(customer!.id || "", { creditStatus: "active" });
                  triggerToast("Credit facility active", "success");
                }}
                className="w-full h-10.5 bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl active:scale-95 transition-transform"
              >
                Unpause Account Facility
              </button>
            ) : (
              <button
                onClick={() => {
                  onUpdateCustomer(customer!.id || "", { creditStatus: "paused" });
                  triggerToast("Credit facility paused", "error");
                }}
                className="w-full h-10.5 bg-danger text-white font-extrabold text-xs uppercase tracking-wider rounded-xl active:scale-95 transition-transform"
              >
                Pause Account Facility
              </button>
            )}
          </div>
        </section>

        {/* Static details information with professional labels */}
        <section className="bg-white border border-[#2B1114]/8 p-5 rounded-[24px] space-y-3">
          <h3 className="font-extrabold text-xs text-text-main uppercase tracking-wider leading-none">
            Demographic Details
          </h3>
          <div className="flex items-center justify-between py-1.5 border-b border-text-main/5 text-xs">
            <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">Shop Area</span>
            <span className="font-bold text-text-main">{customer.area || "No address saved"}</span>
          </div>
          {customer.notes && (
            <div className="pt-2 text-xs">
              <span className="text-[10px] font-bold text-text-light uppercase tracking-wider block mb-1">Staff Notes</span>
              <p className="text-text-main bg-background p-3 rounded-xl border border-text-main/5 whitespace-pre-wrap leading-relaxed">
                {customer.notes}
              </p>
            </div>
          )}
        </section>

        {/* Ledger history list section */}
        <section className="space-y-3 pb-8">
          <h3 className="text-xs font-black text-text-muted uppercase tracking-wider pl-1">
            Transaction Ledger History
          </h3>
          <div className="space-y-3">
            {relatedTxs.map((tx) => {
              const isPayment = tx.type === "payment";
              return (
                <div key={tx.id} className="bg-white p-4.5 rounded-2xl border border-text-main/5 flex justify-between items-center shadow-2xs">
                  <div>
                    <h4 className="text-xs font-bold text-text-main leading-tight uppercase">{tx.description}</h4>
                    <p className="text-[9px] font-extrabold font-mono text-[#D94F12] mt-1 tracking-wider uppercase">{tx.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${isPayment ? "text-emerald-600" : "text-danger"}`}>
                      {isPayment ? "-" : "+"}R{tx.amount.toFixed(2)}
                    </p>
                    <p className="text-[9px] font-extrabold text-text-light mt-0.5 font-mono">BAL: R{tx.balanceAfter.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
            
            {relatedTxs.length === 0 && (
              <div className="text-center py-8 bg-white border border-text-main/5 rounded-[24px]">
                <p className="text-xs text-text-light italic">No transactions cataloged yet.</p>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* PAYMENT DIALOG POPUP */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#FBF5EC] rounded-[28px] max-w-[420px] w-full p-6 border border-[#2B1114]/8 shadow-2xl relative">
            <button 
              onClick={() => { setShowPayModal(false); setPayError(""); setShowConfirmPay(false); }}
              className="absolute right-4 top-4 w-8 h-8 bg-white/50 rounded-full flex items-center justify-center text-text-main font-bold active:scale-95 transition-transform"
            >
              ✕
            </button>
            <h3 className="text-base font-black text-text-main font-display mb-4 uppercase tracking-tighter">Record Payment</h3>
            
            {payError && (
              <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-600 text-red-700 text-xs font-bold rounded-r-xl">
                {payError}
              </div>
            )}

            {showConfirmPay ? (
              <div className="space-y-5 pt-2">
                <div className="text-center bg-white p-5 rounded-2xl border border-[#2B1114]/8 shadow-xs">
                  <p className="text-xs font-bold text-text-light uppercase tracking-wider">Confirming payment of</p>
                  <p className="text-3xl font-black text-emerald-600 mt-2 font-display">R{parseFloat(payAmount).toFixed(2)}</p>
                  {payNote && <p className="text-xs font-mono text-text-muted mt-3">Ref: "{payNote}"</p>}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirmPay(false)}
                    className="flex-1 h-12 bg-white border border-text-main/10 text-text-main rounded-full font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform"
                  >
                    Go Back
                  </button>
                  <button
                    type="button"
                    onClick={finalizePayment}
                    className="flex-1 h-12 bg-emerald-600 text-white rounded-full font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform shadow-xs"
                  >
                    Confirm & Save
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider block">Payment Amount (R)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-text-muted">R</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      placeholder="0.00"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full h-12 pl-9 pr-4 bg-white rounded-xl border border-text-main/10 text-base font-black outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider block">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full h-12 px-4 bg-white rounded-xl border border-text-main/10 text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider block">Payment Remark Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Card Payment, Cash till, etc."
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    className="w-full h-12 px-4 bg-white rounded-xl border border-text-main/10 text-xs font-bold outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-burgundy hover:bg-[#2B1114] text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-xs mt-4"
                >
                  Proceed to Confirm
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER DETAILS MODAL DIALOG */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#FBF5EC] rounded-[28px] max-w-[420px] w-full p-6 border border-[#2B1114]/8 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute right-4 top-4 w-8 h-8 bg-white/50 rounded-full flex items-center justify-center text-text-main font-bold outline-none active:scale-95 transition-transform"
            >
              ✕
            </button>
            <h3 className="text-base font-black text-text-main font-display mb-4 uppercase tracking-tighter">Edit Customer Details</h3>

            {editError && (
              <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-600 text-red-700 text-xs font-bold rounded-r-xl">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider block">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-12 px-4 bg-white rounded-xl border border-text-main/10 text-xs font-bold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider block">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full h-12 px-4 bg-white rounded-xl border border-text-main/10 text-xs font-bold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider block">Area / Residence address</label>
                <input
                  type="text"
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                  className="w-full h-12 px-4 bg-white rounded-xl border border-text-main/10 text-xs font-bold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider block">Account Credit Limit (R)</label>
                <input
                  type="number"
                  value={editLimit}
                  onChange={(e) => setEditLimit(e.target.value)}
                  className="w-full h-12 px-4 bg-white rounded-xl border border-text-main/10 text-xs font-bold outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider block">Staff notes / Warnings</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-4 bg-white rounded-xl border border-text-main/10 text-xs font-semibold outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-burgundy text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-xs mt-4"
              >
                Save Details
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER ACCESS QR MODAL CARD */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs flex-col">
          <div className="bg-white rounded-[28px] max-w-[340px] w-full p-6 relative overflow-hidden flex flex-col items-center">
            
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center bg-[#FBF5EC] text-text-main rounded-full z-[70] active:scale-95 transition-transform font-bold outline-none"
            >
              ✕
            </button>
            
            <div className="w-full text-center mt-2 mb-4 pr-10">
              <h2 className="text-base font-black text-text-main uppercase font-display tracking-tight leading-none">
                Scan Access Card
              </h2>
              <p className="text-[11px] font-bold text-text-light leading-tight mt-1">
                Have the customer scan this code or input reference below to log into their Portal.
              </p>
            </div>
            
            <div className="w-[190px] h-[190px] bg-slate-50 border-4 border-text-main p-2 rounded-2xl flex items-center justify-center mb-4 overflow-hidden relative shadow-xs">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(customer.customerReferenceNumber || "")}`} 
                alt={`${customer.name} ID`} 
                className="w-full h-full object-contain" 
                loading="lazy"
                decoding="async"
              />
            </div>
            
            <span className="font-mono text-xs font-black bg-[#FFF0E7] text-[#D94F12] px-3.5 py-1 rounded-md uppercase tracking-wide">
              {customer.customerReferenceNumber}
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
