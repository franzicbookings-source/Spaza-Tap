import React from "react";
import { 
  Store, 
  ShoppingCart,
  Package,
  Users, 
  Settings, 
  PieChart, 
  LogOut, 
  QrCode, 
  UserPlus, 
  FileText,
  DollarSign,
  Truck,
  CreditCard,
  Archive
} from "lucide-react";
import { ScreenState } from "../types";

interface DesktopSidebarProps {
  currentScreen: ScreenState;
  onNavigate: (screen: ScreenState) => void;
  onLogout: () => void;
  shopName: string;
}

export default function DesktopSidebar({ currentScreen, onNavigate, onLogout, shopName }: DesktopSidebarProps) {
  const navItems = [
    { id: "dashboard" as ScreenState, label: "Home", icon: Store },
    { id: "till" as ScreenState, label: "Till / POS", icon: ShoppingCart },
    { id: "sales" as ScreenState, label: "Sales", icon: DollarSign },
    { id: "stock" as ScreenState, label: "Stock", icon: Package },
    { id: "customers" as ScreenState, label: "Customers", icon: Users },
    { id: "expenses" as ScreenState, label: "Expenses", icon: CreditCard },
    { id: "reports" as ScreenState, label: "Reports", icon: PieChart },
  ];

  const moreItems = [
    { id: "suppliers" as ScreenState, label: "Suppliers", icon: Truck },
    { id: "purchases" as ScreenState, label: "Purchases", icon: Archive },
    { id: "cash_ups" as ScreenState, label: "Cash-Up", icon: DollarSign },
    { id: "settings" as ScreenState, label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#3B1A1A] text-[#F5EDE0] flex-col justify-between hidden md:flex min-h-screen sticky top-0 shrink-0 border-r border-[#E5DACB] overflow-y-auto">
      <div>
        <div className="p-6 pb-8 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-transparent shrink-0">
              <img 
                src="https://i.ibb.co/6RphB5Y1/152733-removebg-preview.png" 
                alt="Spaza Tap Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="font-display font-black text-xl tracking-tight leading-none uppercase">Cwebezela</span>
          </div>
          <p className="text-[10px] font-mono text-white/50 tracking-wider">LEDGER &bull; SP</p>
        </div>

        <div className="p-4 space-y-1">
          <p className="px-4 text-[10px] font-display font-black text-white/40 tracking-wider uppercase mb-2">Main Menu</p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                currentScreen === item.id 
                  ? "bg-[#C8521A] text-white shadow-md font-bold" 
                  : "text-white/70 hover:bg-white/10 hover:text-white font-medium"
              }`}
            >
              <item.icon className={`w-5 h-5 ${currentScreen === item.id ? "opacity-100" : "opacity-70"}`} />
              <span className="text-sm font-display tracking-wide">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4 space-y-1 pt-0">
          <p className="px-4 text-[10px] font-display font-black text-white/40 tracking-wider uppercase mb-2">More</p>
          {moreItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                currentScreen === item.id 
                  ? "bg-[#C8521A] text-white shadow-md font-bold" 
                  : "text-white/70 hover:bg-white/10 hover:text-white font-medium"
              }`}
            >
              <item.icon className={`w-5 h-5 ${currentScreen === item.id ? "opacity-100" : "opacity-70"}`} />
              <span className="text-sm font-display tracking-wide">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="px-4 mt-2 mb-4">
           <p className="px-4 text-[10px] font-display font-black text-white/40 tracking-wider uppercase mb-2">Quick Actions</p>
           <button
              onClick={() => onNavigate("newCustomer")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-white/70 hover:bg-white/10 hover:text-white font-medium"
            >
              <UserPlus className="w-5 h-5 opacity-70" />
              <span className="text-sm font-display tracking-wide">Add Customer</span>
            </button>
            <button
              onClick={() => onNavigate("shopQrCode")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-white/70 hover:bg-white/10 hover:text-white font-medium"
            >
              <QrCode className="w-5 h-5 opacity-70" />
              <span className="text-sm font-display tracking-wide">Show Shop QR</span>
            </button>
            <button
              onClick={() => onNavigate("customerAccessRequests")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-white/70 hover:bg-white/10 hover:text-white font-medium"
            >
              <FileText className="w-5 h-5 opacity-70" />
              <span className="text-sm font-display tracking-wide">Access Requests</span>
            </button>
        </div>
      </div>

      <div className="p-4 border-t border-white/10 mt-auto">
        <div className="px-4 py-3 mb-2 flex flex-col">
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Logged in as</span>
          <span className="text-sm font-bold text-white truncate">{shopName}</span>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-white/70 hover:bg-white/10 hover:text-white font-medium"
        >
          <LogOut className="w-5 h-5 opacity-70" />
          <span className="text-sm font-display tracking-wide">Log Out</span>
        </button>
      </div>
    </aside>
  );
}
