import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Play, List, Box, Sparkles, Settings as SettingsIcon, ChevronLeft, LogOut } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { icon: Home, label: 'Dashboard',  to: '/dashboard' },
  { icon: Play, label: 'New Run',    to: '/runs/new' },
  { icon: List, label: 'History',    to: '/history' },
  { icon: Box, label: 'Baselines',   to: '/baselines' },
  { icon: Sparkles, label: 'AI Insights', to: '/ai-insights' },
  { icon: SettingsIcon, label: 'Settings', to: '/settings' },
];

function NavItem({ item, collapsed, isActive }) {
  const content = (
    <Link
      to={item.to}
      className={cn(
        'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group',
        isActive
          ? 'text-white bg-white/10 font-medium'
          : 'text-gray-400 hover:text-white hover:bg-white/5',
        collapsed ? 'justify-center mx-1' : 'mx-0'
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-full" />
      )}
      <item.icon className={cn(
        'w-5 h-5 shrink-0 transition-colors',
        isActive ? 'text-accent' : 'text-gray-400 group-hover:text-white'
      )} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={12}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, user, clearUser, mobileSidebarOpen, setMobileSidebarOpen } = useAppStore();

  // Keyboard shortcut: Ctrl+B to toggle sidebar
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSidebar]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearUser();
    window.location.href = '/login';
  };

  return (
    <TooltipProvider>
      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 flex flex-col bg-[#09090b] text-white transition-all duration-200 ease-in-out min-h-[100dvh]',
          sidebarCollapsed ? 'w-60 md:w-16' : 'w-60',
          !mobileSidebarOpen ? '-translate-x-full md:translate-x-0' : 'translate-x-0'
        )}
      >
        {/* Toggle button - positioned at the right edge */}
        <div className={cn(
          'absolute -right-3 top-5 z-20 hidden md:block',
          'transition-transform duration-200',
        )}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
              'h-6 w-6 rounded-full border border-white/10 bg-zinc-800',
              'text-zinc-400 hover:text-white hover:bg-zinc-700',
              'shadow-md transition-all duration-200',
            )}
            title={sidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          >
            <ChevronLeft className={cn(
              'h-3 w-3 transition-transform duration-200',
              sidebarCollapsed && 'rotate-180'
            )} />
          </Button>
        </div>

        {/* Logo */}
        <div className={cn(
          'flex items-center h-14 shrink-0 transition-all duration-200',
          sidebarCollapsed ? 'justify-start px-5 md:justify-center md:px-0' : 'px-5'
        )}>
          {sidebarCollapsed ? (
            <>
              <span className="text-primary text-xl font-bold md:hidden mr-2">T</span>
              <span className="text-base font-semibold tracking-tight md:hidden">
                <span className="text-primary">Test</span>
                <span className="text-white">Pilot AI</span>
              </span>
              <span className="text-primary text-xl font-bold hidden md:block">T</span>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-primary text-xl font-bold">T</span>
              <span className="text-base font-semibold tracking-tight">
                <span className="text-primary">Test</span>
                <span className="text-white">Pilot AI</span>
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto scrollbar-thin space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.to ||
              (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
            return <NavItem key={item.to} item={item} collapsed={sidebarCollapsed} isActive={isActive} />;
          })}
        </nav>

        {/* Bottom Area */}
        <div className={cn(
          'flex flex-col gap-2 pb-3',
          sidebarCollapsed ? 'items-center px-2' : 'px-3'
        )}>
          {/* User profile */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                onClick={handleSignOut}
                className={cn(
                  'flex items-center gap-3 hover:bg-white/5 p-2 rounded-lg cursor-pointer transition-colors group',
                  sidebarCollapsed ? 'justify-center w-full' : 'w-full'
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-emerald-950 text-emerald-400 font-bold text-xs">
                    {user?.email?.[0]?.toUpperCase() || 'T'}
                  </AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate leading-tight">
                        {user?.email?.split('@')[0] || 'test'}
                      </p>
                      <p className="text-[11px] text-gray-500">Free Plan</p>
                    </div>
                    <LogOut className="w-3.5 h-3.5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </>
                )}
              </div>
            </TooltipTrigger>
            {sidebarCollapsed && (
              <TooltipContent side="right" sideOffset={12}>
                <p>{user?.email || 'test@gmail.com'}</p>
                <p className="text-gray-400">Free Plan</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
