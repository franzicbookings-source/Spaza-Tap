import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  TrendingUp, 
  MousePointer, 
  Hourglass, 
  Activity, 
  Users, 
  RefreshCw, 
  Trash2, 
  Sparkles, 
  Monitor, 
  Clock, 
  Layout, 
  UserCheck,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { db } from "../lib/firebase";
import { collection, getDocs, deleteDoc, writeBatch } from "firebase/firestore";
import { TelemetryEvent } from "../types";

interface PlatformAnalyticsScreenProps {
  onBack: () => void;
  currentUserEmail?: string | null;
}

export default function PlatformAnalyticsScreen({ onBack, currentUserEmail }: PlatformAnalyticsScreenProps) {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "clicks" | "pages" | "live" | "ai_insights">("overview");
  const [isClearing, setIsClearing] = useState(false);

  // Fetch telemetry events
  const fetchTelemetryData = async () => {
    setIsLoading(true);
    try {
      const colRef = collection(db, "telemetry_events");
      const snap = await getDocs(colRef);
      const fetched: TelemetryEvent[] = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TelemetryEvent));

      // Sort in-memory to prevent index errors in FireStore
      fetched.sort((a, b) => {
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
        return timeB - timeA; // Descending
      });

      setEvents(fetched);
    } catch (e) {
      console.error("Error fetching telemetry events:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetryData();
  }, []);

  // Handle clearing telemetry events
  const handleClearAllEvents = async () => {
    if (!window.confirm("Are you sure you want to clear all telemetry events? This will reset the platform owner dashboard.")) {
      return;
    }
    setIsClearing(true);
    try {
      const colRef = collection(db, "telemetry_events");
      const snap = await getDocs(colRef);
      const batch = writeBatch(db);
      snap.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setEvents([]);
      alert("Telemetry clear-out completed!");
    } catch (e) {
      console.error("Error clearing telemetry:", e);
      alert("Failed to clear telemetry events.");
    } finally {
      setIsClearing(false);
    }
  };

  // 1. Core aggregates
  const totalEvents = events.length;
  const clicks = events.filter(e => e.eventType === "click");
  const pageViews = events.filter(e => e.eventType === "page_view");
  const actions = events.filter(e => e.eventType === "action");

  // Unique users tracking
  const uniqueUsers = Array.from(new Set(events.map(e => e.userEmail || e.userId))).filter(Boolean) as string[];

  // Role distribution
  const rolesCount = events.reduce((acc, e) => {
    const role = e.userRole || "guest";
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Page views popularity count
  const pagePopularity = pageViews.reduce((acc, e) => {
    acc[e.page] = (acc[e.page] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedPages = (Object.entries(pagePopularity) as [string, number][])
    .sort((a, b) => b[1] - a[1]);

  // Page duration averages
  const pageDurations = pageViews.reduce((acc, e) => {
    if (e.duration) {
      if (!acc[e.page]) acc[e.page] = { total: 0, count: 0 };
      acc[e.page].total += e.duration;
      acc[e.page].count += 1;
    }
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const averageDurations = (Object.entries(pageDurations) as [string, { total: number; count: number }][]).map(([page, data]) => ({
    page,
    average: Math.round(data.total / data.count),
    total: data.total,
    count: data.count
  })).sort((a, b) => b.average - a.average);

  // Button Click counts
  const clickPopularity = clicks.reduce((acc, e) => {
    const key = `${e.page}||${e.elementText || e.elementId || "Unknown"}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedClicks = (Object.entries(clickPopularity) as [string, number][])
    .map(([key, count]) => {
      const [page, label] = key.split("||");
      return { page, label, count };
    })
    .sort((a, b) => b.count - a.count);

  // Generate actionable system intelligence suggestions based on actual analytics
  const getAISuggestions = () => {
    const suggestions = [];

    // Suggestion 1: Check Till utilization
    const tillViews = pagePopularity["till"] || 0;
    const dashboardViews = pagePopularity["dashboard"] || 0;
    if (tillViews > 0 && dashboardViews > 0) {
      if (tillViews / dashboardViews > 0.5) {
        suggestions.push({
          type: "UI Optimisation",
          title: "Speed up high-frequency point of sale checkout",
          desc: "The 'Till' is visited frequently. Consider adding hotkey shortcuts, smart scanner integrations, or default fast-checkout cash buttons on this screen.",
          impact: "High"
        });
      }
    }

    // Suggestion 2: User Role Insights
    const shopOwnerEvents = rolesCount["shop_owner"] || 0;
    const customerEvents = rolesCount["customer"] || 0;
    if (customerEvents > shopOwnerEvents * 1.5) {
      suggestions.push({
        type: "Growth Opportunity",
        title: "Active customer participation detected",
        desc: "Customers are using the application more actively than shop owners. Increase engagement by offering self-checkout payments and QR code cash-up reminders.",
        impact: "Medium"
      });
    } else if (shopOwnerEvents > 0 && customerEvents === 0) {
      suggestions.push({
        type: "Conversion Block",
        title: "Low customer login and profile link ratios",
        desc: "No customer interaction events were tracked inside customer accounts. Prompt shop owners to share their shop QR codes using WhatsApp templates to invite customer links.",
        impact: "High"
      });
    }

    // Suggestion 3: Long page stay duration checks
    const longStayPages = averageDurations.filter(p => p.average > 90);
    if (longStayPages.length > 0) {
      suggestions.push({
        type: "Usability Friction",
        title: `Explore high retention screens: ${longStayPages[0].page}`,
        desc: `Users are staying an average of ${longStayPages[0].average}s on the '${longStayPages[0].page}' screen. Validate if the layout is complex or if they are waiting for load operations.`,
        impact: "Medium"
      });
    }

    // Default general suggestions if insufficient data
    if (suggestions.length < 2) {
      suggestions.push({
        type: "Platform Security",
        title: "Deploy role locking mechanisms",
        desc: "Protect portal endpoints. Ensure store owner log-ins refuse customer logins immediately (Implemented fully).",
        impact: "High"
      });
      suggestions.push({
        type: "Telemetry Strategy",
        title: "Add real-time update push hooks",
        desc: "Log click flows across core features (Promos, Till adjustments, Cash-Up) to build a funnel map.",
        impact: "Medium"
      });
    }

    return suggestions;
  };

  const aiSuggestions = getAISuggestions();

  return (
    <div className="w-full min-h-screen bg-[#F5EDE0] flex flex-col pb-24 font-sans text-[#3B1A1A]">
      <header className="w-full pt-12 pb-6 px-4 md:px-8 border-b border-[#3B1A1A]/10 bg-[#F5EDE0] sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2.5 rounded-full hover:bg-black/5 active:scale-95 transition-transform"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-[#3B1A1A]" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-[#C8521A] text-white font-display font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Platform Admin
                </span>
                {currentUserEmail === "franzic.bookings@gmail.com" ? (
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Verified Creator
                  </span>
                ) : (
                  <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Simulator Demo Mode
                  </span>
                )}
              </div>
              <h1 className="text-xl md:text-3xl font-display font-black tracking-tight uppercase mt-0.5">
                Website Owner Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={fetchTelemetryData}
              disabled={isLoading}
              className="p-2.5 bg-white border border-[#E8D0BB] hover:bg-slate-50 text-[#3B1A1A] rounded-xl flex items-center gap-1.5 active:scale-95 transition-all text-xs font-bold disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={handleClearAllEvents}
              disabled={isClearing || events.length === 0}
              className="p-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all text-xs font-bold disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
              Reset Datastores
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-4 md:px-8 mt-6 flex-1 flex flex-col gap-6">
        {/* Key Platform Stats Metrics Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E5DACB] p-5 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden group">
            <div className="absolute right-3 top-3 w-8 h-8 rounded-full bg-[#F5EDE0] flex items-center justify-center">
              <Activity className="w-4 h-4 text-[#C8521A]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Logged Interaction Events</p>
              <h3 className="text-2xl md:text-3xl font-display font-black text-[#C8521A] mt-1 tracking-tight">
                {isLoading ? "..." : totalEvents}
              </h3>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 font-mono">Clicks, screen entries & updates</p>
          </div>

          <div className="bg-white border border-[#E5DACB] p-5 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden">
            <div className="absolute right-3 top-3 w-8 h-8 rounded-full bg-[#F5EDE0] flex items-center justify-center">
              <Users className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active App Visitors</p>
              <h3 className="text-2xl md:text-3xl font-display font-black text-[#3B1A1A] mt-1 tracking-tight">
                {isLoading ? "..." : uniqueUsers.length}
              </h3>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 font-mono">Unique email / user identities</p>
          </div>

          <div className="bg-white border border-[#E5DACB] p-5 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden">
            <div className="absolute right-3 top-3 w-8 h-8 rounded-full bg-[#F5EDE0] flex items-center justify-center">
              <MousePointer className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Button Clicks</p>
              <h3 className="text-2xl md:text-3xl font-display font-black text-[#3B1A1A] mt-1 tracking-tight">
                {isLoading ? "..." : clicks.length}
              </h3>
            </div>
            <p className="text-[10px] text-emerald-600 font-bold mt-2">
              {totalEvents > 0 ? `${Math.round((clicks.length / totalEvents) * 100)}%` : "0%"} of interaction streams
            </p>
          </div>

          <div className="bg-white border border-[#E5DACB] p-5 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden">
            <div className="absolute right-3 top-3 w-8 h-8 rounded-full bg-[#F5EDE0] flex items-center justify-center">
              <Hourglass className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Session Duration</p>
              <h3 className="text-2xl md:text-3xl font-display font-black text-[#3B1A1A] mt-1 tracking-tight">
                {isLoading ? "..." : `${Math.round(pageViews.reduce((sum, e) => sum + (e.duration || 0), 0) / 60)}m`}
              </h3>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 font-mono">Aggregated active screentime</p>
          </div>
        </section>

        {/* Tab Selection Row */}
        <section className="flex border-b border-[#E5DACB] gap-1 overflow-x-auto pb-1">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs shrink-0 transition-all ${activeTab === "overview" ? 'bg-white border-t border-x border-[#E5DACB] text-[#C8521A]' : 'text-gray-500 hover:text-[#3B1A1A]'}`}
          >
            Dashboard Overview
          </button>
          <button 
            onClick={() => setActiveTab("clicks")}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs shrink-0 transition-all ${activeTab === "clicks" ? 'bg-white border-t border-x border-[#E5DACB] text-[#C8521A]' : 'text-gray-500 hover:text-[#3B1A1A]'}`}
          >
            Button Clicks ({clicks.length})
          </button>
          <button 
            onClick={() => setActiveTab("pages")}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs shrink-0 transition-all ${activeTab === "pages" ? 'bg-white border-t border-x border-[#E5DACB] text-[#C8521A]' : 'text-gray-500 hover:text-[#3B1A1A]'}`}
          >
            Page Views & Stay times
          </button>
          <button 
            onClick={() => setActiveTab("live")}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs shrink-0 transition-all relative ${activeTab === "live" ? 'bg-white border-t border-x border-[#E5DACB] text-[#C8521A]' : 'text-gray-500 hover:text-[#3B1A1A]'}`}
          >
            Live Stream Feed
            {events.length > 0 && (
              <span className="absolute -top-1 right-1 w-2 h-2 rounded-full bg-[#C8521A] animate-ping" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab("ai_insights")}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs shrink-0 transition-all flex items-center gap-1 ${activeTab === "ai_insights" ? 'bg-white border-t border-x border-[#E5DACB] text-violet-700' : 'text-gray-500 hover:text-[#3B1A1A]'}`}
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-500 fill-violet-200" />
            Platform Recommendations ({aiSuggestions.length})
          </button>
        </section>

        {/* Content Panel Area */}
        <section className="bg-white border border-[#E5DACB] rounded-3xl p-6 shadow-sm flex-1 min-h-[350px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="w-8 h-8 text-[#C8521A] animate-spin" />
              <p className="text-xs font-bold text-gray-400">Loading user interactions metrics...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
              <Layout className="w-12 h-12 text-[#E5DACB] mb-3" />
              <h4 className="font-display font-black text-sm uppercase">No Telemetry Events Collected Yet</h4>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Start navigating through screens like Till, Stock, Customers, Settings, or click buttons to record real-time telemetry instantly!
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Page Popularity Chart */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-display font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <Monitor className="w-4 h-4 text-orange-500" /> Popular Screens Heatmap
                      </h4>
                      <div className="space-y-2.5">
                        {sortedPages.slice(0, 5).map(([page, count], i) => {
                          const maxCount = sortedPages[0][1] || 1;
                          const ratio = (count / maxCount) * 100;
                          return (
                            <div key={page} className="space-y-1">
                              <div className="flex justify-between text-xs font-bold">
                                <span className="capitalize">{page} Screen</span>
                                <span className="text-gray-500 font-mono">{count} visits</span>
                              </div>
                              <div className="w-full bg-[#F5EDE0] rounded-full h-2.5 overflow-hidden">
                                <div 
                                  className="bg-[#C8521A] h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${ratio}%` }} 
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Users Identity Directory & Roles */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-display font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-orange-500" /> Platform Role Ratio
                      </h4>
                      
                      {/* Interactive Bar Chart for Roles */}
                      <div className="bg-[#F5EDE0]/30 border border-[#E5DACB]/50 rounded-2xl p-4 space-y-3">
                        {(Object.entries(rolesCount) as [string, number][]).map(([role, count]) => {
                          const percentage = Math.round((count / totalEvents) * 100);
                          return (
                            <div key={role} className="flex justify-between items-center text-xs">
                              <span className="font-extrabold capitalize flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${role === 'shop_owner' ? 'bg-[#C8521A]' : role === 'customer' ? 'bg-[#3B1A1A]' : 'bg-gray-400'}`} />
                                {role === 'shop_owner' ? 'Shop Owners' : role === 'customer' ? 'Customers' : 'Guests / Unregistered'}
                              </span>
                              <span className="font-mono font-bold text-gray-600 bg-white px-2.5 py-1 border border-[#E5DACB] rounded-lg">
                                {count} logs ({percentage}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Display visitor identities summary */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Recent User Identities</p>
                        <div className="flex flex-wrap gap-1.5">
                          {uniqueUsers.slice(0, 8).map((user, i) => (
                            <span 
                              key={i} 
                              className="text-[10px] bg-[#F5EDE0] text-[#3B1A1A] px-2 py-1 rounded-full border border-[#E5DACB] font-mono select-all font-bold"
                            >
                              {user.length > 20 ? `${user.substring(0, 16)}...` : user}
                            </span>
                          ))}
                          {uniqueUsers.length > 8 && (
                            <span className="text-[10px] bg-slate-100 text-gray-500 px-2 py-1 rounded-full border border-slate-200 font-bold">
                              +{uniqueUsers.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operational Activities Funnel Map */}
                  <div className="bg-[#3B1A1A] text-[#F5EDE0] p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-[#C8521A]" />
                        <h4 className="text-xs font-display font-bold uppercase tracking-widest text-[#C8521A]">Verified Integration Funnels</h4>
                      </div>
                      <p className="text-xl font-display font-black uppercase">Role Locked Secure Login</p>
                      <p className="text-xs text-[#F5EDE0]/80 leading-relaxed max-w-lg">
                        Protective redirection successfully prevents Shop Owners and Customers from signing in via improper portals with explicit, descriptive validation error responses.
                      </p>
                    </div>
                    <div className="border border-[#F5EDE0]/25 bg-black/10 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-mono shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      SECURE PORTALS SIGN-ON ACTIVE
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BUTTON CLICKS */}
              {activeTab === "clicks" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-[#E5DACB] pb-3">
                    <h3 className="font-display font-black text-sm uppercase">Most Interacted Interactive Elements</h3>
                    <p className="text-xs text-gray-500">Tracked clicks is the ultimate measure of feature demand</p>
                  </div>

                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {sortedClicks.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No clicks logs registered yet.</p>
                    ) : (
                      sortedClicks.slice(0, 15).map((item, index) => {
                        const maxCount = sortedClicks[0].count;
                        const percentage = Math.round((item.count / clicks.length) * 100);
                        return (
                          <div key={index} className="flex flex-col gap-1 p-3.5 bg-slate-50 border border-slate-100 rounded-xl relative overflow-hidden group">
                            {/* Horizontal progress background bar */}
                            <div 
                              className="absolute left-0 bottom-0 top-0 bg-emerald-500/5 transition-all duration-300"
                              style={{ width: `${(item.count / maxCount) * 100}%` }}
                            />
                            
                            <div className="flex justify-between items-center text-xs relative z-10">
                              <div className="flex flex-col text-left">
                                <span className="font-black text-[#C8521A] text-sm group-hover:underline">
                                  "{item.label}"
                                </span>
                                <span className="text-[10px] text-gray-400 mt-0.5 capitalize font-mono">
                                  Clicked on: {item.page} Screen
                                </span>
                              </div>
                              <div className="text-right font-mono flex items-center gap-2">
                                <span className="font-extrabold text-slate-800">{item.count} clicks</span>
                                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md font-bold">
                                  {percentage}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: PAGE STAY DURATIONS */}
              {activeTab === "pages" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-[#E5DACB] pb-3">
                    <h3 className="font-display font-black text-sm uppercase">Page Engagement Analysis</h3>
                    <p className="text-xs text-gray-500 font-mono">Measure user flow & exit rates by retention times</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {averageDurations.map((item, index) => (
                      <div key={index} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-white border border-[#E5DACB] rounded-lg flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4 text-indigo-500" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-xs capitalize text-slate-800">{item.page} Screen</h4>
                            <p className="text-[9px] text-gray-400 mt-0.5 font-mono">Based on {item.count} sample duration snapshots</p>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end">
                          <span className="text-base font-display font-black text-indigo-600">{item.average}s</span>
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Avg duration</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: LIVE FEED STREAM */}
              {activeTab === "live" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-[#E5DACB] pb-3">
                    <h3 className="font-display font-black text-sm uppercase">Recent Action Streams Feed</h3>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" /> Real-time tracking
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[400px] overflow-y-auto">
                    {events.slice(0, 30).map((e) => {
                      const dateStr = e.timestamp?.toMillis ? new Date(e.timestamp.toMillis()).toLocaleTimeString() : "Just Now";
                      
                      return (
                        <div key={e.id} className="bg-[#F5EDE0]/30 border border-[#E5DACB]/40 rounded-xl p-3 flex justify-between items-center gap-4 hover:border-[#E5DACB] transition-colors">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              e.eventType === 'click' ? 'bg-emerald-400' : e.eventType === 'page_view' ? 'bg-indigo-400' : 'bg-orange-400'
                            }`} />
                            
                            <div className="flex flex-col text-left">
                              <p className="text-xs font-extrabold text-[#3B1A1A]">
                                {e.eventType === 'click' ? (
                                  <>Clicked <span className="text-[#C8521A]">"{e.elementText}"</span> item</>
                                ) : e.eventType === 'page_view' ? (
                                  <>Entered <span className="capitalize text-slate-800 font-bold">{e.page} Screen</span> ({e.duration || 0}s)</>
                                ) : (
                                  <>Action: <span className="font-bold text-slate-900">{e.page}</span></>
                                )}
                              </p>
                              <span className="text-[9px] text-gray-400 mt-0.5">
                                User: {e.userEmail || "Anonymous"} | Role: <span className="font-bold capitalize">{e.userRole || "Guest"}</span>
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-500 font-mono font-bold bg-white px-2 py-0.5 border border-slate-2500 rounded-md">
                              {dateStr}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: PLATFORM INTELLIGENCE */}
              {activeTab === "ai_insights" && (
                <div className="space-y-5">
                  <div className="border-b border-[#E5DACB] pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-500" />
                      <h3 className="font-display font-black text-sm uppercase text-[#3B1A1A]">
                        Heuristical System Recommendations
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-violet-700 bg-violet-100 rounded px-2 py-0.5 uppercase tracking-wider">
                      Analytics-Driven Log Agent
                    </span>
                  </div>

                  <div className="space-y-4">
                    {aiSuggestions.map((sug, i) => (
                      <div key={i} className="bg-violet-50/50 border border-violet-100 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-violet-700 uppercase tracking-widest block">
                            {sug.type}
                          </span>
                          <h4 className="font-display font-black text-sm text-violet-950 uppercase">
                            {sug.title}
                          </h4>
                          <p className="text-xs text-violet-800 leading-relaxed max-w-xl">
                            {sug.desc}
                          </p>
                        </div>

                        <div className="shrink-0">
                          <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl block text-center ${
                            sug.impact === 'High' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}>
                            {sug.impact} Impact
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
