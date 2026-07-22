"use client";

import React, { useState } from "react";
import { useProductionStore } from "@/store/productionStore";
import { CompanySettings } from "@/types";
import { cn } from "@/lib/utils";
import {
  Building,
  FileText,
  Palette,
  Upload,
  Globe,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Menu,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getNavVisibility, saveNavVisibility, DEFAULT_NAV_VISIBILITY, NavVisibilityConfig } from "@/config/navVisibility";

export default function SettingsPage() {
  const { settings, updateSettings, setTheme } = useProductionStore();

  const [activeTab, setActiveTab] = useState("company");
  const [successMsg, setSuccessMsg] = useState("");
  const [navConfig, setNavConfig] = useState<NavVisibilityConfig>(() => getNavVisibility());

  const handleToggleMenuVisibility = (href: string, visible: boolean) => {
    const updated = { ...navConfig, [href]: visible };
    setNavConfig(updated);
    saveNavVisibility(updated);
    triggerSuccessNotification(`Menu item "${href}" visibility updated.`);
  };

  const handleResetNavVisibility = () => {
    setNavConfig(DEFAULT_NAV_VISIBILITY);
    saveNavVisibility(DEFAULT_NAV_VISIBILITY);
    triggerSuccessNotification("Menu visibility reset to default (Customers, Orders, Production, Invoices).");
  };

  // Company profile form state
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [email, setEmail] = useState(settings.email);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);

  // Invoice form state
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix);
  const [gstRate, setGstRate] = useState(String(settings.gstRate));
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);

  const triggerSuccessNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      companyName,
      email,
      phone,
      address,
    });
    triggerSuccessNotification("Company profile updated successfully.");
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(gstRate);
    updateSettings({
      invoicePrefix: invoicePrefix.trim().toUpperCase(),
      gstRate: isNaN(rate) ? 18 : rate,
      currencySymbol,
    });
    triggerSuccessNotification("Invoice preferences saved successfully.");
  };

  const handleThemeChange = (mode: "light" | "dark" | "system") => {
    setTheme(mode);
    triggerSuccessNotification(`Theme preference updated to ${mode}.`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
          <p className="text-sm text-zinc-500 mt-1">Configure workspace rules, brand details, and templates.</p>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-150 p-4 rounded-md text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar Tabs */}
        <div className="md:col-span-1">
          <TabsList className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 w-full space-y-1 h-auto items-start">
            <TabsTrigger
              value="company"
              className="w-full text-left justify-start font-bold text-xs py-2.5 px-3 uppercase tracking-wide data-[state=active]:bg-zinc-50 dark:data-[state=active]:bg-zinc-800/80"
            >
              <Building className="mr-2 h-4 w-4 shrink-0" /> Company Profile
            </TabsTrigger>
            <TabsTrigger
              value="invoice"
              className="w-full text-left justify-start font-bold text-xs py-2.5 px-3 uppercase tracking-wide data-[state=active]:bg-zinc-50 dark:data-[state=active]:bg-zinc-800/80"
            >
              <FileText className="mr-2 h-4 w-4 shrink-0" /> Invoice Settings
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="w-full text-left justify-start font-bold text-xs py-2.5 px-3 uppercase tracking-wide data-[state=active]:bg-zinc-50 dark:data-[state=active]:bg-zinc-800/80"
            >
              <Palette className="mr-2 h-4 w-4 shrink-0" /> Appearance
            </TabsTrigger>
            <TabsTrigger
              value="branding"
              className="w-full text-left justify-start font-bold text-xs py-2.5 px-3 uppercase tracking-wide data-[state=active]:bg-zinc-50 dark:data-[state=active]:bg-zinc-800/80"
            >
              <Upload className="mr-2 h-4 w-4 shrink-0" /> Branding / Logo
            </TabsTrigger>
            <TabsTrigger
              value="navigation"
              className="w-full text-left justify-start font-bold text-xs py-2.5 px-3 uppercase tracking-wide data-[state=active]:bg-zinc-50 dark:data-[state=active]:bg-zinc-800/80"
            >
              <Menu className="mr-2 h-4 w-4 shrink-0" /> Menu Visibility
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Contents Cards */}
        <div className="md:col-span-3">
          {/* Tab 1: Company details */}
          <TabsContent value="company" className="mt-0">
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle className="text-base font-bold tracking-tight">Company Details</CardTitle>
                <CardDescription className="text-xs">Physical address, phone, and invoice header information.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <Label htmlFor="companyName" className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Company / Studio Name</Label>
                      <Input
                        id="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="h-10 text-sm bg-zinc-50/50 dark:bg-zinc-950"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="companyEmail" className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Contact Email</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-10 text-sm bg-zinc-50/50 dark:bg-zinc-950"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="companyPhone" className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Office Telephone</Label>
                      <Input
                        id="companyPhone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-10 text-sm bg-zinc-50/50 dark:bg-zinc-950"
                        required
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label htmlFor="companyAddress" className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Postal & Studio Address</Label>
                      <Textarea
                        id="companyAddress"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="h-20 text-xs bg-zinc-50/50 dark:bg-zinc-950 resize-none leading-relaxed"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-3">
                    <Button type="submit" className="font-semibold text-xs h-9 cursor-pointer">
                      Save Profile
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Invoice settings */}
          <TabsContent value="invoice" className="mt-0">
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle className="text-base font-bold tracking-tight">Invoice Preferences</CardTitle>
                <CardDescription className="text-xs">Adjust numbering schemes, local taxes and currencies.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveInvoice} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="invoicePrefix" className="text-[10px] font-bold uppercase tracking-wider text-zinc-455">Invoice ID Prefix</Label>
                      <Input
                        id="invoicePrefix"
                        value={invoicePrefix}
                        onChange={(e) => setInvoicePrefix(e.target.value)}
                        className="h-10 text-sm bg-zinc-50/50 dark:bg-zinc-950 font-mono uppercase"
                        required
                      />
                      <p className="text-[9px] text-zinc-455">e.g. prefix ATEL outputs: ATEL-ORD-001</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="gstRate" className="text-[10px] font-bold uppercase tracking-wider text-zinc-455">GST Tax Rate (%)</Label>
                      <Input
                        id="gstRate"
                        type="number"
                        step="0.1"
                        value={gstRate}
                        onChange={(e) => setGstRate(e.target.value)}
                        className="h-10 text-sm bg-zinc-50/50 dark:bg-zinc-950"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-455">Currency Unit</Label>
                      <Select value={currencySymbol} onValueChange={(val) => setCurrencySymbol(val || "₹")}>
                        <SelectTrigger className="h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="$" className="text-xs">Dollar ($)</SelectItem>
                          <SelectItem value="₹" className="text-xs">Rupee (₹)</SelectItem>
                          <SelectItem value="£" className="text-xs">Pound (£)</SelectItem>
                          <SelectItem value="€" className="text-xs">Euro (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end pt-3">
                    <Button type="submit" className="font-semibold text-xs h-9 cursor-pointer">
                      Save Invoice Rules
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Appearance & theme */}
          <TabsContent value="appearance" className="mt-0">
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle className="text-base font-bold tracking-tight">Appearance & Themes</CardTitle>
                <CardDescription className="text-xs">Toggle dark theme styles for work at night.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {["light", "dark", "system"].map((mode) => {
                      const isActive = settings.theme === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => handleThemeChange(mode as any)}
                          className={cn(
                            "flex flex-col items-center justify-center p-4 border rounded-md transition-all text-xs font-semibold capitalize bg-zinc-50/50 hover:bg-zinc-50/80 dark:bg-zinc-950/20 dark:hover:bg-zinc-950/40",
                            isActive ? "border-zinc-950 bg-zinc-100 dark:border-white dark:bg-zinc-800/80" : "border-zinc-200 dark:border-zinc-800"
                          )}
                        >
                          <span className="text-sm font-bold">{mode}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="bg-zinc-50/50 border dark:bg-zinc-950/20 p-4 rounded-md text-[10px] leading-relaxed text-zinc-455 flex items-start gap-2">
                    <Globe className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                    <span>System Theme detects the OS preference on mobile or computers and syncs the color schemes automatically.</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Branding / Logo upload mockup */}
          <TabsContent value="branding" className="mt-0">
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle className="text-base font-bold tracking-tight">Branding Assets</CardTitle>
                <CardDescription className="text-xs">Upload logo images for customer receipts & invoices.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-8 rounded-md bg-zinc-50/30 dark:bg-zinc-950/10 text-center hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-all cursor-pointer">
                  <Upload className="h-8 w-8 text-zinc-400 mb-3" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">Upload Studio Logo</span>
                  <p className="text-[10px] text-zinc-400 mt-1">Accepts PNG, JPG up to 2MB (Recommended dimensions: 300x120px)</p>
                </div>
                <div className="border border-zinc-150 p-4 rounded-md bg-zinc-50/20 dark:border-zinc-850 dark:bg-zinc-950/20 text-xs">
                  <h4 className="font-bold text-zinc-400 uppercase tracking-wider mb-2">Invoice Logo Preview:</h4>
                  <div className="h-14 w-32 border bg-white dark:bg-zinc-900 flex items-center justify-center text-[10px] text-zinc-400 italic rounded">
                    Logo Placeholder
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: Menu Visibility */}
          <TabsContent value="navigation" className="mt-0">
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold tracking-tight flex items-center gap-2">
                    <Menu className="h-5 w-5 text-blue-500" /> Navigation Bar & Sidebar Menu Visibility
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Configure which menu items appear in the sidebar & navigation bar. By default, only Customers, Orders, Production, and Invoices are shown.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetNavVisibility}
                  className="h-8 text-xs font-semibold shrink-0 cursor-pointer"
                >
                  Reset Defaults
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="divide-y divide-zinc-150 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/20">
                  {[
                    { name: "Customers", href: "/customers", desc: "Customer Profiles & Measurements", defaultOn: true },
                    { name: "Orders", href: "/orders", desc: "Garment Orders & Wizard", defaultOn: true },
                    { name: "Production", href: "/production", desc: "Kanban Board & Shop Floor Status", defaultOn: true },
                    { name: "Invoices", href: "/invoices", desc: "Billing & Invoicing", defaultOn: true },
                    { name: "Dashboard", href: "/", desc: "Overview & Quick Stats", defaultOn: false },
                    { name: "Shop Floor (MES)", href: "/shop-floor", desc: "Live Worker Kiosk & Scanner", defaultOn: false },
                    { name: "Inventory & BOM", href: "/inventory", desc: "Raw Materials & Stock", defaultOn: false },
                    { name: "Payments", href: "/payments", desc: "Payment History & Receipts", defaultOn: false },
                    { name: "Reports", href: "/reports", desc: "Analytics & Production Metrics", defaultOn: false },
                    { name: "Calendar", href: "/calendar", desc: "Delivery Timelines & Due Dates", defaultOn: false },
                    { name: "Settings", href: "/settings", desc: "App Rules & Preferences", defaultOn: true },
                  ].map((item) => {
                    const isVisible = navConfig[item.href] !== false;
                    return (
                      <div key={item.href} className="p-3.5 flex items-center justify-between gap-4 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850/50 transition">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{item.name}</span>
                            {item.defaultOn ? (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                Default Visible
                              </span>
                            ) : (
                              <span className="text-[9px] font-semibold text-zinc-400 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded">
                                Default Hidden
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 font-mono">{item.href} — {item.desc}</p>
                        </div>

                        <Button
                          type="button"
                          variant={isVisible ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleToggleMenuVisibility(item.href, !isVisible)}
                          className={`h-8 text-xs font-bold px-3 cursor-pointer ${
                            isVisible
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                              : "text-zinc-500 border-zinc-300 dark:border-zinc-700"
                          }`}
                        >
                          {isVisible ? (
                            <>
                              <Eye className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Visible
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3.5 w-3.5 mr-1 text-zinc-400" /> Hidden
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
