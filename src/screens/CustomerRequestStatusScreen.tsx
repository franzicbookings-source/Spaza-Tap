import React, { useState } from "react";
import { Loader2, ShieldAlert, LogOut, Code, ArrowRight } from "lucide-react";
import { CustomerAccessRequest } from "../types";

interface CustomerRequestStatusScreenProps {
  requests: CustomerAccessRequest[];
  onLogout: () => void;
  onManualCodeSubmit?: (code: string) => Promise<string | null>;
}

export default function CustomerRequestStatusScreen({
  requests = [],
  onLogout,
  onManualCodeSubmit,
}: CustomerRequestStatusScreenProps) {
  const [shopCode, setShopCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Determine latest request's status
  const activeRequest = requests && requests.length > 0 ? requests[requests.length - 1] : null;
  const status = activeRequest ? activeRequest.status : "none";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onManualCodeSubmit && shopCode.trim()) {
      setIsLoading(true);
      setErrorMsg("");
      const err = await onManualCodeSubmit(shopCode.trim());
      setIsLoading(false);
      if (err) {
        setErrorMsg(err);
      } else {
        setShopCode("");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EDE0] flex flex-col items-center justify-between font-sans pb-12 pt-16 px-6">
      {/* Top Brand Logo */}
      <div className="w-full max-w-[420px] text-center">
        <h1 className="text-xl font-display font-black text-[#3B1A1A] tracking-tighter uppercase leading-none mb-1">
          SPAZA TAP
        </h1>
        <p className="text-[10px] font-mono text-[#C8521A] uppercase tracking-widest">
          Customer Ledger Access
        </p>
      </div>

      <main className="max-w-[420px] w-full flex-1 flex flex-col justify-center py-6 text-center">
        {status === "pending" ? (
          <div className="bg-white p-8 rounded-3xl border border-[#E5DACB] shadow-sm flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#FFE5D8] flex items-center justify-center text-[#C8521A]">
              <div className="w-6 h-6 rounded-sm border-2 border-[#C8521A] flex flex-col items-center justify-center space-y-1 relative before:w-6 before:h-0.5 before:bg-[#C8521A] before:absolute before:-top-2 after:w-6 after:h-0.5 after:bg-[#C8521A] after:absolute after:-bottom-2">
                 <div className="w-0 border-l-[8px] border-r-[8px] border-l-transparent border-r-transparent border-t-[8px] border-t-[#C8521A]"></div>
                 <div className="w-0 border-l-[8px] border-r-[8px] border-l-transparent border-r-transparent border-b-[8px] border-b-[#C8521A]"></div>
              </div>
            </div>
            <div>
              <h2 className="font-display font-black text-[#3B1A1A] uppercase text-lg leading-tighter mb-2">
                Request Sent!
              </h2>
              <p className="text-xs font-semibold text-[#6E463B] leading-relaxed max-w-[280px] mx-auto">
                Your shop owner has received your request. Ask them to approve you from their phone next time you go to the store.
              </p>
            </div>
            <button
               onClick={() => window.location.reload()}
               className="mt-4 px-6 h-11 bg-[#E5DACB] text-[#3B1A1A] rounded-xl font-display font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform"
            >
               Check Again
            </button>
          </div>
        ) : status === "rejected" ? (
          <div className="bg-white p-8 rounded-3xl border border-[#E5DACB] shadow-sm flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-display font-black text-[#3B1A1A] uppercase text-lg leading-tighter mb-2">
                Request Not Approved
              </h2>
              <p className="text-xs font-semibold text-[#6E463B] leading-relaxed max-w-[280px] mx-auto">
                Your request was not approved. Please contact the shop owner for manual reference allocation and linking.
              </p>
              
              {/* Optional retry manual code */}
              <button
                onClick={() => {
                  // Bypass status view by submitting new request
                  // Just show enter code panel
                  setShopCode("");
                  setErrorMsg("");
                }}
                className="mt-4 px-4 py-2 bg-[#F5EDE0] text-[#3B1A1A] text-[10px] font-display font-bold uppercase tracking-wider rounded-xl hover:bg-white"
              >
                Enter Another Shop Code
              </button>
            </div>
          </div>
        ) : (
          /* None - Let them Enter a Shop Code manually */
          <div className="bg-white p-6 rounded-3xl border border-[#E5DACB] shadow-sm text-left">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#FFE5D8] flex items-center justify-center text-[#C8521A]">
                <Code className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-black text-[#3B1A1A] uppercase text-sm leading-none">
                  Connect to a Shop
                </h3>
                <p className="text-[10px] text-[#6E463B] font-bold">Ask the tuckshop owner for their Shop Code</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold uppercase tracking-wider">
                  {errorMsg}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-display font-black tracking-widest text-[#C8521A] uppercase pl-1">
                  Enter Shop Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CWEZ-4821"
                  value={shopCode}
                  onChange={(e) => setShopCode(e.target.value)}
                  className="w-full bg-[#F5EDE0] text-[#3B1A1A] px-4 py-3 rounded-xl border border-[#E8D0BB] font-mono font-black text-sm uppercase tracking-widest outline-none focus:border-[#C8521A]"
                />
              </div>

              <button
                type="submit"
                disabled={!shopCode.trim() || isLoading}
                className="w-full h-12 bg-[#3B1A1A] text-[#F5EDE0] rounded-xl flex items-center justify-center gap-2 font-display font-bold text-xs uppercase tracking-wider shadow active:scale-95 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Request Access</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Logout button at bottom */}
      <footer className="w-full max-w-[420px] px-6 shrink-0">
        <button
          onClick={onLogout}
          className="w-full h-12 border-2 border-red-500/20 text-red-600 rounded-full flex items-center justify-center gap-2 font-display font-bold text-xs uppercase tracking-wider hover:bg-white active:scale-95 transition-transform shadow-xs"
        >
          <LogOut className="w-4 h-4" /> Sign Out Account
        </button>
      </footer>
    </div>
  );
}
