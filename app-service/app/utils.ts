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

export function getTodayString(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
