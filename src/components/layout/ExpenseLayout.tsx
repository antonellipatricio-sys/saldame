import React, { useCallback, useState } from 'react';
import { Home, PlusCircle, List, Tag, Bookmark, CreditCard, Sparkles, Users, LogOut, UserCircle2, BarChart3, MoreHorizontal, type LucideIcon } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { cn } from '@/lib/utils';

type Page = 'dashboard' | 'add-expense' | 'expenses' | 'upload-pdf' | 'upload-santander' | 'stats' | 'categories' | 'tags' | 'account' | 'query' | 'shared-expenses' | 'responsables';

interface ExpenseLayoutProps {
  children: React.ReactNode;
  activePage: Page;
  onPageChange: (page: Page) => void;
  onLogout?: () => void;
}

interface NavItem {
  id: Page;
  label: string;
  mobileLabel: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: 'account',         label: 'Estado de Cuenta', mobileLabel: 'Estado de cuenta',   icon: CreditCard },
  { id: 'add-expense',     label: 'Agregar Gasto',    mobileLabel: 'Agregar gasto',      icon: PlusCircle },
  { id: 'expenses',        label: 'Mis Gastos',       mobileLabel: 'Mis gastos',         icon: List },
  { id: 'dashboard',       label: 'Inicio',           mobileLabel: 'Inicio',             icon: Home },
  { id: 'stats',           label: 'Estadísticas',     mobileLabel: 'Estadísticas',       icon: BarChart3 },
  { id: 'categories',      label: 'Categorías',       mobileLabel: 'Categorías',         icon: Tag },
  { id: 'tags',            label: 'Etiquetas',        mobileLabel: 'Etiquetas',          icon: Bookmark },
  { id: 'responsables',    label: 'Responsables',     mobileLabel: 'Responsables',       icon: UserCircle2 },
  { id: 'query',           label: 'Consultas IA',     mobileLabel: 'Consultas IA',       icon: Sparkles },
  { id: 'shared-expenses', label: 'Gastos Comp.',     mobileLabel: 'Gastos compartidos', icon: Users },
];

// Barra inferior en mobile: estos cuatro quedan fijos, el resto va en "Más"
const PRIMARY_MOBILE: Page[] = ['dashboard', 'add-expense', 'expenses', 'account'];
const primaryItems = PRIMARY_MOBILE.map((id) => navItems.find((item) => item.id === id)!);
const primaryShortLabels: Partial<Record<Page, string>> = { account: 'Estado', 'add-expense': 'Agregar' };
const moreItems = navItems.filter((item) => !PRIMARY_MOBILE.includes(item.id));

function BottomNavButton({ icon: Icon, label, active, onClick }: { icon: LucideIcon; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex flex-col items-center justify-center gap-1 min-h-[56px] pt-1.5 pb-1',
        active ? 'text-brand-primary' : 'text-slate-500'
      )}
    >
      <span className={cn('flex items-center justify-center w-12 h-7 rounded-full transition-colors', active && 'bg-brand-primary/10')}>
        <Icon className="w-5 h-5" />
      </span>
      <span className={cn('text-[11px] leading-none', active ? 'font-bold' : 'font-medium')}>{label}</span>
    </button>
  );
}

export function ExpenseLayout({ children, activePage, onPageChange, onLogout }: ExpenseLayoutProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const closeMore = useCallback(() => setMoreOpen(false), []);
  const isMoreActive = moreItems.some((item) => item.id === activePage);
  const activeLabel = navItems.find((item) => item.id === activePage)?.mobileLabel ?? 'Cuack';

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
      <div className="md:hidden flex flex-col h-dvh pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        {/* Header Mobile */}
        <header className="bg-white border-b border-slate-200 px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] z-20 flex-shrink-0">
          <div className="flex items-center gap-2 h-11">
            <img src="/logopato.png" alt="Cuack" className="w-9 h-9 object-contain" />
            <h1 className="text-lg font-bold text-slate-800 truncate">{activeLabel}</h1>
          </div>
        </header>

        {/* Main Content Mobile */}
        <main className="flex-1 overflow-y-auto overscroll-contain p-4 bg-brand-bg">
          {children}
        </main>

        {/* Bottom Nav Bar — 4 accesos fijos + Más */}
        <nav
          aria-label="Navegación principal"
          className="bg-white border-t border-slate-200 flex-shrink-0 z-20 pb-[env(safe-area-inset-bottom)]"
        >
          <div className="grid grid-cols-5">
            {primaryItems.map((item) => (
              <BottomNavButton
                key={item.id}
                icon={item.icon}
                label={primaryShortLabels[item.id] ?? item.mobileLabel}
                active={activePage === item.id}
                onClick={() => onPageChange(item.id)}
              />
            ))}
            <BottomNavButton
              icon={MoreHorizontal}
              label="Más"
              active={isMoreActive || moreOpen}
              onClick={() => setMoreOpen(true)}
            />
          </div>
        </nav>

        <BottomSheet open={moreOpen} onClose={closeMore} title="Más secciones">
          <ul className="px-2">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onPageChange(item.id);
                      closeMore();
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'w-full flex items-center gap-4 px-3 min-h-[52px] rounded-xl text-left',
                      isActive ? 'bg-brand-primary/10 text-brand-primary' : 'text-slate-700 active:bg-slate-100'
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-semibold">{item.mobileLabel}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {onLogout && (
            <div className="mt-2 mx-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  closeMore();
                  onLogout();
                }}
                className="w-full flex items-center gap-4 px-3 min-h-[52px] rounded-xl text-left text-red-600 active:bg-red-50"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="font-semibold">Cerrar sesión</span>
              </button>
            </div>
          )}
        </BottomSheet>
      </div>
    </div>
  );
}
