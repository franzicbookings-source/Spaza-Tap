import React, { useState, useEffect } from "react";
import { ArrowLeft, Megaphone, Send, Users, CheckCircle2, Ticket, Image as ImageIcon } from "lucide-react";
import { Customer, ScreenState, ShopUpdate } from "../types";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp } from "firebase/firestore";

interface PromosScreenProps {
  onBack: () => void;
  customers: Customer[];
  onNavigate: (screen: ScreenState) => void;
  shopId: string;
  ownerUserId: string;
}

export default function PromosScreen({ onBack, customers, onNavigate, shopId, ownerUserId }: PromosScreenProps) {
  const [promoMessage, setPromoMessage] = useState("");
  const [promoTitle, setPromoTitle] = useState("");
  const [targetGroup, setTargetGroup] = useState<"all" | "paid" | "owing">("all");
  const [sentSuccess, setSentSuccess] = useState(false);
  const [recentUpdates, setRecentUpdates] = useState<ShopUpdate[]>([]);

  useEffect(() => {
    fetchUpdates();
  }, [shopId]);

  const fetchUpdates = async () => {
    try {
      const q = query(
        collection(db, "shop_updates"),
        where("shopId", "==", shopId)
      );
      const snap = await getDocs(q);
      const updates: ShopUpdate[] = snap.docs.map(d => d.data() as ShopUpdate);
      updates.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA;
      });
      setRecentUpdates(updates);
    } catch (e) {
      console.error("Error fetching updates:", e);
    }
  };

  const handleSend = async () => {
    if (!promoTitle.trim() || !promoMessage.trim()) return;
    
    try {
      const updateId = "update_" + Date.now();
      const updateDoc = doc(db, "shop_updates", updateId);
      
      const newUpdate = {
        id: updateId,
        shopId,
        ownerUserId,
        title: promoTitle.trim(),
        message: promoMessage.trim(),
        targetGroup,
        createdAt: serverTimestamp()
      };
      
      await setDoc(updateDoc, newUpdate);
      
      setSentSuccess(true);
      fetchUpdates();
      
      setTimeout(() => {
        setSentSuccess(false);
        setPromoTitle("");
        setPromoMessage("");
      }, 3000);
    } catch (e) {
      console.error("Failed to send update", e);
      alert("Failed to post update. Please try again.");
    }
  };


  const getTargetCount = () => {
    if (targetGroup === "all") return customers.length;
    if (targetGroup === "owing") return customers.filter(c => c.owed > 0).length;
    if (targetGroup === "paid") return customers.filter(c => c.owed === 0).length;
    return 0;
  };

  return (
    <div className="min-h-screen w-full bg-[#F5EDE0] flex flex-col font-sans pb-24">
      {/* Header */}
      <header className="bg-white border-b border-[#E8D0BB] w-full px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-[#F5EDE0] rounded-full flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-[#3B1A1A]" />
          </button>
          <div>
            <h1 className="text-xl font-display font-black text-[#3B1A1A] leading-none uppercase tracking-tight">
              Customer Promos
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-[#C8521A] font-bold mt-1">Marketing & Deals</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-2xl min-w-full md:min-w-[600px] mx-auto w-full space-y-6">
        
        {/* Quick Send Template */}
        <div className="w-full min-w-full md:min-w-[500px] bg-white rounded-[1.5rem] p-5 shadow-sm border border-[#E8D0BB]">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-full bg-[#f3e5f5] flex items-center justify-center">
               <Megaphone className="w-5 h-5 text-[#6b2c91]" />
             </div>
             <div>
               <h3 className="font-black text-[#3B1A1A] leading-tight">Create Promo</h3>
               <p className="text-xs text-gray-500 font-medium">Send SMS or Push Notification deals</p>
             </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 mb-1 block">Promo Title / Deal Name</label>
              <input
                type="text"
                value={promoTitle}
                onChange={(e) => setPromoTitle(e.target.value)}
                placeholder="e.g. Weekend Bulk Special"
                className="w-full bg-[#F5EDE0] border-none rounded-xl px-4 py-3 font-medium text-[#3B1A1A] placeholder:text-gray-400 focus:outline-[#C8521A] focus:ring-2 focus:ring-[#C8521A]/20 transition-all font-sans"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 mb-1 block">Message Details</label>
              <textarea
                value={promoMessage}
                onChange={(e) => setPromoMessage(e.target.value)}
                placeholder="Buy 2 get 1 free on all bulk maize meal this weekend only! Show this message at the till."
                rows={4}
                className="w-full bg-[#F5EDE0] border-none rounded-xl px-4 py-3 font-medium text-[#3B1A1A] placeholder:text-gray-400 focus:outline-[#C8521A] focus:ring-2 focus:ring-[#C8521A]/20 transition-all font-sans resize-none"
              ></textarea>
            </div>

            {/* Target Audience */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 mb-2 block">Who receives this?</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                   onClick={() => setTargetGroup("all")}
                   className={`p-2 rounded-xl border text-xs font-bold transition-colors ${
                     targetGroup === "all" ? "bg-[#3B1A1A] text-white border-[#3B1A1A]" : "bg-white text-gray-600 border-gray-200"
                   }`}
                >
                  All ({customers.length})
                </button>
                <button
                   onClick={() => setTargetGroup("paid")}
                   className={`p-2 rounded-xl border text-xs font-bold transition-colors ${
                     targetGroup === "paid" ? "bg-[#3B1A1A] text-white border-[#3B1A1A]" : "bg-white text-gray-600 border-gray-200"
                   }`}
                >
                  Paid Up
                </button>
                <button
                   onClick={() => setTargetGroup("owing")}
                   className={`p-2 rounded-xl border text-xs font-bold transition-colors flex flex-col items-center justify-center ${
                     targetGroup === "owing" ? "bg-[#3B1A1A] text-white border-[#3B1A1A]" : "bg-white text-gray-600 border-gray-200"
                   }`}
                >
                  Owing
                </button>
              </div>
            </div>

            <button
               onClick={handleSend}
               disabled={!promoTitle.trim() || !promoMessage.trim() || sentSuccess}
               className="w-full h-[52px] bg-[#C8521A] text-white rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100 mt-2"
            >
              {sentSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  Sent to {getTargetCount()} Customers
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Promo Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* Promo History Snippet */}
        <div className="px-1">
          <h2 className="text-sm font-black text-[#3B1A1A] uppercase tracking-wider mb-3">Recent Promos & Updates</h2>
          <div className="space-y-3">
             {recentUpdates.length > 0 ? (
               recentUpdates.map((update) => (
                 <div key={update.id} className="bg-white rounded-xl p-4 shadow-sm border border-[#E8D0BB] flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#f3e5f5] flex items-center justify-center shrink-0">
                      <Megaphone className="w-5 h-5 text-[#6b2c91]" />
                    </div>
                    <div>
                       <h4 className="font-bold text-[#3B1A1A] text-sm leading-tight">{update.title}</h4>
                       <p className="text-xs text-gray-500 mt-1 line-clamp-2">{update.message}</p>
                       <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">
                          {update.targetGroup === "all" ? "Sent to all" : `Sent to ${update.targetGroup} customers`}
                       </p>
                    </div>
                 </div>
               ))
             ) : (
                 <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E8D0BB] flex gap-4 opacity-70">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <Ticket className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                       <h4 className="font-bold text-[#3B1A1A] text-sm leading-tight">No updates yet</h4>
                       <p className="text-xs text-gray-500 mt-1 line-clamp-2">Promos and announcements you send will appear here.</p>
                    </div>
                 </div>
             )}
          </div>
        </div>

      </main>
    </div>
  );
}
