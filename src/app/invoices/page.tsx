"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { InvoiceStatusBadge } from "@/components/StatusBadge";
import { formatCurrency, daysBetween } from "@/lib/dateUtils";
import { TODAY_ISO } from "@/lib/constants";
import { Invoice } from "@/types";

const FILTERS = ["すべて", "入金済み", "未入金", "期日超過", "要確認", "督促候補", "営業確認中", "高額債権"] as const;
type FilterKey = (typeof FILTERS)[number];

function matchesFilter(inv: Invoice, filter: FilterKey): boolean {
  const outstanding = inv.amount - inv.paidAmount;
  switch (filter) {
    case "すべて":
      return true;
    case "入金済み":
      return ["paid", "auto_matched", "name_variation_matched", "combined_payment_matched"].includes(inv.status);
    case "未入金":
      return inv.status === "issued";
    case "期日超過":
      return outstanding > 0 && daysBetween(TODAY_ISO, inv.dueDate) > 0;
    case "要確認":
      return inv.status === "discrepancy" || inv.status === "partially_paid";
    case "督促候補":
      return ["reminder_candidate", "pending_sales_approval"].includes(inv.status);
    case "営業確認中":
      return inv.status === "sales_review";
    case "高額債権":
      return outstanding >= 3000000;
    default:
      return true;
  }
}

function InvoiceListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get("filter") as FilterKey) ?? "すべて";
  const { invoices, payments } = useAppState();
  const [filter, setFilter] = useState<FilterKey>(FILTERS.includes(initialFilter) ? initialFilter : "すべて");
  const [query, setQuery] = useState("");

  const paymentDateByInvoice = useMemo(() => {
    const map = new Map<string, string>();
    payments.forEach((p) => {
      p.matchedInvoiceIds.forEach((id) => map.set(id, p.paymentDate));
    });
    return map;
  }, [payments]);

  const filtered = useMemo(() => {
    return invoices
      .filter((inv) => matchesFilter(inv, filter))
      .filter((inv) => (query ? inv.customerName.includes(query) || inv.invoiceId.includes(query) : true))
      .sort((a, b) => a.invoiceId.localeCompare(b.invoiceId));
  }, [invoices, filter, query]);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">請求・入金一覧</h1>
        <p className="text-sm text-slate-500 mt-0.5">全{invoices.length}件中 {filtered.length}件を表示</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === f ? "bg-blue-600 text-white" : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="顧客名・請求番号で検索"
            className="rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <th className="px-4 py-3">請求番号</th>
              <th className="px-4 py-3">顧客名</th>
              <th className="px-4 py-3">請求日</th>
              <th className="px-4 py-3">支払期日</th>
              <th className="px-4 py-3 text-right">請求金額</th>
              <th className="px-4 py-3 text-right">入金金額</th>
              <th className="px-4 py-3 text-right">差額</th>
              <th className="px-4 py-3">入金日</th>
              <th className="px-4 py-3">ステータス</th>
              <th className="px-4 py-3">AI判定</th>
              <th className="px-4 py-3">推奨アクション</th>
              <th className="px-4 py-3">担当営業</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr
                key={inv.invoiceId}
                onClick={() => router.push(`/invoices/${inv.invoiceId}`)}
                className="border-b border-slate-100 last:border-0 hover:bg-blue-50/50 cursor-pointer"
              >
                <td className="px-4 py-3 font-medium text-blue-700">{inv.invoiceId}</td>
                <td className="px-4 py-3">{inv.customerName}</td>
                <td className="px-4 py-3 text-slate-500">{inv.invoiceDate}</td>
                <td className="px-4 py-3 text-slate-500">{inv.dueDate}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(inv.amount)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(inv.paidAmount)}</td>
                <td className="px-4 py-3 text-right">
                  {inv.amount - inv.paidAmount !== 0 ? formatCurrency(inv.amount - inv.paidAmount) : "—"}
                </td>
                <td className="px-4 py-3 text-slate-500">{paymentDateByInvoice.get(inv.invoiceId) ?? "—"}</td>
                <td className="px-4 py-3">
                  <InvoiceStatusBadge status={inv.status} />
                </td>
                <td className="px-4 py-3 text-slate-500 max-w-[220px] truncate" title={inv.aiJudgment}>
                  {inv.aiJudgment ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate" title={inv.recommendedAction}>
                  {inv.recommendedAction ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-500">{inv.salesOwner}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-center text-slate-400">
                  該当する請求がありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function InvoiceListPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400">読み込み中...</div>}>
      <InvoiceListContent />
    </Suspense>
  );
}
