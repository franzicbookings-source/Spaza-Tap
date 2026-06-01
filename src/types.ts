export type ScreenState =
  | "welcome"
  | "dashboard"
  | "promos"
  | "sales"
  | "till"
  | "stock"
  | "expenses"
  | "suppliers"
  | "purchases"
  | "cash_ups"
  | "customers"
  | "customerProfile"
  | "addCredit"
  | "newCustomer"
  | "reports"
  | "settings"
  | "customerDashboard"
  | "shopQrCode"
  | "customerJoin"
  | "customerRequestStatus"
  | "customerAccessRequests"
  | "hub"
  | "emergency"
  | "municipality"
  | "govSupport"
  | "compliance"
  | "tax"
  | "businessReg"
  | "documents"
  | "reminders"
  | "incidents"
  | "foodSafety"
  | "funding"
  | "helpAppChecklist"
  | "alerts"
  | "officialProfile"
  | "priceWatch"
  | "platform_analytics";

export interface TelemetryEvent {
  id: string;
  userId?: string;
  userEmail?: string;
  userRole?: "shop_owner" | "customer" | "guest" | string;
  eventType: "page_view" | "click" | "action";
  page: string;
  elementId?: string;
  elementText?: string;
  duration?: number; // duration in seconds
  timestamp: any;
  deviceInfo?: {
    userAgent: string;
    screenWidth: number;
    screenHeight: number;
    language: string;
  };
}

export interface WholesalePrice {
  id: string;
  shopId: string;
  ownerUserId: string;
  itemName: string;
  supplierName: string;
  price: number;
  unit: string;
  dateObserved: string;
}

export interface ShopUpdate {
  id: string;
  shopId: string;
  ownerUserId: string;
  title: string;
  message: string;
  targetGroup: "all" | "paid" | "owing";
  createdAt: any;
}

export interface Customer {
  id?: string;
  name: string;
  initials: string;
  phone: string;
  owed: number;
  daysOwing: number;
  status: "warning" | "serious" | "settled" | "none" | string;
  area?: string;
  limit?: number;
  notes?: string;
  lastActivity?: string;
  photoUrl?: string;
  linkedCustomerUserId?: string;
  customerReferenceNumber?: string;
  creditStatus?: "active" | "paused";
}

export interface Transaction {
  id: string;
  customerId: string;
  type: "credit" | "payment";
  amount: number;
  date: string;
  description: string;
  balanceAfter: number;
}

export interface CreditEntry {
  id: string;
  customerId: string;
  amount: number;
  remaining: number;
  date: string; // "YYYY-MM-DD"
  description: string;
}

export interface Account {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  pin: string;
  defaultLimit: number;
  whatsappTemplate: string;
  shopCode?: string;
  joinLink?: string;
  
  // Official Shop Profile Fields
  ownerEmail?: string;
  shopAddress?: string;
  town?: string;
  localMunicipality?: string;
  districtMunicipality?: string;
  province?: string;
  wardNumber?: string;
  businessRegistrationNumber?: string;
  taxNumber?: string;
  tradingPermitNumber?: string;
  supportFundReferenceNumber?: string;
  emergencyContactPerson?: string;
  emergencyContactNumber?: string;
  nearestPoliceStation?: string;
  nearestClinic?: string;
  municipalAccountNumber?: string;
  businessType?: string;
  shopPhotos?: string[];
  operatingHours?: string;
  numberOfEmployees?: number;
  mainProductsSold?: string;
}

export interface CustomerAccessRequest {
  id: string;
  shopId: string;
  shopOwnerUserId: string;
  customerUserId: string;
  customerName: string;
  customerPhoneNumber: string;
  customerEmail: string;
  status: "pending" | "approved" | "rejected";
  linkedCustomerId?: string; // empty unless approved
  createdAt: any;
  updatedAt: any;
}

