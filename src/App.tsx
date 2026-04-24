import { useState } from 'react';
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

type Page = 'dashboard' | 'add-expense' | 'expenses' | 'upload-pdf' | 'upload-santander' | 'stats' | 'categories' | 'tags' | 'account' | 'query';

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');

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
    </ExpenseLayout>
  );
}

export default App;