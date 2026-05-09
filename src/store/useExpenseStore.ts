import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Expense, Category, Tag, Responsable } from '@/types';
import { defaultCategories } from '@/lib/categories';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ExpenseStore {
  expenses: Expense[];
  categories: Category[];
  tags: Tag[];
  responsables: Responsable[];
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
  fetchCategories: () => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Actions etiquetas
  fetchTags: () => Promise<void>;
  addTag: (tag: Tag) => Promise<void>;
  updateTag: (id: string, updates: Partial<Omit<Tag, 'id'>>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;

  // Actions responsables
  fetchResponsables: () => Promise<void>;
  addResponsable: (r: Responsable) => Promise<void>;
  updateResponsable: (id: string, updates: Partial<Omit<Responsable, 'id'>>) => Promise<void>;
  deleteResponsable: (id: string) => Promise<void>;
  renameResponsable: (id: string, newName: string) => Promise<void>;
}

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      expenses: [],
      categories: defaultCategories,
      tags: [
        { id: 'tag-gastos-fijos', name: 'Gastos Fijos', color: 'bg-blue-100 text-blue-700' },
      ],
      responsables: [
        { id: 'resp-patricio', name: 'Patricio', emoji: '🧔' },
        { id: 'resp-maru',     name: 'Maru',     emoji: '👩' },
        { id: 'resp-bren',     name: 'Bren',     emoji: '👧' },
        { id: 'resp-mica',     name: 'Mica',     emoji: '💁' },
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
          if (expense.responsable !== undefined) data.responsable = expense.responsable;
          if (expense.sharedWith !== undefined) data.sharedWith = expense.sharedWith;
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

      fetchCategories: async () => {
        try {
          const snapshot = await getDocs(collection(db, 'categories'));
          if (snapshot.empty) {
            // Primera vez: sembrar categorías por defecto en Firestore
            await Promise.all(
              defaultCategories.map((cat) => setDoc(doc(db, 'categories', cat.id), cat))
            );
            set({ categories: defaultCategories });
          } else {
            const categories: Category[] = snapshot.docs.map((d) => d.data() as Category);
            set({ categories });
          }
        } catch (error) {
          console.error('Error fetching categories:', error);
        }
      },

      addCategory: async (category) => {
        await setDoc(doc(db, 'categories', category.id), category);
        set((state) => ({ categories: [...state.categories, category] }));
      },

      updateCategory: async (id, updates) => {
        await updateDoc(doc(db, 'categories', id), updates);
        set((state) => ({
          categories: state.categories.map((c) => c.id === id ? { ...c, ...updates } : c),
        }));
      },

      deleteCategory: async (id) => {
        await deleteDoc(doc(db, 'categories', id));
        set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }));
      },

      fetchTags: async () => {
        try {
          const snapshot = await getDocs(collection(db, 'tags'));
          if (!snapshot.empty) {
            const tags: Tag[] = snapshot.docs.map((d) => d.data() as Tag);
            set({ tags });
          }
        } catch (error) {
          console.error('Error fetching tags:', error);
        }
      },

      addTag: async (tag) => {
        await setDoc(doc(db, 'tags', tag.id), tag);
        set((state) => ({ tags: [...state.tags, tag] }));
      },

      updateTag: async (id, updates) => {
        await updateDoc(doc(db, 'tags', id), updates);
        set((state) => ({
          tags: state.tags.map((t) => t.id === id ? { ...t, ...updates } : t),
        }));
      },

      deleteTag: async (id) => {
        await deleteDoc(doc(db, 'tags', id));
        set((state) => ({ tags: state.tags.filter((t) => t.id !== id) }));
      },

      fetchResponsables: async () => {
        try {
          const snapshot = await getDocs(collection(db, 'responsables'));
          const defaultResponsables: Responsable[] = [
            { id: 'resp-patricio', name: 'Patricio', emoji: '🧔', aliases: ['patricio', 'pato', 'p. antonelli'] },
            { id: 'resp-maru',     name: 'Maru',     emoji: '👩', aliases: ['mariana', 'maru', 'm. antonelli'] },
            { id: 'resp-bren',     name: 'Bren',     emoji: '👧', aliases: ['brenda', 'bren'] },
            { id: 'resp-mica',     name: 'Mica',     emoji: '💁', aliases: ['micaela', 'mica', 'm. boggio'] },
          ];

          if (snapshot.empty) {
            // Primera vez: sembrar defaults en Firestore
            await Promise.all(
              defaultResponsables.map((r) => setDoc(doc(db, 'responsables', r.id), r))
            );
            set({ responsables: defaultResponsables });
          } else {
            const fromFirestore: Responsable[] = snapshot.docs.map((d) => d.data() as Responsable);
            const existingIds = new Set(fromFirestore.map(r => r.id));

            // Sembrar los defaults que falten en Firestore
            const missing = defaultResponsables.filter(r => !existingIds.has(r.id));
            if (missing.length > 0) {
              await Promise.all(missing.map((r) => setDoc(doc(db, 'responsables', r.id), r)));
            }

            // Migrar: agregar aliases a defaults existentes que no los tengan
            const needsAliases = fromFirestore.filter(r => {
              const def = defaultResponsables.find(d => d.id === r.id);
              return def && !r.aliases;
            });
            if (needsAliases.length > 0) {
              await Promise.all(needsAliases.map(r => {
                const def = defaultResponsables.find(d => d.id === r.id)!;
                return updateDoc(doc(db, 'responsables', r.id), { aliases: def.aliases });
              }));
              // Actualizar en memoria también
              needsAliases.forEach(r => {
                const def = defaultResponsables.find(d => d.id === r.id)!;
                r.aliases = def.aliases;
              });
            }

            set({ responsables: [...missing, ...fromFirestore] });
          }
        } catch (error) {
          console.error('Error fetching responsables:', error);
        }
      },

      addResponsable: async (r) => {
        await setDoc(doc(db, 'responsables', r.id), r);
        set((state) => ({ responsables: [...state.responsables, r] }));
      },

      updateResponsable: async (id, updates) => {
        await updateDoc(doc(db, 'responsables', id), updates);
        set((state) => ({
          responsables: state.responsables.map((r) => r.id === id ? { ...r, ...updates } : r),
        }));
      },

      deleteResponsable: async (id) => {
        await deleteDoc(doc(db, 'responsables', id));
        set((state) => ({ responsables: state.responsables.filter((r) => r.id !== id) }));
      },

      renameResponsable: async (id, newName) => {
        const { expenses, responsables } = get();
        const r = responsables.find(r => r.id === id);
        if (!r) return;
        const oldName = r.name;
        if (oldName === newName) return;

        // Actualizar nombre en Firestore
        await updateDoc(doc(db, 'responsables', id), { name: newName });

        // Migrar todos los gastos que referencian el nombre viejo
        const toUpdate = expenses.filter(e =>
          e.responsable === oldName ||
          e.sharedWith?.some(p => p.responsable === oldName)
        );

        if (toUpdate.length > 0) {
          await Promise.all(toUpdate.map(async (e) => {
            const updates: Record<string, unknown> = { updatedAt: Timestamp.fromDate(new Date()) };
            if (e.responsable === oldName) updates.responsable = newName;
            if (e.sharedWith?.some(p => p.responsable === oldName)) {
              updates.sharedWith = e.sharedWith.map(p =>
                p.responsable === oldName ? { ...p, responsable: newName } : p
              );
            }
            await updateDoc(doc(db, 'expenses', e.id), updates);
          }));
        }

        // Actualizar estado local
        set((state) => ({
          responsables: state.responsables.map(r => r.id === id ? { ...r, name: newName } : r),
          expenses: state.expenses.map(e => ({
            ...e,
            responsable: e.responsable === oldName ? newName : e.responsable,
            sharedWith: e.sharedWith?.map(p =>
              p.responsable === oldName ? { ...p, responsable: newName } : p
            ),
          })),
        }));
      },
    }),
    {
      name: 'expense-storage',
      partialize: () => ({}),
    }
  )
);
