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
} from "lucide-react";
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

    return (
      <div className="space-y-6">
        {/* Style tag to override layouts for printing */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            header, nav, aside, footer, button, .print-hide {
              display: none !important;
            }
            main, body, html {
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .print-card {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
            }
          }
        ` }} />

        {/* Invoice Action Bar */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 print-hide">
          <Button variant="ghost" size="sm" onClick={() => router.replace("/invoices")} className="font-semibold text-xs">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Invoices
          </Button>
          <Button onClick={handlePrint} className="font-semibold text-xs cursor-pointer">
            <Printer className="mr-2 h-4 w-4" /> Print Invoice / PDF
          </Button>
        </div>

        {/* Invoice Container */}
        <Card className="max-w-3xl mx-auto bg-white border border-zinc-200 shadow-sm p-8 sm:p-12 print-card dark:text-zinc-900">
          <div className="space-y-8">
            {/* Header: Company Info and Logo placeholder */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-zinc-150 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-amber-500 text-zinc-950 rounded flex items-center justify-center font-extrabold text-sm shadow-xs">R</div>
                  <h1 className="text-xl font-extrabold tracking-tight text-zinc-900">{settings.companyName}</h1>
                </div>
                <p className="text-xs text-zinc-455 font-medium leading-relaxed max-w-xs">{settings.address}</p>
                <p className="text-[10px] text-zinc-400 font-medium">Email: {settings.email} | Tel: {settings.phone}</p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Tax Invoice</span>
                <p className="text-2xl font-extrabold tracking-tight text-zinc-950 mt-1">
                  #{settings.invoicePrefix}-{invoiceOrder.orderNumber}
                </p>
                <div className="mt-2 text-xs text-zinc-500 space-y-0.5">
                  <p>Date: {new Date(invoiceOrder.createdAt).toLocaleDateString()}</p>
                  <p>Delivery Target: {invoiceOrder.deliveryDate}</p>
                </div>
              </div>
            </div>

            {/* Bill To: Customer Profile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs leading-normal">
              <div>
                <h3 className="font-bold text-zinc-400 uppercase tracking-wider mb-2">Billed To:</h3>
                <p className="font-bold text-sm text-zinc-900">{invoiceOrder.customerName}</p>
                {invoiceCustomer?.company && <p className="text-zinc-500 font-medium mt-0.5">{invoiceCustomer.company}</p>}
                <p className="text-zinc-555 mt-1 max-w-xs">{invoiceCustomer?.address || invoiceOrder.notes}</p>
              </div>
              <div className="sm:text-right">
                <h3 className="font-bold text-zinc-400 uppercase tracking-wider mb-2">Contact Details:</h3>
                <p className="text-zinc-600">Email: {invoiceCustomer?.email}</p>
                <p className="text-zinc-600 mt-0.5">Phone: {invoiceCustomer?.phone}</p>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="border border-zinc-150 rounded-md overflow-hidden text-xs">
              <Table>
                <TableHeader className="bg-zinc-50">
                  <TableRow>
                    <TableHead className="font-bold text-zinc-500 py-3">Garment Item Specification</TableHead>
                    <TableHead className="font-bold text-zinc-500 py-3">Type</TableHead>
                    <TableHead className="font-bold text-zinc-500 py-3 text-center">Qty</TableHead>
                    <TableHead className="font-bold text-zinc-500 py-3 text-right">Unit Price</TableHead>
                    <TableHead className="font-bold text-zinc-500 py-3 text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-zinc-700">
                  {invoiceOrder.products.map((p, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="py-4 font-semibold text-zinc-950">
                        {p.product}
                        {p.notes && <p className="text-[10px] text-zinc-455 font-normal mt-0.5">{p.notes}</p>}
                      </TableCell>
                      <TableCell className="py-4">{p.stitchType}</TableCell>
                      <TableCell className="py-4 text-center">{p.quantity}</TableCell>
                      <TableCell className="py-4 text-right">{formatCurrency(p.price)}</TableCell>
                      <TableCell className="py-4 text-right font-bold text-zinc-950">
                        {formatCurrency(p.price * p.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Material Requirements Specification Table */}
            {invoiceOrder.materials && invoiceOrder.materials.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">
                  Material & Fabric Requirements Checklist:
                </h3>
                <div className="border border-zinc-150 rounded-md overflow-hidden text-xs">
                  <Table>
                    <TableHeader className="bg-zinc-50">
                      <TableRow>
                        <TableHead className="font-bold text-zinc-500 py-2.5">Material Name</TableHead>
                        <TableHead className="font-bold text-zinc-500 py-2.5">Color / Dye</TableHead>
                        <TableHead className="font-bold text-zinc-500 py-2.5">Garment Category</TableHead>
                        <TableHead className="font-bold text-zinc-500 py-2.5 text-center">Quantity</TableHead>
                        {invoiceOrder.materials.some((m) => m.price && Number(m.price) > 0) && (
                          <TableHead className="font-bold text-zinc-500 py-2.5 text-right">Material Price</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-zinc-700">
                      {invoiceOrder.materials.map((m, idx) => {
                        const hasPrice = m.price && Number(m.price) > 0;
                        const category = m.customCategory || m.estimateCategory || "-";
                        return (
                          <TableRow key={m.id || idx}>
                            <TableCell className="py-2.5 font-semibold text-zinc-950">
                              {m.material || "Fabric"}
                              {m.notes && <p className="text-[10px] text-zinc-400 font-normal mt-0.5">{m.notes}</p>}
                            </TableCell>
                            <TableCell className="py-2.5">{m.color || "-"}</TableCell>
                            <TableCell className="py-2.5">{category}</TableCell>
                            <TableCell className="py-2.5 text-center">{m.quantity} {m.unit}</TableCell>
                            {invoiceOrder.materials.some((mat) => mat.price && Number(mat.price) > 0) && (
                              <TableCell className="py-2.5 text-right font-bold text-zinc-950">
                                {hasPrice ? formatCurrency(Number(m.price)) : "-"}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Cost and Invoice calculation summaries */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-8 text-xs leading-normal">
              {/* Payment history listing inside invoice */}
              <div className="w-full sm:max-w-xs space-y-3">
                <h3 className="font-bold text-zinc-400 uppercase tracking-wider">Deposits / Payments:</h3>
                {invoiceOrder.payments.length === 0 ? (
                  <p className="text-[10px] text-zinc-455 italic">No payment receipts logged against this invoice.</p>
                ) : (
                  <div className="border border-zinc-150 rounded overflow-hidden">
                    <table className="w-full text-[10px] text-left">
                      <thead>
                        <tr className="bg-zinc-50 text-zinc-400 font-semibold uppercase tracking-wider border-b">
                          <th className="p-2">Date</th>
                          <th className="p-2">Method</th>
                          <th className="p-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-150 text-zinc-600">
                        {invoiceOrder.payments.map((p) => (
                          <tr key={p.id}>
                            <td className="p-2">{new Date(p.date).toLocaleDateString()}</td>
                            <td className="p-2 font-medium">{p.method}</td>
                            <td className="p-2 text-right font-bold text-emerald-700">+{formatCurrency(p.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Estimate Calculations */}
              <div className="w-full sm:max-w-xs space-y-2 border-t sm:border-t-0 border-zinc-150 pt-4 sm:pt-0 self-end">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Stitching charges</span>
                  <span className="font-semibold">{formatCurrency(invoiceOrder.estimate.stitching)}</span>
                </div>
                {(() => {
                  const totalMaterialCost = (invoiceOrder.materials || []).reduce((sum, m) => sum + (m.price && Number(m.price) > 0 ? Number(m.price) : 0), 0);
                  if (totalMaterialCost <= 0) return null;
                  return (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Fabric & Material Charges</span>
                      <span className="font-semibold">{formatCurrency(totalMaterialCost)}</span>
                    </div>
                  );
                })()}
                {invoiceOrder.estimate.embroidery > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Embroidery work</span>
                    <span className="font-semibold">{formatCurrency(invoiceOrder.estimate.embroidery)}</span>
                  </div>
                )}
                {invoiceOrder.estimate.printing > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Printing fee</span>
                    <span className="font-semibold">{formatCurrency(invoiceOrder.estimate.printing)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-500">Logistic Delivery fee</span>
                  <span className="font-semibold">
                    {formatCurrency(invoiceOrder.estimate.transport + invoiceOrder.estimate.packing)}
                  </span>
                </div>
                {invoiceOrder.estimate.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Promo Discount</span>
                    <span className="font-semibold">-{formatCurrency(invoiceOrder.estimate.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-zinc-100 pt-1.5">
                  <span className="text-zinc-500">GST ({settings.gstRate}%)</span>
                  <span className="font-semibold">{formatCurrency(invoiceOrder.estimate.gst)}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-1.5 text-sm font-extrabold text-zinc-950">
                  <span>Grand Total</span>
                  <span>{formatCurrency(invoiceOrder.estimate.total)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 pt-1">
                  <span>Amount Paid</span>
                  <span>-{formatCurrency(totalPaid)}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-200/80 pt-1.5 text-sm font-bold text-zinc-950 bg-zinc-50 p-2.5 rounded">
                  <span>Balance Due</span>
                  <span className={balanceDue > 0 ? "text-amber-655" : "text-emerald-700"}>
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Invoice Footer */}
            <div className="border-t border-zinc-150 pt-8 text-center text-[10px] text-zinc-455 leading-relaxed">
              <p className="font-semibold">Thank you for choosing {settings.companyName}!</p>
              <p className="mt-1">Invoice generated from Atelier production logs. Subject to standard tailoring terms.</p>
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
