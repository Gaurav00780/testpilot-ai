import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout/AppShell';
import { Toaster } from './components/ui/sonner';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewRun    from './pages/NewRun';
import RunResults from './pages/RunResults';
import History   from './pages/History';
import Baselines from './pages/Baselines';
import Settings  from './pages/Settings';
import AiInsights from './pages/AiInsights';
import LandingPage from './pages/LandingPage';
import useAppStore from './store/useAppStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const theme = useAppStore((state) => state.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route element={<AppShell />}>
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/runs/new"   element={<NewRun />} />
            <Route path="/runs/:id"   element={<RunResults />} />
            <Route path="/history"    element={<History />} />
            <Route path="/baselines"  element={<Baselines />} />
            <Route path="/settings"   element={<Settings />} />
            <Route path="/ai-insights" element={<AiInsights />} />
          </Route>
          <Route path="*"  element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
