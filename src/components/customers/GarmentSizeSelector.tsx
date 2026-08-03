"use client";

import React from "react";
import { Measurements } from "@/types";
import { GARMENT_SIZE_CONFIGS, GarmentType, BOTTOM_WEAR_SIZE_CHART } from "@/config/sizeCharts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import { Scissors, Ruler, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GarmentSizeSelectorProps {
  measurements: Measurements;
  onChange: (updated: Measurements) => void;
}

export function GarmentSizeSelector({ measurements, onChange }: GarmentSizeSelectorProps) {
  const mode = measurements.measurementMode || "standard";
  const garmentType = (measurements.garmentType as GarmentType) || "Blouse";
  const config = GARMENT_SIZE_CONFIGS[garmentType] || GARMENT_SIZE_CONFIGS["Blouse"];

  const [dbSizes, setDbSizes] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch("/api/settings/sizes")
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setDbSizes(d.sizes || []);
      })
      .catch((err) => console.error("Failed to load sizes:", err));
  }, []);

  // Auto-fill standard reference measurements by default on initial load if not present
  React.useEffect(() => {
    if (!measurements.measurementMode || !measurements.standardSize) {
      const defaultGarment: GarmentType = (measurements.garmentType as GarmentType) || "Blouse";
      const defaultConfig = GARMENT_SIZE_CONFIGS[defaultGarment] || GARMENT_SIZE_CONFIGS["Blouse"];
      const defaultSize = defaultConfig.availableSizes.includes("34")
        ? "34"
        : defaultConfig.availableSizes.includes("M")
        ? "M"
        : defaultConfig.availableSizes[0];
      const autoFilled = defaultConfig.getMeasurements(defaultSize);

      onChange({
        ...measurements,
        measurementMode: "standard",
        garmentType: defaultGarment,
        standardSize: defaultSize,
        ...autoFilled,
      });
    }
  }, []);

  // Toggle Mode
  const handleModeChange = (newMode: "custom" | "standard") => {
    if (newMode === "standard") {
      const defaultSize = config.availableSizes.includes("34")
        ? "34"
        : config.availableSizes.includes("M")
        ? "M"
        : config.availableSizes[0];
      const autoFilled = config.getMeasurements(defaultSize);

      onChange({
        ...measurements,
        measurementMode: "standard",
        garmentType,
        standardSize: defaultSize,
        ...autoFilled,
      });
    } else {
      onChange({
        ...measurements,
        measurementMode: "custom",
      });
    }
  };

  // Change Garment Type
  const handleGarmentTypeChange = (typeStr: string | null) => {
    if (!typeStr) return;
    const type = typeStr as GarmentType;
    const newConfig = GARMENT_SIZE_CONFIGS[type] || GARMENT_SIZE_CONFIGS["Kurti"];

    if (type === "Coord Set") {
      const defaultTop = "M";
      const defaultBottom = "30";
      const autoFilled = newConfig.getMeasurements(defaultTop, defaultBottom);

      onChange({
        ...measurements,
        measurementMode: mode,
        garmentType: type,
        topSize: defaultTop,
        bottomSize: defaultBottom,
        standardSize: `Top: ${defaultTop} / Bottom: ${defaultBottom}`,
        ...autoFilled,
      });
    } else {
      const defaultSize = newConfig.availableSizes.includes("M")
        ? "M"
        : newConfig.availableSizes.includes("38")
        ? "38"
        : newConfig.availableSizes[0];
      const autoFilled = newConfig.getMeasurements(defaultSize);

      onChange({
        ...measurements,
        measurementMode: mode,
        garmentType: type,
        standardSize: defaultSize,
        ...autoFilled,
      });
    }
  };

  // Select Size for Single Garments
  const handleSizeSelect = (size: string) => {
    const autoFilled = config.getMeasurements(size);
    onChange({
      ...measurements,
      standardSize: size,
      ...autoFilled,
    });
  };

  const handleDbSizeSelect = (sz: any) => {
    let measObj: Record<string, string> = {};
    try {
      if (sz.measurementsJson) measObj = JSON.parse(sz.measurementsJson);
    } catch (e) {}

    const parsedMeasurements: Record<string, number | undefined> = {};
    Object.entries(measObj).forEach(([k, v]) => {
      const numVal = parseFloat(v);
      const keyLower = k.toLowerCase().replace(/\s+/g, '');
      
      if (keyLower === 'bust' || keyLower === 'chest') parsedMeasurements.chest = numVal;
      else if (keyLower === 'underbust') parsedMeasurements.underBust = numVal;
      else if (keyLower === 'waist') parsedMeasurements.waist = numVal;
      else if (keyLower === 'hip' || keyLower === 'hips') parsedMeasurements.hip = numVal;
      else if (keyLower === 'shoulder') parsedMeasurements.shoulder = numVal;
      else if (keyLower === 'armhole') parsedMeasurements.armhole = numVal;
      else if (keyLower === 'sleeveround') parsedMeasurements.sleeveRound = numVal;
      else if (keyLower === 'sleeve' || keyLower === 'sleevelength') parsedMeasurements.sleeve = numVal;
      else if (keyLower === 'blouselength' || keyLower === 'length' || keyLower === 'garmentlength') parsedMeasurements.garmentLength = numVal;
    });

    onChange({
      ...measurements,
      standardSize: sz.code,
      ...parsedMeasurements,
    });
  };

  // Select Top Size for Coord Set
  const handleCoordTopSelect = (top: string) => {
    const bottom = measurements.bottomSize || "30";
    const autoFilled = config.getMeasurements(top, bottom);
    onChange({
      ...measurements,
      topSize: top,
      bottomSize: bottom,
      standardSize: `Top: ${top} / Bottom: ${bottom}`,
      ...autoFilled,
    });
  };

  // Select Bottom Size for Coord Set
  const handleCoordBottomSelect = (bottom: string) => {
    const top = measurements.topSize || "M";
    const autoFilled = config.getMeasurements(top, bottom);
    onChange({
      ...measurements,
      topSize: top,
      bottomSize: bottom,
      standardSize: `Top: ${top} / Bottom: ${bottom}`,
      ...autoFilled,
    });
  };

  return (
    <div className="space-y-5 bg-zinc-50/70 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
      {/* Mode & Garment Selection Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="w-full sm:w-auto">
          <Label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 mb-1.5">
            <Ruler className="h-3.5 w-3.5 text-blue-500 shrink-0" /> Measurement Mode
          </Label>
          <div className="grid grid-cols-2 gap-1 bg-white dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 w-full">
            <Button
              type="button"
              variant={mode === "custom" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleModeChange("custom")}
              className={`h-8 text-xs font-semibold px-2.5 truncate w-full ${
                mode === "custom" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : ""
              }`}
            >
              <Scissors className="h-3.5 w-3.5 mr-1 shrink-0" /> Custom Fit
            </Button>
            <Button
              type="button"
              variant={mode === "standard" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleModeChange("standard")}
              className={`h-8 text-xs font-semibold px-2.5 truncate w-full ${
                mode === "standard" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : ""
              }`}
            >
              Standard Size
            </Button>
          </div>
        </div>

        {/* Garment Selector */}
        <div className="w-full sm:w-auto">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 block">
            Select Garment Category
          </Label>
          <Select value={garmentType} onValueChange={handleGarmentTypeChange}>
            <SelectTrigger className="h-9 text-xs min-w-[160px] bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700">
              <SelectValue placeholder="Garment Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Blouse">Blouse</SelectItem>
              <SelectItem value="Kurti">Kurti</SelectItem>
              <SelectItem value="Kurta Set">Kurta Set</SelectItem>
              <SelectItem value="Coord Set">Coord Set (Independent Sizing)</SelectItem>
              <SelectItem value="Dress/Gown">Dress / Gown</SelectItem>
              <SelectItem value="Bottom Wear">Bottom Wear (Pants/Salwar)</SelectItem>
              <SelectItem value="Lehenga">Lehenga</SelectItem>
              <SelectItem value="Custom">Custom / Other Garment</SelectItem>
            </SelectContent>
          </Select>

          {garmentType === "Custom" && (
            <Input
              placeholder="e.g. Sharara / Kaftan / Sherwani"
              value={measurements.customGarmentName || ""}
              onChange={(e) => onChange({ ...measurements, customGarmentName: e.target.value })}
              className="h-8 text-xs mt-1.5 bg-white dark:bg-zinc-900 border-amber-300 dark:border-amber-800"
            />
          )}
        </div>
      </div>

      {/* Standard Size Selector Buttons (Only if Mode === 'standard') */}
      {mode === "standard" && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {config.isCoordSet ? (
            /* Coord Set Dual Sizing: Top & Bottom */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-zinc-900 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
              {/* Top Size */}
              <div>
                <Label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                  Top Size (Kurti Size Chart)
                </Label>
                <div className="flex flex-wrap gap-1">
                  {["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"].map((s) => {
                    const isSelected = (measurements.topSize || "M") === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleCoordTopSelect(s)}
                        className={`h-7 px-2.5 rounded text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Size */}
              <div>
                <Label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                  Bottom Size (Waist Inches)
                </Label>
                <div className="flex flex-wrap gap-1">
                  {["26", "28", "30", "32", "34", "36", "38", "40", "42", "44"].map((b) => {
                    const isSelected = (measurements.bottomSize || "30") === b;
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => handleCoordBottomSelect(b)}
                        className={`h-7 px-2 rounded text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                        }`}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Single Garment Size Row */
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Select {garmentType} Standard Size
                </Label>
                <span className="text-[11px] text-zinc-400 font-mono">
                  Selected: <strong className="text-zinc-900 dark:text-zinc-100">{measurements.standardSize || config.availableSizes[0]}</strong>
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                {(() => {
                  const isBlouseItem = garmentType.toLowerCase().includes('blouse') || (measurements.customGarmentName || '').toLowerCase().includes('blouse');
                  const filteredDbSizes = dbSizes.filter((sz) => {
                    const isBlouseSize = sz.code.toLowerCase().includes('blouse') || sz.name.toLowerCase().includes('blouse') || /^\d+$/.test(sz.code);
                    return isBlouseItem ? isBlouseSize : !isBlouseSize;
                  });

                  if (filteredDbSizes.length > 0) {
                    return filteredDbSizes.map((sz) => {
                      const isSelected = (measurements.standardSize || '') === sz.code;
                      return (
                        <button
                          key={sz.id}
                          type="button"
                          onClick={() => handleDbSizeSelect(sz)}
                          className={`h-8 px-3 rounded-md text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                          <span>{sz.code.replace(/^blouse\s+/i, '')}</span>
                        </button>
                      );
                    });
                  }

                  return config.availableSizes.map((s) => {
                    const isSelected = (measurements.standardSize || config.availableSizes[0]) === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSizeSelect(s)}
                        className={`h-8 px-3 rounded-md text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        <span>{s}</span>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          <p className="text-[11px] text-zinc-500 italic flex items-center gap-1">
            <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            Standard size reference measurements are auto-filled by default. Tailors may edit any value if required.
          </p>
        </div>
      )}
    </div>
  );
}
