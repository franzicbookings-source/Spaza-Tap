import React, { useState } from "react";
import {
  Search,
  UserPlus,
  Smile,
  QrCode,
  X
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
    // Search query filter: by name, phone, address, or ref number
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
        setScanError("Invalid QR Code FORMAT. Not a Cwebezela customer ID.");
      }
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F5EDE0] pb-28">
      <header className="w-full pt-12 pb-4 px-6 relative">
        <div className="max-w-[480px] md:max-w-[640px] lg:max-w-4xl mx-auto flex items-end justify-between">
          <div>
            <h1 className="text-[26px] md:text-3xl lg:text-4xl font-display font-black text-[#3B1A1A] leading-none uppercase tracking-tighter w-full mb-1 lg:mb-2">
              Your Customers
            </h1>
            <p className="text-xs lg:text-sm font-bold text-[#6E463B]">
              {customers.length} {customers.length === 1 ? "customer" : "customers"} &mdash; {totalOverdueCount} overdue
            </p>
          </div>
          <button 
            onClick={() => { setShowScanner(true); setScanError(""); }}
            className="w-10 h-10 lg:w-12 lg:h-12 bg-[#3B1A1A] text-[#F5EDE0] rounded-full flex items-center justify-center active:scale-95 transition-transform shrink-0 shadow-md"
          >
            <QrCode className="w-5 h-5 lg:w-6 lg:h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-[480px] md:max-w-[640px] lg:max-w-4xl mx-auto px-6">
        {/* Search */}
        <div className="relative mb-6 lg:mb-8">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-[#3B1A1A] w-5 h-5 lg:w-6 lg:h-6" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ref#..."
            className="w-full pl-8 lg:pl-10 pr-4 py-3 lg:py-4 bg-transparent border-b-2 border-[#3B1A1A]/30 text-[#3B1A1A] text-base lg:text-lg font-bold outline-none focus:border-[#3B1A1A] transition-all placeholder:text-[#3B1A1A]/50"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 lg:mb-8 no-scrollbar">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`flex-shrink-0 px-4 py-2 lg:px-6 lg:py-2.5 rounded-full text-xs lg:text-sm font-display font-bold uppercase tracking-wider transition-all border
                  ${
                    isActive
                      ? "bg-[#C8521A] text-white border-[#C8521A] shadow-sm"
                      : "bg-[#E5DACB] text-[#3B1A1A] border-[#3B1A1A]/10 hover:bg-[#D9CEBF]"
                  }
                `}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Customer List / Empty States */}
        {customers.length === 0 ? (
          <div className="text-center py-12 px-4 bg-[#f9ede0] border-2 border-[#E5DACB] rounded-3xl lg:py-20 lg:rounded-[36px]">
            <Smile className="w-10 h-10 lg:w-16 lg:h-16 text-[#C8521A] mx-auto mb-3 lg:mb-5" />
            <p className="text-sm lg:text-base font-bold text-[#3B1A1A]">
              No customers added yet. Add your first customer to start tracking.
            </p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 px-4 bg-[#f9ede0] border-2 border-[#E5DACB] rounded-3xl lg:py-20 lg:rounded-[36px]">
            <p className="text-sm lg:text-base font-bold text-[#6E463B]">
              No customers found. Try searching for something else.
            </p>
          </div>
        ) : (
          <div className="space-y-4 md:grid md:grid-cols-2 md:space-y-0 md:gap-4 lg:gap-6">
            {filteredCustomers.map((customer) => {
              const badge = getBadgeInfo(customer);
              
              let daysText = "";
              if (customer.owed === 0 || customer.status === "settled") {
                daysText = "Paid Up";
              } else if (customer.daysOwing > 30) {
                daysText = `${customer.daysOwing} days - Seriously overdue`;
              } else {
                daysText = `${customer.daysOwing} days owing`;
              }

              return (
                <div
                  key={customer.id}
                  onClick={() => onViewCustomer(customer.id)}
                  className="bg-[#f9ede0] border-2 border-[#E5DACB] p-5 rounded-3xl flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-start gap-4 w-full">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-display font-black text-lg shrink-0 bg-[#C8521A]/10 text-[#C8521A] border-2 border-[#C8521A]/20">
                      {customer.photoUrl ? (
                        <img src={customer.photoUrl} alt={customer.name} className="w-full h-full object-cover" />
                      ) : (
                        customer.initials
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-base font-display font-black text-[#3B1A1A] tracking-tighter uppercase leading-none truncate">
                          {customer.name}
                        </h3>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badge.bg}`}>
                          {badge.text}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#6E463B] mb-2">{customer.phone || "No phone number"}</p>
                      <div className="flex items-baseline gap-1.5 pt-1 border-t border-[#3B1A1A]/5">
                        <span className="text-sm font-display font-black text-[#C8521A]">
                          R{customer.owed.toFixed(2)}
                        </span>
                        <span 
                          className="text-[11px] font-bold text-[#6E463B]"
                          dangerouslySetInnerHTML={{ __html: `&mdash; ${daysText}` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Add Customer Button with full exact label */}
      <button
        onClick={() => onNavigate("newCustomer")}
        className="fixed right-6 bottom-[100px] z-50 px-6 h-14 bg-[#3B1A1A] text-[#F5EDE0] rounded-full shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-[#4d2323]"
      >
        <UserPlus className="w-5 h-5" />
        <span className="font-display font-bold text-xs uppercase tracking-wider">+ Add Customer</span>
      </button>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm flex-col">
          <div className="bg-white rounded-3xl max-w-[360px] w-full p-4 relative overflow-hidden flex flex-col items-center">
            <button
              onClick={() => setShowScanner(false)}
              className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center bg-[#F5EDE0] text-[#3B1A1A] rounded-full z-[70] active:scale-95 transition-transform"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-full text-center mt-2 mb-4 pr-10">
              <h2 className="text-xl font-display font-black text-[#3B1A1A] uppercase tracking-tight">
                Scan ID
              </h2>
              <p className="text-xs font-semibold text-[#6E463B] leading-tight mt-1">
                Point camera at customer's My ID QR Code to quickly open their profile.
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
                <p className="text-[11px] font-bold text-red-700 text-center uppercase tracking-wide">
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
