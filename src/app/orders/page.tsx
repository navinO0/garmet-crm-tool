"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useProductionStore } from "@/store/productionStore";
import { StatusBadge, MeasurementCard, EmptyState } from "@/components/shared/ReusableComponents";
import { Order, OrderStatus, Payment } from "@/types";
import { cn } from "@/lib/utils";
import { BundleTicketModal } from "@/components/orders/BundleTicketModal";
import {
  Search,
  Plus,
  SlidersHorizontal,
  ChevronRight,
  Printer,
  DollarSign,
  Scissors,
  ClipboardList,
  CheckCircle,
  FileText,
  User,
  Activity,
  ArrowRight,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Full order status progression in order
const STATUS_ORDER: OrderStatus[] = [
  "Material Received",
  "Cutting",
  "Stitching",
  "Embroidery",
  "QC",
  "Ready",
  "Delivered",
  "Completed",
];

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { orders, activities, settings, updateOrderStatus, addPayment } = useProductionStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [printableOrderId, setPrintableOrderId] = useState<string | null>(null);

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<Payment["method"]>("Cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentError, setPaymentError] = useState("");

  // Status Form State
  const [statusNotes, setStatusNotes] = useState("");

  // Listen to select query parameter
  useEffect(() => {
    const selectId = searchParams.get("select");
    if (selectId) {
      const exists = orders.some((o) => o.id === selectId);
      if (exists) {
        setSelectedOrderId(selectId);
      }
    }
  }, [searchParams, orders]);

  // Filters
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.products.some((p) => p.product.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === "ALL" || o.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const selectedOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  const orderActivities = useMemo(() => {
    if (!selectedOrderId) return [];
    return activities
      .filter((a) => a.orderId === selectedOrderId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activities, selectedOrderId]);

  // Progress logic
  const currentStatusIndex = useMemo(() => {
    if (!selectedOrder) return -1;
    return STATUS_ORDER.indexOf(selectedOrder.status);
  }, [selectedOrder]);

  const handleAdvanceStatus = () => {
    if (!selectedOrder || currentStatusIndex === -1 || currentStatusIndex === STATUS_ORDER.length - 1) return;
    const nextStatus = STATUS_ORDER[currentStatusIndex + 1];
    updateOrderStatus(selectedOrder.id, nextStatus, statusNotes.trim() || `Moved to ${nextStatus}.`);
    setStatusNotes("");
  };

  const handleCustomStatusChange = (status: OrderStatus) => {
    if (!selectedOrder) return;
    updateOrderStatus(selectedOrder.id, status, statusNotes.trim() || `Status updated to ${status}.`);
    setStatusNotes("");
  };

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");

    if (!selectedOrder) return;
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentError("Amount must be a positive number.");
      return;
    }

    const balance = selectedOrder.estimate.total - selectedOrder.payments.reduce((sum, p) => sum + p.amount, 0);
    if (amt > balance + 0.01) {
      setPaymentError(`Amount cannot exceed the remaining balance of ${settings.currencySymbol}${balance.toFixed(2)}.`);
      return;
    }

    addPayment(selectedOrder.id, amt, paymentMethod, paymentNotes.trim() || undefined);
    setPaymentAmount("");
    setPaymentNotes("");
  };

  const formatCurrency = (val: number) => {
    return `${settings.currencySymbol}${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleCloseDetails = () => {
    setSelectedOrderId(null);
    setActiveTab("overview");
    router.replace("/orders");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Orders</h1>
          <p className="text-sm text-zinc-500 mt-1">Track customization workflows, sizing, materials and balances.</p>
        </div>
        <Link href="/orders/new">
          <Button className="font-semibold tracking-tight cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </Button>
        </Link>
      </div>

      {/* Control bar: Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white dark:bg-zinc-900 p-4 rounded-md border border-zinc-200 dark:border-zinc-800">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search orders by number, client name, products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus-visible:bg-white"
          />
        </div>
        <div>
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
            <SelectTrigger className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {STATUS_ORDER.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          title="No Orders Found"
          description={searchQuery || statusFilter !== "ALL" ? "Try adjusting your search query or filters." : "Create your first order to get started."}
          actionText={statusFilter === "ALL" && !searchQuery ? "Create Order" : undefined}
          onAction={statusFilter === "ALL" && !searchQuery ? () => router.push("/orders/new") : undefined}
        />
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-zinc-500">Order</TableHead>
                  <TableHead className="font-bold text-zinc-500">Customer</TableHead>
                  <TableHead className="font-bold text-zinc-500">Garment Items</TableHead>
                  <TableHead className="font-bold text-zinc-500">Due Date</TableHead>
                  <TableHead className="font-bold text-zinc-500">Total Price</TableHead>
                  <TableHead className="font-bold text-zinc-500">Production Status</TableHead>
                  <TableHead className="font-bold text-zinc-500">Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const itemsCount = order.products.reduce((acc, p) => acc + p.quantity, 0);
                  const isOverdue =
                    new Date(order.deliveryDate).getTime() < new Date().getTime() &&
                    order.status !== "Completed" &&
                    order.status !== "Delivered";

                  return (
                    <TableRow
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className="cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20"
                    >
                      <TableCell className="font-bold text-zinc-900 dark:text-zinc-100">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell className="font-medium text-zinc-700 dark:text-zinc-300">
                        {order.customerName}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs truncate block max-w-[200px]" title={order.products.map(p => p.product).join(", ")}>
                          {order.products.map((p) => `${p.quantity}x ${p.product}`).join(", ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={cn("text-xs font-semibold", isOverdue ? "text-red-500" : "")}>
                          {order.deliveryDate}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(order.estimate.total)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} type="order" />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.paymentStatus} type="payment" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className="p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 active:bg-zinc-100/50 cursor-pointer space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-zinc-400 font-mono font-semibold">{order.orderNumber}</span>
                    <h4 className="font-bold text-sm text-zinc-950 dark:text-zinc-100 mt-0.5">{order.customerName}</h4>
                  </div>
                  <span className="font-bold text-sm text-zinc-950 dark:text-zinc-100">
                    {formatCurrency(order.estimate.total)}
                  </span>
                </div>
                
                <p className="text-xs text-zinc-400 line-clamp-1">
                  {order.products.map((p) => `${p.quantity}x ${p.product}`).join(", ")}
                </p>

                <div className="flex justify-between items-center pt-1 border-t border-zinc-100 dark:border-zinc-800/50">
                  <span className="text-[10px] text-zinc-400 font-medium">Due: {order.deliveryDate}</span>
                  <div className="flex space-x-1.5">
                    <StatusBadge status={order.status} type="order" />
                    <StatusBadge status={order.paymentStatus} type="payment" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Details Popup Modal */}
      <Dialog open={selectedOrderId !== null} onOpenChange={(open) => !open && handleCloseDetails()}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 overflow-hidden flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl">
          {selectedOrder && (
            <>
              {/* Header */}
              <DialogHeader className="p-4 sm:p-5 border-b border-zinc-150 dark:border-zinc-800 space-y-0 bg-zinc-50/50 dark:bg-zinc-950/30">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                      Garment Order Job
                    </span>
                    <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                      <span>{selectedOrder.orderNumber}</span>
                      <span className="text-sm font-normal text-zinc-400">&mdash; {selectedOrder.customerName}</span>
                    </DialogTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => setActiveTab("payments")}
                      className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shrink-0 cursor-pointer shadow-xs"
                    >
                      <DollarSign className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Record Payment</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPrintableOrderId(selectedOrder.id)}
                      className="h-8 text-xs font-semibold border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400 shrink-0"
                    >
                      <Scissors className="mr-1.5 h-3.5 w-3.5" /> Cut Tickets
                    </Button>
                    <Link href={`/invoices?orderId=${selectedOrder.id}`}>
                      <Button variant="outline" size="sm" className="h-8 text-xs font-semibold shrink-0">
                        <Printer className="mr-2 h-3.5 w-3.5" /> Invoice
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleCloseDetails}
                      className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Status:</span>
                  <StatusBadge status={selectedOrder.status} type="order" />
                  <StatusBadge status={selectedOrder.paymentStatus} type="payment" />
                  <span className="text-[10px] text-zinc-400 ml-auto font-medium">Due: {selectedOrder.deliveryDate}</span>
                </div>
              </DialogHeader>

              {/* Tab Navigation (Horizontally Scrollable so no tab is clipped) */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <div className="overflow-x-auto w-full border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 px-3 sm:px-6">
                  <TabsList className="bg-transparent border-none p-0 h-11 space-x-4 sm:space-x-6 justify-start w-max flex">
                    <TabsTrigger value="overview" className="border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white bg-transparent rounded-none px-1 h-full font-bold text-xs tracking-wide uppercase flex items-center">
                      <FileText className="h-3.5 w-3.5 mr-1.5 shrink-0" /> Overview
                    </TabsTrigger>
                    <TabsTrigger value="materials" className="border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white bg-transparent rounded-none px-1 h-full font-bold text-xs tracking-wide uppercase flex items-center">
                      <Scissors className="h-3.5 w-3.5 mr-1.5 shrink-0" /> Materials & Sizes
                    </TabsTrigger>
                    <TabsTrigger value="production" className="border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white bg-transparent rounded-none px-1 h-full font-bold text-xs tracking-wide uppercase flex items-center">
                      <Activity className="h-3.5 w-3.5 mr-1.5 shrink-0" /> Timeline
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="border-b-2 border-transparent data-[state=active]:border-emerald-600 dark:data-[state=active]:border-emerald-400 bg-transparent rounded-none px-1 h-full font-bold text-xs tracking-wide uppercase text-emerald-700 dark:text-emerald-400 flex items-center">
                      <DollarSign className="h-3.5 w-3.5 mr-1 shrink-0 font-extrabold" /> Payments & Ledger
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Tab Content Box */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-6 mt-0">
                    {/* Products list */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center">
                        <ClipboardList className="h-4 w-4 mr-2" />
                        <span>Garment items to stitch</span>
                      </h4>
                      <div className="border border-zinc-150 dark:border-zinc-800 rounded-md overflow-hidden">
                        <Table>
                          <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                            <TableRow>
                              <TableHead className="py-2.5 text-xs text-zinc-400">Item</TableHead>
                              <TableHead className="py-2.5 text-xs text-zinc-400">Type</TableHead>
                              <TableHead className="py-2.5 text-xs text-zinc-400 text-center">Qty</TableHead>
                              <TableHead className="py-2.5 text-xs text-zinc-400 text-right">Price</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedOrder.products.map((p, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="py-3 font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                                  {p.product}
                                  {p.notes && <p className="text-[10px] text-zinc-400 font-normal mt-0.5">{p.notes}</p>}
                                </TableCell>
                                <TableCell className="py-3 text-xs">{p.stitchType}</TableCell>
                                <TableCell className="py-3 text-xs text-center font-medium">{p.quantity}</TableCell>
                                <TableCell className="py-3 text-xs text-right font-bold">{formatCurrency(p.price)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Cost Estimation Breakdown */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        <span>Cost Estimation Summary</span>
                      </h4>
                      <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 p-4 rounded-md space-y-2.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Stitching Charges</span>
                          <span className="font-semibold">{formatCurrency(selectedOrder.estimate.stitching)}</span>
                        </div>
                        {selectedOrder.estimate.embroidery > 0 && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Embroidery Work</span>
                            <span className="font-semibold">{formatCurrency(selectedOrder.estimate.embroidery)}</span>
                          </div>
                        )}
                        {selectedOrder.estimate.printing > 0 && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Special Printing</span>
                            <span className="font-semibold">{formatCurrency(selectedOrder.estimate.printing)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Transport & Packing Logistics</span>
                          <span className="font-semibold">
                            {formatCurrency(selectedOrder.estimate.transport + selectedOrder.estimate.packing)}
                          </span>
                        </div>
                        {selectedOrder.estimate.discount > 0 && (
                          <div className="flex justify-between text-red-500">
                            <span>Promotional Discount</span>
                            <span className="font-semibold">-{formatCurrency(selectedOrder.estimate.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-zinc-200/50 dark:border-zinc-800/50 pt-2">
                          <span className="text-zinc-500">GST Tax ({settings.gstRate}%)</span>
                          <span className="font-semibold">{formatCurrency(selectedOrder.estimate.gst)}</span>
                        </div>
                        <div className="flex justify-between border-t border-zinc-200/70 dark:border-zinc-800/80 pt-2 text-sm font-extrabold text-zinc-950 dark:text-zinc-50">
                          <span>Total Amount</span>
                          <span>{formatCurrency(selectedOrder.estimate.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Notes */}
                    {selectedOrder.notes && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Design Notes / Instructions</h4>
                        <div className="bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded border border-zinc-150 dark:border-zinc-800 text-xs leading-relaxed text-zinc-600 dark:text-zinc-350 italic">
                          &ldquo;{selectedOrder.notes}&rdquo;
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Materials & Measurements Tab */}
                  <TabsContent value="materials" className="space-y-6 mt-0">
                    {/* Materials Inventory Check */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center">
                        <Scissors className="h-4 w-4 mr-2" />
                        <span>Materials Checklist</span>
                      </h4>
                      {selectedOrder.materials.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic">No materials assigned for this order.</p>
                      ) : (
                        <div className="border border-zinc-150 dark:border-zinc-800 rounded-md overflow-hidden">
                          <Table>
                            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                              <TableRow>
                                <TableHead className="py-2.5 text-xs text-zinc-400">Material</TableHead>
                                <TableHead className="py-2.5 text-xs text-zinc-400 text-center font-medium">Quantity</TableHead>
                                <TableHead className="py-2.5 text-xs text-zinc-400 text-right">Unit</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedOrder.materials.map((m, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="py-3 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                    {m.material}
                                    {m.color && <span className="block font-normal text-[10px] text-zinc-455 mt-0.5">Color: {m.color}</span>}
                                    {m.notes && <span className="block font-normal text-[9px] text-zinc-400 mt-0.2 italic">{m.notes}</span>}
                                  </TableCell>
                                  <TableCell className="py-3 text-xs text-center font-bold">{m.quantity}</TableCell>
                                  <TableCell className="py-3 text-xs text-right text-zinc-500">{m.unit}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>

                    {/* Sizing Blueprint Card */}
                    <MeasurementCard measurements={selectedOrder.measurements} title={`Blueprint Sizing Record (${selectedOrder.sizeSetName || "Primary Measurements"})`} />
                  </TabsContent>

                  {/* Production & Activities Timeline Tab */}
                  <TabsContent value="production" className="space-y-6 mt-0">
                    {/* Advance status form */}
                    {selectedOrder.status !== "Completed" && (
                      <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-4 rounded-md space-y-4">
                        <div>
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                            Advance Production Phase
                          </h4>
                          <p className="text-[11px] text-zinc-400 mt-0.5">Advance order progress or log custom phase adjustments.</p>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="statusNotes" className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Log notes (Optional)</Label>
                            <Input
                              id="statusNotes"
                              placeholder="e.g. Needlework completed. Shifted to steam wash."
                              value={statusNotes}
                              onChange={(e) => setStatusNotes(e.target.value)}
                              className="h-9 bg-white dark:bg-zinc-950 text-xs"
                            />
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1.5">
                            {currentStatusIndex !== -1 && currentStatusIndex < STATUS_ORDER.length - 1 && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleAdvanceStatus}
                                className="font-semibold text-xs tracking-tight"
                              >
                                Advance to &ldquo;{STATUS_ORDER[currentStatusIndex + 1]}&rdquo;
                              </Button>
                            )}
                            
                            <div className="flex items-center space-x-2 ml-auto">
                              <span className="text-[10px] text-zinc-400">Set stage:</span>
                              <Select
                                value={selectedOrder.status}
                                onValueChange={(val) => val && handleCustomStatusChange(val as OrderStatus)}
                              >
                                <SelectTrigger className="h-8 w-40 bg-white dark:bg-zinc-950 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_ORDER.map((s) => (
                                    <SelectItem key={s} value={s} className="text-xs">
                                      {s}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timeline logs checklist */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center">
                        <Activity className="h-4 w-4 mr-2" />
                        <span>Workshop Stage Updates</span>
                      </h4>
                      <div className="flow-root pl-2">
                        <ul className="-mb-8">
                          {orderActivities.map((activity, idx) => (
                            <li key={activity.id}>
                              <div className="relative pb-8">
                                {idx !== orderActivities.length - 1 && (
                                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />
                                )}
                                <div className="relative flex space-x-3">
                                  <span className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-850 flex items-center justify-center">
                                    <CheckCircle className="h-4 w-4 text-zinc-450" />
                                  </span>
                                  <div className="pt-1.5 flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                      <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-100">
                                        Status: {activity.status}
                                      </p>
                                      <span className="text-[9px] text-zinc-400 font-mono">
                                        {new Date(activity.timestamp).toLocaleDateString()} &bull; {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1 leading-normal">
                                      {activity.notes}
                                    </p>
                                    <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                                      Logged by: {activity.updatedBy}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Payments and Receipts Tab */}
                  <TabsContent value="payments" className="space-y-6 mt-0">
                    {/* Metrics row */}
                    {(() => {
                      const totalPaid = selectedOrder.payments.reduce((sum, p) => sum + p.amount, 0);
                      const balance = selectedOrder.estimate.total - totalPaid;
                      return (
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border p-3 rounded-md text-left">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Estimated Total</span>
                            <p className="text-sm font-bold mt-1 text-zinc-950 dark:text-zinc-100">{formatCurrency(selectedOrder.estimate.total)}</p>
                          </div>
                          <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-3 rounded-md text-left">
                            <span className="text-[10px] font-bold text-emerald-555 uppercase tracking-wider">Total Received</span>
                            <p className="text-sm font-bold mt-1 text-emerald-650">{formatCurrency(totalPaid)}</p>
                          </div>
                          <div className="bg-amber-50/20 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 p-3 rounded-md text-left">
                            <span className="text-[10px] font-bold text-amber-555 uppercase tracking-wider">Remaining Due</span>
                            <p className="text-sm font-bold mt-1 text-amber-650">{formatCurrency(balance)}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Receive Payment Form */}
                    {(() => {
                      const totalPaid = selectedOrder.payments.reduce((sum, p) => sum + p.amount, 0);
                      const balance = selectedOrder.estimate.total - totalPaid;
                      if (balance <= 0.01) return null;

                      return (
                        <form onSubmit={handleAddPaymentSubmit} className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-4 rounded-md space-y-4">
                          <div>
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Record Payment</h4>
                            <p className="text-[11px] text-zinc-400 mt-0.5">Manually record a deposit or balance payment received from the customer.</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="paymentAmount" className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Amount ({settings.currencySymbol})</Label>
                              <Input
                                id="paymentAmount"
                                type="text"
                                inputMode="decimal"
                                pattern="[0-9]*"
                                placeholder={balance.toFixed(2)}
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="h-9 bg-white dark:bg-zinc-950 text-xs"
                                required
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="paymentMethod" className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Method</Label>
                              <Select
                                value={paymentMethod}
                                onValueChange={(val) => val && setPaymentMethod(val as Payment["method"])}
                              >
                                <SelectTrigger className="h-9 bg-white dark:bg-zinc-950 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Cash">Cash</SelectItem>
                                  <SelectItem value="Card">Credit Card</SelectItem>
                                  <SelectItem value="Bank Transfer">Bank Wire</SelectItem>
                                  <SelectItem value="UPI">UPI Payment</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="paymentNotes" className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Notes</Label>
                              <Input
                                id="paymentNotes"
                                placeholder="e.g. Gown balance paid"
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                className="h-9 bg-white dark:bg-zinc-950 text-xs"
                              />
                            </div>
                          </div>
                          {paymentError && <p className="text-[10px] text-red-500 font-semibold">{paymentError}</p>}
                          <Button type="submit" size="sm" className="font-semibold text-xs tracking-tight">
                            Record Payment Receipt
                          </Button>
                        </form>
                      );
                    })()}

                    {/* Payment list logs */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        <span>Transaction Ledger</span>
                      </h4>
                      {selectedOrder.payments.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic">No payment receipts logged yet.</p>
                      ) : (
                        <div className="border border-zinc-150 dark:border-zinc-800 rounded-md overflow-hidden text-xs">
                          <Table>
                            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                              <TableRow>
                                <TableHead className="py-2.5 text-zinc-400">Date</TableHead>
                                <TableHead className="py-2.5 text-zinc-400">Method</TableHead>
                                <TableHead className="py-2.5 text-zinc-400">Notes</TableHead>
                                <TableHead className="py-2.5 text-zinc-400 text-right">Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedOrder.payments.map((p) => (
                                <TableRow key={p.id}>
                                  <TableCell className="py-3 text-zinc-500">{new Date(p.date).toLocaleDateString()}</TableCell>
                                  <TableCell className="py-3 font-semibold">{p.method}</TableCell>
                                  <TableCell className="py-3 text-zinc-500 max-w-[150px] truncate" title={p.notes}>{p.notes || "-"}</TableCell>
                                  <TableCell className="py-3 font-bold text-right text-emerald-700 dark:text-emerald-450">+{formatCurrency(p.amount)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {printableOrderId && (
        <BundleTicketModal
          orderId={printableOrderId}
          onClose={() => setPrintableOrderId(null)}
        />
      )}
    </div>
  );
}

export default function Orders() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="h-10 w-44 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
        <div className="h-16 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
        <div className="h-80 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
      </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}
