"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useProductionStore } from "@/store/productionStore";
import { MetricCard, ChartCard } from "@/components/shared/ReusableComponents";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Wrench,
  Percent,
  Clock,
  CheckCircle,
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
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReportsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { orders, payments, customers, settings } = useProductionStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatCurrency = (val: number) => {
    return `${settings.currencySymbol}${val.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  // 1. Calculate Financial metrics & trends
  const financialMetrics = useMemo(() => {
    const grossSales = orders.reduce((sum, o) => sum + o.estimate.total, 0);
    const collected = payments.reduce((sum, p) => sum + p.amount, 0);
    const outstanding = Math.max(0, grossSales - collected);
    
    // Average Order Value
    const aov = orders.length > 0 ? grossSales / orders.length : 0;
    
    return {
      grossSales,
      collected,
      outstanding,
      aov,
    };
  }, [orders, payments]);

  // Aggregate monthly revenue (gross vs collected)
  const monthlyRevenueData = useMemo(() => {
    const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    
    // Base static data + store increments
    const gross = { Feb: 15000, Mar: 18000, Apr: 13000, May: 22000, Jun: 28000, Jul: 0 };
    const collected = { Feb: 12000, Mar: 14500, Apr: 11000, May: 18000, Jun: 24000, Jul: 0 };
    
    // Process store orders (gross)
    orders.forEach((o) => {
      const m = new Date(o.createdAt).toLocaleString("en-US", { month: "short" });
      if (m in gross) {
        // @ts-ignore
        gross[m] += o.estimate.total;
      }
    });

    // Process store payments (collected)
    payments.forEach((p) => {
      const m = new Date(p.date).toLocaleString("en-US", { month: "short" });
      if (m in collected) {
        // @ts-ignore
        collected[m] += p.amount;
      }
    });

    return months.map((m) => ({
      name: m,
      "Gross Billed": gross[m as keyof typeof gross] || 0,
      "Cash Collected": collected[m as keyof typeof collected] || 0,
    }));
  }, [orders, payments]);

  // 2. Orders & Products data
  const orderProductData = useMemo(() => {
    // Garment category distribution
    const categories: Record<string, number> = {
      "Suits & Jackets": 4,
      "Evening Gowns": 6,
      "Casual Shirts": 8,
      "Bridal Couture": 2,
      "Skirts & Blouses": 5,
    };

    // Increment with current orders
    orders.forEach((o) => {
      o.products.forEach((p) => {
        const prodName = p.product.toLowerCase();
        if (prodName.includes("suit") || prodName.includes("jacket") || prodName.includes("tuxedo")) {
          categories["Suits & Jackets"] += p.quantity;
        } else if (prodName.includes("gown") || prodName.includes("dress") && !prodName.includes("wedding")) {
          categories["Evening Gowns"] += p.quantity;
        } else if (prodName.includes("shirt")) {
          categories["Casual Shirts"] += p.quantity;
        } else if (prodName.includes("wedding") || prodName.includes("bridal")) {
          categories["Bridal Couture"] += p.quantity;
        } else {
          categories["Skirts & Blouses"] += p.quantity;
        }
      });
    });

    const PIE_COLORS = ["#18181b", "#71717a", "#a1a1aa", "#d4d4d8", "#e4e4e7"];
    const categoryChart = Object.entries(categories).map(([name, value], index) => ({
      name,
      value,
      color: PIE_COLORS[index % PIE_COLORS.length],
    }));

    // Monthly orders count
    const monthlyCount = { Feb: 10, Mar: 14, Apr: 11, May: 18, Jun: 22, Jul: 0 };
    orders.forEach((o) => {
      const m = new Date(o.createdAt).toLocaleString("en-US", { month: "short" });
      if (m in monthlyCount) {
        // @ts-ignore
        monthlyCount[m] += 1;
      }
    });

    const ordersTrendChart = Object.entries(monthlyCount).map(([name, count]) => ({
      name,
      Orders: count,
    }));

    return {
      categoryChart,
      ordersTrendChart,
    };
  }, [orders]);

  // 3. Customer Growth & retention metrics
  const customerMetrics = useMemo(() => {
    const totalCustomers = customers.length;
    
    // Repeat customer calculation
    // Customers with > 1 order
    const customerOrderCounts: Record<string, number> = {};
    orders.forEach((o) => {
      customerOrderCounts[o.customerId] = (customerOrderCounts[o.customerId] || 0) + 1;
    });

    const repeatCustomers = Object.values(customerOrderCounts).filter((cnt) => cnt > 1).length;
    const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    // Monthly signups
    const signups = { Feb: 3, Mar: 5, Apr: 4, May: 6, Jun: 8, Jul: 0 };
    customers.forEach((c) => {
      const m = new Date(c.createdAt).toLocaleString("en-US", { month: "short" });
      if (m in signups) {
        // @ts-ignore
        signups[m] += 1;
      }
    });

    const signupsChart = Object.entries(signups).map(([name, count]) => ({
      name,
      Clients: count,
    }));

    return {
      totalCustomers,
      repeatRate,
      signupsChart,
    };
  }, [customers, orders]);

  // 4. Production Efficiency data (Avg stage durations in days)
  const productionDurationChart = [
    { name: "Material Recv", Days: 1.5 },
    { name: "Cutting Block", Days: 1.2 },
    { name: "Needle Stitch", Days: 4.8 },
    { name: "Embroidery Division", Days: 3.5 },
    { name: "QC Checks", Days: 1.0 },
    { name: "Ready / Pack", Days: 0.8 },
  ];

  const handleExportCSV = () => {
    const headers = ["Order Number", "Customer", "Status", "Total Amount", "Payment Status", "Delivery Date", "Created At"];
    const rows = orders.map((o) => [
      o.orderNumber,
      `"${o.customerName}"`,
      o.status,
      o.estimate.total,
      o.paymentStatus,
      o.deliveryDate,
      o.createdAt,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `garment_production_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">Review operational performance, billing metrics, and production efficiency.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold rounded-md shadow-sm transition-all"
        >
          Export CSV Report
        </button>
      </div>

      <Tabs defaultValue="financials" className="space-y-6">
        <TabsList className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 h-11 space-x-1 justify-start">
          <TabsTrigger value="financials" className="text-xs font-bold px-4 py-2 uppercase tracking-wide">
            Financials
          </TabsTrigger>
          <TabsTrigger value="orders" className="text-xs font-bold px-4 py-2 uppercase tracking-wide">
            Orders & Products
          </TabsTrigger>
          <TabsTrigger value="customers" className="text-xs font-bold px-4 py-2 uppercase tracking-wide">
            Customers
          </TabsTrigger>
          <TabsTrigger value="production" className="text-xs font-bold px-4 py-2 uppercase tracking-wide">
            Production Speed
          </TabsTrigger>
        </TabsList>

        {/* Financials Tab */}
        <TabsContent value="financials" className="space-y-6 mt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Gross Billed Sales"
              value={formatCurrency(financialMetrics.grossSales)}
              change={18}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <MetricCard
              title="Cash Collected"
              value={formatCurrency(financialMetrics.collected)}
              change={22}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <MetricCard
              title="Awaiting Cash"
              value={formatCurrency(financialMetrics.outstanding)}
              change={-8}
              icon={<DollarSign className="h-4 w-4 animate-pulse" />}
            />
            <MetricCard
              title="Avg Order Value"
              value={formatCurrency(financialMetrics.aov)}
              change={5}
              icon={<ShoppingBag className="h-4 w-4" />}
            />
          </div>

          <div className="grid grid-cols-1">
            <ChartCard title="Inflow Statement" description="Comparing gross customer billings vs cash received monthly">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
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
                        borderRadius: "0px",
                      }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                    <Area
                      type="monotone"
                      dataKey="Gross Billed"
                      stroke="#71717a"
                      strokeWidth={2}
                      fillOpacity={0.05}
                      fill="#71717a"
                    />
                    <Area
                      type="monotone"
                      dataKey="Cash Collected"
                      stroke="#18181b"
                      strokeWidth={2.5}
                      fillOpacity={0.1}
                      fill="#18181b"
                      className="dark:stroke-zinc-150"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
              )}
            </ChartCard>
          </div>
        </TabsContent>

        {/* Orders & Products Tab */}
        <TabsContent value="orders" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChartCard title="Orders Placed" description="Monthly count of newly registered tailor bookings">
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={orderProductData.ordersTrendChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          borderColor: "var(--border)",
                          borderRadius: "0px",
                        }}
                      />
                      <Bar dataKey="Orders" fill="#18181b" radius={0} className="dark:fill-zinc-300">
                        {orderProductData.ordersTrendChart.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={idx === orderProductData.ordersTrendChart.length - 1 ? "#3b82f6" : "var(--foreground)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
                )}
              </ChartCard>
            </div>

            <div>
              <ChartCard title="Product Categories" description="Volume breakdown of orders by garment category">
                {isMounted ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={orderProductData.categoryChart}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {orderProductData.categoryChart.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--card)",
                              borderColor: "var(--border)",
                              borderRadius: "0px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 w-full text-left">
                      {orderProductData.categoryChart.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-[10px]">
                          <span className="flex items-center text-zinc-555 truncate">
                            <span className="inline-block h-2 w-2 rounded-full mr-1.5 shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="truncate">{item.name}</span>
                          </span>
                          <span className="font-bold ml-2 shrink-0">{item.value} units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
                )}
              </ChartCard>
            </div>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Registered Clients"
              value={customerMetrics.totalCustomers}
              change={12}
              icon={<Users className="h-4 w-4" />}
            />
            <MetricCard
              title="Repeat Client Rate"
              value={`${customerMetrics.repeatRate.toFixed(1)}%`}
              change={4}
              icon={<Percent className="h-4 w-4" />}
            />
            <MetricCard
              title="Active Bookings Ratio"
              value="82.4%"
              change={1}
              icon={<ShoppingBag className="h-4 w-4" />}
            />
          </div>

          <div className="grid grid-cols-1">
            <ChartCard title="New Customer Acquisitions" description="Monthly signup timeline trend">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={customerMetrics.signupsChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: "0px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Clients"
                      stroke="var(--foreground)"
                      strokeWidth={2.5}
                      dot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
              )}
            </ChartCard>
          </div>
        </TabsContent>

        {/* Production Speed Tab */}
        <TabsContent value="production" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Avg Delivery Speed"
              value="12.4 Days"
              change={-15} // negative is good for duration!
              timeframe="improved from last month"
              icon={<Clock className="h-4 w-4" />}
            />
            <MetricCard
              title="QC Pass Rate"
              value="98.2%"
              change={1.2}
              icon={<CheckCircle className="h-4 w-4" />}
            />
            <MetricCard
              title="Workshop Backlog"
              value="5 Active"
              change={-20}
              icon={<Wrench className="h-4 w-4" />}
            />
          </div>

          <div className="grid grid-cols-1">
            <ChartCard title="Bottleneck Analysis" description="Average calendar days spent in each workshop stage">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productionDurationChart} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                    <XAxis type="number" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: "0px",
                      }}
                      formatter={(val) => [`${val} Days`, "Avg Duration"]}
                    />
                    <Bar dataKey="Days" fill="var(--foreground)" radius={0} maxBarSize={30}>
                      {productionDurationChart.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.Days > 4 ? "#ef4444" : entry.Days > 2 ? "#eab308" : "var(--foreground)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
              )}
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
