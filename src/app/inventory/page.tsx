"use client";

import React, { useState, useMemo } from "react";
import { useProductionStore } from "@/store/productionStore";
import { InventoryItem } from "@/types";
import { inventoryItemSchema } from "@/lib/validations/schemas";
import {
  Package,
  Plus,
  AlertTriangle,
  RefreshCw,
  Search,
  Layers,
  Calculator,
  CheckCircle2,
  TrendingDown,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NumberInput } from "@/components/ui/number-input";
import { ColorPickerInput } from "@/components/ui/color-picker";

export default function InventoryPage() {
  const { inventory, settings, addInventoryItem, updateInventoryStock, deleteInventoryItem } =
    useProductionStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedItemForStock, setSelectedItemForStock] = useState<InventoryItem | null>(null);
  const [newStockInput, setNewStockInput] = useState<number>(0);

  // BOM Estimator State
  const [estimatorStyle, setEstimatorStyle] = useState<"Shirt" | "Suit" | "Gown" | "Pants" | "Kurti">("Shirt");
  const [estimatorQty, setEstimatorQty] = useState<number>(50);
  const [estimatorFabricId, setEstimatorFabricId] = useState<string>("");
  const [estimatorWastage, setEstimatorWastage] = useState<number>(7);

  // New Item Form State
  const [newItem, setNewItem] = useState<{
    sku: string;
    name: string;
    category: InventoryItem["category"];
    color: string;
    unit: InventoryItem["unit"];
    stockQuantity: number;
    minStockThreshold: number;
    costPerUnit: number;
    supplier: string;
  }>({
    sku: "",
    name: "",
    category: "Fabric",
    color: "",
    unit: "Meters",
    stockQuantity: 100,
    minStockThreshold: 30,
    costPerUnit: 15,
    supplier: "",
  });

  const categories = ["All", "Fabric", "Trim", "Packaging", "Consumable"];

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.color && item.color.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [inventory, selectedCategory, searchTerm]);

  const lowStockItems = useMemo(() => {
    return inventory.filter((item) => item.stockQuantity <= item.minStockThreshold);
  }, [inventory]);

  const totalInventoryValue = useMemo(() => {
    return inventory.reduce((sum, item) => sum + item.stockQuantity * item.costPerUnit, 0);
  }, [inventory]);

  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setItemErrors({});
    const validation = inventoryItemSchema.safeParse({
      ...newItem,
      sku: newItem.sku || `SKU-${Date.now().toString().slice(-4)}`,
    });

    if (!validation.success) {
      const errs: Record<string, string> = {};
      const fields = validation.error.flatten().fieldErrors;
      if (fields.name?.[0]) errs.name = fields.name[0];
      if (fields.sku?.[0]) errs.sku = fields.sku[0];
      if (fields.supplier?.[0]) errs.supplier = fields.supplier[0];
      if (fields.stockQuantity?.[0]) errs.stockQuantity = fields.stockQuantity[0];
      if (fields.costPerUnit?.[0]) errs.costPerUnit = fields.costPerUnit[0];
      setItemErrors(errs);
      return;
    }

    addInventoryItem({
      ...validation.data,
      color: newItem.color,
    });

    setIsAddOpen(false);
    setNewItem({
      sku: "",
      name: "",
      category: "Fabric",
      color: "",
      unit: "Meters",
      stockQuantity: 100,
      minStockThreshold: 30,
      costPerUnit: 15,
      supplier: "",
    });
  };

  const handleStockUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForStock) return;
    updateInventoryStock(selectedItemForStock.id, Number(newStockInput));
    setSelectedItemForStock(null);
  };

  // Fabric Consumption Formulas (m per unit)
  const baseFabricRequirement = useMemo(() => {
    switch (estimatorStyle) {
      case "Shirt":
        return 2.1;
      case "Suit":
        return 3.8;
      case "Gown":
        return 4.5;
      case "Pants":
        return 1.4;
      case "Kurti":
        return 2.6;
      default:
        return 2.0;
    }
  }, [estimatorStyle]);

  const totalFabricCalculated = useMemo(() => {
    const rawTotal = baseFabricRequirement * estimatorQty;
    const wastage = rawTotal * (estimatorWastage / 100);
    return Math.round((rawTotal + wastage) * 10) / 10;
  }, [baseFabricRequirement, estimatorQty, estimatorWastage]);

  const selectedEstimatorFabric = useMemo(() => {
    if (!estimatorFabricId) {
      return inventory.find((i) => i.category === "Fabric") || null;
    }
    return inventory.find((i) => i.id === estimatorFabricId) || null;
  }, [inventory, estimatorFabricId]);

  const estimatorFabricInStock = selectedEstimatorFabric
    ? selectedEstimatorFabric.stockQuantity >= totalFabricCalculated
    : false;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
            <Package className="h-6 w-6 text-zinc-700 dark:text-zinc-300" />
            Fabric & Material Inventory
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track raw textile stock, trim accessories, low-level alerts & automated BOM cut estimators.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Material Stock
          </Button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Total SKUs
            </CardTitle>
            <Package className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{inventory.length}</div>
            <p className="text-xs text-zinc-500 mt-1">Fabrics, trims & packaging</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Low Stock Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {lowStockItems.length}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Below minimum threshold</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Total Valuation
            </CardTitle>
            <span className="text-xs font-bold text-zinc-400">{settings.currencySymbol}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {settings.currencySymbol}
              {totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Current fabric & trim assets</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Fabric Ledger
            </CardTitle>
            <Layers className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {inventory
                .filter((i) => i.category === "Fabric")
                .reduce((acc, i) => acc + i.stockQuantity, 0)}{" "}
              <span className="text-sm font-normal text-zinc-500">meters</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">Raw rolls available</p>
          </CardContent>
        </Card>
      </div>

      {/* BOM Cut Plan Estimator Tool */}
      <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 text-white border-zinc-800 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-amber-400" />
              <CardTitle className="text-lg font-bold text-zinc-100">
                Interactive BOM Fabric & Lay Plan Estimator
              </CardTitle>
            </div>
            <span className="text-xs px-2.5 py-1 bg-amber-400/10 text-amber-300 rounded border border-amber-400/20 font-medium">
              Garment Cutting Utility
            </span>
          </div>
          <CardDescription className="text-zinc-400">
            Calculate exact fabric roll meters required for production orders including lay plan wastage allowances.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-zinc-300 text-xs">Garment Style</Label>
              <select
                value={estimatorStyle}
                onChange={(e) => setEstimatorStyle(e.target.value as any)}
                className="w-full mt-1.5 h-10 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                <option value="Shirt">Dress Shirt / Kurta (2.1m/pc)</option>
                <option value="Suit">Bespoke Suit / Jacket (3.8m/pc)</option>
                <option value="Gown">Evening Gown / Anarkali (4.5m/pc)</option>
                <option value="Pants">Tailored Trousers (1.4m/pc)</option>
                <option value="Kurti">Casual Kurti (2.6m/pc)</option>
              </select>
            </div>

            <div>
              <Label className="text-zinc-300 text-xs">Order Quantity (Garments)</Label>
              <NumberInput
                value={estimatorQty}
                onChange={setEstimatorQty}
                allowDecimals={false}
                min={1}
                className="mt-1.5 bg-zinc-800 border-zinc-700 text-zinc-100 h-10"
              />
            </div>

            <div>
              <Label className="text-zinc-300 text-xs">Target Fabric SKU</Label>
              <select
                value={estimatorFabricId}
                onChange={(e) => setEstimatorFabricId(e.target.value)}
                className="w-full mt-1.5 h-10 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                <option value="">Select Fabric from Inventory...</option>
                {inventory
                  .filter((i) => i.category === "Fabric")
                  .map((fab) => (
                    <option key={fab.id} value={fab.id}>
                      {fab.name} ({fab.stockQuantity} {fab.unit} in stock)
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <Label className="text-zinc-300 text-xs">Lay Wastage Allowance %</Label>
              <NumberInput
                value={estimatorWastage}
                onChange={setEstimatorWastage}
                className="mt-1.5 bg-zinc-800 border-zinc-700 text-zinc-100 h-10"
              />
            </div>
          </div>

          {/* Result Calculation Banner */}
          <div className="p-4 rounded-lg bg-zinc-800/80 border border-zinc-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Calculation Output
              </span>
              <div className="text-lg font-semibold text-zinc-100 flex items-center gap-3">
                <span>
                  Required: <strong className="text-amber-300">{totalFabricCalculated} meters</strong>
                </span>
                <span className="text-xs text-zinc-400 font-normal">
                  ({baseFabricRequirement}m/pc × {estimatorQty} pcs + {estimatorWastage}% cut waste)
                </span>
              </div>
            </div>

            {selectedEstimatorFabric ? (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-zinc-900 border border-zinc-700">
                {estimatorFabricInStock ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-400">Stock Available</p>
                      <p className="text-[11px] text-zinc-400">
                        Available: {selectedEstimatorFabric.stockQuantity} meters
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    <div>
                      <p className="text-xs font-semibold text-red-400">Shortage Warning</p>
                      <p className="text-[11px] text-zinc-400">
                        Deficit: {Math.round((totalFabricCalculated - selectedEstimatorFabric.stockQuantity) * 10) / 10} meters
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Main Stock Table Filter & Search */}
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Material Inventory Ledger
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Manage raw material stock quantities, cost rates & supplier data.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search fabric, SKU, supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <div className="flex rounded-md border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-50 dark:bg-zinc-950">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                      selectedCategory === cat
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase border-y border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4">SKU / Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Color</th>
                <th className="py-3 px-4 text-right">Stock Qty</th>
                <th className="py-3 px-4 text-right">Cost Rate</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-800 dark:text-zinc-200">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-400 text-sm">
                    No material stock items match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isLow = item.stockQuantity <= item.minStockThreshold;
                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-medium">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</div>
                        <div className="text-xs text-zinc-400 font-mono">{item.sku}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-600 dark:text-zinc-400">
                        {item.color || "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold">
                        {item.stockQuantity} <span className="text-xs font-normal text-zinc-400">{item.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium">
                        {settings.currencySymbol}
                        {item.costPerUnit.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-500 dark:text-zinc-400">
                        {item.supplier}
                      </td>
                      <td className="py-3.5 px-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800/40">
                            <AlertTriangle className="h-3 w-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                            <CheckCircle2 className="h-3 w-3" /> Sufficient
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedItemForStock(item);
                            setNewStockInput(item.stockQuantity);
                          }}
                          className="h-8 text-xs"
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Adjust Stock
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteInventoryItem(item.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Adjust Stock Dialog */}
      <Dialog open={!!selectedItemForStock} onOpenChange={() => setSelectedItemForStock(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-zinc-900 dark:text-zinc-100">
              Adjust Stock Qty: {selectedItemForStock?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStockUpdateSubmit} className="space-y-4 py-2">
            <div>
              <Label className="text-xs">New Stock Quantity ({selectedItemForStock?.unit})</Label>
              <NumberInput
                value={newStockInput}
                onChange={setNewStockInput}
                className="mt-1.5"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setSelectedItemForStock(null)}>
                Cancel
              </Button>
              <Button type="submit">Update Stock</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Material Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-zinc-900 dark:text-zinc-100">
              Add New Material Stock Item
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItemSubmit} className="space-y-4 py-2 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">SKU Code</Label>
                <Input
                  placeholder="e.g. FAB-COT-09"
                  value={newItem.sku}
                  onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                  className="w-full mt-1.5 h-10 px-3 rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
                >
                  <option value="Fabric">Fabric</option>
                  <option value="Trim">Trim</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Consumable">Consumable</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Item Name</Label>
              <Input
                placeholder="e.g. Egyptian Giza Cotton 200 GSM"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Color / Shade</Label>
                <ColorPickerInput
                  placeholder="e.g. Navy Blue"
                  value={newItem.color}
                  onChange={(col) => setNewItem({ ...newItem, color: col })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-xs">Unit of Measure</Label>
                <select
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value as any })}
                  className="w-full mt-1.5 h-10 px-3 rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
                >
                  <option value="Meters">Meters</option>
                  <option value="Yards">Yards</option>
                  <option value="Spools">Spools</option>
                  <option value="Pieces">Pieces</option>
                  <option value="Kg">Kg</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Initial Qty</Label>
                <NumberInput
                  value={newItem.stockQuantity}
                  onChange={(val) => setNewItem({ ...newItem, stockQuantity: val })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-xs">Min Threshold</Label>
                <NumberInput
                  value={newItem.minStockThreshold}
                  onChange={(val) => setNewItem({ ...newItem, minStockThreshold: val })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-xs">Cost / Unit ({settings.currencySymbol})</Label>
                <NumberInput
                  value={newItem.costPerUnit}
                  onChange={(val) => setNewItem({ ...newItem, costPerUnit: val })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Supplier Name</Label>
              <Input
                placeholder="e.g. Vardhman Textiles Ltd"
                value={newItem.supplier}
                onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Stock Item</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
