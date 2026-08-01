"use client";

import React, { useState } from 'react';
import { X, CheckCircle2, Clock, Calendar, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import { CloudinaryUpload } from '@/components/ui/CloudinaryUpload';

interface OrderLifecycleModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const OrderLifecycleModal: React.FC<OrderLifecycleModalProps> = ({
  order,
  isOpen,
  onClose,
  onUpdated,
}) => {
  if (!isOpen || !order) return null;

  const [status, setStatus] = useState<string>(order.status || 'Work Started');
  const [outputImages, setOutputImages] = useState<string[]>(
    order.outputImages ? JSON.parse(order.outputImages) : []
  );
  const [leftoverNotes, setLeftoverNotes] = useState<string>(order.leftoverMaterialNotes || '');
  const [extendedDate, setExtendedDate] = useState<string>(order.extendedDeliveryDate || '');
  const [extensionReason, setExtensionReason] = useState<string>(order.extensionReason || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const payload: any = {
        status,
        outputImages,
        leftoverMaterialNotes: leftoverNotes,
      };

      if (status === 'Extended') {
        payload.extendedDeliveryDate = extendedDate;
        payload.extensionReason = extensionReason;
      }

      const res = await fetch(`/api/bulk-orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update order status');
      }

      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Status update failed.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 dark:border-zinc-800 space-y-5">
        <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-3">
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-zinc-100">
              Manage Order Lifecycle - #{order.orderNumber}
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400">Client: {order.client?.name}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{error}</div>}

        {/* Status Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase mb-1">
            Order Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-xs font-semibold"
          >
            <option value="Estimate Generated">Estimate Generated</option>
            <option value="Estimate Approved">Estimate Approved</option>
            <option value="Work Started">Agreement Signed / Work Started</option>
            <option value="In Production">In Production / Cutting & Stitching</option>
            <option value="Completed">Completed (Upload Output Pictures & Leftover Notes)</option>
            <option value="Extended">Extended (Extend Delivery Date)</option>
          </select>
        </div>

        {/* Completion Fields: Output Photos & Leftover Notes */}
        {status === 'Completed' && (
          <div className="space-y-4 p-4 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <CloudinaryUpload
              label="Finished Garment Output Pictures"
              description="Upload photos of final stitched garments before dispatch."
              images={outputImages}
              onChange={setOutputImages}
            />

            <div>
              <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-300 uppercase mb-1">
                Leftover Material Remarks & Fabric Returned
              </label>
              <textarea
                rows={2}
                placeholder="e.g. 2.5 meters leftover velvet fabric and 1 bundle lining returned to client."
                value={leftoverNotes}
                onChange={(e) => setLeftoverNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs"
              />
            </div>
          </div>
        )}

        {/* Extension Fields */}
        {status === 'Extended' && (
          <div className="space-y-3 p-4 bg-amber-50/60 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
            <div>
              <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase mb-1">
                Extended Delivery Date
              </label>
              <input
                type="text"
                placeholder="e.g. 15-August-2026 (Extended by 10 Days)"
                value={extendedDate}
                onChange={(e) => setExtendedDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase mb-1">
                Reason for Extension
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Client requested design modification / embroidery addition."
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs"
              />
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 text-xs font-semibold rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Order Lifecycle Update'}
          </button>
        </div>
      </div>
    </div>
  );
};
