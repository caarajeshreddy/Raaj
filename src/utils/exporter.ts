import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UAEInvoice, BatchSummary } from '../types/invoice';

/**
 * Format currency amount for display/export
 */
export const formatAED = (amount: number): string => {
  return (amount || 0).toLocaleString('en-AE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Generates and downloads Excel workbook (.xlsx) with:
 * 1. Master Consolidated Sheet
 * 2. Zoho Books (UAE) Ready Format
 * 3. Tally Prime (UAE VAT) Ready Format
 * 4. UAE VAT 201 Return Summary
 */
export function exportToExcel(invoices: UAEInvoice[], summary: BatchSummary) {
  const wb = XLSX.utils.book_new();

  // 1. Master Consolidated Sheet
  const masterData = invoices.map((inv) => ({
    'Invoice Number': inv.invoiceNumber,
    'Invoice Date': inv.invoiceDate,
    'Marked "Tax Invoice"': inv.isTaxInvoice ? 'YES' : 'NO (Risk)',
    'Supplier Name': inv.supplierName,
    'Supplier TRN': inv.supplierTrn,
    'Customer Name': inv.customerName || 'N/A',
    'Customer TRN': inv.customerTrn || 'N/A',
    'Place of Supply (Emirate)': inv.emirate,
    'Description': inv.description,
    'Expense Category': inv.category,
    'Currency': inv.currency,
    'Exchange Rate to AED': inv.exchangeRate,
    'Taxable Value (Original)': inv.taxableValueOriginal,
    'VAT Rate': inv.vatRate,
    'VAT Amount (Original)': inv.vatAmountOriginal,
    'Total (Original)': inv.totalOriginal,
    'Taxable Value (AED)': inv.taxableValueAED,
    'VAT Amount (AED)': inv.vatAmountAED,
    'Total Amount (AED)': inv.totalAED,
    'Math Check': Math.abs((inv.taxableValueAED + inv.vatAmountAED) - inv.totalAED) < 0.08 ? 'Passed' : 'Mismatch',
    'Audit Issues': inv.validationIssues.map(i => `[${i.severity.toUpperCase()}] ${i.message}`).join('; ') || 'None',
  }));

  const wsMaster = XLSX.utils.json_to_sheet(masterData);
  XLSX.utils.book_append_sheet(wb, wsMaster, 'IPT Master Invoices');

  // 2. Zoho Books (UAE VAT) Format
  const zohoData = invoices.map((inv) => ({
    'Date': inv.invoiceDate,
    'Bill Number': inv.invoiceNumber,
    'Vendor Name': inv.supplierName,
    'Vendor TRN': inv.supplierTrn,
    'Customer Name': inv.customerName || '',
    'Customer TRN': inv.customerTrn || '',
    'Place of Supply': inv.emirate === 'Unknown' ? 'Dubai' : inv.emirate,
    'Currency': inv.currency || 'AED',
    'Exchange Rate': inv.exchangeRate || 1,
    'Account': inv.category || 'General Expense',
    'Item Description': inv.description || 'Goods / Services',
    'Taxable Amount (AED)': inv.taxableValueAED,
    'Tax Rate': inv.vatRate === '5%' ? 'Standard Rate [5%]' : inv.vatRate === '0%' ? 'Zero Rate [0%]' : 'Exempt',
    'Tax Amount (AED)': inv.vatAmountAED,
    'Total (AED)': inv.totalAED,
    'Is Tax Invoice Marked': inv.isTaxInvoice ? 'Yes' : 'No',
    'Audit Status': inv.validationIssues.some(i => i.severity === 'error') ? 'Requires Review' : 'Verified',
  }));

  const wsZoho = XLSX.utils.json_to_sheet(zohoData);
  XLSX.utils.book_append_sheet(wb, wsZoho, 'Zoho Books (UAE)');

  // 3. Tally Prime (UAE VAT) Format
  const tallyData = invoices.map((inv) => ({
    'Voucher Date': inv.invoiceDate,
    'Voucher Type': 'Purchase Tax Invoice',
    'Voucher No.': inv.invoiceNumber,
    'Party A/c Name': inv.supplierName,
    'Party TRN': inv.supplierTrn,
    'Place of Supply (State)': inv.emirate === 'Unknown' ? 'Dubai' : inv.emirate,
    'Particulars / Item Description': inv.description,
    'Expense Head': inv.category,
    'Taxable Value (AED)': inv.taxableValueAED,
    'VAT Rate Applied': inv.vatRate,
    'VAT Amount (AED)': inv.vatAmountAED,
    'Invoice Total (AED)': inv.totalAED,
    'Original Currency': inv.currency,
    'Exchange Rate': inv.exchangeRate,
    'Tax Invoice Verified': inv.isTaxInvoice ? 'YES' : 'NO',
  }));

  const wsTally = XLSX.utils.json_to_sheet(tallyData);
  XLSX.utils.book_append_sheet(wb, wsTally, 'Tally Prime (UAE VAT)');

  // 4. UAE VAT 201 Return Helper Summary Sheet
  const vat201Data = [
    { 'VAT 201 Box / Metric': 'Total Invoices Audited', 'AED Amount / Count': summary.totalInvoices },
    { 'VAT 201 Box / Metric': 'Compliant / Valid Invoices', 'AED Amount / Count': summary.validInvoices },
    { 'VAT 201 Box / Metric': 'Flagged Invoices with Audit Warnings', 'AED Amount / Count': summary.flaggedInvoices },
    { 'VAT 201 Box / Metric': 'Box 9: Standard Rated Expenses - Taxable Value', 'AED Amount / Count': summary.vat5TaxableAED.toFixed(2) },
    { 'VAT 201 Box / Metric': 'Box 9: Standard Rated Expenses - Recoverable VAT Amount', 'AED Amount / Count': summary.vat5AmountAED.toFixed(2) },
    { 'VAT 201 Box / Metric': 'Zero-Rated Purchases Taxable Value', 'AED Amount / Count': summary.zeroRatedTaxableAED.toFixed(2) },
    { 'VAT 201 Box / Metric': 'Exempt Purchases Taxable Value', 'AED Amount / Count': summary.exemptTaxableAED.toFixed(2) },
    { 'VAT 201 Box / Metric': 'Total Taxable Spend (AED)', 'AED Amount / Count': summary.totalTaxableAED.toFixed(2) },
    { 'VAT 201 Box / Metric': 'Total Gross Invoiced Spend (AED)', 'AED Amount / Count': summary.totalAmountAED.toFixed(2) },
  ];

  const wsVat = XLSX.utils.json_to_sheet(vat201Data);
  XLSX.utils.book_append_sheet(wb, wsVat, 'VAT 201 Return Helper');

  const fileName = `IPT_UAE_Invoices_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Generates and downloads standard CSV file
 */
export function exportToCSV(invoices: UAEInvoice[]) {
  if (invoices.length === 0) return;

  const headers = [
    'Invoice Number',
    'Invoice Date',
    'Tax Invoice Marked',
    'Supplier Name',
    'Supplier TRN',
    'Customer Name',
    'Customer TRN',
    'Emirate',
    'Category',
    'Description',
    'Currency',
    'Exchange Rate',
    'Taxable Value (AED)',
    'VAT Rate',
    'VAT Amount (AED)',
    'Total Amount (AED)',
    'Validation Status',
  ];

  const rows = invoices.map((inv) => [
    `"${(inv.invoiceNumber || '').replace(/"/g, '""')}"`,
    `"${inv.invoiceDate || ''}"`,
    inv.isTaxInvoice ? 'Yes' : 'No',
    `"${(inv.supplierName || '').replace(/"/g, '""')}"`,
    `"${inv.supplierTrn || ''}"`,
    `"${(inv.customerName || '').replace(/"/g, '""')}"`,
    `"${inv.customerTrn || ''}"`,
    `"${inv.emirate || ''}"`,
    `"${(inv.category || '').replace(/"/g, '""')}"`,
    `"${(inv.description || '').replace(/"/g, '""')}"`,
    `"${inv.currency || 'AED'}"`,
    inv.exchangeRate || 1,
    (inv.taxableValueAED || 0).toFixed(2),
    inv.vatRate || '5%',
    (inv.vatAmountAED || 0).toFixed(2),
    (inv.totalAED || 0).toFixed(2),
    inv.validationIssues.some(i => i.severity === 'error') ? 'Error' : 'Valid',
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `IPT_UAE_Invoices_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates clean PDF Tax Audit Schedule
 */
export function exportToPDF(invoices: UAEInvoice[], summary: BatchSummary) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Header Branding
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('INVOICE PROCESSING TOOL (IPT) - UAE TAX AUDIT SCHEDULE', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Generated: ${new Date().toLocaleString('en-AE')} | UAE Federal Tax Authority (FTA) Compliance Ready`, 14, 20);

  // Summary KPI Bar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 28, 269, 16, 2, 2, 'F');
  
  doc.text(`Total Invoices: ${summary.totalInvoices}`, 20, 38);
  doc.text(`Taxable Spend: AED ${formatAED(summary.totalTaxableAED)}`, 70, 38);
  doc.text(`Total VAT (5%): AED ${formatAED(summary.totalVatAED)}`, 140, 38);
  doc.text(`Total Gross Spend: AED ${formatAED(summary.totalAmountAED)}`, 205, 38);

  // Table Data
  const tableData = invoices.map((inv) => [
    inv.invoiceDate || '-',
    inv.invoiceNumber || '-',
    inv.supplierName ? (inv.supplierName.length > 22 ? inv.supplierName.substring(0, 22) + '...' : inv.supplierName) : '-',
    inv.supplierTrn || 'MISSING',
    inv.isTaxInvoice ? 'Yes' : 'NO',
    inv.emirate || 'Unknown',
    inv.currency !== 'AED' ? `${inv.currency} (@${inv.exchangeRate})` : 'AED',
    formatAED(inv.taxableValueAED),
    inv.vatRate,
    formatAED(inv.vatAmountAED),
    formatAED(inv.totalAED),
    inv.validationIssues.some(i => i.severity === 'error') ? 'Error' : 'Valid',
  ]);

  autoTable(doc, {
    startY: 48,
    head: [[
      'Date',
      'Inv #',
      'Supplier',
      'Supplier TRN',
      'Tax Inv?',
      'Emirate',
      'Currency',
      'Taxable (AED)',
      'Rate',
      'VAT (AED)',
      'Total (AED)',
      'Status',
    ]],
    body: tableData,
    headStyles: {
      fillColor: [2, 132, 199], // sky-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
    theme: 'striped',
  });

  doc.save(`IPT_UAE_Tax_Schedule_${new Date().toISOString().slice(0, 10)}.pdf`);
}
