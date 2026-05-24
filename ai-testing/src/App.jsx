import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout/AppShell';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewRun    from './pages/NewRun';
import RunResults from './pages/RunResults';
import History   from './pages/History';
import Baselines from './pages/Baselines';
import Settings  from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected — wrapped in AppShell */}
          <Route element={<AppShell />}>
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/runs/new"   element={<NewRun />} />
            <Route path="/runs/:id"   element={<RunResults />} />
            <Route path="/history"    element={<History />} />
            <Route path="/baselines"  element={<Baselines />} />
            <Route path="/settings"   element={<Settings />} />
          </Route>

          {/* Default redirects */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
