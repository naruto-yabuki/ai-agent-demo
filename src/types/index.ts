export type CustomerImportance = "High" | "Medium" | "Low";

export interface Customer {
  customerId: string;
  customerName: string;
  customerNameKana: string;
  billingContactName: string;
  billingContactEmail: string;
  salesOwner: string;
  paymentTerms: string;
  closingDate: string;
  paymentDueRule: string;
  customerImportance: CustomerImportance;
  pastDelayCount: number;
  notes: string;
  customerSince: string;
}

export type InvoiceStatus =
  | "issued"
  | "paid"
  | "auto_matched"
  | "name_variation_matched"
  | "combined_payment_matched"
  | "partially_paid"
  | "overdue"
  | "discrepancy"
  | "pending_confirmation"
  | "reminder_candidate"
  | "pending_sales_approval"
  | "reminder_sent"
  | "sales_review";

export type Priority = "High" | "Medium" | "Low";

export interface Invoice {
  invoiceId: string;
  customerId: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  taxIncludedAmount: number;
  status: InvoiceStatus;
  orderId: string;
  deliveryId: string;
  salesOwner: string;
  invoiceDeliveryMethod: string;
  portalRequired: boolean;
  paidAmount: number;
  aiJudgment?: string;
  aiReason?: string;
  recommendedAction?: string;
  priority?: Priority;
}

export type PaymentStatus =
  | "unmatched"
  | "matched"
  | "name_variation_matched"
  | "combined_payment_matched"
  | "partial_payment"
  | "discrepancy";

export interface Payment {
  paymentId: string;
  paymentDate: string;
  payerName: string;
  amount: number;
  bankAccount: string;
  matchedInvoiceIds: string[];
  matchingConfidence: number;
  status: PaymentStatus;
}

export type ReminderLevel = "first_reminder" | "second_reminder" | "escalation";

export type ApprovalStatus =
  | "draft"
  | "pending_sales_approval"
  | "approved"
  | "rejected"
  | "on_hold"
  | "sent";

export interface Reminder {
  reminderId: string;
  invoiceId: string;
  customerId: string;
  reminderLevel: ReminderLevel;
  draftSubject: string;
  draftBody: string;
  recipientEmail: string;
  ccEmail?: string;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  sentAt?: string;
  nextActionDate?: string;
  responseStatus?: string;
  aiRecommendation: string;
  aiReason: string;
  requiresSalesApproval: boolean;
  salesComment?: string;
}

export interface AiLogEntry {
  id: string;
  timestamp: string;
  targetCustomer?: string;
  targetInvoice?: string;
  action: string;
  judgment?: string;
  approver?: string;
  finalAction?: string;
  status?: string;
}

export interface ProcessingLogLine {
  id: string;
  time: string;
  text: string;
}

export interface ProcessingSummary {
  autoMatched: number;
  nameVariationMatched: number;
  combinedMatched: number;
  discrepancy: number;
  partialPayment: number;
  overdue: number;
  needsHumanReview: number;
}
