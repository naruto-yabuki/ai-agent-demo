"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Bot, FileText, CheckSquare, History, Building2 } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/process", label: "AI処理実行", icon: Bot },
  { href: "/invoices", label: "請求・入金一覧", icon: FileText },
  { href: "/approvals", label: "営業承認", icon: CheckSquare },
  { href: "/history", label: "AI対応履歴", icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-[var(--navy)] text-slate-100 flex flex-col">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20">
          <Building2 size={20} className="text-blue-300" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">売掛金回収AI Agent</p>
          <p className="text-[11px] text-slate-400 leading-tight">製造業向け営業デモ</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-white/10 text-[11px] text-slate-400">
        <p>ログイン中：経理担当 木村</p>
        <p className="mt-1">株式会社サンプル製作所</p>
      </div>
    </aside>
  );
}
