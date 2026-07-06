import { Payment } from "@/types";

// 銀行明細（未照合の状態）。「本日の入金確認を実行」でマッチングエンジンが処理する。
export const initialPayments: Payment[] = [
  // シナリオ1：完全一致
  {
    paymentId: "P001",
    paymentDate: "2026-07-06",
    payerName: "関東精密工業株式会社",
    amount: 1250000,
    bankAccount: "普通 1234567",
    matchedInvoiceIds: [],
    matchingConfidence: 0,
    status: "unmatched",
  },
  // シナリオ2：名義ゆれ
  {
    paymentId: "P002",
    paymentDate: "2026-07-06",
    payerName: "ｱｵﾊﾞﾓｰﾀｰ",
    amount: 880000,
    bankAccount: "普通 1234567",
    matchedInvoiceIds: [],
    matchingConfidence: 0,
    status: "unmatched",
  },
  // シナリオ3：複数請求の合算入金
  {
    paymentId: "P003",
    paymentDate: "2026-07-06",
    payerName: "富士コンポーネント株式会社",
    amount: 1050000,
    bankAccount: "普通 1234567",
    matchedInvoiceIds: [],
    matchingConfidence: 0,
    status: "unmatched",
  },
  // シナリオ4：振込手数料控除
  {
    paymentId: "P004",
    paymentDate: "2026-07-06",
    payerName: "新和機械製作所",
    amount: 499120,
    bankAccount: "普通 1234567",
    matchedInvoiceIds: [],
    matchingConfidence: 0,
    status: "unmatched",
  },
  // シナリオ5：一部入金
  {
    paymentId: "P005",
    paymentDate: "2026-07-06",
    payerName: "東都電子部材株式会社",
    amount: 1000000,
    bankAccount: "普通 1234567",
    matchedInvoiceIds: [],
    matchingConfidence: 0,
    status: "unmatched",
  },
  // クリーンな完全一致入金（10件）
  { paymentId: "P010", paymentDate: "2026-07-06", payerName: "関東精密工業株式会社", amount: 430000, bankAccount: "普通 1234567", matchedInvoiceIds: [], matchingConfidence: 0, status: "unmatched" },
  { paymentId: "P011", paymentDate: "2026-07-06", payerName: "青葉モーター部品株式会社", amount: 275000, bankAccount: "普通 1234567", matchedInvoiceIds: [], matchingConfidence: 0, status: "unmatched" },
  { paymentId: "P012", paymentDate: "2026-07-06", payerName: "富士コンポーネント株式会社", amount: 918000, bankAccount: "普通 1234567", matchedInvoiceIds: [], matchingConfidence: 0, status: "unmatched" },
  { paymentId: "P013", paymentDate: "2026-07-06", payerName: "新和機械製作所", amount: 152000, bankAccount: "普通 1234567", matchedInvoiceIds: [], matchingConfidence: 0, status: "unmatched" },
  { paymentId: "P014", paymentDate: "2026-07-06", payerName: "東都電子部材株式会社", amount: 640000, bankAccount: "普通 1234567", matchedInvoiceIds: [], matchingConfidence: 0, status: "unmatched" },
  { paymentId: "P015", paymentDate: "2026-07-06", payerName: "北日本金属加工株式会社", amount: 385000, bankAccount: "普通 1234567", matchedInvoiceIds: [], matchingConfidence: 0, status: "unmatched" },
  { paymentId: "P016", paymentDate: "2026-07-06", payerName: "三栄プラスチック株式会社", amount: 210000, bankAccount: "普通 1234567", matchedInvoiceIds: [], matchingConfidence: 0, status: "unmatched" },
  { paymentId: "P017", paymentDate: "2026-07-06", payerName: "大阪制御機器株式会社", amount: 1120000, bankAccount: "普通 1234567", matchedInvoiceIds: [], matchingConfidence: 0, status: "unmatched" },
  { paymentId: "P018", paymentDate: "2026-07-06", payerName: "関東精密工業株式会社", amount: 560000, bankAccount: "普通 1234567", matchedInvoiceIds: [], matchingConfidence: 0, status: "unmatched" },
  { paymentId: "P019", paymentDate: "2026-07-06", payerName: "富士コンポーネント株式会社", amount: 733000, bankAccount: "普通 1234567", matchedInvoiceIds: [], matchingConfidence: 0, status: "unmatched" },
  // 請求と紐づかない不明入金（要確認ケース）
  {
    paymentId: "P099",
    paymentDate: "2026-07-06",
    payerName: "タナカ ヒロシ",
    amount: 45000,
    bankAccount: "普通 1234567",
    matchedInvoiceIds: [],
    matchingConfidence: 0,
    status: "unmatched",
  },
];
