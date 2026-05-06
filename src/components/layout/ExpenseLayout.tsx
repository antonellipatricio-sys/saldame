import React from 'react';
import { Home, PlusCircle, List, Tag, Bookmark, CreditCard, Sparkles, Users, LogOut, UserCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Page = 'dashboard' | 'add-expense' | 'expenses' | 'upload-pdf' | 'upload-santander' | 'stats' | 'categories' | 'tags' | 'account' | 'query' | 'shared-expenses' | 'responsables';

interface ExpenseLayoutProps {
  children: React.ReactNode;
  activePage: Page;
  onPageChange: (page: Page) => void;
  onLogout?: () => void;
}

const navItems = [
  { id: 'account'         as Page, label: 'Estado de Cuenta', icon: CreditCard },
  { id: 'add-expense'     as Page, label: 'Agregar Gasto',    icon: PlusCircle },
  { id: 'expenses'        as Page, label: 'Mis Gastos',        icon: List },
  { id: 'dashboard'       as Page, label: 'Inicio',            icon: Home },
  { id: 'categories'      as Page, label: 'Categorías',        icon: Tag },
  { id: 'tags'            as Page, label: 'Etiquetas',         icon: Bookmark },
  { id: 'responsables'    as Page, label: 'Responsables',      icon: UserCircle2 },
  { id: 'query'           as Page, label: 'Consultas IA',      icon: Sparkles },
  { id: 'shared-expenses' as Page, label: 'Gastos Comp.',      icon: Users },
];

export function ExpenseLayout({ children, activePage, onPageChange, onLogout }: ExpenseLayoutProps) {
  return (
    <div className="min-h-screen bg-brand-bg font-sans">
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen">
        {/* Sidebar Desktop */}
        <aside className="w-64 bg-white border-r border-slate-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <img src="/logopato.png" alt="Cuack Logo" className="w-28 h-28 object-contain drop-shadow-md" />
              <div>
                <h1 className="text-xl font-bold text-brand-primary leading-tight">Cuack Cuentas Claras</h1>
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
            {onLogout && (
              <button
                onClick={onLogout}
                className="mt-4 w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-semibold">Cerrar sesión</span>
              </button>
            )}
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
      <div className="md:hidden flex flex-col h-screen">
        {/* Header Mobile */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm z-20 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logopato.png" alt="Cuack Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
              <div>
                <h1 className="text-base font-bold text-brand-primary leading-tight">Cuack</h1>
                <p className="text-[11px] text-slate-500 leading-none">
                  {navItems.find((item) => item.id === activePage)?.label}
                </p>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* Main Content Mobile */}
        <main className="flex-1 overflow-y-auto p-4 bg-brand-bg pb-2">
          {children}
        </main>

        {/* Bottom Nav Bar — siempre visible */}
        <nav className="bg-white border-t border-slate-200 shadow-[0_-1px_8px_rgba(0,0,0,0.06)] flex-shrink-0 z-20">
          <div className="flex overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-w-[60px] flex-shrink-0 transition-colors',
                    isActive
                      ? 'text-brand-primary'
                      : 'text-slate-400 hover:text-slate-600'
                  )}
                >
                  <Icon className={cn('w-5 h-5', isActive && 'drop-shadow-sm')} />
                  <span className={cn('text-[9px] leading-none font-medium text-center', isActive ? 'text-brand-primary' : 'text-slate-400')}>
                    {item.label.split(' ')[0]}
                  </span>
                  {isActive && <span className="w-1 h-1 rounded-full bg-brand-primary mt-0.5" />}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
