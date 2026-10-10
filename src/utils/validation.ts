import { UAEInvoice, ValidationIssue } from '../types/invoice';

/**
 * Validates a UAE TRN (Tax Registration Number)
 * FTA Rule: Exactly 15 digits, typically starts with 100
 */
export function validateTRN(trn: string): { isValid: boolean; message?: string } {
  const cleanTrn = (trn || '').replace(/\D/g, '');
  if (!cleanTrn) {
    return { isValid: false, message: 'TRN is missing' };
  }
  if (cleanTrn.length !== 15) {
    return { 
      isValid: false, 
      message: `TRN must be exactly 15 digits (currently ${cleanTrn.length} digits)` 
    };
  }
  if (!cleanTrn.startsWith('100')) {
    return {
      isValid: true,
      message: 'Valid 15 digits, though UAE TRNs typically begin with 100'
    };
  }
  return { isValid: true };
}

/**
 * Normalizes and recalculates validation issues for an invoice
 */
export function validateInvoice(inv: Partial<UAEInvoice>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. Supplier Name
  if (!inv.supplierName || inv.supplierName.trim() === '') {
    issues.push({
      field: 'supplierName',
      severity: 'error',
      message: 'Supplier name is missing',
    });
  }

  // 2. Supplier TRN
  const trnCheck = validateTRN(inv.supplierTrn || '');
  if (!trnCheck.isValid) {
    issues.push({
      field: 'supplierTrn',
      severity: 'error',
      message: trnCheck.message || 'Supplier TRN is invalid (must be 15 digits)',
    });
  }

  // 3. Customer TRN (if present, check 15 digits)
  if (inv.customerTrn && inv.customerTrn.trim()) {
    const custTrnCheck = validateTRN(inv.customerTrn);
    if (!custTrnCheck.isValid) {
      issues.push({
        field: 'customerTrn',
        severity: 'warning',
        message: `Customer TRN invalid: ${custTrnCheck.message}`,
      });
    }
  }

  // 4. Invoice Number
  if (!inv.invoiceNumber || inv.invoiceNumber.trim() === '') {
    issues.push({
      field: 'invoiceNumber',
      severity: 'error',
      message: 'Invoice number is missing',
    });
  }

  // 5. Invoice Date
  if (!inv.invoiceDate || isNaN(Date.parse(inv.invoiceDate))) {
    issues.push({
      field: 'invoiceDate',
      severity: 'error',
      message: 'Invoice date is missing or invalid format',
    });
  }

  // 6. Tax Invoice marker check (FTA Article 59)
  if (!inv.isTaxInvoice) {
    issues.push({
      field: 'isTaxInvoice',
      severity: 'warning',
      message: 'Not explicitly marked as "Tax Invoice". Input VAT recovery may be challenged by FTA.',
    });
  }

  // 7. Place of Supply / Emirate
  if (!inv.emirate || inv.emirate === 'Unknown') {
    issues.push({
      field: 'emirate',
      severity: 'warning',
      message: 'Emirate (Place of Supply) not clearly identified. Defaulted or needs review for VAT 201 return.',
    });
  }

  // 8. Math checks: VAT 5% calculation
  const taxable = Number(inv.taxableValueAED) || 0;
  const vat = Number(inv.vatAmountAED) || 0;
  const total = Number(inv.totalAED) || 0;
  const rate = inv.vatRate || '5%';

  if (rate === '5%') {
    const expectedVAT = taxable * 0.05;
    const diff = Math.abs(vat - expectedVAT);
    if (diff > 0.08) {
      issues.push({
        field: 'vatAmountAED',
        severity: 'warning',
        message: `VAT (${vat.toFixed(2)} AED) does not equal 5% of taxable value (${taxable.toFixed(2)} AED). Expected: ${expectedVAT.toFixed(2)} AED.`,
      });
    }
  } else if (rate === '0%' || rate === 'Exempt') {
    if (vat > 0.01) {
      issues.push({
        field: 'vatAmountAED',
        severity: 'error',
        message: `VAT rate is marked as ${rate}, but VAT amount is ${vat.toFixed(2)} AED. Should be 0.00 AED.`,
      });
    }
  }

  // 9. Math checks: Totals tie
  const expectedTotal = taxable + vat;
  const totalDiff = Math.abs(total - expectedTotal);
  if (totalDiff > 0.08) {
    issues.push({
      field: 'totalAED',
      severity: 'error',
      message: `Totals do not tie: Taxable (${taxable.toFixed(2)}) + VAT (${vat.toFixed(2)}) = ${expectedTotal.toFixed(2)} AED, but invoice total is ${total.toFixed(2)} AED.`,
    });
  }

  // 10. Foreign Currency check
  if (inv.currency && inv.currency !== 'AED') {
    const rateVal = Number(inv.exchangeRate) || 0;
    if (rateVal <= 0) {
      issues.push({
        field: 'exchangeRate',
        severity: 'error',
        message: `Foreign currency (${inv.currency}) requires a valid Central Bank exchange rate to AED.`,
      });
    } else if (rateVal === 1) {
      issues.push({
        field: 'exchangeRate',
        severity: 'warning',
        message: `Foreign currency (${inv.currency}) has exchange rate set to 1.0. Please verify conversion to AED.`,
      });
    }
  }

  return issues;
}

