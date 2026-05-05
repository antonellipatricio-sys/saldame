import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
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

type Page = 'dashboard' | 'add-expense' | 'expenses' | 'upload-pdf' | 'upload-santander' | 'stats' | 'categories' | 'tags' | 'account' | 'query' | 'shared-expenses';

const PUBLIC_ROUTE = "/gastos";
const googleProvider = new GoogleAuthProvider();
const ALLOWED_EMAIL = import.meta.env.VITE_ALLOWED_EMAIL as string | undefined;

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');
  const { fetchExpenses, fetchCategories, fetchTags } = useExpenseStore();

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
      }
    });
    return unsubscribe;
  }, []);

  const handleGoogle = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: unknown) {
      setAuthError((e as Error).message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, emailInput, passwordInput);
      } else {
        await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
      }
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? '';
      if (code === 'auth/invalid-credential') setAuthError('Email o contraseña incorrectos.');
      else if (code === 'auth/email-already-in-use') setAuthError('Ese email ya está registrado.');
      else if (code === 'auth/weak-password') setAuthError('La contraseña debe tener al menos 6 caracteres.');
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

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-3 px-4 mb-4 hover:bg-slate-50 transition font-medium text-slate-700"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">o con email</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

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
              {authMode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>

          <button
            onClick={() => { setAuthMode(m => m === 'login' ? 'register' : 'login'); setAuthError(''); }}
            className="mt-4 text-xs text-slate-400 hover:text-slate-600 transition"
          >
            {authMode === 'login' ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Ingresá'}
          </button>
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
    </ExpenseLayout>
  );
}

export default App;