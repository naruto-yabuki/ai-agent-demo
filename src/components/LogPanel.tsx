"use client";

import { useEffect, useRef } from "react";
import { ProcessingLogLine } from "@/types";
import { Terminal } from "lucide-react";

export default function LogPanel({ lines, title = "AI処理ログ" }: { lines: ProcessingLogLine[]; title?: string }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines.length]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-[var(--navy)] text-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <Terminal size={16} className="text-emerald-400" />
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 font-mono text-xs">
        {lines.length === 0 && <p className="text-slate-500">処理待機中...</p>}
        {lines.map((line) => (
          <div key={line.id} className="flex gap-2 animate-[fadeIn_0.2s_ease-in]">
            <span className="text-slate-500 shrink-0">{line.time}</span>
            <span className="text-emerald-300">›</span>
            <span className="text-slate-200">{line.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
