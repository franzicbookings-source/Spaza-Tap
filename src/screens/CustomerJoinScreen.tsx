import React, { useState } from "react";
import { ArrowLeft, User, Phone, Mail, Lock, ShoppingBag, Eye, EyeOff, Loader2 } from "lucide-react";

interface CustomerJoinScreenProps {
  shopName: string;
  shopId: string;
  onJoinRequest: (fullName: string, phone: string, email: string, pin: string) => Promise<string | null>;
  onBackToWelcome: () => void;
}

export default function CustomerJoinScreen({
  shopName,
  shopId,
  onJoinRequest,
  onBackToWelcome,
}: CustomerJoinScreenProps) {
  const [activeForm, setActiveForm] = useState<"choice" | "signup" | "login">("choice");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMsg("");

    if (!fullName.trim()) {
      setErrorMsg("Full name is required");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("Phone number is required");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Valid email address is required");
      return;
    }
    if (!password.trim() || password.length < 6) {
      setErrorMsg("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    const err = await onJoinRequest(fullName.trim(), phone.trim(), email.trim().toLowerCase(), password.trim());
    setIsLoading(false);
    
    if (err) {
      setErrorMsg(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF5EC] flex flex-col justify-between font-sans pb-12 pt-8 px-5">
      
      {/* Visual Header */}
      <header className="w-full max-w-[420px] mx-auto flex items-center shrink-0">
        <button
          onClick={activeForm === "choice" ? onBackToWelcome : () => { setActiveForm("choice"); setErrorMsg(""); }}
          className="w-10 h-10 bg-[#F1EBE4] hover:bg-[#E5DACB] rounded-full flex items-center justify-center active:scale-95 transition-transform text-text-main"
          title="Back to choice"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
      </header>

      {/* Main Container Form */}
      <main className="max-w-[420px] w-full flex-1 flex flex-col justify-center py-6 mx-auto">
        <div className="bg-white rounded-[28px] p-6 border border-[#2B1114]/8 shadow-2xs text-left">
          
          {/* Shop Context logo */}
          <div className="flex items-center gap-3.5 mb-6 pb-4.5 border-b border-text-main/5">
            <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-transparent shrink-0 relative">
              <span className="absolute font-black text-xs text-[#3B1A1A] leading-tight text-center">Spaza<br/>Tap</span>
              <img 
                src="/icons/spaza-tap-logo.png" 
                alt="" 
                className="w-full h-full object-contain relative z-10 bg-white"
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black text-[#D94F12] uppercase tracking-wider leading-none block">JOINING TRUSTEE</span>
              <h2 className="text-base font-black text-text-main font-display uppercase tracking-tight mt-1 leading-none truncate">
                {shopName}
              </h2>
            </div>
          </div>

          <h3 className="text-sm font-black text-text-main uppercase tracking-wider mb-2">
            Request Credit Account
          </h3>
          <p className="text-xs text-text-light font-bold mb-5 leading-normal">
            Create an account or login to connect. The shop owner will verify and link your credit records so you can keep track of what you owe anytime.
          </p>

          {errorMsg && (
            <div className="p-3 mb-4 bg-red-100 border-l-4 border-red-600 text-red-700 rounded-r-xl text-xs font-bold uppercase tracking-wide">
              {errorMsg}
            </div>
          )}

          {activeForm === "choice" ? (
            <div className="space-y-4 pt-1.5">
              <button
                onClick={() => { setActiveForm("signup"); setErrorMsg(""); }}
                className="w-full h-13 bg-burgundy hover:bg-[#2B1114] text-white rounded-xl flex items-center justify-center font-bold text-xs uppercase tracking-wider shadow-xs active:scale-95 transition-transform"
              >
                Create Customer Account
              </button>
              <button
                onClick={() => { setActiveForm("login"); setErrorMsg(""); }}
                className="w-full h-13 border-2 border-burgundy text-burgundy bg-white hover:bg-[#FBF5EC] rounded-xl flex items-center justify-center font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform"
              >
                Sign In into Existing Account
              </button>
            </div>
          ) : activeForm === "login" ? (
            <div className="text-left space-y-4 pt-1.5">
              <p className="text-xs font-bold text-text-light leading-normal">
                To link into {shopName} records, please sign in using your customer account credentials first. We will automatically register a linking proposal request.
              </p>
              <button
                onClick={() => { onBackToWelcome(); }}
                className="w-full h-13 bg-[#D94F12] text-white rounded-xl flex items-center justify-center font-bold text-xs uppercase tracking-wider shadow-xs active:scale-95 transition-transform"
              >
                Go to Portal Login Screen
              </button>
            </div>
          ) : (
            /* Signup fields layout with pristine styles */
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 pl-0.5">
                  <User className="w-3.5 h-3.5 text-[#D94F12]" />
                  <label className="text-[10px] font-black tracking-wider text-[#D94F12] uppercase leading-none">Full Name</label>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sipho Nkosi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-12 bg-white px-4 rounded-xl border border-text-main/10 text-xs font-bold outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 pl-0.5">
                  <Phone className="w-3.5 h-3.5 text-[#D94F12]" />
                  <label className="text-[10px] font-black tracking-wider text-[#D94F12] uppercase leading-none">Phone Number</label>
                </div>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 083 456 7890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-12 bg-white px-4 rounded-xl border border-text-main/10 text-xs font-bold outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 pl-0.5">
                  <Mail className="w-3.5 h-3.5 text-[#D94F12]" />
                  <label className="text-[10px] font-black tracking-wider text-[#D94F12] uppercase leading-none">Email Address</label>
                </div>
                <input
                  type="email"
                  required
                  placeholder="e.g. sipho@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 bg-white px-4 rounded-xl border border-text-main/10 text-xs font-bold outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 pl-0.5">
                  <Lock className="w-3.5 h-3.5 text-[#D94F12]" />
                  <label className="text-[10px] font-black tracking-wider text-[#D94F12] uppercase leading-none">Choose Password</label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Min 6 characters length"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 bg-white pl-4 pr-11 rounded-xl border border-text-main/10 text-xs font-bold outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-main hover:text-primary outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 h-13 bg-burgundy hover:bg-[#2B1114] text-white rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider shadow-xs active:scale-95 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Sending Request...</span>
                  </>
                ) : (
                  <span>Send Join Request</span>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="text-center text-[10px] font-bold text-text-light shrink-0">
        Already registered? Log in directly using our customer layout portal.
      </footer>
    </div>
  );
}
