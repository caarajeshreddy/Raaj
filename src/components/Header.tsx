import React, { useState } from 'react';
import {
  UploadCloud,
  Download,
  ShieldCheck,
  AlertCircle,
  Coins,
  User,
  LogIn,
  LogOut,
  Users,
  Crown,
  ChevronDown,
} from 'lucide-react';
import { formatAED } from '../utils/exporter';
import { BatchSummary } from '../types/invoice';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../server/db';

interface HeaderProps {
  title: string;
  subtitle: string;
  summary: BatchSummary;
  onUploadClick: () => void;
  onExportClick: () => void;
  onOpenAuth: () => void;
  onOpenUserManagement: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  summary,
  onUploadClick,
  onExportClick,
  onOpenAuth,
  onOpenUserManagement,
}) => {
  const { user, role, logout, switchRolePreview, permissions } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const roleLabels: Record<UserRole, { label: string; color: string }> = {
    admin: { label: 'Admin', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    auditor: { label: 'Tax Auditor', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    accountant: { label: 'Accountant', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    viewer: { label: 'Viewer', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 sm:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Coins className="w-3.5 h-3.5" />
            Currency: AED
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center flex-wrap gap-2.5">
        {/* Quick KPI Stats Bar */}
        {summary.totalInvoices > 0 && (
          <div className="hidden lg:flex items-center divide-x divide-slate-200 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600">
            <div className="px-2">
              <span className="text-slate-400 block text-[9px] font-medium">INVOICES</span>
              <span className="font-bold text-slate-800">{summary.totalInvoices}</span>
            </div>
            <div className="px-2">
              <span className="text-slate-400 block text-[9px] font-medium">TOTAL SPEND</span>
              <span className="font-bold text-slate-800">AED {formatAED(summary.totalAmountAED)}</span>
            </div>
            <div className="px-2">
              <span className="text-slate-400 block text-[9px] font-medium">RECOVERABLE VAT</span>
              <span className="font-bold text-emerald-600">AED {formatAED(summary.totalVatAED)}</span>
            </div>
          </div>
        )}

        {/* Role Selector / RBAC Preview Switcher */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                roleLabels[role].color
              }`}
              title="Click to switch active role preview"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Role: {roleLabels[role].label}</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-30 text-xs">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Active Role (RBAC)
                </div>
                {(['admin', 'auditor', 'accountant', 'viewer'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchRolePreview(r);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between ${
                      role === r
                        ? 'bg-blue-50 text-blue-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{roleLabels[r].label}</span>
                    {role === r && <span className="text-blue-600 text-xs font-bold">✓</span>}
                  </button>
                ))}

                {role === 'admin' && (
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        onOpenUserManagement();
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 font-bold rounded-xl flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Manage Team (RBAC)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Upload Button (if permitted) */}
        {permissions.canUpload && (
          <button
            onClick={onUploadClick}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm active:scale-95 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Invoices</span>
          </button>
        )}

        {/* User Login / Profile Button */}
        {user ? (
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 border border-slate-200 transition cursor-pointer"
            title="Sign out of current account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#0e2a5c] hover:bg-blue-900 transition shadow-sm cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In / Sign Up</span>
          </button>
        )}
      </div>
    </header>
  );
};
