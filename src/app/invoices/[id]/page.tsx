"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, RefreshCcw, CheckCircle2, PauseCircle, Undo2, Send } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { customers } from "@/data/customers";
import { InvoiceStatusBadge, ApprovalStatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { formatCurrency, daysBetween } from "@/lib/dateUtils";
import { TODAY_ISO } from "@/lib/constants";

const CURRENT_USER = "経理担当 木村";

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    invoices,
    payments,
    reminders,
    requestSalesApproval,
    approveReminder,
    holdReminder,
    rejectReminder,
    regenerateDraft,
    markSent,
  } = useAppState();
  const [comment, setComment] = useState("");

  const invoice = invoices.find((inv) => inv.invoiceId === params.id);
  const customer = customers.find((c) => c.customerId === invoice?.customerId);
  const reminder = reminders.find((r) => r.invoiceId === params.id);
  const relatedPayment = payments.find((p) => p.matchedInvoiceIds.includes(params.id));

  const pastReminders = useMemo(
    () => reminders.filter((r) => r.customerId === invoice?.customerId && r.reminderId !== reminder?.reminderId),
    [reminders, invoice, reminder]
  );

  if (!invoice || !customer) {
    return (
      <div className="p-6">
        <p className="text-slate-500">請求が見つかりませんでした。</p>
        <button onClick={() => router.push("/invoices")} className="mt-3 text-blue-600 text-sm font-medium">
          一覧に戻る
        </button>
      </div>
    );
  }

  const delayDays = daysBetween(TODAY_ISO, invoice.dueDate);

  return (
    <div className="p-6 space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/invoices")} className="rounded-lg border border-slate-300 bg-white p-2 hover:bg-slate-50">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{invoice.invoiceId}</h1>
            <p className="text-sm text-slate-500">{invoice.customerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <InvoiceStatusBadge status={invoice.status} />
          {invoice.priority && <PriorityBadge priority={invoice.priority} />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-3">顧客情報</p>
          <dl className="space-y-2 text-sm">
            <Row label="顧客名" value={customer.customerName} />
            <Row label="顧客コード" value={customer.customerId} />
            <Row label="経理担当者名" value={customer.billingContactName} />
            <Row label="経理担当者メールアドレス" value={customer.billingContactEmail} />
            <Row label="営業担当者" value={customer.salesOwner} />
            <Row label="取引開始日" value={customer.customerSince} />
            <Row label="過去12ヶ月の支払遅延回数" value={`${customer.pastDelayCount}回`} />
            <Row label="顧客重要度" value={customer.customerImportance} />
            <Row label="備考" value={customer.notes} />
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-3">請求情報</p>
          <dl className="space-y-2 text-sm">
            <Row label="請求番号" value={invoice.invoiceId} />
            <Row label="請求日" value={invoice.invoiceDate} />
            <Row label="支払期日" value={invoice.dueDate} />
            <Row label="請求金額" value={formatCurrency(invoice.amount)} />
            <Row label="入金金額" value={formatCurrency(invoice.paidAmount)} />
            <Row label="差額" value={formatCurrency(invoice.amount - invoice.paidAmount)} />
            <Row label="遅延日数" value={delayDays > 0 ? `${delayDays}日` : "期日内"} />
            <Row label="関連受注番号" value={invoice.orderId} />
            <Row label="関連納品番号" value={invoice.deliveryId} />
            {relatedPayment && <Row label="入金元(振込名義)" value={relatedPayment.payerName} />}
          </dl>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-700 mb-3">AI判断</p>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <Row label="現在の状態" value={<InvoiceStatusBadge status={invoice.status} />} />
          <Row label="遅延理由の推定" value={invoice.aiJudgment ?? "処理待ち"} />
          <Row label="督促可否の推奨" value={reminder ? reminder.aiRecommendation : "対象外"} />
          <Row label="推奨アクション" value={invoice.recommendedAction ?? "—"} />
        </dl>
        {invoice.aiReason && (
          <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">判断根拠：{invoice.aiReason}</p>
        )}
      </section>

      {reminder ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">督促メール案</p>
            <ApprovalStatusBadge status={reminder.approvalStatus} />
          </div>

          <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
            AI推奨：{reminder.aiRecommendation} — {reminder.aiReason}
          </div>

          <dl className="space-y-2 text-sm">
            <Row label="件名" value={reminder.draftSubject} />
            <Row label="宛先" value={reminder.recipientEmail} />
            <Row label="CC" value={reminder.ccEmail ?? "なし"} />
            <Row label="添付想定" value="なし（本文のみ）" />
            <Row
              label="トーン"
              value={
                reminder.reminderLevel === "first_reminder"
                  ? "柔らかい確認トーン"
                  : reminder.reminderLevel === "second_reminder"
                  ? "支払予定日確認を明確に依頼"
                  : "上長CC・営業責任者確認を促すトーン"
              }
            />
            <Row label="送付タイミング" value="承認後、即時送付" />
          </dl>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm whitespace-pre-wrap font-mono text-slate-700">
            {reminder.draftBody}
          </div>

          {reminder.salesComment && (
            <div className="rounded-lg bg-pink-50 px-3 py-2 text-xs text-pink-800">
              営業コメント：{reminder.salesComment}
            </div>
          )}
          {reminder.approvedBy && (
            <p className="text-xs text-slate-500">承認者：{reminder.approvedBy}（{reminder.sentAt}）</p>
          )}

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            <ActionButton icon={Mail} label="営業に確認依頼" onClick={() => requestSalesApproval(reminder.reminderId)} />
            <ActionButton
              icon={CheckCircle2}
              label="督促メールを承認"
              tone="primary"
              onClick={() => approveReminder(reminder.reminderId, CURRENT_USER)}
              disabled={reminder.approvalStatus === "sent"}
            />
            <ActionButton icon={RefreshCcw} label="文面を再生成" onClick={() => regenerateDraft(reminder.reminderId)} />
            <ActionButton icon={PauseCircle} label="保留" onClick={() => holdReminder(reminder.reminderId)} />
            <ActionButton icon={Undo2} label="差し戻し" onClick={() => rejectReminder(reminder.reminderId, comment)} />
            <ActionButton
              icon={Send}
              label="送付済みにする"
              onClick={() => markSent(reminder.reminderId, CURRENT_USER)}
              disabled={reminder.approvalStatus === "sent"}
            />
          </div>

          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="差し戻し時のコメント（任意）"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
          この請求はまだ督促対象ではありません（未処理、または支払期日内です）。
        </section>
      )}

      {pastReminders.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-3">この顧客の過去の督促履歴</p>
          <ul className="space-y-2 text-sm">
            {pastReminders.map((r) => (
              <li key={r.reminderId} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                <span className="text-slate-600">{r.invoiceId} — {r.draftSubject}</span>
                <ApprovalStatusBadge status={r.approvalStatus} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500 shrink-0">{label}</dt>
      <dd className="text-slate-800 text-right">{value}</dd>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  tone = "default",
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  tone?: "default" | "primary";
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        tone === "primary"
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
