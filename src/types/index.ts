export type Currency = 'ARS' | 'USD';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string; // tailwind bg color class, e.g. 'bg-blue-100 text-blue-700'
}

export interface Expense {
  id: string;
  amount: number;
  currency: Currency;
  category: string;
  description: string;
  date: Date;
  notes?: string;
  tags?: string[]; // array of tag names
  cardLast4?: string; // últimos 4 dígitos de la tarjeta (ej: '1204')
  cardholder?: string; // nombre del titular de la tarjeta
  source?: 'manual' | 'pdf' | 'santander'; // origen de la carga
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthSummary {
  totalARS: number;
  totalUSD: number;
  byCategory: Record<string, number>;
}
