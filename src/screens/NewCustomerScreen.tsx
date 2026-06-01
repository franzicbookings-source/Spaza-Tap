import React, { useState, useRef } from "react";
import {
  Shield,
  Save,
  CheckCircle,
  X,
  Camera
} from "lucide-react";
import { ScreenState } from "../types";

interface NewCustomerScreenProps {
  onBack: (newCustomerId?: string) => void;
  onNavigate: (screen: ScreenState) => void;
  onAddCustomer: (data: { name: string; phone: string; area: string; limit: number; notes: string; photoUrl?: string }) => Promise<string | null> | void;
  defaultLimit: number;
}

export default function NewCustomerScreen({
  onBack,
  onNavigate,
  onAddCustomer,
  defaultLimit = 500,
}: NewCustomerScreenProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [limit, setLimit] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setPhotoUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    
    // Call real save handler
    const result = await onAddCustomer({
      name: name.trim(),
      phone: phone.trim(),
      area: area.trim(),
      limit: parseFloat(limit) || defaultLimit,
      notes: notes.trim(),
      photoUrl: photoUrl || undefined
    });

    setIsSubmitting(false);
    setIsSuccess(true);
    
    setTimeout(() => {
      onBack(typeof result === 'string' ? result : undefined);
    }, 1000);
  };

  return (
    <div className="w-full min-h-screen bg-[#F5EDE0] flex flex-col pb-32">
      <header className="w-full sticky top-0 z-30 pt-6 pb-2 px-6">
        <div className="flex items-center justify-between w-full max-w-[480px] mx-auto text-[#3B1A1A]">
          <button onClick={() => onBack()} className="w-10 h-10 bg-[#E5DACB] rounded-full flex items-center justify-center active:scale-95 transition-transform">
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-[480px] mx-auto w-full flex-1 flex flex-col px-6 pt-4">
        <section className="mb-8">
          <h1 className="text-[26px] font-display font-black text-[#3B1A1A] uppercase tracking-tighter leading-none mb-2">
            NEW<br/>CUSTOMER
          </h1>
          <p className="text-sm font-bold text-[#6E463B]">
            Start a new credit record.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-6">
          <div className="flex flex-col items-center mb-2 relative">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full bg-[#E5DACB] border-4 border-[#F5EDE0] shadow-md flex items-center justify-center overflow-hidden relative group active:scale-95 transition-transform"
            >
              {photoUrl ? (
                <img src={photoUrl} alt="Capture" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-[#C8521A]" />
              )}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </button>
            <span className="text-xs font-bold text-[#6E463B] mt-2 uppercase tracking-widest font-display">
              {photoUrl ? "Change Photo" : "Add Photo"}
            </span>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef} 
              onChange={handleImageCapture} 
              className="hidden" 
            />
          </div>

          <div className="space-y-2">
            <label className="font-display font-bold text-xs text-[#C8521A] tracking-widest uppercase ml-1">
              Customer Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sipho Khumalo"
                required
                className="w-full h-12 pl-6 pr-6 bg-transparent border-b-2 border-[#C8521A] focus:border-[#3B1A1A] text-[#3B1A1A] text-base font-bold outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-display font-bold text-xs text-[#C8521A] tracking-widest uppercase ml-1">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="082 123 4567"
                className="w-full h-12 pl-6 pr-6 bg-transparent border-b-2 border-[#C8521A] focus:border-[#3B1A1A] text-[#3B1A1A] text-base font-bold outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-display font-bold text-xs text-[#C8521A] tracking-widest uppercase ml-1">
              Area / Address (Optional)
            </label>
            <div className="relative">
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Section A"
                className="w-full h-12 pl-6 pr-6 bg-transparent border-b-2 border-[#C8521A] focus:border-[#3B1A1A] text-[#3B1A1A] text-base font-bold outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-display font-bold text-xs text-[#C8521A] tracking-widest uppercase ml-1">
              Credit Limit (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#3B1A1A] font-black text-xl">
                R
              </span>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder={defaultLimit.toString()}
                className="w-full h-12 pl-12 pr-6 bg-transparent border-b-2 border-[#C8521A] focus:border-[#3B1A1A] text-[#3B1A1A] text-lg font-black outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-display font-bold text-xs text-[#C8521A] tracking-widest uppercase ml-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Always takes bread on Tuesdays."
              className="w-full p-4 bg-transparent border-2 border-[#C8521A] focus:border-[#3B1A1A] rounded-2xl text-[#3B1A1A] text-base font-bold outline-none transition-colors resize-none"
            />
          </div>

          <div className="bg-[#FFE5D8] rounded-3xl p-6 flex items-center gap-4 border border-[#F8B79B]">
            <div className="w-12 h-12 rounded-full bg-[#C8521A] flex items-center justify-center shrink-0">
              <Shield
                className="text-white w-6 h-6"
                fill="currentColor"
              />
            </div>
            <div>
              <h4 className="font-display font-bold text-[#3B1A1A] tracking-widest text-xs uppercase mb-1">
                Secure Data
              </h4>
              <p className="text-xs text-[#6E463B] font-bold leading-snug">
                Customer information is saved privately.
              </p>
            </div>
          </div>

          <div className="pt-8">
            <button
              type="submit"
              disabled={isSubmitting || isSuccess}
              className={`w-full h-14 rounded-full flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95
                    ${isSuccess ? "bg-[#196D31] text-white" : "bg-[#3B1A1A] text-[#F5EDE0] hover:opacity-90"}
                  `}
            >
              {isSubmitting ? (
                <>
                  <CheckCircle className="w-5 h-5 animate-pulse" />
                  <span className="text-base font-display font-black tracking-widest uppercase">Saving...</span>
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-base font-display font-black tracking-widest uppercase">Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span className="text-base font-display font-black tracking-widest uppercase">Save Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