/**
 * Computes batch summary metrics
 */
export function calculateBatchSummary(invoices: UAEInvoice[]) {
  const summary = {
    totalInvoices: invoices.length,
    validInvoices: 0,
    flaggedInvoices: 0,
    totalTaxableAED: 0,
    totalVatAED: 0,
    totalAmountAED: 0,
    vat5TaxableAED: 0,
    vat5AmountAED: 0,
    zeroRatedTaxableAED: 0,
    exemptTaxableAED: 0,
    foreignCurrencyCount: 0,
    byEmirate: {} as Record<string, { count: number; taxable: number; vat: number; total: number }>,
    byCategory: {} as Record<string, { count: number; total: number }>,
  };

  for (const inv of invoices) {
    const hasErrors = inv.validationIssues.some(i => i.severity === 'error');
    if (hasErrors) {
      summary.flaggedInvoices += 1;
    } else {
      summary.validInvoices += 1;
    }

    if (inv.currency && inv.currency !== 'AED') {
      summary.foreignCurrencyCount += 1;
    }

    const taxable = Number(inv.taxableValueAED) || 0;
    const vat = Number(inv.vatAmountAED) || 0;
    const total = Number(inv.totalAED) || 0;

    summary.totalTaxableAED += taxable;
    summary.totalVatAED += vat;
    summary.totalAmountAED += total;

    if (inv.vatRate === '5%') {
      summary.vat5TaxableAED += taxable;
      summary.vat5AmountAED += vat;
    } else if (inv.vatRate === '0%') {
      summary.zeroRatedTaxableAED += taxable;
    } else if (inv.vatRate === 'Exempt') {
      summary.exemptTaxableAED += taxable;
    }

    // By Emirate
    const emirateKey = inv.emirate || 'Unknown';
    if (!summary.byEmirate[emirateKey]) {
      summary.byEmirate[emirateKey] = { count: 0, taxable: 0, vat: 0, total: 0 };
    }
    summary.byEmirate[emirateKey].count += 1;
    summary.byEmirate[emirateKey].taxable += taxable;
    summary.byEmirate[emirateKey].vat += vat;
    summary.byEmirate[emirateKey].total += total;

    // By Category
    const catKey = inv.category || 'General & Miscellaneous';
    if (!summary.byCategory[catKey]) {
      summary.byCategory[catKey] = { count: 0, total: 0 };
    }
    summary.byCategory[catKey].count += 1;
    summary.byCategory[catKey].total += total;
  }

  return summary;
}
