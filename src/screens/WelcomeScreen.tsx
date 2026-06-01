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
      setIsLoading(true); // stay loading while we redirect
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
    <main className="w-full flex flex-col min-h-screen bg-background relative overflow-x-hidden">
      {/* Absolute Back Icon for form navigation */}
      {userRole !== "none" && (
        <header className="absolute top-4 left-4 z-40">
          <button 
            onClick={handleGoBack}
            className="w-11 h-11 bg-white border border-[#E5DACB] text-theme-main rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-xs"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5 text-text-main" />
          </button>
        </header>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Portal Main Opening Welcome Screen */}
        {userRole === "none" && (
          <motion.div
            key="welcome-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow flex flex-col justify-between p-5 pb-8 relative"
          >
            {/* Top Brand Header Row */}
            <div className="flex items-center justify-between w-full py-1">
              <div className="flex items-center gap-3">
                {/* 72x72 Premium rounded Logo App Icon */}
                <div className="w-[72px] h-[72px] overflow-hidden flex items-center justify-center bg-transparent shrink-0">
                  <img 
                    src="/logo.png" 
                    alt="Spaza Tap Logo" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
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
              <h2 className="text-3xl font-display font-black text-[#321316] uppercase tracking-tighter mt-2 leading-tight">
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
                onClick={handleGoogleAuthClick}
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
                <label className="font-display font-bold text-xs text-primary tracking-widest uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. zola@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full h-12 bg-white px-4 border border-text-main/10 focus:border-primary text-text-main rounded-[14px] text-sm font-bold outline-none transition-colors"
                />
              </div>
              
              <div className="space-y-2 relative">
                <div className="flex justify-between items-end">
                  <label className="font-display font-bold text-xs text-primary tracking-widest uppercase">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handlePasswordResetClick}
                    disabled={isLoading}
                    className="text-[10px] font-bold text-text-muted hover:text-primary uppercase tracking-wider"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  className="w-full h-12 bg-white px-4 border border-text-main/10 focus:border-primary text-text-main rounded-[14px] text-sm font-bold tracking-widest outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[56px] bg-[#D94F12] text-white font-display font-extrabold text-sm rounded-[18px] mt-4 shadow-md active:scale-95 transition-transform uppercase tracking-wider disabled:opacity-75"
              >
                {isLoading ? "Authenticating..." : "Sign In"}
              </button>
              
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setActiveForm("signup"); setErrorMsg(null); }}
                  className="text-xs font-bold text-text-muted hover:text-primary transition-colors"
                >
                  Do not have an account? Create one
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Step 4: Signup form panel */}
        {userRole !== "none" && activeForm === "signup" && (
          <motion.div
            key="signup-form-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full p-6 pt-16"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[10px] text-primary tracking-widest uppercase font-display font-black">
                  {userRole === "customer" ? "Customer Tab Creation" : "Setup Shop Account"}
                </span>
                <h2 className="text-2xl font-display font-black text-[#321316] uppercase tracking-tighter mt-1">
                  Create Account
                </h2>
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
                onClick={handleGoogleAuthClick}
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
                      className="w-full h-11 bg-white px-3.5 border border-text-main/10 focus:border-primary text-text-main rounded-[12px] text-xs font-bold tracking-widest outline-none transition-colors"
                    />
                  </div>
                </>
              ) : (
                /* Shop Owner Registration Form */
                <>
                  <div className="space-y-1">
                    <label className="font-display font-bold text-[11px] text-primary tracking-widest uppercase">
                      Owner Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. owner@shop.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="w-full h-11 bg-white px-3.5 border border-text-main/10 focus:border-primary text-text-main rounded-[12px] text-xs font-bold outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-display font-bold text-[11px] text-primary tracking-widest uppercase">
                      Spaza Shop Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Spaza Tap Store"
                      value={signupShopName}
                      onChange={(e) => setSignupShopName(e.target.value)}
                      className="w-full h-11 bg-white px-3.5 border border-text-main/10 focus:border-primary text-text-main rounded-[12px] text-xs font-bold outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-display font-bold text-[11px] text-primary tracking-widest uppercase">
                      My full name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ntombi Cele"
                      value={signupOwnerName}
                      onChange={(e) => setSignupOwnerName(e.target.value)}
                      className="w-full h-11 bg-white px-3.5 border border-text-main/10 focus:border-primary text-text-main rounded-[12px] text-xs font-bold outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-display font-bold text-[11px] text-primary tracking-widest uppercase">
                      WhatsApp/Cell Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 082 123 4567"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
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
                      value={signupPin}
                      onChange={(e) => setSignupPin(e.target.value)}
                      className="w-full h-11 bg-white px-3.5 border border-text-main/10 focus:border-primary text-text-main rounded-[12px] text-xs font-bold tracking-widest outline-none transition-colors"
                    />
                  </div>
                </>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-13 bg-[#321316] text-white font-display font-bold text-sm rounded-[16px] mt-6 shadow-md active:scale-95 transition-transform uppercase tracking-wider disabled:opacity-75 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
              
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setActiveForm("login"); setErrorMsg(null); }}
                  className="text-xs font-bold text-text-muted hover:text-primary transition-colors"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Scanner Modal System */}
      {showScanner && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-burgundy/85 backdrop-blur-xs flex-col">
          <div className="bg-white rounded-3xl max-w-[360px] w-full p-4.5 relative overflow-hidden flex flex-col items-center shadow-2xl">
            <button
              onClick={() => setShowScanner(false)}
              className="absolute right-4 top-4 w-9 h-9 flex items-center justify-center bg-[#F1EBE4] text-[#321316] rounded-full z-[70] active:scale-95 transition-transform"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-full text-center mt-2 mb-4 pr-10">
              <h2 className="text-xl font-display font-black text-[#321316] uppercase tracking-tight">
                Scan Reference QR
              </h2>
              <p className="text-xs font-semibold text-[#756766] leading-tight mt-1">
                Point your camera at the reference QR code provided by the tuckshop owner.
              </p>
            </div>

            <div className="w-full h-[280px] bg-black rounded-2xl overflow-hidden relative border border-[#F1EBE4]">
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

                    // Case B: Full URL containing customer ID (e.g. https://.../SPT-THA-4821 or CWE-THA-4821)
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

                    // Case C: Standard raw customer reference format (e.g. SPT-THA-4821 or CWE-THA-4821)
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
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl w-full">
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
