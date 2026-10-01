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
  HardDrive,
  Edit,
  Loader2,
  ExternalLink,
  MessageCircle,
  Trash2,
  RotateCcw,
  History,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BulkOrderDetailModal } from "@/components/bulk/BulkOrderDetailModal";
import { OrderLifecycleModal } from "@/components/bulk/OrderLifecycleModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

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
    const { orders, activities, settings, updateOrderStatus, addPayment, softDeleteOrder, restoreOrder } = useProductionStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [ordersTab, setOrdersTab] = useState<'boutique' | 'bulk'>('boutique');
  const [bulkOrders, setBulkOrders] = useState<any[]>([]);
  const [isLoadingBulk, setIsLoadingBulk] = useState<boolean>(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDeletedHistory, setShowDeletedHistory] = useState<boolean>(false);

  // Soft delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [orderToDelete, setOrderToDelete] = useState<{
    type: 'boutique' | 'bulk';
    id: string;
    orderNumber: string;
    clientName: string;
  } | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [selectedBulkOrder, setSelectedBulkOrder] = useState<any>(null);
  const [selectedBulkOrderForLifecycle, setSelectedBulkOrderForLifecycle] = useState<any>(null);

  const [printableOrderId, setPrintableOrderId] = useState<string | null>(null);

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<Payment["method"]>("Cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentError, setPaymentError] = useState("");

  // Status Form State
  const [statusNotes, setStatusNotes] = useState("");

  const handleRequestDelete = (
    type: 'boutique' | 'bulk',
    id: string,
    orderNumber: string,
    clientName: string
  ) => {
    setOrderToDelete({ type, id, orderNumber, clientName });
    setDeleteReason("");
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      if (orderToDelete.type === 'boutique') {
        softDeleteOrder(orderToDelete.id, deleteReason.trim() || undefined);
      } else {
        const url = `/api/bulk-orders?id=${encodeURIComponent(orderToDelete.id)}${deleteReason.trim() ? `&reason=${encodeURIComponent(deleteReason.trim())}` : ''}`;
        const res = await fetch(url, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          await fetchBulkOrders();
          if (selectedBulkOrder?.id === orderToDelete.id) {
            setSelectedBulkOrder(data.order);
          }
        }
      }
      setDeleteModalOpen(false);
      setOrderToDelete(null);
      setDeleteReason("");
    } catch (err) {
      console.error("Failed to soft delete order:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = async (type: 'boutique' | 'bulk', id: string) => {
    try {
      if (type === 'boutique') {
        restoreOrder(id);
      } else {
        const res = await fetch('/api/bulk-orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, action: 'restore' }),
        });
        const data = await res.json();
        if (data.success) {
          await fetchBulkOrders();
          if (selectedBulkOrder?.id === id) {
            setSelectedBulkOrder(data.order);
          }
        }
      }
    } catch (err) {
      console.error("Failed to restore order:", err);
    }
  };

  const fetchBulkOrders = async () => {
    try {
      setIsLoadingBulk(true);
      const res = await fetch('/api/bulk-orders');
      const data = await res.json();
      if (data.success) {
        setBulkOrders(data.orders || []);
      }
    } catch (e) {
      console.error('Failed to fetch bulk orders:', e);
    } finally {
      setIsLoadingBulk(false);
    }
  };

  const sendBulkViaWhatsApp = (order: any) => {
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
    const msg = encodeURIComponent(lines.join('\n'));
    const url = phone ? `https://wa.me/91${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  };

  const sendBoutiqueViaWhatsApp = (order: any) => {
    const phone = (order.customerPhone || order.mobileNumber || '').replace(/[^0-9]/g, '');
    const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
    const items = (order.products || []).map((p: any) => `  - ${p.quantity}x ${p.product}${p.stitchType ? ` (${p.stitchType})` : ''}`).join('\n');
    const lines = [
      `*RAADHE LABEL — Boutique Order Confirmation*`,
      ``,
      `📋 Order #: ${order.orderNumber}`,
      `👤 Customer: ${order.customerName}`,
      `👗 Garments:`,
      items,
      ``,
      `💰 Grand Total: ${fmt(order.estimate?.total || 0)}`,
      `📅 Delivery Date: ${order.deliveryDate || 'As Scheduled'}`,
      `📦 Status: ${order.status}`,
      ``,
      `Thank you for choosing RAADHE LABEL! 🙏`,
    ];
    const msg = encodeURIComponent(lines.join('\n'));
    const url = phone ? `https://wa.me/91${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    if (ordersTab === 'bulk') {
      fetchBulkOrders();
    }
  }, [ordersTab]);

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

  const boutiqueDeletedCount = useMemo(() => orders.filter((o) => o.isDeleted).length, [orders]);
  const bulkDeletedCount = useMemo(() => bulkOrders.filter((o) => o.isDeleted).length, [bulkOrders]);
  const currentDeletedCount = ordersTab === 'boutique' ? boutiqueDeletedCount : bulkDeletedCount;

  // Filters for Boutique orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const isDeleted = Boolean(o.isDeleted);
      if (showDeletedHistory) {
        if (!isDeleted) return false;
      } else {
        if (statusFilter !== "DELETED" && isDeleted) return false;
      }

      const matchSearch =
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.products.some((p) => p.product.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "DELETED" ? isDeleted : o.status === statusFilter);

      let matchDate = true;
      const orderDate = new Date(o.createdAt);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (orderDate < start) matchDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (orderDate > end) matchDate = false;
      }

      return matchSearch && matchStatus && matchDate;
    });
  }, [orders, searchQuery, statusFilter, startDate, endDate, showDeletedHistory]);

  // Filters for Bulk Stitching orders
  const filteredBulkOrders = useMemo(() => {
    return bulkOrders.filter((o) => {
      const isDeleted = Boolean(o.isDeleted);
      if (showDeletedHistory) {
        if (!isDeleted) return false;
      } else {
        if (statusFilter !== "DELETED" && isDeleted) return false;
      }

      const matchSearch =
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.client?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.client?.businessName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.items.some((p: any) => p.itemDescription.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "DELETED" ? isDeleted : o.status === statusFilter);

      let matchDate = true;
      const orderDate = new Date(o.createdAt);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (orderDate < start) matchDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (orderDate > end) matchDate = false;
      }

      return matchSearch && matchStatus && matchDate;
    });
  }, [bulkOrders, searchQuery, statusFilter, startDate, endDate, showDeletedHistory]);

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

      {/* Tab Switcher & History Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-2 p-1 bg-zinc-150 dark:bg-zinc-950/60 rounded-lg w-max border border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setOrdersTab('boutique')}
            className={`py-1.5 px-4 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${ordersTab === 'boutique'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-bold animate-in fade-in duration-100'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            Boutique Custom Orders
          </button>
          <button
            onClick={() => setOrdersTab('bulk')}
            className={`py-1.5 px-4 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${ordersTab === 'bulk'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-bold animate-in fade-in duration-100'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            Bulk Stitching Orders
          </button>
        </div>

        {/* View Mode: Active vs Deleted History */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-150 dark:bg-zinc-950/60 rounded-lg border border-zinc-200 dark:border-zinc-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowDeletedHistory(false)}
            className={`py-1 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${!showDeletedHistory
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-bold'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Active Orders
          </button>
          <button
            type="button"
            onClick={() => setShowDeletedHistory(true)}
            className={`py-1 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${showDeletedHistory
              ? 'bg-red-600 text-white shadow-sm font-bold'
              : 'text-zinc-500 hover:text-red-600 dark:hover:text-red-400'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Deleted History
            {currentDeletedCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${showDeletedHistory ? 'bg-white/20 text-white' : 'bg-red-100 dark:bg-red-950/50 text-red-600'}`}>
                {currentDeletedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Control bar: Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-white dark:bg-zinc-900 p-4 rounded-md border border-zinc-200 dark:border-zinc-800">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder={ordersTab === 'boutique' ? "Search custom orders by number, client..." : "Search bulk orders by number, company, item..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus-visible:bg-white text-xs"
          />
        </div>
        <div className="relative">
          <input
            type="date"
            placeholder="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none transition cursor-pointer"
          />
        </div>
        <div className="relative">
          <input
            type="date"
            placeholder="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none transition cursor-pointer"
          />
        </div>
        <div>
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
            <SelectTrigger className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="max-h-56">
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="DELETED" className="text-red-600 font-semibold">Deleted History</SelectItem>
              {ordersTab === 'boutique' ? (
                STATUS_ORDER.map((status) => (
                  <SelectItem key={status} value={status} className="text-xs">
                    {status}
                  </SelectItem>
                ))
              ) : (
                ['Estimate Generated', 'Estimate Approved', 'Work Started', 'In Production', 'Completed', 'Delivered', 'Extended'].map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      {ordersTab === 'boutique' ? (
        filteredOrders.length === 0 ? (
          <EmptyState
            title="No Boutique Orders Found"
            description={searchQuery || statusFilter !== "ALL" || startDate || endDate ? "Try adjusting your search query or filters." : "Create your first order to get started."}
            actionText={statusFilter === "ALL" && !searchQuery ? "Create Order" : undefined}
            onAction={statusFilter === "ALL" && !searchQuery ? () => router.push("/orders/new") : undefined}
          />
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden animate-in fade-in duration-100">
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
                    <TableHead className="font-bold text-zinc-500 text-right">Actions</TableHead>
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
                        className={`cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 ${order.isDeleted ? 'opacity-70 bg-zinc-50/40 dark:bg-zinc-950/20' : ''}`}
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
                          {order.isDeleted ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50">
                              <Trash2 className="w-3 h-3" /> Soft-Deleted
                            </span>
                          ) : (
                            <StatusBadge status={order.status} type="order" />
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.paymentStatus} type="payment" />
                        </TableCell>
                        <TableCell className="text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                          {order.isDeleted ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRestore('boutique', order.id)}
                              className="h-8 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Restore
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRequestDelete('boutique', order.id, order.orderNumber, order.customerName)}
                              className="h-8 text-[11px] font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900/40 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </Button>
                          )}
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
                    <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                      {order.isDeleted ? (
                        <>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                            <Trash2 className="w-3 h-3" /> Deleted
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRestore('boutique', order.id)}
                            className="h-7 text-[10px] font-semibold text-emerald-600 border border-emerald-200 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" /> Restore
                          </Button>
                        </>
                      ) : (
                        <>
                          <StatusBadge status={order.status} type="order" />
                          <StatusBadge status={order.paymentStatus} type="payment" />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRequestDelete('boutique', order.id, order.orderNumber, order.customerName)}
                            className="h-7 text-[10px] font-semibold text-red-600 border border-red-200 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        /* Bulk Stitching Orders Tab */
        isLoadingBulk ? (
          <div className="text-center py-12 text-zinc-550 flex items-center justify-center gap-1.5 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-zinc-405" /> Loading bulk stitching records...
          </div>
        ) : filteredBulkOrders.length === 0 ? (
          <EmptyState
            title="No Bulk Stitching Orders Found"
            description={searchQuery || statusFilter !== "ALL" || startDate || endDate ? "Try adjusting your search query or filters." : "Create a bulk stitching agreement to get started."}
          />
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden animate-in fade-in duration-100">
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-zinc-500">Order #</TableHead>
                    <TableHead className="font-bold text-zinc-500">Client Profile</TableHead>
                    <TableHead className="font-bold text-zinc-500 text-center">Items Qty</TableHead>
                    <TableHead className="font-bold text-zinc-500 text-right">Grand Total</TableHead>
                    <TableHead className="font-bold text-zinc-500 text-center">Order Date</TableHead>
                    <TableHead className="font-bold text-zinc-500 text-center">Production Status</TableHead>
                    <TableHead className="font-bold text-zinc-500 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBulkOrders.map((order) => (
                    <TableRow key={order.id} className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 ${order.isDeleted ? 'opacity-70 bg-zinc-50/40 dark:bg-zinc-950/20' : ''}`}>
                      <TableCell className="font-bold text-xs text-zinc-900 dark:text-zinc-100 py-3.5">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell className="text-xs py-3.5">
                        <p className="font-semibold text-zinc-850 dark:text-zinc-200">{order.client?.name}</p>
                        <p className="text-[10px] text-zinc-450">{order.client?.businessName || 'Direct Client'}</p>
                      </TableCell>
                      <TableCell className="text-xs text-center py-3.5 font-bold">
                        {order.items?.reduce((sum: number, it: any) => sum + it.quantity, 0)} pcs
                      </TableCell>
                      <TableCell className="text-xs text-right font-extrabold py-3.5">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(order.totalAmount)}
                      </TableCell>
                      <TableCell className="text-xs text-center text-zinc-400 py-3.5">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-xs text-center py-3.5">
                        {order.isDeleted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/50">
                            <Trash2 className="w-3 h-3" /> Soft-Deleted
                          </span>
                        ) : (
                          <span className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${order.status === 'Completed' || order.status === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/50'
                            : order.status === 'Extended'
                              ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/50'
                              : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/50'
                            }`}>
                            {order.status}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-right py-3.5 space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedBulkOrder(order)}
                          className="h-8 text-[11px] font-semibold border border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Details
                        </Button>
                        {!order.isDeleted && order.status !== 'Delivered' && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedBulkOrderForLifecycle(order)}
                            className="h-8 text-[11px] font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" /> Status
                          </Button>
                        )}
                        {order.isDeleted ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRestore('bulk', order.id)}
                            className="h-8 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Restore
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRequestDelete('bulk', order.id, order.orderNumber, order.client?.name || 'Client')}
                            className="h-8 text-[11px] font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900/40 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile card view for Bulk orders */}
            <div className="block md:hidden divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {filteredBulkOrders.map((order) => (
                <div key={order.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm text-zinc-900 dark:text-zinc-50">{order.orderNumber}</p>
                      <p className="text-xs text-zinc-550 font-semibold">{order.client?.name}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${order.status === 'Completed' || order.status === 'Delivered'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Order Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                    <span className="font-bold text-zinc-850 dark:text-zinc-200">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(order.totalAmount)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-[11px] h-8"
                      onClick={() => setSelectedBulkOrder(order)}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" /> View details
                    </Button>
                    {!order.isDeleted && order.status !== 'Delivered' && (
                      <Button
                        size="sm"
                        className="flex-1 text-[11px] h-8"
                        onClick={() => setSelectedBulkOrderForLifecycle(order)}
                      >
                        <Edit className="w-3 h-3 mr-1" /> Update status
                      </Button>
                    )}
                    {order.isDeleted ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-[11px] h-8 text-emerald-600 border-emerald-200"
                        onClick={() => handleRestore('bulk', order.id)}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" /> Restore
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-[11px] h-8 text-red-600 border-red-200"
                        onClick={() => handleRequestDelete('bulk', order.id, order.orderNumber, order.client?.name || 'Client')}
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      )}

      {/* Order Details Popup Modal */}
      <Dialog open={selectedOrderId !== null} onOpenChange={(open) => !open && handleCloseDetails()}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 overflow-hidden flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl">
          {selectedOrder && (
            <>
              {/* Header */}
              <DialogHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-5 border-b border-zinc-150 dark:border-zinc-800 space-y-0 bg-zinc-50/50 dark:bg-zinc-950/30">
                {/* Row 1: Title + Close */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                      Garment Order Job
                    </span>
                    <DialogTitle className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 flex flex-wrap items-baseline gap-x-2 mt-0.5">
                      <span className="shrink-0">{selectedOrder.orderNumber}</span>
                      <span className="text-sm font-normal text-zinc-400 truncate max-w-[180px] sm:max-w-none">{selectedOrder.customerName}</span>
                    </DialogTitle>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCloseDetails}
                    className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-full shrink-0 mt-0.5"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Row 2: Status badges */}
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Status:</span>
                  <StatusBadge status={selectedOrder.status} type="order" />
                  <StatusBadge status={selectedOrder.paymentStatus} type="payment" />
                  <span className="text-[10px] text-zinc-400 ml-auto font-medium shrink-0">Due: {selectedOrder.deliveryDate}</span>
                </div>

                {/* Row 3: Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-3 mt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                  <Button
                    size="sm"
                    onClick={() => { const el = document.getElementById('payments-section'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shrink-0 cursor-pointer"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    Record Payment
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPrintableOrderId(selectedOrder.id)}
                    className="h-8 text-xs font-semibold border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400 shrink-0 gap-1.5"
                  >
                    <Scissors className="h-3.5 w-3.5" /> Cut Tickets
                  </Button>
                  <Link href={`/invoices?orderId=${selectedOrder.id}`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs font-semibold shrink-0 gap-1.5">
                      <Printer className="h-3.5 w-3.5" /> Invoice
                    </Button>
                  </Link>
                  {selectedOrder.isDeleted ? (
                    <Button
                      size="sm"
                      onClick={() => handleRestore('boutique', selectedOrder.id)}
                      className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shrink-0 cursor-pointer ml-auto"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Restore Order
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRequestDelete('boutique', selectedOrder.id, selectedOrder.orderNumber, selectedOrder.customerName)}
                      className="h-8 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50 shrink-0 gap-1.5 cursor-pointer ml-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete Order
                    </Button>
                  )}
                </div>
              </DialogHeader>

              {selectedOrder.isDeleted && (
                <div className="bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/50 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-red-700 dark:text-red-300">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>
                      This order is <strong>soft-deleted</strong> and archived in history.
                      {selectedOrder.deletedAt && ` (Deleted on ${new Date(selectedOrder.deletedAt).toLocaleDateString()} at ${new Date(selectedOrder.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                      {selectedOrder.deletedReason && ` — Reason: "${selectedOrder.deletedReason}"`}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleRestore('boutique', selectedOrder.id)}
                    className="h-7 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 ml-3 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" /> Restore
                  </Button>
                </div>
              )}

              {/* Single Scrollable Content */}
              <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/80">

                {/* ── Section 1: Garments to Stitch ── */}
                <div className="px-4 sm:px-6 py-5 space-y-3">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <ClipboardList className="h-3.5 w-3.5" /> Garments to Stitch
                  </h4>
                  <div className="border border-zinc-150 dark:border-zinc-800 rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                        <TableRow>
                          <TableHead className="py-2.5 text-xs text-zinc-400">Item</TableHead>
                          <TableHead className="py-2.5 text-xs text-zinc-400">Stitch Type</TableHead>
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
                            <TableCell className="py-3 text-xs text-zinc-500">{p.stitchType}</TableCell>
                            <TableCell className="py-3 text-xs text-center font-bold">{p.quantity}</TableCell>
                            <TableCell className="py-3 text-xs text-right font-bold">{formatCurrency(p.price)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* ── Section 2: Cost Estimation ── */}
                <div className="px-4 sm:px-6 py-5 space-y-3">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5" /> Cost Estimation
                  </h4>
                  <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 p-4 rounded-md space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Stitching Charges</span>
                      <span className="font-semibold">{formatCurrency(selectedOrder.estimate.stitching || 0)}</span>
                    </div>
                    {(selectedOrder.estimate.embroidery || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Embroidery Work</span>
                        <span className="font-semibold">{formatCurrency(selectedOrder.estimate.embroidery || 0)}</span>
                      </div>
                    )}
                    {(selectedOrder.estimate.printing || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Special Printing</span>
                        <span className="font-semibold">{formatCurrency(selectedOrder.estimate.printing || 0)}</span>
                      </div>
                    )}
                    {((selectedOrder.estimate.transport || 0) + (selectedOrder.estimate.packing || 0)) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Transport &amp; Packing</span>
                        <span className="font-semibold">{formatCurrency((selectedOrder.estimate.transport || 0) + (selectedOrder.estimate.packing || 0))}</span>
                      </div>
                    )}
                    {(selectedOrder.estimate.discount || 0) > 0 && (
                      <div className="flex justify-between text-red-500">
                        <span>Discount</span>
                        <span className="font-semibold">−{formatCurrency(selectedOrder.estimate.discount || 0)}</span>
                      </div>
                    )}
                    {(selectedOrder.estimate.gst || 0) > 0 && (
                      <div className="flex justify-between border-t border-zinc-200/50 dark:border-zinc-800/50 pt-2">
                        <span className="text-zinc-500">GST Tax ({settings.gstRate}%)</span>
                        <span className="font-semibold">{formatCurrency(selectedOrder.estimate.gst || 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-zinc-200/70 dark:border-zinc-800/80 pt-2 text-sm font-extrabold text-zinc-950 dark:text-zinc-50">
                      <span>Grand Total</span>
                      <span>{formatCurrency(selectedOrder.estimate.total)}</span>
                    </div>
                  </div>
                  {selectedOrder.notes && (
                    <div className="bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded border border-zinc-150 dark:border-zinc-800 text-xs leading-relaxed text-zinc-600 dark:text-zinc-350 italic">
                      &ldquo;{selectedOrder.notes}&rdquo;
                    </div>
                  )}
                </div>

                {/* ── Section 3: Materials Checklist ── */}
                <div className="px-4 sm:px-6 py-5 space-y-3">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Scissors className="h-3.5 w-3.5" /> Materials Checklist
                  </h4>
                  {selectedOrder.materials.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic">No materials assigned for this order.</p>
                  ) : (
                    <div className="border border-zinc-150 dark:border-zinc-800 rounded-md overflow-hidden">
                      <Table>
                        <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                          <TableRow>
                            <TableHead className="py-2.5 text-xs text-zinc-400">Material</TableHead>
                            <TableHead className="py-2.5 text-xs text-zinc-400">Color</TableHead>
                            <TableHead className="py-2.5 text-xs text-zinc-400 text-center">Qty</TableHead>
                            <TableHead className="py-2.5 text-xs text-zinc-400 text-right">Unit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedOrder.materials.map((m, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="py-3 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                {m.material}
                                {m.notes && <span className="block font-normal text-[9px] text-zinc-400 italic">{m.notes}</span>}
                              </TableCell>
                              <TableCell className="py-3 text-xs text-zinc-500">{m.color || "—"}</TableCell>
                              <TableCell className="py-3 text-xs text-center font-bold">{m.quantity}</TableCell>
                              <TableCell className="py-3 text-xs text-right text-zinc-500">{m.unit}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* ── Section 4: Measurements ── */}
                <div className="px-4 sm:px-6 py-5">
                  <MeasurementCard
                    measurements={selectedOrder.measurements}
                    title={`Sizing Blueprint (${selectedOrder.sizeSetName || "Primary Measurements"})`}
                  />
                </div>

                {/* ── Section 5: Advance Production Stage ── */}
                {selectedOrder.status !== "Completed" && (
                  <div className="px-4 sm:px-6 py-5 space-y-3">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5" /> Advance Production Stage
                    </h4>
                    <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-4 rounded-md space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="statusNotes" className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Log Notes (Optional)</Label>
                        <Input
                          id="statusNotes"
                          placeholder="e.g. Needlework completed. Shifted to steam wash."
                          value={statusNotes}
                          onChange={(e) => setStatusNotes(e.target.value)}
                          className="h-9 bg-white dark:bg-zinc-950 text-xs"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {currentStatusIndex !== -1 && currentStatusIndex < STATUS_ORDER.length - 1 && (
                          <Button type="button" size="sm" onClick={handleAdvanceStatus} className="font-semibold text-xs">
                            Advance to &ldquo;{STATUS_ORDER[currentStatusIndex + 1]}&rdquo; <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Button>
                        )}
                        <div className="flex items-center gap-2 ml-auto">
                          <span className="text-[10px] text-zinc-400">Set stage:</span>
                          <Select value={selectedOrder.status} onValueChange={(val) => val && handleCustomStatusChange(val as OrderStatus)}>
                            <SelectTrigger className="h-8 w-40 bg-white dark:bg-zinc-950 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_ORDER.map((s) => (
                                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Section 6: Activity Timeline ── */}
                <div className="px-4 sm:px-6 py-5 space-y-3">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5" /> Workshop Timeline
                  </h4>
                  {orderActivities.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic">No activity logged yet.</p>
                  ) : (
                    <div className="flow-root pl-2">
                      <ul className="-mb-8">
                        {orderActivities.map((activity, idx) => (
                          <li key={activity.id}>
                            <div className="relative pb-8">
                              {idx !== orderActivities.length - 1 && (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />
                              )}
                              <div className="relative flex space-x-3">
                                <span className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-850 flex items-center justify-center shrink-0">
                                  <CheckCircle className="h-4 w-4 text-zinc-450" />
                                </span>
                                <div className="pt-1.5 flex-1 min-w-0">
                                  <div className="flex justify-between items-start gap-2">
                                    <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-100">Status: {activity.status}</p>
                                    <span className="text-[9px] text-zinc-400 font-mono shrink-0">
                                      {new Date(activity.timestamp).toLocaleDateString()} &bull; {new Date(activity.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-zinc-500 mt-1 leading-normal">{activity.notes}</p>
                                  <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Logged by: {activity.updatedBy}</p>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* ── Section 7: Payment Summary & Ledger ── */}
                <div id="payments-section" className="px-4 sm:px-6 py-5 space-y-4">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5" /> Payments &amp; Ledger
                  </h4>
                  {(() => {
                    const totalPaid = selectedOrder.payments.reduce((sum, p) => sum + p.amount, 0);
                    const balance = selectedOrder.estimate.total - totalPaid;
                    return (
                      <>
                        {/* Payment Summary */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border p-3 rounded-md">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total</span>
                            <p className="text-sm font-bold mt-1 text-zinc-950 dark:text-zinc-100">{formatCurrency(selectedOrder.estimate.total)}</p>
                          </div>
                          <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-3 rounded-md">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Received</span>
                            <p className="text-sm font-bold mt-1 text-emerald-700">{formatCurrency(totalPaid)}</p>
                          </div>
                          <div className="bg-amber-50/20 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 p-3 rounded-md">
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Due</span>
                            <p className="text-sm font-bold mt-1 text-amber-700">{formatCurrency(balance)}</p>
                          </div>
                        </div>

                        {/* Record Payment Form */}
                        {balance > 0.01 && (
                          <form onSubmit={handleAddPaymentSubmit} className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-4 rounded-md space-y-4">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Record New Payment</p>
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
                                <Select value={paymentMethod} onValueChange={(val) => val && setPaymentMethod(val as Payment["method"])}>
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
                                  placeholder="e.g. Balance paid"
                                  value={paymentNotes}
                                  onChange={(e) => setPaymentNotes(e.target.value)}
                                  className="h-9 bg-white dark:bg-zinc-950 text-xs"
                                />
                              </div>
                            </div>
                            {paymentError && <p className="text-[10px] text-red-500 font-semibold">{paymentError}</p>}
                            <Button type="submit" size="sm" className="font-semibold text-xs">
                              Record Payment Receipt
                            </Button>
                          </form>
                        )}

                        {/* Transaction Ledger Table */}
                        {selectedOrder.payments.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5" /> Transaction Ledger
                            </p>
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
                                      <TableCell className="py-3 text-zinc-500 max-w-[150px] truncate" title={p.notes}>{p.notes || "—"}</TableCell>
                                      <TableCell className="py-3 font-bold text-right text-emerald-700 dark:text-emerald-450">+{formatCurrency(p.amount)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}
                        {selectedOrder.payments.length === 0 && (
                          <p className="text-xs text-zinc-400 italic">No payment receipts logged yet.</p>
                        )}
                      </>
                    );
                  })()}
                </div>

              </div>
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

      {/* Bulk Order Details Modal */}
      {selectedBulkOrder && (
        <BulkOrderDetailModal
          order={selectedBulkOrder}
          isOpen={!!selectedBulkOrder}
          onClose={() => setSelectedBulkOrder(null)}
          onDelete={(ord: any) => handleRequestDelete('bulk', ord.id, ord.orderNumber, ord.client?.name || 'Client')}
          onRestore={(ord: any) => handleRestore('bulk', ord.id)}
        />
      )}

      {/* Bulk Order Lifecycle Modal */}
      {selectedBulkOrderForLifecycle && (
        <OrderLifecycleModal
          order={selectedBulkOrderForLifecycle}
          isOpen={!!selectedBulkOrderForLifecycle}
          onClose={() => setSelectedBulkOrderForLifecycle(null)}
          onUpdated={() => {
            fetchBulkOrders();
          }}
        />
      )}
      {/* Soft Delete Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={(open) => !open && setDeleteModalOpen(false)}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-6">
          <DialogHeader className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Move Order to Deleted History?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs text-zinc-600 dark:text-zinc-400">
            <p>
              Are you sure you want to soft-delete order{" "}
              <strong className="text-zinc-900 dark:text-zinc-100 font-mono">
                {orderToDelete?.orderNumber}
              </strong>{" "}
              for <strong className="text-zinc-900 dark:text-zinc-100">{orderToDelete?.clientName}</strong>?
            </p>
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 text-[11px] leading-relaxed text-zinc-500">
              🛡️ <strong>Soft-Delete Guarantee:</strong> This order will not be permanently lost. It will be moved to <strong>Deleted Orders History</strong> with full audit trail, where it can be reviewed and restored anytime.
            </div>

            <div className="space-y-1.5 pt-1">
              <Label htmlFor="delReason" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Reason for Deletion (Optional)
              </Label>
              <Input
                id="delReason"
                placeholder="e.g. Order cancelled by customer, duplicate entry..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="h-9 bg-zinc-50 dark:bg-zinc-950 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-150 dark:border-zinc-800 mt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteModalOpen(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="text-xs font-semibold gap-1.5 cursor-pointer bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Move to Deleted History
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
