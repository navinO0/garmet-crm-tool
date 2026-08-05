"use client";

import React from 'react';
import { FileText, Lock, CheckCircle2, ShieldCheck, PenTool, Printer, ExternalLink, HardDrive, Calculator, ScrollText, Ruler } from 'lucide-react';
import { generateInvoiceHTML, generateAgreementHTML, generateSizeChartHTML } from '@/lib/documentGenerator';
import { ClientData } from '@/components/bulk/ClientForm';
import { BulkOrderFormData } from '@/components/bulk/BulkOrderForm';
import { useProductionStore } from '@/store/productionStore';

export interface AgreementData {
  clientSignatoryName: string;
  clientDesignation: string;
  clientSignature: string; // Base64 or typed digital signature representation
  witnessName: string;
  witnessMobile: string;
  witnessSignature: string;
  clientInitials: string;
  labelInitials: string;
  ipAccepted: boolean;
  termsAccepted: boolean;
}

interface AgreementSignatureSectionProps {
  data: AgreementData;
  clientNameDefault: string;
  clientData?: ClientData;
  orderData?: BulkOrderFormData;
  onChange: (updated: Partial<AgreementData>) => void;
}

export const AgreementSignatureSection: React.FC<AgreementSignatureSectionProps> = ({
  data,
  clientNameDefault,
  clientData,
  orderData,
  onChange,
}) => {
  const { settings } = useProductionStore();

  // Common calculation helper
  const getDocumentData = () => {
    const items = (orderData?.items || []).map((item) => {
      const totalPrice = (Number(item.quantity) || 0) * (Number(item.unitRate) || 0);
      return {
        itemDescription: item.itemDescription || 'Garment Item',
        category: item.category,
        quantity: Number(item.quantity) || 1,
        unitRate: Number(item.unitRate) || 0,
        totalPrice,
        sizeBreakdown: item.sizeBreakdown,
        fabricDetails: item.fabricDetails || (item.materialsList && item.materialsList.length > 0 ? item.materialsList.map((m: any) => `${m.quantityPerPc || m.quantity || ''} ${m.unit || ''} ${m.name || m.material || ''}`).join(', ') : undefined),
        customPriceFields: item.customPriceFields,
      };
    });

    const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
    const materialTotal = orderData?.materialProvidedBy === 'Company' ? (Number(orderData?.materialCharges) || 0) * totalUnits : 0;
    const shippingCharges = Number(orderData?.shippingCharges) || 0;
    const packingCharges = Number(orderData?.packingCharges) || 0;
    const grossTotal = subtotal + materialTotal + shippingCharges + packingCharges;

    const discountType = orderData?.discountType || 'fixed';
    let discountValue = 0;
    if (discountType === 'percentage') {
      discountValue = ((subtotal + materialTotal) * (Number(orderData?.discountPercentage) || 0)) / 100;
    } else {
      discountValue = Number(orderData?.discountAmount) || 0;
    }

    const taxableSubtotal = Math.max(0, grossTotal - discountValue);
    const calculatedGst = orderData?.gstEnabled ? (taxableSubtotal * (Number(orderData?.gstPercentage) || 0)) / 100 : 0;
    const totalAmount = taxableSubtotal + calculatedGst;

    const advanceType = orderData?.advanceType || 'percentage';
    const advancePercentage = orderData?.advancePercentage !== undefined ? orderData.advancePercentage : 50;

    let advancePaid = 0;
    if (advanceType === 'percentage') {
      advancePaid = (totalAmount * advancePercentage) / 100;
    } else {
      advancePaid = orderData?.advanceCustomAmount !== undefined ? orderData.advanceCustomAmount : Math.round(totalAmount * 0.5);
    }

    const balanceDue = Math.max(0, totalAmount - advancePaid);

    const currentDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    let paymentTerms = 'Payment Terms: 50% Advance';
    if (advanceType === 'percentage') {
      paymentTerms = `Payment Terms: ${advancePercentage}% Advance`;
    } else {
      paymentTerms = `Payment Terms: ₹${advancePaid.toLocaleString('en-IN')} Advance`;
    }

    return {
      items,
      subtotal,
      shippingCharges,
      packingCharges,
      discountValue,
      discountType,
      totalAmount,
      advancePaid,
      balanceDue,
      advancePercentage,
      advanceType,
      currentDate,
      paymentTerms,
      materialProvidedBy: orderData?.materialProvidedBy,
      materialCharges: Number(orderData?.materialCharges) || 0,
      materialReceivedDetails: orderData?.materialReceivedDetails,
    };
  };

  // Document 1: Print Estimated Cost Invoice
  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const doc = getDocumentData();
    const invoiceHtml = generateInvoiceHTML({
      invoiceNumber: `EST-${Date.now().toString().slice(-6)}`,
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      clientName: clientData?.clientName || clientNameDefault || 'Client',
      businessName: clientData?.businessName,
      mobileNumber: clientData?.mobileNumber || '',
      email: clientData?.email,
      address: clientData?.address,
      paymentTerms: doc.paymentTerms,
      items: doc.items,
      materialProvidedBy: doc.materialProvidedBy,
      materialCharges: doc.materialCharges,
      materialReceivedDetails: doc.materialReceivedDetails,
      subtotal: doc.subtotal,
      shippingCharges: doc.shippingCharges,
      packingCharges: doc.packingCharges,
      discountAmount: doc.discountValue,
      totalAmount: doc.totalAmount,
      advancePaid: doc.advancePaid,
      balanceDue: doc.balanceDue,
      invoiceDate: doc.currentDate,
    });

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Estimated_Cost_Invoice_${clientData?.clientName || 'Draft'}</title>
        </head>
        <body style="margin: 0; padding: 0; background: #fff;">
          ${invoiceHtml}
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(fullHtml);
    printWindow.document.close();
  };

  // Document 2: Print Terms & Manufacturing Agreement
  const handlePrintAgreement = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const doc = getDocumentData();
    const agreementHtml = generateAgreementHTML({
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      clientName: clientData?.clientName || clientNameDefault || 'Client',
      businessName: clientData?.businessName,
      mobileNumber: clientData?.mobileNumber || '',
      email: clientData?.email,
      address: clientData?.address,
      date: doc.currentDate,
      clientSignatoryName: data.clientSignatoryName || clientData?.clientName || clientNameDefault || 'Client Signatory',
      clientDesignation: data.clientDesignation || 'Proprietor',
      clientSignature: data.clientSignature || '',
      clientSignedDate: doc.currentDate,
      companySignatoryName: settings.companySignatoryName || 'RAADHE LABEL part of RADHE VASTRAZ',
      companyDesignation: settings.companyDesignation || 'Authorized Signatory & Managing Director',
      companySignature: settings.companySignature || 'Digitally Signed by RAADHE LABEL',
      companySignedDate: doc.currentDate,
      witnessName: data.witnessName,
      witnessMobile: data.witnessMobile,
      witnessSignature: data.witnessSignature,
      witnessDate: doc.currentDate,
      clientInitials: data.clientInitials || 'RS',
      labelInitials: data.labelInitials || 'RL',
    });

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Manufacturing_Agreement_${clientData?.clientName || 'Draft'}</title>
        </head>
        <body style="margin: 0; padding: 0; background: #fff;">
          ${agreementHtml}
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(fullHtml);
    printWindow.document.close();
  };

  // Combined Print Option: Single PDF with Invoice, Agreement & Size Chart
  const handlePrintCombined = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const doc = getDocumentData();
    const orderRef = `ORD-${Date.now().toString().slice(-6)}`;

    const invoiceHtml = generateInvoiceHTML({
      invoiceNumber: `EST-${Date.now().toString().slice(-6)}`,
      orderNumber: orderRef,
      clientName: clientData?.clientName || clientNameDefault || 'Client',
      businessName: clientData?.businessName,
      mobileNumber: clientData?.mobileNumber || '',
      email: clientData?.email,
      address: clientData?.address,
      paymentTerms: doc.paymentTerms,
      items: doc.items,
      materialProvidedBy: doc.materialProvidedBy,
      materialCharges: doc.materialCharges,
      materialReceivedDetails: doc.materialReceivedDetails,
      subtotal: doc.subtotal,
      shippingCharges: doc.shippingCharges,
      packingCharges: doc.packingCharges,
      discountAmount: doc.discountValue,
      totalAmount: doc.totalAmount,
      advancePaid: doc.advancePaid,
      balanceDue: doc.balanceDue,
      invoiceDate: doc.currentDate,
    });

    const agreementHtml = generateAgreementHTML({
      orderNumber: orderRef,
      clientName: clientData?.clientName || clientNameDefault || 'Client',
      businessName: clientData?.businessName,
      mobileNumber: clientData?.mobileNumber || '',
      email: clientData?.email,
      address: clientData?.address,
      date: doc.currentDate,
      clientSignatoryName: data.clientSignatoryName || clientData?.clientName || clientNameDefault || 'Client Signatory',
      clientDesignation: data.clientDesignation || 'Proprietor',
      clientSignature: data.clientSignature || '',
      clientSignedDate: doc.currentDate,
      companySignatoryName: settings.companySignatoryName || 'RAADHE LABEL part of RADHE VASTRAZ',
      companyDesignation: settings.companyDesignation || 'Authorized Signatory & Managing Director',
      companySignature: settings.companySignature || 'Digitally Signed by RAADHE LABEL',
      companySignedDate: doc.currentDate,
      witnessName: data.witnessName,
      witnessMobile: data.witnessMobile,
      witnessSignature: data.witnessSignature,
      witnessDate: doc.currentDate,
      clientInitials: data.clientInitials || 'RS',
      labelInitials: data.labelInitials || 'RL',
    });

    const sizeChartHtml = generateSizeChartHTML({
      orderNumber: orderRef,
      clientName: clientData?.clientName || clientNameDefault || 'Client',
      businessName: clientData?.businessName,
      mobileNumber: clientData?.mobileNumber || '',
      email: clientData?.email,
      date: doc.currentDate,
      items: doc.items,
    });

    const combinedHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Complete_Order_Package_${clientData?.clientName || 'Draft'}</title>
          <style>
            * { box-sizing: border-box !important; }
            @media print {
              .page-break { page-break-before: always; break-before: page; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background: #fff;">
          ${invoiceHtml}
          <div class="page-break" style="page-break-before: always; break-before: page;"></div>
          ${agreementHtml}
          <div class="page-break" style="page-break-before: always; break-before: page;"></div>
          ${sizeChartHtml}
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(combinedHtml);
    printWindow.document.close();
  };

  // Document 4: Print Size Chart Matrix
  const handlePrintSizeChart = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const doc = getDocumentData();
    const sizeChartHtml = generateSizeChartHTML({
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      clientName: clientData?.clientName || clientNameDefault || 'Client',
      businessName: clientData?.businessName,
      mobileNumber: clientData?.mobileNumber || '',
      email: clientData?.email,
      date: doc.currentDate,
      items: doc.items,
    });

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Size_Chart_Matrix_${clientData?.clientName || 'Draft'}</title>
        </head>
        <body style="margin: 0; padding: 0; background: #fff;">
          ${sizeChartHtml}
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(fullHtml);
    printWindow.document.close();
  };

  const docData = getDocumentData();

  return (
    <div className="bg-white dark:bg-zinc-900 p-3 sm:p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3 sm:space-y-5">
      {/* Section Header with Distinct Document Buttons */}
      <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
              RAADHE LABEL part of RADHE VASTRAZ
            </h3>
          </div>
          <p className="text-[11px] sm:text-xs font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">
            ORDER DOCUMENTS, ESTIMATES & LEGAL MANUFACTURING AGREEMENT
          </p>
        </div>

        {/* Action Buttons for Documents */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrintInvoice}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition shadow-sm"
            title="Print Official Estimated Cost Invoice & Price Quotation"
          >
            <Calculator className="w-3.5 h-3.5" />
            Print Estimated Cost Invoice
          </button>

          <button
            type="button"
            onClick={handlePrintAgreement}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold rounded-md transition shadow-sm"
            title="Print Official Manufacturing Terms & Signed Contract"
          >
            <ScrollText className="w-3.5 h-3.5" />
            Print Terms & Agreement
          </button>

          <button
            type="button"
            onClick={handlePrintSizeChart}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md transition shadow-sm"
            title="Print Standalone Size Breakdown & Ratio Chart"
          >
            <Ruler className="w-3.5 h-3.5" />
            Print Size Chart
          </button>

          <button
            type="button"
            onClick={handlePrintCombined}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-900 dark:text-zinc-100 text-xs font-medium rounded-md transition"
            title="Print Complete Package (All Documents)"
          >
            <Printer className="w-3.5 h-3.5" />
            Both
          </button>
        </div>
      </div>

      {/* Two Live Document Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Document 1 Card: Estimated Cost Invoice */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-md border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5 text-emerald-600" />
              1. Estimated Cost Invoice & Quotation
            </span>
            <button
              type="button"
              onClick={handlePrintInvoice}
              className="text-[10px] text-emerald-700 hover:underline font-semibold flex items-center gap-0.5"
            >
              <Printer className="w-3 h-3" /> Print
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400 text-[11px]">
              <span>Stitching Subtotal:</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">₹{docData.subtotal.toLocaleString('en-IN')}</span>
            </div>
            {docData.shippingCharges > 0 && (
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400 text-[11px]">
                <span>Shipping & Packing:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">₹{(docData.shippingCharges + docData.packingCharges).toLocaleString('en-IN')}</span>
              </div>
            )}
            {docData.discountValue > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold text-[11px]">
                <span>Applied Discount:</span>
                <span>- ₹{Math.round(docData.discountValue).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-zinc-200 dark:border-zinc-800 font-bold text-zinc-900 dark:text-zinc-100">
              <span>Grand Total Amount:</span>
              <span>₹{Math.round(docData.totalAmount).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Advance Required:</span>
              <span className="font-bold text-emerald-600">₹{Math.round(docData.advancePaid).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Document 2 Card: Manufacturing Terms & Agreement Contract */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-md border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1">
              <ScrollText className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              2. Terms & Manufacturing Agreement
            </span>
            <button
              type="button"
              onClick={handlePrintAgreement}
              className="text-[10px] text-zinc-700 dark:text-zinc-300 hover:underline font-semibold flex items-center gap-0.5"
            >
              <Printer className="w-3 h-3" /> Print
            </button>
          </div>

          <div className="space-y-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
            <div className="flex justify-between">
              <span>Client Signatory:</span>
              <strong className="text-zinc-900 dark:text-zinc-100">{data.clientSignatoryName || clientData?.clientName || clientNameDefault || 'Pending'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Digital Signature:</span>
              <strong className="text-zinc-500 italic">{data.clientSignature ? 'Signed ✓' : 'Optional (For Reference)'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Agreement Clauses:</span>
              <strong className="text-zinc-900 dark:text-zinc-100">15 Clauses Accepted</strong>
            </div>
            <div className="flex justify-between pt-1 border-t border-zinc-200 dark:border-zinc-800">
              <span>Client Initials:</span>
              <strong className="font-mono text-zinc-900 dark:text-zinc-100">{data.clientInitials || 'RS'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Conditions Scroll Box */}
      <div className="max-h-[200px] sm:max-h-[300px] overflow-y-auto bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-md text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-3">
        <div>
          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide text-xs mb-2">
            Agreement Clauses (1-15)
          </h4>
          <ol className="list-decimal pl-4 space-y-1.5">
            <li><strong>Fabric Procurement:</strong> Fabric selection and purchase shall be based on client&apos;s choice. Payment for fabric must be made directly by client to vendor.</li>
            <li><strong>Stitching Charges & Payment Terms:</strong> 50% advance payment required before production. Remaining 50% must be paid before dispatch.</li>
            <li><strong>Shipping:</strong> Shipping charges are separate according to weight and destination.</li>
            <li><strong>Packing & Branding:</strong> Packing charges paid with advance. Includes brand labels, covers, size tags.</li>
            <li><strong>GST:</strong> GST applicable as per government regulations if registered.</li>
            <li><strong>Additional Charges:</strong> Quotation covers agreed stitching. Trims, embroidery, or special finishing charged separately.</li>
            <li><strong>Production Timeline & Delivery:</strong> Estimated timelines communicated prior to order confirmation. Grace period up to 30 days allowed.</li>
            <li><strong>Cancellation Policy:</strong> Non-refundable after production starts.</li>
          </ol>
        </div>

        <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-md space-y-1">
          <h4 className="font-bold flex items-center gap-1 text-[11px] text-zinc-900 dark:text-zinc-100 uppercase">
            <Lock className="w-3.5 h-3.5 text-zinc-600" /> Design Confidentiality & IP
          </h4>
          <p className="text-[10px] text-zinc-600 dark:text-zinc-400">
            Designs and samples developed exclusively will not be shared without written permission. Client confirms ownership rights of submitted designs.
          </p>
        </div>
      </div>

      {/* Confirmation Checkboxes */}
      <div className="space-y-2 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-md border border-zinc-200 dark:border-zinc-800">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={data.termsAccepted}
            onChange={(e) => onChange({ termsAccepted: e.target.checked })}
            className="mt-0.5 w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-500"
          />
          <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
            I confirm acceptance of all terms & conditions for contract generation and invoicing.
          </span>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={data.ipAccepted}
            onChange={(e) => onChange({ ipAccepted: e.target.checked })}
            className="mt-0.5 w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-500"
          />
          <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
            I accept the Design Confidentiality & Intellectual Property policy.
          </span>
        </label>
      </div>

      {/* Signatures & Signatory Grid */}
      <div className="space-y-3 pt-1">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
          DIGITAL SIGNATURE FIELDS
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Company Signatory */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-md border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="block text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase">
              AUTHORIZED SIGNATORY (RAADHE LABEL)
            </span>
            <div>
              <label className="block text-[10px] text-zinc-500">Brand / Company</label>
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">RAADHE LABEL part of RADHE VASTRAZ</p>
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500">Designation</label>
              <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">Authorized Signatory & Director</p>
            </div>
            <div className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-center text-xs font-serif text-zinc-700 dark:text-zinc-300 italic">
              [ Digitally Stamped & Signed by RAADHE LABEL ]
            </div>
          </div>

          {/* Client Signatory Box with Live Signature Output */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-md border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="block text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase">
              CLIENT SIGNATORY *
            </span>
            <div>
              <label className="block text-[10px] font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">Signatory Name *</label>
              <input
                type="text"
                placeholder={clientNameDefault || 'e.g. Radhika Sharma'}
                value={data.clientSignatoryName}
                onChange={(e) => onChange({ clientSignatoryName: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">Designation</label>
              <input
                type="text"
                placeholder="e.g. Proprietor / Partner / Director"
                value={data.clientDesignation}
                onChange={(e) => onChange({ clientDesignation: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">Digital Signature / Legal Full Name (Optional for Reference)</label>
              <input
                type="text"
                placeholder="Type full legal name to sign digitally (Optional)"
                value={data.clientSignature}
                onChange={(e) => onChange({ clientSignature: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-serif italic text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Witness Box (Optional) */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-md border border-zinc-200 dark:border-zinc-800 space-y-2">
          <span className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase">
            WITNESS DETAILS (Optional)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-zinc-500 mb-0.5">Witness Name</label>
              <input
                type="text"
                placeholder="Witness Full Name"
                value={data.witnessName}
                onChange={(e) => onChange({ witnessName: e.target.value })}
                className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-0.5">Witness Mobile</label>
              <input
                type="tel"
                placeholder="+91 Mobile Number"
                value={data.witnessMobile}
                onChange={(e) => onChange({ witnessMobile: e.target.value })}
                className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-0.5">Witness Digital Signature</label>
              <input
                type="text"
                placeholder="Witness Signature"
                value={data.witnessSignature}
                onChange={(e) => onChange({ witnessSignature: e.target.value })}
                className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-serif italic text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        {/* Initials & Print Trigger Footer */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-[10px] font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">
              Client Initials (Each Page)
            </label>
            <input
              type="text"
              placeholder="e.g. RS"
              value={data.clientInitials}
              onChange={(e) => onChange({ clientInitials: e.target.value })}
              className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-mono uppercase text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">
              RAADHE LABEL Initials
            </label>
            <input
              type="text"
              placeholder="RL"
              value={data.labelInitials}
              onChange={(e) => onChange({ labelInitials: e.target.value })}
              className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-mono uppercase text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
