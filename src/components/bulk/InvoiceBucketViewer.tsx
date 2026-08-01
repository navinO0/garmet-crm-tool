"use client";

import React from 'react';
import { CheckCircle2, FileText, Download, ExternalLink, HardDrive, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';

interface InvoiceBucketViewerProps {
  order: any;
  invoiceBucketUrl: string;
  agreementBucketUrl: string;
  onReset: () => void;
}

export const InvoiceBucketViewer: React.FC<InvoiceBucketViewerProps> = ({
  order,
  invoiceBucketUrl,
  agreementBucketUrl,
  onReset,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 p-3 sm:p-8 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm max-w-4xl mx-auto space-y-3 sm:space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Banner */}
      <div className="text-center space-y-2 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 sm:p-6 rounded-lg">
        <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-sm sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Order & Manufacturing Agreement Created!
        </h2>
        <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Your bulk stitching agreement has been signed and saved. Official documents uploaded to bucket storage.
        </p>
      </div>

      {/* Bucket Links Section */}
      <div className="bg-zinc-900 dark:bg-zinc-950 text-white p-3 sm:p-5 rounded-lg shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          <HardDrive className="w-4 h-4 text-zinc-400" />
          <h3 className="text-xs sm:text-sm font-bold">Bucket Storage Objects</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          <div className="p-3 bg-zinc-800/80 rounded-md border border-zinc-700 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-400 uppercase font-mono">Invoice Bucket</span>
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-[11px] font-mono text-zinc-200 truncate">{invoiceBucketUrl}</p>
            <a
              href={invoiceBucketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold rounded transition"
            >
              <ExternalLink className="w-3 h-3" /> View Invoice
            </a>
          </div>

          <div className="p-3 bg-zinc-800/80 rounded-md border border-zinc-700 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-400 uppercase font-mono">Contract Bucket</span>
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" />
            </div>
            <p className="text-[11px] font-mono text-zinc-200 truncate">{agreementBucketUrl}</p>
            <a
              href={agreementBucketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold rounded transition"
            >
              <ExternalLink className="w-3 h-3" /> View Agreement
            </a>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 sm:p-5 space-y-3">
        <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2">
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">Order #{order.orderNumber}</h4>
            <p className="text-[11px] text-zinc-500">Client: {order.client?.name} {order.client?.businessName ? `(${order.client.businessName})` : ''}</p>
          </div>
          <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-[10px] font-bold rounded">
            {order.status}
          </span>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-500 block">Total Amount</span>
            <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-2 bg-emerald-50/60 dark:bg-emerald-950/40 rounded border border-emerald-200 dark:border-emerald-800">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block">Advance Required</span>
            <span className="text-xs sm:text-sm font-bold text-emerald-600">₹{order.advancePayment?.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-2 bg-amber-50/60 dark:bg-amber-950/40 rounded border border-amber-200 dark:border-amber-800">
            <span className="text-[10px] text-amber-700 dark:text-amber-300 block">Balance Due</span>
            <span className="text-xs sm:text-sm font-bold text-amber-600">₹{order.remainingAmount?.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="text-center pt-1">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold text-xs rounded-md transition shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Create Another Order
        </button>
      </div>
    </div>
  );
};
