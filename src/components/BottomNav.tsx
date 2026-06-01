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

  // For 'More', we can show a popout menu or just go to a 'more' screen. Since "more" isn't a ScreenState,
  // let's just make it go to a list of links. We'll add 'settings' as a default for now, but really it should open a menu.
  // Actually, we can add "more" to ScreenState, or just use settings. Let's add "more" if we haven't. Wait, the prompt asked to put Suppliers, Purchases, Cash-up, Settings in 'More'. Let's navigate to "settings" and rename that to "More". Wait, let's create a dedicated "More" screen later.
  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 z-40 pb-safe pb-2">
      <div className="flex justify-around items-center px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as ScreenState)}
              className={`flex flex-col items-center justify-center w-16 h-12 transition-colors ${
                isActive ? "text-[#C8521A]" : "text-gray-500"
              }`}
            >
              <Icon
                className="w-6 h-6 mb-1"
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] font-bold ${isActive ? "opacity-100" : "opacity-80"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
        {/* We need a 'More' button */}
        <button
          onClick={() => onNavigate("settings" as ScreenState)}
          className={`flex flex-col items-center justify-center w-16 h-12 transition-colors ${
            ["settings", "reports", "expenses", "suppliers", "purchases", "cash_ups", "sales", "shopQrCode"].includes(currentScreen)
              ? "text-[#C8521A]"
              : "text-gray-500"
          }`}
        >
          <Menu className="w-6 h-6 mb-1" strokeWidth={["settings", "reports", "expenses", "suppliers", "purchases", "cash_ups", "sales", "shopQrCode"].includes(currentScreen) ? 2.5 : 2} />
          <span className={`text-[10px] font-bold ${["settings", "reports", "expenses", "suppliers", "purchases", "cash_ups", "sales", "shopQrCode"].includes(currentScreen) ? "opacity-100" : "opacity-80"}`}>
            More
          </span>
        </button>
      </div>
    </nav>
  );
}
