export type VatRateType = '5%' | '0%' | 'Exempt' | 'Out of Scope';

export type Emirate = 
  | 'Abu Dhabi' 
  | 'Dubai' 
  | 'Sharjah' 
  | 'Ajman' 
  | 'Umm Al Quwain' 
  | 'Ras Al Khaimah' 
  | 'Fujairah'
  | 'Outside UAE'
  | 'Unknown';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  taxableAmount: number;
  vatRate: VatRateType;
  vatAmount: number;
  totalAmount: number;
}

export interface ValidationIssue {
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface UAEInvoice {
  id: string;
  fileName: string;
  fileSize?: number;
  fileType: string;
  uploadDate: string;
  status: 'processing' | 'processed' | 'error';
  errorMessage?: string;
  
  // Tax Invoice Core Fields
  isTaxInvoice: boolean; // FTA requirement: marked "Tax Invoice" or "Simplified Tax Invoice"
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate?: string;
  
  // Parties
  supplierName: string;
  supplierTrn: string; // 15 digits
  customerName: string;
  customerTrn: string; // 15 digits (if B2B)
  
  // Content & Place of Supply
  description: string;
  category: string; // Expense category
  emirate: Emirate; // Place of supply
  
  // Currency & FX
  currency: string; // e.g. 'AED', 'USD', 'EUR', 'GBP', 'SAR'
  exchangeRate: number; // to AED (1 for AED)
  
  // Monetary in Original Currency
  taxableValueOriginal: number;
  vatAmountOriginal: number;
  totalOriginal: number;
  
  // Normalized Monetary in AED
  taxableValueAED: number;
  vatRate: VatRateType;
  vatAmountAED: number;
  totalAED: number;
  
  // Details
  lineItems: InvoiceLineItem[];
  rawTextPreview?: string;
  
  // Validation status
  validationIssues: ValidationIssue[];
  isValid: boolean;
}

export interface BatchSummary {
  totalInvoices: number;
  validInvoices: number;
  flaggedInvoices: number;
  totalTaxableAED: number;
  totalVatAED: number;
  totalAmountAED: number;
  vat5TaxableAED: number;
  vat5AmountAED: number;
  zeroRatedTaxableAED: number;
  exemptTaxableAED: number;
  foreignCurrencyCount: number;
  byEmirate: Record<string, { count: number; taxable: number; vat: number; total: number }>;
  byCategory: Record<string, { count: number; total: number }>;
}

export const UAE_EMIRATES: Emirate[] = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
];

export const EXPENSE_CATEGORIES = [
  'IT & Software Subscriptions',
  'Professional & Legal Fees',
  'Office Supplies & Rent',
  'Utilities & Telecommunication',
  'Marketing & Advertising',
  'Travel & Entertainment',
  'Logistics & Courier',
  'Inventory & Materials',
  'Maintenance & Repairs',
  'General & Miscellaneous',
];
