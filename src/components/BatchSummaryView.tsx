import React, { useState } from 'react';
import {
  FileText,
  Building,
  Coins,
  ShieldCheck,
  MapPin,
  ChevronDown,
  ChevronUp,
  Download,
  AlertCircle,
  CheckCircle2,
  Receipt,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { BatchSummary, UAEInvoice } from '../types/invoice';
import { formatAED, exportToExcel, exportToPDF } from '../utils/exporter';

interface BatchSummaryViewProps {
  summary: BatchSummary;
  invoices: UAEInvoice[];
  onNavigateToTable: () => void;
  onNavigateToUpload: () => void;
}

export const BatchSummaryView: React.FC<BatchSummaryViewProps> = ({
  summary,
  invoices,
  onNavigateToTable,
  onNavigateToUpload,
}) => {
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  if (summary.totalInvoices === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 shadow-xs">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <Receipt className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Batch Data Available</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            Upload invoices to generate an exhaustive summary for the entire batch and for each individual invoice.
          </p>
          <button
            onClick={onNavigateToUpload}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition active:scale-95 cursor-pointer"
          >
            Upload Invoices
          </button>
        </div>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedInvoiceId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Batch & Individual Invoice Summary
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated VAT analytics for {summary.totalInvoices} invoices totaling AED {formatAED(summary.totalAmountAED)}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportToExcel(invoices, summary)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Download Excel Summary
          </button>
          <button
            onClick={() => exportToPDF(invoices, summary)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download PDF Audit Report
          </button>
        </div>
      </div>

      {/* 1. Entire Batch Executive Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden border border-blue-900">
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-blue-200">
                Entire Batch Reconciliation (UAE Dirhams - AED)
              </h3>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-blue-800/60 text-blue-200 border border-blue-700 font-semibold">
              {summary.totalInvoices} Invoices Audited
            </span>
          </div>

          {/* 3 Core Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-blue-200/80 block font-medium">TOTAL TAXABLE VALUE</span>
              <div className="text-3xl font-extrabold text-white mt-1">
                AED {formatAED(summary.totalTaxableAED)}
              </div>
              <span className="text-[11px] text-blue-300/70 mt-1 block">
                Net base for VAT assessment
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-emerald-300 block font-medium">TOTAL INPUT VAT (RECOVERABLE)</span>
              <div className="text-3xl font-extrabold text-emerald-400 mt-1">
                AED {formatAED(summary.totalVatAED)}
              </div>
              <span className="text-[11px] text-emerald-300/70 mt-1 block">
                5% Standard rated input tax credit
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-blue-200/80 block font-medium">TOTAL GROSS INVOICED</span>
              <div className="text-3xl font-extrabold text-white mt-1">
                AED {formatAED(summary.totalAmountAED)}
              </div>
              <span className="text-[11px] text-blue-300/70 mt-1 block">
                Taxable + VAT combined
              </span>
            </div>
          </div>

          {/* Detailed Batch Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10 text-xs">
            <div>
              <span className="text-blue-300/70 block">Standard 5% Taxable:</span>
              <span className="font-bold text-white text-sm">
                AED {formatAED(summary.vat5TaxableAED)}
              </span>
            </div>
            <div>
              <span className="text-blue-300/70 block">Zero-Rated (0%) Taxable:</span>
              <span className="font-bold text-white text-sm">
                AED {formatAED(summary.zeroRatedTaxableAED)}
              </span>
            </div>
            <div>
              <span className="text-blue-300/70 block">Exempt Supplies:</span>
              <span className="font-bold text-white text-sm">
                AED {formatAED(summary.exemptTaxableAED)}
              </span>
            </div>
            <div>
              <span className="text-blue-300/70 block">Foreign Currency Invoices:</span>
              <span className="font-bold text-amber-300 text-sm">
                {summary.foreignCurrencyCount} invoice{summary.foreignCurrencyCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Place of Supply (Emirate) Consolidation */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="font-bold text-slate-900 text-base mb-1">
          Place of Supply (Emirates Breakdown)
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Allocation across UAE Emirates for Form 201 VAT return filing
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(summary.byEmirate).map(([emirate, data]) => (
            <div
              key={emirate}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-blue-300 transition"
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  {emirate}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {data.count}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable:</span>
                  <span className="font-mono font-semibold">AED {formatAED(data.taxable)}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>VAT (5%):</span>
                  <span className="font-mono font-semibold">AED {formatAED(data.vat)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200/60">
                  <span>Gross Total:</span>
                  <span className="font-mono">AED {formatAED(data.total)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Individual Invoice Summary Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Individual Invoice Summaries</h3>
            <p className="text-xs text-slate-500">
              Complete details extracted for each invoice in the current batch
            </p>
          </div>
          <button
            onClick={onNavigateToTable}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Switch to Table View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {invoices.map((inv) => {
            const isExpanded = expandedInvoiceId === inv.id;
            const hasErrors = inv.validationIssues.some((i) => i.severity === 'error');

            return (
              <div
                key={inv.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition"
              >
                {/* Collapsed Header Bar */}
                <div
                  onClick={() => toggleExpand(inv.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        inv.isTaxInvoice
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {inv.isTaxInvoice ? 'TAX' : 'INV'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">
                          {inv.supplierName}
                        </span>
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          #{inv.invoiceNumber}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            hasErrors
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {hasErrors ? 'Needs Review' : 'Verified'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xl">
                        {inv.description} • Date: {inv.invoiceDate} • TRN:{' '}
                        <span className="font-mono">{inv.supplierTrn || 'N/A'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Monetary Snapshot & Chevron */}
                  <div className="flex items-center justify-between md:justify-end gap-6 shrink-0">
                    <div className="text-right">
                      <div className="text-base font-extrabold text-slate-900 font-mono">
                        AED {formatAED(inv.totalAED)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Taxable: AED {formatAED(inv.taxableValueAED)} | VAT ({inv.vatRate}):{' '}
                        <span className="text-emerald-600 font-semibold">
                          AED {formatAED(inv.vatAmountAED)}
                        </span>
                      </div>
                    </div>
                    <div className="text-slate-400">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Pane */}
                {isExpanded && (
                  <div className="p-6 bg-slate-50/80 border-t border-slate-200/80 space-y-6 text-xs">
                    {/* Validation Notice if any */}
                    {inv.validationIssues.length > 0 && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                        <span className="font-bold block mb-1">Compliance Notes:</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                          {inv.validationIssues.map((issue, idx) => (
                            <li key={idx}>{issue.message}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* All Fields Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Supplier Name
                        </span>
                        <span className="font-bold text-slate-800 text-sm">{inv.supplierName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Supplier TRN (15 Digits)
                        </span>
                        <span className="font-mono font-bold text-slate-800 text-sm">
                          {inv.supplierTrn || 'MISSING'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Customer / Buyer Name
                        </span>
                        <span className="font-semibold text-slate-800">
                          {inv.customerName || 'Walk-in / Not Stated'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Customer TRN
                        </span>
                        <span className="font-mono text-slate-800">
                          {inv.customerTrn || 'N/A (B2C or Unregistered)'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Invoice Number
                        </span>
                        <span className="font-mono font-bold text-slate-800">{inv.invoiceNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Invoice Date
                        </span>
                        <span className="font-mono text-slate-800">{inv.invoiceDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Place of Supply (Emirate)
                        </span>
                        <span className="font-bold text-blue-700">{inv.emirate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Marked "Tax Invoice"?
                        </span>
                        <span
                          className={`font-bold ${
                            inv.isTaxInvoice ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {inv.isTaxInvoice ? 'YES (Valid Title)' : 'NO (Missing Title)'}
                        </span>
                      </div>

                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Description of Supplies
                        </span>
                        <span className="text-slate-700">{inv.description}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Expense Category
                        </span>
                        <span className="text-slate-700">{inv.category}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Original Currency & Rate
                        </span>
                        <span className="font-mono text-slate-700">
                          {inv.currency} (@{inv.exchangeRate})
                        </span>
                      </div>
                    </div>

                    {/* Financial Reconciliation Box */}
                    <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="text-blue-900 font-bold block">
                          Normalized UAE Dirhams (AED) Calculation
                        </span>
                        <span className="text-blue-700 text-[11px]">
                          Taxable: AED {formatAED(inv.taxableValueAED)} + VAT ({inv.vatRate}): AED{' '}
                          {formatAED(inv.vatAmountAED)} = Gross Total: AED {formatAED(inv.totalAED)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            Math.abs(inv.taxableValueAED + inv.vatAmountAED - inv.totalAED) < 0.08
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {Math.abs(inv.taxableValueAED + inv.vatAmountAED - inv.totalAED) < 0.08
                            ? '✓ Math Ties Accurately'
                            : 'Math Discrepancy'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
