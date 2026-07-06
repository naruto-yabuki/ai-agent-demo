"use client";

import { useState } from "react";
import { useAppState } from "@/context/AppStateContext";

export default function HistoryPage() {
  const { aiHistory } = useAppState();
  const [query, setQuery] = useState("");

  const filtered = aiHistory.filter((h) =>
    query ? (h.targetCustomer ?? "").includes(query) || (h.targetInvoice ?? "").includes(query) : true
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">AI対応履歴</h1>
          <p className="text-sm text-slate-500 mt-0.5">AIがいつ、何を判断し、誰が承認したかを追跡できます</p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="顧客名・請求番号で検索"
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <th className="px-4 py-3">日時</th>
              <th className="px-4 py-3">対象顧客</th>
              <th className="px-4 py-3">対象請求</th>
              <th className="px-4 py-3">AI処理内容</th>
              <th className="px-4 py-3">AI判断</th>
              <th className="px-4 py-3">承認者</th>
              <th className="px-4 py-3">最終アクション</th>
              <th className="px-4 py-3">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((h) => (
              <tr key={h.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{h.timestamp}</td>
                <td className="px-4 py-3">{h.targetCustomer ?? "—"}</td>
                <td className="px-4 py-3 text-blue-700 font-medium">{h.targetInvoice ?? "—"}</td>
                <td className="px-4 py-3 text-slate-700">{h.action}</td>
                <td className="px-4 py-3 text-slate-500 max-w-[260px] truncate" title={h.judgment}>
                  {h.judgment ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-500">{h.approver ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">{h.finalAction ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">{h.status ?? "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  まだ履歴がありません。「AI処理実行」を行うと記録されます。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
