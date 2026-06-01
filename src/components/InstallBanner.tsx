import React, { useEffect, useMemo, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function getPlatform(): "ios" | "android" | "desktop" | "other" {
  const ua = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/macintosh|windows|linux/.test(ua)) return "desktop";
  return "other";
}

function isDismissedForNow() {
  const dismissedUntil = localStorage.getItem("spaza_tap_install_dismissed_until");
  if (!dismissedUntil) return false;

  const timestamp = Number.parseInt(dismissedUntil, 10);
  if (!Number.isFinite(timestamp) || Date.now() >= timestamp) {
    localStorage.removeItem("spaza_tap_install_dismissed_until");
    return false;
  }

  return true;
}

function InstallIcon() {
  return (
    <div
      style={{
        width: 48,
        height: 48,
        minWidth: 48,
        borderRadius: 14,
        background: "#FBF5EC",
        color: "#3B1A1A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
        letterSpacing: "-0.04em",
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      <img
        src="/icons/spaza-tap-logo.svg"
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <span style={{ position: "absolute", pointerEvents: "none" }}>ST</span>
    </div>
  );
}

function StepCard({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: 12,
        borderRadius: 16,
        background: "#FBF5EC",
        border: "1px solid rgba(59, 26, 26, 0.08)",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          minWidth: 28,
          borderRadius: 999,
          background: "#FFFFFF",
          color: "#D94F12",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontSize: 13,
          border: "1px solid rgba(59, 26, 26, 0.08)",
        }}
      >
        {number}
      </div>
      <p
        style={{
          flex: 1,
          minWidth: 0,
          margin: 0,
          color: "#3B1A1A",
          fontSize: 13,
          lineHeight: 1.38,
          fontWeight: 650,
          textAlign: "left",
          overflowWrap: "normal",
          wordBreak: "normal",
          whiteSpace: "normal",
        }}
      >
        {children}
      </p>
    </div>
  );
}

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const platform = useMemo(() => (typeof window !== "undefined" ? getPlatform() : "other"), []);

  useEffect(() => {
    const refreshVisibility = () => {
      const installedFlag = localStorage.getItem("spaza_tap_app_installed") === "true";
      const oldInstalledFlag = localStorage.getItem("appInstalled") === "true";

      if (isStandaloneMode() || installedFlag || oldInstalledFlag || isDismissedForNow()) {
        setIsVisible(false);
        return;
      }

      setIsVisible(true);
    };

    refreshVisibility();

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      if (!isStandaloneMode() && !isDismissedForNow()) {
        setIsVisible(true);
      }
    };

    const handleAppInstalled = () => {
      localStorage.setItem("spaza_tap_app_installed", "true");
      setDeferredPrompt(null);
      setIsVisible(false);
      setShowGuideModal(false);
    };

    const handleResetSignal = () => {
      localStorage.removeItem("spaza_tap_install_dismissed_until");
      localStorage.removeItem("spaza_tap_install_dismissed");
      localStorage.removeItem("spaza_tap_app_installed");
      localStorage.removeItem("installBannerDismissed");
      localStorage.removeItem("appInstalled");
      refreshVisibility();
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
    if (!deferredPrompt) {
      setShowGuideModal(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        localStorage.setItem("spaza_tap_app_installed", "true");
      }
    } finally {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("spaza_tap_install_dismissed_until", String(Date.now() + 24 * 60 * 60 * 1000));
  };

  if (!isVisible) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          left: 12,
          right: 12,
          bottom: "calc(env(safe-area-inset-bottom) + 12px)",
          zIndex: 9998,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 406,
            boxSizing: "border-box",
            background: "#3B1A1A",
            color: "#FFFFFF",
            borderRadius: 18,
            padding: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            boxShadow: "0 18px 40px rgba(59, 26, 26, 0.30)",
            pointerEvents: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
            <InstallIcon />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 900, lineHeight: 1.1, whiteSpace: "nowrap" }}>
                Install Spaza Tap
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.72)",
                  lineHeight: 1.25,
                  marginTop: 3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Add to your home screen.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstallClick}
            style={{
              height: 42,
              border: 0,
              borderRadius: 14,
              background: "#D94F12",
              color: "#FFFFFF",
              padding: "0 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            <Download size={16} />
            Install
          </button>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Dismiss install banner"
            style={{
              width: 32,
              height: 32,
              border: 0,
              borderRadius: 999,
              background: "rgba(255,255,255,0.10)",
              color: "rgba(255,255,255,0.70)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {showGuideModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.62)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "calc(100vw - 32px)",
              maxWidth: 390,
              minWidth: 300,
              boxSizing: "border-box",
              background: "#FFFFFF",
              borderRadius: 24,
              padding: 20,
              boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <Smartphone size={22} color="#D94F12" style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: 0, color: "#3B1A1A", fontSize: 18, lineHeight: 1.1, fontWeight: 900 }}>
                    Install Spaza Tap
                  </h3>
                  <p style={{ margin: "5px 0 0", color: "#756766", fontSize: 13, lineHeight: 1.35, fontWeight: 600 }}>
                    Add Spaza Tap to your phone for quick access.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Close install guide"
                style={{
                  width: 34,
                  height: 34,
                  border: 0,
                  borderRadius: 999,
                  background: "#F3EEE8",
                  color: "#3B1A1A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
              {platform === "ios" ? (
                <>
                  <StepCard number={1}>Tap the <strong>Share</strong> button in Safari.</StepCard>
                  <StepCard number={2}>Choose <strong>Add to Home Screen</strong>.</StepCard>
                  <StepCard number={3}>Confirm by tapping <strong>Add</strong>.</StepCard>
                </>
              ) : (
                <>
                  <StepCard number={1}>Tap the browser menu <strong>(three dots)</strong>.</StepCard>
                  <StepCard number={2}>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</StepCard>
                  <StepCard number={3}>Confirm by tapping <strong>Add</strong> or <strong>Install</strong>.</StepCard>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              style={{
                width: "100%",
                height: 48,
                border: 0,
                borderRadius: 14,
                background: "#3B1A1A",
                color: "#FFFFFF",
                fontWeight: 900,
                fontSize: 13,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
