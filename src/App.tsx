import React, { useState, useEffect } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  getRedirectResult,
  signInWithRedirect
} from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  doc, 
  getDoc, 
  getDocs,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./lib/firebase";

import { ScreenState, Customer, Transaction, CreditEntry, Account, CustomerAccessRequest } from "./types";
import WelcomeScreen from "./screens/WelcomeScreen";
import DashboardScreen from "./screens/DashboardScreen";
import CustomersScreen from "./screens/CustomersScreen";
import CustomerProfileScreen from "./screens/CustomerProfileScreen";
import AddCreditScreen from "./screens/AddCreditScreen";
import NewCustomerScreen from "./screens/NewCustomerScreen";
import ReportsScreen from "./screens/ReportsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import PromosScreen from "./screens/PromosScreen";
import CustomerDashboardScreen from "./screens/CustomerDashboardScreen";
import BottomNav from "./components/BottomNav";
import { InstallBanner } from "./components/InstallBanner";

// New Customer QR Poster & Access Approvals screens
import ShopQrCodeScreen from "./screens/ShopQrCodeScreen";
import CustomerAccessRequestsScreen from "./screens/CustomerAccessRequestsScreen";
import CustomerRequestStatusScreen from "./screens/CustomerRequestStatusScreen";
import CustomerJoinScreen from "./screens/CustomerJoinScreen";
import DesktopSidebar from "./components/DesktopSidebar";

import TillScreen from "./screens/manage/TillScreen";
import SalesScreen from "./screens/manage/SalesScreen";
import StockScreen from "./screens/manage/StockScreen";
import ExpensesScreen from "./screens/manage/ExpensesScreen";
import SuppliersScreen from "./screens/manage/SuppliersScreen";
import PurchasesScreen from "./screens/manage/PurchasesScreen";
import CashUpScreen from "./screens/manage/CashUpScreen";

import HubScreen from "./screens/HubScreen";
import OfficialProfileScreen from "./screens/OfficialProfileScreen";
import { WholesalePriceWatchScreen } from "./screens/WholesalePriceWatchScreen";
import { 
  EmergencyScreen, MunicipalityScreen, GovSupportScreen, 
  ComplianceScreen, TaxScreen, BusinessRegScreen, DocumentsScreen,
  RemindersScreen, IncidentsScreen, FoodSafetyScreen, FundingScreen,
  HelpAppChecklistScreen, AlertsScreen
} from "./screens/HubSubScreens";

import { calculateDaysOwingFrom, formatTxDate, computeStatus } from "./utils";
import PlatformAnalyticsScreen from "./screens/PlatformAnalyticsScreen";
import { telemetry } from "./lib/telemetry";

// LocalStorage Constants
const KEY_ACCOUNT = "spaza_tap_account";
const KEY_ROLE = "spaza_tap_role";
const KEY_CUSTOMER_ID = "spaza_tap_customer_id";
const KEY_SHOP_DETAILS = "spaza_tap_shop_details";

const KEY_LAST_SCREEN = "spaza_tap_last_screen";
const KEY_SELECTED_CUSTOMER_ID = "spaza_tap_selected_customer_id";

const OLD_KEY_ACCOUNT = "cwebezela_account";
const OLD_KEY_ROLE = "cwebezela_role";
const OLD_KEY_CUSTOMER_ID = "cwebezela_customer_id";
const OLD_KEY_SHOP_DETAILS = "cwebezela_shop_details";

// Migration layer helper function
const getLocalStorageItem = (key: string, oldKey: string): string | null => {
  const val = localStorage.getItem(key);
  if (val !== null) return val;
  // Fallback to old key if new key doesn't exist
  const oldVal = localStorage.getItem(oldKey);
  if (oldVal !== null) {
    // Migrate to new key
    localStorage.setItem(key, oldVal);
    return oldVal;
  }
  return null;
};

// Set values wrapper
const setLocalStorageItem = (key: string, oldKey: string, value: string) => {
  localStorage.setItem(key, value);
  localStorage.setItem(oldKey, value); // Keep mirror for safety
};

// Remove values wrapper
const removeLocalStorageItems = () => {
  localStorage.removeItem(KEY_ACCOUNT);
  localStorage.removeItem(KEY_ROLE);
  localStorage.removeItem(KEY_CUSTOMER_ID);
  localStorage.removeItem(KEY_SHOP_DETAILS);
  localStorage.removeItem(OLD_KEY_ACCOUNT);
  localStorage.removeItem(OLD_KEY_ROLE);
  localStorage.removeItem(OLD_KEY_CUSTOMER_ID);
  localStorage.removeItem(OLD_KEY_SHOP_DETAILS);
  localStorage.removeItem(KEY_LAST_SCREEN);
  localStorage.removeItem(KEY_SELECTED_CUSTOMER_ID);
};

const RESTORABLE_OWNER_SCREENS: ScreenState[] = [
  "dashboard",
  "promos",
  "sales",
  "till",
  "stock",
  "expenses",
  "suppliers",
  "purchases",
  "cash_ups",
  "customers",
  "customerProfile",
  "addCredit",
  "newCustomer",
  "reports",
  "settings",
  "shopQrCode",
  "customerAccessRequests",
  "hub",
  "emergency",
  "municipality",
  "govSupport",
  "compliance",
  "tax",
  "businessReg",
  "documents",
  "reminders",
  "incidents",
  "foodSafety",
  "funding",
  "helpAppChecklist",
  "alerts",
  "officialProfile",
  "priceWatch",
  "platform_analytics"
];

