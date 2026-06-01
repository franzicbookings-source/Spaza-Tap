import { Customer, Transaction, CreditEntry } from "./types";

// Format date into South African friendly string (e.g., "10 May 2026")
export function formatTxDate(dateStr: string): string {
  if (!dateStr) return "";
  // Check if it is already in a clean format
  if (dateStr.includes("Jan") || dateStr.includes("Feb") || dateStr.includes("Mar") || 
      dateStr.includes("Apr") || dateStr.includes("May") || dateStr.includes("Jun") || 
      dateStr.includes("Jul") || dateStr.includes("Aug") || dateStr.includes("Sep") || 
      dateStr.includes("Oct") || dateStr.includes("Nov") || dateStr.includes("Dec")) {
    return dateStr;
  }
  
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${day} ${months[monthIndex]} ${year}`;
    }
  }
  return dateStr;
}

// Compute days owing from an entry date to May 24, 2026 (the current local time), or fallback to current system date
export function calculateDaysOwingFrom(dateStr: string): number {
  if (!dateStr) return 0;
  
  // Parse dateStr (handles YYYY-MM-DD)
  const entryDate = new Date(dateStr + "T00:00:00");
  
  // For the scenario, we can use 2026-05-24 as "today"
  const today = new Date("2026-05-24T00:00:00");
  
  // If the browser current year is not 2026, or we want to compute dynamic offsets:
  // Let's check: if browser current date is newer than May 24, 2026, we can use current date as fallback.
  const actualToday = new Date();
  actualToday.setHours(0,0,0,0);
  
  // We use the scenario's reference date or actual date whichever is greater
  const referenceDate = actualToday.getTime() > today.getTime() ? actualToday : today;
  
  const diffTime = referenceDate.getTime() - entryDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

// Compute customer priority status badge
export function computeStatus(owed: number, days: number): "warning" | "serious" | "settled" | "none" {
  if (owed <= 0) return "settled";
  if (days >= 15) return "serious";
  if (days >= 8) return "warning";
  return "none"; // 'none' corresponds to "Good" in visual styling
}
