import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register Service Worker for PWA (Installable web app support)
if ("serviceWorker" in navigator) {
  const registerServiceWorker = () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then((reg) => {
        console.log("Service Worker registered successfully:", reg.scope);
      })
      .catch((err) => {
        console.error("Service Worker registration failed:", err);
      });
  };

  if (document.readyState === "complete" || document.readyState === "interactive") {
    registerServiceWorker();
  } else {
    window.addEventListener("load", registerServiceWorker);
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