const getSavedOwnerScreen = (): ScreenState | null => {
  const hashScreen = window.location.hash.replace("#", "") as ScreenState;

  if (RESTORABLE_OWNER_SCREENS.includes(hashScreen)) {
    return hashScreen;
  }

  const savedScreen = localStorage.getItem(KEY_LAST_SCREEN) as ScreenState | null;

  if (savedScreen && RESTORABLE_OWNER_SCREENS.includes(savedScreen)) {
    return savedScreen;
  }

  return null;
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>(() => {
    const cachedRole = getLocalStorageItem(KEY_ROLE, OLD_KEY_ROLE);
    const cachedAccount = getLocalStorageItem(KEY_ACCOUNT, OLD_KEY_ACCOUNT);
    const cachedCustomerId = getLocalStorageItem(KEY_CUSTOMER_ID, OLD_KEY_CUSTOMER_ID);

    if (cachedRole === "customer" && cachedCustomerId) {
      return "customerDashboard";
    }

    if (cachedAccount) {
      return getSavedOwnerScreen() || "dashboard";
    }

    return "welcome";
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(() => {
    return localStorage.getItem(KEY_SELECTED_CUSTOMER_ID);
  });

  const [userRole, setUserRole] = useState<"shop_owner" | "customer" | null>(() => {
    return (getLocalStorageItem(KEY_ROLE, OLD_KEY_ROLE) as any) || null;
  });
  const [myCustomerId, setMyCustomerId] = useState<string | null>(() => {
    return getLocalStorageItem(KEY_CUSTOMER_ID, OLD_KEY_CUSTOMER_ID) || null;
  });
  const [shopDetails, setShopDetails] = useState<{ shopName: string; phoneNumber: string; ownerName: string } | null>(() => {
    const cached = getLocalStorageItem(KEY_SHOP_DETAILS, OLD_KEY_SHOP_DETAILS);
    return cached ? JSON.parse(cached) : null;
  });

  const [isLoadingAuth, setIsLoadingAuth] = useState(() => {
    const cachedAcc = getLocalStorageItem(KEY_ACCOUNT, OLD_KEY_ACCOUNT);
    const cachedRole = getLocalStorageItem(KEY_ROLE, OLD_KEY_ROLE);
    const cachedCustId = getLocalStorageItem(KEY_CUSTOMER_ID, OLD_KEY_CUSTOMER_ID);
    return !(cachedAcc || (cachedRole === "customer" && cachedCustId));
  });

  const [currentAccount, setCurrentAccount] = useState<Account | null>(() => {
    const cached = getLocalStorageItem(KEY_ACCOUNT, OLD_KEY_ACCOUNT);
    return cached ? JSON.parse(cached) : null;
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [creditEntries, setCreditEntries] = useState<CreditEntry[]>([]);

  // Customer QR and Digital Requests state variables
  const [customerAccessRequests, setCustomerAccessRequests] = useState<CustomerAccessRequest[]>([]);
  const [scannedShopCode, setScannedShopCode] = useState<string | null>(null);
  const [scannedShop, setScannedShop] = useState<{ id: string; shopName: string; ownerUserId: string } | null>(null);

  // Global click tracker for analytics
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      try {
        const target = event.target as HTMLElement;
        const clickable = target.closest("button, a, input[type='submit'], [role='button'], .clickable-analytics");
        if (clickable) {
          const text = clickable.textContent?.trim() || (clickable as HTMLInputElement).value || clickable.getAttribute("aria-label") || "";
          const id = clickable.id || "";
          if (text.length > 0 || id) {
            // Mask any potential pins or passwords from telemetry stream
            if (text.length < 50 && !text.includes("••••") && !id.toLowerCase().includes("password") && !id.toLowerCase().includes("pin")) {
              telemetry.trackClick({
                page: currentScreen,
                elementId: id,
                elementText: text.substring(0, 40),
                userId: auth.currentUser?.uid,
                userEmail: auth.currentUser?.email || undefined,
                userRole: userRole || undefined,
              });
            }
          }
        }
      } catch (err) {
        console.error("Global telemetry click logger error:", err);
      }
    };
    
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, [currentScreen, userRole, auth.currentUser]);

  // Track page stay durations
  useEffect(() => {
    const startTime = Date.now();
    const pageAtStart = currentScreen;
    const emailAtStart = auth.currentUser?.email;
    const uidAtStart = auth.currentUser?.uid;
    const roleAtStart = userRole;

    return () => {
      try {
        const durationSeconds = Math.round((Date.now() - startTime) / 1000);
        if (durationSeconds >= 1) {
          telemetry.trackPageView({
            page: pageAtStart,
            duration: durationSeconds,
            userId: uidAtStart,
            userEmail: emailAtStart || undefined,
            userRole: roleAtStart || undefined,
          });
        }
      } catch (err) {
        console.error("Global telemetry duration tracker error:", err);
      }
    };
  }, [currentScreen, auth.currentUser, userRole]);
  const [joinError, setJoinError] = useState("");

  const loadUserProfile = async (uid: string) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role || "shop_owner";
        setUserRole(role);
        setLocalStorageItem(KEY_ROLE, OLD_KEY_ROLE, role);

        if (role === "shop_owner") {
          if (userData.shopId) {
            const shopDocRef = doc(db, "shops", userData.shopId);
            const shopDoc = await getDoc(shopDocRef);
            if (shopDoc.exists()) {
              const shopData = shopDoc.data();
              let shopCode = shopData.shopCode || "";
              let joinLink = shopData.joinLink || "";

              if (!shopCode) {
                const cleanName = (shopData.shopName || "SHOP").toUpperCase().replace(/[^A-Z]/g, "").substring(0, 4);
                const prefix = cleanName.padEnd(4, "X");
                const rand = Math.floor(1000 + Math.random() * 9000);
                shopCode = `${prefix}-${rand}`;
                joinLink = `${window.location.origin}/join/${shopCode}`;

                await setDoc(shopDocRef, {
                  shopCode,
                  joinLink,
                  updatedAt: serverTimestamp()
                }, { merge: true });
              }

              const accountData = {
                id: shopData.id || userData.shopId || "",
                shopName: shopData.shopName || `${userData.displayName || "My"}'s Shop`,
                ownerName: shopData.ownerName || userData.displayName || "Owner",
                phone: shopData.phoneNumber || userData.phoneNumber || "",
                pin: "", // Not used securely
                defaultLimit: shopData.defaultCreditLimit !== undefined ? shopData.defaultCreditLimit : 500,
                whatsappTemplate: shopData.reminderTemplate || shopData.whatsappTemplate || "",
                shopCode: shopCode,
                joinLink: joinLink,
                
                // Official Shop Profile Fields
                ownerEmail: shopData.ownerEmail || "",
                shopAddress: shopData.shopAddress || "",
                town: shopData.town || "",
                localMunicipality: shopData.localMunicipality || "",
                districtMunicipality: shopData.districtMunicipality || "",
                province: shopData.province || "",
                wardNumber: shopData.wardNumber || "",
                businessRegistrationNumber: shopData.businessRegistrationNumber || "",
                taxNumber: shopData.taxNumber || "",
                tradingPermitNumber: shopData.tradingPermitNumber || "",
                supportFundReferenceNumber: shopData.supportFundReferenceNumber || "",
                emergencyContactPerson: shopData.emergencyContactPerson || "",
                emergencyContactNumber: shopData.emergencyContactNumber || "",
                nearestPoliceStation: shopData.nearestPoliceStation || "",
                nearestClinic: shopData.nearestClinic || "",
                municipalAccountNumber: shopData.municipalAccountNumber || "",
                businessType: shopData.businessType || "",
                shopPhotos: shopData.shopPhotos || [],
                operatingHours: shopData.operatingHours || "",
                numberOfEmployees: shopData.numberOfEmployees || 0,
                mainProductsSold: shopData.mainProductsSold || "",
              };
              setCurrentAccount(accountData);
              setLocalStorageItem(KEY_ACCOUNT, OLD_KEY_ACCOUNT, JSON.stringify(accountData));
              setCurrentScreen(prev => (prev === "welcome" || prev === "customerDashboard" || prev === "customerRequestStatus" || prev === "customerJoin") ? "dashboard" : prev);
              return true;
            }
          }
        } else if (role === "customer") {
          let customerId = userData.customerId || "";

          if (!customerId) {
            // Scan for an approved request for status backup
            const reqsQuery = query(
              collection(db, "customer_access_requests"),
              where("customerUserId", "==", uid),
              where("status", "==", "approved")
            );
            const reqsSnap = await getDocs(reqsQuery);
            if (!reqsSnap.empty) {
              const reqData = reqsSnap.docs[0].data();
              customerId = reqData.linkedCustomerId;
              if (customerId) {
                // Persist update on users profile doc
                await setDoc(doc(db, "users", uid), { customerId, updatedAt: serverTimestamp() }, { merge: true });
              }
            }
          }

          if (customerId) {
            setMyCustomerId(customerId);
            setLocalStorageItem(KEY_CUSTOMER_ID, OLD_KEY_CUSTOMER_ID, customerId);
            
            const customerDocRef = doc(db, "customers", customerId);
            const customerDoc = await getDoc(customerDocRef);
            if (customerDoc.exists()) {
              const custData = customerDoc.data();
              
              // Find and load shop details
              const shopDocRef = doc(db, "shops", custData.shopId);
              const shopDoc = await getDoc(shopDocRef);
              const sData = shopDoc.exists() ? shopDoc.data() : null;

              const shopInfo = {
                shopName: sData ? sData.shopName : "Spaza Tap Shop",
                phoneNumber: sData ? sData.phoneNumber || "" : "",
                ownerName: sData ? sData.ownerName || "" : ""
              };
              setShopDetails(shopInfo);
              setLocalStorageItem(KEY_SHOP_DETAILS, OLD_KEY_SHOP_DETAILS, JSON.stringify(shopInfo));

              // Store shop details in account state too
              const accountData = {
                id: custData.shopId,
                shopName: shopInfo.shopName,
                ownerName: shopInfo.ownerName,
                phone: shopInfo.phoneNumber,
                pin: "",
                defaultLimit: custData.creditLimit || 500,
                whatsappTemplate: ""
              };
              setCurrentAccount(accountData);
              setLocalStorageItem(KEY_ACCOUNT, OLD_KEY_ACCOUNT, JSON.stringify(accountData));

              setCurrentScreen("customerDashboard");
              return true;
            }
          } else {
            // Not approved yet - customerRequestStatus keeps waitlist screen
            setCurrentScreen("customerRequestStatus");
            return true;
          }
        }
      }
    } catch (e) {
      console.error("Failed to load user profile", e);
    }
    return false;
  };

  // Auth Effect
  useEffect(() => {
    // Handle redirect results
    getRedirectResult(auth).then(async (cred) => {
      if (cred && cred.user) {
        const uid = cred.user.uid;
        const email = cred.user.email || "";
        const role = (localStorage.getItem("spaza_tap_auth_intent_role") || getLocalStorageItem(KEY_ROLE, OLD_KEY_ROLE) || "shop_owner") as "shop_owner" | "customer";
        const mode = (localStorage.getItem("spaza_tap_auth_intent_mode") || "login") as "login" | "signup";
        
        // Clear intent parameters
        localStorage.removeItem("spaza_tap_auth_intent_role");
        localStorage.removeItem("spaza_tap_auth_intent_mode");

        const userDocRef = doc(db, "users", uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === role) {
            await loadUserProfile(uid);
          } else {
            const mismatchMsg = userData.role === 'customer'
              ? "This account is registered as a Customer. Please use the correct portal."
              : "This account is registered as a Shop Owner. Please use the correct portal.";
            alert(mismatchMsg);
            await signOut(auth);
          }
        } else {
          // Check for recovery/linking (e.g. if another auth provider exists)
          const recovery = await recoverOrLinkAccount(uid, email, role);
          if (!recovery.success) {
            alert(recovery.message || "Failed to link/recover account.");
            await signOut(auth);
            return;
          }
          if (recovery.message === "RECOVERED") {
            await loadUserProfile(uid);
            return;
          }

          // New profile registration boundary for "login" mode
          if (mode === "login") {
            alert("No account found for this Google profile. Please register first.");
            await signOut(auth);
            return;
          }

          // New user signup
          const displayName = cred.user.displayName || email.split('@')[0];
          const batch = writeBatch(db);
          batch.set(userDocRef, {
            id: uid,
            uid: uid,
            email: email,
            displayName: displayName,
            ownerName: displayName,
            phoneNumber: cred.user.phoneNumber || "",
            role: role,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          if (role === "shop_owner") {
            const shopId = "shop_" + Date.now();
            const shopName = `${displayName}'s Shop`;
            batch.set(userDocRef, { shopId: shopId }, { merge: true });
            
            const defaultTemplate = `Hi [Customer Name], this is a reminder that you owe R[Amount] at ${shopName}. Your balance has been outstanding for [Days] days. Please pay when possible. Thank you.`;
            const shopDocRef = doc(db, "shops", shopId);
            batch.set(shopDocRef, {
              id: shopId,
              shopName: shopName,
              ownerUserId: uid,
              ownerName: displayName,
              phoneNumber: cred.user.phoneNumber || "",
              defaultCreditLimit: 500,
              reminderTemplate: defaultTemplate,
              whatsappTemplate: defaultTemplate,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              code: Math.floor(100000 + Math.random() * 900000).toString()
            });
          }
          
          await batch.commit();
          await loadUserProfile(uid);
        }
      }
    }).catch((e) => {
      console.error("Redirect login result error:", e);
      if (e.code === 'auth/unauthorized-domain') {
        alert("This app domain is not authorised for Google sign-in yet. Please contact support.");
      } else if (e.code === 'auth/account-exists-with-different-credential') {
        alert("This email already exists with another sign-in method. Please log in using the original method.");
      } else if (e.code === 'auth/network-request-failed') {
        alert("Network error. Please check your internet connection.");
      }
    });

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Optimistic UI means we might already be on dashboard from cache
        await loadUserProfile(user.uid);
      } else {
        removeLocalStorageItems();
        setUserRole(null);
        setMyCustomerId(null);
        setShopDetails(null);
        setCurrentAccount(null);
        setCurrentScreen("welcome");
        setSelectedCustomerId(null);
        setCustomers([]);
        setTransactions([]);
        setCreditEntries([]);
      }
      setIsLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  // 1. Startup URL parsing for QR / Join link parameters
  useEffect(() => {
    let code = "";
    const pathParts = window.location.pathname.split("/");
    if (pathParts[1] === "join" && pathParts[2]) {
      code = pathParts[2].trim().toUpperCase();
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const jParam = urlParams.get("join");
      if (jParam) {
        code = jParam.trim().toUpperCase();
      }
    }

    if (code) {
      setScannedShopCode(code);
      // Clean query path/string without triggering full refresh
      window.history.replaceState({}, document.title, window.location.origin);
    }
  }, []);

  // 2. Load shop details matching scannedShopCode
  useEffect(() => {
    if (!scannedShopCode) return;

    const queryShop = query(collection(db, "shops"), where("shopCode", "==", scannedShopCode));
    const unsub = onSnapshot(queryShop, (snap) => {
      if (!snap.empty) {
        const sDoc = snap.docs[0];
        const sData = sDoc.data();
        setScannedShop({
          id: sData.id,
          shopName: sData.shopName,
          ownerUserId: sData.ownerUserId
        });
        
        // Show join screen if not authenticated
        if (!auth.currentUser) {
          setCurrentScreen("customerJoin");
        }
      } else {
        console.warn("No shop matches scannedShopCode:", scannedShopCode);
        setJoinError("A shop with this code was not found. Please verify with the owner.");
        if (!auth.currentUser) {
          setCurrentScreen("welcome");
        }
      }
    }, (error) => {
      console.error("Firestore error loading scanned shop", error);
    });

    return () => unsub();
  }, [scannedShopCode]);

  // 3. Sync customer_access_requests in real-time
  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    let qr;
    if (userRole === "customer") {
      qr = query(collection(db, "customer_access_requests"), where("customerUserId", "==", uid));
    } else {
      qr = query(collection(db, "customer_access_requests"), where("shopOwnerUserId", "==", uid));
    }

    const unsubRequests = onSnapshot(qr, (snap) => {
      const dbReqs: CustomerAccessRequest[] = [];
      let newlyApproved = false;
      snap.forEach(doc => {
        const d = doc.data() as CustomerAccessRequest;
        dbReqs.push(d);
        if (userRole === "customer" && d.status === "approved" && currentScreen === "customerRequestStatus") {
          newlyApproved = true;
        }
      });
      setCustomerAccessRequests(dbReqs);
      if (newlyApproved) {
        loadUserProfile(uid);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "customer_access_requests");
    });

    return () => unsubRequests();
  }, [userRole, auth.currentUser]);

  // Data Sync
  useEffect(() => {
    if (!currentAccount || !auth.currentUser) return;
    const uid = auth.currentUser.uid;

    let qCustomers;
    let qCredit;
    let qTx;

    if (userRole === "customer") {
      if (!myCustomerId) return;
      qCustomers = query(collection(db, "customers"), where("linkedCustomerUserId", "==", uid));
      qCredit = query(collection(db, "credit_entries"), where("customerId", "==", myCustomerId));
      qTx = query(collection(db, "transactions"), where("customerId", "==", myCustomerId));
    } else {
      qCustomers = query(collection(db, "customers"), where("shopId", "==", currentAccount.id), where("ownerUserId", "==", uid));
      qCredit = query(collection(db, "credit_entries"), where("shopId", "==", currentAccount.id), where("ownerUserId", "==", uid));
      qTx = query(collection(db, "transactions"), where("shopId", "==", currentAccount.id), where("ownerUserId", "==", uid));
    }

    const unsubCustomers = onSnapshot(qCustomers, (snap) => {
      const dbCusts: Customer[] = [];
      snap.forEach(doc => {
        const data = doc.data();
        dbCusts.push({
          id: data.id,
          name: data.name,
          initials: data.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2),
          phone: data.phoneNumber || "",
          owed: 0, // Recalculated below when credit changes
          daysOwing: 0,
          status: "none",
          area: data.areaOrAddress || "",
          limit: data.creditLimit || currentAccount.defaultLimit,
          notes: data.notes || "",
          lastActivity: "Added tracking",
          photoUrl: data.photoUrl,
          customerReferenceNumber: data.customerReferenceNumber || "",
          creditStatus: data.creditStatus || "active",
          linkedCustomerUserId: data.linkedCustomerUserId || ""
        });
      });
      setCustomers(old => {
        // Merge owed calculations if possible
        return dbCusts.map(newC => {
          const matchingOld = old.find(o => o.id === newC.id);
          if (matchingOld) {
            newC.owed = matchingOld.owed;
            newC.daysOwing = matchingOld.daysOwing;
            newC.status = matchingOld.status;
            newC.lastActivity = matchingOld.lastActivity;
          }
          return newC;
        });
      });
    }, (error) => handleFirestoreError(error, OperationType.GET, "customers"));

    const unsubCredit = onSnapshot(qCredit, (snap) => {
      const dbCredits: CreditEntry[] = [];
      snap.forEach(doc => {
        const data = doc.data();
        dbCredits.push({
          id: data.id,
          customerId: data.customerId,
          amount: data.amount,
          remaining: data.balance,
          date: data.creditDate,
          description: data.description || ""
        });
      });
      setCreditEntries(dbCredits);
    }, (error) => handleFirestoreError(error, OperationType.GET, "credit_entries"));

    const unsubTx = onSnapshot(qTx, (snap) => {
      const dbTxs: Transaction[] = [];
      snap.forEach(doc => {
        const data = doc.data();
        dbTxs.push({
          id: data.id,
          customerId: data.customerId,
          type: data.type as any,
          amount: data.amount,
          date: formatTxDate(data.transactionDate),
          description: data.description || "",
          balanceAfter: data.balanceAfterTransaction
        });
      });
      // Sort desc
      dbTxs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(dbTxs);
    }, (error) => handleFirestoreError(error, OperationType.GET, "transactions"));

    return () => {
      unsubCustomers();
      unsubCredit();
      unsubTx();
    };
  }, [currentAccount?.id, auth.currentUser?.uid, userRole, myCustomerId]);

  // Derived calculations effect to merge Firestore data into `customers`
  useEffect(() => {
    setCustomers(prev => {
      let isChanged = false;
      const next = prev.map(c => {
        const cCredits = creditEntries.filter(cr => cr.customerId === c.id && cr.remaining > 0);
        cCredits.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const newOwed = cCredits.reduce((sum, cr) => sum + cr.remaining, 0);
        const newDaysOwing = cCredits.length > 0 ? calculateDaysOwingFrom(cCredits[0].date) : 0;
        const newStatus = computeStatus(newOwed, newDaysOwing);
        
        let cTxs = transactions.filter(t => t.customerId === c.id);
        const lastActStr = cTxs.length > 0 ? (cTxs[0].type === "credit_added" ? "Credit added" : "Payment made") : "Tracking added";
        
        if (c.owed !== newOwed || c.daysOwing !== newDaysOwing || c.status !== newStatus || c.lastActivity !== lastActStr) {
          isChanged = true;
          return { ...c, owed: newOwed, daysOwing: newDaysOwing, status: newStatus, lastActivity: lastActStr };
        }
        return c;
      });
      return isChanged ? next : prev;
    });
  }, [creditEntries, transactions]);

  const navigateTo = (screen: ScreenState) => {
    if (userRole === "customer" && screen !== "customerDashboard" && screen !== "customerRequestStatus" && screen !== "welcome" && screen !== "customerJoin") {
        return;
    }
    
    setCurrentScreen(screen);
    
    if (userRole === "shop_owner" && RESTORABLE_OWNER_SCREENS.includes(screen)) {
      localStorage.setItem(KEY_LAST_SCREEN, screen);
      window.history.replaceState({}, document.title, `#${screen}`);
    }

    if (screen === "welcome") {
      localStorage.removeItem(KEY_LAST_SCREEN);
      localStorage.removeItem(KEY_SELECTED_CUSTOMER_ID);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    window.scrollTo(0, 0);
  };

  const viewCustomer = (id: string) => {
    setSelectedCustomerId(id);
    localStorage.setItem(KEY_SELECTED_CUSTOMER_ID, id);
    navigateTo("customerProfile");
  };

  const recoverOrLinkAccount = async (uid: string, email: string, role: string): Promise<{ success: boolean; message: string | null }> => {
    // 1. Check if any shop exists for this exact UID (users doc got deleted but shop exists)
    if (role === "shop_owner") {
      const shopsQuery = query(collection(db, "shops"), where("ownerUserId", "==", uid));
      const shopsSnap = await getDocs(shopsQuery);
      if (!shopsSnap.empty) {
        const existingShopId = shopsSnap.docs[0].id;
        const userDocRef = doc(db, "users", uid);
        await setDoc(userDocRef, {
          id: uid,
          uid: uid,
          email: email,
          displayName: email.split('@')[0],
          ownerName: email.split('@')[0],
          role: role,
          shopId: existingShopId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return { success: true, message: "RECOVERED" };
      }
    }

    // 2. Check if ANY user doc already uses this email (if different UID provider linked)
    if (email) {
      try {
        const usersRef = collection(db, "users");
        const emailQuery = query(usersRef, where("email", "==", email));
        const qs = await getDocs(emailQuery);

        if (!qs.empty) {
          // Find if another user document has this email
          const match = qs.docs.find(d => d.id !== uid);
          if (match) {
            const existingData = match.data();
            if (existingData.role && existingData.role !== role) {
              return { 
                success: false, 
                message: `This email is already registered as a ${existingData.role === 'customer' ? 'Customer' : 'Shop Owner'}. Please select the correct portal to log in.` 
              };
            }

            // Perform automatic link/recovery!
            const userDocRef = doc(db, "users", uid);
            await setDoc(userDocRef, {
              id: uid,
              uid: uid,
              email: email,
              displayName: existingData.displayName || existingData.ownerName || email.split('@')[0],
              ownerName: existingData.ownerName || existingData.displayName || email.split('@')[0],
              phoneNumber: existingData.phoneNumber || "",
              role: role,
              shopId: existingData.shopId || null,
              customerId: existingData.customerId || null,
              createdAt: existingData.createdAt || serverTimestamp(),
              updatedAt: serverTimestamp()
            }, { merge: true });

            if (role === "shop_owner" && existingData.shopId) {
              const shopDocRef = doc(db, "shops", existingData.shopId);
              await setDoc(shopDocRef, { ownerUserId: uid, updatedAt: serverTimestamp() }, { merge: true });
            }

            if (role === "customer" && existingData.customerId) {
              const customerDocRef = doc(db, "customers", existingData.customerId);
              await setDoc(customerDocRef, { linkedCustomerUserId: uid, updatedAt: serverTimestamp() }, { merge: true });
            }

            return { success: true, message: "RECOVERED" };
          }
        }
      } catch (e) {
        console.warn("Could not check email uniqueness or recover/link account:", e);
      }
    }

    // If completely new
    return { success: true, message: null };
  };

  // AUTH ACTIONS
  const handleGoogleAuth = async (role: "shop_owner" | "customer", mode: "login" | "signup"): Promise<string | null> => {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const uid = cred.user.uid;
      const email = cred.user.email || "";
      
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role !== role) {
          await signOut(auth);
          const mismatchMsg = userData.role === 'customer'
            ? "This account is registered as a Customer. Please use the correct portal."
            : "This account is registered as a Shop Owner. Please use the correct portal.";
          return mismatchMsg;
        }
        const loaded = await loadUserProfile(uid);
        if (!loaded) { // Attempt recovery if load failed
          const recovery = await recoverOrLinkAccount(uid, email, role);
          if (recovery.success && recovery.message === "RECOVERED") {
            const loadedRetry = await loadUserProfile(uid);
            if (loadedRetry) return null;
          }
          await signOut(auth);
          return "Failed to load profile. Recovery attempted but failed.";
        }
        return null;
      } else {
        // Run duplication / recovery check BEFORE creating a blank new shop
        const recovery = await recoverOrLinkAccount(uid, email, role);
        if (!recovery.success) {
          await signOut(auth);
          return recovery.message; 
        }
        if (recovery.message === "RECOVERED") {
          // Shop already existed and we relinked it.
          await loadUserProfile(uid);
          return null;
        }

        // New profile required - enforce "login" mode boundary
        if (mode === "login") {
          await signOut(auth);
          return "No account found for this Google profile. Please register first.";
        }

        // Completely New user signup
        const displayName = cred.user.displayName || email.split('@')[0];
        
        const batch = writeBatch(db);
        batch.set(userDocRef, {
          id: uid,
          uid: uid,
          email: email,
          displayName: displayName,
          ownerName: displayName,
          phoneNumber: cred.user.phoneNumber || "",
          role: role,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        if (role === "shop_owner") {
          const shopId = "shop_" + Date.now();
          const shopName = `${displayName}'s Shop`;
          batch.set(userDocRef, { shopId: shopId }, { merge: true });
          
          const defaultTemplate = `Hi [Customer Name], this is a reminder that you owe R[Amount] at ${shopName}. Your balance has been outstanding for [Days] days. Please pay when possible. Thank you.`;
          const shopDocRef = doc(db, "shops", shopId);
          batch.set(shopDocRef, {
            id: shopId,
            shopName: shopName,
            ownerUserId: uid,
            ownerName: displayName,
            phoneNumber: cred.user.phoneNumber || "",
            defaultCreditLimit: 500,
            reminderTemplate: defaultTemplate,
            whatsappTemplate: defaultTemplate,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            code: Math.floor(100000 + Math.random() * 900000).toString()
          });
        }
        
        await batch.commit();
        const loaded = await loadUserProfile(uid);
        if (!loaded) {
          await signOut(auth);
          return "Failed to establish profile.";
        }
        return null;
      }
    } catch (e: any) {
      console.warn("Google popup sign-in failed, checking redirect fallback:", e);
      // Fallback to Redirect Sign-In on mobile/iOS, if popups are blocked/cancelled/closed, or when running inside an iframe
      if (
        e.code === 'auth/popup-blocked' || 
        e.code === 'auth/cancelled-popup-request' || 
        e.code === 'auth/popup-closed-by-user' ||
        window.self !== window.top ||
        /Android|iPhone|iPad|iPod|Macintosh|Windows|Linux/i.test(navigator.userAgent)
      ) {
        try {
          localStorage.setItem("spaza_tap_auth_intent_role", role);
          localStorage.setItem("spaza_tap_auth_intent_mode", mode);
          const provider = new GoogleAuthProvider();
          await signInWithRedirect(auth, provider);
          return null; // Redirect flow initiated
        } catch (redirectErr: any) {
          e = redirectErr;
        }
      }
      if (e.code === 'auth/unauthorized-domain') {
        return "This app domain is not authorised for Google sign-in yet. Please contact support.";
      }
      if (e.code === 'auth/popup-closed-by-user') {
        return "Sign-in cancelled. Please try again.";
      }
      if (e.code === 'auth/account-exists-with-different-credential') {
        return "This email already exists with another sign-in method. Please log in using the original method.";
      }
      if (e.code === 'auth/network-request-failed') {
        return "Network error. Please check your internet connection.";
      }
      return e.message || "Google authentication failed.";
    }
  };

  const handleLogin = async (email: string, pin: string): Promise<string | null> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pin);
      // Fetch user profile doc to verify role
      const userDocRef = doc(db, "users", cred.user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role !== "shop_owner") {
          await signOut(auth);
          return "This account is registered as a Customer. Please use the correct portal.";
        }
      } else {
        const recovery = await recoverOrLinkAccount(cred.user.uid, email, "shop_owner");
        if (recovery.success && recovery.message === "RECOVERED") {
          const loadedRetry = await loadUserProfile(cred.user.uid);
          if (loadedRetry) return null;
        }
        await signOut(auth);
        return "Incorrect email or password.";
      }
      const loaded = await loadUserProfile(cred.user.uid);
      if (!loaded) {
        const recovery = await recoverOrLinkAccount(cred.user.uid, email, "shop_owner");
        if (recovery.success && recovery.message === "RECOVERED") {
          const loadedRetry = await loadUserProfile(cred.user.uid);
          if (loadedRetry) return null;
        }
        await signOut(auth);
        return "Incorrect email or password.";
      }
      return null;
    } catch (e: any) {
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
        return "Incorrect email or password.";
      }
      if (e.code === 'auth/too-many-requests') return "Too many attempts. Please wait and try again later.";
      if (e.code === 'auth/network-request-failed') return "Network error. Please check your internet connection.";
      if (e.code === 'auth/popup-closed-by-user') return "Google sign-in was cancelled.";
      if (e.code === 'auth/account-exists-with-different-credential') return "This email already exists with a different sign-in method. Please use the original method or link your account.";
      return "Incorrect email or password.";
    }
  };

  const handleSignup = async (email: string, shopName: string, ownerName: string, phone: string, pin: string): Promise<string | null> => {
    try {
      // Create user
      const userCred = await createUserWithEmailAndPassword(auth, email, pin);
      const uid = userCred.user.uid;
      
      const shopId = "shop_" + Date.now();
      const defaultTemplate = "Hi [Customer Name], this is a reminder that you owe R[Amount] at " + shopName + ". Your balance has been outstanding for [Days] days. Please pay when possible. Thank you.";

      // Batch write to user and shop
      const batch = writeBatch(db);
      
      const userRef = doc(db, "users", uid);
      batch.set(userRef, {
        uid: uid,
        email: email,
        displayName: ownerName,
        ownerName: ownerName,
        phoneNumber: phone,
        shopId: shopId,
        role: "shop_owner",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const shopRef = doc(db, "shops", shopId);
      batch.set(shopRef, {
        id: shopId,
        ownerUserId: uid,
        shopName: shopName,
        ownerName: ownerName,
        phoneNumber: phone,
        defaultCreditLimit: 500,
        reminderTemplate: defaultTemplate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      try {
        await batch.commit();
        await loadUserProfile(uid);
        return null;
      } catch (err: any) {
        // Rollback Firebase Auth user if Firestore setup fails due to rules or other error
        console.error("Batch commit failed", err);
        try { await userCred.user.delete(); } catch(e) {}
        return err.message || "Failed to finalize account setup. Please try again.";
      }
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') return "This email is already registered. Please go back and select 'Log In' instead of 'Register'.";
      return e.message || "Failed to sign up";
    }
  };

  const handlePasswordReset = async (email: string): Promise<string | null> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return null;
    } catch (e: any) {
      console.error(e);
      return e.message || "Failed to send reset email.";
    }
  };

  const handleCustomerLogin = async (email: string, pin: string): Promise<string | null> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pin);
      // Fetch user profile doc to verify role
      const userDocRef = doc(db, "users", cred.user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role !== "customer") {
          await signOut(auth);
          return "This account is registered as a Shop Owner. Please use the correct portal.";
        }
      } else {
        await signOut(auth);
        return "Incorrect email or password.";
      }
      const loaded = await loadUserProfile(cred.user.uid);
      if (!loaded) {
        await signOut(auth);
        return "Incorrect email or password.";
      }
      return null;
    } catch (e: any) {
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
        return "Incorrect email or password.";
      }
      if (e.code === 'auth/too-many-requests') return "Too many attempts. Please wait and try again later.";
      if (e.code === 'auth/network-request-failed') return "Network error. Please check your internet connection.";
      if (e.code === 'auth/popup-closed-by-user') return "Google sign-in was cancelled.";
      if (e.code === 'auth/account-exists-with-different-credential') return "This email already exists with a different sign-in method. Please use the original method or link your account.";
      return "Incorrect email or password.";
    }
  };

  const handleCustomerSignup = async (
    fullName: string,
    phone: string,
    email: string,
    pin: string
  ): Promise<string | null> => {
    try {
      // 1. Create a Firebase Auth user for the customer.
      const userCred = await createUserWithEmailAndPassword(auth, email, pin);
      const uid = userCred.user.uid;

      // 2. Create user record in users/{uid}
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, {
        uid: uid,
        email: email,
        displayName: fullName,
        phoneNumber: phone,
        role: "customer",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Load user profile
      setUserRole("customer");
      setLocalStorageItem(KEY_ROLE, OLD_KEY_ROLE, "customer");
      setCurrentScreen("welcome"); // Since they aren't linked yet, let them go to Welcome/Join screen
      return null;
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/email-already-in-use') return "An account with this email already exists. Please log in.";
      if (e.code === 'auth/weak-password') return "Weak password. Please use at least 6 characters.";
      if (e.code === 'auth/account-exists-with-different-credential') return "This email already exists with a different sign-in method. Please use the original method or link your account.";
      return "Incorrect email or password.";
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleUpdateSettings = async (fields: {
    shopName: string;
    ownerName: string;
    phone: string;
    defaultLimit: number;
    whatsappTemplate: string;
  }) => {
    if (!currentAccount || !auth.currentUser) return;
    try {
      const shopRef = doc(db, "shops", currentAccount.id);
      await setDoc(shopRef, {
        shopName: fields.shopName,
        ownerName: fields.ownerName,
        phoneNumber: fields.phone,
        defaultCreditLimit: fields.defaultLimit,
        reminderTemplate: fields.whatsappTemplate,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setCurrentAccount(prev => {
        if (!prev) return null;
        return {
          ...prev,
          shopName: fields.shopName,
          ownerName: fields.ownerName,
          phone: fields.phone,
          defaultLimit: fields.defaultLimit,
          whatsappTemplate: fields.whatsappTemplate
        }
      });
    } catch (e) {
      console.error(e);
      handleFirestoreError(e, OperationType.UPDATE, "shops");
    }
  };

  // CUSTOMER ACTIONS
  const handleAddCustomer = async (cData: { name: string; phone: string; area: string; limit: number; notes: string; photoUrl?: string }) => {
    if (!currentAccount || !auth.currentUser) return null;
    try {
      const namePart = (cData.name || "CUST").toUpperCase().replace(/[^A-Z]/g, "").substring(0, 3).padEnd(3, "X");
      const randPart = Math.floor(1000 + Math.random() * 9000);
      const customerReferenceNumber = `SPT-${namePart}-${randPart}`;

      const customerId = "cust_" + Date.now();
      const customerRef = doc(db, "customers", customerId);
      await setDoc(customerRef, {
        id: customerId,
        shopId: currentAccount.id,
        ownerUserId: auth.currentUser.uid,
        name: cData.name,
        phoneNumber: cData.phone,
        areaOrAddress: cData.area,
        creditLimit: cData.limit,
        notes: cData.notes,
        photoUrl: cData.photoUrl || null,
        customerReferenceNumber,
        creditStatus: "active",
        linkedCustomerUserId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return customerId;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "customers");
      alert("Could not save customer. Please try again.");
      return null;
    }
  };

  const handleUpdateCustomer = async (id: string, fields: Partial<Customer>) => {
    if (!currentAccount || !auth.currentUser) return;
    try {
      const customerRef = doc(db, "customers", id);
      const updateData: any = {};
      if (fields.name !== undefined) updateData.name = fields.name;
      if (fields.phone !== undefined) updateData.phoneNumber = fields.phone;
      if (fields.area !== undefined) updateData.areaOrAddress = fields.area;
      if (fields.limit !== undefined) updateData.creditLimit = fields.limit;
      if (fields.notes !== undefined) updateData.notes = fields.notes;
      if (fields.creditStatus !== undefined) updateData.creditStatus = fields.creditStatus;
      if (fields.linkedCustomerUserId !== undefined) updateData.linkedCustomerUserId = fields.linkedCustomerUserId;
      if (fields.photoUrl !== undefined) updateData.photoUrl = fields.photoUrl;
      
      updateData.updatedAt = serverTimestamp();
      
      await setDoc(customerRef, updateData, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "customers");
    }
  };

  // ADD CREDIT
  const handleAddCredit = async (data: { customerId: string; amount: number; description: string; date: string }) => {
    if (!currentAccount || !auth.currentUser) return;
    try {
      const entryId = "ce_" + Date.now();
      const batch = writeBatch(db);
      
      const ceRef = doc(db, "credit_entries", entryId);
      batch.set(ceRef, {
        id: entryId,
        shopId: currentAccount.id,
        ownerUserId: auth.currentUser.uid,
        customerId: data.customerId,
        amount: data.amount,
        amountPaid: 0,
        balance: data.amount,
        description: data.description || "Credit items",
        creditDate: data.date,
        status: "unpaid",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const txId = "tx_" + Date.now();
      const targetCust = customers.find(c => c.id === data.customerId);
      const newOwed = (targetCust?.owed || 0) + data.amount;

      const txRef = doc(db, "transactions", txId);
      batch.set(txRef, {
        id: txId,
        shopId: currentAccount.id,
        ownerUserId: auth.currentUser.uid,
        customerId: data.customerId,
        type: "credit",
        amount: data.amount,
        description: data.description || "Credit added",
        transactionDate: new Date().toISOString(), // Use current exact real time for transactions ledger
        balanceAfterTransaction: newOwed,
        createdAt: serverTimestamp()
      });

      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "credit_entries");
      alert("Could not save credit. Please try again.");
    }
  };

  // RECORD PAYMENT
  const handleRecordPayment = async (data: { customerId: string; amount: number; date: string; note: string }) => {
    if (!currentAccount || !auth.currentUser) return;
    try {
      const targetCust = customers.find(c => c.id === data.customerId);
      if (!targetCust || data.amount > targetCust.owed) {
        alert("Payment amount bigger than balance");
        return;
      }

      const batch = writeBatch(db);
      
      const pId = "pmmt_" + Date.now();
      const pmRef = doc(db, "payments", pId);
      batch.set(pmRef, {
        id: pId,
        shopId: currentAccount.id,
        ownerUserId: auth.currentUser.uid,
        customerId: data.customerId,
        amount: data.amount,
        note: data.note || "Payment received",
        paymentDate: new Date().toISOString(),
        createdAt: serverTimestamp()
      });

      const txId = "tx_" + Date.now();
      const newOwed = targetCust.owed - data.amount;
      const txRef = doc(db, "transactions", txId);
      batch.set(txRef, {
        id: txId,
        shopId: currentAccount.id,
        ownerUserId: auth.currentUser.uid,
        customerId: data.customerId,
        type: "payment",
        amount: data.amount,
        description: data.note || "Payment received",
        transactionDate: new Date().toISOString(),
        balanceAfterTransaction: newOwed,
        createdAt: serverTimestamp()
      });

      // FIFO calculation
      const cCredits = creditEntries
        .filter(ce => ce.customerId === data.customerId && ce.remaining > 0)
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
      let pool = data.amount;
      for (const item of cCredits) {
        if (pool <= 0) break;
        const ceRef = doc(db, "credit_entries", item.id);
        
        let newAmountPaid = 0;
        let newBalance = 0;

        if (pool >= item.remaining) {
          pool -= item.remaining;
          newAmountPaid = item.amount;
          newBalance = 0;
        } else {
          newBalance = item.remaining - pool;
          newAmountPaid = item.amount - newBalance;
          pool = 0;
        }

        let newStatus = "unpaid";
        if (newBalance === 0) newStatus = "paid";
        else if (newBalance < item.amount) newStatus = "partially_paid";

        batch.update(ceRef, {
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();

    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "payments");
      alert("Could not save payment. Please try again.");
    }
  };

  // CUSTOMER PORTAL & ACCESS REQUEST ACTIONS
  const handleJoinRequestSubmit = async (fullName: string, phone: string, email: string, pin: string): Promise<string | null> => {
    try {
      if (!scannedShop) {
        return "No scanned shop was resolved. Please scan a QR code first.";
      }

      // 1. Create client auth user
      const userCred = await createUserWithEmailAndPassword(auth, email, pin);
      const user = userCred.user;

      const batch = writeBatch(db);

      // 2. Write to users collection
      const userRef = doc(db, "users", user.uid);
      batch.set(userRef, {
        id: user.uid,
        email: email,
        phoneNumber: phone,
        displayName: fullName,
        role: "customer",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 3. Write to customer_access_requests collection
      const reqId = `${user.uid}_${scannedShop.id}`;
      const reqDocRef = doc(db, "customer_access_requests", reqId);
      batch.set(reqDocRef, {
        id: reqId,
        shopId: scannedShop.id,
        shopOwnerUserId: scannedShop.ownerUserId,
        customerUserId: user.uid,
        customerName: fullName,
        customerPhoneNumber: phone,
        customerEmail: email,
        status: "pending",
        linkedCustomerId: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await batch.commit();

      setUserRole("customer");
      setLocalStorageItem(KEY_ROLE, OLD_KEY_ROLE, "customer");
      setScannedShopCode(null);
      setCurrentScreen("customerRequestStatus");

      return null;
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/email-already-in-use') {
        return "This email is already registered. Please use 'Log In' instead.";
      }
      return e.message || "Failed to submit request.";
    }
  };

  const handleManualShopCodeSubmit = async (code: string): Promise<string | null> => {
    if (!auth.currentUser) return "User is not authenticated.";
    const user = auth.currentUser;

    try {
      // Find the shop with this code
      const q = query(collection(db, "shops"), where("shopCode", "==", code.trim().toUpperCase()));
      const snap = await getDocs(q);

      if (snap.empty) {
        return "Invalid shop code. Please ask the owner for their code.";
      }

      const sDoc = snap.docs[0];
      const sData = sDoc.data();

      // Retrieve display details of user
      const uDoc = await getDoc(doc(db, "users", user.uid));
      const uData = uDoc.exists() ? uDoc.data() : null;

      const fullName = uData?.displayName || user.email?.split("@")[0] || "Customer";
      const phone = uData?.phoneNumber || "";
      const email = user.email || "";

      // Document reference
      const reqId = `${user.uid}_${sData.id}`;
      const reqDocRef = doc(db, "customer_access_requests", reqId);

      await setDoc(reqDocRef, {
        id: reqId,
        shopId: sData.id,
        shopOwnerUserId: sData.ownerUserId,
        customerUserId: user.uid,
        customerName: fullName,
        customerPhoneNumber: phone,
        customerEmail: email,
        status: "pending",
        linkedCustomerId: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return null;
    } catch (e: any) {
      console.error(e);
      return e.message || "Failed to submit request manually.";
    }
  };

  const handleApproveLinkRequest = async (requestId: string, customerId: string) => {
    try {
      const reqRef = doc(db, "customer_access_requests", requestId);
      const reqSnap = await getDoc(reqRef);
      if (!reqSnap.exists()) return;
      const rData = reqSnap.data();

      const batch = writeBatch(db);

      // Update access request status to approved
      batch.update(reqRef, {
        status: "approved",
        linkedCustomerId: customerId,
        updatedAt: serverTimestamp()
      });

      // Update customers collection with linked role user ID
      const custRef = doc(db, "customers", customerId);
      batch.update(custRef, {
        linkedCustomerUserId: rData.customerUserId,
        updatedAt: serverTimestamp()
      });

      await batch.commit();
      alert("Successfully linked customer and approved access.");
    } catch (e: any) {
      console.error("Failed to approve and link request", e);
      alert("Could not update approval: " + (e.message || 'Unknown error'));
    }
  };

  const handleApproveCreateRequest = async (requestId: string) => {
    try {
      if (!currentAccount || !auth.currentUser) return;
      const reqRef = doc(db, "customer_access_requests", requestId);
      const reqSnap = await getDoc(reqRef);
      if (!reqSnap.exists()) return;
      const rData = reqSnap.data();

      const batch = writeBatch(db);

      // Create a brand new customer record
      const newCustId = "cust_" + Date.now();
      
      // Generate clean reference number e.g. CT-THABO-4928
      const rawName = (rData.customerName || "CUST").toUpperCase().replace(/[^A-Z]/g, "").substring(0, 6);
      const suffix = Math.floor(1000 + Math.random() * 9000);
      const refNumber = `CT-${rawName}-${suffix}`;

      const custRef = doc(db, "customers", newCustId);
      batch.set(custRef, {
        id: newCustId,
        shopId: currentAccount.id,
        ownerUserId: auth.currentUser.uid,
        name: rData.customerName,
        phoneNumber: rData.customerPhoneNumber,
        areaOrAddress: "Scanned QR Access",
        creditLimit: currentAccount.defaultLimit || 500,
        customerReferenceNumber: refNumber,
        creditStatus: "active",
        linkedCustomerUserId: rData.customerUserId,
        notes: "Auto-created on customer signup request",
        currentDebt: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update access request status to approved
      batch.update(reqRef, {
        status: "approved",
        linkedCustomerId: newCustId,
        updatedAt: serverTimestamp()
      });

      await batch.commit();
      alert("Successfully created new customer and approved access.");
    } catch (e: any) {
      console.error("Failed to create customer and approve request", e);
      alert("Failed to register customer automatically: " + (e.message || 'Unknown error'));
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await setDoc(doc(db, "customer_access_requests", requestId), {
        status: "rejected",
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunRepairTool = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const email = auth.currentUser.email;

    try {
      let shopsQuery = query(collection(db, "shops"), where("ownerUserId", "==", uid));
      let shopsSnap = await getDocs(shopsQuery);
      let shops = shopsSnap.docs.map(d => ({id: d.id, ...d.data() as any}));

      if (shops.length === 0 && email) {
         const emailQuery = query(collection(db, "shops"), where("ownerEmail", "==", email));
         const emailSnap = await getDocs(emailQuery);
         shops = emailSnap.docs.map(d => ({id: d.id, ...d.data() as any}));
      }

      if (shops.length <= 1) {
         alert("No duplicate shop profiles found for this account.");
         await loadUserProfile(uid);
         return;
      }

      const confirmed = window.confirm(`Found ${shops.length} shop profiles linked to you. Do you want to scan for empty ones and safely link your account to the profile with real data?`);
      if (!confirmed) return;

      let keepShop = null;
      let maxData = -1;

      for (const s of shops) {
        const cSnap = await getDocs(query(collection(db, "customers"), where("shopId", "==", s.id)));
        const sSnap = await getDocs(query(collection(db, "sales"), where("shopId", "==", s.id)));
        const totalRecords = cSnap.size + sSnap.size;
        
        if (totalRecords > maxData) {
          maxData = totalRecords;
          keepShop = s;
        }
      }

      if (keepShop) {
        const userDocRef = doc(db, "users", uid);
        await setDoc(userDocRef, { shopId: keepShop.id, role: "shop_owner" }, { merge: true });
        
        if (keepShop.ownerUserId !== uid) {
          await setDoc(doc(db, "shops", keepShop.id), { ownerUserId: uid }, { merge: true });
        }
        
        alert(`Successfully repaired account link to shop. Found ${maxData} original records.`);
      }

      await loadUserProfile(uid);
    } catch (e: any) {
      console.error(e);
      alert("Error running repair tool: " + e.message);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="bg-[#3B1A1A] min-h-screen flex justify-center items-center w-full">
        <div className="w-full max-w-[480px] bg-background text-on-background min-h-[100dvh] md:min-h-[850px] md:h-[850px] md:border md:border-outline-variant md:rounded-3xl overflow-hidden relative flex flex-col justify-center items-center shadow-sm">
           <p className="text-[#3B1A1A] font-display font-black tracking-widest uppercase animate-pulse">Loading App...</p>
        </div>
      </div>
    );
  }

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || null;

  const isDesktopOwner = userRole === "shop_owner" && currentScreen !== "welcome";

  return (
    <div className={`bg-[#3B1A1A] min-h-screen flex justify-center items-center w-full ${isDesktopOwner ? "md:items-start" : ""}`}>
      <div 
        className={
          isDesktopOwner
            ? "w-full bg-background text-on-background min-h-[100svh] flex flex-row overflow-hidden relative shadow-sm"
            : "w-full max-w-[480px] bg-background text-on-background min-h-[100svh] md:min-h-[850px] md:h-[850px] md:overflow-hidden md:border md:border-outline-variant md:rounded-3xl relative flex flex-col shadow-sm"
        }
      >
        {isDesktopOwner && (
          <DesktopSidebar 
            currentScreen={currentScreen} 
            onNavigate={navigateTo} 
            onLogout={handleLogout} 
            shopName={currentAccount?.shopName || "Shop"} 
          />
        )}
        <div className={`flex-1 w-full overflow-x-hidden md:overflow-y-auto relative no-scrollbar ${!isDesktopOwner || (currentScreen !== "welcome" && currentScreen !== "customerProfile" && currentScreen !== "addCredit" && currentScreen !== "newCustomer" && currentScreen !== "customerDashboard" && currentScreen !== "customerJoin" && currentScreen !== "customerRequestStatus" && currentScreen !== "shopQrCode" && currentScreen !== "customerAccessRequests") ? (isDesktopOwner ? "md:pb-0 pb-[calc(7rem+env(safe-area-inset-bottom))]" : "pb-[calc(7rem+env(safe-area-inset-bottom))]") : "" }`}>
          {currentScreen === "welcome" && (
            <WelcomeScreen 
              onLogin={handleLogin} 
              onSignup={handleSignup}
              onCustomerLogin={handleCustomerLogin}
              onCustomerSignup={handleCustomerSignup}
              onPasswordReset={handlePasswordReset}
              onGoogleAuth={handleGoogleAuth}
              onShopScanned={(shopCode) => {
                setScannedShopCode(shopCode);
                // Also optimistically navigate to customerJoin or let the useEffect handle it
                // As seen in App.tsx line 254-280, setting scannedShopCode triggers onSnapshot query which changes currentScreen on load
                setCurrentScreen("customerJoin");
              }}
            />
          )}
          {currentScreen === "customerJoin" && (
            <CustomerJoinScreen
              shopName={scannedShop?.shopName || "Spaza Tap Shop"}
              shopId={scannedShop?.id || ""}
              onJoinRequest={handleJoinRequestSubmit}
              onBackToWelcome={() => {
                setScannedShopCode(null);
                setScannedShop(null);
                navigateTo("welcome");
              }}
            />
          )}
          {currentScreen === "customerRequestStatus" && (
            <CustomerRequestStatusScreen
              requests={customerAccessRequests}
              onLogout={handleLogout}
              onManualCodeSubmit={handleManualShopCodeSubmit}
            />
          )}
          {currentScreen === "shopQrCode" && (
            <ShopQrCodeScreen
              shopName={currentAccount?.shopName || "Spaza Tap Shop"}
              shopCode={currentAccount?.shopCode || ""}
              joinLink={currentAccount?.joinLink || ""}
              onBack={() => navigateTo("settings")}
            />
          )}
          {currentScreen === "customerAccessRequests" && (
            <CustomerAccessRequestsScreen
              requests={customerAccessRequests}
              customers={customers}
              onBack={() => navigateTo("settings")}
              onNavigate={navigateTo}
              onApproveLink={handleApproveLinkRequest}
              onApproveCreate={handleApproveCreateRequest}
              onReject={handleRejectRequest}
            />
          )}
          {currentScreen === "customerDashboard" && (
            <CustomerDashboardScreen
              customer={customers[0] || null}
              transactions={transactions}
              creditEntries={creditEntries}
              shopDetails={shopDetails}
              shopId={currentAccount?.id}
              onLogout={handleLogout}
            />
          )}
          {currentScreen === "dashboard" && (
            <DashboardScreen
              onNavigate={navigateTo}
              onViewCustomer={viewCustomer}
              customers={customers}
              transactions={transactions}
              pendingRequestsCount={customerAccessRequests.filter(r => r.status === "pending").length}
              shopName={currentAccount?.shopName}
              shopId={currentAccount?.id}
            />
          )}
          {currentScreen === "customers" && (
            <CustomersScreen
              onNavigate={navigateTo}
              onViewCustomer={viewCustomer}
              customers={customers}
            />
          )}
          {currentScreen === "customerProfile" && selectedCustomer && (
            <CustomerProfileScreen
              customer={selectedCustomer}
              transactions={transactions}
              onBack={() => navigateTo("customers")}
              onNavigate={navigateTo}
              onRecordPayment={handleRecordPayment}
              onUpdateCustomer={handleUpdateCustomer}
              whatsappTemplate={currentAccount?.whatsappTemplate || ""}
              shopName={currentAccount?.shopName || "Spaza Tap Shop"}
            />
          )}
          {currentScreen === "addCredit" && (
            <AddCreditScreen
              onBack={() => {
                if (selectedCustomerId) {
                  navigateTo("customerProfile");
                } else {
                  navigateTo("dashboard");
                }
              }}
              onNavigate={navigateTo}
              customers={customers}
              onAddCredit={handleAddCredit}
              selectedCustomerId={selectedCustomerId || undefined}
            />
          )}
          {currentScreen === "newCustomer" && (
            <NewCustomerScreen
              onBack={(newCustomerId?: string) => {
                if (newCustomerId) {
                  setSelectedCustomerId(newCustomerId);
                  navigateTo("addCredit");
                } else {
                  navigateTo("customers");
                }
              }}
              onNavigate={navigateTo}
              onAddCustomer={handleAddCustomer}
              defaultLimit={currentAccount?.defaultLimit || 500}
            />
          )}
          {currentScreen === "reports" && currentAccount && auth.currentUser && (
            <ReportsScreen
              shopId={currentAccount.id}
              ownerUserId={auth.currentUser.uid}
              customers={customers}
              transactions={transactions}
              onNavigate={navigateTo}
              onViewCustomer={viewCustomer}
            />
          )}
          {currentScreen === "settings" && currentAccount && (
            <SettingsScreen
              shopName={currentAccount.shopName}
              ownerName={currentAccount.ownerName}
              phone={currentAccount.phone}
              defaultLimit={currentAccount.defaultLimit}
              whatsappTemplate={currentAccount.whatsappTemplate}
              onSaveSettings={handleUpdateSettings}
              onLogout={handleLogout}
              pendingRequestsCount={customerAccessRequests.filter(r => r.status === "pending").length}
              onNavigateToQr={() => navigateTo("shopQrCode")}
              onNavigateToRequests={() => navigateTo("customerAccessRequests")}
              onNavigateToScreen={(s) => navigateTo(s)}
              authEmail={auth.currentUser?.email}
              authUid={auth.currentUser?.uid}
              authProvider={auth.currentUser?.providerData[0]?.providerId || "Email"}
              shopId={currentAccount.id}
              userRole={userRole}
              lastLoginAt={auth.currentUser?.metadata?.lastSignInTime}
              onRunRepairTool={handleRunRepairTool}
            />
          )}
          {currentScreen === "till" && currentAccount && auth.currentUser && (
            <TillScreen 
              shopId={currentAccount.id} 
              ownerUserId={auth.currentUser.uid} 
              customers={customers} 
            />
          )}
          {currentScreen === "sales" && currentAccount && auth.currentUser && (
            <SalesScreen shopId={currentAccount.id} ownerUserId={auth.currentUser.uid} />
          )}
          {currentScreen === "stock" && currentAccount && auth.currentUser && (
            <StockScreen 
              shopId={currentAccount.id} 
              ownerUserId={auth.currentUser.uid} 
            />
          )}
          {currentScreen === "expenses" && currentAccount && auth.currentUser && (
            <ExpensesScreen shopId={currentAccount.id} ownerUserId={auth.currentUser.uid} />
          )}
          {currentScreen === "suppliers" && currentAccount && auth.currentUser && (
            <SuppliersScreen shopId={currentAccount.id} ownerUserId={auth.currentUser.uid} />
          )}
          {currentScreen === "purchases" && currentAccount && auth.currentUser && (
            <PurchasesScreen shopId={currentAccount.id} ownerUserId={auth.currentUser.uid} />
          )}
          {currentScreen === "cash_ups" && currentAccount && auth.currentUser && (
            <CashUpScreen shopId={currentAccount.id} ownerUserId={auth.currentUser.uid} />
          )}
          {currentScreen === "hub" && currentAccount && auth.currentUser && userRole === "shop_owner" && (
            <HubScreen 
              onNavigate={(s) => navigateTo(s)} 
              shopId={currentAccount.id} 
              ownerUserId={auth.currentUser.uid} 
              account={currentAccount} 
            />
          )}
          {currentScreen === "priceWatch" && currentAccount && auth.currentUser && userRole === "shop_owner" && (
            <WholesalePriceWatchScreen
              onBack={() => navigateTo("dashboard")}
              shopId={currentAccount.id}
              ownerUserId={auth.currentUser.uid}
            />
          )}
          {currentScreen === "promos" && currentAccount && auth.currentUser && userRole === "shop_owner" && (
            <PromosScreen
              onBack={() => navigateTo("dashboard")}
              customers={customers}
              onNavigate={navigateTo}
              shopId={currentAccount.id}
              ownerUserId={auth.currentUser.uid}
            />
          )}
          {currentScreen === "officialProfile" && currentAccount && auth.currentUser && userRole === "shop_owner" && (
            <OfficialProfileScreen 
              onBack={() => navigateTo("hub")} 
              shopId={currentAccount.id} 
              account={currentAccount} 
            />
          )}

          {currentScreen === "emergency" && currentAccount && auth.currentUser && (
            <EmergencyScreen onBack={() => navigateTo("hub")} shopId={currentAccount.id} ownerUserId={auth.currentUser.uid} account={currentAccount} />
          )}
          {currentScreen === "municipality" && currentAccount && auth.currentUser && (
            <MunicipalityScreen onBack={() => navigateTo("hub")} shopId={currentAccount.id} ownerUserId={auth.currentUser.uid} account={currentAccount} />
          )}
          {currentScreen === "govSupport" && currentAccount && auth.currentUser && (
            <GovSupportScreen onBack={() => navigateTo("hub")} shopId={currentAccount.id} ownerUserId={auth.currentUser.uid} account={currentAccount} />
          )}
          {currentScreen === "compliance" && currentAccount && auth.currentUser && (
            <ComplianceScreen onBack={() => navigateTo("hub")} shopId={currentAccount.id} ownerUserId={auth.currentUser.uid} account={currentAccount} />
          )}
          {currentScreen === "tax" && currentAccount && auth.currentUser && (
            <TaxScreen onBack={() => navigateTo("hub")} shopId={currentAccount.id} ownerUserId={auth.currentUser.uid} account={currentAccount} />
          )}
          {currentScreen === "businessReg" && currentAccount && auth.currentUser && (
            <BusinessRegScreen onBack={() => navigateTo("hub")} shopId={currentAccount.id} ownerUserId={auth.currentUser.uid} account={currentAccount} />
          )}
          {currentScreen === "documents" && currentAccount && auth.currentUser && (
            <DocumentsScreen onBack={() => navigateTo("hub")} shopId={currentAccount.id} ownerUserId={auth.currentUser.uid} account={currentAccount} />
          )}
          {currentScreen === "reminders" && currentAccount && auth.currentUser && (
            <RemindersScreen onBack={() => navigateTo("hub")} shopId={currentAccount.id} ownerUserId={auth.currentUser.uid} account={currentAccount} />
          )}
          {currentScreen === "incidents" && currentAccount && auth.currentUser && (
            <IncidentsScreen onBack={() => navigateTo("hub")} shopId={currentAccount.id} ownerUserId={auth.currentUser.uid} account={currentAccount} />
          )}
          {currentScreen === "foodSafety" && currentAccount && auth.currentUser && (
            <FoodSafetyScreen onBack={() => navigateTo("hub")} shopId={currentAccount.id} ownerUserId={auth.currentUser.uid} account={currentAccount} />
          )}
          {currentScreen === "funding" && currentAccount && auth.currentUser && (
            <FundingScreen onBack={() => navigateTo("hub")} shopId={currentAccount.id} ownerUserId={auth.currentUser.uid} account={currentAccount} />
          )}
          {currentScreen === "helpAppChecklist" && currentAccount && auth.currentUser && (
            <HelpAppChecklistScreen onBack={() => navigateTo("hub")} shopId={currentAccount.id} ownerUserId={auth.currentUser.uid} account={currentAccount} />
          )}
          {currentScreen === "alerts" && currentAccount && auth.currentUser && (
            <AlertsScreen onBack={() => navigateTo("hub")} shopId={currentAccount.id} ownerUserId={auth.currentUser.uid} account={currentAccount} />
          )}
          {currentScreen === "platform_analytics" && (
            <PlatformAnalyticsScreen
              onBack={() => navigateTo("settings")}
              currentUserEmail={auth.currentUser?.email}
            />
          )}

        </div>

        {currentScreen !== "welcome" &&
          currentScreen !== "promos" &&
          currentScreen !== "customerProfile" &&
          currentScreen !== "addCredit" &&
          currentScreen !== "newCustomer" &&
          currentScreen !== "customerDashboard" &&
          currentScreen !== "customerJoin" &&
          currentScreen !== "customerRequestStatus" &&
          currentScreen !== "shopQrCode" &&
          currentScreen !== "customerAccessRequests" &&
          currentScreen !== "officialProfile" &&
          currentScreen !== "hub" &&
          currentScreen !== "emergency" &&
          currentScreen !== "municipality" &&
          currentScreen !== "govSupport" &&
          currentScreen !== "compliance" &&
          currentScreen !== "tax" &&
          currentScreen !== "businessReg" &&
          currentScreen !== "documents" &&
          currentScreen !== "reminders" &&
          currentScreen !== "incidents" &&
          currentScreen !== "foodSafety" &&
          currentScreen !== "funding" &&
          currentScreen !== "helpAppChecklist" &&
          currentScreen !== "alerts" &&
          currentScreen !== "platform_analytics" && (
            <div className={`absolute bottom-0 w-full z-40 ${isDesktopOwner ? "md:hidden" : ""}`}>
              <BottomNav
                currentScreen={currentScreen}
                onNavigate={navigateTo}
              />
            </div>
          )}
          
        <InstallBanner />
      </div>
    </div>
  );
}
