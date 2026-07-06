// 半角カナ + 濁点/半濁点 の組み合わせを全角カナへ変換する
const dakutenMap: Record<string, string> = {
  ｶﾞ: "ガ", ｷﾞ: "ギ", ｸﾞ: "グ", ｹﾞ: "ゲ", ｺﾞ: "ゴ",
  ｻﾞ: "ザ", ｼﾞ: "ジ", ｽﾞ: "ズ", ｾﾞ: "ゼ", ｿﾞ: "ゾ",
  ﾀﾞ: "ダ", ﾁﾞ: "ヂ", ﾂﾞ: "ヅ", ﾃﾞ: "デ", ﾄﾞ: "ド",
  ﾊﾞ: "バ", ﾋﾞ: "ビ", ﾌﾞ: "ブ", ﾍﾞ: "ベ", ﾎﾞ: "ボ",
  ﾊﾟ: "パ", ﾋﾟ: "ピ", ﾌﾟ: "プ", ﾍﾟ: "ペ", ﾎﾟ: "ポ",
  ｳﾞ: "ヴ",
};

const baseMap: Record<string, string> = {
  ｦ: "ヲ", ｧ: "ァ", ｨ: "ィ", ｩ: "ゥ", ｪ: "ェ", ｫ: "ォ",
  ｬ: "ャ", ｭ: "ュ", ｮ: "ョ", ｯ: "ッ", ｰ: "ー",
  ｱ: "ア", ｲ: "イ", ｳ: "ウ", ｴ: "エ", ｵ: "オ",
  ｶ: "カ", ｷ: "キ", ｸ: "ク", ｹ: "ケ", ｺ: "コ",
  ｻ: "サ", ｼ: "シ", ｽ: "ス", ｾ: "セ", ｿ: "ソ",
  ﾀ: "タ", ﾁ: "チ", ﾂ: "ツ", ﾃ: "テ", ﾄ: "ト",
  ﾅ: "ナ", ﾆ: "ニ", ﾇ: "ヌ", ﾈ: "ネ", ﾉ: "ノ",
  ﾊ: "ハ", ﾋ: "ヒ", ﾌ: "フ", ﾍ: "ヘ", ﾎ: "ホ",
  ﾏ: "マ", ﾐ: "ミ", ﾑ: "ム", ﾒ: "メ", ﾓ: "モ",
  ﾔ: "ヤ", ﾕ: "ユ", ﾖ: "ヨ",
  ﾗ: "ラ", ﾘ: "リ", ﾙ: "ル", ﾚ: "レ", ﾛ: "ロ",
  ﾜ: "ワ", ﾝ: "ン", " ": "",
};

export function halfWidthKatakanaToFullWidth(input: string): string {
  let result = input;
  for (const [half, full] of Object.entries(dakutenMap)) {
    result = result.split(half).join(full);
  }
  for (const [half, full] of Object.entries(baseMap)) {
    result = result.split(half).join(full);
  }
  return result;
}

const CORP_SUFFIXES = ["株式会社", "有限会社", "合同会社"];

export function stripCorpSuffix(name: string): string {
  let result = name;
  for (const suffix of CORP_SUFFIXES) {
    result = result.split(suffix).join("");
  }
  return result.trim();
}

/**
 * 振込名義(半角カナ・略称・表記ゆれを含む)が顧客と一致するかを判定する。
 * 完全一致・カナ一致・略称のプレフィックス一致まで許容する。
 */
export function isSameCustomerByName(
  payerName: string,
  customerName: string,
  customerNameKana: string
): boolean {
  if (payerName === customerName) return true;

  const normalizedPayer = halfWidthKatakanaToFullWidth(payerName).replace(/\s/g, "");
  const normalizedKana = customerNameKana.replace(/\s/g, "");
  const normalizedCustomer = stripCorpSuffix(customerName);

  if (normalizedPayer === normalizedKana) return true;
  if (normalizedKana.startsWith(normalizedPayer) || normalizedPayer.startsWith(normalizedKana)) {
    return normalizedPayer.length >= 4; // 誤爆防止のため最低文字数を要求
  }
  if (normalizedCustomer.includes(normalizedPayer) || normalizedPayer.includes(normalizedCustomer)) {
    return normalizedPayer.length >= 3;
  }
  return false;
}
