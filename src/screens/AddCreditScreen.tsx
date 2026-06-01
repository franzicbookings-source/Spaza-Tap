import React, { useState } from "react";
import {
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Plus
} from "lucide-react";
import { ScreenState, Customer } from "../types";

interface AddCreditScreenProps {
  onBack: () => void;
  onNavigate: (screen: ScreenState) => void;
  customers: Customer[];
  onAddCredit: (data: { customerId: string; amount: number; description: string; date: string }) => void;
  selectedCustomerId?: string;
}

export default function AddCreditScreen({
  onBack,
  onNavigate,
  customers = [],
  onAddCredit,
  selectedCustomerId = "",
}: AddCreditScreenProps) {
  const [customerId, setCustomerId] = useState(selectedCustomerId);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const targetCustomer = customers.find((c) => c.id === customerId);
  const currentOwed = targetCustomer ? targetCustomer.owed : 0;
  const currentLimit = targetCustomer ? targetCustomer.limit : 500;
  const proposedAmount = parseFloat(amount) || 0;
  const isCloseToLimit = targetCustomer && (currentOwed + proposedAmount >= currentLimit);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || proposedAmount <= 0) return;

    setIsSubmitting(true);
    
    onAddCredit({
      customerId,
      amount: proposedAmount,
      description: description.trim() || "Credit booking",
      date
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onBack();
      }, 1200);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#FBF5EC] flex flex-col font-sans text-text-main pb-24">
      
      {/* Visual Header */}
      <header className="w-full pt-5 pb-4 px-5 bg-white border-b border-[#2B1114]/8 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack} 
            className="w-10 h-10 bg-[#F1EBE4] hover:bg-[#E5DACB] rounded-full flex items-center justify-center active:scale-95 transition-transform text-text-main"
            type="button"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
          <span className="text-[10px] font-bold tracking-wider text-[#D94F12] uppercase bg-[#FFF0E7] px-3.5 py-1 rounded-full">
            Record Debt Order
          </span>
        </div>
      </header>

      <main className="max-w-[480px] mx-auto w-full flex-1 flex flex-col px-5 pt-5">
        
        <div className="mb-5 pb-2">
          <h1 className="text-xl font-black font-display uppercase tracking-tight text-text-main leading-none">
            Add Tab Booking
          </h1>
          <p className="text-[10px] font-bold text-text-light uppercase tracking-wider mt-1.5 leading-none">Record another tab items booking entry.</p>
        </div>

        {/* Warning card matching design style */}
        {isCloseToLimit && targetCustomer && (
          <div className="mb-5 flex items-start gap-3.5 p-4 bg-red-50 border border-red-200/50 rounded-2xl shadow-2xs">
            <AlertTriangle className="text-red-600 w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-extrabold text-[#2B1114] text-xs uppercase tracking-tight mb-1">Facility Warning limit reached</p>
              <p className="text-[11px] text-red-800 font-bold leading-normal">
                {targetCustomer.name} already owes R{currentOwed.toFixed(2)}. This addition brings booking debt to R{(currentOwed + proposedAmount).toFixed(2)}, exceeding or nearing the customer's R{currentLimit} facility credit limit.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4">
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider block ml-0.5">Select Debtor Customer</label>
              <button 
                type="button"
                onClick={() => onNavigate("newCustomer")}
                className="text-[10px] font-black text-[#D94F12] underline uppercase tracking-wider mr-0.5 active:opacity-50"
              >
                + Register New
              </button>
            </div>
            <div className="relative">
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="w-full h-12 pl-4 pr-11 bg-white border border-text-main/10 rounded-xl text-xs font-bold text-text-main outline-none appearance-none"
              >
                <option value="" disabled className="text-text-muted">Search customers...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id} className="text-text-main">
                    {c.name} {c.owed > 0 ? `(Owes R${c.owed.toFixed(0)})` : "(Paid Up)"}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-main w-5 h-5 pointer-events-none stroke-[2.5]" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider block ml-0.5">Booking Amount (R)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-black text-text-muted">R</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full h-13 pl-8 pr-4 bg-white border border-text-main/10 rounded-xl text-base font-black text-text-main outline-none focus:border-[#D94F12] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider block ml-0.5">Brief items / reasons</label>
            <input
              type="text"
              placeholder="e.g. Bread, 2L Cooldrink, Eggs"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-12 px-4 bg-white border border-text-main/10 rounded-xl text-xs font-bold text-text-main outline-none placeholder:text-text-muted focus:border-[#D94F12]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider block ml-0.5">Booking Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full h-12 px-4 bg-white border border-text-main/10 rounded-xl text-xs font-bold text-text-main outline-none focus:border-[#D94F12]"
            />
          </div>

          <div className="pt-6 mt-auto">
            <button
              type="submit"
              disabled={isSubmitting || isSuccess || !customerId || proposedAmount <= 0}
              className={`w-full h-14 rounded-full flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95
                ${isSuccess ? 'bg-emerald-600 text-white' : 'bg-burgundy hover:bg-[#2B1114] text-white disabled:opacity-40'}
              `}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span className="font-bold text-xs uppercase tracking-wider">Saving Ledger Entry...</span>
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span className="font-bold text-xs uppercase tracking-wider">Recorded Saved!</span>
                </>
              ) : (
                <span className="font-bold text-xs uppercase tracking-wider">Save Booking Entry</span>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
