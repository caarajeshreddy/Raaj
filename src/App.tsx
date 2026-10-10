import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { DashboardView } from './components/DashboardView';
import { UploadView } from './components/UploadView';
import { InvoiceTableView } from './components/InvoiceTableView';
import { BatchSummaryView } from './components/BatchSummaryView';
import { Vat201View } from './components/Vat201View';
import { ExportView } from './components/ExportView';
import { AuthModal } from './components/AuthModal';
import { UserManagementModal } from './components/UserManagementModal';
import { UAEInvoice, BatchSummary } from './types/invoice';
import { calculateBatchSummary, validateInvoice } from './utils/validation';
import { exportToExcel } from './utils/exporter';
import { useAuth } from './context/AuthContext';

const STORAGE_KEY = 'ipt_uae_invoices_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [userMgmtOpen, setUserMgmtOpen] = useState(false);
  const { token, user } = useAuth();

  // Invoices state with persistent database sync
  const [invoices, setInvoices] = useState<UAEInvoice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((inv: UAEInvoice) => {
            const issues = validateInvoice(inv);
            return {
              ...inv,
              validationIssues: issues,
              isValid: !issues.some((i) => i.severity === 'error'),
            };
          });
        }
      }
    } catch (e) {
      console.error('Failed to load local cached invoices:', e);
    }
    return [];
  });

  // Fetch invoices from backend database
  const refreshInvoicesFromDb = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/invoices', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.invoices)) {
          const validated = data.invoices.map((inv: any) => {
            const issues = validateInvoice(inv);
            return {
              ...inv,
              validationIssues: issues,
              isValid: !issues.some((i: any) => i.severity === 'error'),
            };
          });
          setInvoices(validated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
        }
      }
    } catch (e) {
      console.error('Failed to fetch invoices from database:', e);
    }
  }, [token]);

  useEffect(() => {
    refreshInvoicesFromDb();
  }, [refreshInvoicesFromDb]);

  // Synchronize local cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    } catch (e) {
      console.error('Failed to cache invoices:', e);
    }
  }, [invoices]);

  // Calculate batch summary
  const summary: BatchSummary = useMemo(() => {
    return calculateBatchSummary(invoices);
  }, [invoices]);

  // Handlers for invoice actions
  const handleInvoicesAdded = async (newInvoices: UAEInvoice[]) => {
    // 1. Update local state
    setInvoices((prev) => [...prev, ...newInvoices]);

    // 2. Persist to server database
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/invoices', {
        method: 'POST',
        headers,
        body: JSON.stringify({ invoices: newInvoices }),
      });
    } catch (e) {
      console.error('Failed to persist invoices to server:', e);
    }

    // Switch to table view so user can review the extracted table
    setActiveTab('table');
  };

  const handleUpdateInvoice = async (updated: UAEInvoice) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/invoices/${updated.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.error('Failed to update invoice in database:', e);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));

    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
        headers,
      });
    } catch (e) {
      console.error('Failed to delete invoice in database:', e);
    }
  };

  const handleDeleteMultiple = async (ids: string[]) => {
    const idSet = new Set(ids);
    setInvoices((prev) => prev.filter((inv) => !idSet.has(inv.id)));

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/invoices/batch-delete', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ids }),
      });
    } catch (e) {
      console.error('Failed to batch delete invoices in database:', e);
    }
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  // Header Titles
  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'home':
        return {
          title: 'UAE Tax Portal & Enterprise Hub',
          subtitle: 'Executive overview, compliance highlights, and quick access to accounting workflows.',
        };
      case 'dashboard':
        return {
          title: 'UAE Tax Invoice Dashboard',
          subtitle: 'Interactive spend analytics, VAT distribution, and FTA compliance metrics.',
        };
      case 'upload':
        return {
          title: 'Invoice Upload & Processing',
          subtitle: 'Multi-document drag-and-drop extraction for UAE PDF and image invoices.',
        };
      case 'table':
        return {
          title: 'Invoice Audit Table',
          subtitle: 'Clean, editable on-screen table with 15-digit TRN, 5% VAT rate, and Place of Supply audits.',
        };
      case 'summary':
        return {
          title: 'Batch & Individual Summary',
          subtitle: 'Granular reconciliations for single invoices and the overall batch.',
        };
      case 'vat201':
        return {
          title: 'UAE VAT 201 Return Helper',
          subtitle: 'Pre-computed FTA Form 201 Box 9 Standard-Rated Expenses and 7 Emirates allocation.',
        };
      case 'export':
        return {
          title: 'Export Center',
          subtitle: 'One-click exports for Zoho Books (UAE), Tally Prime (UAE VAT), Master Excel, CSV, and PDF.',
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Left-side Panel in Blue and White Combination */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        invoiceCount={summary.totalInvoices}
        flaggedCount={summary.flaggedInvoices}
        onOpenAuth={() => handleOpenAuth('login')}
        onOpenUserManagement={() => setUserMgmtOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          summary={summary}
          onUploadClick={() => setActiveTab('upload')}
          onExportClick={() => exportToExcel(invoices, summary)}
          onOpenAuth={() => handleOpenAuth('login')}
          onOpenUserManagement={() => setUserMgmtOpen(true)}
        />

        {/* Viewport View Container */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {activeTab === 'home' && (
            <HomePage
              summary={summary}
              onGetStarted={() => setActiveTab('upload')}
              onOpenAuth={() => handleOpenAuth('login')}
              onOpenDashboard={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              summary={summary}
              invoices={invoices}
              onNavigateToUpload={() => setActiveTab('upload')}
              onNavigateToTable={() => setActiveTab('table')}
            />
          )}

          {activeTab === 'upload' && (
            <UploadView
              onInvoicesAdded={handleInvoicesAdded}
              onNavigateToTable={() => setActiveTab('table')}
            />
          )}

          {activeTab === 'table' && (
            <InvoiceTableView
              invoices={invoices}
              onUpdateInvoice={handleUpdateInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onDeleteMultiple={handleDeleteMultiple}
              onNavigateToUpload={() => setActiveTab('upload')}
            />
          )}

          {activeTab === 'summary' && (
            <BatchSummaryView
              summary={summary}
              invoices={invoices}
              onNavigateToTable={() => setActiveTab('table')}
              onNavigateToUpload={() => setActiveTab('upload')}
            />
          )}

          {activeTab === 'vat201' && (
            <Vat201View
              summary={summary}
              invoices={invoices}
              onNavigateToUpload={() => setActiveTab('upload')}
            />
          )}

          {activeTab === 'export' && (
            <ExportView
              summary={summary}
              invoices={invoices}
              onNavigateToUpload={() => setActiveTab('upload')}
            />
          )}
        </main>
      </div>

      {/* Auth Modal (Sign Up, Sign In with Email, Sign In with Google) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* User Management & RBAC Modal (Admin Only) */}
      <UserManagementModal
        isOpen={userMgmtOpen}
        onClose={() => setUserMgmtOpen(false)}
      />
    </div>
  );
}
