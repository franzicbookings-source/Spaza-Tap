import React, { useState } from "react";
import {
  Calendar,
  Banknote,
  History,
  TrendingUp,
  BadgeCheck,
  AlertTriangle,
  ChevronRight,
  TrendingDown,
  Download,
  FileText,
  FileSpreadsheet
} from "lucide-react";
import { Customer, Transaction, ScreenState } from "../types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportsScreenProps {
  customers: Customer[];
  transactions: Transaction[];
  onNavigate: (screen: ScreenState) => void;
  onViewCustomer: (id: string) => void;
}

export default function ReportsScreen({
  customers = [],
  transactions = [],
  onNavigate,
  onViewCustomer
}: ReportsScreenProps) {
  // Helper for dates
  const todayStr = new Date().toISOString().split('T')[0];
  
  const isWithinLastDays = (dateStr: string, days: number) => {
    try {
      const txDate = new Date(dateStr);
      const today = new Date();
      // Reset hours to compare purely days
      txDate.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      const diffTime = today.getTime() - txDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays < days;
    } catch (e) {
      return false;
    }
  };

  // 1. Calculations
  const totalOwed = customers.reduce((sum, c) => sum + c.owed, 0);
  const owingCount = customers.filter(c => c.owed > 0).length;
  const paidUpCount = customers.filter(c => c.owed === 0).length;
  const overdueCount = customers.filter(c => c.owed > 0 && c.daysOwing > 7).length;

  // Payments collected today
  const collectedToday = transactions
    .filter(t => t.type === "payment" && t.date === todayStr)
    .reduce((sum, t) => sum + t.amount, 0);

  // Payments collected this week (7 days)
  const collectedThisWeek = transactions
    .filter(t => t.type === "payment" && isWithinLastDays(t.date, 7))
    .reduce((sum, t) => sum + t.amount, 0);

  // Credit given today
  const creditGivenToday = transactions
    .filter(t => t.type === "credit" && t.date === todayStr)
    .reduce((sum, t) => sum + t.amount, 0);

  // Credit given this week (7 days)
  const creditGivenThisWeek = transactions
    .filter(t => t.type === "credit" && isWithinLastDays(t.date, 7))
    .reduce((sum, t) => sum + t.amount, 0);

  const handleDownloadCSV = () => {
    const headers = ["Customer Name", "Phone Number", "Total Owing", "Days Owing", "Status"];
    
    const rows = customers.map(c => [
      `"${c.name}"`,
      `"${c.phone}"`,
      c.owed.toFixed(2),
      c.daysOwing,
      c.owed === 0 ? "Paid Up" : c.daysOwing > 7 ? "Overdue" : "Owing"
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Spaza_Ledger_Report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Shop Master Ledger Report", 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 32);
    doc.text(`Total Outstanding Credit: R${totalOwed.toFixed(2)}`, 14, 38);
    doc.text(`Paid Up Customers: ${paidUpCount}`, 14, 44);
    doc.text(`Overdue Customers: ${overdueCount}`, 14, 50);

    const tableData = customers.map(c => [
      c.name,
      c.phone || "No phone",
      `R${c.owed.toFixed(2)}`,
      c.daysOwing.toString(),
      c.owed === 0 ? "Paid Up" : c.daysOwing > 7 ? "Overdue" : "Owing"
    ]);

    autoTable(doc, {
      startY: 58,
      head: [['Customer', 'Phone', 'Total Owing', 'Days Owing', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 26, 26] },
    });

    doc.save(`Spaza_Ledger_Report_${todayStr}.pdf`);
  };

  const [showExportMenu, setShowExportMenu] = useState(false);

  // 2. Lists & Rankings
  // Top 5 customers owing the most
  const topOwedCustomers = [...customers]
    .filter(c => c.owed > 0)
    .sort((a, b) => b.owed - a.owed)
    .slice(0, 5);

  // Top 5 customers owing for the longest time
  const longestOutstandingCustomers = [...customers]
    .filter(c => c.owed > 0)
    .sort((a, b) => b.daysOwing - a.daysOwing)
    .slice(0, 5);

  return (
    <div className="w-full min-h-screen bg-[#F5EDE0] flex flex-col pb-32 font-sans">
      <header className="w-full pt-12 pb-4 px-6">
        <div className="max-w-[480px] mx-auto flex items-center justify-between">
          <h1 className="text-[26px] font-display font-black text-[#3B1A1A] leading-none uppercase tracking-tighter">
            Your Reports
          </h1>
          <div className="flex gap-2 relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="w-10 h-10 rounded-full bg-[#E5DACB] active:bg-[#D5CABA] flex items-center justify-center cursor-pointer transition-colors"
              title="Export Reports"
            >
              <Download className="text-[#3B1A1A] w-5 h-5" />
            </button>
            {showExportMenu && (
              <div className="absolute top-12 right-0 bg-white rounded-xl shadow-xl w-36 border border-[#E8D0BB] z-50 overflow-hidden">
                <button
                  onClick={() => { setShowExportMenu(false); handleDownloadPDF(); }}
                  className="w-full text-left px-4 py-3 text-sm font-bold text-[#3B1A1A] flex items-center gap-2 hover:bg-[#F5EDE0]"
                >
                  <FileText className="w-4 h-4 text-[#C8521A]" />
                  Save PDF
                </button>
                <div className="h-[1px] w-full bg-[#E8D0BB]"></div>
                <button
                  onClick={() => { setShowExportMenu(false); handleDownloadCSV(); }}
                  className="w-full text-left px-4 py-3 text-sm font-bold text-[#3B1A1A] flex items-center gap-2 hover:bg-[#F5EDE0]"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#196D31]" />
                  Save CSV
                </button>
              </div>
            )}
            <div className="w-10 h-10 rounded-full bg-[#E5DACB] flex items-center justify-center">
              <Calendar className="text-[#3B1A1A] w-5 h-5" />
            </div>
          </div>
        </div>
      </header>

      {customers.length === 0 ? (
        <main className="max-w-[480px] md:max-w-4xl lg:max-w-6xl mx-auto w-full flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="text-center p-8 bg-[#f9ede0] border-2 border-[#E8D0BB] rounded-3xl w-full max-w-lg">
            <p className="text-sm font-bold text-[#6E463B]">
              No records yet. Start adding customers and credit entries to see live reports, sharp sharp.
            </p>
          </div>
        </main>
      ) : (
        <main className="max-w-[480px] md:max-w-4xl lg:max-w-6xl mx-auto w-full flex-1 flex flex-col px-6 space-y-6 md:space-y-0 md:grid md:grid-cols-[1fr_1fr] lg:grid-cols-[1.2fr_1fr] md:gap-8">
          <div className="space-y-6">
          {/* Total Owing outstanding */}
          <section>
            <div className="bg-[#C8521A] rounded-[2rem] p-6 shadow-xl flex flex-col gap-2 relative overflow-hidden">
              <p className="font-display font-bold text-white/80 uppercase tracking-widest text-xs z-10">
                Total Outstanding Credit
              </p>
              <div className="flex items-baseline gap-3 z-10">
                <span className="text-[32px] font-display font-black tracking-tighter text-white">
                  R{totalOwed.toFixed(2)}
                </span>
              </div>
              
              <div className="inline-flex max-w-max items-center mt-1 bg-white/20 px-3 py-1 rounded-full z-10">
                <span className="text-white font-bold text-[10px] uppercase tracking-wider">
                  {owingCount} {owingCount === 1 ? "Customer" : "Customers"} Owing
                </span>
              </div>

              {/* Decorative circle */}
              <div className="absolute right-[-25px] top-1/2 -translate-y-1/2 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            </div>
          </section>

          {/* Today & Weekly metrics grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#f9ede0] p-4 rounded-2xl border border-[#E8D0BB] flex flex-col items-center justify-center text-center shadow-xs">
              <Banknote className="text-[#137333] w-5 h-5 mb-1.5" />
              <p className="font-display font-bold text-[10px] text-[#3B1A1A] tracking-widest uppercase mb-0.5">
                Collected Today
              </p>
              <p className="text-base font-display font-black text-[#137333]">R{collectedToday.toFixed(2)}</p>
            </div>
            
            <div className="bg-[#f9ede0] p-4 rounded-2xl border border-[#E8D0BB] flex flex-col items-center justify-center text-center shadow-xs">
              <History className="text-[#3B1A1A] w-5 h-5 mb-1.5" />
              <p className="font-display font-bold text-[10px] text-[#3B1A1A] tracking-widest uppercase mb-0.5">
                Collected Weekly
              </p>
              <p className="text-base font-display font-black text-[#3B1A1A]">R{collectedThisWeek.toFixed(2)}</p>
            </div>

            <div className="col-span-2 bg-[#FFE5D8] border-2 border-[#C8521A] p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-display font-bold text-[10px] text-[#3B1A1A] tracking-widest uppercase mb-0.5">
                    Credit Granted (This Week)
                  </p>
                  <p className="text-xl font-display font-black text-[#C8521A]">
                    R{creditGivenThisWeek.toFixed(2)}
                  </p>
                  <p className="text-[10px] font-bold text-[#6E463B] mt-1">
                    R{creditGivenToday.toFixed(2)} granted today
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-[#C8521A] flex items-center justify-center shrink-0 shadow-md">
                  <TrendingUp className="text-white w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Badges and Counts */}
          <section className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            <div className="flex-shrink-0 bg-[#196D31] text-white px-4 py-2 bg-opacity-95 rounded-full flex items-center gap-2 shadow-xs text-xs font-bold leading-none">
              <BadgeCheck className="w-4 h-4" />
              <span className="uppercase tracking-wider">{paidUpCount} Paid Up</span>
            </div>
            <div className="flex-shrink-0 bg-[#3B1A1A] text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-xs text-xs font-bold leading-none">
              <AlertTriangle className="w-4 h-4 text-[#F8B79B]" />
              <span className="uppercase tracking-wider">{overdueCount} Overdue (&gt;7d)</span>
            </div>
          </section>
          </div>

          <div className="space-y-6 pt-2 md:pt-0">
          {/* Highest Owed rankings */}
          <section>
            <div className="flex items-center justify-between mb-3 pl-1">
              <h2 className="text-base font-display font-black text-[#3B1A1A] tracking-tighter uppercase">Highest Owed Accounts</h2>
              <button onClick={() => onNavigate("customers")} className="font-display font-bold tracking-widest text-[#C8521A] uppercase text-[10px]">
                See All
              </button>
            </div>
            <div className="space-y-3">
              {topOwedCustomers.map((c, i) => {
                const names = c.name.split(" ");
                const initial = names.map(n => n[0]).join("").substring(0, 2).toUpperCase();
                return (
                  <div
                    key={c.id}
                    onClick={() => onViewCustomer(c.id)}
                    className="flex items-center justify-between p-4 bg-white border border-[#E8D0BB] rounded-2xl active:scale-95 transition-transform cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border border-[#C8521A] flex items-center justify-center font-display font-black text-xs text-[#C8521A]">
                        {initial}
                      </div>
                      <div>
                        <p className="text-sm font-display font-black text-[#3B1A1A] uppercase tracking-tighter leading-none mb-1">
                          {c.name}
                        </p>
                        <p className="text-[10px] font-bold text-[#6E463B] uppercase">
                          {c.daysOwing} {c.daysOwing === 1 ? "day" : "days"} owing
                        </p>
                      </div>
                    </div>
                    <p className="font-display font-black text-[#3B1A1A] text-sm">R{c.owed.toFixed(2)}</p>
                  </div>
                );
              })}

              {topOwedCustomers.length === 0 && (
                <p className="text-xs font-bold text-[#6E463B] italic text-center py-4 bg-white/40 border border-[#E8D0BB]/60 rounded-xl">
                  No active owing logs.
                </p>
              )}
            </div>
          </section>

          {/* Longevity rankings */}
          <section className="pb-8">
            <h2 className="text-base font-display font-black text-[#3B1A1A] tracking-tighter uppercase mb-3 pl-1">
              Longest Outstanding (Overdue)
            </h2>
            <div className="space-y-3">
              {longestOutstandingCustomers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onViewCustomer(c.id)}
                  className="bg-[#f9ede0] p-4 rounded-2xl border border-[#E8D0BB] flex justify-between items-center cursor-pointer active:scale-95 transition-transform shadow-xs"
                >
                  <div>
                    <p className="text-sm font-display font-black text-[#3B1A1A] uppercase tracking-tighter leading-none mb-1.5">
                      {c.name}
                    </p>
                    <p className="text-[9px] font-bold text-[#F5EDE0] bg-[#3B1A1A] inline-block px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {c.daysOwing} {c.daysOwing === 1 ? "Day" : "Days"} Outstanding
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <p className="font-display font-black text-[#3B1A1A] text-sm">R{c.owed.toFixed(2)}</p>
                    <ChevronRight className="text-[#C8521A] w-4 h-4" />
                  </div>
                </div>
              ))}

              {longestOutstandingCustomers.length === 0 && (
                <p className="text-xs font-bold text-[#6E463B] italic text-center py-4 bg-white/40 border border-[#E8D0BB]/60 rounded-xl">
                  No active overdue records.
                </p>
              )}
            </div>
          </section>
          </div>
        </main>
      )}
    </div>
  );
}
