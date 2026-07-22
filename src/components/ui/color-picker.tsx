"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Palette, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const POPULAR_GARMENT_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#ffffff" },
  { name: "Navy Blue", hex: "#0f172a" },
  { name: "Sky Blue", hex: "#38bdf8" },
  { name: "Royal Blue", hex: "#1d4ed8" },
  { name: "Emerald Green", hex: "#059669" },
  { name: "Olive Green", hex: "#4d7c0f" },
  { name: "Crimson Red", hex: "#dc2626" },
  { name: "Rose Pink", hex: "#f472b6" },
  { name: "Burgundy", hex: "#881337" },
  { name: "Gold / Mustard", hex: "#d97706" },
  { name: "Charcoal Gray", hex: "#4b5563" },
  { name: "Purple", hex: "#7c3aed" },
  { name: "Nude / Beige", hex: "#f5d0fe" },
];

interface ColorPickerInputProps {
  value: string;
  onChange: (colorName: string) => void;
  placeholder?: string;
  className?: string;
}

export function ColorPickerInput({
  value,
  onChange,
  placeholder = "Select or type color...",
  className,
}: ColorPickerInputProps) {
  const [open, setOpen] = useState(false);
  const [customHex, setCustomHex] = useState("#3b82f6");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectColor = (colorName: string) => {
    onChange(colorName);
    setOpen(false);
  };

  const handleCustomHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setCustomHex(hex);
    onChange(hex);
  };

  return (
    <div ref={containerRef} className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
        />
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setOpen(!open)}
        className="h-9 w-9 shrink-0 border-zinc-300 dark:border-zinc-700 relative overflow-hidden"
        title="Open Color Palette"
      >
        <Palette className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
      </Button>

      {/* Interactive Color Palette Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-64 p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-blue-500" /> Garment Color Swatches
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Color Swatch Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {POPULAR_GARMENT_COLORS.map((c) => {
              const isSelected =
                value.toLowerCase() === c.name.toLowerCase() ||
                value.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handleSelectColor(c.name)}
                  className="h-6 w-6 rounded-md border border-zinc-300 dark:border-zinc-700 relative flex items-center justify-center transition-transform hover:scale-110 shadow-xs cursor-pointer"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {isSelected && (
                    <Check
                      className={`h-3 w-3 ${
                        c.name === "White" || c.name === "Nude / Beige"
                          ? "text-black"
                          : "text-white"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Hex Color Picker */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-500">Custom Color Picker:</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customHex}
                onChange={handleCustomHexChange}
                className="h-7 w-8 cursor-pointer rounded border-none bg-transparent"
                title="Choose custom color from palette"
              />
              <span className="font-mono text-[11px] text-zinc-400">{customHex}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
