"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Circle, ListChecks, AlertCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { runDailyProcessing } from "@/lib/matchingEngine";
import { customers } from "@/data/customers";
import LogPanel from "@/components/LogPanel";
import { ProcessingLogLine, ProcessingSummary } from "@/types";

const STEP_LABELS = [
  "銀行明細を取得中",
  "請求一覧を取得中",
  "顧客マスタを参照中",
  "入金名義のゆらぎを補正中",
  "請求データと入金データを照合中",
  "自動消込可能な入金を登録中",
  "差異・例外を抽出中",
  "未入金・遅延債権を検知中",
  "督促候補を作成中",
];

const TOTAL_DURATION_MS = 4500;

export default function ProcessPage() {
  const router = useRouter();
  const { invoices, payments, runProcessing, hasProcessedToday, processingLog, summary } = useAppState();

  const [displayLog, setDisplayLog] = useState<ProcessingLogLine[]>([]);
  const [displaySummary, setDisplaySummary] = useState<ProcessingSummary | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startedRef = useRef(false);

  const animate = (log: ProcessingLogLine[], finalSummary: ProcessingSummary) => {
    setIsRunning(true);
    setDisplayLog([]);
    setDisplaySummary(null);
    setStepIndex(0);

    const lineDelay = Math.max(150, TOTAL_DURATION_MS / Math.max(1, log.length));
    let lineCount = 0;
    const lineTimer = setInterval(() => {
      lineCount += 1;
      setDisplayLog(log.slice(0, lineCount));
      if (lineCount >= log.length) {
        clearInterval(lineTimer);
        setDisplaySummary(finalSummary);
        setIsRunning(false);
      }
    }, lineDelay);

    const stepDelay = TOTAL_DURATION_MS / STEP_LABELS.length;
    let step = 0;
    const stepTimer = setInterval(() => {
      step += 1;
      setStepIndex(step);
      if (step >= STEP_LABELS.length) clearInterval(stepTimer);
    }, stepDelay);
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!hasProcessedToday) {
      const result = runDailyProcessing(invoices, payments, customers);
      runProcessing();
      animate(result.log, result.summary);
    } else {
      setDisplayLog(processingLog);
      setDisplaySummary(summary);
      setStepIndex(STEP_LABELS.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const replay = () => {
    if (processingLog.length === 0 || !summary) return;
    animate(processingLog, summary);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">AI処理実行</h1>
          <p className="text-sm text-slate-500 mt-0.5">銀行明細・請求データ・顧客マスタを横断して自動消込と督促候補の抽出を行います</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={15} />
            ダッシュボードへ戻る
          </button>
          <button
            onClick={replay}
            disabled={isRunning || processingLog.length === 0}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <RotateCcw size={15} />
            処理ログを再生
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-3">処理ステップ</p>
          <ol className="space-y-2.5">
            {STEP_LABELS.map((label, i) => {
              const done = i < stepIndex;
              const active = i === stepIndex && isRunning;
              return (
                <li key={label} className="flex items-center gap-2.5 text-sm">
                  {done ? (
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  ) : active ? (
                    <Loader2 size={18} className="text-blue-500 shrink-0 animate-spin" />
                  ) : (
                    <Circle size={18} className="text-slate-300 shrink-0" />
                  )}
                  <span className={done ? "text-slate-500 line-through" : active ? "text-blue-700 font-semibold" : "text-slate-400"}>
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="mt-4">
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${Math.round((stepIndex / STEP_LABELS.length) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500 text-right">
              完了率 {Math.round((stepIndex / STEP_LABELS.length) * 100)}%
            </p>
          </div>
        </div>

        <div className="lg:col-span-3 h-[420px]">
          <LogPanel lines={displayLog} />
        </div>
      </div>

      {displaySummary && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-4">自動消込結果</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ResultTile label="自動消込完了" value={displaySummary.autoMatched} tone="positive" />
            <ResultTile label="名義ゆれ補正で消込" value={displaySummary.nameVariationMatched} tone="positive" />
            <ResultTile label="複数請求の合算入金として消込" value={displaySummary.combinedMatched} tone="positive" />
            <ResultTile label="差額あり" value={displaySummary.discrepancy} tone="warning" />
            <ResultTile label="一部入金" value={displaySummary.partialPayment} tone="warning" />
            <ResultTile label="未入金・期日超過" value={displaySummary.overdue} tone="danger" />
            <ResultTile label="人間確認が必要" value={displaySummary.needsHumanReview} tone="danger" />
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => router.push("/invoices?filter=要確認")}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <AlertCircle size={16} />
              要確認リストを見る
            </button>
            <button
              onClick={() => router.push("/approvals")}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ListChecks size={16} />
              督促候補を確認
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultTile({ label, value, tone }: { label: string; value: number; tone: "positive" | "warning" | "danger" }) {
  const toneStyles = {
    positive: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
  } as const;
  return (
    <div className={`rounded-lg p-3 ${toneStyles[tone]}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}件</p>
    </div>
  );
}