export interface Product {
  id: string;
  shopId: string;
  ownerUserId: string;
  name: string;
  category: string;
  buyingPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockLevel: number;
  barcode?: string;
  sku?: string;
  notes?: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Sale {
  id: string;
  shopId: string;
  ownerUserId: string;
  customerId?: string;
  saleDate: string; // ISO string 
  paymentMethod: "cash" | "card" | "credit";
  subtotal: number;
  totalAmount: number;
  totalCost: number;
  grossProfit: number;
  saleType: "normal_sale" | "credit_sale";
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface SaleItem {
  id: string;
  shopId: string;
  ownerUserId: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitSellingPrice: number;
  unitBuyingPrice: number;
  lineTotal: number;
  lineCost: number;
  lineProfit: number;
  createdAt: any;
}

export interface Expense {
  id: string;
  shopId: string;
  ownerUserId: string;
  expenseDate: string;
  category: string;
  amount: number;
  description: string;
  paymentMethod: string;
  supplierId?: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Supplier {
  id: string;
  shopId: string;
  ownerUserId: string;
  supplierName: string;
  name: string;
  contactPerson?: string;
  contactName?: string;
  phoneNumber?: string;
  phone?: string;
  whatsappNumber?: string;
  productsSupplied?: string;
  address?: string;
  notes?: string;
  amountOwed: number;
  status: "active" | "inactive";
  createdAt: any;
  updatedAt: any;
}

export interface Purchase {
  id: string;
  shopId: string;
  ownerUserId: string;
  supplierId: string;
  purchaseDate: string;
  totalCost: number;
  amountPaid: number;
  amountOwed: number;
  paymentStatus: "paid" | "partially_paid" | "unpaid";
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface PurchaseItem {
  id: string;
  shopId: string;
  ownerUserId: string;
  purchaseId: string;
  productId: string;
  productName: string;
  quantityPurchased: number;
  buyingPricePerItem: number;
  totalCost: number;
  createdAt: any;
}

export interface CashUp {
  id: string;
  shopId: string;
  ownerUserId: string;
  cashUpDate: string;
  date: string;
  openingCash: number;
  cashSales: number;
  cashCustomerPayments: number;
  cashExpenses: number;
  expectedCash: number;
  actualCash: number;
  difference: number;
  status: "balanced" | "over" | "short";
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface EmergencyContact {
  id: string;
  shopId: string;
  ownerUserId: string;
  serviceName: string;
  phoneNumber: string;
  area: string;
  category: string;
  notes?: string;
  isDefault: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface MunicipalityContact {
  id: string;
  shopId: string;
  ownerUserId: string;
  town: string;
  localMunicipality: string;
  districtMunicipality: string;
  municipalPhone?: string;
  waterFaultPhone?: string;
  electricityFaultPhone?: string;
  sewerFaultPhone?: string;
  wastePhone?: string;
  tradingPermitPhone?: string;
  healthInspectionPhone?: string;
  wardCouncillorName?: string;
  wardCouncillorPhone?: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface GovernmentSupportRecord {
  id: string;
  shopId: string;
  ownerUserId: string;
  programmeName: string;
  departmentOrOrganisation: string;
  description?: string;
  eligibilityNotes?: string;
  documentsRequired?: string;
  applicationStatus: "Not Started" | "Preparing Documents" | "Applied" | "Waiting for Feedback" | "Follow Up" | "Approved" | "Rejected" | "Closed";
  referenceNumber?: string;
  dateApplied?: string;
  followUpDate?: string;
  contactPerson?: string;
  contactNumber?: string;
  websiteLink?: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface ComplianceChecklist {
  id: string;
  shopId: string;
  ownerUserId: string;
  itemTitle: string;
  itemDescription?: string;
  status: "Not Started" | "In Progress" | "Done" | "Not Applicable";
  notes?: string;
  reminderDate?: string;
  documentUrl?: string;
  createdAt: any;
  updatedAt: any;
}

export interface TaxRecord {
  id: string;
  shopId: string;
  ownerUserId: string;
  sarsRegistered: "yes" | "no" | "in progress";
  taxNumber?: string;
  businessType?: string;
  monthlyTurnoverEstimate?: number;
  yearlyTurnoverEstimate?: number;
  accountantName?: string;
  accountantPhone?: string;
  taxNotes?: string;
  nextReminderDate?: string;
  createdAt: any;
  updatedAt: any;
}

export interface BusinessRegistrationRecord {
  id: string;
  shopId: string;
  ownerUserId: string;
  registrationStatus: "Not Registered" | "In Progress" | "Registered";
  businessName?: string;
  registrationNumber?: string;
  businessType?: string;
  ownerName?: string;
  businessAddress?: string;
  registrationDate?: string;
  annualReturnReminderDate?: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface ShopDocument {
  id: string;
  shopId: string;
  ownerUserId: string;
  documentName: string;
  category: "Business Registration" | "Trading Permit" | "Tax" | "Supplier" | "Municipality" | "Proof of Address" | "Identity Document" | "Rental" | "Health / Food Safety" | "Funding Support" | "Banking" | "Incident" | "Other";
  fileUrl: string;
  uploadDate: string;
  expiryDate?: string;
  reminderDate?: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface RenewalReminder {
  id: string;
  shopId: string;
  ownerUserId: string;
  title: string;
  category: "Trading permit renewal" | "Business annual return" | "Tax submission" | "Municipal account" | "Rent" | "Supplier payment" | "Health inspection" | "Funding application follow-up" | "Document expiry" | "SARS follow-up" | "Support programme follow-up" | "Food safety check" | "Incident follow-up" | "Municipal fault follow-up";
  dueDate: string;
  repeatOption: "none" | "monthly" | "yearly";
  linkedDocumentId?: string;
  linkedSupportRecordId?: string;
  notes?: string;
  status: "Upcoming" | "Due Soon" | "Overdue" | "Done";
  createdAt: any;
  updatedAt: any;
}

export interface IncidentReport {
  id: string;
  shopId: string;
  ownerUserId: string;
  incidentDate: string;
  incidentType: "Theft" | "Robbery attempt" | "Stock damage" | "Power outage" | "Water outage" | "Sewer issue" | "Supplier issue" | "Customer dispute" | "Municipal issue" | "Health inspection visit" | "Fire risk" | "Staff issue" | "Other";
  description: string;
  photoUrls?: string[];
  actionTaken?: string;
  policeCaseNumber?: string;
  municipalReferenceNumber?: string;
  insuranceReferenceNumber?: string;
  followUpDate?: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface FoodSafetyCheck {
  id: string;
  shopId: string;
  ownerUserId: string;
  checkDate: string;
  completedItems: string[];
  missedItems: string[];
  notes?: string;
  completedBy?: string;
  status: "Not Started" | "In Progress" | "Completed" | "Missed";
  createdAt: any;
  updatedAt: any;
}

export interface FundingReadinessItem {
  id: string;
  shopId: string;
  ownerUserId: string;
  itemTitle: string;
  status: "Missing" | "Ready" | "Submitted" | "Not Applicable";
  scoreValue: number;
  notes?: string;
  linkedDocumentId?: string;
  createdAt: any;
  updatedAt: any;
}

export interface HelpApplicationChecklist {
  id: string;
  shopId: string;
  ownerUserId: string;
  itemTitle: string;
  status: "Missing" | "Ready" | "Submitted" | "Not Applicable";
  notes?: string;
  documentUrl?: string;
  reminderDate?: string;
  createdAt: any;
  updatedAt: any;
}

export interface ImportantAlert {
  id: string;
  shopId: string;
  ownerUserId: string;
  alertTitle: string;
  alertType: "Municipal notice" | "Permit renewal" | "Support programme deadline" | "Funding application deadline" | "Water interruption" | "Electricity issue" | "Safety warning" | "Supplier issue" | "Tax deadline" | "Document expiry" | "Food safety reminder" | "Incident follow-up" | "Cash-up issue" | "Stock issue";
  alertDate: string;
  description: string;
  actionRequired?: string;
  linkedReminderId?: string;
  status: "New" | "Seen" | "Action Needed" | "Done";
  priority: "Low" | "Medium" | "High" | "Urgent";
  createdAt: any;
  updatedAt: any;
}

