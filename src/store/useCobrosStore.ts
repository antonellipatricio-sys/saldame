/**
 * Cobros: plata que otra persona ya devolvió ("Mariana me pagó").
 * Se restan de lo que esa persona debe en el mismo período.
 * Colección Firestore: `cobros`.
 */
import { create } from 'zustand';
import { addDoc, collection, deleteDoc, doc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Cobro {
  id: string;
  persona: string;
  /** 'yyyy-MM' del filtro en que se registró, o 'todos' */
  periodo: string;
  ars: number;
  usd: number;
  fecha: Date;
}

interface CobrosStore {
  cobros: Cobro[];
  fetchCobros: () => Promise<void>;
  addCobro: (c: Omit<Cobro, 'id' | 'fecha'>) => Promise<void>;
  deleteCobro: (id: string) => Promise<void>;
}

export const useCobrosStore = create<CobrosStore>()((set) => ({
  cobros: [],

  fetchCobros: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'cobros'));
      const cobros = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          persona: data.persona,
          periodo: data.periodo,
          ars: data.ars ?? 0,
          usd: data.usd ?? 0,
          fecha: data.fecha instanceof Timestamp ? data.fecha.toDate() : new Date(data.fecha),
        } as Cobro;
      });
      set({ cobros });
    } catch (error) {
      console.error('Error fetching cobros:', error);
    }
  },

  addCobro: async (c) => {
    const fecha = new Date();
    const ref = await addDoc(collection(db, 'cobros'), { ...c, fecha: Timestamp.fromDate(fecha) });
    set(state => ({ cobros: [...state.cobros, { ...c, id: ref.id, fecha }] }));
  },

  deleteCobro: async (id) => {
    await deleteDoc(doc(db, 'cobros', id));
    set(state => ({ cobros: state.cobros.filter(c => c.id !== id) }));
  },
}));
