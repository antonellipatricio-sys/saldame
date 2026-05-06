import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useExpenseStore } from '@/store/useExpenseStore';
import { ExpenseLayout } from './components/layout/ExpenseLayout';
import { DashboardPage } from './pages/DashboardPage';
import { AddExpensePage } from './pages/AddExpensePage';
import { ExpensesListPage } from './pages/ExpensesListPage';
import { UploadPDFPage } from './pages/UploadPDFPage';
import { UploadSantanderPage } from './pages/UploadSantanderPage';
import { StatsPage } from './pages/StatsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { TagsPage } from './pages/TagsPage';
import { AccountPage } from './pages/AccountPage';
import { QueryPage } from './pages/QueryPage';
import { SharedExpensesPage } from './pages/SharedExpensesPage';
import { SharedExpensesDashboard } from './pages/SharedExpensesDashboard';
import { ResponsablesPage } from './pages/ResponsablesPage';

type Page = 'dashboard' | 'add-expense' | 'expenses' | 'upload-pdf' | 'upload-santander' | 'stats' | 'categories' | 'tags' | 'account' | 'query' | 'shared-expenses' | 'responsables';

const PUBLIC_ROUTE = "/gastos";
const ALLOWED_EMAIL = import.meta.env.VITE_ALLOWED_EMAIL as string | undefined;

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const { fetchExpenses, fetchCategories, fetchTags, fetchResponsables } = useExpenseStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && ALLOWED_EMAIL && firebaseUser.email !== ALLOWED_EMAIL) {
        await signOut(auth);
        setAuthError('No tenés permiso para acceder a esta app.');
        setAuthLoading(false);
        return;
      }
      setUser(firebaseUser);
      setAuthLoading(false);
      if (firebaseUser) {
        fetchExpenses();
        fetchCategories();
        fetchTags();
        fetchResponsables();
      }
    });
    return unsubscribe;
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, emailInput, passwordInput);
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? '';
      if (code === 'auth/invalid-credential') setAuthError('Email o contraseña incorrectos.');
      else setAuthError('Error al autenticar. Intente nuevamente.');
    }
  };

  const path = window.location.pathname;
  const hostname = window.location.hostname;

  const isCustomDomain = hostname === 'cuack.ar' || hostname === 'www.cuack.ar';
  const isSharedRoute = isCustomDomain || path === PUBLIC_ROUTE || path.startsWith(`${PUBLIC_ROUTE}/`);
  if (isSharedRoute) {
    let isDashboard = false;
    let groupId = null;

    if (isCustomDomain && !path.startsWith(PUBLIC_ROUTE)) {
      isDashboard = path === '/' || path === '';
      // Si entran a cuack.ar/abc1234 -> el groupId es abc1234
      groupId = isDashboard ? null : path.replace(/^\//, '');
    } else {
      isDashboard = path === PUBLIC_ROUTE || path === `${PUBLIC_ROUTE}/`;
      groupId = isDashboard ? null : path.split(`${PUBLIC_ROUTE}/`)[1];
    }

    return (
      <div className="min-h-screen bg-brand-bg p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {isDashboard ? (
            <SharedExpensesDashboard />
          ) : (
            <SharedExpensesPage groupId={groupId} />
          )}
        </div>
      </div>
    );
  }

  // Pantalla de carga mientras verifica sesión
  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-center">
          <img src="/logopato.png" alt="Saldame" className="w-20 h-20 object-contain mx-auto mb-4 animate-pulse" />
          <p className="text-brand-text text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  // Pantalla de login (solo si no es ruta pública)
  if (!user && !isSharedRoute) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-sm w-full text-center">
          <img src="/logopato.png" alt="Saldame" className="w-20 h-20 object-contain mx-auto mb-3 drop-shadow-md" />
          <h1 className="text-2xl font-bold text-brand-primary mb-1">Saldame</h1>
          <p className="text-sm text-brand-text mb-6">Ingresá para acceder a tus gastos</p>

          <form onSubmit={handleEmailAuth} className="space-y-3 text-left">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none text-sm"
            />
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Contraseña"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none text-sm"
            />
            {authError && <p className="text-red-500 text-xs text-center">{authError}</p>}
            <button type="submit" className="w-full bg-brand-success text-white font-semibold py-2.5 rounded-xl hover:opacity-90 transition text-sm">
              Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // App Principal (Solo si isAuthenticated es true)
  return (
    <ExpenseLayout activePage={activePage} onPageChange={setActivePage} onLogout={() => signOut(auth)}>
      {activePage === 'dashboard' && <DashboardPage />}
      {activePage === 'add-expense' && <AddExpensePage />}
      {activePage === 'expenses' && <ExpensesListPage />}
      {activePage === 'upload-pdf' && <UploadPDFPage />}
      {activePage === 'upload-santander' && <UploadSantanderPage />}
      {activePage === 'stats' && <StatsPage />}
      {activePage === 'categories' && <CategoriesPage />}
      {activePage === 'tags' && <TagsPage />}
      {activePage === 'account' && <AccountPage />}
      {activePage === 'query' && <QueryPage />}
      {activePage === 'shared-expenses' && <SharedExpensesDashboard />}
      {activePage === 'responsables' && <ResponsablesPage />}
    </ExpenseLayout>
  );
}

export default App;