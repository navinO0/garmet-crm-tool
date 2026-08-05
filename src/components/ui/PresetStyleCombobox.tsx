"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Scissors, ChevronDown, X } from 'lucide-react';

export interface StylePreset {
  id: string;
  name: string;
  category?: string;
  baseStitchingCost?: number;
  boutiqueBaseStitchingCost?: number;
  bulkBaseStitchingCost?: number;
}

interface PresetStyleComboboxProps {
  presets: StylePreset[];
  value: string;
  selectedPresetId?: string;
  onSelectPreset: (preset: StylePreset) => void;
  onCustomType: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  priceMode?: 'boutique' | 'bulk';
  className?: string;
}

export const PresetStyleCombobox: React.FC<PresetStyleComboboxProps> = ({
  presets,
  value,
  selectedPresetId,
  onSelectPreset,
  onCustomType,
  onClear,
  placeholder = 'Type or search style...',
  priceMode = 'bulk',
  className = '',
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = inputValue.trim().length === 0
    ? presets
    : presets.filter(
        (p) =>
          p.name.toLowerCase().includes(inputValue.toLowerCase()) ||
          (p.category || '').toLowerCase().includes(inputValue.toLowerCase())
      );

  const getPrice = (p: StylePreset) => {
    if (priceMode === 'boutique') return p.boutiqueBaseStitchingCost ?? p.baseStitchingCost ?? 0;
    return p.bulkBaseStitchingCost ?? p.baseStitchingCost ?? 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);
    setHighlightedIndex(-1);
    onCustomType(val);
  };

  const handleSelectPreset = (preset: StylePreset) => {
    setInputValue(preset.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onSelectPreset(preset);
  };

  const handleClear = () => {
    setInputValue('');
    setIsOpen(false);
    onClear?.();
    onCustomType('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      setHighlightedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlightedIndex((prev) => Math.max(prev - 1, -1));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
        handleSelectPreset(filtered[highlightedIndex]);
      }
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const isPresetSelected = !!selectedPresetId;
  const selectedPreset = presets.find(p => p.id === selectedPresetId);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className={`flex items-center gap-1 w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border rounded-md text-xs transition-all ${
        isOpen
          ? 'border-indigo-400 dark:border-indigo-500 ring-1 ring-indigo-200 dark:ring-indigo-800'
          : isPresetSelected
          ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/60 dark:bg-indigo-950/20'
          : 'border-zinc-200 dark:border-zinc-700'
      }`}>
        <Scissors className={`w-3 h-3 shrink-0 ${isPresetSelected ? 'text-indigo-500' : 'text-zinc-400'}`} />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 min-w-0"
          autoComplete="off"
        />
        <div className="flex items-center gap-0.5 shrink-0">
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded transition"
              tabIndex={-1}
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => { setIsOpen((o) => !o); inputRef.current?.focus(); }}
            className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
            tabIndex={-1}
          >
            <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-xl overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
              className="w-full text-left px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800"
            >
              <X className="w-3 h-3" />
              <span className="font-medium">Custom / None</span>
              <span className="text-zinc-400 ml-1 text-[10px]">— type any name</span>
            </button>

            {filtered.length === 0 && (
              <div className="px-3 py-3 text-xs text-zinc-400 italic text-center">
                No matching presets — your text will be used as-is
              </div>
            )}

            {filtered.map((preset, idx) => (
              <button
                key={preset.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelectPreset(preset); }}
                className={`w-full text-left px-3 py-2 text-xs transition flex items-center justify-between gap-2 ${
                  idx === highlightedIndex
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                    : preset.id === selectedPresetId
                    ? 'bg-indigo-50/60 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
                    : 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <Scissors className="w-3 h-3 shrink-0 text-zinc-400" />
                  <span className="font-medium truncate">{preset.name}</span>
                  {preset.category && (
                    <span className="text-zinc-400 dark:text-zinc-500 text-[10px] shrink-0">({preset.category})</span>
                  )}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 text-[11px]">
                  ₹{getPrice(preset).toLocaleString('en-IN')}
                </span>
              </button>
            ))}
          </div>

          <div className="px-3 py-1.5 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 italic">
            {filtered.length} of {presets.length} presets · Type to filter
          </div>
        </div>
      )}

      {isPresetSelected && !isOpen && selectedPreset && (
        <div className="mt-0.5 text-[10px] text-indigo-500 dark:text-indigo-400 font-medium flex items-center gap-1 px-0.5">
          <Scissors className="w-2.5 h-2.5" />
          Preset · ₹{getPrice(selectedPreset).toLocaleString('en-IN')}
        </div>
      )}
    </div>
  );
};
