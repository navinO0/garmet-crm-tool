"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useProductionStore } from "@/store/productionStore";
import { cn } from "@/lib/utils";
import { MetricCard, ChartCard, StatusBadge } from "@/components/shared/ReusableComponents";
import {
  ShoppingBag,
  Clock,
  Wrench,
  CheckCircle,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  User,
  Activity,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const { orders, payments, activities, settings } = useProductionStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Compute metrics from real state
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status !== "Completed" && o.status !== "Delivered").length;
    const inProduction = orders.filter((o) =>
      ["Cutting", "Stitching", "Embroidery", "QC"].includes(o.status)
    ).length;
    const delivered = orders.filter((o) => ["Delivered", "Completed"].includes(o.status)).length;
    
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalEstimated = orders.reduce((sum, o) => sum + o.estimate.total, 0);
    const pendingPayments = Math.max(0, totalEstimated - totalRevenue);

    return {
      totalOrders,
      pendingOrders,
      inProduction,
      delivered,
      totalRevenue,
      pendingPayments,
    };
  }, [orders, payments]);

  // Compute recent orders
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [orders]);

  // Compute upcoming deliveries (not completed/delivered, sorted by date ascending)
  const upcomingDeliveries = useMemo(() => {
    return orders
      .filter((o) => o.status !== "Completed" && o.status !== "Delivered")
      .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
      .slice(0, 5);
  }, [orders]);

  // Compute charts data
  const chartsData = useMemo(() => {
    // 1. Monthly Revenue
    // Let's aggregate payments by month
    const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    const baseRevenue = { Feb: 12000, Mar: 14500, Apr: 11000, May: 18000, Jun: 24000, Jul: 0 };
    
    // Add real payments to June/July depending on payment date
    payments.forEach((p) => {
      const date = new Date(p.date);
      const m = date.toLocaleString("en-US", { month: "short" });
      if (m in baseRevenue) {
        // @ts-ignore
        baseRevenue[m] += p.amount;
      } else if (m === "Jul") {
        baseRevenue["Jul"] += p.amount;
      }
    });

    const revenueChart = Object.entries(baseRevenue).map(([name, value]) => ({
      name,
      Revenue: value,
    }));

    // 2. Orders Chart (number of orders created per month)
    const baseOrdersCount = { Feb: 8, Mar: 12, Apr: 10, May: 15, Jun: 20, Jul: 0 };
    orders.forEach((o) => {
      const date = new Date(o.createdAt);
      const m = date.toLocaleString("en-US", { month: "short" });
      if (m in baseOrdersCount) {
        // @ts-ignore
        baseOrdersCount[m] += 1;
      } else if (m === "Jul") {
        baseOrdersCount["Jul"] += 1;
      }
    });

    const ordersChart = Object.entries(baseOrdersCount).map(([name, count]) => ({
      name,
      Orders: count,
    }));

    // 3. Production Status count
    const statusCounts: Record<string, number> = {
      "Received": 0,
      "Cutting": 0,
      "Stitching": 0,
      "Embroidery": 0,
      "QC": 0,
      "Ready": 0,
    };

    orders.forEach((o) => {
      if (o.status === "Material Received") statusCounts["Received"] += 1;
      else if (o.status in statusCounts) {
        statusCounts[o.status] += 1;
      }
    });

    const COLORS = ["#64748b", "#71717a", "#3b82f6", "#a855f7", "#f59e0b", "#6366f1"];
    const productionChart = Object.entries(statusCounts).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length],
    })).filter(item => item.value > 0);

    return {
      revenueChart,
      ordersChart,
      productionChart,
    };
  }, [orders, payments]);

  // Format currencies
  const formatCurrency = (val: number) => {
    return `${settings.currencySymbol}${val.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Row */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            Atelier Production System
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time shop floor and financial health status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/orders/new">
            <Button className="font-semibold tracking-tight shadow-sm cursor-pointer">
              Create New Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Total Orders"
          value={metrics.totalOrders}
          change={12}
          icon={<ShoppingBag className="h-4 w-4" />}
        />
        <MetricCard
          title="Pending Orders"
          value={metrics.pendingOrders}
          change={-5}
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricCard
          title="In Production"
          value={metrics.inProduction}
          change={8}
          icon={<Wrench className="h-4 w-4" />}
        />
        <MetricCard
          title="Delivered"
          value={metrics.delivered}
          change={20}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <MetricCard
          title="Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          change={15}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricCard
          title="Unpaid Balance"
          value={formatCurrency(metrics.pendingPayments)}
          change={-2}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      {/* Market Garment Production System Execution Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-950 via-zinc-900 to-zinc-900 text-white border border-emerald-800/40 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Shop Floor Execution (MES)
            </span>
            <h3 className="text-lg font-bold text-zinc-100">Live Sewing Line Monitor & Bundle Control</h3>
            <p className="text-xs text-zinc-400">Track 3 sewing lines, operator SAM targets & bundle tickets.</p>
          </div>
          <Link href="/shop-floor">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap">
              Shop Floor MES <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="p-5 rounded-xl bg-gradient-to-r from-blue-950 via-zinc-900 to-zinc-900 text-white border border-blue-800/40 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Apparel Inventory & BOM
            </span>
            <h3 className="text-lg font-bold text-zinc-100">Fabric Stock Ledger & Lay Plan Estimator</h3>
            <p className="text-xs text-zinc-400">Calculate fabric roll meters & trim stock thresholds.</p>
          </div>
          <Link href="/inventory">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap">
              Inventory Ledger <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2">
          <ChartCard title="Revenue Trend" description="Combined monthly deposit & balance payments">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartsData.revenueChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#18181b" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${settings.currencySymbol}${val / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "6px",
                      color: "var(--foreground)",
                      fontSize: "12px",
                    }}
                    formatter={(val) => [`${settings.currencySymbol}${Number(val).toLocaleString()}`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="Revenue"
                    stroke="#18181b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#revenueColor)"
                    className="dark:stroke-zinc-150"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-zinc-50 dark:bg-zinc-800 animate-pulse rounded-md" />
            )}
          </ChartCard>
        </div>

        {/* Production Status Pie Chart */}
        <div>
          <ChartCard title="Orders in Production" description="Active workshop stages distribution">
            {isMounted ? (
              chartsData.productionChart.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                  No orders in cutting/stitching/QC
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartsData.productionChart}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartsData.productionChart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            borderColor: "var(--border)",
                            borderRadius: "6px",
                            fontSize: "11px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 w-full">
                    {chartsData.productionChart.map((item) => (
                      <div key={item.name} className="flex flex-col items-center justify-center text-center">
                        <span className="flex items-center text-[10px] font-medium text-zinc-555">
                          <span
                            className="inline-block h-2 w-2 rounded-full mr-1"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.name}
                        </span>
                        <span className="text-xs font-bold mt-0.5">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : (
              <div className="h-full w-full bg-zinc-50 dark:bg-zinc-800 animate-pulse rounded-md" />
            )}
          </ChartCard>
        </div>
      </div>

      {/* Dashboard Widgets Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List Widget */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold tracking-tight">Recent Orders</CardTitle>
                <p className="text-xs text-zinc-400 mt-1">Recently created custom garment jobs.</p>
              </div>
              <Link href="/orders">
                <Button variant="ghost" size="sm" className="text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {recentOrders.map((order) => (
                  <div key={order.id} className="p-4 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-600 dark:text-zinc-350">
                        {order.orderNumber.replace("ORD-", "")}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {order.customerName}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {order.products.map((p) => `${p.quantity}x ${p.product}`).join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                          {formatCurrency(order.estimate.total)}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side panels: Upcoming Deliveries & Production activities */}
        <div className="space-y-6">
          {/* Upcoming Deliveries Widget */}
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-zinc-400" />
                <span>Upcoming Deliveries</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {upcomingDeliveries.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-450 italic">No upcoming deliveries.</div>
                ) : (
                  upcomingDeliveries.map((order) => {
                    const daysLeft = Math.ceil(
                      (new Date(order.deliveryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
                    );
                    const isUrgent = daysLeft <= 3;
                    return (
                      <div key={order.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{order.customerName}</p>
                          <p className="text-[10px] text-zinc-400 truncate w-36 mt-0.5">
                            {order.products.map((p) => p.product).join(", ")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold">{order.deliveryDate}</p>
                          <span
                            className={cn(
                              "inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5",
                              isUrgent
                                ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                            )}
                          >
                            {daysLeft < 0 ? "Overdue" : daysLeft === 0 ? "Today" : `${daysLeft} days left`}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent activities widget */}
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
                <Activity className="h-4 w-4 text-zinc-400" />
                <span>Production Logs</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="flow-root">
                <ul className="-mb-8">
                  {activities.slice(0, 4).map((activity, actIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {actIdx !== activities.slice(0, 4).length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-zinc-200 dark:bg-zinc-800"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                              <User className="h-4 w-4 text-zinc-555" />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5">
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">
                              <span className="font-semibold text-zinc-850 dark:text-zinc-100">
                                {activity.orderNumber}
                              </span>{" "}
                              updated to{" "}
                              <span className="font-medium text-zinc-800 dark:text-zinc-250">
                                {activity.status}
                              </span>
                            </p>
                            <p className="text-[9px] text-zinc-450 mt-0.5">
                              {activity.updatedBy} &bull;{" "}
                              {new Date(activity.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
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
      </div>
    </div>
  );
}
