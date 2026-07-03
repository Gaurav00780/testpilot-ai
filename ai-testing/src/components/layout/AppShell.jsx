import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import useAppStore from '../../store/useAppStore';
import { cn } from '@/lib/utils';

export function AppShell({ run }) {
  const { user, sidebarCollapsed, setMobileSidebarOpen } = useAppStore();
  const location = useLocation();

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location, setMobileSidebarOpen]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-200 ease-in-out',
          sidebarCollapsed ? 'ml-0 md:ml-16' : 'ml-0 md:ml-60'
        )}
        data-sidebar-collapsed={sidebarCollapsed}
      >
        <TopBar run={run} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
