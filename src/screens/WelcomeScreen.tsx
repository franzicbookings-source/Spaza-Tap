import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Store, User, ArrowLeft, Shield, Users, QrCode, X, Download } from "lucide-react";
import { Scanner } from '@yudiel/react-qr-scanner';

interface WelcomeScreenProps {
  onLogin: (email: string, pin: string) => Promise<string | null>;
  onSignup: (email: string, shopName: string, ownerName: string, phone: string, pin: string) => Promise<string | null>;
  onCustomerLogin: (email: string, pin: string) => Promise<string | null>;
  onCustomerSignup: (fullName: string, phone: string, email: string, pin: string, referenceNumber: string) => Promise<string | null>;
  onPasswordReset?: (email: string) => Promise<string | null>;
  onGoogleAuth?: (role: "shop_owner" | "customer") => Promise<string | null>;
  onShopScanned?: (shopCode: string) => void;
}

export default function WelcomeScreen({ 
  onLogin, 
  onSignup,
  onCustomerLogin,
  onCustomerSignup,
  onPasswordReset,
  onGoogleAuth,
  onShopScanned
}: WelcomeScreenProps) {
  // Navigation states: role selection first, then forms
  const [userRole, setUserRole] = useState<"none" | "shop_owner" | "customer">("none");
  const [activeForm, setActiveForm] = useState<"none" | "login" | "signup">("none");
  
  // Shop Owner Form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupShopName, setSignupShopName] = useState("");
  const [signupOwnerName, setSignupOwnerName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPin, setSignupPin] = useState("");

  // Customer Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPin, setCustomerPin] = useState("");
  const [customerRefNo, setCustomerRefNo] = useState("");

  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState("");

  // Common UI states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!loginEmail.trim()) {
      setErrorMsg("Missing email address");
      return;
    }
    if (!loginPin.trim()) {
      setErrorMsg("Missing password");
      return;
    }
    setIsLoading(true);

    let err;
    if (userRole === "customer") {
      err = await onCustomerLogin(loginEmail, loginPin);
    } else {
      err = await onLogin(loginEmail, loginPin);
    }
    
    setIsLoading(false);
    if (err) {
      setErrorMsg(err);
    }
  };

  const handleGoogleAuthClick = async () => {
    if (isLoading || !onGoogleAuth || userRole === "none") return;
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    
    const err = await onGoogleAuth(userRole);
    setIsLoading(false);
    if (err) {
      setErrorMsg(err);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMsg(null);

    if (userRole === "customer") {
      if (!customerName.trim()) {
        setErrorMsg("Full name is required");
        return;
      }
      if (!customerPhone.trim()) {
        setErrorMsg("Phone number is required");
        return;
      }
      if (!customerEmail.trim()) {
        setErrorMsg("Email address is required");
        return;
      }
      if (!customerPin.trim()) {
        setErrorMsg("Password is required");
        return;
      }
      if (customerPin.length < 6) {
        setErrorMsg("Password must be at least 6 characters.");
        return;
      }
      if (!customerRefNo.trim()) {
        setErrorMsg("Customer reference number is required.");
        return;
      }

      setIsLoading(true);
      const err = await onCustomerSignup(
        customerName.trim(),
        customerPhone.trim(),
        customerEmail.trim(),
        customerPin.trim(),
        customerRefNo.trim()
      );
      setIsLoading(false);
      if (err) {
        setErrorMsg(err);
      }
    } else {
      if (!signupEmail.trim()) {
        setErrorMsg("Email address is required");
        return;
      }
      if (!signupShopName.trim()) {
        setErrorMsg("Shop name is required");
        return;
      }
      if (!signupOwnerName.trim()) {
        setErrorMsg("Owner name is required");
        return;
      }
      if (!signupPhone.trim()) {
        setErrorMsg("Missing phone number");
        return;
      }
      if (!signupPin.trim()) {
        setErrorMsg("Missing password");
        return;
      }
      if (signupPin.length < 6) {
        setErrorMsg("Weak password. Minimum 6 characters.");
        return;
      }
      setIsLoading(true);
      const err = await onSignup(signupEmail, signupShopName, signupOwnerName, signupPhone, signupPin);
      setIsLoading(false);
      if (err) {
        setErrorMsg(err);
      }
    }
  };

  const handlePasswordResetClick = async () => {
    if (!loginEmail.trim()) {
      setErrorMsg("Please enter your email address first to reset your password.");
      setSuccessMsg(null);
      return;
    }
    if (!onPasswordReset) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const err = await onPasswordReset(loginEmail.trim());
    setIsLoading(false);
    
    if (err) {
      setErrorMsg(err);
    } else {
      setSuccessMsg("Password reset email sent! Check your inbox.");
    }
  };

  const handleGoBack = () => {
    if (activeForm !== "none") {
      setActiveForm("none");
      setErrorMsg(null);
    } else {
      setUserRole("none");
      setErrorMsg(null);
    }
  };

  const clearForm = () => {
    setActiveForm("none");
    setLoginEmail("");
    setLoginPin("");
    setSignupEmail("");
    setSignupShopName("");
    setSignupOwnerName("");
    setSignupPhone("");
    setSignupPin("");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerPin("");
    setCustomerRefNo("");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return (
    <main className="w-full max-w-[600px] mx-auto min-h-[100dvh] flex flex-col relative overflow-hidden bg-[#F5EDE0]">
      {/* Header with back navigation if we are deeper in the flow */}
      {userRole !== "none" && (
        <header className="absolute top-4 left-4 z-20">
          <button 
            onClick={handleGoBack}
            className="w-10 h-10 bg-[#E5DACB] text-[#3B1A1A] rounded-full flex items-center justify-center active:scale-95 transition-transform"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </header>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: User Role Selection */}
        {userRole === "none" && (
          <motion.section
            key="role-select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-grow flex flex-col justify-between py-12 z-10"
          >
            <div className="px-8 mt-12">
              <h1 className="text-[28px] font-display font-black text-[#C8521A] tracking-tighter leading-none mb-4 uppercase">
                Cwebezela<br />Tab
              </h1>
              <p className="text-lg font-display font-bold text-[#3B1A1A] max-w-[320px] leading-tight uppercase">
                Manage your spaza credit or track your tab balance instantly.
              </p>
            </div>

            {/* Geometric Art Element */}
            <div className="absolute right-[-40px] top-[20%] w-[250px] h-[350px] bg-[#C8521A] rounded-[120px] rotate-[15deg] opacity-90 mix-blend-multiply pointer-events-none p-4 flex flex-col justify-between shadow-2xl">
               <div className="w-20 h-20 bg-[#F5EDE0] rounded-full self-end"></div>
               <div className="w-16 h-40 bg-[#3B1A1A] rounded-full self-start -ml-8"></div>
            </div>

            <div className="w-full space-y-4 px-8 pb-8 z-10">
              <p className="text-xs font-display font-bold tracking-widest text-[#6E463B] uppercase mb-2">
                Choose Your Role to Start
              </p>
              
              <button
                onClick={() => { setUserRole("shop_owner"); setActiveForm("none"); }}
                className="w-full h-20 bg-[#3B1A1A] text-[#F5EDE0] font-display font-bold text-base rounded-2xl shadow-lg active:scale-95 transition-transform uppercase tracking-wider flex items-center justify-between px-6 border border-[#3B1A1A]"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-black text-[#F5EDE0]">I am a Shop Owner</span>
                  <span className="text-[10px] normal-case tracking-normal font-mono text-white/70">Manage customer list & tabs</span>
                </div>
                <Store className="w-6 h-6 text-[#C8521A]" />
              </button>

              <button
                onClick={() => { setUserRole("customer"); setActiveForm("none"); }}
                className="w-full h-20 bg-transparent border-2 border-[#3B1A1A] text-[#3B1A1A] font-display font-bold text-base rounded-2xl active:scale-95 transition-transform uppercase tracking-wider flex items-center justify-between px-6 hover:bg-[#E5DACB]/40"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-black text-[#3B1A1A]">I am a Customer</span>
                  <span className="text-[10px] normal-case tracking-normal font-mono text-[#6E463B]/80">Check how much I owe & history</span>
                </div>
                <User className="w-6 h-6 text-[#C8521A]" />
              </button>
              
              <p className="text-[10px] text-center text-[#6E463B] font-mono select-none pt-4">
                Powered by Secure Decentralized Spaza Tab Records
              </p>
            </div>
          </motion.section>
        )}

        {/* Step 2: Shop Owner or Customer Landing Options */}
        {userRole !== "none" && activeForm === "none" && (
          <motion.section
            key="role-options"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-grow flex flex-col justify-between py-12 z-10"
          >
            <div className="px-8 mt-16">
              <span className="bg-[#C8521A] text-white text-[10px] uppercase font-display font-black tracking-widest px-3 py-1 rounded-full">
                {userRole === "shop_owner" ? "Shop Owner Portal" : "Customer Tab Portal"}
              </span>
              <h2 className="text-3xl font-display font-black text-[#3B1A1A] uppercase tracking-tighter mt-4 leading-tight">
                {userRole === "shop_owner" ? "Welcome Back, Owner" : "Track Your Balance"}
              </h2>
              <p className="text-sm font-mono text-[#6E463B] mt-2">
                {userRole === "shop_owner" 
                  ? "Access your dashboard, manage credit limits, register new clients, and keep tabs detailed."
                  : "Use the code provided by the spaza owner to check your payments, limits, and records."
                }
              </p>
            </div>

            <div className="w-full space-y-4 px-8 pb-8 z-10">
              <button
                onClick={() => { setActiveForm("signup"); setErrorMsg(null); }}
                className="w-full h-14 bg-[#3B1A1A] text-[#F5EDE0] font-display font-bold text-base rounded-full shadow-lg active:scale-95 transition-transform uppercase tracking-wider"
              >
                {userRole === "shop_owner" ? "Register My Tuckshop" : "Create Customer Account"}
              </button>
              <button
                onClick={() => { setActiveForm("login"); setErrorMsg(null); }}
                className="w-full h-14 bg-transparent border-3 border-[#3B1A1A] text-[#3B1A1A] font-display font-bold text-base rounded-full active:scale-95 transition-transform uppercase tracking-wider hover:bg-[#E5DACB]/30"
              >
                Log In / Ngena
              </button>
            </div>
          </motion.section>
        )}

        {/* Step 3: Login form (Dynamic check of Role) */}
        {userRole !== "none" && activeForm === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="m-auto w-full p-8 z-10 mt-12"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[10px] text-[#C8521A] tracking-wider uppercase font-display font-bold">
                  {userRole === "customer" ? "Customer Tab Login" : "Tuckshop Owner Login"}
                </span>
                <h2 className="text-2xl font-display font-black text-[#3B1A1A] uppercase tracking-tighter mt-1">Sign In</h2>
              </div>
              <button
                onClick={clearForm}
                className="w-10 h-10 bg-[#E5DACB] rounded-full text-[#3B1A1A] font-bold active:scale-95 transition-transform"
              >
                ✕
              </button>
            </div>
            
            {errorMsg && (
              <div className="mb-4 p-3.5 bg-[#BA1A1A]/10 border-l-4 border-[#BA1A1A] rounded-r-xl text-[#BA1A1A] text-xs font-bold font-mono">
                {errorMsg}
              </div>
            )}
            
            {successMsg && (
              <div className="mb-4 p-3.5 bg-[#2B543A]/10 border-l-4 border-[#2B543A] rounded-r-xl text-[#2B543A] text-xs font-bold font-mono">
                {successMsg}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleLoginSubmit}>
              <button
                type="button"
                onClick={handleGoogleAuthClick}
                disabled={isLoading}
                className="w-full h-14 bg-white border border-gray-300 text-gray-700 font-bold text-base rounded-full shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-3 disabled:opacity-75"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-[#3B1A1A]/20"></div>
                <span className="flex-shrink-0 mx-4 text-[#3B1A1A]/40 text-xs font-bold uppercase tracking-widest">Or</span>
                <div className="flex-grow border-t border-[#3B1A1A]/20"></div>
              </div>

              <div className="space-y-2">
                <label className="font-display font-bold text-xs text-[#C8521A] tracking-widest uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. zola@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full h-12 bg-transparent border-b-2 border-[#C8521A] focus:border-[#3B1A1A] text-[#3B1A1A] text-base font-bold outline-none transition-colors"
                />
              </div>
              <div className="space-y-2 relative">
                <div className="flex justify-between items-end">
                  <label className="font-display font-bold text-xs text-[#C8521A] tracking-widest uppercase">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handlePasswordResetClick}
                    disabled={isLoading}
                    className="text-[10px] font-bold text-[#6E463B] hover:text-[#C8521A] uppercase tracking-wider"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  className="w-full h-12 bg-transparent border-b-2 border-[#C8521A] focus:border-[#3B1A1A] text-[#3B1A1A] text-base font-bold tracking-widest outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-[#C8521A] text-white font-display font-bold text-base rounded-full mt-4 shadow-lg active:scale-95 transition-transform uppercase tracking-wider disabled:opacity-75"
              >
                {isLoading ? "Authenticating..." : "Sign In"}
              </button>
              
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setActiveForm("signup"); setErrorMsg(null); }}
                  className="text-xs font-bold text-[#6E463B] hover:text-[#C8521A]"
                >
                  Do not have an account? Create one
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Step 4: Signup form (Dynamic per role) */}
        {userRole !== "none" && activeForm === "signup" && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="m-auto w-full p-8 z-10 mt-12"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[10px] text-[#C8521A] tracking-wider uppercase font-display font-bold">
                  {userRole === "customer" ? "Customer Tab Creation" : "Setup Shop Account"}
                </span>
                <h2 className="text-2xl font-display font-black text-[#3B1A1A] uppercase tracking-tighter mt-1">
                  Create Account
                </h2>
              </div>
              <button
                onClick={clearForm}
                className="w-10 h-10 bg-[#E5DACB] rounded-full text-[#3B1A1A] font-bold active:scale-95 transition-transform"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3.5 bg-[#BA1A1A]/10 border-l-4 border-[#BA1A1A] rounded-r-xl text-[#BA1A1A] text-xs font-bold font-mono">
                {errorMsg}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSignupSubmit}>
              <button
                type="button"
                onClick={handleGoogleAuthClick}
                disabled={isLoading}
                className="w-full h-13 bg-white border border-gray-300 text-gray-700 font-bold text-base rounded-full shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-3 disabled:opacity-75"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-[#3B1A1A]/20"></div>
                <span className="flex-shrink-0 mx-4 text-[#3B1A1A]/40 text-xs font-bold uppercase tracking-widest">Or</span>
                <div className="flex-grow border-t border-[#3B1A1A]/20"></div>
              </div>

              {userRole === "customer" ? (
                /* Customer Fields */
                <>
                  <div className="space-y-1">
                    <label className="font-display font-bold text-[11px] text-[#C8521A] tracking-widest uppercase">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Thabo Mokoena"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full h-11 bg-transparent border-b-2 border-[#C8521A] focus:border-[#3B1A1A] text-[#3B1A1A] text-sm font-bold outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-display font-bold text-[11px] text-[#C8521A] tracking-widest uppercase">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 073 000 0000"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full h-11 bg-transparent border-b-2 border-[#C8521A] focus:border-[#3B1A1A] text-[#3B1A1A] text-sm font-bold outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-end">
                      <label className="font-display font-bold text-[11px] text-[#C8521A] tracking-widest uppercase">
                        Customer Reference Number
                      </label>
                      <button
                        type="button"
                        onClick={() => { setShowScanner(true); setScanError(""); }}
                        className="text-[10px] flex items-center gap-1 font-bold bg-[#C8521A]/10 text-[#C8521A] px-2 py-0.5 rounded uppercase tracking-wider"
                      >
                        <QrCode className="w-3 h-3" /> Scan ID
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. CWE-THA-4821"
                      value={customerRefNo}
                      onChange={(e) => setCustomerRefNo(e.target.value)}
                      className="w-full h-11 bg-transparent border-b-2 border-[#C8521A] focus:border-[#3B1A1A] text-[#3B1A1A] text-sm font-bold placeholder-black/30 outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-display font-bold text-[11px] text-[#C8521A] tracking-widest uppercase">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. thabo@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full h-11 bg-transparent border-b-2 border-[#C8521A] focus:border-[#3B1A1A] text-[#3B1A1A] text-sm font-bold outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-display font-bold text-[11px] text-[#C8521A] tracking-widest uppercase">
                      Password (6+ characters)
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={customerPin}
                      onChange={(e) => setCustomerPin(e.target.value)}
                      className="w-full h-11 bg-transparent border-b-2 border-[#C8521A] focus:border-[#3B1A1A] text-[#3B1A1A] text-sm font-bold tracking-widest outline-none transition-colors"
                    />
                  </div>
                </>
              ) : (
                /* Shop Owner Fields */
                <>
                  <div className="space-y-1">
                    <label className="font-display font-bold text-[11px] text-[#C8521A] tracking-widest uppercase">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. owner@shop.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="w-full h-11 bg-transparent border-b-2 border-[#C8521A] focus:border-[#3B1A1A] text-[#3B1A1A] text-sm font-bold outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-display font-bold text-[11px] text-[#C8521A] tracking-widest uppercase">
                      Shop Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cwebezela Spaza"
                      value={signupShopName}
                      onChange={(e) => setSignupShopName(e.target.value)}
                      className="w-full h-11 bg-transparent border-b-2 border-[#C8521A] focus:border-[#3B1A1A] text-[#3B1A1A] text-sm font-bold outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-display font-bold text-[11px] text-[#C8521A] tracking-widest uppercase">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Zola Mkhize"
                      value={signupOwnerName}
                      onChange={(e) => setSignupOwnerName(e.target.value)}
                      className="w-full h-11 bg-transparent border-b-2 border-[#C8521A] focus:border-[#3B1A1A] text-[#3B1A1A] text-sm font-bold outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-display font-bold text-[11px] text-[#C8521A] tracking-widest uppercase">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 082 123 4567"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      className="w-full h-11 bg-transparent border-b-2 border-[#C8521A] focus:border-[#3B1A1A] text-[#3B1A1A] text-sm font-bold outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-display font-bold text-[11px] text-[#C8521A] tracking-widest uppercase">
                      Password (6+ characters)
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={signupPin}
                      onChange={(e) => setSignupPin(e.target.value)}
                      className="w-full h-11 bg-transparent border-b-2 border-[#C8521A] focus:border-[#3B1A1A] text-[#3B1A1A] text-sm font-bold tracking-widest outline-none transition-colors"
                    />
                  </div>
                </>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-13 bg-[#3B1A1A] text-white font-display font-bold text-base rounded-full mt-6 shadow-lg active:scale-95 transition-transform uppercase tracking-wider disabled:opacity-75"
              >
                {isLoading ? "Saving..." : "Create Account"}
              </button>
              
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setActiveForm("login"); setErrorMsg(null); }}
                  className="text-xs font-bold text-[#6E463B] hover:text-[#C8521A]"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm flex-col">
          <div className="bg-white rounded-3xl max-w-[360px] w-full p-4 relative overflow-hidden flex flex-col items-center shadow-2xl">
            <button
              onClick={() => setShowScanner(false)}
              className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center bg-[#F5EDE0] text-[#3B1A1A] rounded-full z-[70] active:scale-95 transition-transform"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-full text-center mt-2 mb-4 pr-10">
              <h2 className="text-xl font-display font-black text-[#3B1A1A] uppercase tracking-tight">
                Scan Reference QR
              </h2>
              <p className="text-xs font-semibold text-[#6E463B] leading-tight mt-1">
                Point your camera at the reference QR code provided by the tuckshop owner.
              </p>
            </div>

            <div className="w-full h-[280px] bg-black rounded-2xl overflow-hidden relative border border-[#E5DACB]">
              <Scanner
                onScan={(detectedCodes) => {
                  if (detectedCodes.length > 0) {
                    const rawValue = detectedCodes[0].rawValue;
                    if (!rawValue) return;
                    
                    const trimmed = rawValue.trim();
                    
                    // Case A: It's a shop join link URL (e.g., https://.../join/SWE123)
                    if (trimmed.toLowerCase().includes('/join/')) {
                      try {
                        const parts = trimmed.split('/join/');
                        const code = parts[parts.length - 1].split('?')[0].trim().toUpperCase();
                        if (code && onShopScanned) {
                          onShopScanned(code);
                          setShowScanner(false);
                          return;
                        }
                      } catch (e) {
                        console.error("Failed to parse shop join link", e);
                      }
                    }

                    // Case B: Full URL containing customer ID (e.g. https://.../CWE-THA-4821)
                    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
                      try {
                        const url = new URL(trimmed);
                        const pathParts = url.pathname.split('/').filter(Boolean);
                        if (pathParts.length > 0) {
                          const lastSegment = pathParts[pathParts.length - 1].trim().toUpperCase();
                          if (lastSegment && lastSegment !== "join") {
                            setCustomerRefNo(lastSegment);
                            setShowScanner(false);
                            return;
                          }
                        }
                      } catch (e) {
                        console.error("Failed to parse customer URL", e);
                      }
                    }

                    // Case C: Standard raw customer reference format (e.g. CWE-THA-4821)
                    setCustomerRefNo(trimmed);
                    setShowScanner(false);
                  }
                }}
                onError={(err: any) => {
                  setScanError(err?.message || "Failed to start camera.");
                }}
                constraints={{ facingMode: "environment" }}
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

    </main>
  );
}
