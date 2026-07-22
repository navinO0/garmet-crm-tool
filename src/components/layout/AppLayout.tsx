"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Scissors,
  CreditCard,
  FileText,
  BarChart3,
  Calendar,
  Settings,
  Menu,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Package,
  Radio,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProductionStore } from "@/store/productionStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { getNavVisibility, DEFAULT_NAV_VISIBILITY } from "@/config/navVisibility";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Orders", href: "/orders", icon: ShoppingBag },
  { name: "Production", href: "/production", icon: Scissors },
  { name: "Shop Floor (MES)", href: "/shop-floor", icon: Radio },
  { name: "Inventory & BOM", href: "/inventory", icon: Package },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Calendar", href: "/calendar", icon: Calendar },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [navVisibility, setNavVisibility] = useState(DEFAULT_NAV_VISIBILITY);

  const { customers, orders, activities, settings, setTheme, addPayment } = useProductionStore();

  // Load sidebar state and nav visibility from localStorage
  useEffect(() => {
    setNavVisibility(getNavVisibility());

    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) {
      setIsCollapsed(saved === "true");
    }

    const handleVisibilityChanged = () => {
      setNavVisibility(getNavVisibility());
    };

    window.addEventListener("nav_visibility_changed", handleVisibilityChanged);
    window.addEventListener("storage", handleVisibilityChanged);

    return () => {
      window.removeEventListener("nav_visibility_changed", handleVisibilityChanged);
      window.removeEventListener("storage", handleVisibilityChanged);
    };
  }, []);

  const filteredNavigation = useMemo(() => {
    return navigation.filter((item) => navVisibility[item.href] !== false);
  }, [navVisibility]);

  const handleToggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("sidebar-collapsed", String(nextState));
  };

  // Filtered Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { customers: [], orders: [] };
    const q = searchQuery.toLowerCase();
    
    const matchedCustomers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.company?.toLowerCase().includes(q)
    );

    const matchedOrders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q) ||
        o.products.some((p) => p.product.toLowerCase().includes(q))
    );

    return { customers: matchedCustomers, orders: matchedOrders };
  }, [searchQuery, customers, orders]);

  // Compute Notifications from store data
  const notifications = useMemo(() => {
    const alerts: Array<{ id: string; title: string; desc: string; type: "alert" | "info" | "success"; time: string }> = [];
    
    // 1. Check orders that are "Ready" (Awaiting delivery)
    orders
      .filter((o) => o.status === "Ready")
      .forEach((o) => {
        alerts.push({
          id: `notif-ready-${o.id}`,
          title: "Order Ready for Delivery",
          desc: `${o.orderNumber} (${o.customerName}) is ready to be delivered.`,
          type: "success",
          time: new Date(o.createdAt).toLocaleDateString(),
        });
      });

    // 2. Check orders with Unpaid/Partially Paid status that are close to delivery
    orders
      .filter((o) => o.paymentStatus !== "Paid" && o.status !== "Completed")
      .forEach((o) => {
        alerts.push({
          id: `notif-pay-${o.id}`,
          title: "Pending Payment Alert",
          desc: `${o.customerName} owes outstanding balance on ${o.orderNumber}.`,
          type: "alert",
          time: o.deliveryDate,
        });
      });

    // 3. Add latest activities
    activities.slice(0, 5).forEach((act) => {
      alerts.push({
        id: `notif-act-${act.id}`,
        title: `Order Update: ${act.orderNumber}`,
        desc: `${act.updatedBy} changed status to ${act.status}.`,
        type: "info",
        time: new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    });

    return alerts;
  }, [orders, activities]);

  const handleSelectResult = (url: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(url);
  };

  const handleCycleTheme = () => {
    const current = settings.theme;
    if (current === "light") setTheme("dark");
    else if (current === "dark") setTheme("system");
    else setTheme("light");
  };

  const ThemeIcon = () => {
    switch (settings.theme) {
      case "dark":
        return <Moon className="h-5 w-5 text-zinc-400" />;
      case "light":
        return <Sun className="h-5 w-5 text-amber-500" />;
      default:
        return <Monitor className="h-5 w-5 text-blue-500" />;
    }
  };

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className="flex-1 space-y-1 px-2 py-4">
      {filteredNavigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => mobile && setSidebarOpen(false)}
            className={cn(
              isActive
                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
              "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isCollapsed && !mobile ? "justify-center" : ""
            )}
          >
            <item.icon
              className={cn(
                isActive
                  ? "text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-400 group-hover:text-zinc-500 dark:text-zinc-500 dark:group-hover:text-zinc-400",
                "h-5 w-5 flex-shrink-0 transition-colors",
                isCollapsed && !mobile ? "" : "mr-3"
              )}
              aria-hidden="true"
            />
            {(!isCollapsed || mobile) && <span>{item.name}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans transition-colors duration-300">
      {/* Mobile Drawer Navigation */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
          <div className="flex h-16 items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
            <h1 className="text-lg font-extrabold tracking-tight text-black dark:text-white flex items-center gap-2">
              <Scissors className="h-5 w-5 text-amber-500" />
              <span>{settings.companyName || "Radhe Vastraz"}</span>
            </h1>
          </div>
          <div className="flex h-[calc(100%-4rem)] flex-col justify-between overflow-y-auto">
            <NavLinks mobile />
            <div className="px-2 py-4 border-t border-zinc-200 dark:border-zinc-800">
              <Link
                href="/settings"
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  pathname === "/settings"
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900",
                  "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
                )}
              >
                <Settings className="mr-3 h-5 w-5 flex-shrink-0" />
                Settings
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar Navigation */}
      <div className={cn("hidden lg:flex lg:flex-shrink-0 transition-all duration-300", isCollapsed ? "w-16" : "w-64")}>
        <div className="flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 w-full">
          <div className="flex h-16 items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
            {(!isCollapsed) ? (
              <h1 className="text-base font-extrabold tracking-tight text-black dark:text-white flex items-center gap-2 truncate">
                <Scissors className="h-5 w-5 text-amber-500 shrink-0" />
                <span className="truncate">{settings.companyName || "Radhe Vastraz"}</span>
              </h1>
            ) : (
              <Package className="h-6 w-6 text-zinc-800 dark:text-zinc-200 mx-auto" />
            )}
          </div>
          
          <div className="flex flex-1 flex-col overflow-y-auto pt-2">
            <NavLinks />
          </div>

          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
            <Link
              href="/settings"
              className={cn(
                pathname === "/settings"
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900",
                "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isCollapsed ? "justify-center" : ""
              )}
            >
              <Settings className={cn("h-5 w-5 flex-shrink-0", isCollapsed ? "" : "mr-3")} />
              {!isCollapsed && <span>Settings</span>}
            </Link>

            <button
              onClick={handleToggleSidebar}
              className="w-full flex items-center rounded-md px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 transition-colors justify-center lg:justify-start"
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5 mx-auto" />
              ) : (
                <>
                  <ChevronLeft className="h-5 w-5 mr-3" />
                  <span>Collapse Sidebar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
          <div className="flex items-center flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden mr-4 border border-zinc-200 dark:border-zinc-800"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Global Search trigger bar */}
            <div 
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex max-w-md w-full relative cursor-pointer"
            >
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <div className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-400 rounded-md py-2 pl-9 pr-4 text-sm flex items-center justify-between select-none">
                <span>Search orders, customers, status...</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-1.5 font-mono text-[10px] font-medium text-zinc-400 opacity-100">
                  <span>⌘</span>K
                </kbd>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="sm:hidden border border-zinc-200 dark:border-zinc-800"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCycleTheme}
              className="border border-zinc-200 dark:border-zinc-800"
              title={`Theme: ${settings.theme}`}
            >
              <ThemeIcon />
            </Button>

            {/* Notification Trigger Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative border border-zinc-200 dark:border-zinc-800"
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-900"></span>
              )}
            </Button>

            <Avatar className="h-9 w-9 border border-zinc-200 dark:border-zinc-850">
              <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256" alt="Avatar" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
          {children}
        </main>
      </div>

      {/* Global Search Dialog Modal */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="w-full max-w-2xl max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-none p-6 bg-white dark:bg-zinc-900 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-zinc-900 dark:text-zinc-50">Global Search</DialogTitle>
          </DialogHeader>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
            <Input
              type="text"
              placeholder="Type to search customers, orders or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
              autoFocus
            />
          </div>
          <div className="mt-4 max-h-96 overflow-y-auto space-y-4">
            {searchQuery.trim() === "" ? (
              <p className="text-sm text-zinc-400 text-center py-4">Search by entering names, order codes, items, or production status</p>
            ) : (
              <>
                {searchResults.customers.length === 0 && searchResults.orders.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-4">No results found for &ldquo;{searchQuery}&rdquo;</p>
                ) : (
                  <>
                    {/* Customers Section */}
                    {searchResults.customers.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Customers ({searchResults.customers.length})</h3>
                        <div className="space-y-1">
                          {searchResults.customers.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => handleSelectResult(`/customers?select=${c.id}`)}
                              className="w-full text-left p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-md border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all flex justify-between items-center"
                            >
                              <div>
                                <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">{c.name}</p>
                                <p className="text-xs text-zinc-400">{c.email} | {c.phone}</p>
                              </div>
                              {c.company && (
                                <span className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-350 rounded border border-zinc-200 dark:border-zinc-700">
                                  {c.company}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Orders Section */}
                    {searchResults.orders.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Orders ({searchResults.orders.length})</h3>
                        <div className="space-y-1">
                          {searchResults.orders.map((o) => (
                            <button
                              key={o.id}
                              onClick={() => handleSelectResult(`/orders?select=${o.id}`)}
                              className="w-full text-left p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-md border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all flex justify-between items-center"
                            >
                              <div>
                                <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">{o.orderNumber} - {o.customerName}</p>
                                <p className="text-xs text-zinc-400">
                                  {o.products.map(p => `${p.quantity}x ${p.product}`).join(", ")}
                                </p>
                              </div>
                              <span className={cn(
                                "text-xs px-2.5 py-0.5 font-medium rounded-full",
                                o.status === "Ready" || o.status === "Completed" || o.status === "Delivered"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/50"
                                  : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/50"
                              )}>
                                {o.status}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Drawer */}
      <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <SheetContent className="w-full sm:w-96 max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:border-none bg-white dark:bg-zinc-900 p-0">
          <SheetHeader className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <SheetTitle className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-150">Notifications</SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100%-5.5rem)] overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 text-sm">No new notifications</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "p-4 rounded-md border text-sm transition-all",
                    notif.type === "success"
                      ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-800/30 text-emerald-900 dark:text-emerald-250"
                      : notif.type === "alert"
                      ? "bg-red-50/30 border-red-100 dark:bg-red-950/10 dark:border-red-800/30 text-red-900 dark:text-red-250"
                      : "bg-zinc-50 border-zinc-100 dark:bg-zinc-950 dark:border-zinc-800 text-zinc-900 dark:text-zinc-300"
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-xs tracking-tight">{notif.title}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">{notif.time}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{notif.desc}</p>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Global hotkey listener for search */}
      <SearchHotkeyListener onTrigger={() => setSearchOpen(true)} />
    </div>
  );
}

// Separate component for hotkey handling to keep AppLayout clean
function SearchHotkeyListener({ onTrigger }: { onTrigger: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onTrigger();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTrigger]);

  return null;
}
