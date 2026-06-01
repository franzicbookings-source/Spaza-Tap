import React, { useState } from "react";
import {
  Search,
  UserPlus,
  Smile,
  QrCode,
  X,
  Phone,
  Shield,
  CreditCard,
  Hash,
  Activity
} from "lucide-react";
import { Scanner } from '@yudiel/react-qr-scanner';
import { ScreenState, Customer } from "../types";

interface CustomersScreenProps {
  onNavigate: (screen: ScreenState) => void;
  onViewCustomer: (id: string) => void;
  customers: Customer[];
}

export default function CustomersScreen({
  onNavigate,
  onViewCustomer,
  customers = [],
}: CustomersScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"All" | "Owing" | "Overdue" | "Paid Up">("All");
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState("");

  const filterTabs = ["All", "Owing", "Overdue", "Paid Up"] as const;

  const getBadgeInfo = (customer: Customer) => {
    if (customer.owed === 0 || customer.status === "settled") {
      return { text: "Paid Up", bg: "bg-[#E6F4EA] text-[#137333] border-[#137333]/20" };
    }
    if (customer.status === "serious" || customer.daysOwing > 30) {
      return { text: "Seriously Overdue", bg: "bg-[#FCE8E6] text-[#C5221F] border-[#C5221F]/20" };
    }
    if (customer.daysOwing > 15) {
      return { text: "Overdue", bg: "bg-[#FFEFE2] text-[#C8521A] border-[#C8521A]/20" };
    }
    if (customer.status === "warning" || customer.daysOwing > 7) {
      return { text: "Warning", bg: "bg-[#FEF7E0] text-[#B06000] border-[#B06000]/20" };
    }
    return { text: "Good", bg: "bg-[#E6F4EA] text-[#137333] border-[#137333]/20" };
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          customer.phone.includes(searchQuery) ||
                          (customer.area && customer.area.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (customer.customerReferenceNumber && customer.customerReferenceNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    if (activeFilter === "All") return true;
    if (activeFilter === "Owing") return customer.owed > 0;
    if (activeFilter === "Overdue") return customer.owed > 0 && customer.daysOwing >= 15;
    if (activeFilter === "Paid Up") return customer.owed === 0 || customer.status === "settled";
    return true;
  });

  const totalOwing = customers.reduce((acc, c) => acc + c.owed, 0);
  const totalOverdueCount = customers.filter(c => c.owed > 0 && c.daysOwing >= 15).length;

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

  return (
    <div className="w-full min-h-screen bg-[#FBF5EC] pb-32">
      
      {/* Header with detailed dynamic metrics */}
      <header className="w-full pt-6 pb-4 px-5 bg-white border-b border-[#2B1114]/8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-black text-text-main font-display tracking-tight uppercase leading-none">
              Your Customers
            </h1>
            <p className="text-xs font-bold text-text-light mt-1.5 leading-none">
              {customers.length} total · {totalOverdueCount} overdue · R{totalOwing.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} outstanding
            </p>
          </div>
          <button 
            onClick={() => { setShowScanner(true); setScanError(""); }}
            className="p-3 bg-[#FFF0E7] text-[#D94F12] border border-primary/20 rounded-full flex items-center justify-center active:scale-95 transition-transform shrink-0"
          >
            <QrCode className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="px-5 mt-5">
        
        {/* Search Bar - styled exactly per rules */}
        <div className="relative mb-5 bg-white rounded-[18px] border border-text-main/10 h-14 flex items-center px-4.5 shadow-xs">
          <Search className="text-text-muted w-5 h-5 shrink-0 select-none mr-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone or reference..."
            className="w-full bg-transparent text-text-main text-sm font-semibold outline-none placeholder:text-text-muted"
          />
        </div>

        {/* Filter Choice Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`flex-shrink-0 px-4.5 h-10 rounded-full text-xs font-bold uppercase tracking-wider transition-all border shrink-0
                  ${
                    isActive
                      ? "bg-[#D94F12] text-white border-[#D94F12] shadow-xs"
                      : "bg-[#EFE8DD] text-text-main border-text-main/5 hover:bg-[#E5DACB]"
                  }
                `}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Customer Listing with 2-Column Desktop Grid and Detailed Stacked Cards */}
        {customers.length === 0 ? (
          <div className="text-center py-14 px-5 bg-white border border-[#2B1114]/8 rounded-[24px]">
            <Smile className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="text-xs font-bold text-text-main">
              No customers added yet. Click "+ Add Customer" below!
            </p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-14 px-5 bg-white border border-[#2B1114]/8 rounded-[24px]">
            <p className="text-xs font-bold text-text-light">
              No customers matched your search query.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredCustomers.map((customer) => {
              const badge = getBadgeInfo(customer);
              const customLimit = customer.limit || 2000;
              const creditLeft = Math.max(0, customLimit - customer.owed);
              
              return (
                <div
                  key={customer.id}
                  onClick={() => onViewCustomer(customer!.id || "")}
                  className="bg-white border border-[#2B1114]/8 p-4 rounded-[24px] cursor-pointer hover:border-[#D94F12]/30 active:scale-[0.99] transition-all shadow-xs relative overflow-hidden"
                >
                  {/* Top row with initial, name details and owed money */}
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center font-display font-black text-sm shrink-0 bg-[#FFF0E7] text-[#D94F12] border border-primary/20">
                      {customer.photoUrl ? (
                        <img src={customer.photoUrl} alt={customer.name} className="w-full h-full object-cover" />
                      ) : (
                        customer.initials || "C"
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <h3 className="text-sm font-extrabold text-text-main truncate uppercase leading-none">
                          {customer.name}
                        </h3>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${badge.bg}`}>
                          {badge.text}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold text-text-light leading-none">
                        <Phone className="w-3 h-3 text-text-muted" />
                        <span>{customer.phone || "No phone indicator"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mid Separator and visual outstanding ledger status */}
                  <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-text-main/5">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Owed Amount</span>
                    <span className={`text-base font-black ${customer.owed > 0 ? "text-[#C9312C]" : "text-emerald-600"}`}>
                      R{customer.owed.toFixed(2)}
                    </span>
                  </div>

                  {/* High Fidelity Detailed Bottom Grid - specified per list rules */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-3 pt-3.5 border-t border-text-main/5 text-[11px] font-semibold text-text-light">
                    
                    <div>
                      <span className="text-[9px] text-text-muted uppercase tracking-wider block mb-0.5">Credit Limit</span>
                      <span className="font-extrabold text-[#2B1114]">R{customLimit.toFixed(2)}</span>
                    </div>

                    <div>
                      <span className="text-[9px] text-text-muted uppercase tracking-wider block mb-0.5">Credit Left</span>
                      <span className={`font-extrabold ${creditLeft <= 150 ? "text-danger" : "text-emerald-600"}`}>
                        R{creditLeft.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-text-muted uppercase tracking-wider block mb-0.5">Days Owing</span>
                      <span className="font-extrabold text-[#2B1114]">
                        {customer.owed > 0 ? `${customer.daysOwing} Days` : "Paid Up"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-text-muted uppercase tracking-wider block mb-0.5">Doc Ref</span>
                      <span className="font-extrabold text-[#2B1114] font-mono tracking-wider">
                        {customer.customerReferenceNumber || "No Ref"}
                      </span>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Add Customer Button - exact styling details */}
      <button
        onClick={() => onNavigate("newCustomer")}
        className="fixed right-5 bottom-[96px] z-45 px-5.5 h-14 bg-[#D94F12] text-white rounded-full shadow-[0_8px_24px_rgba(217,79,18,0.3)] flex items-center justify-center gap-2 active:scale-95 transition-all text-xs font-bold uppercase tracking-wider"
      >
        <UserPlus className="w-5 h-5 stroke-[2.5]" />
        <span>+ Add Customer</span>
      </button>

      {/* QR Scanner Modal markup */}
      {showScanner && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-5 bg-black/80 backdrop-blur-xs flex-col">
          <div className="bg-white rounded-3xl max-w-[360px] w-full p-4 relative overflow-hidden flex flex-col items-center">
            <button
              onClick={() => setShowScanner(false)}
              className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center bg-[#FBF5EC] text-text-main rounded-full z-[70] active:scale-95 transition-transform"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-full text-center mt-2 mb-4 pr-10">
              <h2 className="text-lg font-black text-text-main uppercase font-display tracking-tight leading-none">
                Scan Customer Pin
              </h2>
              <p className="text-[11px] font-bold text-text-light leading-tight mt-1">
                Align QR Code within the bounds to open active customer account.
              </p>
            </div>
            
            <div className="w-full h-[300px] bg-black rounded-2xl overflow-hidden relative">
              <Scanner 
                onScan={handleScan}
                formats={['qr_code']}
              />
            </div>
            
            {scanError && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-xl w-full">
                <p className="text-[10px] font-bold text-red-700 text-center uppercase tracking-wide">
                  {scanError}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
