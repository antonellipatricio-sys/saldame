/**
 * Reglas "Siempre": "siempre que venga FRAVEGA → Maru".
 * Se aplican al importar resúmenes (y, al crearlas, a los gastos ya cargados).
 * Colección Firestore: `reglasPago`.
 */
import { create } from 'zustand';
import { collection, deleteDoc, doc, getDocs, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ReglaPago {
  id: string;
  /** Texto normalizado que tiene que aparecer en la descripción (ver claveDescripcion) */
  patron: string;
  tipo: 'todo' | 'mitad';
  persona: string;
  creada: Date;
}

interface ReglasStore {
  reglas: ReglaPago[];
  fetchReglas: () => Promise<void>;
  /** Crea o reemplaza la regla de ese patrón */
  saveRegla: (r: Omit<ReglaPago, 'id' | 'creada'>) => Promise<void>;
  deleteRegla: (id: string) => Promise<void>;
}

export const useReglasStore = create<ReglasStore>()((set, get) => ({
  reglas: [],

  fetchReglas: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'reglasPago'));
      const reglas = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          patron: data.patron,
          tipo: data.tipo,
          persona: data.persona,
          creada: data.creada instanceof Timestamp ? data.creada.toDate() : new Date(data.creada),
        } as ReglaPago;
      });
      set({ reglas });
    } catch (error) {
      console.error('Error fetching reglas:', error);
    }
  },

  saveRegla: async (r) => {
    // Un doc por patrón exacto: si ya existe se reemplaza, si no se crea con id nuevo.
    const id = get().reglas.find(x => x.patron === r.patron)?.id ?? doc(collection(db, 'reglasPago')).id;
    const creada = new Date();
    await setDoc(doc(db, 'reglasPago', id), { ...r, creada: Timestamp.fromDate(creada) });
    set(state => ({ reglas: [...state.reglas.filter(x => x.id !== id), { ...r, id, creada }] }));
  },

  deleteRegla: async (id) => {
    await deleteDoc(doc(db, 'reglasPago', id));
    set(state => ({ reglas: state.reglas.filter(r => r.id !== id) }));
  },
}));
