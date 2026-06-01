import React, { useState } from "react";
import {
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X
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
    
    // Trigger callback
    onAddCredit({
      customerId,
      amount: proposedAmount,
      description,
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
    <div className="min-h-screen bg-[#C8521A] flex flex-col font-sans">
      {/* Header */}
      <header className="w-full sticky top-0 z-30 pt-6 pb-2 px-6">
        <div className="flex items-center justify-between w-full max-w-[480px] mx-auto text-white">
          <button onClick={onBack} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center active:scale-95 transition-transform" type="button">
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-[480px] mx-auto w-full flex-1 flex flex-col px-6 pt-4 pb-[100px]">
        <h1 className="text-[26px] font-display font-black text-white uppercase tracking-tighter leading-none mb-6">
          ADD<br/>CREDIT
        </h1>

        {isCloseToLimit && targetCustomer && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-[#3B1A1A] rounded-2xl border border-white/20 shadow-lg">
            <AlertTriangle className="text-white w-6 h-6 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-display font-bold text-white text-sm tracking-wider uppercase mb-1">Limit Warning</p>
              <p className="text-xs text-white/80 font-bold whitespace-normal">
                {targetCustomer.name} already owes R{currentOwed.toFixed(2)}. This addition will bring them to R{(currentOwed + proposedAmount).toFixed(2)}, which is over or near their R{currentLimit} limit.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-display font-bold text-xs text-white/80 tracking-widest uppercase ml-1">Select Customer</label>
              <button 
                type="button"
                onClick={() => onNavigate("newCustomer")}
                className="font-display font-bold text-xs text-white underline tracking-widest uppercase mr-1 active:opacity-50"
              >
                + New
              </button>
            </div>
            <div className="relative">
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="w-full h-14 pl-6 pr-12 bg-white/10 border border-white/20 rounded-2xl text-white text-base font-bold focus:ring-2 focus:ring-white outline-none transition-all appearance-none"
              >
                <option value="" disabled className="text-black">Hamba, search...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id} className="text-black">
                    {c.name} {c.owed > 0 ? `(Owes R${c.owed.toFixed(0)})` : "(Paid Up)"}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-white w-5 h-5 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-display font-bold text-xs text-white/80 tracking-widest uppercase ml-1">Amount Owed</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-bold text-white/50">R</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full h-16 pl-12 pr-6 bg-white/10 border border-white/20 rounded-2xl text-2xl font-display font-black text-white focus:ring-2 focus:ring-white outline-none transition-all placeholder:text-white/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-display font-bold text-xs text-white/80 tracking-widest uppercase ml-1">Items Description</label>
            <input
              type="text"
              placeholder="e.g. Bread, milk, sugar"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-14 px-6 bg-white/10 border border-white/20 rounded-2xl text-white text-base font-bold focus:ring-2 focus:ring-white outline-none transition-all placeholder:text-white/40"
            />
          </div>

          <div className="space-y-2">
            <label className="font-display font-bold text-xs text-white/80 tracking-widest uppercase ml-1">Transaction Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full h-14 px-6 bg-white/10 border border-[#FFF3E0]/30 rounded-2xl text-white text-base font-bold focus:ring-2 focus:ring-white outline-none transition-all flex items-center"
            />
          </div>

          <div className="pt-8 mt-auto">
            <button
              type="submit"
              disabled={isSubmitting || isSuccess || !customerId || proposedAmount <= 0}
              className={`w-full h-14 rounded-full flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95
                ${isSuccess ? 'bg-[#196D31] text-white' : 'bg-white text-[#C8521A] hover:opacity-90 disabled:opacity-50'}
              `}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="text-base font-display font-bold tracking-widest uppercase">Saving...</span>
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-base font-display font-bold tracking-widest uppercase">Saved!</span>
                </>
              ) : (
                <>
                  <span className="text-base font-display font-black tracking-widest uppercase">Add Entry</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
