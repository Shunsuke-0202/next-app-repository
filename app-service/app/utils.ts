/**
 * Utility functions used in the household budget app
 */

export type EntryType = "income" | "expense";

export type Entry = {
  id: string;
  date: string;
  type: EntryType;
  category: string;
  amount: number;
  note: string;
  createdAt: string;
};

export type EntryDraft = {
  date: string;
  type: EntryType;
  category: string;
  amount: number;
  note: string;
};

export const STORAGE_KEY = "household-budget-entries-v1";
export const incomeCategories = ["給与", "副収入", "投資", "その他"];
export const expenseCategories = ["食費", "住居", "交通", "光熱費", "通信", "医療", "教育", "娯楽", "美容", "その他"];

export function isValidEntry(value: unknown): value is Entry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Partial<Entry>;
  const categories = buildCategoryOptions(entry.type as EntryType);
  return (
    typeof entry.id === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(entry.date ?? "") &&
    (entry.type === "income" || entry.type === "expense") &&
    typeof entry.category === "string" &&
    categories.includes(entry.category) &&
    typeof entry.amount === "number" &&
    Number.isFinite(entry.amount) &&
    Number.isInteger(entry.amount) &&
    entry.amount > 0 &&
    typeof entry.note === "string" &&
    typeof entry.createdAt === "string"
  );
}

export function parseStoredEntries(value: string | null): Entry[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isValidEntry) : [];
  } catch {
    return [];
  }
}

export function getTodayString(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthString(): string {
  return getTodayString().slice(0, 7);
}

export function getDefaultDraft(): EntryDraft {
  return {
    date: getTodayString(),
    type: "expense",
    category: "食費",
    amount: 0,
    note: "",
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

export function buildCategoryOptions(type: EntryType): string[] {
  return type === "income" ? incomeCategories : expenseCategories;
}

const categoryAliases: Record<string, string> = {
  家賃: "住居",
  住宅: "住居",
  光熱: "光熱費",
  ガス: "光熱費",
  電気: "光熱費",
  水道: "光熱費",
  電車: "交通",
  バス: "交通",
  交通費: "交通",
  スマホ: "通信",
  携帯: "通信",
  医者: "医療",
  保険: "医療",
  夕食: "食費",
  ラーメン: "食費",
  お昼: "食費",
  服: "美容",
  雑貨: "娯楽",
  ボーナス: "副収入",
  給与: "給与",
  給料: "給与",
  収入: "給与",
  売上: "副収入",
};

export type VoiceCommandParseResult = {
  ok: boolean;
  draft?: Partial<EntryDraft>;
  error?: string;
};

function resolveCategory(text: string, type: EntryType): string {
  const categories = buildCategoryOptions(type);
  const normalized = text.replace(/\s+/g, "");

  for (const alias of Object.entries(categoryAliases)) {
    if (normalized.includes(alias[0])) {
      return alias[1];
    }
  }

  for (const category of [...categories].sort((a, b) => b.length - a.length)) {
    if (normalized.includes(category)) {
      return category;
    }
  }

  return categories[0];
}

function resolveAmount(text: string): number | null {
  const normalized = text.replace(/,/g, "");

  const matchedTenThousand = normalized.match(/(\d+(?:\.\d+)?)万/);
  if (matchedTenThousand) {
    return Number(matchedTenThousand[1]) * 10000;
  }

  const matchedThousand = normalized.match(/(\d+(?:\.\d+)?)千/);
  if (matchedThousand) {
    return Number(matchedThousand[1]) * 1000;
  }

  const matchedYen = normalized.match(/(\d+(?:\.\d+)?)円/);
  if (matchedYen) {
    return Number(matchedYen[1]);
  }

  const matchedPlain = normalized.match(/(\d+(?:\.\d+)?)/);
  if (matchedPlain) {
    return Number(matchedPlain[1]);
  }

  return null;
}

function resolveNote(text: string, category: string, amount: number): string {
  const stripped = text
    .replace(new RegExp(category, "g"), "")
    .replace(new RegExp(String(amount), "g"), "")
    .replace(/\d+(?:\.\d+)?万/g, "")
    .replace(/\d+(?:\.\d+)?千/g, "")
    .replace(/\d+(?:\.\d+)?円/g, "")
    .replace(/(使った|支払った|払った|買った|出した|入った|もらった|収入|支出|給与|給料|ボーナス|売上|今日|明日|昨日)/g, "")
    .replace(/(で|を|の|に|は|が|も)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return stripped;
}

export function parseVoiceCommand(input: string): VoiceCommandParseResult {
  const text = input.trim();
  if (!text) {
    return {
      ok: false,
      error: "音声内容が空です。何に、いくら使ったかを話してください。",
    };
  }

  const normalized = text.replace(/\s+/g, " ");
  const isIncome = /(給与|給料|収入|入金|もらった|入った|売上|ボーナス|副収入|投資|配当)/.test(normalized);
  const isExpense = /(使った|支出|支払った|払った|買った|出した|食費|住居|交通|通信|光熱費|医療|教育|娯楽|美容|電車|家賃|飲み物|夕食)/.test(normalized);
  const type: EntryType = isIncome && !isExpense ? "income" : "expense";

  const amount = resolveAmount(normalized);
  if (amount === null || Number.isNaN(amount) || amount <= 0) {
    return {
      ok: false,
      error: "金額が見つかりませんでした。例: 1200円、1万円、3000円のように話してください。",
    };
  }

  const category = resolveCategory(normalized, type);
  const note = resolveNote(normalized, category, amount);

  return {
    ok: true,
    draft: {
      date: getTodayString(),
      type,
      category,
      amount,
      note,
    },
  };
}

export function calculateSummary(entries: Entry[], selectedMonth: string) {
  const filteredEntries = entries.filter((entry) => entry.date.startsWith(selectedMonth));
  const income = filteredEntries
    .filter((entry) => entry.type === "income")
    .reduce((total, entry) => total + entry.amount, 0);
  const expense = filteredEntries
    .filter((entry) => entry.type === "expense")
    .reduce((total, entry) => total + entry.amount, 0);

  return {
    income,
    expense,
    balance: income - expense,
  };
}
