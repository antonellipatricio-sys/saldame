import { useState, useEffect } from 'react';
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
import { Lock } from 'lucide-react';

type Page = 'dashboard' | 'add-expense' | 'expenses' | 'upload-pdf' | 'upload-santander' | 'stats' | 'categories' | 'tags' | 'account' | 'query' | 'shared-expenses';

const APP_PIN = "3124"; // ESTE ES EL PIN PARA ENTRAR A TU APP - Puedes cambiarlo aquí
const PUBLIC_ROUTE = "/gastos"; // << RUTA PUBLICA: Podes cambiar esta ruta a algo menos evidente si querés

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState('');

  const path = window.location.pathname;
  const isSharedRoute = path === PUBLIC_ROUTE || path.startsWith(`${PUBLIC_ROUTE}/`);

  useEffect(() => {
    // Revisar si ya pusimos el PIN antes
    const auth = localStorage.getItem('saldame_auth_pin');
    if (auth === btoa(APP_PIN)) {
      setIsAuthenticated(true);
    }
  }, []);

  // Ruta específica compartible, aislada y PÚBLICA
  if (isSharedRoute) {
    const isDashboard = path === PUBLIC_ROUTE || path === `${PUBLIC_ROUTE}/`;
    const groupId = isDashboard ? null : path.split(`${PUBLIC_ROUTE}/`)[1];

    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
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

  // Pantalla de bloqueo para el resto de la App (PRIVADA)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">App Privada</h1>
          <p className="text-sm text-slate-500 mb-6">Ingresa tu PIN para acceder a Saldame</p>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (pinInput === APP_PIN) {
              localStorage.setItem('saldame_auth_pin', btoa(APP_PIN));
              setIsAuthenticated(true);
            } else {
              alert('PIN Incorrecto');
              setPinInput('');
            }
          }}>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Ej: 1234"
              className="w-full text-center tracking-widest text-lg p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-blue-500 mb-4 outline-none"
              autoFocus
            />
            <button type="submit" className="w-full bg-slate-800 text-white font-medium py-3 rounded-xl hover:bg-slate-700 transition">
              Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // App Principal (Solo si isAuthenticated es true)
  return (
    <ExpenseLayout activePage={activePage} onPageChange={setActivePage}>
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