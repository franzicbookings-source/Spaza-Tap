import React, { useState, useEffect } from "react";
import { ScreenState, Account } from "../types";
import { db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { ChevronLeft, Save, MapPin, Building2, Store } from "lucide-react";

interface OfficialProfileScreenProps {
  onBack: () => void;
  shopId: string;
  account: Account;
}

const LOCAL_AREAS = [
  { id: "newcastle", name: "Newcastle", town: "Newcastle", localAuth: "Newcastle Local Municipality", district: "Amajuba District Municipality", prov: "KwaZulu-Natal" },
  { id: "utrecht", name: "Utrecht / eMadlangeni", town: "Utrecht", localAuth: "eMadlangeni Local Municipality", district: "Amajuba District Municipality", prov: "KwaZulu-Natal" },
  { id: "dannhauser", name: "Dannhauser", town: "Dannhauser", localAuth: "Dannhauser Local Municipality", district: "Amajuba District Municipality", prov: "KwaZulu-Natal" },
  { id: "dundee", name: "Dundee", town: "Dundee", localAuth: "Endumeni Local Municipality", district: "uMzinyathi District Municipality", prov: "KwaZulu-Natal" },
  { id: "other", name: "Other nearby Northern KZN area", town: "", localAuth: "", district: "", prov: "KwaZulu-Natal" }
];

export default function OfficialProfileScreen({ onBack, shopId, account }: OfficialProfileScreenProps) {
  const [form, setForm] = useState(account);
  const [isSaving, setIsSaving] = useState(false);

  // Sync internal form when account changes
  useEffect(() => {
    setForm(account);
  }, [account]);

  const handleAreaSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = LOCAL_AREAS.find(a => a.id === e.target.value);
    if (selected) {
      setForm(prev => ({
        ...prev,
        town: selected.town,
        localMunicipality: selected.localAuth,
        districtMunicipality: selected.district,
        province: selected.prov
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const ref = doc(db, "shops", shopId);
      const toUpdate = {
        ownerEmail: form.ownerEmail || "",
        shopAddress: form.shopAddress || "",
        town: form.town || "",
        localMunicipality: form.localMunicipality || "",
        districtMunicipality: form.districtMunicipality || "",
        province: form.province || "",
        wardNumber: form.wardNumber || "",
        businessRegistrationNumber: form.businessRegistrationNumber || "",
        taxNumber: form.taxNumber || "",
        tradingPermitNumber: form.tradingPermitNumber || "",
        supportFundReferenceNumber: form.supportFundReferenceNumber || "",
        emergencyContactPerson: form.emergencyContactPerson || "",
        emergencyContactNumber: form.emergencyContactNumber || "",
        nearestPoliceStation: form.nearestPoliceStation || "",
        nearestClinic: form.nearestClinic || "",
        municipalAccountNumber: form.municipalAccountNumber || "",
        businessType: form.businessType || "",
        operatingHours: form.operatingHours || "",
        numberOfEmployees: form.numberOfEmployees || 0,
        mainProductsSold: form.mainProductsSold || "",
      };
      await updateDoc(ref, toUpdate);
      alert("Official profile saved!");
      onBack();
    } catch (err) {
      console.error(err);
      alert("Failed to save profile.");
    }
    setIsSaving(false);
  };

  const currentSelection = LOCAL_AREAS.find(a => a.town === form.town && a.localAuth === form.localMunicipality)?.id || "other";

  return (
    <div className="min-h-screen bg-[#F5EDE0] font-sans pb-24 md:pb-6 relative overflow-y-auto w-full max-w-[480px] md:max-w-xl mx-auto shadow-xl">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm shrink-0 flex items-center gap-3">
        <button onClick={onBack} className="p-2 bg-gray-100 rounded-full active:scale-95"><ChevronLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-xl font-black font-display text-[#3B1A1A] uppercase tracking-tighter">Official Profile</h1>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Help Hub Master Data</p>
        </div>
      </header>

      <form onSubmit={handleSave} className="px-6 py-6 space-y-6">
        
        {/* Location Selector */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E8D0BB] space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-[#C8521A]" />
            <h2 className="text-xs font-black text-[#3B1A1A] uppercase tracking-widest">Select Area</h2>
          </div>
          <div>
            <select 
              value={currentSelection} 
              onChange={handleAreaSelect}
              className="w-full bg-[#f9ede0] border border-[#E8D0BB] rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-[#C8521A]"
            >
              <option value="other" disabled>Select standard area...</option>
              {LOCAL_AREAS.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 block mb-1">Town / Area</label>
              <input type="text" value={form.town || ""} onChange={e => setForm({...form, town: e.target.value})} className="w-full bg-[#f9ede0] border border-[#E8D0BB] rounded-lg px-3 py-2 text-xs font-bold outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 block mb-1">Local Municipality</label>
              <input type="text" value={form.localMunicipality || ""} onChange={e => setForm({...form, localMunicipality: e.target.value})} className="w-full bg-[#f9ede0] border border-[#E8D0BB] rounded-lg px-3 py-2 text-xs font-bold outline-none" />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 block mb-1">District Municipality</label>
              <input type="text" value={form.districtMunicipality || ""} onChange={e => setForm({...form, districtMunicipality: e.target.value})} className="w-full bg-[#f9ede0] border border-[#E8D0BB] rounded-lg px-3 py-2 text-xs font-bold outline-none" />
            </div>
             <div className="col-span-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 block mb-1">Shop Address</label>
              <textarea value={form.shopAddress || ""} onChange={e => setForm({...form, shopAddress: e.target.value})} className="w-full bg-[#f9ede0] border border-[#E8D0BB] rounded-lg px-3 py-2 text-xs font-bold outline-none h-16 resize-none" placeholder="Physical location of shop"/>
            </div>
          </div>
        </div>

        {/* Business Registration */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E8D0BB] space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-[#C8521A]" />
            <h2 className="text-xs font-black text-[#3B1A1A] uppercase tracking-widest">Business Details</h2>
          </div>
           <div className="grid grid-cols-2 gap-3">
             <div className="col-span-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 block mb-1">Business Registration Ref / CIPC</label>
              <input type="text" value={form.businessRegistrationNumber || ""} onChange={e => setForm({...form, businessRegistrationNumber: e.target.value})} className="w-full bg-[#f9ede0] border border-[#E8D0BB] rounded-lg px-3 py-2 text-xs font-bold outline-none" placeholder="e.g. 2021/..." />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 block mb-1">Tax Number (SARS)</label>
              <input type="text" value={form.taxNumber || ""} onChange={e => setForm({...form, taxNumber: e.target.value})} className="w-full bg-[#f9ede0] border border-[#E8D0BB] rounded-lg px-3 py-2 text-xs font-bold outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 block mb-1">Trading Permit Number</label>
              <input type="text" value={form.tradingPermitNumber || ""} onChange={e => setForm({...form, tradingPermitNumber: e.target.value})} className="w-full bg-[#f9ede0] border border-[#E8D0BB] rounded-lg px-3 py-2 text-xs font-bold outline-none" />
            </div>
          </div>
        </div>

         {/* Emergency Info */}
         <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E8D0BB] space-y-4">
          <div className="flex items-center gap-2 mb-2">
             <Store className="w-5 h-5 text-red-600" />
            <h2 className="text-xs font-black text-[#3B1A1A] uppercase tracking-widest">Emergency Reference</h2>
          </div>
           <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 block mb-1">Nearest Police</label>
              <input type="text" value={form.nearestPoliceStation || ""} onChange={e => setForm({...form, nearestPoliceStation: e.target.value})} className="w-full bg-[#f9ede0] border border-[#E8D0BB] rounded-lg px-3 py-2 text-xs font-bold outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 block mb-1">Nearest Clinic/Hosp</label>
              <input type="text" value={form.nearestClinic || ""} onChange={e => setForm({...form, nearestClinic: e.target.value})} className="w-full bg-[#f9ede0] border border-[#E8D0BB] rounded-lg px-3 py-2 text-xs font-bold outline-none" />
            </div>
             <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 block mb-1">ICE Contact Person</label>
              <input type="text" value={form.emergencyContactPerson || ""} onChange={e => setForm({...form, emergencyContactPerson: e.target.value})} className="w-full bg-[#f9ede0] border border-[#E8D0BB] rounded-lg px-3 py-2 text-xs font-bold outline-none" />
            </div>
             <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 block mb-1">ICE Phone</label>
              <input type="text" value={form.emergencyContactNumber || ""} onChange={e => setForm({...form, emergencyContactNumber: e.target.value})} className="w-full bg-[#f9ede0] border border-[#E8D0BB] rounded-lg px-3 py-2 text-xs font-bold outline-none" />
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={isSaving}
          className="w-full h-14 bg-[#3B1A1A] text-white rounded-full font-display font-black uppercase tracking-widest shadow-md active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center relative"
        >
          {isSaving ? "Saving Data..." : "Save Official Profile"}
        </button>

      </form>
    </div>
  );
}
