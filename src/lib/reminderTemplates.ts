import { Customer, Invoice, ReminderLevel } from "@/types";
import { formatCurrency, formatDateJp } from "./dateUtils";
import { SENDER_COMPANY, SENDER_DEPT } from "./constants";

interface TemplateResult {
  subject: string;
  body: string;
  tone: string;
}

export function buildReminderDraft(
  invoice: Invoice,
  customer: Customer,
  level: ReminderLevel
): TemplateResult {
  const amount = formatCurrency(invoice.amount);
  const due = formatDateJp(invoice.dueDate);
  const contact = `${customer.customerName}\n${customer.billingContactName}様`;

  if (level === "first_reminder") {
    return {
      tone: "柔らかい確認トーン",
      subject: `【ご確認】請求書 ${invoice.invoiceId} のお支払い状況について`,
      body: `${contact}

いつもお世話になっております。
${SENDER_COMPANY} ${SENDER_DEPT}でございます。

下記請求書につきまして、弊社側で現時点のご入金確認が取れておりませんでしたため、念のためご連絡いたしました。

請求番号：${invoice.invoiceId}
請求金額：${amount}
お支払期日：${due}

すでにお手続き済みの場合は、行き違いのご連絡となりますことご容赦ください。
恐れ入りますが、お支払い状況をご確認いただけますと幸いです。

何卒よろしくお願いいたします。`,
    };
  }

  if (level === "second_reminder") {
    return {
      tone: "支払予定日の確認を明確に依頼するトーン",
      subject: `【再送】請求書 ${invoice.invoiceId} のお支払い予定日確認のお願い`,
      body: `${contact}

いつもお世話になっております。
${SENDER_COMPANY} ${SENDER_DEPT}でございます。

先日ご連絡いたしました下記請求書につきまして、現時点で弊社側にてご入金確認が取れておりません。

請求番号：${invoice.invoiceId}
請求金額：${amount}
お支払期日：${due}

恐れ入りますが、現在のお支払い状況およびお支払い予定日についてご教示いただけますでしょうか。

何卒よろしくお願いいたします。`,
    };
  }

  return {
    tone: "上長CCや営業責任者確認を促すトーン",
    subject: `【重要】請求書 ${invoice.invoiceId} のお支払いについて（複数回ご連絡）`,
    body: `${contact}

いつもお世話になっております。
${SENDER_COMPANY} ${SENDER_DEPT}でございます。

これまで複数回ご連絡しております下記請求書につきまして、本日時点でもご入金確認が取れておりません。

請求番号：${invoice.invoiceId}
請求金額：${amount}
お支払期日：${due}（支払期日より30日以上経過）

大変恐縮ではございますが、至急お支払い状況をご確認のうえ、ご対応いただけますでしょうか。
本メールは念のため営業担当・上長にもCCしております。

何卒よろしくお願いいたします。`,
  };
}
