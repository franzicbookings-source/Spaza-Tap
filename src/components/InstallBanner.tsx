import React, { useEffect, useState } from "react";
import { Download, X, Share, PlusSquare, Smartphone } from "lucide-react";

// Add global type for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop" | "other">("other");

  // Determine platform
  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform("ios");
    } else if (/android/.test(ua)) {
      setPlatform("android");
    } else if (/macintosh|windows|linux/.test(ua)) {
      setPlatform("desktop");
    } else {
      setPlatform("other");
    }
  }, []);

  useEffect(() => {
    const checkVisibility = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;

      const appInstalled = localStorage.getItem("spaza_tap_app_installed") || localStorage.getItem("appInstalled");
      
      const dismissedUntil = localStorage.getItem("spaza_tap_install_dismissed_until");
      let isDismissed = false;
      if (dismissedUntil) {
        if (Date.now() < parseInt(dismissedUntil, 10)) {
          isDismissed = true;
        } else {
          localStorage.removeItem("spaza_tap_install_dismissed_until");
        }
      }

      if (isStandalone || isDismissed || appInstalled === "true") {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    checkVisibility();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log("PWA: beforeinstallprompt fired");
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      const dismissedUntil = localStorage.getItem("spaza_tap_install_dismissed_until");
      let isDismissed = false;
      if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
        isDismissed = true;
      }
      
      const appInstalled = localStorage.getItem("spaza_tap_app_installed") || localStorage.getItem("appInstalled");
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;

      if (!isStandalone && !isDismissed && appInstalled !== "true") {
        setIsVisible(true);
      }
    };

    const handleAppInstalled = () => {
      console.log("PWA: app installed");
      localStorage.setItem("spaza_tap_app_installed", "true");
      setIsVisible(false);
    };

    // Listen to manual reset signal from Settings Screen
    const handleResetSignal = () => {
      localStorage.removeItem("spaza_tap_install_dismissed_until");
      localStorage.removeItem("spaza_tap_install_dismissed");
      localStorage.removeItem("spaza_tap_app_installed");
      localStorage.removeItem("installBannerDismissed");
      localStorage.removeItem("appInstalled");
      checkVisibility();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("spaza-tap-reset-pwa", handleResetSignal);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("spaza-tap-reset-pwa", handleResetSignal);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      console.log("PWA: install prompt opened");
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        console.log("PWA: app installed (via prompt)");
        localStorage.setItem("spaza_tap_app_installed", "true");
      }
      setDeferredPrompt(null);
      setIsVisible(false);
    } else {
      // No native prompt available (e.g. iOS or manual browser). Show helpful guide modal!
      console.log("PWA: fallback guide shown because native prompt is unavailable");
      setShowGuideModal(true);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    // Hide for 24 hours
    const hideUntil = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem("spaza_tap_install_dismissed_until", hideUntil.toString());
  };

  if (!isVisible) return null;

  return (
    <>
      <div 
        className="fixed z-[9998] flex flex-row items-center justify-between"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 12px)',
          left: '12px',
          right: '12px',
          maxWidth: '406px',
          margin: '0 auto',
          background: '#3B1A1A',
          color: 'white',
          borderRadius: '18px',
          padding: '12px',
          gap: '10px',
          boxSizing: 'border-box'
        }}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-12 h-12 rounded-xl shrink-0 overflow-hidden border border-[#C8521A]/20 shadow-md bg-white flex items-center justify-center relative">
            <span className="text-[#3B1A1A] font-bold text-lg absolute">ST</span>
            <img 
              src="/icons/icon-192x192.png" 
              alt="" 
              className="w-full h-full object-cover relative z-10"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }} 
            />
          </div>
          <div className="flex flex-col min-w-0">
            <strong className="text-sm font-extrabold tracking-tight whitespace-nowrap">Install Spaza Tap</strong>
            <span className="text-[10px] text-gray-300 leading-snug hidden sm:block truncate pr-2">
              Add the app to your home screen.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleInstallClick}
            className="bg-[#C8521A] hover:bg-[#B04112] text-white text-[11px] font-black px-3.5 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button 
            onClick={handleClose} 
            className="p-1 text-gray-400 hover:text-white rounded-full bg-white/10 active:scale-90 transition-transform cursor-pointer shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Elegant installation Instruction Dialog Backdrop */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 animate-fade-in">
          <div className="w-[calc(100vw-32px)] max-w-[390px] min-w-0 box-border bg-white rounded-[24px] p-5 shadow-2xl flex flex-col font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#C8521A] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <h3 className="font-display font-black text-sm uppercase text-[#3B1A1A] tracking-tight">
                    Install Spaza Tap
                  </h3>
                  <span className="text-[10px] text-gray-500 font-medium">Add Spaza Tap to your phone for quick access.</span>
                </div>
              </div>
              <button 
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full bg-gray-50 active:scale-95 transition-transform shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {platform === "ios" ? (
              <div className="flex flex-col gap-3">
                <div className="flex gap-3 w-full p-3 rounded-2xl bg-[#FBF5EC] border border-[#3B1A1A]/10 items-start box-border">
                  <div className="w-7 h-7 rounded-full bg-white text-[#C8521A] flex items-center justify-center font-black text-sm shrink-0 border border-[#3B1A1A]/5 shadow-sm">1</div>
                  <div className="flex-[1_1_100%] min-w-0 pt-0.5">
                    <p className="w-full text-[13px] text-[#3B1A1A] leading-[1.35] text-left break-words">
                      Tap the <strong>Share</strong> button in the browser menu.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 w-full p-3 rounded-2xl bg-[#FBF5EC] border border-[#3B1A1A]/10 items-start box-border">
                  <div className="w-7 h-7 rounded-full bg-white text-[#C8521A] flex items-center justify-center font-black text-sm shrink-0 border border-[#3B1A1A]/5 shadow-sm">2</div>
                  <div className="flex-[1_1_100%] min-w-0 pt-0.5">
                    <p className="w-full text-[13px] text-[#3B1A1A] leading-[1.35] text-left break-words">
                      Choose <strong>"Add to Home Screen"</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 w-full p-3 rounded-2xl bg-[#FBF5EC] border border-[#3B1A1A]/10 items-start box-border">
                  <div className="w-7 h-7 rounded-full bg-white text-[#C8521A] flex items-center justify-center font-black text-sm shrink-0 border border-[#3B1A1A]/5 shadow-sm">3</div>
                  <div className="flex-[1_1_100%] min-w-0 pt-0.5">
                    <p className="w-full text-[13px] text-[#3B1A1A] leading-[1.35] text-left break-words">
                      Confirm by tapping <strong>Add</strong>.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex gap-3 w-full p-3 rounded-2xl bg-[#FBF5EC] border border-[#3B1A1A]/10 items-start box-border">
                  <div className="w-7 h-7 rounded-full bg-white text-[#C8521A] flex items-center justify-center font-black text-sm shrink-0 border border-[#3B1A1A]/5 shadow-sm">1</div>
                  <div className="flex-[1_1_100%] min-w-0 pt-0.5">
                    <p className="w-full text-[13px] text-[#3B1A1A] leading-[1.35] text-left break-words">
                      Tap the browser menu <strong>(three dots)</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 w-full p-3 rounded-2xl bg-[#FBF5EC] border border-[#3B1A1A]/10 items-start box-border">
                  <div className="w-7 h-7 rounded-full bg-white text-[#C8521A] flex items-center justify-center font-black text-sm shrink-0 border border-[#3B1A1A]/5 shadow-sm">2</div>
                  <div className="flex-[1_1_100%] min-w-0 pt-0.5">
                    <p className="w-full text-[13px] text-[#3B1A1A] leading-[1.35] text-left break-words">
                      Choose <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 w-full p-3 rounded-2xl bg-[#FBF5EC] border border-[#3B1A1A]/10 items-start box-border">
                  <div className="w-7 h-7 rounded-full bg-white text-[#C8521A] flex items-center justify-center font-black text-sm shrink-0 border border-[#3B1A1A]/5 shadow-sm">3</div>
                  <div className="flex-[1_1_100%] min-w-0 pt-0.5">
                    <p className="w-full text-[13px] text-[#3B1A1A] leading-[1.35] text-left break-words">
                      Confirm by tapping <strong>Add</strong> or <strong>Install</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={() => setShowGuideModal(false)}
              className="mt-5 w-full bg-[#3B1A1A] text-white py-3 rounded-xl font-bold text-[13px] uppercase tracking-wider hover:bg-[#2A1212] active:scale-95 transition-transform shrink-0"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
