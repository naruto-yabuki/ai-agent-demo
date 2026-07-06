"use client";

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { AiLogEntry, Invoice, Payment, ProcessingLogLine, ProcessingSummary, Reminder } from "@/types";
import { initialInvoices } from "@/data/invoices";
import { initialPayments } from "@/data/payments";
import { customers } from "@/data/customers";
import { runDailyProcessing } from "@/lib/matchingEngine";
import { buildReminderDraft } from "@/lib/reminderTemplates";
import { TODAY_ISO } from "@/lib/constants";

interface AppState {
  invoices: Invoice[];
  payments: Payment[];
  reminders: Reminder[];
  processingLog: ProcessingLogLine[];
  summary: ProcessingSummary | null;
  aiHistory: AiLogEntry[];
  hasProcessedToday: boolean;
  isProcessing: boolean;

  runProcessing: () => void;
  setIsProcessing: (v: boolean) => void;
  requestSalesApproval: (reminderId: string) => void;
  approveReminder: (reminderId: string, approver: string) => void;
  holdReminder: (reminderId: string) => void;
  rejectReminder: (reminderId: string, comment?: string) => void;
  salesDirectContact: (reminderId: string) => void;
  setSalesComment: (reminderId: string, comment: string) => void;
  regenerateDraft: (reminderId: string) => void;
  markSent: (reminderId: string, approver: string) => void;
}

const AppStateContext = createContext<AppState | null>(null);

