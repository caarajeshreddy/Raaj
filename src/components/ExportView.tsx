import React from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileCode,
  Building,
  CheckCircle2,
  ShieldCheck,
  Receipt,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { BatchSummary, UAEInvoice } from '../types/invoice';
import { formatAED, exportToExcel, exportToCSV, exportToPDF } from '../utils/exporter';

interface ExportViewProps {
  summary: BatchSummary;
  invoices: UAEInvoice[];
  onNavigateToUpload: () => void;
}

export const ExportView: React.FC<ExportViewProps> = ({
  summary,
  invoices,
  onNavigateToUpload,
}) => {
  if (summary.totalInvoices === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 shadow-xs">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <Download className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Invoices to Export</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            Upload UAE invoices first to export clean data for Zoho Books, Tally Prime, Excel, or PDF.
          </p>
          <button
            onClick={onNavigateToUpload}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition active:scale-95 cursor-pointer"
          >
            Upload Invoices Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Export Center</h2>
        <p className="text-xs text-slate-500 mt-1">
          Generate production-ready exports configured for Zoho Books (UAE), Tally Prime (UAE VAT), Master Excel (.xlsx), CSV, and PDF Audit Schedules.
        </p>
      </div>

      {/* Snapshot Summary Bar */}
      <div className="bg-blue-50/80 rounded-2xl p-5 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-900 block">
            Ready to Export {summary.totalInvoices} Processed Invoices
          </span>
          <span className="text-xs text-blue-700">
            Total Spend: <span className="font-bold">AED {formatAED(summary.totalAmountAED)}</span> | Recoverable VAT: <span className="font-bold">AED {formatAED(summary.totalVatAED)}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-white px-3 py-1.5 rounded-xl border border-blue-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>All 15-digit TRNs & VAT checked</span>
        </div>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Zoho Books (UAE) Ready Format */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-blue-300 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-extrabold text-sm border border-amber-200">
                ZOHO
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                UAE VAT Edition
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Zoho Books (UAE) Import Format
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Export Excel workbook with columns strictly formatted for Zoho Books UAE Bills import: Date, Bill Number, Vendor Name, Vendor TRN, Place of Supply, Item Description, Account, Taxable Amount (AED), Tax Rate, Tax Amount, and Total (AED).
            </p>

            <ul className="text-[11px] text-slate-600 space-y-1 mb-6 list-disc pl-4">
              <li>Direct import into Purchases &gt; Bills in Zoho Books</li>
              <li>Includes supplier 15-digit TRN and place of supply</li>
              <li>Calculates VAT amounts normalized to AED</li>
            </ul>
          </div>

          <button
            onClick={() => exportToExcel(invoices, summary)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Zoho Books .xlsx
          </button>
        </div>

        {/* 2. Tally Prime (UAE VAT) Ready Format */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-blue-300 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-extrabold text-sm border border-emerald-200">
                TALLY
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Tally Prime UAE
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Tally Prime (UAE VAT) Import Format
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Mapped for Tally Prime UAE VAT purchase voucher import with Voucher Date, Type, Number, Party Name, Party TRN, Place of Supply State, Particulars, Assessable Value (AED), VAT Rate, VAT Amount, and Total.
            </p>

            <ul className="text-[11px] text-slate-600 space-y-1 mb-6 list-disc pl-4">
              <li>Purchase voucher structure matching Tally XML/Excel schemas</li>
              <li>Assigns Party TRNs and Emirate Place of Supply</li>
              <li>Verifies math tie-ins prior to ledger posting</li>
            </ul>
          </div>

          <button
            onClick={() => exportToExcel(invoices, summary)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Tally Prime .xlsx
          </button>
        </div>

        {/* 3. Consolidated Master Excel (.xlsx) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-blue-300 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold border border-blue-200">
                <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Complete Workbook
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Master Consolidated Excel (.xlsx)
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Multi-sheet Excel workbook including:
              <br />• <strong>Sheet 1:</strong> IPT Master Invoices (all 22 fields)
              <br />• <strong>Sheet 2:</strong> Zoho Books (UAE) Import
              <br />• <strong>Sheet 3:</strong> Tally Prime (UAE VAT) Import
              <br />• <strong>Sheet 4:</strong> VAT 201 Return Helper Summary
            </p>
          </div>

          <button
            onClick={() => exportToExcel(invoices, summary)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Master .xlsx (All Sheets)
          </button>
        </div>

        {/* 4. PDF Tax Audit Schedule */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-blue-300 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold border border-rose-200">
                <FileText className="w-6 h-6 text-rose-600" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                FTA Audit Ready
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              UAE Tax Audit Schedule (.pdf)
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Clean, print-ready formal invoice schedule with executive summary, TRN compliance verification marks, and individual line totals formatted for management reviews and FTA audit defense.
            </p>
          </div>

          <button
            onClick={() => exportToPDF(invoices, summary)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download PDF Audit Schedule
          </button>
        </div>

        {/* 5. Standard CSV */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Standard Delimited CSV Export</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Universal RFC 4180 CSV export for pipelines, custom ERPs, and database imports.
              </p>
            </div>
          </div>

          <button
            onClick={() => exportToCSV(invoices)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            Download CSV (.csv)
          </button>
        </div>
      </div>
    </div>
  );
};
