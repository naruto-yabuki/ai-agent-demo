"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { Play, ListChecks, AlertCircle, Wallet, Banknote, Clock3, Percent, Timer } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import KpiCard from "@/components/KpiCard";
import { formatCurrency, daysBetween } from "@/lib/dateUtils";
import { TODAY_ISO } from "@/lib/constants";

const PIE_COLORS = ["#10b981", "#94a3b8", "#f59e0b", "#ef4444"];

export default function DashboardPage() {
  const router = useRouter();
  const { invoices, summary, hasProcessedToday } = useAppState();

  const metrics = useMemo(() => {
    const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidTotal = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const unpaidTotal = totalBilled - paidTotal;
    const overdueTotal = invoices
      .filter((inv) => ["reminder_candidate", "pending_sales_approval", "reminder_sent", "sales_review"].includes(inv.status))
      .reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0);
    const needsReviewCount = invoices.filter((inv) => inv.status === "discrepancy" || inv.status === "partially_paid").length;
    const reminderCandidateCount = invoices.filter((inv) =>
      ["reminder_candidate", "pending_sales_approval", "sales_review"].includes(inv.status)
    ).length;

    const autoRate = summary
      ? Math.round(
          ((summary.autoMatched + summary.nameVariationMatched + summary.combinedMatched) /
            Math.max(
              1,
              summary.autoMatched +
                summary.nameVariationMatched +
                summary.combinedMatched +
                summary.discrepancy +
                summary.partialPayment +
                summary.overdue
            )) *
            100
        )
      : null;

    const savedMinutes = summary
      ? (summary.autoMatched + summary.nameVariationMatched + summary.combinedMatched) * 8 +
        (summary.discrepancy + summary.partialPayment) * 12 +
        summary.overdue * 15
      : 0;

    return { totalBilled, paidTotal, unpaidTotal, overdueTotal, needsReviewCount, reminderCandidateCount, autoRate, savedMinutes };
  }, [invoices, summary]);

  const pieData = useMemo(() => {
    const paid = invoices
      .filter((inv) => ["paid", "auto_matched", "name_variation_matched", "combined_payment_matched"].includes(inv.status))
      .reduce((s, i) => s + i.amount, 0);
    const discrepancy = invoices
      .filter((inv) => inv.status === "discrepancy" || inv.status === "partially_paid")
      .reduce((s, i) => s + i.amount, 0);
    const overdue = invoices
      .filter((inv) => ["reminder_candidate", "pending_sales_approval", "reminder_sent", "sales_review"].includes(inv.status))
      .reduce((s, i) => s + i.amount, 0);
    const unpaid = invoices.filter((inv) => inv.status === "issued").reduce((s, i) => s + i.amount, 0);
    return [
      { name: "入金済み", value: paid },
      { name: "未処理", value: unpaid },
      { name: "差異あり", value: discrepancy },
      { name: "期日超過", value: overdue },
    ].filter((d) => d.value > 0);
  }, [invoices]);

  const delayBucketData = useMemo(() => {
    const buckets = { "1〜7日": 0, "8〜14日": 0, "15〜30日": 0, "30日超": 0 };
    invoices.forEach((inv) => {
      if (inv.paidAmount >= inv.amount) return;
      const delay = daysBetween(TODAY_ISO, inv.dueDate);
      if (delay <= 0) return;
      if (delay <= 7) buckets["1〜7日"] += 1;
      else if (delay <= 14) buckets["8〜14日"] += 1;
      else if (delay <= 30) buckets["15〜30日"] += 1;
      else buckets["30日超"] += 1;
    });
    return Object.entries(buckets).map(([name, count]) => ({ name, count }));
  }, [invoices]);

  const customerRanking = useMemo(() => {
    const map = new Map<string, number>();
    invoices.forEach((inv) => {
      const outstanding = inv.amount - inv.paidAmount;
      if (outstanding <= 0) return;
      map.set(inv.customerName, (map.get(inv.customerName) ?? 0) + outstanding);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [invoices]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">売掛金回収ダッシュボード</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {hasProcessedToday ? `本日 ${TODAY_ISO} の入金確認は実行済みです` : `本日 ${TODAY_ISO} の入金確認はまだ実行されていません`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/process")}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Play size={16} />
            本日の入金確認を実行
          </button>
          <button
            onClick={() => router.push("/approvals")}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ListChecks size={16} />
            督促候補を確認
          </button>
          <button
            onClick={() => router.push("/invoices?filter=要確認")}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <AlertCircle size={16} />
            要確認リストを見る
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="今月請求総額" value={formatCurrency(metrics.totalBilled)} icon={Wallet} />
        <KpiCard label="入金済み金額" value={formatCurrency(metrics.paidTotal)} tone="positive" icon={Banknote} />
        <KpiCard label="未入金金額" value={formatCurrency(metrics.unpaidTotal)} tone="warning" icon={Clock3} />
        <KpiCard label="期日超過金額" value={formatCurrency(metrics.overdueTotal)} tone="danger" icon={AlertCircle} />
        <KpiCard
          label="自動消込率"
          value={metrics.autoRate === null ? "—" : `${metrics.autoRate}%`}
          sub={metrics.autoRate === null ? "未実行" : "本日の処理結果"}
          icon={Percent}
        />
        <KpiCard label="要確認件数" value={`${metrics.needsReviewCount}件`} tone="warning" icon={AlertCircle} />
        <KpiCard label="督促候補件数" value={`${metrics.reminderCandidateCount}件`} tone="danger" icon={ListChecks} />
        <KpiCard
          label="AIによる削減見込み時間"
          value={summary ? `約${Math.round(metrics.savedMinutes / 60)}時間/月` : "—"}
          sub="自動消込・督促作成による見込み"
          icon={Timer}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-2">入金ステータス別の金額内訳</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {pieData.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-2">遅延日数別の未入金件数</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={delayBucketData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-2">顧客別未入金金額ランキング</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={customerRanking} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(v / 10000)}万`} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
