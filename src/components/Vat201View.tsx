import React from 'react';
import {
  FileCheck,
  ShieldCheck,
  Download,
  Building,
  Info,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { BatchSummary, UAEInvoice, UAE_EMIRATES } from '../types/invoice';
import { formatAED, exportToExcel, exportToPDF } from '../utils/exporter';

interface Vat201ViewProps {
  summary: BatchSummary;
  invoices: UAEInvoice[];
  onNavigateToUpload: () => void;
}

export const Vat201View: React.FC<Vat201ViewProps> = ({
  summary,
  invoices,
  onNavigateToUpload,
}) => {
  if (summary.totalInvoices === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 shadow-xs">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <FileCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            No VAT 201 Return Data Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            Upload UAE tax invoices to automatically compute Box 9 Standard Rated Expenses and Place of Supply distribution for your FTA tax return.
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

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              UAE Federal Tax Authority (FTA) VAT 201 Return Helper
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Form 201 Aligned
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pre-computed box values for filing your periodic UAE Value Added Tax return via EmaraTax.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportToExcel(invoices, summary)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Form 201 Data (.xlsx)
          </button>
        </div>
      </div>

      {/* Box 9: Standard Rated Expenses (Input VAT Recoverable) */}
      <div className="bg-white rounded-2xl border-2 border-blue-600 shadow-md p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm">
              Box 9
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                Standard Rated Expenses & Input Tax
              </h3>
              <p className="text-xs text-slate-500">
                Purchases and expenses incurred in UAE subject to 5% VAT
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            VAT Executive Regulations Art. 54
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-xl border border-slate-200 mt-4">
          <div>
            <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">
              Amount (AED) - Net Taxable Base
            </span>
            <div className="text-3xl font-extrabold text-slate-900 font-mono mt-1">
              AED {formatAED(summary.vat5TaxableAED)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Sum of taxable value of all standard-rated 5% invoices
            </p>
          </div>

          <div>
            <span className="text-xs text-emerald-600 font-semibold block uppercase tracking-wider">
              Recoverable VAT Amount (AED)
            </span>
            <div className="text-3xl font-extrabold text-emerald-600 font-mono mt-1">
              AED {formatAED(summary.vat5AmountAED)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Input tax available to offset against output VAT liability
            </p>
          </div>
        </div>
      </div>

      {/* Place of Supply Distribution Table (Box 1a - 1g Allocation) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Emirate Allocation Schedule (Place of Supply)
            </h3>
            <p className="text-xs text-slate-500">
              UAE Federal Tax Authority requires breakdown by individual Emirate
            </p>
          </div>
          <Building className="w-5 h-5 text-slate-400" />
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Emirate (Box 1a-1g)</th>
                <th className="p-3 text-center">Invoices</th>
                <th className="p-3 text-right">Taxable Amount (AED)</th>
                <th className="p-3 text-right">VAT Amount (AED)</th>
                <th className="p-3 text-right">Gross Total (AED)</th>
                <th className="p-3 text-center">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {UAE_EMIRATES.map((emirate) => {
                const data = summary.byEmirate[emirate] || {
                  count: 0,
                  taxable: 0,
                  vat: 0,
                  total: 0,
                };
                const percentage =
                  summary.totalAmountAED > 0
                    ? Math.round((data.total / summary.totalAmountAED) * 100)
                    : 0;

                return (
                  <tr key={emirate} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-800">{emirate}</td>
                    <td className="p-3 text-center text-slate-500">{data.count}</td>
                    <td className="p-3 text-right font-mono">
                      AED {formatAED(data.taxable)}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-600 font-semibold">
                      AED {formatAED(data.vat)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      AED {formatAED(data.total)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {percentage}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
              <tr>
                <td className="p-3">Total Consolidated</td>
                <td className="p-3 text-center">{summary.totalInvoices}</td>
                <td className="p-3 text-right font-mono">
                  AED {formatAED(summary.totalTaxableAED)}
                </td>
                <td className="p-3 text-right font-mono text-emerald-600">
                  AED {formatAED(summary.totalVatAED)}
                </td>
                <td className="p-3 text-right font-mono text-blue-900">
                  AED {formatAED(summary.totalAmountAED)}
                </td>
                <td className="p-3 text-center">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* FTA Audit Readiness Checklist */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-6 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          FTA Audit Readiness Checklist
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200">
            <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Tax Invoices on File</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Ensure all input claims are backed by authentic tax invoices meeting Art. 59 requirements.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200">
            <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>15-Digit TRN Verification</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Verify supplier registration on the FTA EmaraTax portal before claiming input credit.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200">
            <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>5-Year Record Retention</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Under Federal Decree-Law No. 8, keep full tax invoices and accounting exports for at least 5 years.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
