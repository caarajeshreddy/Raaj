import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Edit3,
  Trash2,
  Download,
  Eye,
  ArrowUpDown,
  Building,
  Receipt,
  ShieldCheck,
  Check,
  X,
  FileSpreadsheet,
  Coins,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { UAEInvoice, UAE_EMIRATES, Emirate, VatRateType } from '../types/invoice';
import { formatAED, exportToExcel, exportToCSV, exportToPDF } from '../utils/exporter';
import { calculateBatchSummary, validateInvoice } from '../utils/validation';
import { InvoiceDetailDrawer } from './InvoiceDetailDrawer';

interface InvoiceTableViewProps {
  invoices: UAEInvoice[];
  onUpdateInvoice: (updated: UAEInvoice) => void;
  onDeleteInvoice: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
  onNavigateToUpload: () => void;
}

export const InvoiceTableView: React.FC<InvoiceTableViewProps> = ({
  invoices,
  onUpdateInvoice,
  onDeleteInvoice,
  onDeleteMultiple,
  onNavigateToUpload,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmirate, setSelectedEmirate] = useState<string>('ALL');
  const [selectedVatRate, setSelectedVatRate] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'VALID' | 'FLAGGED'>('ALL');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');

  // Selected Row IDs for batch actions
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Editing Drawer state
  const [drawerInvoice, setDrawerInvoice] = useState<UAEInvoice | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Inline Quick Editing state
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Sorting
  const [sortField, setSortField] = useState<keyof UAEInvoice>('invoiceDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof UAEInvoice) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtered & Sorted Invoices
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        // Search
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const match =
            inv.invoiceNumber.toLowerCase().includes(q) ||
            inv.supplierName.toLowerCase().includes(q) ||
            inv.supplierTrn.includes(q) ||
            inv.customerName.toLowerCase().includes(q) ||
            inv.description.toLowerCase().includes(q) ||
            inv.category.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Emirate
        if (selectedEmirate !== 'ALL' && inv.emirate !== selectedEmirate) {
          return false;
        }

        // VAT Rate
        if (selectedVatRate !== 'ALL' && inv.vatRate !== selectedVatRate) {
          return false;
        }

        // Compliance status
        if (selectedStatus === 'VALID' && !inv.isValid) return false;
        if (selectedStatus === 'FLAGGED' && inv.isValid) return false;

        // Currency
        if (selectedCurrency === 'AED_ONLY' && inv.currency !== 'AED') return false;
        if (selectedCurrency === 'FX_ONLY' && inv.currency === 'AED') return false;

        return true;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA === undefined) return 1;
        if (valB === undefined) return -1;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        return sortOrder === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [
    invoices,
    searchTerm,
    selectedEmirate,
    selectedVatRate,
    selectedStatus,
    selectedCurrency,
    sortField,
    sortOrder,
  ]);

  // Checkbox toggle
  const toggleSelectAll = () => {
    if (selectedRowIds.size === filteredInvoices.length && filteredInvoices.length > 0) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(filteredInvoices.map((i) => i.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedRowIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedRowIds(next);
  };

  const handleDeleteSelected = () => {
    if (selectedRowIds.size === 0) return;
    if (window.confirm(`Delete ${selectedRowIds.size} selected invoices?`)) {
      onDeleteMultiple(Array.from(selectedRowIds));
      setSelectedRowIds(new Set());
    }
  };

  // Inline edit save
  const startEditing = (id: string, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    setEditValue(String(currentValue ?? ''));
  };

  const saveInlineEdit = (invoice: UAEInvoice) => {
    if (!editingCell) return;
    const field = editingCell.field as keyof UAEInvoice;
    let updatedVal: any = editValue;

    if (
      field === 'taxableValueAED' ||
      field === 'vatAmountAED' ||
      field === 'totalAED' ||
      field === 'exchangeRate'
    ) {
      updatedVal = parseFloat(editValue) || 0;
    }

    const updated = { ...invoice, [field]: updatedVal };

    // Auto-recalc if taxable value changed
    if (field === 'taxableValueAED' && updated.vatRate === '5%') {
      updated.vatAmountAED = Number((updated.taxableValueAED * 0.05).toFixed(2));
      updated.totalAED = Number((updated.taxableValueAED + updated.vatAmountAED).toFixed(2));
    }

    const issues = validateInvoice(updated);
    updated.validationIssues = issues;
    updated.isValid = !issues.some((i) => i.severity === 'error');

    onUpdateInvoice(updated);
    setEditingCell(null);
  };

  const openDrawer = (inv: UAEInvoice) => {
    setDrawerInvoice(inv);
    setIsDrawerOpen(true);
  };

  // Filtered Totals
  const filteredTotals = useMemo(() => {
    return filteredInvoices.reduce(
      (acc, inv) => {
        acc.taxable += inv.taxableValueAED || 0;
        acc.vat += inv.vatAmountAED || 0;
        acc.total += inv.totalAED || 0;
        return acc;
      },
      { taxable: 0, vat: 0, total: 0 }
    );
  }, [filteredInvoices]);

  // If no invoices exist in app
  if (invoices.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 shadow-xs">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <Receipt className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Invoices in IPT</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            Upload UAE tax invoices (PDF, JPG, PNG) to populate the audit table, verify 15-digit TRNs, and view VAT calculations.
          </p>
          <button
            onClick={onNavigateToUpload}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Upload Invoices Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Controls: Search, Filters, Batch Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search supplier, TRN, invoice #, description..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Stats & Selection Action */}
          <div className="flex items-center flex-wrap gap-2.5">
            {selectedRowIds.size > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5 text-xs text-blue-900 font-semibold">
                <span>{selectedRowIds.size} selected</span>
                <button
                  onClick={handleDeleteSelected}
                  className="text-rose-600 hover:text-rose-800 ml-2 font-bold cursor-pointer"
                >
                  Delete Selected
                </button>
              </div>
            )}

            <button
              onClick={() => {
                const summary = calculateBatchSummary(filteredInvoices);
                exportToExcel(filteredInvoices, summary);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Export Table (.xlsx)
            </button>

            <button
              onClick={() => exportToCSV(filteredInvoices)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              CSV
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center flex-wrap gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Filter by Emirate */}
          <select
            value={selectedEmirate}
            onChange={(e) => setSelectedEmirate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Emirates (Place of Supply)</option>
            {UAE_EMIRATES.map((em) => (
              <option key={em} value={em}>
                {em}
              </option>
            ))}
          </select>

          {/* Filter by VAT Rate */}
          <select
            value={selectedVatRate}
            onChange={(e) => setSelectedVatRate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All VAT Rates</option>
            <option value="5%">Standard 5%</option>
            <option value="0%">Zero-Rated (0%)</option>
            <option value="Exempt">Exempt</option>
          </select>

          {/* Filter by Compliance Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Audit Statuses</option>
            <option value="VALID">✓ Compliant / Valid Only</option>
            <option value="FLAGGED">⚠ Flagged / Needs Review</option>
          </select>

          {/* Filter by Currency */}
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Currencies</option>
            <option value="AED_ONLY">AED Invoices Only</option>
            <option value="FX_ONLY">Foreign FX Invoices</option>
          </select>

          {(searchTerm ||
            selectedEmirate !== 'ALL' ||
            selectedVatRate !== 'ALL' ||
            selectedStatus !== 'ALL' ||
            selectedCurrency !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedEmirate('ALL');
                setSelectedVatRate('ALL');
                setSelectedStatus('ALL');
                setSelectedCurrency('ALL');
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline text-[11px]"
            >
              Reset Filters
            </button>
          )}

          <div className="ml-auto text-slate-400 text-[11px]">
            Showing <span className="font-bold text-slate-700">{filteredInvoices.length}</span> of{' '}
            {invoices.length} invoices
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            {/* Table Header */}
            <thead className="bg-slate-50/90 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedRowIds.size === filteredInvoices.length &&
                      filteredInvoices.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                </th>
                <th
                  onClick={() => handleSort('isValid')}
                  className="p-3.5 cursor-pointer hover:text-blue-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Audit</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('invoiceDate')}
                  className="p-3.5 cursor-pointer hover:text-blue-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('invoiceNumber')}
                  className="p-3.5 cursor-pointer hover:text-blue-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Invoice #</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('supplierName')}
                  className="p-3.5 cursor-pointer hover:text-blue-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Supplier Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5">Supplier TRN (15 Digits)</th>
                <th className="p-3.5">Tax Invoice?</th>
                <th className="p-3.5">Emirate (Supply)</th>
                <th className="p-3.5">Currency</th>
                <th
                  onClick={() => handleSort('taxableValueAED')}
                  className="p-3.5 text-right cursor-pointer hover:text-blue-600"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Taxable (AED)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5 text-center">Rate</th>
                <th
                  onClick={() => handleSort('vatAmountAED')}
                  className="p-3.5 text-right cursor-pointer hover:text-blue-600"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>VAT (AED)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalAED')}
                  className="p-3.5 text-right cursor-pointer hover:text-blue-600"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total (AED)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const isSelected = selectedRowIds.has(inv.id);
                const hasErrors = inv.validationIssues.some((i) => i.severity === 'error');
                const hasWarnings = inv.validationIssues.some((i) => i.severity === 'warning');

                return (
                  <tr
                    key={inv.id}
                    className={`hover:bg-blue-50/40 transition-colors ${
                      isSelected ? 'bg-blue-50/60' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(inv.id)}
                        className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                      />
                    </td>

                    {/* Audit Status Badge */}
                    <td className="p-3.5 whitespace-nowrap">
                      {hasErrors ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200 cursor-help"
                          title={inv.validationIssues.map((i) => i.message).join('\n')}
                        >
                          <XCircle className="w-3 h-3" />
                          Review
                        </span>
                      ) : hasWarnings ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-700 border border-amber-200 cursor-help"
                          title={inv.validationIssues.map((i) => i.message).join('\n')}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Notice
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Valid
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="p-3.5 whitespace-nowrap font-mono text-slate-600">
                      {editingCell?.id === inv.id && editingCell.field === 'invoiceDate' ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="px-1.5 py-0.5 border rounded text-xs"
                          />
                          <button
                            onClick={() => saveInlineEdit(inv)}
                            className="text-emerald-600"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => startEditing(inv.id, 'invoiceDate', inv.invoiceDate)}
                          className="hover:underline cursor-pointer"
                        >
                          {inv.invoiceDate || 'N/A'}
                        </span>
                      )}
                    </td>

                    {/* Invoice # */}
                    <td className="p-3.5 whitespace-nowrap font-mono font-bold text-slate-800">
                      {editingCell?.id === inv.id && editingCell.field === 'invoiceNumber' ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="px-1.5 py-0.5 border rounded text-xs font-mono w-28"
                          />
                          <button
                            onClick={() => saveInlineEdit(inv)}
                            className="text-emerald-600"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => startEditing(inv.id, 'invoiceNumber', inv.invoiceNumber)}
                          className="hover:underline cursor-pointer"
                        >
                          {inv.invoiceNumber}
                        </span>
                      )}
                    </td>

                    {/* Supplier Name */}
                    <td className="p-3.5 font-semibold text-slate-900 max-w-xs truncate">
                      {editingCell?.id === inv.id && editingCell.field === 'supplierName' ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="px-1.5 py-0.5 border rounded text-xs w-40"
                          />
                          <button
                            onClick={() => saveInlineEdit(inv)}
                            className="text-emerald-600"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => startEditing(inv.id, 'supplierName', inv.supplierName)}
                          className="hover:underline cursor-pointer"
                        >
                          {inv.supplierName}
                        </span>
                      )}
                    </td>

                    {/* Supplier TRN (15 Digits) */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono text-xs px-2 py-0.5 rounded ${
                            inv.supplierTrn.length === 15
                              ? 'bg-slate-100 text-slate-800 font-semibold'
                              : 'bg-rose-100 text-rose-800 font-bold'
                          }`}
                        >
                          {inv.supplierTrn || 'MISSING'}
                        </span>
                        {inv.supplierTrn.length === 15 ? (
                          <span
                            className="text-emerald-600 text-[10px] font-bold"
                            title="15-digit FTA TRN verified"
                          >
                            15✓
                          </span>
                        ) : (
                          <span
                            className="text-rose-600 text-[10px] font-bold"
                            title={`Must be 15 digits (currently ${inv.supplierTrn.length})`}
                          >
                            {inv.supplierTrn.length}d ✗
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Tax Invoice Flag */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        onClick={() => {
                          const updated = { ...inv, isTaxInvoice: !inv.isTaxInvoice };
                          const issues = validateInvoice(updated);
                          updated.validationIssues = issues;
                          updated.isValid = !issues.some((i) => i.severity === 'error');
                          onUpdateInvoice(updated);
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer transition ${
                          inv.isTaxInvoice
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Click to toggle Tax Invoice status"
                      >
                        {inv.isTaxInvoice ? 'Yes (Compliant)' : 'No (Risk)'}
                      </span>
                    </td>

                    {/* Emirate */}
                    <td className="p-3.5 whitespace-nowrap">
                      <select
                        value={inv.emirate}
                        onChange={(e) => {
                          const updated = { ...inv, emirate: e.target.value as Emirate };
                          onUpdateInvoice(updated);
                        }}
                        className="bg-transparent hover:bg-slate-100 rounded px-1.5 py-0.5 text-xs text-slate-700 border-0 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        {UAE_EMIRATES.map((em) => (
                          <option key={em} value={em}>
                            {em}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Currency */}
                    <td className="p-3.5 whitespace-nowrap font-mono text-[11px]">
                      {inv.currency !== 'AED' ? (
                        <span
                          className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold"
                          title={`Exchange Rate: 1 ${inv.currency} = ${inv.exchangeRate} AED`}
                        >
                          {inv.currency} (@{inv.exchangeRate})
                        </span>
                      ) : (
                        <span className="text-slate-500">AED</span>
                      )}
                    </td>

                    {/* Taxable Value (AED) */}
                    <td className="p-3.5 whitespace-nowrap text-right font-mono font-bold text-slate-900">
                      {editingCell?.id === inv.id && editingCell.field === 'taxableValueAED' ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="px-1.5 py-0.5 border rounded text-xs font-mono w-24 text-right"
                          />
                          <button
                            onClick={() => saveInlineEdit(inv)}
                            className="text-emerald-600"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() =>
                            startEditing(inv.id, 'taxableValueAED', inv.taxableValueAED)
                          }
                          className="hover:underline cursor-pointer"
                        >
                          {formatAED(inv.taxableValueAED)}
                        </span>
                      )}
                    </td>

                    {/* Rate */}
                    <td className="p-3.5 whitespace-nowrap text-center">
                      <select
                        value={inv.vatRate}
                        onChange={(e) => {
                          const rate = e.target.value as VatRateType;
                          const taxable = inv.taxableValueAED;
                          const vat = rate === '5%' ? Number((taxable * 0.05).toFixed(2)) : 0;
                          const total = Number((taxable + vat).toFixed(2));
                          const updated = {
                            ...inv,
                            vatRate: rate,
                            vatAmountAED: vat,
                            totalAED: total,
                          };
                          const issues = validateInvoice(updated);
                          updated.validationIssues = issues;
                          updated.isValid = !issues.some((i) => i.severity === 'error');
                          onUpdateInvoice(updated);
                        }}
                        className="bg-transparent hover:bg-slate-100 rounded px-1 py-0.5 text-[11px] font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="5%">5%</option>
                        <option value="0%">0%</option>
                        <option value="Exempt">Exempt</option>
                      </select>
                    </td>

                    {/* VAT Amount (AED) */}
                    <td className="p-3.5 whitespace-nowrap text-right font-mono font-bold text-emerald-600">
                      {editingCell?.id === inv.id && editingCell.field === 'vatAmountAED' ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="px-1.5 py-0.5 border rounded text-xs font-mono w-20 text-right"
                          />
                          <button
                            onClick={() => saveInlineEdit(inv)}
                            className="text-emerald-600"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => startEditing(inv.id, 'vatAmountAED', inv.vatAmountAED)}
                          className="hover:underline cursor-pointer"
                        >
                          {formatAED(inv.vatAmountAED)}
                        </span>
                      )}
                    </td>

                    {/* Total (AED) */}
                    <td className="p-3.5 whitespace-nowrap text-right font-mono font-extrabold text-blue-900">
                      {editingCell?.id === inv.id && editingCell.field === 'totalAED' ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="px-1.5 py-0.5 border rounded text-xs font-mono w-24 text-right"
                          />
                          <button
                            onClick={() => saveInlineEdit(inv)}
                            className="text-emerald-600"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => startEditing(inv.id, 'totalAED', inv.totalAED)}
                          className="hover:underline cursor-pointer"
                        >
                          {formatAED(inv.totalAED)}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openDrawer(inv)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="Inspect & Edit Full Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteInvoice(inv.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Table Footer: Summary Totals */}
            <tfoot className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-slate-900 text-xs">
              <tr>
                <td colSpan={9} className="p-4 text-slate-600">
                  Total for Filtered Batch ({filteredInvoices.length} Invoices)
                </td>
                <td className="p-4 text-right font-mono text-sm">
                  AED {formatAED(filteredTotals.taxable)}
                </td>
                <td></td>
                <td className="p-4 text-right font-mono text-sm text-emerald-600">
                  AED {formatAED(filteredTotals.vat)}
                </td>
                <td className="p-4 text-right font-mono text-sm text-blue-900">
                  AED {formatAED(filteredTotals.total)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Invoice Detail & Edit Drawer */}
      <InvoiceDetailDrawer
        invoice={drawerInvoice}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setDrawerInvoice(null);
        }}
        onSave={(updated) => {
          onUpdateInvoice(updated);
          setIsDrawerOpen(false);
          setDrawerInvoice(null);
        }}
        onDelete={(id) => {
          onDeleteInvoice(id);
          setIsDrawerOpen(false);
          setDrawerInvoice(null);
        }}
      />
    </div>
  );
};
