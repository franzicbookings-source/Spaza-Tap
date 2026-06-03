import React, { useEffect, useState } from "react";
import { ScreenState, Account } from "../types";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { 
  ShieldAlert, Landmark, Briefcase, FileCheck, FileText, FileBadge, 
  FolderLock, CalendarClock, AlertTriangle, Utensils, Percent, 
  ListChecks, BellRing, Settings, ChevronRight
} from "lucide-react";

interface HubScreenProps {
  onNavigate: (screen: ScreenState) => void;
  shopId: string;
  ownerUserId: string;
  account: Account;
}

export default function HubScreen({ onNavigate, shopId, ownerUserId, account }: HubScreenProps) {
  const [openIncidents, setOpenIncidents] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [foodSafetyDone, setFoodSafetyDone] = useState(false);

  useEffect(() => {
    // Quick load counts
    const loadBadges = async () => {
      // open incidents
      const incQ = query(collection(db, "incident_reports"), where("shopId", "==", shopId), where("ownerUserId", "==", ownerUserId), where("status", "==", "Open"));
      const incSnap = await getDocs(incQ);
      setOpenIncidents(incSnap.docs.length);

      // alerts
      const altQ = query(collection(db, "important_alerts"), where("shopId", "==", shopId), where("ownerUserId", "==", ownerUserId));
      let count = 0;
      const altSnap = await getDocs(altQ);
      altSnap.forEach(doc => {
        if (doc.data().status === "New" || doc.data().status === "Action Needed") {
          count++;
        }
      });
      setActiveAlerts(count);

      // food safety today
      const todayStr = new Date().toISOString().split('T')[0];
      const fQ = query(collection(db, "food_safety_checks"), where("shopId", "==", shopId), where("ownerUserId", "==", ownerUserId));
      let done = false;
      const fSnap = await getDocs(fQ);
      fSnap.forEach(doc => {
        if (doc.data().checkDate.startsWith(todayStr) && doc.data().status === "Completed") {
          done = true;
        }
      });
      setFoodSafetyDone(done);
    };

    if (shopId) {
      loadBadges();
    }
  }, [shopId]);


  const menuItems = [
    { id: "emergency", title: "Emergency Numbers", icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50", to: "emergency" },
    { id: "municipality", title: "Local Municipality Help", icon: Landmark, color: "text-blue-600", bg: "bg-blue-50", to: "municipality" },
    { id: "govSupport", title: "Government Support", icon: Briefcase, color: "text-amber-600", bg: "bg-amber-50", to: "govSupport" },
    { id: "compliance", title: "Compliance Checklist", icon: FileCheck, color: "text-green-600", bg: "bg-green-50", to: "compliance" },
    { id: "tax", title: "Tax & SARS Help", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50", to: "tax" },
    { id: "businessReg", title: "Business Registration", icon: FileBadge, color: "text-indigo-600", bg: "bg-indigo-50", to: "businessReg" },
    { id: "documents", title: "Shop Documents", icon: FolderLock, color: "text-slate-600", bg: "bg-slate-100", to: "documents" },
    { id: "reminders", title: "Permit & Reminders", icon: CalendarClock, color: "text-purple-600", bg: "bg-purple-50", to: "reminders" },
    { id: "incidents", title: "Incident Reports", icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50", to: "incidents", badge: openIncidents > 0 ? `${openIncidents} Open` : "" },
    { id: "foodSafety", title: "Food Safety", icon: Utensils, color: "text-teal-600", bg: "bg-teal-50", to: "foodSafety", badge: foodSafetyDone ? "Done" : "Pending" },
    { id: "funding", title: "Funding Readiness", icon: Percent, color: "text-pink-600", bg: "bg-pink-50", to: "funding" },
    { id: "helpAppChecklist", title: "Apply for Help Checklist", icon: ListChecks, color: "text-cyan-600", bg: "bg-cyan-50", to: "helpAppChecklist" },
    { id: "alerts", title: "Important Alerts", icon: BellRing, color: "text-amber-500", bg: "bg-amber-100", to: "alerts", badge: activeAlerts > 0 ? `${activeAlerts} Active` : "" },
    { id: "shopProfile", title: "Official Shop Profile", icon: Settings, color: "text-[#3B1A1A]", bg: "bg-[#E8D0BB]", to: "officialProfile" } 
  ];

  return (
    <div className="flex flex-col min-h-full bg-[#F5EDE0] font-sans pb-24 md:pb-6 relative">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm shrink-0 flex justify-between items-start relative">
        <div className="pr-4">
          <h1 className="text-xl md:text-2xl font-black font-display text-[#3B1A1A] uppercase tracking-tighter">Help & Compliance Hub</h1>
          <p className="text-xs font-bold text-[#C8521A] mt-1">Northern KZN Support Centre</p>
        </div>
        <button onClick={() => onNavigate("settings")} className="p-2 bg-gray-100 rounded-full active:scale-95 shrink-0">
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
      </header>

      <div className="p-4 md:px-6 md:py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 overflow-y-auto">
        {menuItems.map((item) => (
          <div 
            key={item.id}
            onClick={() => onNavigate(item.to as ScreenState)}
            className="w-full bg-white border border-[#E8D0BB] p-4 rounded-2xl flex items-center justify-between shadow-xs active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.bg}`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <div className="flex flex-col truncate pr-2">
                <span className="text-sm font-bold text-[#3B1A1A] truncate">{item.title}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {item.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${item.badge === 'Pending' ? 'bg-orange-100 text-orange-700' : item.badge === 'Done' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {item.badge}
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
