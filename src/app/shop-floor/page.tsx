"use client";

import React, { useState, useMemo } from "react";
import { useProductionStore } from "@/store/productionStore";
import { OrderStatus, BundleTicket, QualityDefectLog, ProductionLine } from "@/types";
import {
  Radio,
  QrCode,
  CheckCircle2,
  AlertOctagon,
  Activity,
  Printer,
  Search,
  Plus,
  Zap,
  Users,
  Clock,
  CheckSquare,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NumberInput } from "@/components/ui/number-input";
import { BundleTicketModal } from "@/components/orders/BundleTicketModal";

const STATIONS: OrderStatus[] = [
  "Material Received",
  "Cutting",
  "Stitching",
  "Embroidery",
  "QC",
  "Ready",
  "Completed",
];

export default function ShopFloorMESPage() {
  const {
    bundles,
    productionLines,
    qualityLogs,
    orders,
    settings,
    scanBundleTicket,
    addQualityDefectLog,
    updateProductionLine,
  } = useProductionStore();

  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedBundle, setSelectedBundle] = useState<BundleTicket | null>(null);
  const [isLogDefectOpen, setIsLogDefectOpen] = useState(false);
  const [printableOrderId, setPrintableOrderId] = useState<string | null>(null);

  // Defect Log Form State
  const [defectForm, setDefectForm] = useState<{
    orderId: string;
    bundleId: string;
    station: OrderStatus;
    defectType: QualityDefectLog["defectType"];
    severity: QualityDefectLog["severity"];
    operatorName: string;
    quantityAffected: number;
    actionTaken: QualityDefectLog["actionTaken"];
    notes: string;
  }>({
    orderId: "",
    bundleId: "",
    station: "QC",
    defectType: "Skipped Stitch",
    severity: "Major",
    operatorName: "",
    quantityAffected: 1,
    actionTaken: "Rework",
    notes: "",
  });

  const activeBundles = useMemo(() => {
    return bundles.filter((b) => b.status !== "Completed");
  }, [bundles]);

  const flaggedBundles = useMemo(() => {
    return bundles.filter((b) => b.status === "Flagged Defect");
  }, [bundles]);

  // Handle Quick Barcode Search
  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const match = bundles.find(
      (b) =>
        b.barcode === barcodeInput.trim() ||
        b.bundleNumber.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (match) {
      setSelectedBundle(match);
    } else {
      alert(`No bundle found for ticket/barcode: ${barcodeInput}`);
    }
  };

  const handleAdvanceStation = (nextStation: OrderStatus) => {
    if (!selectedBundle) return;
    scanBundleTicket(selectedBundle.id, nextStation, `Scanned to ${nextStation}`);
    
    // Update local state copy
    setSelectedBundle((prev) =>
      prev ? { ...prev, currentStation: nextStation } : null
    );
  };

  const handleSaveDefectLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!defectForm.orderId) return;

    const targetOrder = orders.find((o) => o.id === defectForm.orderId);

    addQualityDefectLog({
      orderId: defectForm.orderId,
      orderNumber: targetOrder ? targetOrder.orderNumber : "ORD-GENERIC",
      bundleId: defectForm.bundleId || undefined,
      bundleNumber: bundles.find((b) => b.id === defectForm.bundleId)?.bundleNumber,
      station: defectForm.station,
      defectType: defectForm.defectType,
      severity: defectForm.severity,
      operatorName: defectForm.operatorName || "Unassigned Operator",
      lineName: "Line 1 - Tops & Shirts",
      quantityAffected: defectForm.quantityAffected,
      actionTaken: defectForm.actionTaken,
      notes: defectForm.notes,
    });

    setIsLogDefectOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
            <Radio className="h-6 w-6 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            Shop Floor Control & MES Dashboard
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time sewing line execution, scannable bundle tickets, quality defect control & operator SAM metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setPrintableOrderId(orders[0]?.id || "ord-2")}
            variant="outline"
            className="border-zinc-300 dark:border-zinc-700"
          >
            <Printer className="h-4 w-4 mr-2 text-zinc-600 dark:text-zinc-300" />
            Print Bundle Tickets
          </Button>
          <Button
            onClick={() => setIsLogDefectOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <AlertOctagon className="h-4 w-4 mr-2" />
            Log QC Defect
          </Button>
        </div>
      </div>

      {/* Sewing Line Performance Cards */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-500" />
          Active Sewing Production Lines (Real-Time Output & Efficiency)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {productionLines.map((line) => {
            const lineBundles = activeBundles.filter((b) => b.lineId === line.id);
            const totalPcs = lineBundles.reduce((acc, b) => acc + b.quantity, 0);

            // Compute Efficiency % (SAM based)
            // Hourly Target = targetPcsPerHour
            // Estimated Efficiency = (Total active pcs / (Operator count * 8h target)) * 100
            const hourlyTarget = line.targetPcsPerHour || 25;
            const efficiency = Math.min(100, Math.round((totalPcs / (hourlyTarget * 2.5)) * 100));

            return (
              <Card key={line.id} className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {line.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-500">
                        Supervisor: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{line.supervisor}</span>
                      </CardDescription>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      {line.status}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800 text-center">
                    <div>
                      <span className="text-[10px] uppercase text-zinc-400 font-semibold">Operators</span>
                      <p className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-1 mt-0.5">
                        <Users className="h-3.5 w-3.5 text-blue-500" /> {line.operatorCount}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-zinc-400 font-semibold">Target/Hr</span>
                      <p className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-1 mt-0.5">
                        <Clock className="h-3.5 w-3.5 text-amber-500" /> {line.targetPcsPerHour} pcs
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-zinc-400 font-semibold">SAM Time</span>
                      <p className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-1 mt-0.5">
                        <Zap className="h-3.5 w-3.5 text-purple-500" /> {line.samMinutes || 15}m
                      </p>
                    </div>
                  </div>

                  {/* Line Efficiency Meter */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-medium text-zinc-500">Line Efficiency</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{efficiency}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${efficiency}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-500 flex justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <span>Active WIP Bundles: <strong className="text-zinc-800 dark:text-zinc-200">{lineBundles.length}</strong></span>
                    <span>Pieces: <strong className="text-zinc-800 dark:text-zinc-200">{totalPcs} pcs</strong></span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Barcode Ticket Scanner & Bundle Advance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scanner Simulator & Active Tickets */}
        <Card className="lg:col-span-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-blue-500" />
              Bundle Ticket Barcode Scanner
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Scan barcode or enter ticket code to record station progress.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleBarcodeScan} className="space-y-2">
              <Label className="text-xs">Barcode / Ticket Code</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. 890123456001 or BDL-002-A1"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="font-mono text-xs"
                />
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Scan
                </Button>
              </div>
            </form>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                Quick Select Active Ticket
              </span>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {bundles.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBundle(b)}
                    className={`w-full text-left p-2.5 rounded-md border text-xs transition-all flex justify-between items-center ${
                      selectedBundle?.id === b.id
                        ? "bg-blue-50 border-blue-300 dark:bg-blue-950/40 dark:border-blue-700 text-blue-900 dark:text-blue-100 font-semibold"
                        : "bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    }`}
                  >
                    <div>
                      <div className="font-mono">{b.bundleNumber}</div>
                      <div className="text-[11px] text-zinc-400 font-normal">
                        {b.productName} ({b.color} - Size {b.size})
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] rounded font-medium ${
                        b.status === "Flagged Defect"
                          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                          : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {b.quantity} pcs
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Ticket Inspection & Station Advance Panel */}
        <Card className="lg:col-span-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Selected Bundle Execution Ticket
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Live shop floor tracking for cut fabric bundles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedBundle ? (
              <div className="space-y-6">
                {/* Bundle Specs Header */}
                <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Ticket Number</span>
                    <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">{selectedBundle.bundleNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Order Reference</span>
                    <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">{selectedBundle.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Color & Size</span>
                    <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">{selectedBundle.color} ({selectedBundle.size})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Cut Quantity</span>
                    <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{selectedBundle.quantity} Pieces</span>
                  </div>
                </div>

                {/* Current Station & Timeline Stepper */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Factory Station Stepper
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
                    {STATIONS.map((station) => {
                      const isCurrent = selectedBundle.currentStation === station;
                      const stationIndex = STATIONS.indexOf(station);
                      const currentIndex = STATIONS.indexOf(selectedBundle.currentStation);
                      const isPast = stationIndex < currentIndex;

                      return (
                        <button
                          key={station}
                          onClick={() => handleAdvanceStation(station)}
                          className={`p-2.5 rounded-md border text-center transition-all text-xs flex flex-col items-center justify-between gap-1 ${
                            isCurrent
                              ? "bg-emerald-600 text-white border-emerald-700 shadow-md font-semibold"
                              : isPast
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
                              : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
                          }`}
                        >
                          <span className="text-[10px] font-mono opacity-80">{stationIndex + 1}</span>
                          <span className="text-[11px] leading-tight font-medium">{station}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Scanned Notes & Action Buttons */}
                <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                  <div className="text-xs">
                    <span className="text-zinc-400 block mb-0.5">Assigned Line:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedBundle.lineName || "Line 1 - Tops"}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDefectForm((prev) => ({
                          ...prev,
                          orderId: selectedBundle.orderId,
                          bundleId: selectedBundle.id,
                        }));
                        setIsLogDefectOpen(true);
                      }}
                      className="text-xs border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                    >
                      <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Flag Defect
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => {
                        const idx = STATIONS.indexOf(selectedBundle.currentStation);
                        if (idx < STATIONS.length - 1) {
                          handleAdvanceStation(STATIONS[idx + 1]);
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    >
                      Advance to Next Station <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-zinc-400 space-y-2">
                <QrCode className="h-10 w-10 mx-auto text-zinc-300 dark:text-zinc-700" />
                <p className="text-sm">Scan or select a bundle ticket from the left panel to execute shop floor tracking.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quality Defect Log Table */}
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                Inline & Endline Quality Inspection Defect Ledger
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Log of defect events across sewing lines, severity classifications & rework actions.
              </CardDescription>
            </div>

            <Button
              size="sm"
              onClick={() => setIsLogDefectOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Log Defect Event
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase border-y border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4">Order / Ticket</th>
                <th className="py-3 px-4">Station</th>
                <th className="py-3 px-4">Defect Classification</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4 text-center">Pcs Affected</th>
                <th className="py-3 px-4">Action Taken</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs">
              {qualityLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-400">
                    No defects logged. Excellent quality control score!
                  </td>
                </tr>
              ) : (
                qualityLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                    <td className="py-3 px-4 font-mono font-medium">
                      {log.orderNumber}
                      {log.bundleNumber && <div className="text-[11px] text-zinc-400">{log.bundleNumber}</div>}
                    </td>
                    <td className="py-3 px-4">{log.station}</td>
                    <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      {log.defectType}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                          log.severity === "Critical"
                            ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                            : log.severity === "Major"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                      {log.operatorName || "Line 1 Operator"}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">{log.quantityAffected}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded">
                        {log.actionTaken}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-400 font-mono">
                      {new Date(log.timestamp).toLocaleDateString()}{" "}
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Log Defect Dialog */}
      <Dialog open={isLogDefectOpen} onOpenChange={setIsLogDefectOpen}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              Log Quality Inspection Defect
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveDefectLog} className="space-y-4 py-2 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Select Order</Label>
                <select
                  value={defectForm.orderId}
                  onChange={(e) => setDefectForm({ ...defectForm, orderId: e.target.value })}
                  className="w-full mt-1.5 h-10 px-3 rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
                  required
                >
                  <option value="">Choose Order...</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.customerName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs">Defect Station</Label>
                <select
                  value={defectForm.station}
                  onChange={(e) => setDefectForm({ ...defectForm, station: e.target.value as any })}
                  className="w-full mt-1.5 h-10 px-3 rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
                >
                  <option value="Cutting">Cutting Station</option>
                  <option value="Stitching">Stitching Line</option>
                  <option value="Embroidery">Embroidery Table</option>
                  <option value="QC">Endline QC Table</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Defect Type</Label>
                <select
                  value={defectForm.defectType}
                  onChange={(e) => setDefectForm({ ...defectForm, defectType: e.target.value as any })}
                  className="w-full mt-1.5 h-10 px-3 rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
                >
                  <option value="Skipped Stitch">Skipped Stitch</option>
                  <option value="Puckering">Seam Puckering</option>
                  <option value="Fabric Stain">Fabric Stain / Oil Spot</option>
                  <option value="Needle Hole">Needle Hole / Fabric Tear</option>
                  <option value="Uncut Thread">Uncut Thread Loose</option>
                  <option value="Sizing Out of Spec">Measurement Out-of-Spec</option>
                  <option value="Shade Variation">Shade / Color Variance</option>
                </select>
              </div>

              <div>
                <Label className="text-xs">Severity Level</Label>
                <select
                  value={defectForm.severity}
                  onChange={(e) => setDefectForm({ ...defectForm, severity: e.target.value as any })}
                  className="w-full mt-1.5 h-10 px-3 rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
                >
                  <option value="Minor">Minor (Passable with tweak)</option>
                  <option value="Major">Major (Requires Rework)</option>
                  <option value="Critical">Critical (Scrap Lot)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Pcs Affected</Label>
                <NumberInput
                  value={defectForm.quantityAffected}
                  onChange={(val) => setDefectForm({ ...defectForm, quantityAffected: val })}
                  allowDecimals={false}
                  min={1}
                />
              </div>

              <div>
                <Label className="text-xs">Action Required</Label>
                <select
                  value={defectForm.actionTaken}
                  onChange={(e) => setDefectForm({ ...defectForm, actionTaken: e.target.value as any })}
                  className="w-full mt-1.5 h-10 px-3 rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
                >
                  <option value="Rework">Rework Station</option>
                  <option value="Passed with Warning">Passed with Warning</option>
                  <option value="Scrap">Scrap Piece</option>
                </select>
              </div>

              <div>
                <Label className="text-xs">Operator Name</Label>
                <Input
                  placeholder="e.g. Operator #104"
                  value={defectForm.operatorName}
                  onChange={(e) => setDefectForm({ ...defectForm, operatorName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Root Cause Notes</Label>
              <Input
                placeholder="e.g. Needle dullness on machine #4 caused skipped stitches"
                value={defectForm.notes}
                onChange={(e) => setDefectForm({ ...defectForm, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="outline" onClick={() => setIsLogDefectOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
                Record Defect
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Printable Bundle Ticket Modal */}
      {printableOrderId && (
        <BundleTicketModal
          orderId={printableOrderId}
          onClose={() => setPrintableOrderId(null)}
        />
      )}
    </div>
  );
}
