import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BudgetStore {
  budgets: Record<string, number>; // categoryName → monto mensual en ARS
  setBudget: (categoryName: string, amount: number) => void;
  removeBudget: (categoryName: string) => void;
}

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set) => ({
      budgets: {},
      setBudget: (categoryName, amount) =>
        set((state) => ({ budgets: { ...state.budgets, [categoryName]: amount } })),
      removeBudget: (categoryName) =>
        set((state) => {
          const { [categoryName]: _, ...rest } = state.budgets;
          return { budgets: rest };
        }),
    }),
    { name: 'expense-budgets' }
  )
);
