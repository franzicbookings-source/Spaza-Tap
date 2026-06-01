import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Store, User, ArrowLeft, Shield, Users, QrCode, X, Search, Sparkles, Languages } from "lucide-react";
import { Scanner } from '@yudiel/react-qr-scanner';

interface WelcomeScreenProps {
  onLogin: (email: string, pin: string) => Promise<string | null>;
  onSignup: (email: string, shopName: string, ownerName: string, phone: string, pin: string) => Promise<string | null>;
  onCustomerLogin: (email: string, pin: string) => Promise<string | null>;
  onCustomerSignup: (fullName: string, phone: string, email: string, pin: string, referenceNumber: string) => Promise<string | null>;
  onPasswordReset?: (email: string) => Promise<string | null>;
  onGoogleAuth?: (role: "shop_owner" | "customer", mode: "login" | "signup") => Promise<string | null>;
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
  const [logoFailed, setLogoFailed] = useState(false);
  
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

  // Language state (visual representation)
  const [currentLang, setCurrentLang] = useState("English");

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

  const handleGoogleAuthClick = async (mode: "login" | "signup") => {
    if (isLoading || !onGoogleAuth || userRole === "none") return;
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    
    const err = await onGoogleAuth(userRole, mode);
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
      
      setIsLoading(true);
      const err = await onCustomerSignup(
        customerName,
        customerPhone,
        customerEmail,
        customerPin,
        customerRefNo
      );
      setIsLoading(false);
      if (err) {
        setErrorMsg(err);
      }
      return;
    }

    if (!signupEmail.trim()) {
      setErrorMsg("Missing email address");
      return;
    }
    if (!signupShopName.trim()) {
      setErrorMsg("Spaza shop name is required");
      return;
    }
    if (!signupOwnerName.trim()) {
      setErrorMsg("Owner full name is required");
      return;
    }
    if (!signupPhone.trim()) {
      setErrorMsg("WhatsApp/cell number is required");
      return;
    }
    if (!signupPin.trim()) {
      setErrorMsg("Password is required");
      return;
    }

