import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { 
  AlertTriangle, 
  Bell, 
  Menu, 
  Search, 
  Ship
} from 'lucide-react';
import { clsx } from 'clsx';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const navItems = [
    { path: '/rules', icon: AlertTriangle, label: '全局预警规则' },
    { path: '/templates', icon: Bell, label: '通知模板与渠道' },
    { path: '/shipments', icon: Ship, label: '单票监控台' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside 
        className={clsx(
          "bg-slate-900 text-white transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-20",
          isSidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded bg-indigo-500 flex items-center justify-center shrink-0">
              <span className="font-bold text-white">L</span>
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-lg whitespace-nowrap">YIDAM Pro</span>
            )}
          </div>
        </div>

        <nav className="flex-1 py-6 px-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group relative",
                isActive 
                  ? "bg-indigo-600 text-white" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {isSidebarOpen && (
                <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              )}
              {!isSidebarOpen && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center gap-3 text-slate-400 hover:text-white w-full"
          >
            <Menu className="w-5 h-5" />
            {isSidebarOpen && <span className="text-sm">收起菜单</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={clsx(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          isSidebarOpen ? "ml-64" : "ml-16"
        )}
      >
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-slate-800">
              {navItems.find(item => item.path === location.pathname)?.label || '工作台'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="全局搜索..." 
                className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500 w-64 outline-none"
              />
            </div>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-medium">
              JD
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 flex-1 overflow-auto bg-slate-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}