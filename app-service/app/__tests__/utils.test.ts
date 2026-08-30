import {
  formatCurrency,
  getTodayString,
  getDefaultDraft,
  buildCategoryOptions,
  calculateSummary,
  incomeCategories,
  expenseCategories,
} from "../utils";

describe("Utility Functions", () => {
  describe("formatCurrency", () => {
    it("formats positive numbers as Japanese yen", () => {
      expect(formatCurrency(1000)).toBe("￥1,000");
      expect(formatCurrency(1500)).toBe("￥1,500");
      expect(formatCurrency(100000)).toBe("￥100,000");
    });

    it("formats zero correctly", () => {
      expect(formatCurrency(0)).toBe("￥0");
    });

    it("rounds decimals to the nearest integer", () => {
      expect(formatCurrency(1234.56)).toBe("￥1,235");
    });
  });

  describe("getTodayString", () => {
    it("returns a string in YYYY-MM-DD format", () => {
      const result = getTodayString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("matches today's date", () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const expected = `${year}-${month}-${day}`;
      expect(getTodayString()).toBe(expected);
    });
  });

  describe("getDefaultDraft", () => {
    it("returns a draft with today's date", () => {
      const draft = getDefaultDraft();
      expect(draft.date).toBe(getTodayString());
    });

    it("defaults to expense type", () => {
      const draft = getDefaultDraft();
      expect(draft.type).toBe("expense");
    });

    it("defaults to 食費 category", () => {
      const draft = getDefaultDraft();
      expect(draft.category).toBe("食費");
    });

    it("starts with zero amount and empty note", () => {
      const draft = getDefaultDraft();
      expect(draft.amount).toBe(0);
      expect(draft.note).toBe("");
    });
  });

  describe("buildCategoryOptions", () => {
    it("returns income categories for income type", () => {
      const options = buildCategoryOptions("income");
      expect(options).toEqual(incomeCategories);
      expect(options).toContain("給与");
      expect(options).toContain("投資");
    });

    it("returns expense categories for expense type", () => {
      const options = buildCategoryOptions("expense");
      expect(options).toEqual(expenseCategories);
      expect(options).toContain("食費");
      expect(options).toContain("住居");
    });
  });

  describe("calculateSummary", () => {
    it("calculates summary correctly with mixed entries", () => {
      const entries = [
        {
          id: "1",
          date: "2026-08-30",
          type: "income" as const,
          category: "給与",
          amount: 100000,
          note: "Monthly salary",
          createdAt: "2026-08-30T09:00:00Z",
        },
        {
          id: "2",
          date: "2026-08-30",
          type: "expense" as const,
          category: "食費",
          amount: 5000,
          note: "Lunch",
          createdAt: "2026-08-30T12:00:00Z",
        },
        {
          id: "3",
          date: "2026-08-30",
          type: "expense" as const,
          category: "交通",
          amount: 1500,
          note: "Train fare",
          createdAt: "2026-08-30T18:00:00Z",
        },
      ];

      const summary = calculateSummary(entries, "2026-08");
      expect(summary.income).toBe(100000);
      expect(summary.expense).toBe(6500);
      expect(summary.balance).toBe(93500);
    });

    it("filters entries by selected month", () => {
      const entries = [
        {
          id: "1",
          date: "2026-08-30",
          type: "expense" as const,
          category: "食費",
          amount: 1000,
          note: "",
          createdAt: "2026-08-30T12:00:00Z",
        },
        {
          id: "2",
          date: "2026-09-01",
          type: "expense" as const,
          category: "食費",
          amount: 2000,
          note: "",
          createdAt: "2026-09-01T12:00:00Z",
        },
      ];

      const augustSummary = calculateSummary(entries, "2026-08");
      expect(augustSummary.expense).toBe(1000);

      const septemberSummary = calculateSummary(entries, "2026-09");
      expect(septemberSummary.expense).toBe(2000);
    });

    it("returns zero values for empty month", () => {
      const entries: never[] = [];
      const summary = calculateSummary(entries, "2026-08");
      expect(summary.income).toBe(0);
      expect(summary.expense).toBe(0);
      expect(summary.balance).toBe(0);
    });
  });
});
