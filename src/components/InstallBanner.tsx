import React, { useEffect, useState } from "react";

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

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    const dismissed = localStorage.getItem("installBannerDismissed");
    const appInstalled = localStorage.getItem("appInstalled");

    if (isStandalone || dismissed === "true" || appInstalled === "true") {
      setIsVisible(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      localStorage.setItem("appInstalled", "true");
      setIsVisible(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("installBannerDismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="install-banner">
      <img src="/icons/icon-192x192.png" alt="App Icon" className="install-icon" />

      <div className="install-text">
        <strong>Download the App Now</strong>
        <span>Get faster access and a better experience</span>
      </div>

      <button id="install-button" onClick={handleInstallClick}>Install App</button>
      <button id="close-install-banner" onClick={handleClose}>×</button>
    </div>
  );
}
