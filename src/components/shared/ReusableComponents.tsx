"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Plus,
  Info,
  Scale,
  Scissors,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// 1. MetricCard
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number; // percentage change e.g. +12.5 or -3.2
  timeframe?: string; // e.g. "from last month"
  icon?: React.ReactNode;
  loading?: boolean;
}

export function MetricCard({ title, value, change, timeframe = "from last month", icon, loading }: MetricCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card className="overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all duration-205 hover:border-zinc-300 dark:hover:border-zinc-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{title}</p>
          {icon && <div className="text-zinc-400 dark:text-zinc-500">{icon}</div>}
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{value}</h3>
          {change !== undefined && (
            <span
              className={cn(
                "inline-flex items-center text-xs font-semibold rounded-full px-2 py-0.5",
                isPositive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                  : isNegative
                  ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                  : "bg-zinc-50 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400"
              )}
            >
              {isPositive ? (
                <TrendingUp className="mr-1 h-3.5 w-3.5" />
              ) : isNegative ? (
                <TrendingDown className="mr-1 h-3.5 w-3.5" />
              ) : null}
              {isPositive ? `+${change}%` : `${change}%`}
            </span>
          )}
        </div>
        {timeframe && (
          <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-555 font-medium">{timeframe}</p>
        )}
      </CardContent>
    </Card>
  );
}

// 2. ChartCard
interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

export function ChartCard({ title, description, children, headerAction }: ChartCardProps) {
  return (
    <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
        <div>
          <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">{title}</CardTitle>
          {description && <CardDescription className="text-xs text-zinc-400 mt-0.5">{description}</CardDescription>}
        </div>
        {headerAction && <div>{headerAction}</div>}
      </CardHeader>
      <CardContent className="h-72">{children}</CardContent>
    </Card>
  );
}

// 3. EmptyState
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionText, onAction }: EmptyStateProps) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-250 dark:border-zinc-800 p-8 text-center bg-white dark:bg-zinc-900/50">
      {icon ? (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500">
          {icon}
        </div>
      ) : (
        <Info className="mx-auto h-10 w-10 text-zinc-350" />
      )}
      <h3 className="mt-4 text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{title}</h3>
      <p className="mt-2 text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">{description}</p>
      {actionText && onAction && (
        <div className="mt-6">
          <Button onClick={onAction} size="sm" className="font-semibold">
            <Plus className="mr-2 h-4 w-4" />
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}

// 4. StatusBadge
interface StatusBadgeProps {
  status: string;
  type?: "order" | "payment";
}

export function StatusBadge({ status, type = "order" }: StatusBadgeProps) {
  let styles = "bg-zinc-50 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";

  if (type === "order") {
    switch (status) {
      case "Material Received":
        styles = "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-950/20 dark:text-slate-400 dark:border-slate-800/40";
        break;
      case "Cutting":
        styles = "bg-zinc-50 text-zinc-750 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700";
        break;
      case "Stitching":
        styles = "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/50";
        break;
      case "Embroidery":
        styles = "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800/50";
        break;
      case "QC":
        styles = "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/50";
        break;
      case "Ready":
        styles = "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-800/50";
        break;
      case "Delivered":
        styles = "bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/50";
        break;
      case "Completed":
        styles = "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-850/50";
        break;
    }
  } else {
    switch (status) {
      case "Paid":
        styles = "bg-emerald-50 text-emerald-750 border border-emerald-200 dark:bg-emerald-950/25 dark:text-emerald-450 dark:border-emerald-800/40";
        break;
      case "Partially Paid":
        styles = "bg-amber-50 text-amber-750 border border-amber-250 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-800/50";
        break;
      case "Unpaid":
        styles = "bg-red-50 text-red-750 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/50";
        break;
    }
  }

  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight transition-colors duration-200", styles)}>
      {status}
    </span>
  );
}

// 5. Stepper
interface StepperProps {
  steps: string[];
  mobileSteps?: string[];
  currentStep: number;
}

export function Stepper({ steps, mobileSteps, currentStep }: StepperProps) {
  return (
    <div className="w-full space-y-3">
      {/* Step Nodes Row */}
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const mobileName = mobileSteps && mobileSteps[idx] ? mobileSteps[idx] : step;
          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center relative flex-1 min-w-0">
                <div
                  className={cn(
                    "flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full text-[11px] sm:text-xs font-semibold border-2 transition-all duration-300 shrink-0",
                    idx < currentStep
                      ? "bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-50 dark:border-zinc-50 dark:text-black"
                      : idx === currentStep
                      ? "bg-white border-zinc-900 text-zinc-900 dark:bg-zinc-900 dark:border-zinc-100 dark:text-zinc-100 ring-2 ring-zinc-900/20 dark:ring-white/20"
                      : "bg-white border-zinc-200 text-zinc-400 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-655"
                  )}
                >
                  {idx < currentStep ? <CheckCircle2 className="h-3.5 w-3.5 sm:h-5 sm:w-5" /> : idx + 1}
                </div>

                {/* Mobile Short Name (< sm) */}
                <span
                  className={cn(
                    "mt-1 text-[8px] font-bold text-center uppercase tracking-wider block sm:hidden leading-none truncate max-w-[42px] px-0.5",
                    idx === currentStep
                      ? "text-zinc-950 dark:text-zinc-50 font-extrabold"
                      : idx < currentStep
                      ? "text-zinc-700 dark:text-zinc-300 font-semibold"
                      : "text-zinc-400"
                  )}
                  title={step}
                >
                  {mobileName}
                </span>

                {/* Desktop Full Name (>= sm) */}
                <span
                  className={cn(
                    "mt-1.5 text-[10px] font-bold text-center uppercase tracking-wider hidden sm:block leading-tight truncate max-w-[80px] sm:max-w-none px-0.5",
                    idx === currentStep
                      ? "text-zinc-950 dark:text-zinc-50 font-extrabold"
                      : idx < currentStep
                      ? "text-zinc-700 dark:text-zinc-300 font-semibold"
                      : "text-zinc-400"
                  )}
                  title={step}
                >
                  {step}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "h-[2px] w-full flex-1 transition-all duration-300 -mt-4 sm:-mt-5",
                    idx < currentStep
                      ? "bg-zinc-900 dark:bg-zinc-50"
                      : "bg-zinc-200 dark:bg-zinc-800"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Active Section Banner */}
      <div className="pt-2 border-t border-zinc-150 dark:border-zinc-800/80 flex items-center justify-between text-xs">
        <span className="font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Section {currentStep + 1} of {steps.length}:</span>
          <span className="text-zinc-950 dark:text-zinc-50 font-extrabold underline underline-offset-4 decoration-zinc-300 dark:decoration-zinc-700">
            {steps[currentStep]}
          </span>
        </span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 shrink-0">
          Auto-Saved ✓
        </span>
      </div>
    </div>
  );
}

