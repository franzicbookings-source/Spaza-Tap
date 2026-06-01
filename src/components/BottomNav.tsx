import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Menu,
} from "lucide-react";
import { ScreenState } from "../types";

interface BottomNavProps {
  currentScreen: ScreenState;
  onNavigate: (screen: ScreenState) => void;
}

export default function BottomNav({
  currentScreen,
  onNavigate,
}: BottomNavProps) {
  const navItems = [
    { id: "dashboard", label: "Home", icon: LayoutDashboard },
    { id: "till", label: "Till", icon: ShoppingCart },
    { id: "stock", label: "Stock", icon: Package },
    { id: "customers", label: "Customers", icon: Users },
  ];

  const isMoreActive = ["settings", "reports", "expenses", "suppliers", "purchases", "cash_ups", "sales", "shopQrCode", "platform_analytics"].includes(currentScreen);

  return (
    <nav className="w-full h-[76px] bg-white border-t border-[#2B1114]/8 rounded-t-[28px] shadow-[0_-8px_30px_rgba(43,17,20,0.06)] flex flex-col justify-center">
      <div className="flex justify-between items-center px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as ScreenState)}
              className="flex flex-col items-center justify-center transition-all duration-300 relative group py-1"
            >
              <div 
                className={`flex flex-col items-center justify-center rounded-2xl px-3 py-1.5 transition-all duration-200 ${
                  isActive 
                    ? "bg-[#FFF0E7] text-[#D94F12] scale-102" 
                    : "text-[#756766] hover:text-[#2B1114]"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`}
                />
                <span className="text-[10px] font-extrabold tracking-wide mt-0.5 leading-none">
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#D94F12]" />
                )}
              </div>
            </button>
          );
        })}
        
        {/* More button */}
        <button
          onClick={() => onNavigate("settings" as ScreenState)}
          className="flex flex-col items-center justify-center transition-all duration-300 relative group py-1"
        >
          <div 
            className={`flex flex-col items-center justify-center rounded-2xl px-3 py-1.5 transition-all duration-200 ${
              isMoreActive 
                ? "bg-[#FFF0E7] text-[#D94F12] scale-102" 
                : "text-[#756766] hover:text-[#2B1114]"
            }`}
          >
            <Menu className={`w-5 h-5 ${isMoreActive ? "stroke-[2.5]" : "stroke-2"}`} />
            <span className="text-[10px] font-extrabold tracking-wide mt-0.5 leading-none">
              More
            </span>
            {isMoreActive && (
              <span className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#D94F12]" />
            )}
          </div>
        </button>
      </div>
    </nav>
  );
}
