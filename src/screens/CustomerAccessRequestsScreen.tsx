import React, { useState } from "react";
import { ArrowLeft, User, Phone, Mail, Search, Check, X, CheckSquare, PlusCircle } from "lucide-react";
import { CustomerAccessRequest, Customer } from "../types";

interface CustomerAccessRequestsScreenProps {
  requests: CustomerAccessRequest[];
  customers: Customer[];
  onApproveLink: (requestId: string, customerId: string) => void;
  onApproveCreate: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onBack: () => void;
  onNavigate?: (screen: any) => void;
}

export default function CustomerAccessRequestsScreen({
  requests = [],
  customers = [],
  onApproveLink,
  onApproveCreate,
  onReject,
  onBack,
  onNavigate
}: CustomerAccessRequestsScreenProps) {
  // Pending list
  const pendingRequests = requests.filter(r => r.status === "pending");

  // Selection Modal State
  const [selectedRequest, setSelectedRequest] = useState<CustomerAccessRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = customers.filter(customer => {
    const q = searchQuery.toLowerCase();
    const nameMatch = customer.name.toLowerCase().includes(q);
    const phoneMatch = (customer.phone || "").toLowerCase().includes(q);
    const areaMatch = (customer.area || "").toLowerCase().includes(q);
    return nameMatch || phoneMatch || areaMatch;
  });

  const handleLinkCustomer = (customerId: string) => {
    if (selectedRequest) {
      onApproveLink(selectedRequest.id, customerId);
      setSelectedRequest(null);
      setSearchQuery("");
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    try {
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString();
      }
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
      }
      return new Date(timestamp).toLocaleDateString();
    } catch (e) {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EDE0] flex flex-col font-sans pb-16 relative">
      <header className="w-full pt-12 pb-4 px-6 flex items-center justify-between max-w-[480px] md:max-w-none mx-auto">
        <button
          onClick={onBack}
          className="w-10 h-10 bg-[#E5DACB] rounded-full flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-[#3B1A1A]" />
        </button>
        <span className="text-[10px] font-display font-black tracking-widest text-[#C8521A] uppercase bg-[#FFE5D8] px-3 py-1 rounded-full">
          Customer Requests ({pendingRequests.length})
        </span>
      </header>

      <main className="max-w-[480px] md:max-w-none mx-auto w-full flex-1 flex flex-col px-6">
        <h2 className="text-2xl font-display font-black text-[#3B1A1A] uppercase tracking-tighter mb-4">
          Access Approvals
        </h2>

        {pendingRequests.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center -mt-10">
            <div className="bg-white border border-[#E5DACB]/60 p-12 rounded-3xl text-center flex flex-col items-center justify-center w-full max-w-2xl mx-auto shadow-sm">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                <CheckSquare className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="font-display font-black uppercase tracking-tighter text-2xl text-[#3B1A1A] mb-3">
                All Requests Cleared!
              </h3>
              <p className="text-sm font-semibold text-[#6E463B] max-w-sm mb-8">
                No new digital customer requests. Share your shop's QR code to let more customers apply for a tab, or manage your existing customers below.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <button
                   onClick={() => onNavigate?.("customers")}
                   className="px-8 h-12 bg-[#3B1A1A] text-white rounded-xl font-display font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform"
                >
                   Manage Customers
                </button>
                <button
                   onClick={() => onNavigate?.("shopQrCode")}
                   className="px-8 h-12 bg-[#F5EDE0] text-[#3B1A1A] rounded-xl font-display font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform"
                >
                   Get QR Poster
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white border border-[#E5DACB] rounded-2xl p-5 shadow-sm space-y-4"
              >
                <div>
                  <h3 className="font-display font-black text-lg text-[#3B1A1A] uppercase leading-none mb-1">
                    {req.customerName}
                  </h3>
                  <span className="text-[10px] font-mono text-[#6E463B] uppercase">
                    Requested on {formatDate(req.createdAt)}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-semibold text-[#6E463B] bg-[#f9ede0]/60 p-3 rounded-xl border border-[#3B1A1A]/5">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#C8521A]" />
                    <span>{req.customerPhoneNumber}</span>
                  </div>
                  {req.customerEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#C8521A]" />
                      <span className="break-all">{req.customerEmail}</span>
                    </div>
                  )}
                </div>

                {/* Footer and decision buttons */}
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="h-10 border-2 border-[#3B1A1A] text-[#3B1A1A] rounded-xl font-display font-bold text-[10px] uppercase tracking-wider active:scale-95 transition-transform flex items-center justify-center gap-1"
                    >
                      <User className="w-3 h-3" /> Approve & Link
                    </button>
                    <button
                      onClick={() => onApproveCreate(req.id)}
                      className="h-10 bg-[#3B1A1A] text-white rounded-xl font-display font-bold text-[10px] uppercase tracking-wider active:scale-95 transition-transform flex items-center justify-center gap-1"
                    >
                      <PlusCircle className="w-3 h-3" /> Create New
                    </button>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to reject this access request?")) {
                        onReject(req.id);
                      }
                    }}
                    className="w-full h-10 border border-red-500/30 font-display font-bold text-[10px] uppercase tracking-wider text-red-600 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1"
                  >
                    <X className="w-3 h-3" /> Reject Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* SELECT AND LINK CUSTOMER MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#F5EDE0] rounded-3xl max-w-[420px] w-full p-6 border border-[#E8D0BB] shadow-2xl relative flex flex-col max-h-[85vh]">
            <button
              onClick={() => {
                setSelectedRequest(null);
                setSearchQuery("");
              }}
              className="absolute right-4 top-4 w-7 h-7 bg-[#E5DACB] rounded-full flex items-center justify-center text-[#3B1A1A] font-bold"
            >
              ✕
            </button>
            
            <h3 className="text-base font-display font-black text-[#3B1A1A] mb-1 uppercase tracking-tighter">
              LINK TO REGISTERED CLIENT
            </h3>
            <p className="text-[10px] font-bold text-[#6E463B] uppercase mb-4 leading-none">
              Request by: {selectedRequest.customerName} ({selectedRequest.customerPhoneNumber})
            </p>

            {/* Quick Search Input */}
            <div className="relative mb-4 shrink-0">
              <input
                type="text"
                placeholder="Search by Name, Phone, Area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-[#3B1A1A] pl-10 pr-4 py-2.5 rounded-xl border border-[#E8D0BB] font-semibold text-xs outline-none focus:border-[#C8521A]"
              />
              <Search className="w-4 h-4 text-[#C8521A] absolute left-3.5 top-3.5" />
            </div>

            {/* Scrollable list of existing customer entities */}
            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {filteredCustomers.length === 0 ? (
                <p className="text-center text-xs font-mono py-6 text-[#6E463B]">No registered clients match query</p>
              ) : (
                filteredCustomers.map(customer => (
                  <div
                    key={customer.id}
                    onClick={() => handleLinkCustomer(customer.id)}
                    className="bg-white p-3.5 rounded-xl border border-[#E8D0BB] flex items-center justify-between cursor-pointer hover:border-[#C8521A] active:scale-[0.98] transition-all"
                  >
                    <div>
                      <h4 className="font-bold text-[#3B1A1A] text-xs uppercase">{customer.name}</h4>
                      <p className="text-[10px] font-semibold text-[#6E463B] mt-0.5">
                        {customer.phone || "No phone"} • {customer.area || "No area"}
                      </p>
                    </div>
                    <ChevronRightButton />
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => {
                setSelectedRequest(null);
                setSearchQuery("");
              }}
              className="w-full mt-4 h-11 bg-[#3B1A1A] text-[#F5EDE0] rounded-xl font-display font-bold text-xs uppercase tracking-wider shrink-0"
            >
              Cancel Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronRightButton() {
  return (
    <div className="w-6 h-6 bg-[#C8521A]/10 text-[#C8521A] rounded-full flex items-center justify-center">
      <Check className="w-3.5 h-3.5" />
    </div>
  );
}
