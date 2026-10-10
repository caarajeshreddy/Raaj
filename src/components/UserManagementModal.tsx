import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Crown,
  Eye,
  FileCheck,
  Building,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../server/db';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OrgUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  provider: 'email' | 'google';
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt: string;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { token, user: currentUser, switchRolePreview } = useAuth();
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.users) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, token]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setSavingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        if (currentUser?.id === userId) {
          switchRolePreview(newRole);
        }
      }
    } catch (e) {
      console.error('Failed to update user role:', e);
    } finally {
      setSavingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#0e2a5c] via-[#123673] to-[#0a2046] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold">
              <Users className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">
                Role-Based Access Control (RBAC) & Team Management
              </h3>
              <p className="text-[11px] text-blue-200">
                Manage user permissions and security policies for UAE tax operations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Roles Capabilities Matrix */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 text-blue-900 font-extrabold mb-1">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>Admin</span>
            </div>
            <p className="text-[10px] text-slate-500">
              Full access, batch delete, user role management, system settings.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 text-blue-900 font-extrabold mb-1">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tax Auditor</span>
            </div>
            <p className="text-[10px] text-slate-500">
              Audit TRNs, flag discrepancies, view audit logs, export reports.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 text-blue-900 font-extrabold mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Accountant</span>
            </div>
            <p className="text-[10px] text-slate-500">
              Upload invoices, edit descriptions & line items, Zoho/Tally export.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 text-blue-900 font-extrabold mb-1">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Viewer</span>
            </div>
            <p className="text-[10px] text-slate-500">
              Read-only view for dashboard, batch summaries, and reports.
            </p>
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-800">
              Organization Members ({users.length})
            </span>
            <button
              onClick={fetchUsers}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
            {users.map((u) => {
              const isCurrentUser = currentUser?.id === u.id;
              return (
                <div
                  key={u.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        u.avatarUrl ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}&backgroundColor=0e2a5c`
                      }
                      alt={u.name}
                      className="w-10 h-10 rounded-full border border-slate-200 object-cover shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                            You
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            u.provider === 'google'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {u.provider}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-xs text-slate-400 hidden md:inline">
                      Role:
                    </span>
                    <select
                      value={u.role}
                      disabled={savingId === u.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="admin">Admin (Full Control)</option>
                      <option value="auditor">Tax Auditor (Audit/Flag)</option>
                      <option value="accountant">Accountant (Upload/Edit)</option>
                      <option value="viewer">Viewer (Read-Only)</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
