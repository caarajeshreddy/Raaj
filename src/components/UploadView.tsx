import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  FileImage,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Coins,
  RefreshCw,
  Info,
  Camera,
  Plus,
} from 'lucide-react';
import { UAEInvoice, UAE_EMIRATES } from '../types/invoice';
import { validateInvoice } from '../utils/validation';
import { CameraCaptureModal } from './CameraCaptureModal';

interface QueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  errorMessage?: string;
  extractedInvoice?: UAEInvoice;
}

interface UploadViewProps {
  onInvoicesAdded: (invoices: UAEInvoice[]) => void;
  onNavigateToTable: () => void;
}

export const UploadView: React.FC<UploadViewProps> = ({
  onInvoicesAdded,
  onNavigateToTable,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directCameraInputRef = useRef<HTMLInputElement>(null);

  // File size formatter
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(
      (f) =>
        f.type === 'application/pdf' ||
        f.type === 'image/png' ||
        f.type === 'image/jpeg' ||
        f.type === 'image/jpg' ||
        f.name.toLowerCase().endsWith('.pdf') ||
        f.name.toLowerCase().endsWith('.png') ||
        f.name.toLowerCase().endsWith('.jpg') ||
        f.name.toLowerCase().endsWith('.jpeg')
    );

    if (validFiles.length === 0) {
      alert('Please upload PDF or Image (JPG, PNG) files only.');
      return;
    }

    const newItems: QueueItem[] = validFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      file,
      name: file.name,
      size: file.size,
      type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      status: 'pending',
    }));

    setQueue((prev) => [...prev, ...newItems]);
  };

  // Convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // strip prefix data:...;base64,
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Process a single item with Gemini backend
  const processItem = async (item: QueueItem): Promise<UAEInvoice | null> => {
    try {
      const base64Data = await fileToBase64(item.file);
      const mimeType = item.type || (item.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

      const response = await fetch('/api/extract-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64Data,
          mimeType,
          fileName: item.name,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${response.status}`);
      }

      const result = await response.json();
      const raw = result.data;

      // Construct UAEInvoice object
      const invoiceId = 'INV-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      const extracted: UAEInvoice = {
        id: invoiceId,
        fileName: item.name,
        fileSize: item.size,
        fileType: mimeType,
        uploadDate: new Date().toISOString().slice(0, 10),
        status: 'processed',
        isTaxInvoice: Boolean(raw.isTaxInvoice),
        invoiceNumber: String(raw.invoiceNumber || 'INV-' + Math.floor(1000 + Math.random() * 9000)),
        invoiceDate: String(raw.invoiceDate || new Date().toISOString().slice(0, 10)),
        dueDate: raw.dueDate ? String(raw.dueDate) : undefined,
        supplierName: String(raw.supplierName || 'Unknown Supplier'),
        supplierTrn: String(raw.supplierTrn || '').replace(/\D/g, ''),
        customerName: String(raw.customerName || ''),
        customerTrn: String(raw.customerTrn || '').replace(/\D/g, ''),
        description: String(raw.description || 'General Supplies & Services'),
        category: String(raw.category || 'General & Miscellaneous'),
        emirate: (UAE_EMIRATES.includes(raw.emirate) ? raw.emirate : 'Dubai') as any,
        currency: String(raw.currency || 'AED').toUpperCase(),
        exchangeRate: Number(raw.exchangeRate) || 1.0,
        taxableValueOriginal: Number(raw.taxableValueOriginal) || Number(raw.taxableValueAED) || 0,
        vatRate: (raw.vatRate || '5%') as any,
        vatAmountOriginal: Number(raw.vatAmountOriginal) || Number(raw.vatAmountAED) || 0,
        totalOriginal: Number(raw.totalOriginal) || Number(raw.totalAED) || 0,
        taxableValueAED: Number(raw.taxableValueAED) || 0,
        vatAmountAED: Number(raw.vatAmountAED) || 0,
        totalAED: Number(raw.totalAED) || 0,
        lineItems: Array.isArray(raw.lineItems)
          ? raw.lineItems.map((li: any, idx: number) => ({
              id: `${invoiceId}-LI-${idx + 1}`,
              description: li.description || 'Item description',
              quantity: li.quantity || 1,
              unitPrice: li.unitPrice || 0,
              taxableAmount: li.taxableAmount || 0,
              vatRate: (li.vatRate || '5%') as any,
              vatAmount: li.vatAmount || 0,
              totalAmount: li.totalAmount || 0,
            }))
          : [],
        validationIssues: [],
        isValid: true,
      };

      // Perform UAE VAT compliance validation
      const issues = validateInvoice(extracted);
      extracted.validationIssues = issues;
      extracted.isValid = !issues.some((i) => i.severity === 'error');

      return extracted;
    } catch (err: any) {
      console.error(`Failed to process ${item.name}:`, err);
      throw err;
    }
  };

  // Start processing the batch
  const processBatch = async () => {
    if (isProcessingBatch) return;
    setIsProcessingBatch(true);

    const pendingItems = queue.filter((i) => i.status === 'pending' || i.status === 'error');
    const successfullyExtracted: UAEInvoice[] = [];

    for (const item of pendingItems) {
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'processing', errorMessage: undefined } : q))
      );

      try {
        const inv = await processItem(item);
        if (inv) {
          successfullyExtracted.push(inv);
          setQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: 'success', extractedInvoice: inv } : q))
          );
        }
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'error',
                  errorMessage: err.message || 'Extraction failed',
                }
              : q
          )
        );
      }
    }

    if (successfullyExtracted.length > 0) {
      onInvoicesAdded(successfullyExtracted);
    }
    setIsProcessingBatch(false);
  };

  // Handle Photo Captured from Camera
  const handleCameraCapture = async (file: File, autoProcess = false) => {
    const newItem: QueueItem = {
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      file,
      name: file.name,
      size: file.size,
      type: file.type || 'image/jpeg',
      status: 'pending',
    };

    setQueue((prev) => [...prev, newItem]);

    if (autoProcess) {
      setIsProcessingBatch(true);
      setQueue((prev) =>
        prev.map((q) => (q.id === newItem.id ? { ...q, status: 'processing' } : q))
      );

      try {
        const inv = await processItem(newItem);
        if (inv) {
          setQueue((prev) =>
            prev.map((q) => (q.id === newItem.id ? { ...q, status: 'success', extractedInvoice: inv } : q))
          );
          onInvoicesAdded([inv]);
        }
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === newItem.id
              ? {
                  ...q,
                  status: 'error',
                  errorMessage: err.message || 'Extraction failed',
                }
              : q
          )
        );
      } finally {
        setIsProcessingBatch(false);
      }
    }
  };

  const removeItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCompleted = () => {
    setQueue((prev) => prev.filter((item) => item.status !== 'success'));
  };

  const successCount = queue.filter((i) => i.status === 'success').length;
  const pendingCount = queue.filter((i) => i.status === 'pending').length;
  const errorCount = queue.filter((i) => i.status === 'error').length;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Page Title & Instructions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Upload UAE Tax Invoices</h2>
          <p className="text-xs text-slate-500 mt-1">
            Upload single or multiple UAE tax invoices via Drag-and-Drop, Browse, or direct Camera Capture. IPT automatically extracts TRNs, verifies UAE VAT compliance, and converts foreign currency values to AED.
          </p>
        </div>

        {/* Quick Capture Camera Buttons in Header */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-white" />
            <span>Live Camera</span>
          </button>
          <button
            type="button"
            onClick={() => directCameraInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-2xs transition active:scale-95 cursor-pointer"
            title="Open phone or computer camera directly"
          >
            <Camera className="w-3.5 h-3.5 text-indigo-600" />
            <span>Device Camera</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-200 ${
          dragActive
            ? 'border-blue-600 bg-blue-50/70 scale-[1.01]'
            : 'border-slate-300 hover:border-blue-400 bg-white'
        } shadow-xs`}
      >
        {/* Standard File Upload */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
          onChange={handleFileInputChange}
          className="hidden"
          id="invoice-file-input"
        />

        {/* Direct Native Camera Input */}
        <input
          ref={directCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(Array.from(e.target.files));
            }
          }}
          className="hidden"
          id="direct-camera-input"
        />

        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-inner">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Drag & Drop UAE Invoices Here
        </h3>
        <p className="text-xs text-slate-500 mb-6 max-w-md mx-auto">
          Supports <span className="font-semibold text-slate-700">PDF, JPG, PNG</span> documents or live invoice photos taken with your camera.
        </p>

        {/* Primary Action Buttons: Browse & Capture Camera */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm active:scale-95 transition cursor-pointer"
          >
            Browse Files from Computer
          </button>

          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 shadow-2xs active:scale-95 transition cursor-pointer"
          >
            <Camera className="w-4 h-4 text-indigo-600" />
            <span>Live Camera Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => directCameraInputRef.current?.click()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs active:scale-95 transition cursor-pointer"
          >
            <Camera className="w-4 h-4 text-slate-500" />
            <span>Device Camera App</span>
          </button>
        </div>

        {/* Security & Extraction Note */}
        <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-slate-100 text-slate-400 text-xs flex-wrap">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            FTA Executive Regulation Compliant
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-indigo-500" />
            Live High-Res Camera Capture
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-blue-500" />
            Automatic Foreign FX Conversion to AED
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-purple-500" />
            15-digit TRN & 5% Math Verification
          </span>
        </div>
      </div>

      {/* Queue & Status List */}
      {queue.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Batch Processing Queue ({queue.length} file{queue.length > 1 ? 's' : ''})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {successCount} processed • {pendingCount} pending • {errorCount} errors
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              {/* Option to capture another invoice photo directly into the queue */}
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Snap Another Photo</span>
              </button>

              {successCount > 0 && (
                <button
                  type="button"
                  onClick={clearCompleted}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Clear Processed
                </button>
              )}

              {pendingCount > 0 || errorCount > 0 ? (
                <button
                  type="button"
                  disabled={isProcessingBatch}
                  onClick={processBatch}
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer ${
                    isProcessingBatch
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isProcessingBatch ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Extracting with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Extract All Invoices ({pendingCount + errorCount})</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onNavigateToTable}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition cursor-pointer"
                >
                  <span>Go to Invoice Audit Table</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Queue Items List */}
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {queue.map((item) => (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                    {item.name.toLowerCase().includes('camera') ? (
                      <Camera className="w-5 h-5 text-indigo-600" />
                    ) : item.name.toLowerCase().endsWith('.pdf') ? (
                      <FileText className="w-5 h-5 text-rose-500" />
                    ) : (
                      <FileImage className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate max-w-sm sm:max-w-md">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatSize(item.size)} • {item.name.split('.').pop()?.toUpperCase()}
                      {item.name.toLowerCase().includes('camera') && (
                        <span className="ml-1.5 text-indigo-600 font-semibold">• Camera Capture</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {item.status === 'pending' && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold">
                      Ready
                    </span>
                  )}
                  {item.status === 'processing' && (
                    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Extracting...
                    </span>
                  )}
                  {item.status === 'success' && (
                    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Extracted
                    </span>
                  )}
                  {item.status === 'error' && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium max-w-xs">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.errorMessage || 'Failed'}</span>
                    </div>
                  )}

                  {!isProcessingBatch && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UAE VAT Compliance Guide Card */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          UAE VAT Extraction Specifications & Camera Best Practices
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
          <ul className="space-y-1.5 list-disc pl-4">
            <li>
              <span className="font-semibold text-slate-800">Camera Scanning Tip:</span> Place the invoice flat in a well-lit area. Ensure all 4 corners and the 15-digit TRN are clearly in focus.
            </li>
            <li>
              <span className="font-semibold text-slate-800">15-Digit TRN:</span> Supplier & Customer TRNs are checked against the 15-digit FTA standard format.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Article 59 "Tax Invoice":</span> Tax authorities require the exact words "Tax Invoice" to allow input tax recovery.
            </li>
          </ul>
          <ul className="space-y-1.5 list-disc pl-4">
            <li>
              <span className="font-semibold text-slate-800">Foreign Currencies:</span> Invoices in USD, EUR, GBP, SAR are converted to AED with foreign exchange rates.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Place of Supply (Emirates):</span> Allocates spend across Abu Dhabi, Dubai, Sharjah, etc., for UAE VAT Form 201 return.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Accounting Integration:</span> Output format ready for Zoho Books (UAE) and Tally Prime (UAE VAT).
            </li>
          </ul>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};
