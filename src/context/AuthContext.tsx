import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../server/db';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  provider: 'email' | 'google';
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface Permissions {
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canBatchDelete: boolean;
  canManageRoles: boolean;
  canExport: boolean;
  canViewAuditLogs: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  role: UserRole;
  permissions: Permissions;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (email?: string, name?: string, avatarUrl?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRolePreview: (newRole: UserRole) => void;
}

const defaultPermissions: Permissions = {
  canUpload: false,
  canEdit: false,
  canDelete: false,
  canBatchDelete: false,
  canManageRoles: false,
  canExport: true,
  canViewAuditLogs: false,
};

function computePermissions(role: UserRole): Permissions {
  switch (role) {
    case 'admin':
      return {
        canUpload: true,
        canEdit: true,
        canDelete: true,
        canBatchDelete: true,
        canManageRoles: true,
        canExport: true,
        canViewAuditLogs: true,
      };
    case 'auditor':
      return {
        canUpload: true,
        canEdit: true,
        canDelete: true,
        canBatchDelete: false,
        canManageRoles: false,
        canExport: true,
        canViewAuditLogs: true,
      };
    case 'accountant':
      return {
        canUpload: true,
        canEdit: true,
        canDelete: false,
        canBatchDelete: false,
        canManageRoles: false,
        canExport: true,
        canViewAuditLogs: false,
      };
    case 'viewer':
      return {
        canUpload: false,
        canEdit: false,
        canDelete: false,
        canBatchDelete: false,
        canManageRoles: false,
        canExport: true,
        canViewAuditLogs: false,
      };
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ipt_auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user on mount or token change
  useEffect(() => {
    async function checkAuth() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem('ipt_auth_token');
          setToken(null);
          setUser(null);
        }
      } catch (e) {
        console.error('Error verifying token:', e);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      localStorage.setItem('ipt_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  };

  const loginWithGoogle = async (
    email = 'pdc-subcom@icaiauh.org',
    name = 'Tax Operations Officer',
    avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'
  ) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Google sign-in failed' };
      }

      localStorage.setItem('ipt_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole = 'accountant') => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      localStorage.setItem('ipt_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('ipt_auth_token');
    setToken(null);
    setUser(null);
  };

  const switchRolePreview = (newRole: UserRole) => {
    if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  const currentRole = user?.role || 'viewer';
  const permissions = user ? computePermissions(user.role) : defaultPermissions;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: currentRole,
        permissions,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        switchRolePreview,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
