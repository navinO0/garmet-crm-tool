"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useProductionStore } from "@/store/productionStore";
import { StatusBadge, EmptyState } from "@/components/shared/ReusableComponents";
import { Order } from "@/types";
import { cn } from "@/lib/utils";
import {
  Printer,
  ChevronLeft,
  Search,
  FileText,
  DollarSign,
  Calendar,
  Building,
  Ruler,
} from "lucide-react";
import { generateSizeChartHTML, generateInvoiceHTML } from "@/lib/documentGenerator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function InvoicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { orders, customers, settings } = useProductionStore();

  const [searchQuery, setSearchQuery] = useState("");
  const orderId = searchParams.get("orderId");

  // Selected Order for Invoice view
  const invoiceOrder = useMemo(() => {
    if (!orderId) return null;
    return orders.find((o) => o.id === orderId) || null;
  }, [orders, orderId]);

  // Selected Customer for Invoice view
  const invoiceCustomer = useMemo(() => {
    if (!invoiceOrder) return null;
    return customers.find((c) => c.id === invoiceOrder.customerId) || null;
  }, [customers, invoiceOrder]);

  // Filtered list of invoices (all orders)
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        return (
          o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.customerName.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchQuery]);

  // Automatically set document.title to GarmentName_OrderNumber for PDF saving
  useEffect(() => {
    if (invoiceOrder) {
      const origTitle = document.title;
      const primaryGarment = invoiceOrder.products[0]?.product || invoiceOrder.measurements?.garmentType || "Garment";
      const sanitizedGarment = primaryGarment.replace(/[^a-zA-Z0-9\s_-]/g, "").trim().replace(/\s+/g, "_");
      const invoiceTitle = `${sanitizedGarment}_${invoiceOrder.orderNumber}`;
      
      document.title = invoiceTitle;

      return () => {
        document.title = origTitle;
      };
    }
  }, [invoiceOrder]);

  const handlePrint = () => {
    if (invoiceOrder) {
      const primaryGarment = invoiceOrder.products[0]?.product || invoiceOrder.measurements?.garmentType || "Garment";
      const sanitizedGarment = primaryGarment.replace(/[^a-zA-Z0-9\s_-]/g, "").trim().replace(/\s+/g, "_");
      document.title = `${sanitizedGarment}_${invoiceOrder.orderNumber}`;
    }
    window.print();
  };

  const formatCurrency = (val: number) => {
    return `${settings.currencySymbol}${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // If orderId is provided, show printable preview
  if (invoiceOrder) {
    const totalPaid = invoiceOrder.payments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = Math.max(0, invoiceOrder.estimate.total - totalPaid);

    const handlePrintSizeChart = () => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const sizeChartHtml = generateSizeChartHTML({
        orderNumber: invoiceOrder.orderNumber,
        clientName: invoiceOrder.customerName,
        businessName: invoiceCustomer?.company,
        mobileNumber: invoiceCustomer?.phone || '',
        email: invoiceCustomer?.email,
        date: new Date(invoiceOrder.createdAt).toLocaleDateString(),
        items: invoiceOrder.products.map((p) => ({
          itemDescription: p.product,
          category: p.stitchType,
          quantity: p.quantity,
          sizeBreakdown: (p as any).sizeBreakdown || (p as any).notes || 'Standard Sizing',
          fabricDetails: (p as any).fabricDetails,
        })),
      });

      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>Size_Chart_${invoiceOrder.orderNumber}</title></head>
          <body style="margin: 0; padding: 0; background: #fff;">
            ${sizeChartHtml}
            <script>window.onload = function() { window.print(); };</script>
          </body>
        </html>
      `;
      printWindow.document.write(fullHtml);
      printWindow.document.close();
    };

    const handlePrintAll = () => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const invoiceHtml = generateInvoiceHTML({
        invoiceNumber: `${settings.invoicePrefix}-${invoiceOrder.orderNumber}`,
        orderNumber: invoiceOrder.orderNumber,
        clientName: invoiceOrder.customerName,
        businessName: invoiceCustomer?.company,
        mobileNumber: invoiceCustomer?.phone || '',
        email: invoiceCustomer?.email,
        address: invoiceCustomer?.address || invoiceOrder.notes,
        paymentTerms: (invoiceOrder as any).advanceType === 'custom'
          ? `Payment Terms: ${formatCurrency((invoiceOrder as any).advanceCustomAmount || (invoiceOrder.estimate.total * 0.5))} Advance`
          : `Payment Terms: ${(invoiceOrder as any).advancePercentage || 50}% Advance`,
        items: invoiceOrder.products.map((p) => {
          let priceBreakup = undefined;
          let customPriceFields = undefined;
          if ((p as any).priceBreakupJson) {
            try {
              const parsed = JSON.parse((p as any).priceBreakupJson);
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
            itemDescription: p.product,
            category: p.stitchType,
            quantity: p.quantity,
            unitRate: p.price,
            totalPrice: p.price * p.quantity,
            fabricDetails: (p as any).fabricDetails || p.notes,
            sizeBreakdown: (p as any).sizeBreakdown,
            priceBreakup,
            customPriceFields,
          };
        }),
        materialProvidedBy: (invoiceOrder as any).materialProvidedBy,
        materialCharges: Number((invoiceOrder as any).materialCharges) || 0,
        materialReceivedDetails: (invoiceOrder as any).materialReceivedDetails,
        materials: invoiceOrder.materials,
        subtotal: invoiceOrder.estimate.stitching || invoiceOrder.estimate.subtotal || invoiceOrder.estimate.total,
        laborPrintingCharges: (invoiceOrder.estimate.embroidery || 0) + (invoiceOrder.estimate.printing || 0),
        shippingCharges: invoiceOrder.estimate.shipping || invoiceOrder.estimate.transport || 0,
        packingCharges: invoiceOrder.estimate.tax || invoiceOrder.estimate.packing || 0,
        gstAmount: invoiceOrder.estimate.gst || 0,
        discountAmount: invoiceOrder.estimate.discount || 0,
        totalAmount: invoiceOrder.estimate.total,
        advancePaid: totalPaid,
        balanceDue,
        invoiceDate: new Date(invoiceOrder.createdAt).toLocaleDateString(),
        isBoutique: !!invoiceOrder.measurements && (!!invoiceOrder.measurements.chest || !!invoiceOrder.measurements.waist || !!invoiceOrder.measurements.standardSize),
        sizeChartEnabled: (settings as any).sizeChartEnabled || false,
      });

      const sizeChartHtml = generateSizeChartHTML({
        orderNumber: invoiceOrder.orderNumber,
        clientName: invoiceOrder.customerName,
        businessName: invoiceCustomer?.company,
        mobileNumber: invoiceCustomer?.phone || '',
        email: invoiceCustomer?.email,
        date: new Date(invoiceOrder.createdAt).toLocaleDateString(),
        items: invoiceOrder.products.map((p) => ({
          itemDescription: p.product,
          category: p.stitchType,
          quantity: p.quantity,
          sizeBreakdown: (p as any).sizeBreakdown || (p as any).notes || 'Standard Sizing',
          fabricDetails: (p as any).fabricDetails,
        })),
      });

      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Package_${invoiceOrder.orderNumber}</title>
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
            ${sizeChartHtml}
            <script>window.onload = function() { window.print(); };</script>
          </body>
        </html>
      `;

      printWindow.document.write(fullHtml);
      printWindow.document.close();
    };

    return (
      <div className="space-y-6">
        {/* Style tag to override layouts for printing */}
        <style dangerouslySetInnerHTML={{ __html: `
          * {
            box-sizing: border-box !important;
          }
          @media print {
            header, nav, aside, footer, button, .print-hide {
              display: none !important;
            }
            main, body, html {
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
            }
            .print-card {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
              overflow: hidden !important;
            }
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
          }
        ` }} />

        {/* Invoice Action Bar */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 print-hide">
          <Button variant="ghost" size="sm" onClick={() => router.replace("/invoices")} className="font-semibold text-xs">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Invoices
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrintSizeChart} className="font-semibold text-xs cursor-pointer">
              <Ruler className="mr-2 h-4 w-4 text-indigo-600" /> Print Size Chart
            </Button>
            <Button variant="outline" onClick={handlePrint} className="font-semibold text-xs cursor-pointer">
              <Printer className="mr-2 h-4 w-4" /> Print Invoice
            </Button>
            <Button onClick={handlePrintAll} className="font-semibold text-xs cursor-pointer bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900">
              <Printer className="mr-2 h-4 w-4" /> Print All (Single PDF)
            </Button>
          </div>
        </div>

        {/* Invoice Container */}
        <Card className="max-w-3xl mx-auto bg-white border border-zinc-200 shadow-xs p-5 sm:p-8 print-card dark:text-zinc-900">
          <div className="space-y-4">
            {/* Header: Company Info and Logo placeholder */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 bg-amber-500 text-zinc-950 rounded flex items-center justify-center font-extrabold text-xs shadow-xs">R</div>
                  <h1 className="text-lg font-extrabold tracking-tight text-zinc-900">{settings.companyName}</h1>
                </div>
                <p className="text-[11px] text-zinc-500 font-medium leading-tight max-w-xs">{settings.address}</p>
                <p className="text-[10px] text-zinc-400 font-medium">Email: {settings.email} | Tel: {settings.phone}</p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Tax Invoice</span>
                <p className="text-xl font-extrabold tracking-tight text-zinc-950 mt-0.5">
                  #{settings.invoicePrefix}-{invoiceOrder.orderNumber}
                </p>
                <div className="mt-1 text-[11px] text-zinc-500 space-y-0.5 leading-tight">
                  <p>Date: {new Date(invoiceOrder.createdAt).toLocaleDateString()}</p>
                  <p>Delivery Target: {invoiceOrder.deliveryDate}</p>
                </div>
              </div>
            </div>

            {/* Bill To: Customer Profile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs leading-tight">
              <div>
                <h3 className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1">Billed To:</h3>
                <p className="font-bold text-xs text-zinc-900">{invoiceOrder.customerName}</p>
                {invoiceCustomer?.company && <p className="text-zinc-500 font-medium mt-0.5 text-[11px]">{invoiceCustomer.company}</p>}
                <p className="text-zinc-600 mt-0.5 max-w-xs text-[11px]">{invoiceCustomer?.address || invoiceOrder.notes}</p>
              </div>
              <div className="sm:text-right">
                <h3 className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1">Contact Details:</h3>
                <p className="text-zinc-600 text-[11px]">Email: {invoiceCustomer?.email}</p>
                <p className="text-zinc-600 mt-0.5 text-[11px]">Phone: {invoiceCustomer?.phone}</p>
                <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-700 mt-1.5 border border-indigo-100">
                  {(invoiceOrder as any).advanceType === 'custom'
                    ? `Payment Terms: ${formatCurrency((invoiceOrder as any).advanceCustomAmount || (invoiceOrder.estimate.total * 0.5))} Advance`
                    : `Payment Terms: ${(invoiceOrder as any).advancePercentage || 50}% Advance`}
                </span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="border border-zinc-200 rounded-md overflow-hidden text-xs">
              <Table>
                <TableHeader className="bg-zinc-50">
                  <TableRow>
                    <TableHead className="font-bold text-zinc-600 py-1.5 text-[11px]">Garment Item Specification</TableHead>
                    <TableHead className="font-bold text-zinc-600 py-1.5 text-[11px]">Type</TableHead>
                    <TableHead className="font-bold text-zinc-600 py-1.5 text-center text-[11px]">Qty</TableHead>
                    <TableHead className="font-bold text-zinc-600 py-1.5 text-right text-[11px]">Unit Price</TableHead>
                    <TableHead className="font-bold text-zinc-600 py-1.5 text-right text-[11px]">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-zinc-700">
                  {invoiceOrder.products.map((p, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="py-2 font-semibold text-zinc-950">
                        {p.product}
                        {(() => {
                          const itemQty = Number(p.quantity) || 1;
                          let fabText = (p as any).fabricDetails || p.notes || '';
                          const mList = (p as any).materialsList || (p as any).materials;
                          if (Array.isArray(mList) && mList.length > 0) {
                            fabText = mList.map((m: any) => {
                              const perPc = Number(m.quantityPerPc || m.quantity) || 0;
                              const total = perPc * itemQty;
                              const unit = m.unit || 'm';
                              const name = m.name || m.material || 'Material';
                              return perPc > 0
                                ? `${total} ${unit} ${name} (${perPc}${unit}/pc × ${itemQty} pcs)`
                                : `${name}`;
                            }).join(' | ');
                          } else if (fabText && !fabText.toLowerCase().includes('total') && itemQty > 1) {
                            fabText = `${fabText} (Total Sum for ${itemQty} pcs)`;
                          }

                          if (!fabText) return null;

                          return (
                            <p className="text-[10px] text-zinc-500 font-normal mt-0.5">
                              <strong className="text-zinc-700 font-semibold">Total Material Required:</strong> {fabText}
                            </p>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="py-2">{p.stitchType}</TableCell>
                      <TableCell className="py-2 text-center font-medium">{p.quantity}</TableCell>
                      <TableCell className="py-2 text-right">{formatCurrency(p.price)}</TableCell>
                      <TableCell className="py-2 text-right font-bold text-zinc-950">
                        {formatCurrency(p.price * p.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Garment Production Material Specifications Table */}
            {((invoiceOrder.materials && invoiceOrder.materials.length > 0) || (invoiceOrder as any).materialReceivedDetails || (invoiceOrder as any).materialProvidedBy) && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider text-[10px]">
                    Garment Production Material & Fabric Details:
                  </h3>
                  {(invoiceOrder as any).materialProvidedBy && (
                    <span className="text-[10px] font-medium text-zinc-500">
                      Supply Source: <strong className="text-zinc-800">{(invoiceOrder as any).materialProvidedBy}</strong>
                    </span>
                  )}
                </div>

                {invoiceOrder.materials && invoiceOrder.materials.length > 0 && (
                  <div className="border border-zinc-200 rounded-md overflow-hidden text-xs">
                    <Table>
                      <TableHeader className="bg-zinc-50">
                        <TableRow>
                          <TableHead className="font-bold text-zinc-600 py-1.5 text-[10px]">Material Name</TableHead>
                          <TableHead className="font-bold text-zinc-600 py-1.5 text-[10px]">Color / Dye</TableHead>
                          <TableHead className="font-bold text-zinc-600 py-1.5 text-[10px]">Garment Category</TableHead>
                          <TableHead className="font-bold text-zinc-600 py-1.5 text-center text-[10px]">Quantity</TableHead>
                          {invoiceOrder.materials.some((m) => m.price && Number(m.price) > 0) && (
                            <TableHead className="font-bold text-zinc-600 py-1.5 text-right text-[10px]">Material Price</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-zinc-700">
                        {invoiceOrder.materials.map((m, idx) => {
                          const hasPrice = m.price && Number(m.price) > 0;
                          const category = m.customCategory || m.estimateCategory || "-";
                          return (
                            <TableRow key={m.id || idx}>
                              <TableCell className="py-1.5 font-semibold text-zinc-950">
                                {m.material || "Fabric"}
                                {m.notes && <p className="text-[10px] text-zinc-400 font-normal mt-0.5">{m.notes}</p>}
                              </TableCell>
                              <TableCell className="py-1.5">{m.color || "-"}</TableCell>
                              <TableCell className="py-1.5">{category}</TableCell>
                              <TableCell className="py-1.5 text-center">{m.quantity} {m.unit}</TableCell>
                              {invoiceOrder.materials.some((mat) => mat.price && Number(mat.price) > 0) && (
                                <TableCell className="py-1.5 text-right font-bold text-zinc-950">
                                  {hasPrice ? formatCurrency(Number(m.price)) : "-"}
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {(invoiceOrder as any).materialReceivedDetails && (
                  <p className="text-[10px] text-zinc-500 bg-zinc-50 p-1.5 rounded border border-zinc-150 italic leading-snug">
                    <strong className="not-italic text-zinc-700">Material Received Log:</strong> {(invoiceOrder as any).materialReceivedDetails}
                  </p>
                )}
              </div>
            )}

            {/* Cost and Invoice calculation summaries */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 text-xs leading-snug">
              {/* Payment history listing inside invoice */}
              <div className="w-full sm:max-w-xs space-y-2">
                <h3 className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">Deposits / Payments:</h3>
                {invoiceOrder.payments.length === 0 ? (
                  <p className="text-[10px] text-zinc-400 italic">No payment receipts logged against this invoice.</p>
                ) : (
                  <div className="border border-zinc-200 rounded overflow-hidden">
                    <table className="w-full text-[10px] text-left">
                      <thead>
                        <tr className="bg-zinc-50 text-zinc-500 font-semibold uppercase tracking-wider border-b border-zinc-200">
                          <th className="p-1.5">Date</th>
                          <th className="p-1.5">Method</th>
                          <th className="p-1.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-150 text-zinc-600">
                        {invoiceOrder.payments.map((p) => (
                          <tr key={p.id}>
                            <td className="p-1.5">{new Date(p.date).toLocaleDateString()}</td>
                            <td className="p-1.5 font-medium">{p.method}</td>
                            <td className="p-1.5 text-right font-bold text-emerald-700">+{formatCurrency(p.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Estimate Calculations */}
              <div className="w-full sm:max-w-xs space-y-1 border-t sm:border-t-0 border-zinc-200 pt-3 sm:pt-0 self-end text-xs">
                <div className="flex justify-between py-0.5">
                  <span className="text-zinc-500">Stitching charges</span>
                  <span className="font-semibold text-zinc-900">{formatCurrency(invoiceOrder.estimate.stitching || 0)}</span>
                </div>
                {(() => {
                  const totalMaterialCost = (invoiceOrder.materials || []).reduce((sum, m) => sum + (m.price && Number(m.price) > 0 ? Number(m.price) : 0), 0);
                  if (totalMaterialCost <= 0) return null;
                  return (
                    <div className="flex justify-between py-0.5">
                      <span className="text-zinc-500">Fabric & Material Charges</span>
                      <span className="font-semibold text-zinc-900">{formatCurrency(totalMaterialCost)}</span>
                    </div>
                  );
                })()}
                {(invoiceOrder.estimate.embroidery || 0) > 0 && (
                  <div className="flex justify-between py-0.5">
                    <span className="text-zinc-500">Embroidery work</span>
                    <span className="font-semibold text-zinc-900">{formatCurrency(invoiceOrder.estimate.embroidery || 0)}</span>
                  </div>
                )}
                {(invoiceOrder.estimate.printing || 0) > 0 && (
                  <div className="flex justify-between py-0.5">
                    <span className="text-zinc-500">Printing fee</span>
                    <span className="font-semibold text-zinc-900">{formatCurrency(invoiceOrder.estimate.printing || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between py-0.5">
                  <span className="text-zinc-500">Logistic Delivery fee</span>
                  <span className="font-semibold text-zinc-900">
                    {formatCurrency((invoiceOrder.estimate.transport || 0) + (invoiceOrder.estimate.packing || 0))}
                  </span>
                </div>
                {(invoiceOrder.estimate.discount || 0) > 0 && (
                  <div className="flex justify-between py-0.5 text-red-600">
                    <span>Promo Discount</span>
                    <span className="font-semibold">-{formatCurrency(invoiceOrder.estimate.discount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-zinc-150 pt-1">
                  <span className="text-zinc-500">GST ({settings.gstRate}%)</span>
                  <span className="font-semibold text-zinc-900">{formatCurrency(invoiceOrder.estimate.gst || 0)}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-900 pt-1 font-extrabold text-zinc-950 text-sm">
                  <span>Total Order Amount</span>
                  <span>{formatCurrency(invoiceOrder.estimate.total)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 py-0.5 font-medium">
                  <span>Advance Paid / Required</span>
                  <span>-{formatCurrency(totalPaid)}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-1 font-extrabold text-zinc-950 bg-zinc-50 p-2 rounded text-xs">
                  <span>Balance Due before Dispatch</span>
                  <span className={balanceDue > 0 ? "text-red-600 font-extrabold" : "text-emerald-700 font-extrabold"}>
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-200 pt-3 text-center text-[10px] text-zinc-400 leading-tight">
              <p className="font-semibold text-zinc-500">Thank you for doing business with {settings.companyName}!</p>
              <p className="mt-0.5">Invoice generated from Atelier production logs. Subject to standard tailoring terms.</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Otherwise, render list of all invoices
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Invoices</h1>
          <p className="text-sm text-zinc-500 mt-1">Review billings, balance sheets, and output print copies.</p>
        </div>
      </div>

      {/* Control bar: Search */}
      <div className="flex items-center space-x-3 bg-white dark:bg-zinc-900 p-4 rounded-md border border-zinc-200 dark:border-zinc-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search invoices by client name or order number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus-visible:bg-white text-sm"
          />
        </div>
      </div>

      {/* Invoice list */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          title="No Invoices Found"
          description={searchQuery ? "Try refining your search terms." : "Create an order first to generate an invoice."}
        />
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-zinc-500">Invoice ID</TableHead>
                  <TableHead className="font-bold text-zinc-500">Client Profile</TableHead>
                  <TableHead className="font-bold text-zinc-500">Invoice Date</TableHead>
                  <TableHead className="font-bold text-zinc-500">Total Billed</TableHead>
                  <TableHead className="font-bold text-zinc-500">Payment Status</TableHead>
                  <TableHead className="font-bold text-zinc-500 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  return (
                    <TableRow key={order.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                      <TableCell className="font-bold text-zinc-900 dark:text-zinc-100">
                        #{settings.invoicePrefix}-{order.orderNumber}
                      </TableCell>
                      <TableCell className="font-semibold text-zinc-700 dark:text-zinc-350">{order.customerName}</TableCell>
                      <TableCell className="text-zinc-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-bold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(order.estimate.total)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.paymentStatus} type="payment" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/invoices?orderId=${order.id}`)}
                          className="h-8 text-xs font-semibold"
                        >
                          <Printer className="mr-1.5 h-3.5 w-3.5" /> View / Print
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile view */}
          <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => router.push(`/invoices?orderId=${order.id}`)}
                className="p-4 space-y-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-mono font-semibold">#{settings.invoicePrefix}-{order.orderNumber}</span>
                    <h4 className="font-bold text-sm text-zinc-950 dark:text-zinc-100 mt-0.5">{order.customerName}</h4>
                  </div>
                  <span className="font-bold text-sm text-zinc-950 dark:text-zinc-100">
                    {formatCurrency(order.estimate.total)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60">
                  <span className="flex items-center text-zinc-400"><Calendar className="h-3 w-3 mr-1 text-zinc-400" /> {new Date(order.createdAt).toLocaleDateString()}</span>
                  <StatusBadge status={order.paymentStatus} type="payment" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Invoices() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="h-10 w-44 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
        <div className="h-16 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
        <div className="h-80 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
      </div>
    }>
      <InvoicesContent />
    </Suspense>
  );
}
