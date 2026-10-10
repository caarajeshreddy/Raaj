import React from 'react';
import {
  Home,
  LayoutDashboard,
  UploadCloud,
  TableProperties,
  BarChart2,
  FileCheck2,
  DownloadCloud,
  ShieldCheck,
  Receipt,
  Users,
  LogIn,
  LogOut,
  Crown,
  Eye,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type ActiveTab = 'home' | 'dashboard' | 'upload' | 'table' | 'summary' | 'vat201' | 'export';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  invoiceCount: number;
  flaggedCount: number;
  onOpenAuth: () => void;
  onOpenUserManagement: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  invoiceCount,
  flaggedCount,
  onOpenAuth,
  onOpenUserManagement,
}) => {
  const { user, role, logout } = useAuth();

  const navItems = [
    {
      id: 'home' as ActiveTab,
      label: 'Home Portal',
      description: 'Overview & Enterprise Hub',
      icon: Home,
      badge: null,
    },
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      description: 'Analytics & Spend Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'upload' as ActiveTab,
      label: 'Invoice Upload',
      description: 'PDF, Camera & Images',
      icon: UploadCloud,
      badge: null,
    },
    {
      id: 'table' as ActiveTab,
      label: 'Invoice Audit Table',
      description: 'Editable Data & Checks',
      icon: TableProperties,
      badge: invoiceCount > 0 ? invoiceCount : null,
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'summary' as ActiveTab,
      label: 'Batch Summary',
      description: 'Batch & Invoice Insights',
      icon: BarChart2,
      badge: null,
    },
    {
      id: 'vat201' as ActiveTab,
      label: 'UAE VAT 201 Return',
      description: 'FTA Box 9 & Emirate Split',
      icon: FileCheck2,
      badge: null,
    },
    {
      id: 'export' as ActiveTab,
      label: 'Export Center',
      description: 'Zoho, Tally, Excel, PDF',
      icon: DownloadCloud,
      badge: null,
    },
  ];

  const getRoleBadgeStyle = (r: string) => {
    switch (r) {
      case 'admin':
        return 'bg-amber-400/20 text-amber-300 border-amber-400/30';
      case 'auditor':
        return 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30';
      case 'accountant':
        return 'bg-blue-400/20 text-blue-300 border-blue-400/30';
      default:
        return 'bg-slate-400/20 text-slate-300 border-slate-400/30';
    }
  };

  return (
    <aside className="w-72 bg-gradient-to-b from-[#0e2a5c] via-[#123673] to-[#0a2046] text-white flex flex-col h-screen shrink-0 border-r border-blue-900 shadow-xl select-none z-20">
      {/* Brand Header */}
      <div className="p-6 border-b border-blue-800/60">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-xl tracking-tight border border-blue-300/30">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-wide text-white">IPT</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                UAE VAT
              </span>
            </div>
            <p className="text-xs text-blue-200/80 font-medium">Invoice Processing Tool</p>
          </div>
        </div>
      </div>

      {/* User / RBAC Profile Banner */}
      <div className="mx-3 mt-3 p-3 rounded-xl bg-blue-950/60 border border-blue-700/40 text-xs flex items-center justify-between">
        {user ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={
                user.avatarUrl ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=0e2a5c`
              }
              alt={user.name}
              className="w-8 h-8 rounded-full border border-blue-400/40 shrink-0 object-cover"
            />
            <div className="min-w-0">
              <p className="font-bold text-white truncate text-[11px]">{user.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(
                    role
                  )}`}
                >
                  {role}
                </span>
                {role === 'admin' && (
                  <button
                    onClick={onOpenUserManagement}
                    className="text-[9px] text-blue-300 hover:text-white underline cursor-pointer ml-1"
                  >
                    RBAC
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="text-[11px] text-blue-200">
              <p className="font-semibold text-white">Guest Session</p>
              <p className="text-blue-300/80 text-[10px]">Read-only / Unsaved</p>
            </div>
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition cursor-pointer"
            >
              <LogIn className="w-3 h-3" />
              <span>Sign In</span>
            </button>
          </div>
        )}

        {user && (
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-blue-300 hover:text-rose-300 hover:bg-blue-900/60 transition cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-300/60">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 group ${
                isActive
                  ? 'bg-white text-[#0e2a5c] shadow-lg font-semibold'
                  : 'text-blue-100/90 hover:bg-blue-800/40 hover:text-white font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-[#0e2a5c]'
                      : 'bg-blue-900/50 text-blue-300 group-hover:text-white group-hover:bg-blue-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs leading-snug font-bold">{item.label}</div>
                  <div
                    className={`text-[10px] leading-tight ${
                      isActive ? 'text-blue-800/70' : 'text-blue-300/60'
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
              </div>

              {item.badge !== null && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-xs ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-800/80 text-blue-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Admin Team Management Nav Link */}
        {role === 'admin' && (
          <button
            onClick={onOpenUserManagement}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-amber-200/90 hover:bg-blue-800/40 hover:text-white font-medium transition cursor-pointer"
          >
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs leading-snug font-bold">Manage Roles (RBAC)</div>
              <div className="text-[10px] text-blue-300/60">User Permissions Matrix</div>
            </div>
          </button>
        )}
      </nav>

      {/* Audit Status Card in Footer */}
      <div className="p-4 border-t border-blue-800/60 bg-blue-950/40 shrink-0">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-blue-300 font-medium">Batch Status</span>
          <span className="text-white font-bold">{invoiceCount} Invoices</span>
        </div>
        <div className="w-full bg-blue-900/60 rounded-full h-2 overflow-hidden flex">
          {invoiceCount > 0 ? (
            <>
              <div
                className="bg-emerald-400 h-full transition-all duration-300"
                style={{
                  width: `${Math.round(((invoiceCount - flaggedCount) / invoiceCount) * 100)}%`,
                }}
                title="Compliant"
              />
              <div
                className="bg-amber-400 h-full transition-all duration-300"
                style={{
                  width: `${Math.round((flaggedCount / invoiceCount) * 100)}%`,
                }}
                title="Flagged"
              />
            </>
          ) : (
            <div className="bg-blue-800 w-full h-full" />
          )}
        </div>
        <div className="flex items-center justify-between text-[11px] mt-2 text-blue-300/80">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            {invoiceCount - flaggedCount} Valid
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            {flaggedCount} Flagged
          </span>
        </div>
      </div>
    </aside>
  );
};
