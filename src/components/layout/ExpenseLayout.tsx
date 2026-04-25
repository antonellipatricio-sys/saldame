import React, { useState } from 'react';
import { Home, PlusCircle, FileText, FileSpreadsheet, List, TrendingUp, Tag, Bookmark, CreditCard, Sparkles, Users, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Page = 'dashboard' | 'add-expense' | 'expenses' | 'upload-pdf' | 'upload-santander' | 'stats' | 'categories' | 'tags' | 'account' | 'query' | 'shared-expenses';

interface ExpenseLayoutProps {
  children: React.ReactNode;
  activePage: Page;
  onPageChange: (page: Page) => void;
}

const navItems = [
  { id: 'dashboard' as Page, label: 'Inicio', icon: Home },
  { id: 'add-expense' as Page, label: 'Agregar Gasto', icon: PlusCircle },
  { id: 'expenses' as Page, label: 'Mis Gastos', icon: List },
  { id: 'upload-pdf' as Page, label: 'Subir PDF', icon: FileText },
  { id: 'upload-santander' as Page, label: 'Santander Excel', icon: FileSpreadsheet },
  { id: 'stats' as Page, label: 'Estadísticas', icon: TrendingUp },
  { id: 'categories' as Page, label: 'Categorías', icon: Tag },
  { id: 'tags' as Page, label: 'Etiquetas', icon: Bookmark },
  { id: 'account' as Page, label: 'Estado de Cuenta', icon: CreditCard },
  { id: 'query' as Page, label: 'Consultas IA', icon: Sparkles },
  { id: 'shared-expenses' as Page, label: 'Gastos Comp.', icon: Users },
];

export function ExpenseLayout({ children, activePage, onPageChange }: ExpenseLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-bg font-sans">
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen">
        {/* Sidebar Desktop */}
        <aside className="w-64 bg-white border-r border-slate-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <img src="/logopato.png" alt="Saldame Logo" className="w-28 h-28 object-contain drop-shadow-md" />
              <div>
                <h1 className="text-xl font-bold text-brand-primary">Gastos Compartidos</h1>
                <p className="text-xs font-medium text-slate-500">Control financiero</p>
              </div>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onPageChange(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                      activePage === item.id
                        ? 'bg-brand-primary text-white shadow-md'
                        : 'text-slate-800 hover:bg-slate-100 hover:text-brand-primary'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content Desktop */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col h-screen relative">
        {/* Header Mobile */}
        <header className="bg-white border-b border-slate-200 px-4 py-4 shadow-sm z-20 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logopato.png" alt="Saldame Logo" className="w-20 h-20 object-contain drop-shadow-md" />
              <div>
                <h1 className="text-lg font-bold text-brand-primary">Gastos Compartidos</h1>
                <p className="text-xs text-slate-500">
                  {navItems.find((item) => item.id === activePage)?.label}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute inset-0 top-[73px] bg-white z-50 overflow-y-auto">
            <nav className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onPageChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                      activePage === item.id
                        ? 'bg-brand-primary text-white shadow-md font-medium'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-brand-primary'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Main Content Mobile */}
        <main className="flex-1 overflow-y-auto p-4 bg-brand-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