function makeHistoryTime(offsetMinutes: number): string {
  const totalMinutes = 9 * 60 + 30 + offsetMinutes;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${TODAY_ISO} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [processingLog, setProcessingLog] = useState<ProcessingLogLine[]>([]);
  const [summary, setSummary] = useState<ProcessingSummary | null>(null);
  const [aiHistory, setAiHistory] = useState<AiLogEntry[]>([]);
  const [hasProcessedToday, setHasProcessedToday] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const pushHistory = useCallback((entry: Omit<AiLogEntry, "id" | "timestamp"> & { minuteOffset: number }) => {
    setAiHistory((prev) => [
      {
        id: `HIST-${prev.length}-${crypto.randomUUID()}`,
        timestamp: makeHistoryTime(entry.minuteOffset),
        targetCustomer: entry.targetCustomer,
        targetInvoice: entry.targetInvoice,
        action: entry.action,
        judgment: entry.judgment,
        approver: entry.approver,
        finalAction: entry.finalAction,
        status: entry.status,
      },
      ...prev,
    ]);
  }, []);

  const runProcessing = useCallback(() => {
    const result = runDailyProcessing(invoices, payments, customers);
    setInvoices(result.invoices);
    setPayments(result.payments);
    setReminders(result.reminders);
    setProcessingLog(result.log);
    setSummary(result.summary);
    setHasProcessedToday(true);

    let offset = 0;
    result.reminders.forEach((r) => {
      const inv = result.invoices.find((i) => i.invoiceId === r.invoiceId);
      const custName = inv?.customerName ?? "";
      offset += 1;
      pushHistory({
        targetCustomer: custName,
        targetInvoice: r.invoiceId,
        action: "AIが未入金・支払期日超過を検知",
        judgment: inv?.aiJudgment,
        status: "督促候補",
        minuteOffset: offset,
      });
      offset += 1;
      pushHistory({
        targetCustomer: custName,
        targetInvoice: r.invoiceId,
        action: "AIが督促メール案を作成し営業承認待ちへ",
        judgment: r.aiRecommendation,
        status: "督促承認待ち",
        minuteOffset: offset,
      });
    });
  }, [invoices, payments, pushHistory]);

  const updateReminder = useCallback((reminderId: string, patch: Partial<Reminder>) => {
    setReminders((prev) => prev.map((r) => (r.reminderId === reminderId ? { ...r, ...patch } : r)));
  }, []);

  const updateInvoiceByReminder = useCallback(
    (reminderId: string, patch: Partial<Invoice>) => {
      setReminders((prevReminders) => {
        const reminder = prevReminders.find((r) => r.reminderId === reminderId);
        if (reminder) {
          setInvoices((prevInvoices) =>
            prevInvoices.map((inv) => (inv.invoiceId === reminder.invoiceId ? { ...inv, ...patch } : inv))
          );
        }
        return prevReminders;
      });
    },
    []
  );

  const requestSalesApproval = useCallback(
    (reminderId: string) => {
      updateReminder(reminderId, { approvalStatus: "pending_sales_approval" });
      updateInvoiceByReminder(reminderId, { status: "pending_sales_approval" });
      const reminder = reminders.find((r) => r.reminderId === reminderId);
      const inv = invoices.find((i) => i.invoiceId === reminder?.invoiceId);
      pushHistory({
        targetCustomer: inv?.customerName,
        targetInvoice: inv?.invoiceId,
        action: "営業担当へ承認依頼",
        approver: inv?.salesOwner,
        status: "督促承認待ち",
        minuteOffset: 60,
      });
    },
    [reminders, invoices, updateReminder, updateInvoiceByReminder, pushHistory]
  );

  const approveReminder = useCallback(
    (reminderId: string, approver: string) => {
      updateReminder(reminderId, {
        approvalStatus: "sent",
        approvedBy: approver,
        sentAt: TODAY_ISO,
      });
      updateInvoiceByReminder(reminderId, { status: "reminder_sent" });
      const reminder = reminders.find((r) => r.reminderId === reminderId);
      const inv = invoices.find((i) => i.invoiceId === reminder?.invoiceId);
      pushHistory({
        targetCustomer: inv?.customerName,
        targetInvoice: inv?.invoiceId,
        action: "営業担当が承認",
        approver,
        finalAction: "督促メール送付済み",
        status: "督促送付済み",
        minuteOffset: 61,
      });
    },
    [reminders, invoices, updateReminder, updateInvoiceByReminder, pushHistory]
  );

  const markSent = useCallback(
    (reminderId: string, approver: string) => {
      approveReminder(reminderId, approver);
    },
    [approveReminder]
  );

  const holdReminder = useCallback(
    (reminderId: string) => {
      updateReminder(reminderId, { approvalStatus: "on_hold" });
      const reminder = reminders.find((r) => r.reminderId === reminderId);
      const inv = invoices.find((i) => i.invoiceId === reminder?.invoiceId);
      pushHistory({
        targetCustomer: inv?.customerName,
        targetInvoice: inv?.invoiceId,
        action: "承認を保留",
        status: "保留",
        minuteOffset: 62,
      });
    },
    [reminders, invoices, updateReminder, pushHistory]
  );

  const rejectReminder = useCallback(
    (reminderId: string, comment?: string) => {
      updateReminder(reminderId, {
        approvalStatus: "rejected",
        salesComment: comment ?? reminders.find((r) => r.reminderId === reminderId)?.salesComment,
      });
      updateInvoiceByReminder(reminderId, { status: "sales_review" });
      const reminder = reminders.find((r) => r.reminderId === reminderId);
      const inv = invoices.find((i) => i.invoiceId === reminder?.invoiceId);
      pushHistory({
        targetCustomer: inv?.customerName,
        targetInvoice: inv?.invoiceId,
        action: "営業担当が差し戻し",
        judgment: comment,
        finalAction: "営業確認中へ変更",
        status: "営業確認中",
        minuteOffset: 63,
      });
    },
    [reminders, invoices, updateReminder, updateInvoiceByReminder, pushHistory]
  );

  const salesDirectContact = useCallback(
    (reminderId: string) => {
      updateReminder(reminderId, { responseStatus: "営業担当が直接連絡" });
      updateInvoiceByReminder(reminderId, { status: "sales_review" });
      const reminder = reminders.find((r) => r.reminderId === reminderId);
      const inv = invoices.find((i) => i.invoiceId === reminder?.invoiceId);
      pushHistory({
        targetCustomer: inv?.customerName,
        targetInvoice: inv?.invoiceId,
        action: "営業担当が顧客へ直接連絡",
        finalAction: "返信待ちにステータス変更",
        status: "営業確認中",
        minuteOffset: 64,
      });
    },
    [reminders, invoices, updateReminder, updateInvoiceByReminder, pushHistory]
  );

  const setSalesComment = useCallback(
    (reminderId: string, comment: string) => {
      updateReminder(reminderId, { salesComment: comment });
    },
    [updateReminder]
  );

  const regenerateDraft = useCallback(
    (reminderId: string) => {
      const reminder = reminders.find((r) => r.reminderId === reminderId);
      const inv = invoices.find((i) => i.invoiceId === reminder?.invoiceId);
      if (!reminder || !inv) return;
      const customer = customers.find((c) => c.customerId === inv.customerId);
      if (!customer) return;
      const draft = buildReminderDraft(inv, customer, reminder.reminderLevel);
      updateReminder(reminderId, { draftSubject: draft.subject, draftBody: draft.body });
      pushHistory({
        targetCustomer: inv.customerName,
        targetInvoice: inv.invoiceId,
        action: "督促メール文面を再生成",
        status: inv.status,
        minuteOffset: 65,
      });
    },
    [reminders, invoices, updateReminder, pushHistory]
  );

  const value = useMemo<AppState>(
    () => ({
      invoices,
      payments,
      reminders,
      processingLog,
      summary,
      aiHistory,
      hasProcessedToday,
      isProcessing,
      runProcessing,
      setIsProcessing,
      requestSalesApproval,
      approveReminder,
      holdReminder,
      rejectReminder,
      salesDirectContact,
      setSalesComment,
      regenerateDraft,
      markSent,
    }),
    [
      invoices,
      payments,
      reminders,
      processingLog,
      summary,
      aiHistory,
      hasProcessedToday,
      isProcessing,
      runProcessing,
      requestSalesApproval,
      approveReminder,
      holdReminder,
      rejectReminder,
      salesDirectContact,
      setSalesComment,
      regenerateDraft,
      markSent,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
