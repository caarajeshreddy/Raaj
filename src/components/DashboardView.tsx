import React, { useState } from 'react';
import {
  Receipt,
  Coins,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  PieChart as PieChartIcon,
  MapPin,
  Building2,
  Calendar,
  ArrowUpRight,
  UploadCloud,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { BatchSummary, UAEInvoice } from '../types/invoice';
import { formatAED } from '../utils/exporter';

interface DashboardViewProps {
  summary: BatchSummary;
  invoices: UAEInvoice[];
  onNavigateToUpload: () => void;
  onNavigateToTable: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  invoices,
  onNavigateToUpload,
  onNavigateToTable,
}) => {
  const [selectedEmirate, setSelectedEmirate] = useState<string | null>(null);

  // If no invoices uploaded yet, show clear welcoming empty state
  if (summary.totalInvoices === 0) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-blue-100">
            <Receipt className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
            Welcome to UAE Invoice Processing Tool (IPT)
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto mb-8 leading-relaxed">
            Automate UAE tax invoice extraction, FTA compliance audits (15-digit TRN, 5% standard rate tying, Tax Invoice markers), currency conversions to AED, and 1-click export to Zoho Books & Tally Prime.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onNavigateToUpload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition active:scale-95 cursor-pointer"
            >
              <UploadCloud className="w-5 h-5" />
              Upload UAE Tax Invoices (PDF / JPG / PNG)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-10 border-t border-slate-100 text-left">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>FTA Compliance Rules</span>
              </div>
              <p className="text-xs text-slate-500 leading-normal">
                Validates 15-digit TRNs, "Tax Invoice" legal markers under Executive Regulation Art. 59, and mathematical tying.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-1.5">
                <Coins className="w-4 h-4" />
                <span>Foreign FX to AED</span>
              </div>
              <p className="text-xs text-slate-500 leading-normal">
                Detects non-AED invoices, captures official Central Bank rates, and displays mandatory VAT amounts in AED.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>Zoho & Tally Ready</span>
              </div>
              <p className="text-xs text-slate-500 leading-normal">
                Exports formatted sheets matching Zoho Books UAE VAT bills and Tally Prime Purchase Vouchers with zero re-keying.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate compliance rate
  const complianceRate = summary.totalInvoices > 0
    ? Math.round((summary.validInvoices / summary.totalInvoices) * 100)
    : 100;

  // Monthly trends aggregation
  const monthlySpend: Record<string, { total: number; vat: number; count: number }> = {};
  invoices.forEach((inv) => {
    let monthKey = 'Unknown';
    if (inv.invoiceDate && !isNaN(Date.parse(inv.invoiceDate))) {
      const d = new Date(inv.invoiceDate);
      monthKey = d.toLocaleString('default', { month: 'short', year: 'numeric' });
    }
    if (!monthlySpend[monthKey]) {
      monthlySpend[monthKey] = { total: 0, vat: 0, count: 0 };
    }
    monthlySpend[monthKey].total += inv.totalAED;
    monthlySpend[monthKey].vat += inv.vatAmountAED;
    monthlySpend[monthKey].count += 1;
  });

  const monthEntries = Object.entries(monthlySpend);
  const maxMonthSpend = Math.max(...monthEntries.map(([, v]) => v.total), 1);

  // Categories sorted by spend
  const sortedCategories = Object.entries(summary.byCategory).sort(
    (a, b) => b[1].total - a[1].total
  );

  // Emirates sorted by spend
  const emirateEntries = Object.entries(summary.byEmirate).sort(
    (a, b) => b[1].total - a[1].total
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Invoices */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-blue-300 transition group">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Invoices Processed</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {summary.totalInvoices}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span className="inline-flex items-center text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 mr-0.5" />
              {summary.validInvoices} valid
            </span>
            <span>•</span>
            <span className="inline-flex items-center text-amber-600 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 mr-0.5" />
              {summary.flaggedInvoices} flagged
            </span>
          </div>
        </div>

        {/* Total Gross Spend */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-blue-300 transition group">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Gross Spend (AED)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            AED {formatAED(summary.totalAmountAED)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Taxable: <span className="font-semibold text-slate-700">AED {formatAED(summary.totalTaxableAED)}</span>
          </div>
        </div>

        {/* Total Recoverable VAT */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total VAT (Recoverable)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">
            AED {formatAED(summary.totalVatAED)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Standard 5% input tax for Form 201 Box 9
          </div>
        </div>

        {/* Compliance Health Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-blue-300 transition group">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>FTA Compliance Rate</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                complianceRate >= 90
                  ? 'bg-emerald-50 text-emerald-600'
                  : complianceRate >= 70
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              {complianceRate >= 90 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {complianceRate}%
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {summary.flaggedInvoices === 0
              ? 'All 15-digit TRNs & math tie'
              : `${summary.flaggedInvoices} items require audit review`}
          </div>
        </div>
      </div>

      {/* Row 2: VAT Distribution & Monthly Spend Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* VAT Distribution (5% vs 0% vs Exempt) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">VAT Rate Distribution</h3>
              <p className="text-xs text-slate-500">Standard 5%, Zero-Rated (0%), & Exempt</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <PieChartIcon className="w-4 h-4" />
            </div>
          </div>

          {/* Proportional Stack Bar */}
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex my-4">
            {summary.totalTaxableAED > 0 ? (
              <>
                <div
                  style={{
                    width: `${Math.round((summary.vat5TaxableAED / summary.totalTaxableAED) * 100)}%`,
                  }}
                  className="bg-blue-600 h-full transition-all duration-300"
                  title={`Standard 5%: AED ${formatAED(summary.vat5TaxableAED)}`}
                />
                <div
                  style={{
                    width: `${Math.round((summary.zeroRatedTaxableAED / summary.totalTaxableAED) * 100)}%`,
                  }}
                  className="bg-emerald-500 h-full transition-all duration-300"
                  title={`Zero Rated: AED ${formatAED(summary.zeroRatedTaxableAED)}`}
                />
                <div
                  style={{
                    width: `${Math.round((summary.exemptTaxableAED / summary.totalTaxableAED) * 100)}%`,
                  }}
                  className="bg-purple-500 h-full transition-all duration-300"
                  title={`Exempt: AED ${formatAED(summary.exemptTaxableAED)}`}
                />
              </>
            ) : (
              <div className="bg-slate-200 w-full h-full" />
            )}
          </div>

          <div className="space-y-3 mt-5">
            {/* Standard 5% */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-100/80">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0"></span>
                <div>
                  <div className="text-xs font-bold text-slate-800">Standard Rated (5%)</div>
                  <div className="text-[11px] text-slate-500">
                    VAT: AED {formatAED(summary.vat5AmountAED)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-extrabold text-slate-900">
                  AED {formatAED(summary.vat5TaxableAED)}
                </div>
                <div className="text-[11px] font-semibold text-blue-700">
                  {summary.totalTaxableAED > 0
                    ? Math.round((summary.vat5TaxableAED / summary.totalTaxableAED) * 100)
                    : 0}
                  % of taxable
                </div>
              </div>
            </div>

            {/* Zero-Rated 0% */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100/80">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                <div>
                  <div className="text-xs font-bold text-slate-800">Zero-Rated (0%)</div>
                  <div className="text-[11px] text-slate-500">VAT: AED 0.00</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-extrabold text-slate-900">
                  AED {formatAED(summary.zeroRatedTaxableAED)}
                </div>
                <div className="text-[11px] font-semibold text-emerald-700">
                  {summary.totalTaxableAED > 0
                    ? Math.round((summary.zeroRatedTaxableAED / summary.totalTaxableAED) * 100)
                    : 0}
                  % of taxable
                </div>
              </div>
            </div>

            {/* Exempt */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 border border-purple-100/80">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0"></span>
                <div>
                  <div className="text-xs font-bold text-slate-800">Exempt Supplies</div>
                  <div className="text-[11px] text-slate-500">Non-taxable input</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-extrabold text-slate-900">
                  AED {formatAED(summary.exemptTaxableAED)}
                </div>
                <div className="text-[11px] font-semibold text-purple-700">
                  {summary.totalTaxableAED > 0
                    ? Math.round((summary.exemptTaxableAED / summary.totalTaxableAED) * 100)
                    : 0}
                  % of taxable
                </div>
              </div>
            </div>

            {/* Foreign Currency Note */}
            {summary.foreignCurrencyCount > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 flex items-center justify-between">
                <span>Foreign FX Invoices Processed:</span>
                <span className="font-bold">{summary.foreignCurrencyCount} (Converted to AED)</span>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Spend Trends */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Monthly Spend Trends</h3>
              <p className="text-xs text-slate-500">Gross spend & recoverable VAT over time (AED)</p>
            </div>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {monthEntries.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No monthly transactions recorded yet.
              </div>
            ) : (
              monthEntries.map(([month, data]) => {
                const percentage = Math.round((data.total / maxMonthSpend) * 100);
                return (
                  <div key={month} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{month}</span>
                        <span className="text-[11px] font-normal text-slate-400">
                          ({data.count} inv)
                        </span>
                      </span>
                      <span className="font-extrabold text-slate-900">
                        AED {formatAED(data.total)}
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${percentage}%` }}
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>VAT: AED {formatAED(data.vat)}</span>
                      <span>{percentage}% of peak month</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Expense Categories & Place of Supply (Emirates) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category-Wise Spend */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Expense-Wise Spend</h3>
              <p className="text-xs text-slate-500">Procurement & service categories</p>
            </div>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-3.5 mt-4">
            {sortedCategories.slice(0, 6).map(([cat, data]) => {
              const catPercent = summary.totalAmountAED > 0
                ? Math.round((data.total / summary.totalAmountAED) * 100)
                : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 truncate max-w-[220px]">
                      {cat}
                    </span>
                    <span className="font-bold text-slate-900">
                      AED {formatAED(data.total)}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${catPercent}%` }}
                      className="bg-sky-500 h-full rounded-full transition-all duration-300"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{data.count} transaction{data.count > 1 ? 's' : ''}</span>
                    <span>{catPercent}% of total</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Place of Supply (7 Emirates) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Place of Supply (Emirates)</h3>
              <p className="text-xs text-slate-500">
                UAE Federal Tax Authority Emirate allocation
              </p>
            </div>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
              <MapPin className="w-4 h-4" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {emirateEntries.map(([emirate, data]) => {
              return (
                <div
                  key={emirate}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-blue-300 transition"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-800">{emirate}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                      {data.count}
                    </span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">
                    AED {formatAED(data.total)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    VAT: AED {formatAED(data.vat)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Action Footer */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div>
          <h4 className="font-bold text-base text-white">Review & Export Invoices</h4>
          <p className="text-xs text-blue-200/80 mt-0.5">
            View detailed on-screen table with inline editing, batch actions, and download in Zoho Books or Tally Prime format.
          </p>
        </div>
        <button
          onClick={onNavigateToTable}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white text-blue-900 hover:bg-blue-50 transition shadow-sm active:scale-95 cursor-pointer"
        >
          <span>Open Invoice Audit Table</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
