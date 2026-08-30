"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type EntryType = "income" | "expense";

type Entry = {
  id: string;
  date: string;
  type: EntryType;
  category: string;
  amount: number;
  note: string;
  createdAt: string;
};

type EntryDraft = {
  date: string;
  type: EntryType;
  category: string;
  amount: number;
  note: string;
};

const STORAGE_KEY = "household-budget-entries-v1";
const incomeCategories = ["給与", "副収入", "投資", "その他"];
const expenseCategories = ["食費", "住居", "交通", "光熱費", "通信", "医療", "教育", "娯楽", "美容", "その他"];

function getTodayString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultDraft(): EntryDraft {
  return {
    date: getTodayString(),
    type: "expense",
    category: "食費",
    amount: 0,
    note: "",
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildCategoryOptions(type: EntryType) {
  return type === "income" ? incomeCategories : expenseCategories;
}

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return [];
      }

      const parsed = JSON.parse(saved) as Entry[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  });
  const [draft, setDraft] = useState<EntryDraft>(getDefaultDraft());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
  }, [entries]);

  const filteredEntries = useMemo(
    () =>
      [...entries]
        .filter((entry) => entry.date.startsWith(selectedMonth))
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [entries, selectedMonth],
  );

  const summary = useMemo(() => {
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
  }, [filteredEntries]);

  const categorySummary = useMemo(() => {
    const map = new Map<string, number>();

    for (const entry of filteredEntries) {
      const current = map.get(entry.category) ?? 0;
      map.set(entry.category, current + entry.amount * (entry.type === "expense" ? 1 : -1));
    }

    return Array.from(map.entries())
      .map(([label, total]) => ({ label, total }))
      .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  }, [filteredEntries]);

  const handleDraftChange = <K extends keyof EntryDraft>(key: K, value: EntryDraft[K]) => {
    setDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetForm = () => {
    setDraft(getDefaultDraft());
    setEditingId(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = Number(draft.amount);
    if (!draft.date || !draft.category || Number.isNaN(amount) || amount <= 0) {
      return;
    }

    const nextEntry: Entry = {
      id: editingId ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date: draft.date,
      type: draft.type,
      category: draft.category,
      amount,
      note: draft.note.trim(),
      createdAt: new Date().toISOString(),
    };

    if (editingId) {
      setEntries((prev) => prev.map((entry) => (entry.id === editingId ? nextEntry : entry)));
    } else {
      setEntries((prev) => [nextEntry, ...prev]);
    }

    resetForm();
  };

  const handleEdit = (entry: Entry) => {
    setEditingId(entry.id);
    setDraft({
      date: entry.date,
      type: entry.type,
      category: entry.category,
      amount: entry.amount,
      note: entry.note,
    });
  };

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    if (editingId === id) {
      resetForm();
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>家計簿</p>
            <h1>収支管理</h1>
          </div>

          <label className={styles.monthPicker}>
            <span>表示月</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            />
          </label>
        </header>

        <section className={styles.summaryGrid}>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>収入</span>
            <strong className={styles.incomeValue}>{formatCurrency(summary.income)}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>支出</span>
            <strong className={styles.expenseValue}>{formatCurrency(summary.expense)}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>残額</span>
            <strong className={summary.balance >= 0 ? styles.balancePositive : styles.balanceNegative}>
              {formatCurrency(summary.balance)}
            </strong>
          </article>
        </section>

        <div className={styles.workspace}>
          <section className={styles.panel}>
            <div className={styles.sectionHeader}>
              <h2>{editingId ? "収支を編集" : "収支を登録"}</h2>
              {editingId ? (
                <button type="button" className={styles.cancelButton} onClick={resetForm}>
                  キャンセル
                </button>
              ) : null}
            </div>

            <form className={styles.formGrid} onSubmit={handleSubmit}>
              <label className={styles.field}>
                <span>日付</span>
                <input
                  type="date"
                  value={draft.date}
                  onChange={(event) => handleDraftChange("date", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>種別</span>
                <select
                  value={draft.type}
                  onChange={(event) => {
                    const nextType = event.target.value as EntryType;
                    const nextCategory = buildCategoryOptions(nextType)[0];
                    handleDraftChange("type", nextType);
                    handleDraftChange("category", nextCategory);
                  }}
                >
                  <option value="expense">支出</option>
                  <option value="income">収入</option>
                </select>
              </label>

              <label className={styles.field}>
                <span>カテゴリ</span>
                <select
                  value={draft.category}
                  onChange={(event) => handleDraftChange("category", event.target.value)}
                >
                  {buildCategoryOptions(draft.type).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span>金額</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={draft.amount || ""}
                  onChange={(event) => handleDraftChange("amount", Number(event.target.value))}
                  placeholder="0"
                />
              </label>

              <label className={`${styles.field} ${styles.fullWidth}`}>
                <span>メモ</span>
                <input
                  type="text"
                  value={draft.note}
                  onChange={(event) => handleDraftChange("note", event.target.value)}
                  placeholder="例: 夕食代"
                />
              </label>

              <div className={styles.formActions}>
                <button type="submit" className={styles.primaryButton}>
                  {editingId ? "更新する" : "追加する"}
                </button>
              </div>
            </form>
          </section>

          <section className={styles.panel}>
            <div className={styles.sectionHeader}>
              <h2>カテゴリ内訳</h2>
            </div>

            <ul className={styles.categoryList}>
              {categorySummary.length === 0 ? (
                <li className={styles.emptyState}>表示するデータがありません</li>
              ) : (
                categorySummary.map(({ label, total }) => (
                  <li key={label} className={styles.categoryItem}>
                    <span>{label}</span>
                    <strong className={total >= 0 ? styles.balancePositive : styles.balanceNegative}>
                      {formatCurrency(Math.abs(total))}
                    </strong>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>

        <section className={styles.panel}>
          <div className={styles.sectionHeader}>
            <h2>収支一覧</h2>
          </div>

          <ul className={styles.entryList}>
            {filteredEntries.length === 0 ? (
              <li className={styles.emptyState}>この月のデータはまだありません</li>
            ) : (
              filteredEntries.map((entry) => (
                <li key={entry.id} className={styles.entryItem}>
                  <div className={styles.entryMeta}>
                    <span className={entry.type === "income" ? styles.incomeBadge : styles.expenseBadge}>
                      {entry.type === "income" ? "収入" : "支出"}
                    </span>
                    <span className={styles.entryDate}>{entry.date}</span>
                  </div>

                  <div className={styles.entryBody}>
                    <div>
                      <p className={styles.entryCategory}>{entry.category}</p>
                      <p className={styles.entryNote}>{entry.note || "メモなし"}</p>
                    </div>
                    <strong className={entry.type === "income" ? styles.incomeValue : styles.expenseValue}>
                      {entry.type === "income" ? "+" : "-"}
                      {formatCurrency(entry.amount)}
                    </strong>
                  </div>

                  <div className={styles.entryActions}>
                    <button type="button" className={styles.secondaryButton} onClick={() => handleEdit(entry)}>
                      編集
                    </button>
                    <button type="button" className={styles.ghostButton} onClick={() => handleDelete(entry.id)}>
                      削除
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
