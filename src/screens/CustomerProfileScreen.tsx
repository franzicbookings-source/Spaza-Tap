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
  FileSpreadsheet
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
  const [editLimit, setEditLimit] = useState(customer.limit ? customer.limit.toString() : "500");
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
    // Call state update
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
      limit: parseFloat(editLimit) || 500,
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

    // Default template or customized
    const template = whatsappTemplate || "Hi [Customer Name], this is a reminder that you owe R[Amount] at [Shop Name]. Your balance has been outstanding for [Days] days. Please pay when possible. Thank you.";
    
    // Replace placeholders
    let message = template
      .replace("[Customer Name]", customer.name)
      .replace("[Amount]", customer.owed.toFixed(2))
      .replace("[Days]", customer.daysOwing.toString())
      .replace("[Shop Name]", shopName);

    // Format phone to South African international form +27
    let cleanPhone = customer.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "27" + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith("+")) {
      cleanPhone = cleanPhone.substring(1);
    }
    
    // Build URL and open
    const waUrl = `https://wa.me/${cleanPhone}/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  // Filter transactions for this customer
  const relatedTxs = transactions.filter((t) => t.customerId === customer.id);

  const getStatusLabelAndStyles = () => {
    if (customer.owed === 0) {
      return { label: "PAID UP", bg: "bg-[#E6F4EA]", text: "text-[#137333] border-[#137333]/20" };
    }
    if (customer.status === "serious") {
      return { label: "SERIOUS OVERDUE", bg: "bg-red-50 border-red-200", text: "text-[#B71C1C]" };
    }
    if (customer.status === "warning") {
      return { label: "WARNING", bg: "bg-yellow-50 border-yellow-200", text: "text-[#B06000]" };
    }
    return { label: "GOOD", bg: "bg-green-50 border-green-200", text: "text-[#137333]" };
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
    <div className="min-h-screen bg-[#F5EDE0] pb-24 font-sans relative">
      <header className="w-full pt-6 pb-2 px-6">
        <div className="flex items-center justify-between w-full max-w-[480px] mx-auto text-[#3B1A1A]">
          <button onClick={onBack} className="w-10 h-10 bg-[#E5DACB] rounded-full flex items-center justify-center active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowQrModal(true)}
              className="w-10 h-10 bg-[#E5DACB] rounded-full flex items-center justify-center active:scale-95 transition-transform"
              title="Show QR Code"
            >
              <QrCode className="w-5 h-5" />
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="w-10 h-10 bg-[#E5DACB] rounded-full flex items-center justify-center active:scale-95 transition-transform"
                title="Download Statement"
              >
                <Download className="w-5 h-5" />
              </button>
              {showExportMenu && (
                <div className="absolute top-12 right-0 bg-white rounded-xl shadow-xl w-36 border border-[#E8D0BB] z-50 overflow-hidden">
                  <button
                    onClick={() => { setShowExportMenu(false); handleGeneratePDF(); }}
                    className="w-full text-left px-4 py-3 text-sm font-bold text-[#3B1A1A] flex items-center gap-2 hover:bg-[#F5EDE0]"
                  >
                    <FileText className="w-4 h-4 text-[#C8521A]" />
                    Save PDF
                  </button>
                  <div className="h-[1px] w-full bg-[#E8D0BB]"></div>
                  <button
                    onClick={() => { setShowExportMenu(false); handleGenerateCSV(); }}
                    className="w-full text-left px-4 py-3 text-sm font-bold text-[#3B1A1A] flex items-center gap-2 hover:bg-[#F5EDE0]"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#196D31]" />
                    Save CSV
                  </button>
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowEditModal(true)}
              className="w-10 h-10 bg-[#E5DACB] rounded-full flex items-center justify-center active:scale-95 transition-transform"
              title="Edit Customer"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Floating Global Micro Toast notifications */}
      {toastMessage && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 max-w-[90%] uppercase ${
          toastType === "success" ? "bg-[#196D31] text-white" : toastType === "error" ? "bg-[#BA1A1A] text-white" : "bg-[#3B1A1A] text-white"
        }`}>
          {toastMessage}
        </div>
      )}

      <main className="max-w-[480px] mx-auto w-full flex-1 flex flex-col pt-4 px-6">
        <section className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center font-display font-black text-xl shrink-0 bg-[#C8521A] text-white border-4 border-[#F5EDE0] shadow-sm">
            {customer.photoUrl ? (
              <img src={customer.photoUrl} alt={customer.name} className="w-full h-full object-cover" />
            ) : (
              customer.initials
            )}
          </div>
          <div className="flex flex-col">
            <h2 className="text-[26px] font-display font-black text-[#3B1A1A] uppercase tracking-tighter leading-tight mb-1">{customer.name}</h2>
            <p className="text-sm font-bold text-[#6E463B]">{customer.phone || "No phone number saved"}</p>
          </div>
        </section>

        {/* Action button triggers */}
        <section className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onNavigate('addCredit')}
              className="bg-[#C8521A] text-white rounded-3xl p-5 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <PlusCircle className="w-7 h-7 mb-2" />
              <span className="font-display font-bold text-xs uppercase tracking-wider">Add Credit</span>
            </button>
            <button 
              onClick={() => {
                if (customer.owed <= 0) {
                  triggerToast("Customer has no outstanding balance.", "info");
                } else {
                  setShowPayModal(true);
                }
              }}
              className="bg-[#3B1A1A] text-white rounded-3xl p-5 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <Banknote className="w-7 h-7 mb-2" />
              <span className="font-display font-bold text-xs uppercase tracking-wider">Record Pay</span>
            </button>
          </div>
        </section>

        {/* Balances card */}
        <section className="bg-[#f9ede0] rounded-3xl p-6 border border-[#E8D0BB] mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-display font-bold text-[10px] text-[#C8521A] uppercase tracking-widest mb-1">Total Owing</p>
              <p className="text-[28px] font-display font-black text-[#3B1A1A] leading-none">R{customer.owed.toFixed(2)}</p>
            </div>
            {customer.limit && (
              <div className="text-right">
                <p className="font-display font-bold text-[10px] text-[#6E463B] uppercase tracking-widest mb-1">Available Credit</p>
                <p className="text-base font-bold text-[#3B1A1A]">R{(customer.limit - customer.owed).toFixed(2)}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[#3B1A1A]/5 pt-4">
            <p className="font-display font-bold text-[10px] text-[#C8521A] uppercase tracking-widest">Status:</p>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black ${statusStyle.bg} ${statusStyle.text}`}>
              {customer.owed > 0 && customer.status !== "none" && <AlertTriangle className="w-3.5 h-3.5" />}
              <span>{statusStyle.label} ({customer.daysOwing} {customer.daysOwing === 1 ? "day" : "days"})</span>
            </div>
          </div>
        </section>

        {/* WhatsApp Reminder quick launcher */}
        {customer.owed > 0 && (
          <button
            onClick={handleWhatsAppReminder}
            className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold text-sm tracking-wider uppercase mb-6 flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md"
          >
            <Send className="w-4 h-4 fill-white" />
            <span>Send WhatsApp Reminder</span>
          </button>
        )}

        {/* Credit Control Actions (Pause/Unpause and Reference Number) */}
        <section className="mb-6 bg-[#f9ede0] p-5 rounded-3xl border border-[#E8D0BB]">
          <h3 className="font-display font-black text-xs text-[#3B1A1A] uppercase tracking-wider mb-3 leading-none">Credit Facility Status</h3>
          
          <div className="flex items-center justify-between py-2 border-b border-[#3B1A1A]/5">
            <span className="text-[11px] font-semibold text-[#6E463B] uppercase tracking-wider">Reference Code</span>
            <span className="font-mono text-xs font-black text-[#3B1A1A]">
              {customer.customerReferenceNumber || "Generating..."}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[#3B1A1A]/5">
            <span className="text-[11px] font-semibold text-[#6E463B] uppercase tracking-wider">Linked Account</span>
            <span className={`text-xs font-black uppercase tracking-wider ${customer.linkedCustomerUserId ? "text-[#196D31]" : "text-[#d97706]"}`}>
              {customer.linkedCustomerUserId ? "Yes (Linked)" : "Not linked yet"}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="text-[11px] font-semibold text-[#6E463B] uppercase tracking-wider">Status</span>
            <div className="flex items-center">
              <span className={`w-2.5 h-2.5 rounded-full mr-2 ${customer.creditStatus === "paused" ? "bg-[#BA1A1A] animate-pulse" : "bg-[#196D31]"}`}></span>
              <span className={`text-xs font-black uppercase tracking-wider ${customer.creditStatus === "paused" ? "text-[#BA1A1A]" : "text-[#196D31]"}`}>
                {customer.creditStatus === "paused" ? "Paused" : "Active"}
              </span>
            </div>
          </div>

          <div className="mt-3">
            {customer.creditStatus === "paused" ? (
              <button
                onClick={() => {
                  onUpdateCustomer(customer.id, { creditStatus: "active" });
                  triggerToast("Credit facility is now active", "success");
                }}
                className="w-full h-11 bg-[#196D31] text-white font-display font-extrabold text-xs uppercase tracking-wider rounded-xl active:scale-95 transition-transform shadow-sm"
              >
                Unpause Credit Facility
              </button>
            ) : (
              <button
                onClick={() => {
                  onUpdateCustomer(customer.id, { creditStatus: "paused" });
                  triggerToast("Credit facility has been paused", "error");
                }}
                className="w-full h-11 bg-[#BA1A1A] text-white font-display font-extrabold text-xs uppercase tracking-wider rounded-xl active:scale-95 transition-transform shadow-sm"
              >
                Pause Credit Facility
              </button>
            )}
          </div>
        </section>

        {/* Address and details */}
        <section className="mb-6">
          <h3 className="font-display font-black text-xl text-[#3B1A1A] tracking-tighter mb-3 uppercase">Details</h3>
          <div className="space-y-3">
            <div className="bg-[#f9ede0] p-4 rounded-2xl flex justify-between border border-[#E8D0BB] text-xs font-semibold">
              <span className="text-[#6E463B]">Area / Address</span>
              <span className="text-[#3B1A1A] font-bold">{customer.area || "No address saved"}</span>
            </div>
            <div className="bg-[#f9ede0] p-4 rounded-2xl flex justify-between border border-[#E8D0BB] text-xs font-semibold">
              <span className="text-[#6E463B]">Credit Account Limit</span>
              <span className="text-[#3B1A1A] font-bold">R{(customer.limit || 500).toFixed(2)}</span>
            </div>
            {customer.notes && (
              <div className="bg-[#f9ede0] p-4 rounded-2xl border border-[#E8D0BB] text-xs font-semibold space-y-1">
                <span className="text-[#6E463B]">Notes & Remarks</span>
                <p className="text-[#3B1A1A] whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </div>
        </section>

        {/* Historical transactional registers */}
        <section className="mb-8">
          <h3 className="font-display font-black text-xl text-[#3B1A1A] tracking-tighter mb-3 uppercase">LEDGER HISTORY</h3>
          <div className="space-y-3">
            {relatedTxs.map((tx) => {
              const isPayment = tx.type === "payment";
              return (
                <div key={tx.id} className="bg-white p-4 rounded-2xl border border-[#E8D0BB] flex justify-between items-center shadow-sm">
                  <div>
                    <h4 className="text-sm font-bold text-[#3B1A1A] leading-snug">{tx.description}</h4>
                    <p className="text-[10px] font-bold text-[#C8521A] mt-0.5 uppercase tracking-wider">{tx.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-base font-black ${isPayment ? "text-[#137333]" : "text-[#BA1A1A]"}`}>
                      {isPayment ? "-" : "+"}R{tx.amount.toFixed(2)}
                    </p>
                    <p className="text-[10px] font-bold text-[#6E463B] mt-0.5">BAL: R{tx.balanceAfter.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
            
            {relatedTxs.length === 0 && (
              <div className="text-center py-6 bg-white/40 border border-[#E8D0BB]/60 rounded-2xl">
                <p className="text-xs font-bold text-[#6E463B] italic">No transaction ledger recorded for this customer.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* RECORD PAYMENT MODAL DIALOG */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#F5EDE0] rounded-3xl max-w-[420px] w-full p-6 border border-[#E8D0BB] shadow-2xl relative">
            <button 
              onClick={() => { setShowPayModal(false); setPayError(""); setShowConfirmPay(false); }}
              className="absolute right-4 top-4 w-8 h-8 bg-[#E5DACB] rounded-full flex items-center justify-center text-[#3B1A1A] font-bold"
            >
              ✕
            </button>
            <h3 className="text-xl font-display font-black text-[#3B1A1A] mb-4 uppercase tracking-tighter">Record Payment</h3>
            
            {payError && (
              <div className="mb-4 p-3.5 bg-[#BA1A1A]/15 border-l-4 border-[#BA1A1A] text-[#BA1A1A] text-xs font-bold rounded-r-xl">
                {payError}
              </div>
            )}

            {showConfirmPay ? (
              <div className="space-y-6 pt-2">
                <div className="text-center bg-[#3B1A1A]/5 p-5 rounded-2xl border border-[#E5DACB]">
                  <p className="text-[#3B1A1A] font-medium text-sm">Please confirm you are recording a payment of:</p>
                  <p className="text-3xl font-display font-black text-[#137333] mt-2">R{parseFloat(payAmount).toFixed(2)}</p>
                  {payNote && <p className="text-[11px] font-mono text-[#6E463B] mt-3">Note: "{payNote}"</p>}
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowConfirmPay(false)}
                    className="flex-1 h-12 bg-[#E5DACB] text-[#3B1A1A] rounded-full font-display font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform"
                  >
                    Go Back
                  </button>
                  <button
                    type="button"
                    onClick={finalizePayment}
                    className="flex-1 h-12 bg-[#137333] text-white rounded-full font-display font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform shadow-md"
                  >
                    Confirm & Save
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="font-display font-bold text-[11px] text-[#C8521A] tracking-widest uppercase">Payment Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-black text-[#3B1A1A]/50">R</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      placeholder="0.00"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full h-12 pl-9 pr-4 bg-white rounded-xl border border-[#E8D0BB] focus:border-[#C8521A] text-lg font-black outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-display font-bold text-[11px] text-[#C8521A] tracking-widest uppercase">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full h-12 px-4 bg-white rounded-xl border border-[#E8D0BB] focus:border-[#C8521A] text-sm font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-display font-bold text-[11px] text-[#C8521A] tracking-widest uppercase">Payment Note / Remark</label>
                  <input
                    type="text"
                    placeholder="e.g. Paid in full / Part payment"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    className="w-full h-12 px-4 bg-white rounded-xl border border-[#E8D0BB] focus:border-[#C8521A] text-sm font-bold outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-[#3B1A1A] text-[#F5EDE0] rounded-full font-display font-extrabold text-sm uppercase tracking-wider shadow-md mt-4 animate-fade-in"
                >
                  Save Payment
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL DIALOG */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#F5EDE0] rounded-3xl max-w-[420px] w-full p-6 border border-[#E8D0BB] shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute right-4 top-4 w-8 h-8 bg-[#E5DACB] rounded-full flex items-center justify-center text-[#3B1A1A] font-bold"
            >
              ✕
            </button>
            <h3 className="text-xl font-display font-black text-[#3B1A1A] mb-4 uppercase tracking-tighter">Edit Customer</h3>

            {editError && (
              <div className="mb-4 p-3.5 bg-[#BA1A1A]/15 border-l-4 border-[#BA1A1A] text-[#BA1A1A] text-xs font-bold rounded-r-xl">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="font-display font-bold text-[11px] text-[#C8521A] tracking-widest uppercase">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-12 px-4 bg-white rounded-xl border border-[#E8D0BB] focus:border-[#C8521A] text-sm font-bold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-display font-bold text-[11px] text-[#C8521A] tracking-widest uppercase">Phone</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full h-12 px-4 bg-white rounded-xl border border-[#E8D0BB] focus:border-[#C8521A] text-sm font-bold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-display font-bold text-[11px] text-[#C8521A] tracking-widest uppercase">Area / Location</label>
                <input
                  type="text"
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                  className="w-full h-12 px-4 bg-white rounded-xl border border-[#E8D0BB] focus:border-[#C8521A] text-sm font-bold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-display font-bold text-[11px] text-[#C8521A] tracking-widest uppercase">Credit Limit (R)</label>
                <input
                  type="number"
                  value={editLimit}
                  onChange={(e) => setEditLimit(e.target.value)}
                  className="w-full h-12 px-4 bg-white rounded-xl border border-[#E8D0BB] focus:border-[#C8521A] text-sm font-bold outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-display font-bold text-[11px] text-[#C8521A] tracking-widest uppercase">Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-4 bg-white rounded-xl border border-[#E8D0BB] focus:border-[#C8521A] text-sm font-semibold outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-[#C8521A] text-white rounded-full font-display font-extrabold text-sm uppercase tracking-wider shadow-md mt-4"
              >
                Save Customer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER QR CODE MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs flex-col">
          <div className="bg-white rounded-3xl max-w-[340px] w-full p-6 relative overflow-hidden flex flex-col items-center">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center bg-[#F5EDE0] text-[#3B1A1A] rounded-full z-[70] active:scale-95 transition-transform"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-full text-center mt-2 mb-4 pr-10">
              <h2 className="text-xl font-display font-black text-[#3B1A1A] uppercase tracking-tight">
                Customer Reference
              </h2>
              <p className="text-xs font-semibold text-[#6E463B] leading-tight mt-1">
                Have the customer scan this code on their phone to autofill their setup.
              </p>
            </div>
            
            <div className="w-[200px] h-[200px] bg-slate-50 border-4 border-[#3B1A1A] p-2 rounded-2xl flex items-center justify-center mb-4 overflow-hidden relative group shadow">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(customer.customerReferenceNumber!)}`} 
                alt={`${customer.name} Reference Code`} 
                className="w-full h-full object-contain" 
              />
            </div>
            
            <span className="font-mono text-xs font-black bg-[#FFE5D8] text-[#C8521A] px-3 py-1 rounded-md uppercase">
              {customer.customerReferenceNumber}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
