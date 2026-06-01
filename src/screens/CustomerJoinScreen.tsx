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
  // Mode selection: "choice" (login or signup), "signup", or "login"
  const [activeForm, setActiveForm] = useState<"choice" | "signup" | "login">("choice");

  // Form Fields
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
    <div className="min-h-screen bg-[#F5EDE0] flex flex-col justify-between font-sans pb-12 pt-8 px-6">
      {/* Top Header */}
      <header className="w-full max-w-[420px] mx-auto flex items-center shrink-0">
        <button
          onClick={activeForm === "choice" ? onBackToWelcome : () => { setActiveForm("choice"); setErrorMsg(""); }}
          className="w-10 h-10 bg-[#E5DACB] rounded-full flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-[#3B1A1A]" />
        </button>
      </header>

      {/* Main Content Card */}
      <main className="max-w-[420px] w-full flex-1 flex flex-col justify-center py-6 mx-auto">
        <div className="bg-white rounded-3xl p-6 border border-[#E5DACB] shadow-sm text-left">
          {/* Shop Context Header */}
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#F5EDE0]">
            <div className="w-10 h-10 rounded-full bg-[#FFE5D8] flex items-center justify-center text-[#C8521A] shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-[#C8521A] uppercase tracking-wider leading-none">JOINING TUCKSHOP</p>
              <h2 className="text-lg font-display font-black text-[#3B1A1A] uppercase tracking-tight mt-0.5">
                {shopName}
              </h2>
            </div>
          </div>

          <h3 className="text-sm font-display font-black text-[#3B1A1A] uppercase tracking-wider mb-2">
            Ask for Credit Access
          </h3>
          <p className="text-xs text-[#6E463B] font-semibold mb-6 leading-relaxed">
            Create an account or login to connect. The shop owner will verify and link your credit records so you can keep track of what you owe anytime.
          </p>

          {errorMsg && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold uppercase tracking-wide">
              {errorMsg}
            </div>
          )}

          {activeForm === "choice" ? (
            <div className="space-y-3">
              <button
                onClick={() => { setActiveForm("signup"); setErrorMsg(""); }}
                className="w-full h-12 bg-[#3B1A1A] text-[#F5EDE0] rounded-xl flex items-center justify-center font-display font-bold text-xs uppercase tracking-wider shadow active:scale-95 transition-transform"
              >
                Create Customer Account
              </button>
              <button
                onClick={() => { setActiveForm("login"); setErrorMsg(""); }}
                className="w-full h-12 border-2 border-[#3B1A1A] text-[#3B1A1A] rounded-xl flex items-center justify-center font-display font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform"
              >
                Log In to Existing Account
              </button>
            </div>
          ) : activeForm === "login" ? (
            <div className="text-left space-y-4">
              <p className="text-xs font-semibold text-[#6E463B]">
                To join {shopName}, please sign in to your existing account. We will submit a link request to the owner.
              </p>
              <button
                onClick={() => { onBackToWelcome(); }}
                className="w-full h-12 bg-[#C8521A] text-[#F5EDE0] rounded-xl flex items-center justify-center font-display font-bold text-xs uppercase tracking-wider shadow active:scale-95 transition-transform"
              >
                Go to Main Customer Login
              </button>
            </div>
          ) : (
            /* Signup Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 pl-1">
                  <User className="w-3.5 h-3.5 text-[#C8521A]" />
                  <label className="text-[10px] font-display font-black tracking-widest text-[#C8521A] uppercase">Full Name</label>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Thabo Mokoena"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#F5EDE0]/60 text-[#3B1A1A] px-3.5 py-2 rounded-xl border border-[#E8D0BB] font-semibold text-xs outline-none focus:bg-white focus:border-[#C8521A]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 pl-1">
                  <Phone className="w-3.5 h-3.5 text-[#C8521A]" />
                  <label className="text-[10px] font-display font-black tracking-widest text-[#C8521A] uppercase">Phone Number</label>
                </div>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 082 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#F5EDE0]/60 text-[#3B1A1A] px-3.5 py-2 rounded-xl border border-[#E8D0BB] font-semibold text-xs outline-none focus:bg-white focus:border-[#C8521A]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 pl-1">
                  <Mail className="w-3.5 h-3.5 text-[#C8521A]" />
                  <label className="text-[10px] font-display font-black tracking-widest text-[#C8521A] uppercase">Email Address</label>
                </div>
                <input
                  type="email"
                  required
                  placeholder="e.g. thabo@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F5EDE0]/60 text-[#3B1A1A] px-3.5 py-2 rounded-xl border border-[#E8D0BB] font-semibold text-xs outline-none focus:bg-white focus:border-[#C8521A]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 pl-1">
                  <Lock className="w-3.5 h-3.5 text-[#C8521A]" />
                  <label className="text-[10px] font-display font-black tracking-widest text-[#C8521A] uppercase">Create Password</label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#F5EDE0]/60 text-[#3B1A1A] pl-3.5 pr-10 py-2 rounded-xl border border-[#E8D0BB] font-semibold text-xs outline-none focus:bg-white focus:border-[#C8521A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-[#3B1A1A]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 h-12 bg-[#3B1A1A] text-[#F5EDE0] rounded-xl flex items-center justify-center gap-2 font-display font-bold text-xs uppercase tracking-wider shadow active:scale-95 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <span>Send Join Request</span>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="text-center text-[10px] font-mono text-[#6E463B] shrink-0">
        Already registered? Access via our main customer page setup.
      </footer>
    </div>
  );
}
