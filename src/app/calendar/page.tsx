"use client";

import React, { useState, useMemo } from "react";
import { useProductionStore } from "@/store/productionStore";
import { StatusBadge } from "@/components/shared/ReusableComponents";
import { Order } from "@/types";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  ShoppingBag,
  Bell,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const { orders } = useProductionStore();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 22)); // July 22, 2026 to fit mock timeline dates
  const [selectedDayOrders, setSelectedDayOrders] = useState<Order[] | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState("");

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 6, 22));
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();

    // Pad beginning
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    // Actual days
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(currentYear, currentMonth, d));
    }

    // Pad end to make full rows of 7
    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }, [currentYear, currentMonth]);

  // Map orders to date strings (YYYY-MM-DD)
  const ordersByDate = useMemo(() => {
    const map: Record<string, Order[]> = {};
    orders.forEach((o) => {
      const dateStr = o.deliveryDate; // YYYY-MM-DD format
      if (!map[dateStr]) {
        map[dateStr] = [];
      }
      map[dateStr].push(o);
    });
    return map;
  }, [orders]);

  const monthLabel = currentDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const handleDayClick = (day: Date, dayOrders: Order[]) => {
    if (dayOrders.length === 0) return;
    setSelectedDayOrders(dayOrders);
    setSelectedDateStr(day.toLocaleDateString("en-US", { dateStyle: "full" }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Calendar</h1>
          <p className="text-sm text-zinc-500 mt-1">Plan workshop activities and monitor target delivery deadlines.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleToday} className="font-semibold text-xs h-9">
            Today
          </Button>
          <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-9 w-9 rounded-none border-r">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-9 w-9 rounded-none">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Month Header Label */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-md flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-zinc-400" />
          <span>{monthLabel}</span>
        </h2>
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Target Deadlines</span>
      </div>

      {/* Calendar Grid Container */}
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-center py-2.5">
            {WEEKDAYS.map((day) => (
              <span key={day} className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-zinc-200 dark:divide-zinc-800 border-l border-t border-transparent">
            {calendarDays.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="bg-zinc-50/40 dark:bg-zinc-950/20 min-h-[100px] sm:min-h-[120px]" />;
              }

              const dateStr = day.toISOString().split("T")[0];
              const dayOrders = ordersByDate[dateStr] || [];
              const isToday =
                day.getDate() === 22 && day.getMonth() === 6 && day.getFullYear() === 2026;

              return (
                <div
                  key={dateStr}
                  onClick={() => handleDayClick(day, dayOrders)}
                  className={cn(
                    "min-h-[100px] sm:min-h-[120px] p-2 flex flex-col justify-between transition-colors relative group",
                    dayOrders.length > 0
                      ? "cursor-pointer hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10"
                      : "",
                    isToday ? "bg-blue-50/20 dark:bg-blue-950/10" : ""
                  )}
                >
                  {/* Day Number */}
                  <div className="flex justify-between items-center">
                    <span
                      className={cn(
                        "text-xs font-bold font-mono h-6 w-6 rounded-full flex items-center justify-center",
                        isToday
                          ? "bg-blue-600 text-white font-extrabold"
                          : "text-zinc-500 dark:text-zinc-400"
                      )}
                    >
                      {day.getDate()}
                    </span>
                    {dayOrders.length > 0 && (
                      <span className="text-[9px] font-bold text-zinc-400 font-mono hidden sm:inline">
                        {dayOrders.length} {dayOrders.length === 1 ? "Job" : "Jobs"}
                      </span>
                    )}
                  </div>

                  {/* Day events (Orders list) */}
                  <div className="flex-1 mt-1 space-y-1 overflow-hidden max-h-[70px]">
                    {dayOrders.slice(0, 2).map((order) => (
                      <div
                        key={order.id}
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded border leading-tight truncate w-full",
                          order.status === "Ready" || order.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30"
                            : "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30"
                        )}
                        title={`${order.orderNumber} - ${order.customerName}`}
                      >
                        {order.orderNumber.replace("ORD-", "")} &bull; {order.customerName.split(" ")[0]}
                      </div>
                    ))}
                    {dayOrders.length > 2 && (
                      <div className="text-[8px] font-bold text-zinc-455 text-center bg-zinc-50 dark:bg-zinc-800 rounded border">
                        +{dayOrders.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Day Detail Dialog */}
      <Dialog open={selectedDayOrders !== null} onOpenChange={(open) => !open && setSelectedDayOrders(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850">
          <DialogHeader>
            <DialogTitle className="text-zinc-950 dark:text-white font-bold text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-450" />
              <span>Deadlines for {selectedDateStr.split(",")[1]}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            {selectedDayOrders &&
              selectedDayOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 border border-zinc-150 dark:border-zinc-800 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-950/30 cursor-pointer flex justify-between items-center transition-colors"
                  onClick={() => {
                    setSelectedDayOrders(null);
                    // Redirect to orders page with select parameter
                    window.location.href = `/orders?select=${order.id}`;
                  }}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold font-mono text-zinc-455">{order.orderNumber}</span>
                    <h4 className="text-xs font-extrabold text-zinc-950 dark:text-zinc-50 leading-tight">
                      {order.customerName}
                    </h4>
                    <p className="text-[10px] text-zinc-400 truncate max-w-xs">
                      {order.products.map((p) => `${p.quantity}x ${p.product}`).join(", ")}
                    </p>
                  </div>
                  <div className="text-right flex items-center space-x-2">
                    <StatusBadge status={order.status} type="order" />
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
                  </div>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
