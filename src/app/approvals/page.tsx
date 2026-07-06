"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, PauseCircle, Undo2, PhoneCall, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { customers } from "@/data/customers";
import { ApprovalStatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { formatCurrency, daysBetween } from "@/lib/dateUtils";
import { TODAY_ISO } from "@/lib/constants";
import { ApprovalStatus } from "@/types";

const TABS: { key: ApprovalStatus | "all"; label: string }[] = [
  { key: "pending_sales_approval", label: "承認待ち" },
  { key: "on_hold", label: "保留中" },
  { key: "sent", label: "送付済み" },
  { key: "rejected", label: "差し戻し" },
  { key: "all", label: "すべて" },
];

const CURRENT_USER = "経理担当 木村";

export default function ApprovalsPage() {
  const router = useRouter();
  const { invoices, reminders, approveReminder, holdReminder, rejectReminder, salesDirectContact, setSalesComment } = useAppState();
  const [tab, setTab] = useState<ApprovalStatus | "all">("pending_sales_approval");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const list = useMemo(() => {
    return reminders
      .filter((r) => (tab === "all" ? true : r.approvalStatus === tab))
      .map((r) => {
        const invoice = invoices.find((i) => i.invoiceId === r.invoiceId);
        const customer = customers.find((c) => c.customerId === r.customerId);
        return { reminder: r, invoice, customer };
      })
      .filter((x) => x.invoice && x.customer)
      .sort((a, b) => {
        const order = { High: 0, Medium: 1, Low: 2 };
        const pa = a.invoice?.priority ?? "Low";
        const pb = b.invoice?.priority ?? "Low";
        return order[pa] - order[pb];
      });
  }, [reminders, invoices, tab]);

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">営業承認</h1>
        <p className="text-sm text-slate-500 mt-0.5">督促メール送付前に、営業担当が顧客関係上の問題有無を確認します</p>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.key ? "bg-blue-600 text-white" : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {list.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-400">
            該当する督促案件はありません
          </div>
        )}

        {list.map(({ reminder, invoice, customer }) => {
          if (!invoice || !customer) return null;
          const outstanding = invoice.amount - invoice.paidAmount;
          const delayDays = daysBetween(TODAY_ISO, invoice.dueDate);
          const isOpen = expanded === reminder.reminderId;

          return (
            <div key={reminder.reminderId} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{customer.customerName}</p>
                    {invoice.priority && <PriorityBadge priority={invoice.priority} />}
                    <ApprovalStatusBadge status={reminder.approvalStatus} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {invoice.invoiceId} ・ 未入金 {formatCurrency(outstanding)} ・ 遅延{delayDays}日 ・ 担当営業：{customer.salesOwner}
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/invoices/${invoice.invoiceId}`)}
                  className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline shrink-0"
                >
                  請求詳細 <ExternalLink size={12} />
                </button>
              </div>

              <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
                <span className="font-semibold">AI推奨：{reminder.aiRecommendation}</span>　{reminder.aiReason}
              </div>

              {customer.notes && (
                <p className="mt-2 text-xs text-slate-500">過去の顧客対応メモ：{customer.notes}</p>
              )}

              <button
                onClick={() => setExpanded(isOpen ? null : reminder.reminderId)}
                className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                督促メール案を{isOpen ? "閉じる" : "見る"}
              </button>

              {isOpen && (
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                  <p className="font-semibold text-slate-700">{reminder.draftSubject}</p>
                  <p className="mt-1 whitespace-pre-wrap font-mono text-slate-600">{reminder.draftBody}</p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <ApprovalActionButton
                  icon={CheckCircle2}
                  label="承認"
                  tone="primary"
                  disabled={reminder.approvalStatus === "sent"}
                  onClick={() => approveReminder(reminder.reminderId, `${customer.salesOwner}（営業）`)}
                />
                <ApprovalActionButton icon={PauseCircle} label="保留" onClick={() => holdReminder(reminder.reminderId)} />
                <ApprovalActionButton
                  icon={Undo2}
                  label="差し戻し"
                  onClick={() => rejectReminder(reminder.reminderId, drafts[reminder.reminderId])}
                />
                <ApprovalActionButton
                  icon={PhoneCall}
                  label="営業が直接連絡する"
                  onClick={() => salesDirectContact(reminder.reminderId)}
                />
                <input
                  value={drafts[reminder.reminderId] ?? reminder.salesComment ?? ""}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [reminder.reminderId]: e.target.value }))}
                  onBlur={(e) => setSalesComment(reminder.reminderId, e.target.value)}
                  placeholder="コメントを入力"
                  className="flex-1 min-w-[160px] rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ApprovalActionButton({
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
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        tone === "primary" ? "bg-blue-600 text-white hover:bg-blue-700" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}
