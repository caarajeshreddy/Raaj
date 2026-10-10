import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Coins,
  Calculator,
  Save,
  Trash2,
  FileText,
  Building,
  Calendar,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { UAEInvoice, UAE_EMIRATES, EXPENSE_CATEGORIES, Emirate, VatRateType } from '../types/invoice';
import { validateInvoice } from '../utils/validation';
import { formatAED } from '../utils/exporter';

interface InvoiceDetailDrawerProps {
  invoice: UAEInvoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: UAEInvoice) => void;
  onDelete: (id: string) => void;
}

export const InvoiceDetailDrawer: React.FC<InvoiceDetailDrawerProps> = ({
  invoice,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen || !invoice) return null;

  const [form, setForm] = useState<UAEInvoice>({ ...invoice });
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: keyof UAEInvoice, value: any) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      // Auto-recalculate AED values if currency or exchange rate or original values change
      if (field === 'currency' || field === 'exchangeRate' || field === 'taxableValueOriginal' || field === 'vatRate') {
        const rate = next.currency === 'AED' ? 1.0 : Number(next.exchangeRate) || 1.0;
        next.taxableValueAED = Number((next.taxableValueOriginal * rate).toFixed(2));

        if (next.vatRate === '5%') {
          next.vatAmountAED = Number((next.taxableValueAED * 0.05).toFixed(2));
          next.vatAmountOriginal = Number((next.taxableValueOriginal * 0.05).toFixed(2));
        } else {
          next.vatAmountAED = 0;
          next.vatAmountOriginal = 0;
        }

        next.totalAED = Number((next.taxableValueAED + next.vatAmountAED).toFixed(2));
        next.totalOriginal = Number((next.taxableValueOriginal + next.vatAmountOriginal).toFixed(2));
      }

      // Re-validate instantly
      const issues = validateInvoice(next);
      next.validationIssues = issues;
      next.isValid = !issues.some((i) => i.severity === 'error');

      return next;
    });
    setHasChanges(true);
  };

  const handleRecalculate5Percent = () => {
    setForm((prev) => {
      const taxable = Number(prev.taxableValueAED) || 0;
      const vat = Number((taxable * 0.05).toFixed(2));
      const total = Number((taxable + vat).toFixed(2));
      const next = {
        ...prev,
        vatRate: '5%' as VatRateType,
        vatAmountAED: vat,
        totalAED: total,
      };
      const issues = validateInvoice(next);
      next.validationIssues = issues;
      next.isValid = !issues.some((i) => i.severity === 'error');
      return next;
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(form);
    setHasChanges(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide Drawer Content */}
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-lg">
                  {form.invoiceNumber || 'Invoice Details'}
                </h3>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    form.isTaxInvoice
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {form.isTaxInvoice ? 'Tax Invoice' : 'Non-Tax Invoice'}
                </span>
              </div>
              <p className="text-xs text-slate-500">{form.fileName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(form.id)}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
              title="Delete Invoice"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Audit Issues Warning Banner if any */}
        {form.validationIssues.length > 0 && (
          <div className="p-4 bg-amber-50/90 border-b border-amber-200/80 text-xs text-amber-900">
            <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Compliance Audit Notices ({form.validationIssues.length})</span>
            </div>
            <ul className="space-y-1 pl-5 list-disc text-[11px]">
              {form.validationIssues.map((issue, idx) => (
                <li key={idx} className={issue.severity === 'error' ? 'text-rose-700 font-semibold' : ''}>
                  {issue.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Drawer Body Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section: Tax Compliance & Identifier */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              FTA Tax Identification & Dates
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  value={form.invoiceNumber}
                  onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Date (YYYY-MM-DD) *
                </label>
                <input
                  type="date"
                  value={form.invoiceDate}
                  onChange={(e) => handleChange('invoiceDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isTaxInvoice}
                    onChange={(e) => handleChange('isTaxInvoice', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800">
                      Marked as "Tax Invoice" / "فاتورة ضريبية"
                    </span>
                    <p className="text-slate-500 text-[11px]">
                      Required under FTA Executive Regulation Art. 59 for input tax deduction.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Section: Supplier & Customer TRN */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-blue-600" />
              Supplier & Customer Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  value={form.supplierName}
                  onChange={(e) => handleChange('supplierName', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supplier TRN (15 Digits) *
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={form.supplierTrn}
                  onChange={(e) => handleChange('supplierTrn', e.target.value)}
                  className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none font-mono ${
                    form.supplierTrn.length === 15
                      ? 'border-emerald-500 focus:ring-emerald-500'
                      : 'border-rose-400 focus:ring-rose-500'
                  }`}
                  placeholder="100xxxxxxxxxxxx"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {form.supplierTrn.length}/15 digits
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer / Buyer Name
                </label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(e) => handleChange('customerName', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer TRN (B2B Full Invoice)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={form.customerTrn}
                  onChange={(e) => handleChange('customerTrn', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="100xxxxxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Place of Supply (Emirate) *
                </label>
                <select
                  value={form.emirate}
                  onChange={(e) => handleChange('emirate', e.target.value as Emirate)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {UAE_EMIRATES.map((em) => (
                    <option key={em} value={em}>
                      {em}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expense Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Particulars
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Currency & FX to AED */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-blue-600" />
              Currency & Exchange Rate (to AED)
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Currency
                </label>
                <input
                  type="text"
                  value={form.currency}
                  onChange={(e) => handleChange('currency', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg uppercase font-mono"
                  placeholder="AED, USD, EUR..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Exchange Rate to AED
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={form.exchangeRate}
                  onChange={(e) => handleChange('exchangeRate', parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>

            {form.currency !== 'AED' && (
              <p className="text-[11px] text-blue-700">
                Notice: Under UAE VAT law, invoices issued in foreign currencies must record the VAT amount in AED based on Central Bank exchange rates.
              </p>
            )}
          </div>

          {/* Section: Monetary Values in AED & VAT Math */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-blue-600" />
                Monetary Amounts (UAE Dirhams - AED)
              </h4>
              <button
                type="button"
                onClick={handleRecalculate5Percent}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                Auto-Tie 5% VAT
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Taxable Value (AED)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.taxableValueAED}
                  onChange={(e) => handleChange('taxableValueAED', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  VAT Rate
                </label>
                <select
                  value={form.vatRate}
                  onChange={(e) => handleChange('vatRate', e.target.value as VatRateType)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                >
                  <option value="5%">Standard 5%</option>
                  <option value="0%">Zero-Rated 0%</option>
                  <option value="Exempt">Exempt</option>
                  <option value="Out of Scope">Out of Scope</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  VAT Amount (AED)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.vatAmountAED}
                  onChange={(e) => handleChange('vatAmountAED', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Gross (AED)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.totalAED}
                  onChange={(e) => handleChange('totalAED', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono font-bold text-blue-700"
                />
              </div>
            </div>

            {/* Math Tie Status Box */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <span className="text-slate-600">Math Check: Taxable + VAT = Total</span>
              <span
                className={`font-bold ${
                  Math.abs(form.taxableValueAED + form.vatAmountAED - form.totalAED) < 0.08
                    ? 'text-emerald-600'
                    : 'text-rose-600'
                }`}
              >
                {Math.abs(form.taxableValueAED + form.vatAmountAED - form.totalAED) < 0.08
                  ? '✓ Math Ties Perfectly'
                  : `Mismatch of AED ${Math.abs(form.taxableValueAED + form.vatAmountAED - form.totalAED).toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Section: Line Items if present */}
          {form.lineItems && form.lineItems.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                Line Items ({form.lineItems.length})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full">
                  <thead className="bg-slate-50 text-slate-500 text-[11px]">
                    <tr>
                      <th className="p-2 text-left">Description</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Taxable</th>
                      <th className="p-2 text-right">VAT</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {form.lineItems.map((li, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2 text-slate-800">{li.description}</td>
                        <td className="p-2 text-right text-slate-500">{li.quantity || 1}</td>
                        <td className="p-2 text-right font-mono">AED {formatAED(li.taxableAmount)}</td>
                        <td className="p-2 text-right font-mono text-emerald-600">AED {formatAED(li.vatAmount)}</td>
                        <td className="p-2 text-right font-mono font-bold">AED {formatAED(li.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Buttons */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save & Recalculate
          </button>
        </div>
      </div>
    </div>
  );
};
