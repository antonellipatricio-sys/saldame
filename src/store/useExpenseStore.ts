import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Expense, Category, Tag } from '@/types';
import { defaultCategories } from '@/lib/categories';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ExpenseStore {
  expenses: Expense[];
  categories: Category[];
  tags: Tag[];
  loading: boolean;
  error: string | null;

  // Actions gastos
  fetchExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  deleteExpensesByCard: (cardLast4: string | null, month?: string) => Promise<number>;
  getMonthSummary: (year: number, month: number) => { totalARS: number; totalUSD: number; byCategory: Record<string, number> };

  // Actions categorías
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => void;
  deleteCategory: (id: string) => void;

  // Actions etiquetas
  addTag: (tag: Tag) => void;
  updateTag: (id: string, updates: Partial<Omit<Tag, 'id'>>) => void;
  deleteTag: (id: string) => void;
}

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      expenses: [],
      categories: defaultCategories,
      tags: [
        { id: 'tag-gastos-fijos', name: 'Gastos Fijos', color: 'bg-blue-100 text-blue-700' },
      ],
      loading: false,
      error: null,

      fetchExpenses: async () => {
        set({ loading: true, error: null });
        try {
          const q = query(collection(db, 'expenses'), orderBy('date', 'desc'));
          const querySnapshot = await getDocs(q);

          const expenses: Expense[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            expenses.push({
              id: doc.id,
              ...data,
              date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
              updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
            } as Expense);
          });

          set({ expenses, loading: false });
        } catch (error) {
          console.error('Error fetching expenses:', error);
          set({ error: 'Error al cargar los gastos', loading: false });
        }
      },

      addExpense: async (expense) => {
        set({ loading: true, error: null });
        try {
          const now = new Date();
          const data: Record<string, unknown> = {
            description: expense.description,
            amount: expense.amount,
            currency: expense.currency,
            category: expense.category,
            date: Timestamp.fromDate(expense.date),
            createdAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now),
          };
          if (expense.notes !== undefined) data.notes = expense.notes;
          if (expense.tags !== undefined) data.tags = expense.tags;
          if (expense.cardLast4 !== undefined) data.cardLast4 = expense.cardLast4;
          if (expense.cardholder !== undefined) data.cardholder = expense.cardholder;
          if (expense.source !== undefined) data.source = expense.source;

          const docRef = await addDoc(collection(db, 'expenses'), data);

          const newExpense: Expense = {
            ...expense,
            id: docRef.id,
            createdAt: now,
            updatedAt: now,
          };

          set((state) => ({
            expenses: [newExpense, ...state.expenses],
            loading: false,
          }));
        } catch (error) {
          console.error('Error adding expense:', error);
          set({ error: 'Error al agregar el gasto', loading: false });
        }
      },

      updateExpense: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const docRef = doc(db, 'expenses', id);
          const now = new Date();

          // Filtrar campos undefined para evitar error de Firestore
          const updateData: Record<string, unknown> = { updatedAt: Timestamp.fromDate(now) };
          for (const [key, val] of Object.entries(updates)) {
            if (val !== undefined) {
              updateData[key] = key === 'date' ? Timestamp.fromDate(val as Date) : val;
            }
          }

          await updateDoc(docRef, updateData);

          set((state) => ({
            expenses: state.expenses.map((exp) =>
              exp.id === id ? { ...exp, ...updates, updatedAt: now } : exp
            ),
            loading: false,
          }));
        } catch (error) {
          console.error('Error updating expense:', error);
          set({ error: 'Error al actualizar el gasto', loading: false });
        }
      },

      deleteExpense: async (id) => {
        set({ loading: true, error: null });
        try {
          await deleteDoc(doc(db, 'expenses', id));

          set((state) => ({
            expenses: state.expenses.filter((exp) => exp.id !== id),
            loading: false,
          }));
        } catch (error) {
          console.error('Error deleting expense:', error);
          set({ error: 'Error al eliminar el gasto', loading: false });
        }
      },

      deleteExpensesByCard: async (cardLast4, month) => {
        const { expenses } = get();
        // Filtrar los gastos que coinciden
        const toDelete = expenses.filter(exp => {
          const expCard = exp.cardLast4 ?? null;
          if (expCard !== cardLast4) return false;
          if (month) {
            const d = new Date(exp.date);
            const expMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (expMonth !== month) return false;
          }
          return true;
        });

        if (toDelete.length === 0) return 0;

        set({ loading: true, error: null });
        try {
          // Eliminar todos en Firestore
          const deletePromises = toDelete.map(exp => deleteDoc(doc(db, 'expenses', exp.id)));
          await Promise.all(deletePromises);

          const deletedIds = new Set(toDelete.map(e => e.id));
          set((state) => ({
            expenses: state.expenses.filter(e => !deletedIds.has(e.id)),
            loading: false,
          }));

          return toDelete.length;
        } catch (error) {
          console.error('Error deleting expenses by card:', error);
          set({ error: 'Error al eliminar gastos', loading: false });
          return 0;
        }
      },

      getMonthSummary: (year, month) => {
        const { expenses } = get();
        const filtered = expenses.filter((exp) => {
          const expDate = new Date(exp.date);
          return expDate.getFullYear() === year && expDate.getMonth() === month;
        });

        const totalARS = filtered
          .filter((exp) => exp.currency === 'ARS')
          .reduce((sum, exp) => sum + exp.amount, 0);

        const totalUSD = filtered
          .filter((exp) => exp.currency === 'USD')
          .reduce((sum, exp) => sum + exp.amount, 0);

        const byCategory: Record<string, number> = {};
        filtered.forEach((exp) => {
          const key = exp.category;
          byCategory[key] = (byCategory[key] || 0) + exp.amount;
        });

        return { totalARS, totalUSD, byCategory };
      },

      addCategory: (category) =>
        set((state) => ({ categories: [...state.categories, category] })),

      updateCategory: (id, updates) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),

      addTag: (tag) =>
        set((state) => ({ tags: [...state.tags, tag] })),

      updateTag: (id, updates) =>
        set((state) => ({
          tags: state.tags.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      deleteTag: (id) =>
        set((state) => ({ tags: state.tags.filter((t) => t.id !== id) })),
    }),
    {
      name: 'expense-storage',
      partialize: (state) => ({ categories: state.categories, tags: state.tags }),
    }
  )
);
