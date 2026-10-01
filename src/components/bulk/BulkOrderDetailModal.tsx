"use client";

import React, { useState, useCallback } from 'react';

import { X, Calendar, Image as ImageIcon, FileText, DollarSign, Users, Scissors, Layers, CheckCircle2, ShieldCheck, Download, ExternalLink, MessageCircle, Printer, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generateInvoiceHTML, generateAgreementHTML, generateSizeChartHTML } from '@/lib/documentGenerator';

interface BulkOrderDetailModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (order: any) => void;
  onRestore?: (order: any) => void;
}

export const BulkOrderDetailModal: React.FC<BulkOrderDetailModalProps> = ({ order, isOpen, onClose, onDelete, onRestore }) => {
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [sizeChartEnabled, setSizeChartEnabled] = useState<boolean>(true);

  React.useEffect(() => {
    if (isOpen) {
      fetch('/api/settings/gst')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.setting) {
            setSizeChartEnabled(data.setting.sizeChartEnabled ?? true);
          }
        })
        .catch(err => console.error('Failed to fetch size chart settings:', err));
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const sendViaWhatsApp = () => {
    const phone = (order.client?.mobileNumber || '').replace(/[^0-9]/g, '');
    const invoiceUrl = order.invoice?.invoicePdfBucketUrl || '';
    const agreementUrl = order.agreement?.agreementPdfBucketUrl || '';
    const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

    const lines = [
      `*RAADHE LABEL — Bulk Order Confirmation*`,
      ``,
      `📋 Order #: ${order.orderNumber}`,
      `👤 Client: ${order.client?.name}${order.client?.businessName ? ` (${order.client.businessName})` : ''}`,
      `📦 Status: ${order.status}`,
      `💰 Grand Total: ${fmt(order.totalAmount)}`,
      `✅ Advance Paid: ${fmt(order.advancePayment)}`,
      `🔄 Balance Due: ${fmt(order.remainingAmount)}`,
      `🚚 Delivery: ${order.estimatedDelivery || 'As Scheduled'}`,
      ``,
      ...(invoiceUrl ? [`📄 *Invoice PDF:*\n${invoiceUrl}`] : []),
      ...(agreementUrl ? [`📝 *Agreement PDF:*\n${agreementUrl}`] : []),
      ``,
      `Thank you for choosing RAADHE LABEL! 🙏`,
    ];

    const message = encodeURIComponent(lines.join('\n'));
    const url = phone ? `https://wa.me/91${phone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
  };

  const handlePrintInvoice = () => {
    if (order.invoice?.invoicePdfBucketUrl) {
      window.open(order.invoice.invoicePdfBucketUrl, '_blank');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const grossTotal = (order.subtotalAmount || 0) + (order.materialCharges || 0) + (order.shippingCharges || 0) + (order.packingCharges || 0);
    const discountAmount = Math.max(0, grossTotal - ((order.totalAmount || 0) - (order.gstAmount || 0)));

    const invoiceHtml = generateInvoiceHTML({
      invoiceNumber: order.invoice?.invoiceNumber || `INV-${order.orderNumber}`,
      orderNumber: order.orderNumber,
      clientName: order.client?.name || order.clientName || 'Client',
      businessName: order.client?.businessName || order.businessName || '',
      mobileNumber: order.client?.mobileNumber || order.mobileNumber || '',
      email: order.client?.email || order.email || '',
      address: order.client?.address || order.address || '',
      items: (order.items || []).map((i: any) => {
        let priceBreakup = null;
        let customPriceFields = null;
        if (i.priceBreakupJson) {
          try {
            const parsed = JSON.parse(i.priceBreakupJson);
            if (Array.isArray(parsed)) {
              customPriceFields = parsed;
            } else {
              priceBreakup = parsed;
            }
          } catch (e) {
            console.error("Failed to parse priceBreakupJson", e);
          }
        }
        return {
          itemDescription: i.itemDescription,
          category: i.category,
          quantity: i.quantity,
          unitRate: i.unitRate,
          totalPrice: i.totalPrice,
          sizeBreakdown: i.sizeBreakdown,
          fabricDetails: i.fabricDetails,
          priceBreakup,
          customPriceFields,
        };
      }),
      materialProvidedBy: order.materialProvidedBy,
      materialCharges: order.materialCharges || 0,
      materialReceivedDetails: order.materialReceivedDetails,
      materials: order.materials,
      subtotal: order.subtotalAmount || order.totalAmount,
      shippingCharges: order.shippingCharges || 0,
      packingCharges: order.packingCharges || 0,
      gstAmount: order.gstAmount || 0,
      discountAmount: discountAmount || 0,
      totalAmount: order.totalAmount,
      advancePaid: order.advancePayment || 0,
      balanceDue: order.remainingAmount || 0,
      invoiceDate: new Date(order.createdAt).toLocaleDateString(),
      sizeChartEnabled: sizeChartEnabled,
    });

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Invoice_${order.orderNumber}</title></head><body style="margin:0;padding:0;">${invoiceHtml}<script>window.onload=function(){window.print();};</script></body></html>`);
    printWindow.document.close();
  };

  const handlePrintAgreement = () => {
    if (order.agreement?.agreementPdfBucketUrl) {
      window.open(order.agreement.agreementPdfBucketUrl, '_blank');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const agreementHtml = generateAgreementHTML({
      orderNumber: order.orderNumber,
      clientName: order.client?.name || order.clientName || 'Client',
      businessName: order.client?.businessName || order.businessName || '',
      mobileNumber: order.client?.mobileNumber || order.mobileNumber || '',
      email: order.client?.email || order.email || '',
      address: order.client?.address || order.address || '',
      date: new Date(order.createdAt).toLocaleDateString(),
      clientSignatoryName: order.agreement?.clientSignatoryName || order.client?.name || 'Client Signatory',
      clientDesignation: order.agreement?.clientDesignation || 'Client',
      clientSignature: order.agreement?.clientSignature || '',
      companySignatoryName: 'RAADHE LABEL',
      companyDesignation: 'Authorized Signatory',
      witnessName: order.agreement?.witnessName || '',
      witnessMobile: order.agreement?.witnessMobile || '',
      witnessSignature: order.agreement?.witnessSignature || '',
      clientInitials: order.clientInitials || '',
      labelInitials: order.labelInitials || '',
    });


    printWindow.document.write(`<!DOCTYPE html><html><head><title>Agreement_${order.orderNumber}</title></head><body style="margin:0;padding:0;">${agreementHtml}<script>window.onload=function(){window.print();};</script></body></html>`);
    printWindow.document.close();
  };

  const handlePrintSizeChart = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const sizeChartHtml = generateSizeChartHTML({
      orderNumber: order.orderNumber,
      clientName: order.client?.name || order.clientName || 'Client',
      businessName: order.client?.businessName || order.businessName || '',
      mobileNumber: order.client?.mobileNumber || order.mobileNumber || '',
      email: order.client?.email || order.email || '',
      date: new Date(order.createdAt).toLocaleDateString(),
      items: (order.items || []).map((i: any) => ({
        itemDescription: i.itemDescription,
        category: i.category,
        quantity: i.quantity,
        sizeBreakdown: i.sizeBreakdown || 'Standard Sizing',
        fabricDetails: i.fabricDetails,
      })),
    });

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Size_Chart_${order.orderNumber}</title></head><body style="margin:0;padding:0;">${sizeChartHtml}<script>window.onload=function(){window.print();};</script></body></html>`);
    printWindow.document.close();
  };

  // Safe JSON Parsing of images
  const referenceImages: string[] = order.referenceImages 
    ? (typeof order.referenceImages === 'string' ? JSON.parse(order.referenceImages) : order.referenceImages) 
    : [];
  const materialImages: string[] = order.materialImages 
    ? (typeof order.materialImages === 'string' ? JSON.parse(order.materialImages) : order.materialImages) 
    : [];
  const outputImages: string[] = order.outputImages 
    ? (typeof order.outputImages === 'string' ? JSON.parse(order.outputImages) : order.outputImages) 
    : [];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/50';
      case 'Extended':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/50';
      case 'Work Started':
      case 'In Production':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/50';
      default:
        return 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-950/20 dark:text-zinc-400 dark:border-zinc-800/50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-start bg-zinc-50/50 dark:bg-zinc-950/30">
          <div>
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
              Bulk Stitching Job Sheet
            </span>
            <h3 className="font-bold text-lg sm:text-2xl text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mt-0.5">
              <span>{order.orderNumber}</span>
              <span className="text-xs px-2.5 py-0.5 font-medium rounded-full border border-zinc-200 dark:border-zinc-700">
                {order.client?.businessName || 'Direct Client'}
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Registered Client: <span className="font-semibold text-zinc-750 dark:text-zinc-200">{order.client?.name}</span> ({order.client?.mobileNumber})
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {order.isDeleted && (
          <div className="bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/50 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-red-700 dark:text-red-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                This bulk order is <strong>soft-deleted</strong> and archived in history.
                {order.deletedAt && ` (Deleted on ${new Date(order.deletedAt).toLocaleDateString()} at ${new Date(order.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                {order.deleteReason && ` — Reason: "${order.deleteReason}"`}
              </span>
            </div>
            {onRestore && (
              <Button
                size="sm"
                onClick={() => onRestore(order)}
                className="h-7 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 ml-3 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Restore Order
              </Button>
            )}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 divide-y divide-zinc-100 dark:divide-zinc-800/80">
          
          {/* Section 0: Status Banner */}
          <div className="pb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800 rounded-lg">
              <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 block">Job Status</span>
              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1 border ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800 rounded-lg">
              <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 block">Expected Delivery</span>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                {order.extendedDeliveryDate || order.estimatedDelivery || 'Not Scheduled'}
              </span>
              {order.extendedDeliveryDate && (
                <span className="text-[9px] text-red-500 font-semibold block mt-0.5">Extended due to: {order.extensionReason}</span>
              )}
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800 rounded-lg">
              <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-405 block">Payment Summary</span>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1 block">
                {formatCurrency(order.advancePayment)} Paid / {formatCurrency(order.remainingAmount)} Balance
              </span>
              <span className="text-[9px] text-zinc-400 block mt-0.5">Total Value: {formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          {/* Section 1: Client details */}
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Client Contact Profile
              </h4>
              <div className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                <p><span className="font-semibold text-zinc-500">Contact Person:</span> {order.client?.name}</p>
                {order.client?.businessName && <p><span className="font-semibold text-zinc-500">Business:</span> {order.client.businessName}</p>}
                <p><span className="font-semibold text-zinc-500">Mobile:</span> {order.client?.mobileNumber}</p>
                {order.client?.email && <p><span className="font-semibold text-zinc-500">Email:</span> {order.client.email}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Billing / Shipping Address
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-950/30 p-2.5 rounded border border-zinc-150 dark:border-zinc-800 whitespace-pre-line">
                {order.client?.address || 'No address specified.'}
              </p>
            </div>
          </div>

          {/* Section 2: Items list */}
          <div className="pt-6 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Scissors className="w-4 h-4" /> Stitching Items & Size Breakdown
            </h4>
            <div className="border border-zinc-150 dark:border-zinc-800 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-50 dark:bg-zinc-900/60">
                  <TableRow>
                    <TableHead className="text-xs text-zinc-400">Garment / Description</TableHead>
                    <TableHead className="text-xs text-zinc-400">Category</TableHead>
                    <TableHead className="text-xs text-zinc-400 text-center">Quantity</TableHead>
                    <TableHead className="text-xs text-zinc-400 text-right">Unit Rate</TableHead>
                    <TableHead className="text-xs text-zinc-400 text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items?.map((item: any, index: number) => (
                    <TableRow key={item.id || index}>
                      <TableCell className="py-3 font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                        {item.itemDescription}
                        {item.sizeBreakdown && (
                          <div className="mt-1 font-mono text-[9px] text-zinc-400 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800 px-1.5 py-0.5 rounded inline-block">
                            Sizes: {item.sizeBreakdown}
                          </div>
                        )}
                        {item.fabricDetails && (
                          <p className="mt-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                            Fabric specs: {item.fabricDetails}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-zinc-500">{item.category || 'General'}</TableCell>
                      <TableCell className="py-3 text-xs text-center font-bold">{item.quantity} pcs</TableCell>
                      <TableCell className="py-3 text-xs text-right font-semibold">{formatCurrency(item.unitRate)}</TableCell>
                      <TableCell className="py-3 text-xs text-right font-extrabold">{formatCurrency(item.totalPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Section 3: Materials Received & Sourcing */}
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> Fabric & Materials Sourcing
              </h4>
              <div className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                <p><span className="font-semibold text-zinc-500">Procured by:</span> {order.materialProvidedBy}</p>
                {order.materialCharges > 0 && <p><span className="font-semibold text-zinc-500">Material Cost Per Piece:</span> {formatCurrency(order.materialCharges)}</p>}
                <p><span className="font-semibold text-zinc-500">Delivery Schedule:</span> {order.deliverySchedule || 'As scheduled'}</p>
                {order.fabricProcurement && <p><span className="font-semibold text-zinc-500">Fabric Procurement details:</span> {order.fabricProcurement}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Materials Checklist Remarks
              </h4>
              <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed bg-zinc-50 dark:bg-zinc-950/30 p-2.5 rounded border border-zinc-150 dark:border-zinc-800 min-h-[60px] whitespace-pre-line">
                {order.materialReceivedDetails || 'No materials checklists recorded.'}
              </p>
            </div>
          </div>

          {/* Section 4: Cost Breakup & Financial details */}
          <div className="pt-6 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" /> Final Invoice Financials
            </h4>
            <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Items Subtotal</span>
                <span className="font-semibold">{formatCurrency(order.subtotalAmount)}</span>
              </div>
              {order.materialCharges > 0 && (
                <div className="flex justify-between text-zinc-500">
                  <span>Factory Raw Materials Cost</span>
                  <span className="font-semibold">{formatCurrency(order.materialCharges)}</span>
                </div>
              )}
              {order.shippingCharges > 0 && (
                <div className="flex justify-between text-zinc-500">
                  <span>Freight &amp; Courier Logistics</span>
                  <span className="font-semibold">{formatCurrency(order.shippingCharges)}</span>
                </div>
              )}
              {order.packingCharges > 0 && (
                <div className="flex justify-between text-zinc-500">
                  <span>Packing &amp; Private Branding Extras</span>
                  <span className="font-semibold">{formatCurrency(order.packingCharges)}</span>
                </div>
              )}
              {order.gstEnabled && (
                <div className="flex justify-between text-zinc-500 border-t border-zinc-200/40 dark:border-zinc-800/40 pt-1">
                  <span>GST Tax ({order.gstPercentage}%)</span>
                  <span className="font-semibold">{formatCurrency(order.gstAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-200/80 dark:border-zinc-800/80 pt-2 text-sm font-extrabold text-zinc-950 dark:text-zinc-50">
                <span>Grand Summary Total (INC taxes &amp; fees)</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between pt-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <span>Advance Deposit Paid</span>
                <span>{formatCurrency(order.advancePayment)}</span>
              </div>
              <div className="flex justify-between pt-0.5 border-t border-zinc-200/40 dark:border-zinc-800/40 font-bold text-zinc-800 dark:text-zinc-200">
                <span>Net Outstanding Balance Due</span>
                <span>{formatCurrency(order.remainingAmount)}</span>
              </div>
            </div>
            {order.packingBrandingNotes && (
              <div className="bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded border border-zinc-150 dark:border-zinc-800 text-xs text-zinc-500 italic">
                Packing Specifications: &ldquo;{order.packingBrandingNotes}&rdquo;
              </div>
            )}
          </div>

          {/* Section 5: Photo galleries */}
          {(referenceImages.length > 0 || materialImages.length > 0 || outputImages.length > 0) && (
            <div className="pt-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" /> Production Imagery Galleries
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Design Reference */}
                {referenceImages.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Design Sketches ({referenceImages.length})</span>
                    <div className="grid grid-cols-3 gap-2">
                      {referenceImages.map((url, i) => (
                        <div 
                          key={i} 
                          className="aspect-square relative rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 overflow-hidden cursor-pointer hover:opacity-80 transition"
                          onClick={() => setActiveImage(url)}
                        >
                          <img src={url} alt={`Sketch ${i}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw Material Received */}
                {materialImages.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Raw Fabric Stock ({materialImages.length})</span>
                    <div className="grid grid-cols-3 gap-2">
                      {materialImages.map((url, i) => (
                        <div 
                          key={i} 
                          className="aspect-square relative rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 overflow-hidden cursor-pointer hover:opacity-80 transition"
                          onClick={() => setActiveImage(url)}
                        >
                          <img src={url} alt={`Fabric ${i}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stitched Output */}
                {outputImages.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Stitched Output ({outputImages.length})</span>
                    <div className="grid grid-cols-3 gap-2">
                      {outputImages.map((url, i) => (
                        <div 
                          key={i} 
                          className="aspect-square relative rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 overflow-hidden cursor-pointer hover:opacity-80 transition"
                          onClick={() => setActiveImage(url)}
                        >
                          <img src={url} alt={`Output ${i}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 6: IP agreements & Signatures */}
          <div className="pt-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Legal & Signature Agreement
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl text-xs">
              <div className="space-y-1">
                <p className="font-semibold text-zinc-400">CLIENT SIGNATURE DETAILS</p>
                <p><span className="font-medium text-zinc-500">Signatory:</span> {order.agreement?.clientSignatoryName || order.client?.name}</p>
                <p><span className="font-medium text-zinc-555">Designation:</span> {order.agreement?.clientDesignation || 'Client'}</p>
                <p><span className="font-medium text-zinc-500">Signed Date:</span> {order.agreement?.clientSignedDate || 'Awaiting Sign'}</p>
                {order.clientInitials && <p><span className="font-medium text-zinc-500">Client Initials:</span> {order.clientInitials}</p>}
                {order.agreement?.clientSignature && (
                  <div className="mt-2 border border-zinc-200 dark:border-zinc-850 p-2 bg-white dark:bg-zinc-900 rounded max-w-[200px] h-12 flex items-center justify-center font-playfair font-black text-sm italic tracking-widest text-zinc-700 dark:text-zinc-250 select-none">
                    {order.agreement.clientSignature}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-zinc-400">WITNESS / OTHER DETAILS</p>
                {order.agreement?.witnessName ? (
                  <>
                    <p><span className="font-medium text-zinc-500">Witness:</span> {order.agreement.witnessName}</p>
                    <p><span className="font-medium text-zinc-500">Mobile:</span> {order.agreement.witnessMobile || '—'}</p>
                    <p><span className="font-medium text-zinc-500">Witness Signed Date:</span> {order.agreement.witnessDate || '—'}</p>
                    {order.agreement?.witnessSignature && (
                      <div className="mt-2 border border-zinc-200 dark:border-zinc-850 p-2 bg-white dark:bg-zinc-900 rounded max-w-[200px] h-12 flex items-center justify-center font-playfair font-black text-sm italic tracking-widest text-zinc-700 dark:text-zinc-250 select-none">
                        {order.agreement.witnessSignature}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-zinc-400 italic">No witness signed for this agreement.</p>
                )}
              </div>
            </div>

            {/* Document Print & Download Package */}
            <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-500" /> Print Documents & Legal Records
              </h4>
              <div className={`grid grid-cols-1 ${sizeChartEnabled ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
                <button
                  onClick={handlePrintInvoice}
                  className="flex items-center justify-center gap-2 p-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>{order.invoice?.invoicePdfBucketUrl ? 'Download Tax Invoice' : 'Print Tax Invoice'}</span>
                </button>

                <button
                  onClick={handlePrintAgreement}
                  className="flex items-center justify-center gap-2 p-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span>{order.agreement?.agreementPdfBucketUrl ? 'View Agreement PDF' : 'Print Agreement'}</span>
                </button>

                {sizeChartEnabled && (
                  <button
                    onClick={handlePrintSizeChart}
                    className="flex items-center justify-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4 shrink-0" />
                    <span>Print Size Chart</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-150 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-950/30">
          <div className="flex items-center gap-2">
            <Button onClick={handlePrintInvoice} variant="outline" size="sm" className="h-8 text-xs font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50">
              <FileText className="w-3.5 h-3.5 mr-1" /> Invoice
            </Button>
            <Button onClick={handlePrintAgreement} variant="outline" size="sm" className="h-8 text-xs font-bold text-emerald-600 border-emerald-200 hover:bg-emerald-50">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Agreement
            </Button>
            {sizeChartEnabled && (
              <Button onClick={handlePrintSizeChart} variant="outline" size="sm" className="h-8 text-xs font-bold text-purple-600 border-purple-200 hover:bg-purple-50">
                <Printer className="w-3.5 h-3.5 mr-1" /> Size Chart
              </Button>
            )}
            {order.isDeleted ? (
              onRestore && (
                <Button
                  onClick={() => onRestore(order)}
                  size="sm"
                  className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore Order
                </Button>
              )
            ) : (
              onDelete && (
                <Button
                  onClick={() => onDelete(order)}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Order
                </Button>
              )
            )}
          </div>
          <Button onClick={onClose} className="px-5 font-bold text-xs bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
            Close Job sheet
          </Button>
        </div>

        {/* Expandable Image Modal overlay */}
        {activeImage && (
          <div 
            className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setActiveImage(null)}
          >
            <div className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center bg-zinc-950 rounded-xl overflow-hidden p-2">
              <img src={activeImage} alt="Expanded preview" className="max-w-full max-h-[80vh] object-contain" />
              <button 
                onClick={() => setActiveImage(null)} 
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
