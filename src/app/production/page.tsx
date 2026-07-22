"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useProductionStore } from "@/store/productionStore";
import { StatusBadge, MeasurementCard } from "@/components/shared/ReusableComponents";
import { Order, OrderStatus } from "@/types";
import { cn } from "@/lib/utils";
import {
  Scissors,
  ArrowRight,
  ClipboardCheck,
  Activity,
  User,
  Clock,
  CheckCircle,
  FileText,
  MessageSquare,
  Sparkles,
  Radio,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const LANES: OrderStatus[] = [
  "Material Received",
  "Cutting",
  "Stitching",
  "Embroidery",
  "QC",
  "Ready",
];

export default function ProductionBoard() {
  const { orders, activities, updateOrderStatus } = useProductionStore();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  // Advanced state form
  const [logNotes, setLogNotes] = useState("");
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  const activeOrders = useMemo(() => {
    return orders.filter((o) => o.status !== "Completed" && o.status !== "Delivered");
  }, [orders]);

  const selectedOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  // Aggregate counts per lane
  const laneCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    LANES.forEach((l) => {
      counts[l] = activeOrders.filter((o) => o.status === l).length;
    });
    return counts;
  }, [activeOrders]);

  // Group orders by lane
  const ordersByLane = useMemo(() => {
    const grouped: Record<OrderStatus, Order[]> = {
      "Material Received": [],
      "Cutting": [],
      "Stitching": [],
      "Embroidery": [],
      "QC": [],
      "Ready": [],
      "Delivered": [],
      "Completed": [],
    };
    activeOrders.forEach((o) => {
      if (o.status in grouped) {
        grouped[o.status].push(o);
      }
    });
    return grouped;
  }, [activeOrders]);

  const handleAdvance = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = LANES.indexOf(order.status);
    if (idx === -1 || idx === LANES.length - 1) return;
    
    setAdvancingId(order.id);
    setLogNotes("");
  };

  const submitAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advancingId) return;

    const order = orders.find((o) => o.id === advancingId);
    if (!order) return;

    const idx = LANES.indexOf(order.status);
    if (idx === -1 || idx === LANES.length - 1) return;

    const nextStatus = LANES[idx + 1];
    updateOrderStatus(order.id, nextStatus, logNotes.trim() || `Advanced to ${nextStatus}.`);
    
    setAdvancingId(null);
    setLogNotes("");
  };

  // Recent timeline across all orders
  const recentActivities = useMemo(() => {
    return activities.slice(0, 8);
  }, [activities]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Production Floor</h1>
          <p className="text-sm text-zinc-500 mt-1">Monitor real-time workflow progress of custom suits and garments.</p>
        </div>
        <Link href="/shop-floor">
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
            <Radio className="h-3.5 w-3.5 mr-1.5" /> Launch Shop Floor MES Tracker
          </Button>
        </Link>
      </div>

      {/* Production Stage Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {LANES.map((lane) => (
          <Card key={lane} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left py-3 px-4">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{lane}</span>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">{laneCounts[lane] || 0} Jobs</p>
          </Card>
        ))}
      </div>

      {/* Kanban Board + Sidebar Activity log */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* Kanban Board Column container */}
        <div className="xl:col-span-3 overflow-x-auto pb-4 scrollbar-thin">
          <div className="flex space-x-4 min-w-[1000px] h-[600px] items-start">
            {LANES.map((lane) => {
              const laneOrders = ordersByLane[lane] || [];
              return (
                <div key={lane} className="w-80 flex flex-col bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-3 border border-zinc-200/50 dark:border-zinc-850/60 max-h-full">
                  {/* Lane Title */}
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800 mb-3 px-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-450 dark:text-zinc-400">
                      {lane}
                    </span>
                    <span className="text-[11px] font-bold bg-zinc-200 dark:bg-zinc-850 px-2 py-0.5 rounded-full text-zinc-500">
                      {laneOrders.length}
                    </span>
                  </div>

                  {/* Lane Scroll Area */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                    {laneOrders.length === 0 ? (
                      <div className="text-center py-12 text-[10px] text-zinc-350 italic">No active orders here.</div>
                    ) : (
                      laneOrders.map((order) => {
                        const isOverdue =
                          new Date(order.deliveryDate).getTime() < new Date().getTime();
                        return (
                          <div
                            key={order.id}
                            onClick={() => setSelectedOrderId(order.id)}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850/80 p-4 rounded-md shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer space-y-3 relative group"
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-bold font-mono text-zinc-450">{order.orderNumber}</span>
                              <span className={cn("text-[9px] font-bold uppercase px-1 rounded", isOverdue ? "bg-red-50 text-red-600 dark:bg-red-950/20" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800")}>
                                {order.deliveryDate}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-bold text-xs text-zinc-950 dark:text-zinc-50 leading-tight">{order.customerName}</h4>
                              <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">
                                {order.products.map(p => `${p.quantity}x ${p.product}`).join(", ")}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80">
                              <StatusBadge status={order.paymentStatus} type="payment" />
                              
                              {/* Advance button */}
                              {lane !== "Ready" && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => handleAdvance(order, e)}
                                  className="h-7 w-7 rounded-full bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Advance Stage"
                                >
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent timeline logs sidebar */}
        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 self-start">
          <CardHeader className="pb-4">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              <span>Production Logs</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flow-root max-h-[500px] overflow-y-auto pr-1">
              <ul className="-mb-8">
                {recentActivities.map((activity, idx) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {idx !== recentActivities.length - 1 && (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-zinc-250 dark:bg-zinc-850" aria-hidden="true" />
                      )}
                      <div className="relative flex space-x-2.5">
                        <span className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-zinc-400" />
                        </span>
                        <div className="flex-1 min-w-0 pt-1.5">
                          <p className="text-[11px] text-zinc-650 dark:text-zinc-350 leading-normal">
                            <span className="font-bold text-zinc-900 dark:text-zinc-50">{activity.orderNumber}</span> updated to <span className="font-semibold text-zinc-800 dark:text-zinc-200">{activity.status}</span>.
                          </p>
                          {activity.notes && (
                            <p className="text-[10px] text-zinc-400 mt-1 italic leading-relaxed">&ldquo;{activity.notes}&rdquo;</p>
                          )}
                          <p className="text-[9px] text-zinc-400 mt-0.5">
                            {activity.updatedBy} &bull; {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advance Modal Sheet */}
      <Sheet open={advancingId !== null} onOpenChange={(open) => !open && setAdvancingId(null)}>
        <SheetContent showCloseButton={false} side="right" className="w-full sm:w-96 max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:border-none bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 p-0 flex flex-col justify-between h-full">
          <SheetHeader className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex flex-row items-center justify-between space-y-0">
            <SheetTitle className="text-base font-bold tracking-tight">Advance Production Phase</SheetTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setAdvancingId(null)}
              className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetHeader>
          {advancingId && (
            <form onSubmit={submitAdvance} className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Job Number</span>
                  <p className="text-sm font-semibold">
                    {orders.find((o) => o.id === advancingId)?.orderNumber} &mdash; {orders.find((o) => o.id === advancingId)?.customerName}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Advancement Stage</Label>
                  {(() => {
                    const order = orders.find((o) => o.id === advancingId);
                    if (!order) return null;
                    const idx = LANES.indexOf(order.status);
                    const current = order.status;
                    const next = LANES[idx + 1];
                    return (
                      <div className="flex items-center space-x-2 text-xs bg-zinc-50 dark:bg-zinc-950 p-3 rounded-md border">
                        <span className="font-semibold text-zinc-500">{current}</span>
                        <ArrowRight className="h-3 w-3 text-zinc-400" />
                        <span className="font-bold text-zinc-900 dark:text-white">{next}</span>
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="logNotes" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Activity Logs & Notes</Label>
                  <Input
                    id="logNotes"
                    placeholder="e.g. Cut pieces verified against measurements block."
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    className="h-10 text-xs bg-zinc-50 dark:bg-zinc-950 focus-visible:bg-white"
                  />
                  <p className="text-[9px] text-zinc-455">Add relevant details to keep the team informed on issues or progress.</p>
                </div>
              </div>

              <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-end space-x-2 shrink-0">
                <Button type="button" variant="outline" onClick={() => setAdvancingId(null)} className="font-semibold text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="font-semibold text-xs cursor-pointer">
                  Advance Phase
                </Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>

      {/* Production Card Inline Detail Sheet */}
      <Sheet open={selectedOrderId !== null} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <SheetContent showCloseButton={false} className="w-full sm:max-w-xl max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:border-none bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden flex flex-col h-full">
          {selectedOrder && (
            <>
              <SheetHeader className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex flex-row items-center justify-between space-y-0">
                <div>
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Floor Spec Card</span>
                  <SheetTitle className="text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
                    {selectedOrder.orderNumber} &mdash; {selectedOrder.customerName}
                  </SheetTitle>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedOrderId(null)}
                  className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                {/* Sizing Blueprint */}
                <MeasurementCard measurements={selectedOrder.measurements} title="Fittings Dimensions" />

                {/* Materials Checklist */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center">
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    <span>Materials Inventory</span>
                  </h4>
                  {selectedOrder.materials.length === 0 ? (
                    <p className="text-xs text-zinc-450 italic">No specific fabrics or materials assigned.</p>
                  ) : (
                    <div className="border rounded-md overflow-hidden dark:border-zinc-800">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-[10px] text-zinc-400 uppercase tracking-wider">
                            <th className="p-2.5">Material</th>
                            <th className="p-2.5 text-center">Qty</th>
                            <th className="p-2.5 text-right">Color</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800">
                          {selectedOrder.materials.map((m, index) => (
                            <tr key={index}>
                              <td className="p-2.5 font-semibold text-zinc-900 dark:text-zinc-100">{m.material}</td>
                              <td className="p-2.5 text-center font-bold">{m.quantity} {m.unit}</td>
                              <td className="p-2.5 text-right text-zinc-500">{m.color || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Products list */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center">
                    <Sparkles className="h-4 w-4 mr-2" />
                    <span>Garment item specifications</span>
                  </h4>
                  <div className="border rounded-md overflow-hidden dark:border-zinc-800">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-[10px] text-zinc-400 uppercase tracking-wider">
                          <th className="p-2.5">Garment</th>
                          <th className="p-2.5 text-center">Qty</th>
                          <th className="p-2.5 text-right">Stitch Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800">
                        {selectedOrder.products.map((p, index) => (
                          <tr key={index}>
                            <td className="p-2.5 font-semibold text-zinc-900 dark:text-zinc-100">
                              {p.product}
                              {p.notes && <span className="block font-normal text-[10px] text-zinc-400 mt-0.5">{p.notes}</span>}
                            </td>
                            <td className="p-2.5 text-center font-bold">{p.quantity}</td>
                            <td className="p-2.5 text-right text-zinc-500">{p.stitchType}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Design instructions</h4>
                    <p className="bg-zinc-50 dark:bg-zinc-900/40 p-3 border rounded text-zinc-650 dark:text-zinc-350 italic">
                      &ldquo;{selectedOrder.notes}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
