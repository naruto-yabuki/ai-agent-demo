import { InvoiceStatus, PaymentStatus, ApprovalStatus, Priority } from "@/types";

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  issued: "未処理",
  paid: "入金済み",
  auto_matched: "自動消込済み",
  name_variation_matched: "名義ゆれ確認済み",
  combined_payment_matched: "合算入金",
  partially_paid: "一部入金",
  overdue: "期日超過",
  discrepancy: "差額あり",
  pending_confirmation: "要確認",
  reminder_candidate: "督促候補",
  pending_sales_approval: "督促承認待ち",
  reminder_sent: "督促送付済み",
  sales_review: "営業確認中",
};

export const invoiceStatusColors: Record<InvoiceStatus, string> = {
  issued: "bg-slate-100 text-slate-600",
  paid: "bg-emerald-100 text-emerald-700",
  auto_matched: "bg-emerald-100 text-emerald-700",
  name_variation_matched: "bg-teal-100 text-teal-700",
  combined_payment_matched: "bg-cyan-100 text-cyan-700",
  partially_paid: "bg-amber-100 text-amber-700",
  overdue: "bg-red-100 text-red-700",
  discrepancy: "bg-amber-100 text-amber-700",
  pending_confirmation: "bg-amber-100 text-amber-700",
  reminder_candidate: "bg-orange-100 text-orange-700",
  pending_sales_approval: "bg-violet-100 text-violet-700",
  reminder_sent: "bg-blue-100 text-blue-700",
  sales_review: "bg-pink-100 text-pink-700",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  unmatched: "未照合",
  matched: "照合済み",
  name_variation_matched: "名義ゆれ照合",
  combined_payment_matched: "合算照合",
  partial_payment: "一部入金",
  discrepancy: "差額あり",
};

export const approvalStatusLabels: Record<ApprovalStatus, string> = {
  draft: "ドラフト",
  pending_sales_approval: "営業承認待ち",
  approved: "承認済み",
  rejected: "差し戻し",
  on_hold: "保留",
  sent: "送付済み",
};

export const approvalStatusColors: Record<ApprovalStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending_sales_approval: "bg-violet-100 text-violet-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-pink-100 text-pink-700",
  on_hold: "bg-amber-100 text-amber-700",
  sent: "bg-blue-100 text-blue-700",
};

export const priorityColors: Record<Priority, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-slate-100 text-slate-600",
};
