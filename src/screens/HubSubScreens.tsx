import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, Plus, Phone, AlertTriangle, FileText, CheckCircle, Clock, 
  Calendar, Check, Trash2, ShieldCheck, HeartPulse, Building, Landmark, Briefcase, 
  Percent, FileBadge, FolderLock, ListChecks, BellRing, User, Search, HelpCircle,
  PlusCircle, RefreshCw
} from "lucide-react";
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp, deleteDoc, addDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { ScreenState, Account, EmergencyContact, MunicipalityContact } from "../types";

export function EmergencyScreen({ onBack, shopId, ownerUserId, account }: { onBack: () => void, shopId: string, ownerUserId: string, account: Account }) {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  
  const [form, setForm] = useState({ serviceName: "", phoneNumber: "", area: "", notes: "" });

  const DEFAULT_CONTACTS = [
    { serviceName: "Police", phoneNumber: "10111", area: "National", isDefault: true },
    { serviceName: "Ambulance", phoneNumber: "10177", area: "National", isDefault: true },
    { serviceName: "Cellphone Emergency", phoneNumber: "112", area: "National", isDefault: true },
    { serviceName: "Crime Stop", phoneNumber: "0860 010 111", area: "National", isDefault: true },
  ];

  const NEWCASTLE_CONTACTS = [
    { serviceName: "Municipal Offices", phoneNumber: "034 328 7600", area: "Newcastle", isDefault: true },
    { serviceName: "Fire Brigade", phoneNumber: "034 328 4700", area: "Newcastle", isDefault: true },
    { serviceName: "Traffic", phoneNumber: "034 328 4700", area: "Newcastle", isDefault: true },
    { serviceName: "Protection Services", phoneNumber: "079 542 8228", area: "Newcastle", isDefault: true },
    { serviceName: "Hospital", phoneNumber: "034 328 0000", area: "Newcastle", isDefault: true },
    { serviceName: "Mediclinic Newcastle", phoneNumber: "034 317 0000", area: "Newcastle", isDefault: true },
  ];

  useEffect(() => {
    if (!shopId) return;
    const q = query(collection(db, "emergency_contacts"), where("shopId", "==", shopId));
    const unsub = onSnapshot(q, (snap) => {
      const arr: EmergencyContact[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() } as EmergencyContact));
      setContacts(arr);
    });
    return () => unsub();
  }, [shopId]);

  let displayContacts = [...DEFAULT_CONTACTS];
  if (account.town?.toLowerCase().includes("newcastle")) {
    displayContacts = [...displayContacts, ...NEWCASTLE_CONTACTS];
  }
  
  // Mix in custom contacts
  const customContacts = contacts.filter(c => !c.isDefault);

  const saveContact = async () => {
    if (!form.serviceName || !form.phoneNumber) return;
    const cid = `em_${Date.now()}`;
    await setDoc(doc(db, "emergency_contacts", cid), {
      id: cid, shopId, ownerUserId,
      serviceName: form.serviceName, phoneNumber: form.phoneNumber, area: form.area,
      category: "custom", notes: form.notes, isDefault: false,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    });
    setForm({ serviceName: "", phoneNumber: "", area: "", notes: "" });
    setShowAdd(false);
  };

  return (
    <div className="min-h-screen bg-[#F5EDE0] font-sans pb-24 md:pb-6 relative overflow-y-auto w-full max-w-[480px] md:max-w-xl mx-auto shadow-xl">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm shrink-0 flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-gray-100 rounded-full active:scale-95"><ChevronLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-black font-display text-[#3B1A1A] uppercase tracking-tighter">Emergency</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-red-600 text-white p-2.5 rounded-full shadow-md active:scale-95">
          <Plus className="w-4 h-4" />
        </button>
      </header>

      <div className="p-6 space-y-4">
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3 text-red-800 text-xs font-bold shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
          <p>Use emergency numbers only for real emergencies. Contact numbers may change, so please confirm and update local numbers when needed.</p>
        </div>

        {customContacts.length === 0 && account.town?.toLowerCase() !== "newcastle" && (
          <div className="bg-white p-4 border border-dashed border-[#E8D0BB] rounded-xl text-center">
            <p className="text-xs font-bold text-gray-500">No custom emergency contacts yet. Add your local contacts for faster access.</p>
          </div>
        )}

        {[...displayContacts, ...customContacts].map((c, i) => (
          <div key={`em_${i}`} className="bg-white border text-left border-[#E8D0BB] p-4 rounded-xl flex items-center justify-between shadow-xs">
            <div>
              <p className="text-sm font-black text-[#3B1A1A]">{c.serviceName}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">{c.area || "Local"}</p>
              {c.notes && <p className="text-[10px] text-gray-500 mt-1">{c.notes}</p>}
            </div>
            <a href={`tel:${c.phoneNumber}`} className="bg-green-100 text-green-700 font-bold px-4 py-2 rounded-full text-xs flex items-center gap-2 active:scale-95">
              <Phone className="w-3.5 h-3.5" /> Call {c.phoneNumber}
            </a>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <div className="bg-white p-6 rounded-t-3xl max-h-[80vh] overflow-y-auto">
            <h2 className="font-display font-black text-lg mb-4">Add Contact</h2>
            <div className="space-y-4 text-xs font-bold">
              <input placeholder="Service Name (e.g. Local Hospital)" value={form.serviceName} onChange={e => setForm({...form, serviceName: e.target.value})} className="w-full border p-3 rounded-xl" />
              <input placeholder="Phone Number" value={form.phoneNumber} onChange={e => setForm({...form, phoneNumber: e.target.value})} className="w-full border p-3 rounded-xl" type="tel" />
              <input placeholder="Area" value={form.area} onChange={e => setForm({...form, area: e.target.value})} className="w-full border p-3 rounded-xl" />
              <input placeholder="Notes (Optional)" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full border p-3 rounded-xl" />
              
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAdd(false)} className="flex-1 bg-gray-100 py-3 rounded-full">Cancel</button>
                <button onClick={saveContact} className="flex-1 bg-red-600 text-white py-3 rounded-full shadow-md">Save Contact</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MunicipalityScreen({ onBack, shopId, ownerUserId, account }: { onBack: () => void, shopId: string, ownerUserId: string, account: Account }) {
  const [mc, setMc] = useState<MunicipalityContact | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    if (!shopId) return;
    const q = query(collection(db, "municipality_contacts"), where("shopId", "==", shopId));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setMc({ id: snap.docs[0].id, ...snap.docs[0].data() } as MunicipalityContact);
      }
    });
    return () => unsub();
  }, [shopId]);

  const localMuni = account.localMunicipality || "Unknown Municipality";
  const distMuni = account.districtMunicipality || "Unknown District";
  
  const generateTemplate = (issueType: string) => {
    const text = `Hi, I would like to report a municipal issue for my shop.\n\nShop name: ${account.shopName || "Cwebezela Spaza"}\nTown: ${account.town || ""}\nAddress: ${account.shopAddress || ""}\nIssue: ${issueType}\nContact number: ${account.phone || ""}\n\nPlease assist.`;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
  };

  return (
    <div className="min-h-screen bg-[#F5EDE0] font-sans pb-24 md:pb-6 relative overflow-y-auto w-full max-w-[480px] md:max-w-xl mx-auto shadow-xl">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm shrink-0 flex items-center gap-3 z-10 sticky top-0">
        <button onClick={onBack} className="p-2 bg-gray-100 rounded-full active:scale-95"><ChevronLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-black font-display text-[#3B1A1A] uppercase tracking-tighter shrink-0">Municipality</h1>
      </header>

      <div className="p-6 space-y-6">
        <div className="bg-white border border-[#E8D0BB] p-6 rounded-2xl shadow-sm">
          <p className="text-[10px] font-bold text-[#C8521A] uppercase tracking-widest">{account.town}</p>
          <h2 className="text-base font-black text-[#3B1A1A] mb-1 leading-none">{localMuni}</h2>
          <p className="text-xs font-bold text-gray-500">{distMuni}</p>
        </div>

        <div>
          <h3 className="text-xs font-display font-black uppercase tracking-widest text-[#3B1A1A] mb-3 pl-1">Quick Report Templates</h3>
          <div className="grid gap-3">
            <button onClick={() => generateTemplate("Water / Pipe Burst")} className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl text-xs font-bold text-left active:scale-95 flex justify-between">
              Report Water Issue
            </button>
            <button onClick={() => generateTemplate("Sewer Blockage")} className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-3 rounded-xl text-xs font-bold text-left active:scale-95 flex justify-between">
              Report Sewer Issue
            </button>
            <button onClick={() => generateTemplate("Electricity Fault")} className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-xl text-xs font-bold text-left active:scale-95 flex justify-between">
              Report Electricity Fault
            </button>
            <button onClick={() => generateTemplate("Refuse not collected")} className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold text-left active:scale-95 flex justify-between">
              Report Refuse Issue
            </button>
            <button onClick={() => generateTemplate("Question about Trading Permit")} className="bg-white border border-gray-200 text-gray-800 p-3 rounded-xl text-xs font-bold text-left active:scale-95 flex justify-between">
              Ask About Trading Permit
            </button>
          </div>
        </div>
      </div>

      {copiedText && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex flex-col justify-end">
          <div className="bg-white p-6 rounded-t-3xl max-h-[85vh] flex flex-col w-full max-w-[480px] md:max-w-xl mx-auto shadow-2xl">
            <h2 className="font-display font-black text-lg mb-1 text-[#3B1A1A]">TEMPLATE COPIED!</h2>
            <p className="text-xs font-bold text-[#C8521A] mb-4 uppercase tracking-wider">Ready to paste on WhatsApp or SMS</p>
            
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-left text-xs font-medium font-mono text-slate-800 whitespace-pre-wrap overflow-y-auto max-h-[40vh] mb-5 no-scrollbar">
              {copiedText}
            </div>
            
            <p className="text-[10px] uppercase font-bold text-gray-400 text-center mb-4">Paste this template directly in your messaging app to send your report.</p>
            
            <button 
              onClick={() => setCopiedText(null)} 
              className="w-full bg-[#3B1A1A] text-white py-3.5 rounded-xl font-black uppercase tracking-wider text-xs shadow-md active:scale-95"
            >
              Got It, Sharp!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



// ==========================================
// 1. GOVERNMENT SUPPORT TRACKER
// ==========================================
export function GovSupportScreen({ onBack, shopId, ownerUserId, account }: { onBack: () => void, shopId: string, ownerUserId: string, account: Account }) {
  const [appStatuses, setAppStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const programs = [
    {
      id: "dsbd_spaza",
      title: "DSBD Spaza Support Program",
      department: "Dept of Small Business Development",
      description: "Provides R15,000 credit grant to buy wholesale stock, plus assistance with banking and point-of-sale setups.",
      requirements: "SA Owner, Business Permit, CIPC Registration"
    },
    {
      id: "sefa_traders",
      title: "SEFA Informal Traders Grant",
      department: "Small Enterprise Finance Agency",
      description: "Once-off R10,000 grant and financial mentorship program for urban and rural retail spazas.",
      requirements: "SARS Tax Pin, Trading Permit, Active Bank Account"
    },
    {
      id: "amajuba_uplift",
      title: "Amajuba Spaza Upliftment Fund",
      department: "Amajuba District Municipality",
      description: "Local Municipality support program offering security equipment funding & shelf layout optimization loans.",
      requirements: "Newcastle Municipal Area, Compliant Zoning"
    }
  ];

  useEffect(() => {
    if (!shopId) return;
    const q = query(collection(db, "gov_support_applications"), where("shopId", "==", shopId));
    const unsub = onSnapshot(q, (snap) => {
      const records: Record<string, string> = {};
      snap.forEach(d => {
        const data = d.data();
        records[data.programId] = data.status || "Not Applied";
      });
      setAppStatuses(records);
      setLoading(false);
    });
    return () => unsub();
  }, [shopId]);

  const updateStatus = async (programId: string, current: string) => {
    let nextStatus = "Not Applied";
    if (current === "Not Applied") nextStatus = "Applied / Pending";
    else if (current === "Applied / Pending") nextStatus = "Approved";
    else if (current === "Approved") nextStatus = "Declined";
    else nextStatus = "Not Applied";

    const docId = `gov_app_${shopId}_${programId}`;
    try {
      await setDoc(doc(db, "gov_support_applications", docId), {
        id: docId,
        shopId,
        ownerUserId,
        programId,
        status: nextStatus,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
      alert("Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EDE0] text-[#3B1A1A] font-sans pb-24 md:pb-6 relative overflow-y-auto w-full max-w-[480px] md:max-w-xl mx-auto shadow-xl">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm shrink-0 flex items-center gap-3 z-10 sticky top-0">
        <button onClick={onBack} className="p-2 bg-gray-100 rounded-full active:scale-95"><ChevronLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-black font-display uppercase tracking-tighter shrink-0">Gov Support</h1>
      </header>
      
      <div className="p-6 space-y-4">
        <div className="bg-[#E8D0BB]/30 p-4 rounded-2xl border border-[#E8D0BB]">
          <h2 className="text-sm font-bold mb-1">Assistance Programs Tracker</h2>
          <p className="text-xs text-gray-500">Track and update the live status of your government loan and grant schemes safely.</p>
        </div>

        {loading ? (
          <div className="text-center py-10 font-bold text-xs">Loading programs...</div>
        ) : (
          programs.map(prog => {
            const status = appStatuses[prog.id] || "Not Applied";
            return (
              <div key={prog.id} className="bg-white p-5 rounded-2xl border border-[#E5DACB] shadow-sm flex flex-col gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#C8521A] bg-[#C8521A]/10 px-2.5 py-1 rounded-full">{prog.department}</span>
                  <h3 className="text-base font-black mt-2">{prog.title}</h3>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{prog.description}</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                  <span className="font-bold">Requirements: </span><span className="text-slate-600">{prog.requirements}</span>
                </div>

                <div className="flex items-center justify-between border-t border-dashed pt-3 mt-1">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-400 font-bold uppercase">Application Status</span>
                    <span className={`text-xs font-black uppercase ${
                      status.includes('Approved') ? 'text-emerald-600' :
                      status.includes('Pending') ? 'text-blue-600' :
                      status.includes('Declined') ? 'text-red-600' : 'text-gray-500'
                    }`}>{status}</span>
                  </div>
                  <button 
                    onClick={() => updateStatus(prog.id, status)}
                    className="bg-[#3B1A1A] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider active:scale-95"
                  >
                    Change Status
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==========================================
// 2. COMPLIANCE CHECKLIST SCREEN
// ==========================================
export function ComplianceScreen({ onBack, shopId, ownerUserId, account }: { onBack: () => void, shopId: string, ownerUserId: string, account: Account }) {
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const criteria = [
    { id: "permit", title: "Newcastle Municipal Trading Permit", desc: "Official written consent to operate a spaza micro retail store from local council." },
    { id: "sars", title: "SARS Income Tax Number", desc: "Registered taxpayer status (Sole proprietor or private Co)." },
    { id: "health", title: "Zoning / Land Use Approval", desc: "Consent from Newcastle city planning confirming zoning validity for spaza." },
    { id: "id_doc", title: "Owner Identification Check", desc: "Certified South African ID copy or valid passport and foreign trading permission." },
    { id: "hygiene", title: "Certificate of Acceptability", desc: "Environmental safety check verifying food cleanliness & safety limits." }
  ];

  useEffect(() => {
    if (!shopId) return;
    const unsub = onSnapshot(doc(db, "compliance_checks", shopId), (snap) => {
      if (snap.exists()) {
        setCompletedItems(snap.data().items || {});
      }
      setLoading(false);
    });
    return () => unsub();
  }, [shopId]);

  const toggleItem = async (itemId: string) => {
    const nextValue = !completedItems[itemId];
    const updated = { ...completedItems, [itemId]: nextValue };
    setCompletedItems(updated);

    try {
      await setDoc(doc(db, "compliance_checks", shopId), {
        shopId,
        ownerUserId,
        items: updated,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error(e);
      alert("Failed to save check");
    }
  };

  const doneCount = criteria.filter(c => completedItems[c.id]).length;
  const scorePercent = Math.round((doneCount / criteria.length) * 100);

  return (
    <div className="min-h-screen bg-[#F5EDE0] text-[#3B1A1A] font-sans pb-24 md:pb-6 relative overflow-y-auto w-full max-w-[480px] md:max-w-xl mx-auto shadow-xl">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm shrink-0 flex items-center gap-3 z-10 sticky top-0">
        <button onClick={onBack} className="p-2 bg-gray-100 rounded-full active:scale-95"><ChevronLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-black font-display uppercase tracking-tighter shrink-0">Compliance</h1>
      </header>

      <div className="p-6 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E5DACB] shadow-xs text-center flex flex-col items-center">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-gray-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-[#C8521A] transition-all duration-300" strokeWidth="3" strokeDasharray={`${scorePercent}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute font-display font-black text-xl text-[#3B1A1A]">
              {scorePercent}%
            </div>
          </div>
          <h2 className="text-base font-black mt-3">Compliance Health Rating</h2>
          <p className="text-xs text-gray-500 mt-1">{doneCount} of {criteria.length} conditions verified compliant</p>
        </div>

        {loading ? (
          <div className="text-center py-10 font-bold text-xs text-gray-400">Loading checklist...</div>
        ) : (
          <div className="space-y-3">
            {criteria.map(c => {
              const checked = !!completedItems[c.id];
              return (
                <div 
                  key={c.id} 
                  onClick={() => toggleItem(c.id)}
                  className="bg-white p-4 rounded-2xl border border-[#E5DACB] shadow-sm flex gap-3.5 items-start cursor-pointer hover:border-[#C8521A] transition-colors"
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    checked ? 'bg-[#C8521A] border-[#C8521A]' : 'bg-white border-gray-300'
                  }`}>
                    {checked && <Check className="w-3.5 h-3.5 text-white stroke-[4px]" />}
                  </div>
                  <div className="flex-1">
                    <span className={`text-sm font-bold block ${checked ? 'line-through text-gray-400' : 'text-[#3B1A1A]'}`}>{c.title}</span>
                    <span className="text-xs text-gray-500 mt-0.5 block leading-relaxed">{c.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. TAX & SARS HELP SCREEN
// ==========================================
export function TaxScreen({ onBack, shopId, ownerUserId, account }: { onBack: () => void, shopId: string, ownerUserId: string, account: Account }) {
  const [taxForm, setTaxForm] = useState({ sarsPin: "", taxNumber: "", isVatRegistered: false, status: "Unknown" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    const unsub = onSnapshot(doc(db, "shops", shopId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setTaxForm({
          sarsPin: data.sarsPin || "",
          taxNumber: data.taxNumber || "",
          isVatRegistered: !!data.isVatRegistered,
          status: data.sarsStatus || "Compliant"
        });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [shopId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "shops", shopId), {
        sarsPin: taxForm.sarsPin,
        taxNumber: taxForm.taxNumber,
        isVatRegistered: taxForm.isVatRegistered,
        sarsStatus: taxForm.status,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert("SARS Tax Details Saved Successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save tax details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EDE0] text-[#3B1A1A] font-sans pb-24 md:pb-6 relative overflow-y-auto w-full max-w-[480px] md:max-w-xl mx-auto shadow-xl">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm shrink-0 flex items-center gap-3 z-10 sticky top-0">
        <button onClick={onBack} className="p-2 bg-gray-100 rounded-full active:scale-95"><ChevronLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-black font-display uppercase tracking-tighter shrink-0">SARS & Tax Help</h1>
      </header>

      <div className="p-6 space-y-6">
        <div className="bg-white border border-[#E8D0BB] p-6 rounded-2xl shadow-sm">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            SARS Friendly Guide
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            As a micro-retailer, maintaining an active SARS Tax PIN keeps your spaza shop eligible for government small business incentives, grants, and wholesale fuel/stock exemptions.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-10 font-bold text-xs">Loading tax records...</div>
        ) : (
          <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-[#E5DACB] shadow-sm space-y-4">
            <h3 className="text-xs uppercase tracking-widest font-black text-[#C8521A]">Manage Tax Profile</h3>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 block">SARS Tax Reference Number</label>
              <input 
                value={taxForm.taxNumber} 
                onChange={e => setTaxForm({ ...taxForm, taxNumber: e.target.value })}
                placeholder="e.g. 9123456789" 
                className="w-full bg-slate-50 border border-[#E5DACB] px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-[#C8521A]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 block">SARS eFiling Tax PIN</label>
              <input 
                value={taxForm.sarsPin} 
                onChange={e => setTaxForm({ ...taxForm, sarsPin: e.target.value })}
                placeholder="e.g. A1B2C3D4" 
                className="w-full bg-slate-50 border border-[#E5DACB] px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-[#C8521A]"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-dashed">
              <div className="flex flex-col">
                <span className="text-xs font-bold font-display">VAT Vendor Registration?</span>
                <span className="text-[10px] text-gray-400">If annual sales exceeds R1 million.</span>
              </div>
              <input 
                type="checkbox" 
                checked={taxForm.isVatRegistered} 
                onChange={e => setTaxForm({ ...taxForm, isVatRegistered: e.target.checked })}
                className="w-5 h-5 accent-[#C8521A] cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 block">Compliance Status</label>
              <select 
                value={taxForm.status} 
                onChange={e => setTaxForm({ ...taxForm, status: e.target.value })}
                className="w-full bg-slate-50 border border-[#E5DACB] px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-[#C8521A]"
              >
                <option value="Compliant">✓ Compliant / Good Standing</option>
                <option value="Not Compliant">✗ Not Compliant / Issues Outstanding</option>
                <option value="Pending Submission">⌛ Pending SARS Submission</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-[#3B1A1A] text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-transform disabled:opacity-50"
            >
              {saving ? "Saving Details..." : "Save SARS Details"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 4. BUSINESS REGISTRATION (CIPC)
// ==========================================
export function BusinessRegScreen({ onBack, shopId, ownerUserId, account }: { onBack: () => void, shopId: string, ownerUserId: string, account: Account }) {
  const [regForm, setRegForm] = useState({ companyName: "", regNumber: "", status: "Unregistered", regDate: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    const unsub = onSnapshot(doc(db, "shops", shopId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRegForm({
          companyName: data.cipcCompanyName || "",
          regNumber: data.cipcRegNumber || "",
          status: data.cipcStatus || "Registered",
          regDate: data.cipcRegDate || ""
        });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [shopId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "shops", shopId), {
        cipcCompanyName: regForm.companyName,
        cipcRegNumber: regForm.regNumber,
        cipcStatus: regForm.status,
        cipcRegDate: regForm.regDate,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert("CIPC Registration details updated successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save CIPC registration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EDE0] text-[#3B1A1A] font-sans pb-24 md:pb-6 relative overflow-y-auto w-full max-w-[480px] md:max-w-xl mx-auto shadow-xl">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm shrink-0 flex items-center gap-3 z-10 sticky top-0">
        <button onClick={onBack} className="p-2 bg-gray-100 rounded-full active:scale-95"><ChevronLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-black font-display uppercase tracking-tighter shrink-0">CIPC Register</h1>
      </header>

      <div className="p-6 space-y-6">
        <div className="bg-white border border-[#E8D0BB] p-5 rounded-2xl shadow-sm">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-2">
            <Building className="w-5 h-5 text-indigo-600" />
            CIPC Registration Info
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed block">
            Registering with CIPC (Companies & Intellectual Property Commission) changes your business from informal trade to a registered legal entity (PTY LTD). Necessary for bank credit.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-10 font-bold text-xs text-gray-400">Loading CIPC record...</div>
        ) : (
          <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-[#E5DACB] shadow-sm space-y-4">
            <h3 className="text-xs uppercase tracking-widest font-black text-[#C8521A]">Company Registry Profile</h3>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 block">Enterprise Registered Name</label>
              <input 
                value={regForm.companyName} 
                onChange={e => setRegForm({ ...regForm, companyName: e.target.value })}
                placeholder="e.g. Cwebezela Trading PTY LTD" 
                className="w-full bg-slate-50 border border-[#E5DACB] px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-[#C8521A]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 block">CIPC Enterprise Number</label>
              <input 
                value={regForm.regNumber} 
                onChange={e => setRegForm({ ...regForm, regNumber: e.target.value })}
                placeholder="e.g. K2024/293818/07" 
                className="w-full bg-slate-50 border border-[#E5DACB] px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-[#C8521A]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 block">Registration Date</label>
              <input 
                type="date"
                value={regForm.regDate} 
                onChange={e => setRegForm({ ...regForm, regDate: e.target.value })}
                className="w-full bg-slate-50 border border-[#E5DACB] px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-[#C8521A]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 block">CIPC Business Status</label>
              <select 
                value={regForm.status} 
                onChange={e => setRegForm({ ...regForm, status: e.target.value })}
                className="w-full bg-slate-50 border border-[#E5DACB] px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-[#C8521A]"
              >
                <option value="Registered">✓ Registered / Active</option>
                <option value="In Progress">⌛ Application Pending / In Progress</option>
                <option value="Not Registered">✗ Unregistered / Informal Trader</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-[#3B1A1A] text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md active:scale-95 disabled:opacity-50"
            >
              {saving ? "Updating Registry..." : "Save CIPC Profile"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 5. SHOP DOCUMENTS SCREEN (HIGH CRITICAL PRIORITY)
// ==========================================
export function DocumentsScreen({ onBack, shopId, ownerUserId, account }: { onBack: () => void, shopId: string, ownerUserId: string, account: Account }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: "", category: "Trading Permit", notes: "", expiryDate: "" });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    const q = query(collection(db, "shop_documents"), where("shopId", "==", shopId));
    const unsub = onSnapshot(q, (snap) => {
      const arr: any[] = [];
      snap.forEach(d => {
        arr.push({ id: d.id, ...d.data() });
      });
      // Sort newest created first
      arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setDocs(arr);
      setLoading(false);
    });
    return () => unsub();
  }, [shopId]);

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.name) return;
    setAdding(true);

    try {
      const docId = `doc_${Date.now()}`;
      await setDoc(doc(db, "shop_documents", docId), {
        id: docId,
        shopId,
        ownerUserId,
        name: newDoc.name,
        category: newDoc.category,
        notes: newDoc.notes,
        expiryDate: newDoc.expiryDate,
        status: newDoc.expiryDate ? (new Date(newDoc.expiryDate) < new Date() ? "Expired" : "Valid") : "Valid",
        createdAt: serverTimestamp()
      });

      setNewDoc({ name: "", category: "Trading Permit", notes: "", expiryDate: "" });
      setShowAdd(false);
      alert("Document Registered Successfully in FireStore Database!");
    } catch (e) {
      console.error(e);
      alert("Failed to save document info");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this document metadata?")) return;
    try {
      await deleteDoc(doc(db, "shop_documents", id));
      alert("Document deleted successfully");
    } catch (e) {
      console.error(e);
      alert("Failed to delete document");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EDE0] text-[#3B1A1A] font-sans pb-24 md:pb-6 relative overflow-y-auto w-full max-w-[480px] md:max-w-xl mx-auto shadow-xl">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm shrink-0 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-gray-100 rounded-full active:scale-95"><ChevronLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-black font-display uppercase tracking-tighter shrink-0">Shop Documents</h1>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="p-2.5 bg-[#C8521A] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#A94415] active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <div className="p-6 space-y-4">
        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl text-indigo-900 flex gap-3 text-xs font-semibold leading-relaxed">
          <FolderLock className="w-5 h-5 shrink-0 mt-0.5 text-indigo-600 animate-pulse" />
          <div>
            <p className="font-bold">Secured Database Folder</p>
            <p className="text-[11px] font-medium opacity-80 mt-0.5">Documents are encrypted and filtered exclusively by your Shop ID to prevent any information mix-ups.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 font-bold text-xs text-gray-400">Loading document vault...</div>
        ) : docs.length === 0 ? (
          <div className="bg-white border rounded-2xl p-10 text-center border-[#E5DACB]">
            <FolderLock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-[#3B1A1A]">No documents registered yet</p>
            <p className="text-xs text-gray-500 mt-1 mb-5">Upload trading licenses, SARS tax certificates, or CIPC proof documents to stay in audit safety.</p>
            <button 
              onClick={() => setShowAdd(true)}
              className="bg-[#3B1A1A] text-white text-xs font-black px-5 py-2.5 rounded-xl uppercase tracking-wider py-3 shadow-md"
            >
              Add Your First Document
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map(item => {
              const dateVal = item.expiryDate ? new Date(item.expiryDate) : null;
              const isExpired = dateVal ? dateVal < new Date() : false;
              return (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-[#E5DACB] shadow-xs flex items-start gap-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-sm font-black truncate text-[#3B1A1A]">{item.name}</h4>
                      <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600 p-0.5"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider inline-block mt-1">
                      {item.category}
                    </span>
                    {item.expiryDate && (
                      <span className={`text-[10px] font-bold block mt-2 ${isExpired ? 'text-red-600 font-extrabold' : 'text-gray-500'}`}>
                        Expiry Date: {item.expiryDate} {isExpired ? '(EXPIRED!)' : ''}
                      </span>
                    )}
                    {item.notes && <p className="text-[11px] text-gray-500 italic mt-1.5 leading-snug">Note: {item.notes}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <form onSubmit={handleAddDocument} className="bg-white p-6 rounded-t-3xl max-h-[85vh] overflow-y-auto w-full max-w-[480px] md:max-w-xl mx-auto shadow-2xl flex flex-col gap-4">
            <h2 className="font-display font-black text-lg text-[#3B1A1A] uppercase tracking-tight">Register Document</h2>
            <div className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-gray-400 font-extrabold block">Document Label / Name</label>
                <input required placeholder="e.g. Newcastle Trading Licence 2026" value={newDoc.name} onChange={e => setNewDoc({...newDoc, name: e.target.value})} className="w-full border p-3 rounded-xl outline-none focus:border-[#C8521A]" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-gray-400 font-extrabold block">Category</label>
                <select value={newDoc.category} onChange={e => setNewDoc({...newDoc, category: e.target.value})} className="w-full border p-3 rounded-xl outline-none focus:border-[#C8521A]">
                  <option value="Trading Permit">Municipal Trading License / Permit</option>
                  <option value="SARS Tax Pin">SARS Compliance Pin Doc</option>
                  <option value="CIPC Doc">CIPC Registration Certificate</option>
                  <option value="Owner ID">Certified copy of Identity document</option>
                  <option value="Health Certificate">Environmental certificate of acceptability</option>
                  <option value="Other Documents">Other Compliance Document</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-gray-400 font-extrabold block">Expiry Date</label>
                <input type="date" value={newDoc.expiryDate} onChange={e => setNewDoc({...newDoc, expiryDate: e.target.value})} className="w-full border p-3 rounded-xl outline-none focus:border-[#C8521A]" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-gray-400 font-extrabold block">Notes / Details</label>
                <input placeholder="e.g. Approved by inspector Sibanda" value={newDoc.notes} onChange={e => setNewDoc({...newDoc, notes: e.target.value})} className="w-full border p-3 rounded-xl outline-none focus:border-[#C8521A]" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-gray-100 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-xs">Cancel</button>
                <button type="submit" disabled={adding} className="flex-1 bg-[#3B1A1A] text-white py-3.5 rounded-xl font-black uppercase tracking-wider text-xs shadow-md disabled:opacity-50">
                  {adding ? "Saving..." : "Save to DB"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 6. REMINDERS & PERMIT ALERTS
// ==========================================
export function RemindersScreen({ onBack, shopId, ownerUserId, account }: { onBack: () => void, shopId: string, ownerUserId: string, account: Account }) {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newRem, setNewRem] = useState({ title: "", date: "", priority: "High", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    const q = query(collection(db, "reminders"), where("shopId", "==", shopId));
    const unsub = onSnapshot(q, (snap) => {
      const arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      // Sort closest due date first
      arr.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setReminders(arr);
      setLoading(false);
    });
    return () => unsub();
  }, [shopId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRem.title || !newRem.date) return;
    setSaving(true);
    try {
      const rid = `rem_${Date.now()}`;
      await setDoc(doc(db, "reminders", rid), {
        id: rid,
        shopId,
        ownerUserId,
        title: newRem.title,
        date: newRem.date,
        priority: newRem.priority,
        notes: newRem.notes,
        createdAt: serverTimestamp()
      });
      setNewRem({ title: "", date: "", priority: "High", notes: "" });
      setShowAdd(false);
      alert("Compliance reminder set!");
    } catch (e) {
      console.error(e);
      alert("Failed to save reminder");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "reminders", id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EDE0] text-[#3B1A1A] font-sans pb-24 md:pb-6 relative overflow-y-auto w-full max-w-[480px] md:max-w-xl mx-auto shadow-xl">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm shrink-0 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-gray-100 rounded-full active:scale-95"><ChevronLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-black font-display uppercase tracking-tighter shrink-0">Reminders</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="p-2 bg-[#C8521A] text-white rounded-full"><Plus className="w-5 h-5" /></button>
      </header>

      <div className="p-6 space-y-4">
        {loading ? (
          <div className="text-center py-10 font-bold text-xs text-gray-400">Loading reminders...</div>
        ) : reminders.length === 0 ? (
          <div className="bg-white border rounded-2xl p-10 text-center border-[#E5DACB]">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold">No active renewal alerts</p>
            <p className="text-xs text-gray-500 mt-1 italic">Setup push alerts for health permit cycles, tax filings, or wholesaler quota deadlines.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-[#E5DACB] shadow-xs flex items-center justify-between gap-3">
                <div className="flex gap-3">
                  <div className={`w-2 h-10 rounded ${item.priority === 'High' ? 'bg-red-500' : item.priority === 'Medium' ? 'bg-orange-500' : 'bg-slate-400'}`} />
                  <div>
                    <h4 className="text-sm font-black">{item.title}</h4>
                    <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-[#C8521A]" />
                      Due Date: {item.date}
                    </span>
                    {item.notes && <p className="text-xs text-gray-400 italic mt-1 font-medium">{item.notes}</p>}
                  </div>
                </div>
                <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-t-3xl max-h-[85vh] overflow-y-auto w-full max-w-[480px] md:max-w-xl mx-auto shadow-2xl flex flex-col gap-4">
            <h2 className="font-display font-black text-lg text-[#3B1A1A] uppercase tracking-tight">Add Reminder</h2>
            <div className="space-y-3 text-xs font-bold">
              <input required placeholder="Reminder Title (e.g., File SARS return)" value={newRem.title} onChange={e => setNewRem({...newRem, title: e.target.value})} className="w-full border p-3 rounded-xl outline-none" />
              <input required type="date" value={newRem.date} onChange={e => setNewRem({...newRem, date: e.target.value})} className="w-full border p-3 rounded-xl outline-none" />
              
              <select value={newRem.priority} onChange={e => setNewRem({...newRem, priority: e.target.value})} className="w-full border p-3 rounded-xl outline-none">
                <option value="High">★ High Urgency</option>
                <option value="Medium">✦ Medium Urgency</option>
                <option value="Low">⚡ Low Info Alert</option>
              </select>

              <input placeholder="Short details / note (Optional)" value={newRem.notes} onChange={e => setNewRem({...newRem, notes: e.target.value})} className="w-full border p-3 rounded-xl outline-none" />

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-gray-100 py-3.5 rounded-xl uppercase">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-[#3B1A1A] text-white py-3.5 rounded-xl uppercase">
                  {saving ? "Creating..." : "Save Reminder"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 7. INCIDENT REPORTS SCREEN (INCIDENTS)
// ==========================================
export function IncidentsScreen({ onBack, shopId, ownerUserId, account }: { onBack: () => void, shopId: string, ownerUserId: string, account: Account }) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newReport, setNewReport] = useState({ type: "Load-Shedding", desc: "", valLoss: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    const q = query(collection(db, "incident_reports"), where("shopId", "==", shopId));
    const unsub = onSnapshot(q, (snap) => {
      const arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      // Sort newest incident first
      arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setReports(arr);
      setLoading(false);
    });
    return () => unsub();
  }, [shopId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReport.desc) return;
    setSaving(true);
    try {
      const iid = `inc_${Date.now()}`;
      await setDoc(doc(db, "incident_reports", iid), {
        id: iid,
        shopId,
        ownerUserId,
        type: newReport.type,
        description: newReport.desc,
        valueLoss: Number(newReport.valLoss) || 0,
        status: "Open",
        date: new Date().toISOString(),
        createdAt: serverTimestamp()
      });
      setNewReport({ type: "Load-Shedding", desc: "", valLoss: "" });
      setShowAdd(false);
      alert("Incident Filed. Stay safe, sharp sharp.");
    } catch (e) {
      console.error(e);
      alert("Failed to submit incident report");
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await setDoc(doc(db, "incident_reports", id), { status: "Resolved" }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EDE0] text-[#3B1A1A] font-sans pb-24 md:pb-6 relative overflow-y-auto w-full max-w-[480px] md:max-w-xl mx-auto shadow-xl">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm shrink-0 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-gray-100 rounded-full active:scale-95"><ChevronLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-black font-display uppercase tracking-tighter shrink-0">Incidents</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="p-2 bg-[#C8521A] text-white rounded-full"><Plus className="w-5 h-5" /></button>
      </header>

      <div className="p-6 space-y-4">
        {loading ? (
          <div className="text-center py-10 font-bold text-xs text-gray-400">Loading log...</div>
        ) : reports.length === 0 ? (
          <div className="bg-white border rounded-2xl p-10 text-center border-[#E5DACB]">
            <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold">All Quiet / No Reported Incidents</p>
            <p className="text-xs text-gray-500 mt-1 italic">Use this log to keep records of stock theft, load-shitting outages, municipal issues for local council claims.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-[#E5DACB] shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] bg-red-100 text-red-700 font-extrabold tracking-wider px-2 py-0.5 rounded uppercase">{item.type}</span>
                    <span className="text-xs text-gray-400 font-mono block mt-1">{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  {item.status === "Open" ? (
                    <button 
                      onClick={() => handleResolve(item.id)}
                      className="text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 px-3 py-1 rounded-full uppercase"
                    >
                      Resolve Status
                    </button>
                  ) : (
                    <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-3 py-1 rounded-full uppercase border">Resolved</span>
                  )}
                </div>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">{item.description}</p>
                {item.valueLoss > 0 && (
                  <p className="text-xs font-bold text-[#C8521A]">Value Loss: R {item.valueLoss}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-t-3xl max-h-[85vh] overflow-y-auto w-full max-w-[480px] md:max-w-xl mx-auto shadow-2xl flex flex-col gap-4">
            <h2 className="font-display font-black text-lg text-[#3B1A1A] uppercase">Log Active Incident</h2>
            <div className="space-y-3 text-xs font-bold">
              <label className="text-[10px] uppercase text-gray-400">Incident Category</label>
              <select value={newReport.type} onChange={e => setNewReport({...newReport, type: e.target.value})} className="w-full border p-3 rounded-xl outline-none">
                <option value="Load-Shedding Outage">⚡ Load-Shedding Power Outage</option>
                <option value="Theft or Break-in">⚠ Rent/Security Theft or Break-in</option>
                <option value="Water Cutoff">☠ Water Cutoff / Pipe Burst</option>
                <option value="Supplier Fraud / Dispute">✉ Wholesaler / Supplier Dispute</option>
              </select>

              <label className="text-[10px] uppercase text-gray-400">Description of Event</label>
              <textarea required rows={3} placeholder="Provide clear events details for municipal reports..." value={newReport.desc} onChange={e => setNewReport({...newReport, desc: e.target.value})} className="w-full border p-3 rounded-xl outline-none" />

              <label className="text-[10px] uppercase text-gray-400">Estimated value loss (ZAR - Optional)</label>
              <input type="number" placeholder="e.g. 500" value={newReport.valLoss} onChange={e => setNewReport({...newReport, valLoss: e.target.value})} className="w-full border p-3 rounded-xl outline-none" />

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-gray-100 py-3.5 rounded-xl uppercase">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-[#3B1A1A] text-white py-3.5 rounded-xl uppercase">
                  {saving ? "Filing..." : "Log Incident"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 8. FOOD SAFETY & CLEANING SCREEN
// ==========================================
export function FoodSafetyScreen({ onBack, shopId, ownerUserId, account }: { onBack: () => void, shopId: string, ownerUserId: string, account: Account }) {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const checks = [
    { id: "fridge", label: "Cold temperatures checked (all dairy & meats stored below 5°C)" },
    { id: "bloat", label: "Inspected canned stock (discarded any rusted or bloated cans)" },
    { id: "expiry", label: "Checked expiry tags on milk, bread, polony and baby foods" },
    { id: "pest", label: "Verified pest proofing barrier screens are fully shut & secure" },
    { id: "counter", label: "Full counter bench sanitization sweep using food-safe detergent" }
  ];

  const handleCheck = (id: string) => {
    setCompleted({ ...completed, [id]: !completed[id] });
  };

  const handleSubmit = async () => {
    const allChecked = checks.every(c => completed[c.id]);
    if (!allChecked) {
      alert("Please execute and verify all food safety checklists first!");
      return;
    }
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const docId = `fs_${shopId}_${today}`;
      await setDoc(doc(db, "food_safety_checks", docId), {
        id: docId,
        shopId,
        ownerUserId,
        checkDate: today,
        status: "Completed",
        checkedBy: account.ownerName || "Shop Owner",
        timestamp: serverTimestamp()
      });
      setSubmitted(true);
      alert("Daily Food Safety checklist saved in Firestore!");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EDE0] text-[#3B1A1A] font-sans pb-24 md:pb-6 relative overflow-y-auto w-full max-w-[480px] md:max-w-xl mx-auto shadow-xl">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm shrink-0 flex items-center gap-3 z-10 sticky top-0">
        <button onClick={onBack} className="p-2 bg-gray-100 rounded-full active:scale-95"><ChevronLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-black font-display uppercase tracking-tighter shrink-0">Food Safety</h1>
      </header>

      <div className="p-6 space-y-6">
        <div className="bg-white border p-5 rounded-2xl border-[#E8D0BB] text-center">
          <HeartPulse className="w-10 h-10 text-teal-600 mx-auto mb-2" />
          <h2 className="text-base font-black">Daily Food Safety Sweep</h2>
          <p className="text-xs text-gray-500 mt-1">Submit your checklist daily to maintain audit protection and clear safety checks.</p>
        </div>

        {submitted ? (
          <div className="bg-white border rounded-2xl p-8 border-emerald-200 text-center space-y-3 shadow-xs">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="font-display font-black text-emerald-900 text-sm">TODAY'S CLEANING DONE!</h3>
            <p className="text-xs text-gray-400">Excellent job! Your compliance dashboard checklist is marked in good standing for today.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {checks.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => handleCheck(c.id)}
                  className="bg-white p-4 rounded-xl border border-[#E5DACB] shadow-xs flex gap-3 cursor-pointer"
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    completed[c.id] ? 'bg-teal-600 border-teal-600 text-white' : 'border-gray-300'
                  }`}>
                    {completed[c.id] && <Check className="w-3.5 h-3.5 stroke-[4px]" />}
                  </div>
                  <span className="text-xs font-bold leading-relaxed">{c.label}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bg-[#3B1A1A] text-white py-4 rounded-xl font-black text-xs uppercase tracking-wider shadow-md opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving check..." : "Submit Daily Checklist"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 9. FUNDING READINESS ASSESSMENT SCORE
// ==========================================
export function FundingScreen({ onBack, shopId, ownerUserId, account }: { onBack: () => void, shopId: string, ownerUserId: string, account: Account }) {
  const [answers, setAnswers] = useState<Record<string, boolean>>({ cipc: false, sars: false, bank: false, permit: false, ledger: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    const unsub = onSnapshot(doc(db, "funding_profiles", shopId), (snap) => {
      if (snap.exists()) {
        setAnswers(snap.data().answers || {});
      }
      setLoading(false);
    });
    return () => unsub();
  }, [shopId]);

  const handleToggle = async (id: string) => {
    const updated = { ...answers, [id]: !answers[id] };
    setAnswers(updated);
    try {
      await setDoc(doc(db, "funding_profiles", shopId), {
        shopId,
        ownerUserId,
        answers: updated,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  };

  const score = Object.values(answers).filter(Boolean).length * 20;

  return (
    <div className="min-h-screen bg-[#F5EDE0] text-[#3B1A1A] font-sans pb-24 md:pb-6 relative overflow-y-auto w-full max-w-[480px] md:max-w-xl mx-auto shadow-xl">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm shrink-0 flex items-center gap-3 z-10 sticky top-0">
        <button onClick={onBack} className="p-2 bg-gray-100 rounded-full active:scale-95"><ChevronLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-black font-display uppercase tracking-tighter shrink-0">Funding score</h1>
      </header>

      <div className="p-6 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E5DACB] shadow-sm text-center flex flex-col items-center">
          <div className="relative w-28 h-28 flex items-center justify-center bg-pink-50 rounded-full mb-3">
            <Percent className="w-12 h-12 text-[#C8521A]" />
            <div className="absolute top-1 right-1 bg-[#3B1A1A] text-white font-display text-xs px-2.5 py-1 rounded-full">{score}/100</div>
          </div>
          <h2 className="text-base font-black">Lender Readiness score</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">Banks like FNB and SEFA look for these items before granting overdraft trade limits.</p>
        </div>

        <div className="space-y-3">
          <div className="text-xs uppercase font-extrabold text-gray-400 pl-1">Readiness Criteria</div>
          {[
            { id: "cipc", label: "CIPC Company Setup / Biz Profile" },
            { id: "sars", label: "SARS Good Standing Status" },
            { id: "bank", label: "3-Month business bank account history" },
            { id: "permit", label: "Valid Town council trade licence" },
            { id: "ledger", label: "Active digital debtor recording ledger (Cwebezela)" }
          ].map(item => (
            <div 
              key={item.id} 
              onClick={() => handleToggle(item.id)}
              className="bg-white p-4 rounded-xl border border-[#E5DACB] flex items-center justify-between cursor-pointer"
            >
              <span className="text-xs font-bold">{item.label}</span>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                answers[item.id] ? 'bg-pink-600 border-pink-600 text-white' : 'border-gray-200'
              }`}>
                {answers[item.id] && <Check className="w-3 h-3 stroke-[4px]" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 10. APPLY FOR HELP CHECKLIST SCREEN
// ==========================================
export function HelpAppChecklistScreen({ onBack, shopId, ownerUserId, account }: { onBack: () => void, shopId: string, ownerUserId: string, account: Account }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopId) return;
    const unsub = onSnapshot(doc(db, "help_app_checklist", shopId), (snap) => {
      if (snap.exists()) {
        setChecked(snap.data().items || {});
      }
      setLoading(false);
    });
    return () => unsub();
  }, [shopId]);

  const toggleItem = async (id: string) => {
    const updated = { ...checked, [id]: !checked[id] };
    setChecked(updated);
    try {
      await setDoc(doc(db, "help_app_checklist", shopId), {
        shopId,
        ownerUserId,
        items: updated,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EDE0] text-[#3B1A1A] font-sans pb-24 md:pb-6 relative overflow-y-auto w-full max-w-[480px] md:max-w-xl mx-auto shadow-xl">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm shrink-0 flex items-center gap-3 z-10 sticky top-0">
        <button onClick={onBack} className="p-2 bg-gray-100 rounded-full active:scale-95"><ChevronLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-black font-display uppercase tracking-tighter shrink-0">Help checklist</h1>
      </header>

      <div className="p-6 space-y-6">
        <div className="bg-white border p-5 rounded-2xl border-[#E5DACB]">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#C8521A] mb-2 font-display">Compilation Checklist</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Compile this folder of documents before visiting Newcastle Municipality offices or local Spaza Traders Association.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-xs font-bold">Loading folder checklist...</div>
        ) : (
          <div className="space-y-2">
            {[
              "Copy of SA Owner Identity / Passports",
              "Newcastle Town Planning Permission form",
              "Signed business premises lease agreement",
              "Registered CIPC enterprise document",
              "SARS Income Tax standing letter copy"
            ].map((label, idx) => {
              const id = `item_${idx}`;
              const active = !!checked[id];
              return (
                <div 
                  key={id} 
                  onClick={() => toggleItem(id)}
                  className="bg-white p-4 rounded-xl border border-[#E5DACB] flex gap-3 items-center cursor-pointer"
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                    active ? 'bg-[#3B1A1A] border-[#3B1A1A] text-white' : 'border-gray-200'
                  }`}>
                    {active && <Check className="w-3.5 h-3.5 stroke-[4px]" />}
                  </div>
                  <span className={`text-xs font-bold ${active ? 'line-through text-gray-400' : ''}`}>{label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 11. IMPORTANT ALERTS SCREEN
// ==========================================
export function AlertsScreen({ onBack, shopId, ownerUserId, account }: { onBack: () => void, shopId: string, ownerUserId: string, account: Account }) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const MOCK_ALERTS = [
    {
      id: "a1",
      title: "Planned Water Maintenance: Newcastle Ward 5",
      type: "Service Outage",
      body: "Municipal plumbers will do planned main water pipeline repairs on Wed. Backup reservoirs are open.",
      date: "August 20, 2026"
    },
    {
      id: "a2",
      title: "SARS Compliance Deadline Reminder",
      type: "Legal Filing",
      body: "SARS is running an assistance desk for small traders at Ward 5 Hall. Bring ID, CIPC documents & PIN numbers.",
      date: "August 15, 2026"
    }
  ];

  useEffect(() => {
    if (!shopId) return;
    const q = query(collection(db, "important_alerts"), where("shopId", "==", shopId));
    const unsub = onSnapshot(q, (snap) => {
      const arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setAlerts(arr);
      setLoading(false);
    });
    return () => unsub();
  }, [shopId]);

  const handleAcknowledge = async (id: string) => {
    try {
      await setDoc(doc(db, "important_alerts", id), {
        acknowledged: true,
        acknowledgedAt: serverTimestamp()
      }, { merge: true });
      alert("Alert Acknowledged");
    } catch (e) {
      console.error(e);
    }
  };

  const activeAlerts = [...MOCK_ALERTS];

  return (
    <div className="min-h-screen bg-[#F5EDE0] text-[#3B1A1A] font-sans pb-24 md:pb-6 relative overflow-y-auto w-full max-w-[480px] md:max-w-xl mx-auto shadow-xl">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm shrink-0 flex items-center gap-3 z-10 sticky top-0">
        <button onClick={onBack} className="p-2 bg-gray-100 rounded-full active:scale-95"><ChevronLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-black font-display uppercase tracking-tighter shrink-0">Broadcase Alerts</h1>
      </header>

      <div className="p-6 space-y-4">
        {activeAlerts.map(alt => (
          <div key={alt.id} className="bg-white p-5 rounded-2xl border border-amber-200 border-l-[6px] border-l-amber-500 shadow-sm space-y-2">
            <span className="text-[9px] uppercase tracking-wider font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-display leading-none">
              {alt.type}
            </span>
            <h3 className="text-sm font-black text-[#3B1A1A]">{alt.title}</h3>
            <p className="text-xs text-gray-600 mt-1.5 leading-relaxed font-semibold">{alt.body}</p>
            <div className="mt-3 text-[10px] text-gray-400 font-bold flex justify-between items-center bg-slate-50 p-2 rounded-xl">
              <span>Date Received: {alt.date}</span>
              <button onClick={() => alert("Alert marked read")} className="text-[#C8521A] hover:underline uppercase">Dismiss</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