// 6. MeasurementCard
interface MeasurementCardProps {
  measurements: {
    measurementMode?: "custom" | "standard";
    garmentType?: string;
    standardSize?: string;
    topSize?: string;
    bottomSize?: string;

    chest?: number;
    underBust?: number;
    waist?: number;
    shoulder?: number;
    armhole?: number;
    sleeve?: number;
    sleeveRound?: number;
    neck?: number;
    hip?: number;
    height?: number;

    garmentLength?: number;
    thigh?: number;
    knee?: number;
    bottomOpening?: number;
    inseam?: number;
    flair?: string;
    canCan?: string;

    customFields?: Record<string, string | number>;
    notes?: string;
  };
  title?: string;
  className?: string;
}

export function MeasurementCard({ measurements, title = "Body Measurements", className }: MeasurementCardProps) {
  const fields = [
    { label: "Bust / Chest", value: measurements.chest, unit: "in" },
    { label: "Under Bust", value: measurements.underBust, unit: "in" },
    { label: "Waist", value: measurements.waist, unit: "in" },
    { label: "Hip", value: measurements.hip, unit: "in" },
    { label: "Shoulder", value: measurements.shoulder, unit: "in" },
    { label: "Armhole", value: measurements.armhole, unit: "in" },
    { label: "Sleeve Length", value: measurements.sleeve, unit: "in" },
    { label: "Sleeve Round", value: measurements.sleeveRound, unit: "in" },
    { label: "Neck", value: measurements.neck, unit: "in" },
    { label: "Height", value: measurements.height, unit: "in" },
    { label: "Garment Length", value: measurements.garmentLength, unit: "in" },
    { label: "Thigh", value: measurements.thigh, unit: "in" },
    { label: "Knee", value: measurements.knee, unit: "in" },
    { label: "Bottom Opening", value: measurements.bottomOpening, unit: "in" },
    { label: "Inseam", value: measurements.inseam, unit: "in" },
  ];

  const activeFields = fields.filter((f) => f.value !== undefined && f.value !== 0);
  const customFields = measurements.customFields
    ? Object.entries(measurements.customFields).filter(([_, v]) => v !== undefined && v !== "")
    : [];
  const hasNotes = !!measurements.notes;
  const isStandardMode = measurements.measurementMode === "standard";

  if (activeFields.length === 0 && customFields.length === 0 && !hasNotes && !isStandardMode) {
    return (
      <Card className={cn("bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800", className)}>
        <CardHeader className="py-4">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-450">{title}</CardTitle>
        </CardHeader>
        <CardContent className="py-2 pb-4">
          <p className="text-xs text-zinc-400 italic">No measurement data recorded.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800", className)}>
      <CardHeader className="py-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-455 dark:text-zinc-400">{title}</CardTitle>
        {isStandardMode && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              {measurements.garmentType || "Ready-Made"} Chart
            </span>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded border border-zinc-250 dark:border-zinc-700">
              {measurements.garmentType === "Coord Set"
                ? `Top: ${measurements.topSize || "M"} / Bottom: ${measurements.bottomSize || "30"}`
                : `Size: ${measurements.standardSize || "Standard"}`}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-4 space-y-4">
        {activeFields.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {activeFields.map((f) => (
              <div key={f.label} className="border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 p-2.5 rounded-md text-left">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{f.label}</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {f.value} <span className="text-[10px] text-zinc-400 font-normal">{f.unit}</span>
                </p>
              </div>
            ))}
          </div>
        )}

        {(measurements.flair || measurements.canCan) && (
          <div className="flex gap-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded border border-zinc-200 dark:border-zinc-800">
            {measurements.flair && <div>Flair: <span className="font-extrabold">{measurements.flair}</span></div>}
            {measurements.canCan && <div>Can Can: <span className="font-extrabold">{measurements.canCan}</span></div>}
          </div>
        )}

        {customFields.length > 0 && (
          <div className="border-t border-zinc-150 dark:border-zinc-800 pt-3">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Custom Measurements</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {customFields.map(([k, v]) => (
                <div key={k} className="border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 p-2.5 rounded-md text-left">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider truncate" title={k}>{k}</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">{v}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {measurements.notes && (
          <div className="border-t border-zinc-150 dark:border-zinc-800 pt-3">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Fitting Notes / Instructions</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-350 bg-zinc-50 dark:bg-zinc-955 p-2.5 rounded border border-zinc-150 dark:border-zinc-850 italic font-sans whitespace-pre-line leading-relaxed">
              {measurements.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