    setIsLoading(true);
    const err = await onSignup(signupEmail, signupShopName, signupOwnerName, signupPhone, signupPin);
    setIsLoading(false);
    if (err) {
      setErrorMsg(err);
    }
  };

  const handlePasswordReset = async () => {
    if (!onPasswordReset) return;
    const email = loginEmail || signupEmail || customerEmail;
    if (!email.trim()) {
      setErrorMsg("Enter your email address first, then tap reset.");
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    const err = await onPasswordReset(email);
    setIsLoading(false);
    if (err) {
      setErrorMsg(err);
    } else {
      setSuccessMsg("Password reset email sent. Check your inbox.");
    }
  };

  const clearForm = () => {
    setActiveForm("none");
    setUserRole("none");
    setErrorMsg(null);
    setSuccessMsg(null);
    setScanError("");
  };

  const handleScanResult = (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const rawValue = detectedCodes[0].rawValue;
      let code = "";
      try {
        const url = new URL(rawValue);
        const pathParts = url.pathname.split('/');
        if (pathParts.includes('join')) {
          code = pathParts[pathParts.indexOf('join') + 1];
        } else {
          code = url.searchParams.get('join') || rawValue;
        }
      } catch (e) {
        code = rawValue;
      }
      
      if (code) {
        setShowScanner(false);
        setCustomerRefNo(code.toUpperCase());
        setErrorMsg(null);
        setSuccessMsg("Shop code scanned successfully!");
        if (onShopScanned) onShopScanned(code.toUpperCase());
      }
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background text-text-main font-sans overflow-hidden flex flex-col relative safe-area-inset">
      {/* Abstract warm background */}
      <div className="absolute top-[-80px] right-[-120px] w-[320px] h-[320px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-120px] left-[-80px] w-[280px] h-[280px] bg-burgundy/5 rounded-full blur-3xl pointer-events-none" />

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-8 text-white">
            <h3 className="font-display font-black text-lg uppercase">Scan Shop QR</h3>
            <button onClick={() => setShowScanner(false)} className="p-2 bg-white/10 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-sm aspect-square overflow-hidden rounded-3xl border-4 border-primary shadow-2xl">
              <Scanner onScan={handleScanResult} onError={(err) => setScanError(String(err))} />
            </div>
          </div>
          <p className="text-center text-white/70 text-sm mt-6 font-medium">Point camera at the shop owner's QR code</p>
          {scanError && <p className="text-center text-danger text-xs mt-2">{scanError}</p>}
        </div>
      )}

      {/* Back Button if not initial */}
      {(userRole !== "none" || activeForm !== "none") && (
        <button 
          onClick={clearForm}
          className="absolute top-6 left-6 z-20 w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center text-text-main active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Initial Landing */}
        {userRole === "none" && activeForm === "none" && (
          <motion.div
            key="role-selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow flex flex-col justify-between p-5 pb-8 relative"
          >
            {/* Top Brand Header Row */}
            <div className="flex items-center justify-between w-full py-1">
              <div className="flex items-center gap-3">
                <div className="w-[72px] h-[72px] rounded-[22px] overflow-hidden flex items-center justify-center bg-[#3B1A1A] shrink-0 relative shadow-sm border border-text-main/5">
                  {!logoFailed && (
                    <img 
                      src="/icons/spaza-tap-logo.svg" 
                      alt="Spaza Tap" 
                      className="w-full h-full object-cover relative z-10"
                      onError={() => setLogoFailed(true)}
                    />
                  )}
                  {logoFailed && (
                    <span className="font-black text-lg text-[#FBF5EC] leading-none tracking-tight">ST</span>
                  )}
                </div>
              </div>

              {/* Language Selector Pill */}
              <button
                onClick={() => setCurrentLang(prev => prev === "English" ? "isiZulu" : "English")}
                className="h-10 px-3.5 rounded-full bg-card-soft border border-text-main/8 text-text-main text-xs font-bold font-sans flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                <Languages className="w-3.5 h-3.5 text-primary" />
                <span>{currentLang}</span>
                <span className="text-[10px] font-bold">🇿🇦</span>
              </button>
            </div>

            {/* Headline + Supporint Texts */}
            <div className="mt-5 space-y-2">
              <h2 className="text-[34px] md:text-[38px] leading-[1.05] font-extrabold tracking-tighter text-text-main font-display">
                Run your spaza shop with <span className="text-primary bg-primary-soft px-1.5 rounded-xl">confidence.</span>
              </h2>
              <p className="text-[15px] font-sans leading-relaxed text-text-muted">
                Manage customer tabs, sales, stock and payments from one place.
              </p>
            </div>

            {/* Responsive Hero Image Card with smiling woman */}
            <div className="mt-5 w-full h-[190px] md:h-[240px] rounded-[28px] overflow-hidden border border-text-main/8 shadow-xs">
              <img
                src="/smiling_woman_in_cozy_workspace.png"
                alt="Run your Spaza shop with confidence"
                className="w-full h-full object-cover object-[center_42%]"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Feature Mini Cards 2x2 Grid (Hidden on short viewports based on responsive design) */}
            <div className="mt-5 grid grid-cols-2 gap-2.5 max-h-[160px] xs:grid">
              <div className="bg-card-bg border border-text-main/5 p-3 rounded-[18px] flex flex-col justify-center text-left hover:border-primary/10 transition-colors">
                <h4 className="text-xs font-bold text-text-main uppercase tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Track Credit
                </h4>
                <p className="text-[11px] text-text-muted mt-0.5 leading-tight">See who owes & when.</p>
              </div>

              <div className="bg-card-bg border border-text-main/5 p-3 rounded-[18px] flex flex-col justify-center text-left">
                <h4 className="text-xs font-bold text-text-main uppercase tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Simple Sales
                </h4>
                <p className="text-[11px] text-text-muted mt-0.5 leading-tight">Record sales quickly.</p>
              </div>

              <div className="bg-card-bg border border-text-main/5 p-3 rounded-[18px] flex flex-col justify-center text-left">
                <h4 className="text-xs font-bold text-text-main uppercase tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Manage Stock
                </h4>
                <p className="text-[11px] text-text-muted mt-0.5 leading-tight">Know what runs low.</p>
              </div>

              <div className="bg-card-bg border border-text-main/5 p-3 rounded-[18px] flex flex-col justify-center text-left">
                <h4 className="text-xs font-bold text-text-main uppercase tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Grow Business
                </h4>
                <p className="text-[11px] text-text-muted mt-0.5 leading-tight">Build better records.</p>
              </div>
            </div>

            {/* Portal Action Buttons */}
            <div className="mt-6 space-y-3 z-10">
              {/* Primary Action Button */}
              <button
                onClick={() => { setUserRole("shop_owner"); setActiveForm("signup"); }}
                id="welcome-btn-register"
                className="w-full h-[64px] bg-gradient-to-r from-[#E95A13] to-[#C9460B] text-white rounded-[22px] font-extrabold text-[15px] shadow-lg active:scale-[0.98] transition-all flex flex-col items-center justify-center tracking-wide"
              >
                <span className="leading-tight">Register My Tuckshop</span>
                <span className="text-[10px] opacity-85 font-semibold font-sans normal-case tracking-normal">For shop owners</span>
              </button>

              {/* Secondary Action Button */}
              <button
                onClick={() => { setUserRole("shop_owner"); setActiveForm("login"); }}
                id="welcome-btn-login"
                className="w-full h-[60px] bg-transparent border-2 border-[#321316] text-[#321316] rounded-[22px] font-extrabold text-[15px] active:scale-[0.98] transition-all flex items-center justify-center uppercase tracking-wider"
              >
                Log In / Ngena
              </button>

              {/* QR Access Sub Row Link */}
              <button
                onClick={() => { setUserRole("customer"); setActiveForm("none"); }}
                id="welcome-btn-customer"
                className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-text-main hover:text-primary transition-colors hover:underline mt-2"
              >
                <QrCode className="w-4 h-4 text-primary animate-pulse" />
                <span>Customer access with shop code or QR</span>
              </button>
            </div>

            {/* Brand Footer */}
            <footer className="mt-4 pt-2 border-t border-text-main/5 text-center">
              <span className="text-[10px] font-bold text-text-light font-mono space-x-1">
                <span>Built by</span>
                <span className="text-text-main">Ntombii Tech</span>
              </span>
            </footer>
          </motion.div>
        )}

        {/* Step 2: Customer Landing Portal Option Choice Screen */}
        {userRole === "customer" && activeForm === "none" && (
          <motion.section
            key="customer-options"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow flex flex-col justify-between p-6 pt-16 z-10"
          >
            <div className="space-y-4">
              <span className="bg-primary text-white text-[10px] uppercase font-display font-black tracking-widest px-3 py-1 rounded-full inline-block">
                Customer Tab Portal
              </span>
              <h2 className="text-4xl font-display font-black text-[#321316] uppercase leading-none tracking-tighter">
                Track Your Balance
              </h2>
              <p className="text-xs font-semibold text-text-muted leading-relaxed">
                Use the PIN or reference code provided by your spaza shop owner to view your linked tabs, check payment histories, and browse authorized tabs.
              </p>

              {/* Direct QR Quick Scan Card */}
              <div 
                onClick={() => { setShowScanner(true); setScanError(""); }}
                className="bg-card-soft border border-primary/20 p-4.5 rounded-[24px] cursor-pointer active:scale-98 transition-transform flex items-center gap-4 mt-6"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                  <QrCode className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-text-main">Scan Shop QR Code</h4>
                  <p className="text-[11px] text-text-muted mt-0.5">Aim camera to scan & join shop tab instantly</p>
                </div>
              </div>
            </div>

            <div className="w-full space-y-3 pb-8 mt-8">
              <button
                onClick={() => { setActiveForm("signup"); setErrorMsg(null); }}
                className="w-full h-14 bg-gradient-to-r from-primary to-primary-dark text-white font-display font-bold text-sm rounded-[18px] shadow-md active:scale-95 transition-transform uppercase tracking-wider"
              >
                Create Customer Account
              </button>
              <button
                onClick={() => { setActiveForm("login"); setErrorMsg(null); }}
                className="w-full h-14 bg-transparent border-2 border-[#321316] text-[#321316] font-display font-bold text-sm rounded-[18px] active:scale-95 transition-transform uppercase tracking-wider hover:bg-card-soft"
              >
                Log In
              </button>
            </div>
          </motion.section>
        )}

        {/* Step 3: Global Signed-in Login Forms */}
        {userRole !== "none" && activeForm === "login" && (
          <motion.div
            key="login-form-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full p-6 pt-16"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[10px] text-primary tracking-widest uppercase font-display font-black">
                  {userRole === "customer" ? "Customer Tab Login" : "Tuckshop Owner Login"}
                </span>
                <h2 className="text-2xl font-display font-black text-[#321316] uppercase tracking-tighter mt-1">Sign In</h2>
              </div>
              <button
                onClick={clearForm}
                className="w-10 h-10 bg-neutral-bg rounded-full text-text-main font-bold active:scale-95 transition-transform flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
            
            {errorMsg && (
              <div className="mb-5 p-3.5 bg-danger-bg border-l-4 border-danger rounded-r-xl text-danger text-xs font-bold font-mono">
                {errorMsg}
              </div>
            )}
            
            {successMsg && (
              <div className="mb-5 p-3.5 bg-success-bg border-l-4 border-success rounded-r-xl text-success text-xs font-bold font-mono">
                {successMsg}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleLoginSubmit}>
              {/* Google login option */}
              <button
                type="button"
                onClick={() => handleGoogleAuthClick("login")}
                disabled={isLoading}
                className="w-full h-13 bg-white border border-text-main/10 text-text-main font-bold text-sm rounded-[18px] shadow-xs active:scale-95 transition-transform flex items-center justify-center gap-3 disabled:opacity-70"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" referrerPolicy="no-referrer" />
                Continue with Google
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-text-main/10"></div>
                <span className="flex-shrink-0 mx-4 text-text-light text-[10px] font-bold uppercase tracking-widest">Or</span>
                <div className="flex-grow border-t border-text-main/10"></div>
              </div>

              <div className="space-y-2">
                <label className="font-display font-bold text-[11px] text-primary tracking-widest uppercase">
                  {userRole === "customer" ? "Customer Email Address" : "Owner Email Address"}
                </label>
                <input
                  type="email"
                  placeholder="e.g. owner@shop.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full h-14 bg-white px-5 border border-text-main/10 focus:border-primary text-text-main rounded-[18px] text-sm font-bold outline-none transition-colors placeholder:text-text-muted/40"
                />
              </div>
              <div className="space-y-2">
                <label className="font-display font-bold text-[11px] text-primary tracking-widest uppercase">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  className="w-full h-14 bg-white px-5 border border-text-main/10 focus:border-primary text-text-main rounded-[18px] text-sm font-bold outline-none transition-colors"
                />
              </div>
              
              <button
                type="button"
                onClick={handlePasswordReset}
                className="w-full text-right text-[11px] text-primary font-bold underline underline-offset-2"
              >
                Forgot password?
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-primary to-primary-dark text-white rounded-[18px] font-display font-black uppercase tracking-wider shadow-md active:scale-95 transition-transform disabled:opacity-70"
              >
                {isLoading ? "Please wait..." : "Log In"}
              </button>
            </form>
          </motion.div>
        )}

        {/* Step 4: Signup Forms */}
        {userRole !== "none" && activeForm === "signup" && (
          <motion.div
            key="signup-form-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full p-5 pt-16 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-[10px] text-primary tracking-widest uppercase font-display font-black">
                  {userRole === "customer" ? "Create Customer Account" : "Setup Shop Account"}
                </span>
                <h2 className="text-2xl font-display font-black text-[#321316] uppercase tracking-tighter mt-1">Create Account</h2>
              </div>
              <button
                onClick={clearForm}
                className="w-10 h-10 bg-neutral-bg rounded-full text-text-main font-bold active:scale-95 transition-transform flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3.5 bg-danger-bg border-l-4 border-danger rounded-r-xl text-danger text-xs font-bold font-mono">
                {errorMsg}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSignupSubmit}>
              {/* Google SignUp Integration Option */}
              <button
                type="button"
                onClick={() => handleGoogleAuthClick("signup")}
                disabled={isLoading}
                className="w-full h-12 bg-white border border-text-main/10 text-text-main font-bold text-sm rounded-[16px] shadow-xs active:scale-95 transition-transform flex items-center justify-center gap-3 disabled:opacity-70"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" referrerPolicy="no-referrer" />
                Continue with Google
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-text-main/10"></div>
                <span className="flex-shrink-0 mx-4 text-text-light text-[10px] font-bold uppercase tracking-widest">Or</span>
                <div className="flex-grow border-t border-text-main/10"></div>
              </div>

              {userRole === "customer" ? (
                /* Customer Registration Form */
                <>
                  <div className="space-y-1">
                    <label className="font-display font-bold text-[11px] text-primary tracking-widest uppercase">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Thabo Mokoena"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full h-11 bg-white px-3.5 border border-text-main/10 focus:border-primary text-text-main rounded-[12px] text-xs font-bold outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-display font-bold text-[11px] text-primary tracking-widest uppercase">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 073 000 0000"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full h-11 bg-white px-3.5 border border-text-main/10 focus:border-primary text-text-main rounded-[12px] text-xs font-bold outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-end">
                      <label className="font-display font-bold text-[11px] text-primary tracking-widest uppercase">
                        Customer Reference Number
                      </label>
                      <button
                        type="button"
                        onClick={() => { setShowScanner(true); setScanError(""); }}
                        className="text-[10px] flex items-center gap-1 font-bold bg-primary-soft text-primary px-2 py-0.5 rounded uppercase tracking-wider active:scale-95 transition-transform"
                      >
                        <QrCode className="w-3 h-3" /> Scan ID
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. SPT-THA-4821"
                      value={customerRefNo}
                      onChange={(e) => setCustomerRefNo(e.target.value)}
                      className="w-full h-11 bg-white px-3.5 border border-text-main/10 focus:border-primary text-text-main rounded-[12px] text-xs font-bold placeholder-text-muted/40 outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-display font-bold text-[11px] text-primary tracking-widest uppercase">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. thabo@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full h-11 bg-white px-3.5 border border-text-main/10 focus:border-primary text-text-main rounded-[12px] text-xs font-bold outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-display font-bold text-[11px] text-primary tracking-widest uppercase">
                      Password (6+ characters)
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={customerPin}
                      onChange={(e) => setCustomerPin(e.target.value)}
                      className="w-full h-11 bg-white px-3.5 border border-text-main/10 focus:border-primary text-text-main rounded-[12px] text-xs font-bold outline-none transition-colors"
                    />
                  </div>
                </>
              ) : (
                /* Shop Owner Registration Form */
                <>
                  <div className="space-y-1">
                    <label className="font-display font-bold text-[11px] text-primary tracking-widest uppercase">Owner Email Address</label>
                    <input type="email" placeholder="e.g. owner@shop.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="w-full h-11 bg-white px-3.5 border border-text-main/10 focus:border-primary text-text-main rounded-[12px] text-xs font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-display font-bold text-[11px] text-primary tracking-widest uppercase">Spaza Shop Name</label>
                    <input type="text" placeholder="e.g. Spaza Tap Store" value={signupShopName} onChange={(e) => setSignupShopName(e.target.value)} className="w-full h-11 bg-white px-3.5 border border-text-main/10 focus:border-primary text-text-main rounded-[12px] text-xs font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-display font-bold text-[11px] text-primary tracking-widest uppercase">My Full Name</label>
                    <input type="text" placeholder="e.g. Ntombi Cele" value={signupOwnerName} onChange={(e) => setSignupOwnerName(e.target.value)} className="w-full h-11 bg-white px-3.5 border border-text-main/10 focus:border-primary text-text-main rounded-[12px] text-xs font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-display font-bold text-[11px] text-primary tracking-widest uppercase">WhatsApp/Cell Phone Number</label>
                    <input type="tel" placeholder="e.g. 082 123 4567" value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} className="w-full h-11 bg-white px-3.5 border border-text-main/10 focus:border-primary text-text-main rounded-[12px] text-xs font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-display font-bold text-[11px] text-primary tracking-widest uppercase">Password (6+ characters)</label>
                    <input type="password" placeholder="••••••••" value={signupPin} onChange={(e) => setSignupPin(e.target.value)} className="w-full h-11 bg-white px-3.5 border border-text-main/10 focus:border-primary text-text-main rounded-[12px] text-xs font-bold outline-none" />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-13 bg-gradient-to-r from-primary to-primary-dark text-white rounded-[16px] font-display font-black uppercase tracking-wider shadow-md active:scale-95 transition-transform disabled:opacity-70 mt-2"
              >
                {isLoading ? "Creating..." : userRole === "customer" ? "Create Customer Account" : "Register Shop"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
