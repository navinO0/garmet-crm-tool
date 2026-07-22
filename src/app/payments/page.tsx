"use client";

import React, { useState, useMemo } from "react";
import { useProductionStore } from "@/store/productionStore";
import { StatusBadge, EmptyState } from "@/components/shared/ReusableComponents";
import { Payment, Order } from "@/types";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PaymentsPage() {
  const { orders, payments, settings, addPayment } = useProductionStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);

  // New Payment Form State
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Payment["method"]>("Cash");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalBilled = orders.reduce((sum, o) => sum + o.estimate.total, 0);
    const outstanding = Math.max(0, totalBilled - totalRevenue);

    return {
      totalBilled,
      totalRevenue,
      outstanding,
    };
  }, [orders, payments]);

  // Orders with remaining balances for the dropdown
  const ordersWithBalances = useMemo(() => {
    return orders
      .map((o) => {
        const paid = o.payments.reduce((sum, p) => sum + p.amount, 0);
        const balance = o.estimate.total - paid;
        return {
          ...o,
          balance,
        };
      })
      .filter((o) => o.balance > 0.01);
  }, [orders]);

  // Selected Order details for the payment form
  const selectedOrderObj = useMemo(() => {
    return ordersWithBalances.find((o) => o.id === selectedOrderId) || null;
  }, [ordersWithBalances, selectedOrderId]);

  // When order changes in form, prefill the remaining balance in amount
  const handleOrderChangeInForm = (orderId: string) => {
    setSelectedOrderId(orderId);
    const ord = ordersWithBalances.find((o) => o.id === orderId);
    if (ord) {
      setAmount(ord.balance.toFixed(2));
    } else {
      setAmount("");
    }
  };

  // Filtered Payments List
  const filteredPayments = useMemo(() => {
    return payments
      .filter((p) => {
        const matchSearch =
          p.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchMethod = methodFilter === "ALL" || p.method === methodFilter;

        return matchSearch && matchMethod;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, searchQuery, methodFilter]);

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedOrderId) {
      setFormError("Please select an order.");
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError("Amount must be a positive number.");
      return;
    }

    if (selectedOrderObj && amt > selectedOrderObj.balance + 0.01) {
      setFormError(`Amount cannot exceed the remaining balance of ${settings.currencySymbol}${selectedOrderObj.balance.toFixed(2)}.`);
      return;
    }

    addPayment(selectedOrderId, amt, method, notes.trim() || undefined);
    
    // Reset Form
    setSelectedOrderId("");
    setAmount("");
    setMethod("Cash");
    setNotes("");
    setModalOpen(false);
  };

  const formatCurrency = (val: number) => {
    return `${settings.currencySymbol}${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Payments</h1>
          <p className="text-sm text-zinc-500 mt-1">Track financial inflows, deposit logs, and outstanding receivables.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="font-semibold tracking-tight cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left p-6">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Booked Value</span>
            <Layers className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-2">{formatCurrency(metrics.totalBilled)}</p>
          <p className="text-[10px] text-zinc-400 mt-1">Sum of all signed orders contract values</p>
        </Card>

        <Card className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 text-left p-6">
          <div className="flex items-center justify-between text-emerald-650">
            <span className="text-xs font-bold uppercase tracking-wider">Deposits Collected</span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-450 mt-2">{formatCurrency(metrics.totalRevenue)}</p>
          <p className="text-[10px] text-emerald-555 mt-1">Actual cash-in-hand received</p>
        </Card>

        <Card className="bg-amber-50/20 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 text-left p-6">
          <div className="flex items-center justify-between text-amber-655">
            <span className="text-xs font-bold uppercase tracking-wider">Outstanding Receivables</span>
            <DollarSign className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-amber-705 mt-2">{formatCurrency(metrics.outstanding)}</p>
          <p className="text-[10px] text-amber-555 mt-1">Remaining balances due for delivery</p>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white dark:bg-zinc-900 p-4 rounded-md border border-zinc-200 dark:border-zinc-800">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search transactions by client name, order number, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus-visible:bg-white text-sm"
          />
        </div>
        <div>
          <Select value={methodFilter} onValueChange={(val) => setMethodFilter(val || "ALL")}>
            <SelectTrigger className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs">
              <SelectValue placeholder="All Methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Methods</SelectItem>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Card">Credit Card</SelectItem>
              <SelectItem value="Bank Transfer">Bank Wire</SelectItem>
              <SelectItem value="UPI">UPI / QR Code</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transaction Ledger List */}
      {filteredPayments.length === 0 ? (
        <EmptyState
          title="No Transactions Logged"
          description={searchQuery || methodFilter !== "ALL" ? "Try adjusting your filters or search terms." : "Payments ledger is currently empty."}
          actionText={methodFilter === "ALL" && !searchQuery ? "Record Payment" : undefined}
          onAction={methodFilter === "ALL" && !searchQuery ? () => setModalOpen(true) : undefined}
        />
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden">
          {/* Desktop view */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-zinc-500">Receipt Date</TableHead>
                  <TableHead className="font-bold text-zinc-500">Order</TableHead>
                  <TableHead className="font-bold text-zinc-500">Client Profile</TableHead>
                  <TableHead className="font-bold text-zinc-500">Method</TableHead>
                  <TableHead className="font-bold text-zinc-500">Memo / Notes</TableHead>
                  <TableHead className="font-bold text-zinc-500 text-right">Amount Collected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((p) => (
                  <TableRow key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                    <TableCell className="text-zinc-500 flex items-center gap-1.5 py-4">
                      <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                      <span>{new Date(p.date).toLocaleDateString()}</span>
                    </TableCell>
                    <TableCell className="font-bold text-zinc-900 dark:text-zinc-100">
                      {p.orderNumber}
                    </TableCell>
                    <TableCell className="font-semibold text-zinc-700 dark:text-zinc-350">{p.customerName}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center text-xs font-medium text-zinc-650 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-350 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                        <CreditCard className="mr-1.5 h-3 w-3 text-zinc-450" />
                        {p.method}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-500 text-xs italic max-w-[200px] truncate" title={p.notes}>
                      {p.notes || "-"}
                    </TableCell>
                    <TableCell className="font-bold text-right text-emerald-700 dark:text-emerald-450">
                      +{formatCurrency(p.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile view */}
          <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredPayments.map((p) => (
              <div key={p.id} className="p-4 space-y-2 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-mono font-semibold">{p.orderNumber}</span>
                    <h4 className="font-bold text-sm text-zinc-950 dark:text-zinc-100 mt-0.5">{p.customerName}</h4>
                  </div>
                  <span className="font-bold text-sm text-emerald-700 dark:text-emerald-450">
                    +{formatCurrency(p.amount)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[10px] text-zinc-455 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60">
                  <span className="flex items-center"><Calendar className="h-3 w-3 mr-1 text-zinc-400" /> {new Date(p.date).toLocaleDateString()}</span>
                  <span className="bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 border px-1.5 py-0.2 rounded font-semibold text-zinc-655">{p.method}</span>
                </div>
                
                {p.notes && <p className="text-[10px] text-zinc-400 italic">Notes: {p.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Payment Dialog Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-full max-w-md max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-6 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-zinc-950 dark:text-zinc-50 font-bold tracking-tight">Record Receipt</DialogTitle>
          </DialogHeader>

          {ordersWithBalances.length === 0 ? (
            <p className="text-xs text-zinc-450 italic text-center py-6">All active orders are paid in full.</p>
          ) : (
            <form onSubmit={handleAddPaymentSubmit} className="space-y-4 pt-2 text-xs">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Select Active Order *</Label>
                <Select value={selectedOrderId} onValueChange={(val) => val && handleOrderChangeInForm(val)}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Select order number..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {ordersWithBalances.map((o) => (
                      <SelectItem key={o.id} value={o.id} className="text-xs">
                        {o.orderNumber} &mdash; {o.customerName} (Due: {formatCurrency(o.balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOrderObj && (
                <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-md border border-zinc-150 dark:border-zinc-800/80 leading-normal text-[11px] text-zinc-600 dark:text-zinc-350">
                  <p>Client: <span className="font-semibold text-zinc-800 dark:text-zinc-100">{selectedOrderObj.customerName}</span></p>
                  <p className="mt-1">Contract Total: <span className="font-semibold">{formatCurrency(selectedOrderObj.estimate.total)}</span></p>
                  <p className="mt-1">Remaining Balance: <span className="font-bold text-amber-650">{formatCurrency(selectedOrderObj.balance)}</span></p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="paymentAmount" className="text-[10px] font-bold uppercase tracking-wider text-zinc-455">Amount ({settings.currencySymbol}) *</Label>
                  <NumberInput
                    id="paymentAmount"
                    value={amount}
                    onChange={(val) => setAmount(val ? String(val) : "")}
                    className="h-10 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Payment Method</Label>
                  <Select value={method} onValueChange={(val) => val && setMethod(val as any)}>
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Card">Credit Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Wire</SelectItem>
                      <SelectItem value="UPI">UPI / QR Code</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-[10px] font-bold uppercase tracking-wider text-zinc-455">Transaction Memo / Notes</Label>
                <Input
                  id="notes"
                  placeholder="e.g. Deposit check clearing #204"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              {formError && <p className="text-[10px] text-red-500 font-semibold">{formError}</p>}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-150 dark:border-zinc-800">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="font-semibold text-xs h-9">
                  Cancel
                </Button>
                <Button type="submit" className="font-semibold text-xs h-9 cursor-pointer">
                  Log Receipt
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
