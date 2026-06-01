import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface ClickEventParams {
  page: string;
  elementId?: string;
  elementText?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

interface PageVisitParams {
  page: string;
  duration?: number;
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

interface ActionParams {
  page: string;
  actionName: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  metadata?: any;
}

// Get basic device properties
const getDeviceInfo = () => {
  try {
    return {
      userAgent: navigator.userAgent,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      language: navigator.language,
    };
  } catch (e) {
    return {
      userAgent: "Unknown",
      screenWidth: 0,
      screenHeight: 0,
      language: "en-US",
    };
  }
};

export const telemetry = {
  /**
   * Tracks a button / element click event
   */
  trackClick: async (params: ClickEventParams) => {
    try {
      const { page, elementId, elementText, userId, userEmail, userRole } = params;
      await addDoc(collection(db, "telemetry_events"), {
        eventType: "click",
        page,
        elementId: elementId || "",
        elementText: elementText || "",
        userId: userId || "anonymous",
        userEmail: userEmail || "anonymous",
        userRole: userRole || "guest",
        deviceInfo: getDeviceInfo(),
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.error("Telemetry error:", e);
    }
  },

  /**
   * Tracks a page stay or view event
   */
  trackPageView: async (params: PageVisitParams) => {
    try {
      const { page, duration, userId, userEmail, userRole } = params;
      await addDoc(collection(db, "telemetry_events"), {
        eventType: "page_view",
        page,
        duration: duration || 0,
        userId: userId || "anonymous",
        userEmail: userEmail || "anonymous",
        userRole: userRole || "guest",
        deviceInfo: getDeviceInfo(),
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.error("Telemetry error:", e);
    }
  },

  /**
   * Tracks a custom operational action (e.g. Added Credit, Sent Promo)
   */
  trackAction: async (params: ActionParams) => {
    try {
      const { page, actionName, userId, userEmail, userRole, metadata } = params;
      await addDoc(collection(db, "telemetry_events"), {
        eventType: "action",
        page,
        actionName,
        userId: userId || "anonymous",
        userEmail: userEmail || "anonymous",
        userRole: userRole || "guest",
        metadata: metadata || {},
        deviceInfo: getDeviceInfo(),
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.error("Telemetry error:", e);
    }
  }
};
