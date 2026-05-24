import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import useAppStore from '../../store/useAppStore';

export function AppShell({ run }) {
  const { user } = useAppStore();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar run={run} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
