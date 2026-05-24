import { Link, useLocation } from 'react-router-dom';
import { Home, Play, List, Box, Sparkles, Settings as SettingsIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const NAV_ITEMS = [
  { icon: Home, label: 'Dashboard',  to: '/dashboard' },
  { icon: Play, label: 'New Run',     to: '/runs/new' },
  { icon: List, label: 'History',     to: '/history' },
  { icon: Box, label: 'Baselines',   to: '/baselines' },
  { icon: Sparkles, label: 'AI Insights', to: '/ai-insights' },
  { icon: SettingsIcon, label: 'Settings',    to: '/settings' },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, user, clearUser } = useAppStore();

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearUser();
    window.location.href = '/login';
  };

  return (
    <aside
      className={`
        flex flex-col bg-[#111319] text-white shrink-0 sidebar-transition
        ${sidebarCollapsed ? 'w-20' : 'w-64'}
      `}
      style={{ minHeight: '100vh' }}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 ${sidebarCollapsed ? 'justify-center' : 'px-6'}`}>
        {sidebarCollapsed ? (
          <span className="text-accent font-sans text-xl font-bold">T</span>
        ) : (
          <span className="font-sans text-xl font-bold tracking-tight text-white flex items-center gap-1">
            <span className="text-accent">Test</span>Pilot AI
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              title={sidebarCollapsed ? item.label : undefined}
              className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group
                ${isActive
                  ? 'text-white bg-[#1C1F2A] font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-6 before:bg-accent before:rounded-r-full'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
                ${sidebarCollapsed ? 'justify-center px-0 before:left-[-12px]' : ''}
              `}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-accent' : 'text-gray-400 group-hover:text-white'} transition-colors`} />
              {!sidebarCollapsed && <span>{item.label}</span>}
              {sidebarCollapsed && (
                <span className="
                  absolute left-full ml-3 px-2 py-1 text-xs bg-white text-ink rounded
                  opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                  whitespace-nowrap z-50 shadow-lg
                ">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Area */}
      <div className="p-4 flex flex-col gap-4">
        {/* Pro Plan Card */}
        {!sidebarCollapsed && (
          <div className="bg-[#1C1F2A] rounded-xl p-4 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 text-white/20 hover:text-white/60 cursor-pointer">
              <span className="text-xs">×</span>
            </div>
            <h3 className="text-white font-medium text-sm mb-1">Pro Plan</h3>
            <p className="text-gray-400 text-xs mb-4 leading-relaxed">
              Upgrade for more tests, parallel runs and advanced AI insights.
            </p>
            <button className="w-full bg-[#2A2D3C] hover:bg-[#34384A] text-white text-sm py-2 rounded-lg transition-colors font-medium">
              Upgrade Now
            </button>
          </div>
        )}

        {/* User profile */}
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-lg cursor-pointer transition-colors" onClick={handleSignOut}>
            <div className="w-8 h-8 rounded-full bg-[#1a2b5b] text-[#5584f2] flex items-center justify-center font-bold text-sm shrink-0">
              {user?.email?.[0]?.toUpperCase() || 'T'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{user?.email || 'test@gmail.com'}</p>
              <p className="text-xs text-gray-400">Free Plan</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        ) : (
          <div className="flex justify-center mt-2 cursor-pointer" onClick={handleSignOut}>
             <div className="w-8 h-8 rounded-full bg-[#1a2b5b] text-[#5584f2] flex items-center justify-center font-bold text-sm">
              {user?.email?.[0]?.toUpperCase() || 'T'}
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className={`flex items-center gap-2 text-gray-400 hover:text-white text-xs font-medium transition-colors p-2 mt-2
            ${sidebarCollapsed ? 'justify-center' : ''}
          `}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
