import { Customer, Invoice, Payment, ProcessingLogLine, ProcessingSummary, Reminder } from "@/types";
import { isSameCustomerByName } from "./nameMatch";
import { daysBetween, formatCurrency } from "./dateUtils";
import { buildReminderDraft } from "./reminderTemplates";
import { TODAY_ISO } from "./constants";

interface EngineResult {
  invoices: Invoice[];
  payments: Payment[];
  reminders: Reminder[];
  log: ProcessingLogLine[];
  summary: ProcessingSummary;
}

function nextLogTime(baseMinute: number): string {
  const totalMinutes = 9 * 60 + baseMinute;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function runDailyProcessing(
  invoicesInput: Invoice[],
  paymentsInput: Payment[],
  customers: Customer[]
): EngineResult {
  const invoices = invoicesInput.map((inv) => ({ ...inv }));
  const payments = paymentsInput.map((p) => ({ ...p }));
  const reminders: Reminder[] = [];
  const log: ProcessingLogLine[] = [];
  let minuteCursor = 0;
  let idSeq = 0;

  const pushLog = (text: string) => {
    idSeq += 1;
    log.push({ id: `LOG-${idSeq}`, time: nextLogTime(minuteCursor), text });
    minuteCursor += 1;
  };

  const customerById = new Map(customers.map((c) => [c.customerId, c]));
  const outstanding = () => invoices.filter((inv) => inv.status === "issued");

  const summary: ProcessingSummary = {
    autoMatched: 0,
    nameVariationMatched: 0,
    combinedMatched: 0,
    discrepancy: 0,
    partialPayment: 0,
    overdue: 0,
    needsHumanReview: 0,
  };

  pushLog(`銀行明細CSVを取得しました（${payments.length}件）`);
  pushLog(`請求一覧${outstanding().length}件を取得しました`);
  pushLog("顧客マスタを参照しています");

  for (const payment of payments) {
    let matchedCustomer: Customer | undefined = customers.find(
      (c) => c.customerName === payment.payerName
    );
    let byNameVariation = false;
    if (!matchedCustomer) {
      matchedCustomer = customers.find((c) =>
        isSameCustomerByName(payment.payerName, c.customerName, c.customerNameKana)
      );
      byNameVariation = !!matchedCustomer;
    }

    if (!matchedCustomer) {
      payment.status = "discrepancy";
      pushLog(`入金 ${formatCurrency(payment.amount)}（振込名義：${payment.payerName}）の請求先が特定できませんでした`);
      summary.needsHumanReview += 1;
      continue;
    }

    if (byNameVariation) {
      pushLog(`入金名義「${payment.payerName}」を「${matchedCustomer.customerName}」と照合しました`);
    }

    const currentCustomer = matchedCustomer;
    const candidates = outstanding().filter((inv) => inv.customerId === currentCustomer.customerId);

    const exact = candidates.find((inv) => inv.amount === payment.amount);
    if (exact) {
      exact.paidAmount = payment.amount;
      exact.status = byNameVariation ? "name_variation_matched" : "auto_matched";
      exact.aiJudgment = byNameVariation
        ? "入金名義ゆれだが同一顧客と判定し自動消込"
        : "請求金額と入金額が完全一致";
      exact.recommendedAction = "自動消込";
      payment.status = byNameVariation ? "name_variation_matched" : "matched";
      payment.matchedInvoiceIds = [exact.invoiceId];
      payment.matchingConfidence = byNameVariation ? 0.9 : 1;
      pushLog(`請求書 ${exact.invoiceId} と入金 ${formatCurrency(payment.amount)}を自動消込しました`);
      if (byNameVariation) summary.nameVariationMatched += 1;
      else summary.autoMatched += 1;
      continue;
    }

    let combinedPair: [Invoice, Invoice] | null = null;
    outer: for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        if (candidates[i].amount + candidates[j].amount === payment.amount) {
          combinedPair = [candidates[i], candidates[j]];
          break outer;
        }
      }
    }
    if (combinedPair) {
      const pair = combinedPair;
      pair.forEach((inv) => {
        inv.paidAmount = inv.amount;
        inv.status = "combined_payment_matched";
        inv.aiJudgment = "複数請求の合算入金と判定し自動消込";
        inv.recommendedAction = "自動消込";
      });
      payment.status = "combined_payment_matched";
      payment.matchedInvoiceIds = pair.map((inv) => inv.invoiceId);
      payment.matchingConfidence = 0.85;
      pushLog(
        `入金 ${formatCurrency(payment.amount)}を請求書 ${pair[0].invoiceId} と ${pair[1].invoiceId} の合算入金として消込しました`
      );
      summary.combinedMatched += 1;
      continue;
    }

    const feeCandidate = candidates.find((inv) => {
      const diff = inv.amount - payment.amount;
      return diff > 0 && diff <= 1000;
    });
    if (feeCandidate) {
      const diff = feeCandidate.amount - payment.amount;
      feeCandidate.paidAmount = payment.amount;
      feeCandidate.status = "discrepancy";
      feeCandidate.aiJudgment = `請求額との差額${formatCurrency(diff)}を検知。振込手数料控除の可能性`;
      feeCandidate.recommendedAction = "差額を振込手数料として処理し消込確定（要確認）";
      payment.status = "discrepancy";
      payment.matchedInvoiceIds = [feeCandidate.invoiceId];
      payment.matchingConfidence = 0.8;
      pushLog(`請求額との差額 ${formatCurrency(diff)}を検知しました。振込手数料控除の可能性があります`);
      summary.discrepancy += 1;
      summary.needsHumanReview += 1;
      continue;
    }

    const partialCandidate = candidates.find((inv) => payment.amount > 0 && payment.amount < inv.amount);
    if (partialCandidate) {
      partialCandidate.paidAmount = payment.amount;
      partialCandidate.status = "partially_paid";
      const remaining = partialCandidate.amount - payment.amount;
      partialCandidate.aiJudgment = `一部入金と判定。残額${formatCurrency(remaining)}を未入金として管理`;
      partialCandidate.recommendedAction = "残額の督促候補として管理";
      payment.status = "partial_payment";
      payment.matchedInvoiceIds = [partialCandidate.invoiceId];
      payment.matchingConfidence = 0.7;
      pushLog(`請求書 ${partialCandidate.invoiceId} に対し一部入金 ${formatCurrency(payment.amount)}を検知しました`);
      summary.partialPayment += 1;
      summary.needsHumanReview += 1;
      continue;
    }

    payment.status = "discrepancy";
    pushLog(`入金 ${formatCurrency(payment.amount)}（${currentCustomer.customerName}）に一致する請求が見つかりませんでした`);
    summary.needsHumanReview += 1;
  }

  pushLog("請求データと入金データの照合が完了しました");

  const overdueInvoices = invoices.filter(
    (inv) => inv.status === "issued" && daysBetween(TODAY_ISO, inv.dueDate) > 0
  );
  pushLog(`支払期日超過の請求を${overdueInvoices.length}件検知しました`);

  for (const inv of overdueInvoices) {
    const customer = customerById.get(inv.customerId)!;
    const delayDays = daysBetween(TODAY_ISO, inv.dueDate);

    let level: Reminder["reminderLevel"] = "first_reminder";
    if (delayDays > 30) level = "escalation";
    else if (delayDays > 7) level = "second_reminder";

    let score = 0;
    score += inv.amount >= 5000000 ? 3 : inv.amount >= 1000000 ? 2 : 1;
    score += delayDays > 30 ? 3 : delayDays > 14 ? 2 : 1;
    score += Math.min(customer.pastDelayCount, 3);
    score += customer.customerImportance === "High" ? 2 : customer.customerImportance === "Medium" ? 1 : 0;
    const priority: Invoice["priority"] = score >= 8 ? "High" : score >= 5 ? "Medium" : "Low";

    const hasClaimNote = /クレーム|検収遅れ|支払猶予/.test(customer.notes);
    const requiresSalesApproval =
      customer.customerImportance === "High" ||
      hasClaimNote ||
      delayDays > 30 ||
      inv.amount >= 5000000;

    inv.status = "reminder_candidate";
    inv.priority = priority;
    inv.aiReason = `支払期日(${inv.dueDate})を${delayDays}日超過。過去延滞${customer.pastDelayCount}回、顧客重要度${customer.customerImportance}。`;
    inv.recommendedAction = requiresSalesApproval ? "営業担当への確認依頼" : "督促メール送付候補";
    inv.aiJudgment = requiresSalesApproval
      ? "重要顧客・高額・長期延滞のいずれかに該当するため営業確認が必要"
      : "支払期日超過のため督促候補";

    const draft = buildReminderDraft(inv, customer, level);
    reminders.push({
      reminderId: `REM-${inv.invoiceId}`,
      invoiceId: inv.invoiceId,
      customerId: inv.customerId,
      reminderLevel: level,
      draftSubject: draft.subject,
      draftBody: draft.body,
      recipientEmail: customer.billingContactEmail,
      ccEmail:
        level === "escalation"
          ? `sales-${customer.salesOwner}@sample-seisakusho.example.co.jp`
          : undefined,
      approvalStatus: "pending_sales_approval",
      aiRecommendation: requiresSalesApproval ? "営業確認を推奨" : "送付して問題なし",
      aiReason: requiresSalesApproval
        ? `顧客重要度:${customer.customerImportance} / 延滞${delayDays}日 / 金額${formatCurrency(
            inv.amount
          )}のため、送付前に営業担当の確認を推奨します。`
        : `過去クレームなし、延滞${delayDays}日、金額${formatCurrency(
            inv.amount
          )}のため送付して問題ないと判断しました。`,
      requiresSalesApproval,
    });

    pushLog(`督促候補を作成しました：${inv.invoiceId}（${customer.customerName} / 遅延${delayDays}日）`);
  }

  summary.overdue = overdueInvoices.length;

  pushLog("処理が完了しました");

  return { invoices, payments, reminders, log, summary };
}
