"use client";

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Trash2, ShieldCheck, Truck, PackageCheck, Calendar, Image as ImageIcon, DollarSign, Ruler, Edit2, Tag, Percent, Scissors, Layers, Info } from 'lucide-react';
import { PresetStyleCombobox } from '@/components/ui/PresetStyleCombobox';
import { CloudinaryUpload } from '@/components/ui/CloudinaryUpload';
import { NumberInput } from '@/components/ui/number-input';

export interface CustomPriceField {
  label: string;
  amount: number;
}

export interface OutfitMaterialRequirement {
  name: string;
  quantityPerPc: number;
  unit: string;
}

export interface OrderItemData {
  itemDescription: string;
  category: string;
  outfitStyleId?: string;
  quantity: number;
  unitRate: number;
  fabricDetails?: string;
  materialsList?: OutfitMaterialRequirement[]; // Itemized materials
  sizeBreakdown?: string;
  sizesMap?: Record<string, number>;
  customPriceFields?: CustomPriceField[];
  priceBreakup?: any;
}

export interface BulkOrderFormData {
  items: OrderItemData[];
  shippingCharges: number;
  packingCharges: number;
  materialCharges?: number;
  materialProvidedBy?: 'Client' | 'Company';
  gstEnabled?: boolean;
  gstPercentage?: number;
  advanceType?: 'percentage' | 'custom';
  advancePercentage?: number;
  advanceCustomAmount?: number;
  discountType?: 'percentage' | 'fixed';
  discountPercentage?: number;
  discountAmount?: number;
  estimatedDelivery: string;
  deliverySchedule: string;
  fabricProcurement: string;
  packingBrandingNotes: string;
  materialReceivedDetails: string;
  referenceImages: string[];
  materialImages: string[];
}

interface BulkOrderFormProps {
  data: BulkOrderFormData;
  step?: number;
  onChange: (updated: Partial<BulkOrderFormData>) => void;
}

export const BulkOrderForm: React.FC<BulkOrderFormProps> = ({ data, step = 2, onChange }) => {
  const [outfitStyles, setOutfitStyles] = useState<any[]>([]);
  const [customSizes, setCustomSizes] = useState<any[]>([]);

  // Local state for adding custom size on the fly
  const [newSizeKey, setNewSizeKey] = useState<Record<number, string>>({});
  const [newSizeQty, setNewSizeQty] = useState<Record<number, number>>({});

  // Local state for adding custom price breakup field on the fly
  const [newPriceLabel, setNewPriceLabel] = useState<Record<number, string>>({});
  const [newPriceAmount, setNewPriceAmount] = useState<Record<number, number>>({});

  useEffect(() => {
    fetch('/api/settings/outfit-styles')
      .then((res) => res.json())
      .then((d) => d.success && setOutfitStyles(d.styles || []))
      .catch((err) => console.error('Failed to load outfit styles:', err));

    fetch('/api/settings/sizes')
      .then((res) => res.json())
      .then((d) => d.success && setCustomSizes(d.sizes || []))
      .catch((err) => console.error('Failed to load sizes:', err));

    fetch('/api/settings/gst')
      .then((res) => res.json())
      .then((d) => {
        if (d.success && d.setting) {
          onChange({
            gstEnabled: d.setting.gstEnabled,
            gstPercentage: d.setting.gstPercentage,
          });
        }
      })
      .catch((err) => console.error('Failed to load GST settings:', err));
  }, []);


  const addItem = () => {
    const newItem: OrderItemData = {
      itemDescription: '',
      category: '',
      quantity: 0,
      unitRate: 0,
      fabricDetails: '',
      materialsList: [],
      sizeBreakdown: '',
      sizesMap: {},
      customPriceFields: [{ label: 'Base Stitching', amount: 0 }],
    };
    onChange({ items: [...data.items, newItem] });
  };


  const removeItem = (index: number) => {
    if (data.items.length === 1) return;
    const updated = data.items.filter((_, i) => i !== index);
    onChange({ items: updated });
  };

  const updateItem = (index: number, field: keyof OrderItemData, value: any) => {
    const updated = [...data.items];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ items: updated });
  };

  // Update quantity for a size key in item's sizesMap
  const updateSizeQty = (itemIndex: number, sizeCode: string, qty: number) => {
    const updated = [...data.items];
    const item = updated[itemIndex];
    const newMap = { ...item.sizesMap, [sizeCode]: Math.max(0, qty) };

    const totalQty = Object.values(newMap).reduce((sum, q) => sum + (Number(q) || 0), 0);
    const breakdownText = Object.entries(newMap)
      .filter(([_, q]) => q > 0)
      .map(([code, q]) => `${code}: ${q}`)
      .join(', ');

    updated[itemIndex] = {
      ...item,
      sizesMap: newMap,
      quantity: totalQty > 0 ? totalQty : item.quantity,
      sizeBreakdown: breakdownText,
    };

    onChange({ items: updated });
  };

  const handleAddOnTheSpotSize = (itemIndex: number) => {
    const code = (newSizeKey[itemIndex] || '').trim().toUpperCase();
    const qty = newSizeQty[itemIndex] || 1;
    if (!code) return;

    updateSizeQty(itemIndex, code, qty);
    setNewSizeKey((prev) => ({ ...prev, [itemIndex]: '' }));
    setNewSizeQty((prev) => ({ ...prev, [itemIndex]: 1 }));
  };

  const handleRemoveSizeKey = (itemIndex: number, sizeCode: string) => {
    const updated = [...data.items];
    const item = updated[itemIndex];
    const newMap = { ...item.sizesMap };
    delete newMap[sizeCode];

    const totalQty = Object.values(newMap).reduce((sum, q) => sum + (Number(q) || 0), 0);
    const breakdownText = Object.entries(newMap)
      .filter(([_, q]) => q > 0)
      .map(([code, q]) => `${code}: ${q}`)
      .join(', ');

    updated[itemIndex] = {
      ...item,
      sizesMap: newMap,
      quantity: totalQty,
      sizeBreakdown: breakdownText,
    };

    onChange({ items: updated });
  };

  const updatePriceFieldAmount = (itemIndex: number, fieldIndex: number, newAmount: number) => {
    const updated = [...data.items];
    const item = updated[itemIndex];
    const newFields = [...(item.customPriceFields || [])];
    newFields[fieldIndex] = { ...newFields[fieldIndex], amount: Math.max(0, newAmount) };

    const totalRate = newFields.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    updated[itemIndex] = {
      ...item,
      customPriceFields: newFields,
      unitRate: totalRate > 0 ? totalRate : item.unitRate,
    };

    onChange({ items: updated });
  };

  const handleAddCustomPriceField = (itemIndex: number) => {
    const label = (newPriceLabel[itemIndex] || '').trim();
    const amount = newPriceAmount[itemIndex] || 0;
    if (!label) return;

    const updated = [...data.items];
    const item = updated[itemIndex];
    const newFields = [...(item.customPriceFields || []), { label, amount }];
    const totalRate = newFields.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    updated[itemIndex] = {
      ...item,
      customPriceFields: newFields,
      unitRate: totalRate,
    };

    setNewPriceLabel((prev) => ({ ...prev, [itemIndex]: '' }));
    setNewPriceAmount((prev) => ({ ...prev, [itemIndex]: 0 }));
    onChange({ items: updated });
  };

  const handleRemovePriceField = (itemIndex: number, fieldIndex: number) => {
    const updated = [...data.items];
    const item = updated[itemIndex];
    const newFields = (item.customPriceFields || []).filter((_, idx) => idx !== fieldIndex);
    const totalRate = newFields.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    updated[itemIndex] = {
      ...item,
      customPriceFields: newFields,
      unitRate: totalRate,
    };

    onChange({ items: updated });
  };

  const handleSelectOutfitStyle = (index: number, styleId: string) => {
    const selected = outfitStyles.find((s) => s.id === styleId);
    if (!selected) return;

    let parsedMaterials: OutfitMaterialRequirement[] = [];
    try {
      if (selected.materialsJson) parsedMaterials = JSON.parse(selected.materialsJson);
    } catch (e) {}

    const defaultFields: CustomPriceField[] = [
      { label: 'Base Stitching', amount: selected.bulkBaseStitchingCost || selected.baseStitchingCost || 500 },
      { label: 'Lining / Canvas', amount: 0 },
      { label: 'Embroidery / Handwork', amount: 0 },
      { label: 'Finishing & Latkan', amount: 0 },
    ];

    const updated = [...data.items];
    updated[index] = {
      ...updated[index],
      outfitStyleId: selected.id,
      itemDescription: selected.name,
      category: selected.category || 'Ethnic Wear',
      unitRate: selected.bulkBaseStitchingCost || selected.baseStitchingCost || 500,
      fabricDetails: selected.materialRequiredSpecs || updated[index].fabricDetails,
      materialsList: parsedMaterials,
      customPriceFields: defaultFields,
    };
    onChange({ items: updated });
  };

  const handleClearOutfitStyle = (index: number) => {
    const updated = [...data.items];
    updated[index] = {
      ...updated[index],
      outfitStyleId: undefined,
      itemDescription: '',
    };
    onChange({ items: updated });
  };

  const handleCustomStyleType = (index: number, val: string) => {
    const updated = [...data.items];
    updated[index] = {
      ...updated[index],
      outfitStyleId: undefined,
      itemDescription: val,
    };
    onChange({ items: updated });
  };

  // Financial calculations
  const totalUnits = data.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const subtotal = data.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitRate) || 0), 0);
  const materialTotal = data.materialProvidedBy === 'Company' ? (Number(data.materialCharges) || 0) * totalUnits : 0;
  const grossTotal = subtotal + materialTotal + (Number(data.shippingCharges) || 0) + (Number(data.packingCharges) || 0);

  const discountType = data.discountType || 'fixed';
  let discountValue = 0;
  if (discountType === 'percentage') {
    discountValue = ((subtotal + materialTotal) * (Number(data.discountPercentage) || 0)) / 100;
  } else {
    discountValue = Number(data.discountAmount) || 0;
  }

  const taxableSubtotal = Math.max(0, grossTotal - discountValue);
  const gstAmount = data.gstEnabled ? (taxableSubtotal * (Number(data.gstPercentage) || 0)) / 100 : 0;
  const totalAmount = taxableSubtotal + gstAmount;

  const advanceType = data.advanceType || 'percentage';
  const advancePercentage = data.advancePercentage !== undefined ? data.advancePercentage : 50;

  let advancePaid = 0;
  if (advanceType === 'percentage') {
    advancePaid = (totalAmount * advancePercentage) / 100;
  } else {
    advancePaid = data.advanceCustomAmount !== undefined ? data.advanceCustomAmount : Math.round(totalAmount * 0.5);
  }

  const balanceDue = Math.max(0, totalAmount - advancePaid);

  return (
    <div className="bg-white dark:bg-zinc-900 p-3 sm:p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3 sm:space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 flex justify-between items-center">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            {step === 2 && "Garment Specifications (Step 2 of 5)"}
            {step === 3 && "Materials & Design (Step 3 of 5)"}
            {step === 4 && "Billing & Summary (Step 4 of 5)"}
            {!step && "Bulk Manufacturing Order"}
          </h3>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {step === 2 && "Configure garment types, order quantities, size matrix, and stitching cost breakups."}
            {step === 3 && "Provide material specs, check fabric requirements, and upload reference designs."}
            {step === 4 && "Set shipping/packing fees, apply discounts, select deposit rate, and review order totals."}
            {!step && "Select outfit styles, set unit quantities per size matrix, add custom price breakups."}
          </p>
        </div>
        {(step === 2 || !step) && (
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 rounded-md text-[11px] font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        )}
      </div>

      {/* STEP 2: Garment Items */}
      {(step === 2 || !step) && (
        <div className="space-y-3 sm:space-y-6">
          {data.items.map((item, index) => {
            const sizesMap = item.sizesMap || {};
            const customPriceFields = item.customPriceFields || [];
            return (
              <div key={index} className="p-3 sm:p-5 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border border-zinc-200 dark:border-zinc-700 space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Garment Item #{index + 1}
                  </span>
                  {data.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700 p-1 transition"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Garment Basic Info - 2 Columns on Mobile */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <div className="col-span-2 sm:col-span-2">
                    <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">
                      Style / Description *
                      <span className="ml-1 text-[10px] text-zinc-400 font-normal normal-case">— type custom or pick a preset</span>
                    </label>
                    <PresetStyleCombobox
                      presets={outfitStyles}
                      value={item.itemDescription}
                      selectedPresetId={item.outfitStyleId}
                      onSelectPreset={(preset) => handleSelectOutfitStyle(index, preset.id)}
                      onCustomType={(val) => handleCustomStyleType(index, val)}
                      onClear={() => handleClearOutfitStyle(index)}
                      placeholder="e.g. Lehenga Choli Set"
                      priceMode="bulk"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">Qty (Pcs) *</label>
                    <NumberInput
                      min={1}
                      value={item.quantity}
                      onChange={(val) => updateItem(index, 'quantity', val)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-xs font-bold text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">Unit Rate (₹) *</label>
                    <NumberInput
                      min={0}
                      value={item.unitRate}
                      onChange={(val) => updateItem(index, 'unitRate', val)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-xs font-bold text-emerald-600"
                    />
                  </div>
                </div>

                {/* Compact Size Breakdown Matrix Grid */}
                <div className="p-3 sm:p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                  <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                    <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                      Size Matrix & Quantities
                    </span>
                    <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
                      Total: <strong>{item.quantity} pcs</strong>
                    </span>
                  </div>

                  {/* 3-column Grid on Mobile, 6-column on Desktop */}
                  {(() => {
                    const isBlouseItem = (item.itemDescription || '').toLowerCase().includes('blouse');
                    return (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 items-center">
                        {customSizes
                          .filter((sz) => {
                            const isBlouseSize = sz.code.toLowerCase().includes('blouse') || sz.name.toLowerCase().includes('blouse') || /^\d+$/.test(sz.code);
                            return isBlouseItem ? isBlouseSize : !isBlouseSize;
                          })
                          .map((sz) => {
                            const currentQty = sizesMap[sz.code] || 0;
                            let measObj: Record<string, string> = {};
                            try {
                              if (sz.measurementsJson) measObj = JSON.parse(sz.measurementsJson);
                            } catch (e) {}

                            const measText = Object.entries(measObj)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(' | ');

                            return (
                              <div
                                key={sz.id}
                                title={measText ? `Body Measurements (${sz.code}): ${measText}` : undefined}
                                className={`flex items-center justify-between px-1.5 py-1 rounded border text-[11px] font-medium transition ${
                                  currentQty > 0
                                    ? 'bg-zinc-100 border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
                                    : 'bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 text-zinc-500'
                                }`}
                              >
                                <span className="font-bold font-mono text-xs">{sz.code.replace(/^blouse\s+/i, '')}:</span>
                                <NumberInput
                                  min={0}
                                  allowDecimals={false}
                                  value={currentQty}
                                  onChange={(val) => updateSizeQty(index, sz.code, val)}
                                  className="w-12 h-6 px-0.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-center text-xs font-bold focus:outline-none"
                                />
                              </div>
                            );
                          })}

                        {Object.entries(sizesMap)
                          .filter(([code]) => !customSizes.some((s) => s.code === code))
                          .filter(([code]) => {
                            const isBlouseSize = code.toLowerCase().includes('blouse');
                            return isBlouseItem ? isBlouseSize : !isBlouseSize;
                          })
                          .map(([code, qty]) => (
                            <div
                              key={code}
                              className="flex items-center justify-between px-1.5 py-1 rounded border bg-amber-50/60 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800 text-amber-950 dark:text-amber-200 text-[11px]"
                            >
                              <span className="font-bold font-mono text-xs">{code}:</span>
                              <div className="flex items-center gap-0.5">
                            <NumberInput
                              min={0}
                              allowDecimals={false}
                              value={qty}
                              onChange={(val) => updateSizeQty(index, code, val)}
                              className="w-12 h-6 px-0.5 bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 rounded text-center text-xs font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveSizeKey(index, code)}
                              className="text-red-500 hover:text-red-700 p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      </div>
                    );
                  })()}

                  <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-gray-100 dark:border-zinc-800">
                    <span className="text-[11px] font-medium text-gray-500">Add Custom Size on the spot:</span>
                    <input
                      type="text"
                      placeholder="e.g. 4XL or 38"
                      value={newSizeKey[index] || ''}
                      onChange={(e) => setNewSizeKey((prev) => ({ ...prev, [index]: e.target.value }))}
                      className="w-24 px-2 py-1 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded text-xs font-mono uppercase"
                    />
                    <NumberInput
                      min={1}
                      allowDecimals={false}
                      placeholder="Qty"
                      value={newSizeQty[index] || 1}
                      onChange={(val) => setNewSizeQty((prev) => ({ ...prev, [index]: val }))}
                      className="w-16 px-2 py-1 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded text-xs text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddOnTheSpotSize(index)}
                      className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded text-xs font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Size
                    </button>
                  </div>
                </div>

                {/* Dynamic Itemized Price Breakup Builder */}
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 space-y-3">
                  <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-2">
                    <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      Itemized Cost Breakup per Piece (Reflected on Invoice)
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Unit Total: ₹{item.unitRate}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    {customPriceFields.map((field, fIdx) => (
                      <div key={fIdx} className="p-2.5 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 space-y-1 relative">
                        <div className="flex justify-between items-center text-[11px] font-semibold text-gray-700 dark:text-zinc-300">
                          <span className="truncate">{field.label}</span>
                          {fIdx >= 4 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePriceField(index, fIdx)}
                              className="text-red-500 hover:text-red-700 p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">₹</span>
                          <NumberInput
                            min={0}
                            value={field.amount}
                            onChange={(val) => updatePriceFieldAmount(index, fIdx, val)}
                            className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded text-xs font-bold text-emerald-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-gray-100 dark:border-zinc-800">
                    <span className="text-[11px] font-medium text-gray-500">Add Custom Cost Charge on the spot:</span>
                    <input
                      type="text"
                      placeholder="e.g. Dyeing / Latkan"
                      value={newPriceLabel[index] || ''}
                      onChange={(e) => setNewPriceLabel((prev) => ({ ...prev, [index]: e.target.value }))}
                      className="w-36 px-2 py-1 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded text-xs"
                    />
                    <NumberInput
                      min={0}
                      placeholder="Amount (₹)"
                      value={newPriceAmount[index] || 0}
                      onChange={(val) => setNewPriceAmount((prev) => ({ ...prev, [index]: val }))}
                      className="w-24 px-2 py-1 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCustomPriceField(index)}
                      className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded text-xs font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Charge
                    </button>
                  </div>
                </div>

                <div className="text-right text-xs font-bold text-gray-800 dark:text-zinc-200 pt-1">
                  Line Total ({item.quantity} pcs @ ₹{item.unitRate}): ₹{((Number(item.quantity) || 0) * (Number(item.unitRate) || 0)).toLocaleString('en-IN')}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* STEP 3: Materials & Design */}
      {(step === 3 || !step) && (
        <div className="space-y-3 sm:space-y-6">
          {data.items.map((item, index) => {
            const materialsList = item.materialsList || [];
            return (
              <div key={index} className="p-3 sm:p-5 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border border-zinc-200 dark:border-zinc-700 space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-150 dark:border-zinc-700 pb-2">
                  <span className="text-xs font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">
                    Garment Item #{index + 1}: {item.itemDescription || 'Custom Outfit'} ({item.quantity} pcs)
                  </span>
                </div>

                {/* Calculated Material Requirements */}
                {materialsList.length > 0 && (
                  <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        Calculated Total Material Requirements for {item.quantity} Pcs
                      </span>
                      <span className="text-[10px] text-indigo-700 dark:text-indigo-300 italic">
                        Auto-multiplied by {item.quantity} units
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      {materialsList.map((m, mIdx) => {
                        const totalNeeded = ((Number(m.quantityPerPc) || 0) * (Number(item.quantity) || 0)).toFixed(1);
                        return (
                          <div key={mIdx} className="p-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-indigo-100 dark:border-indigo-900 text-xs">
                            <span className="block text-[11px] text-gray-500 dark:text-zinc-400">{m.name}</span>
                            <div className="flex justify-between items-baseline mt-1">
                              <span className="text-[10px] text-gray-400 font-mono">{m.quantityPerPc} {m.unit} / pc</span>
                              <strong className="text-sm font-extrabold text-indigo-700 dark:text-indigo-300">
                                {totalNeeded} {m.unit}
                              </strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Fabric Specs */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                    Material Specs, Fabric Requirements & Details
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. 4.5m Main Velvet fabric + 3m Satin inner lining + Can-can net + Heavy Canvas provided by client."
                    value={item.fabricDetails || ''}
                    onChange={(e) => updateItem(index, 'fabricDetails', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg text-xs"
                  />
                </div>
              </div>
            );
          })}

          {/* Sourcing selection */}
          <div className="p-4 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700 space-y-3">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Scissors className="w-4 h-4 text-indigo-600" /> Material / Fabric Source & Material Charges
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                  Who Provides the Fabric / Material?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="materialSource"
                      value="Client"
                      checked={data.materialProvidedBy === 'Client'}
                      onChange={() => onChange({ materialProvidedBy: 'Client', materialCharges: 0 })}
                      className="text-indigo-600"
                    />
                    Provided by Client (Clause 1)
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="materialSource"
                      value="Company"
                      checked={data.materialProvidedBy === 'Company'}
                      onChange={() => onChange({ materialProvidedBy: 'Company' })}
                      className="text-indigo-600"
                    />
                    Provided by Us (Company In-house Material)
                  </label>
                </div>
              </div>

              {data.materialProvidedBy === 'Company' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                    Company Material Charges per Piece (₹) *
                  </label>
                  <NumberInput
                    min={0}
                    placeholder="e.g. 250 (Material rate per piece)"
                    value={data.materialCharges}
                    onChange={(val) => onChange({ materialCharges: val })}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-xs font-bold text-indigo-600"
                  />
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
                    Total Material Cost: ₹{(Number(data.materialCharges) || 0).toLocaleString('en-IN')} / pc × {totalUnits} pcs = <strong>₹{materialTotal.toLocaleString('en-IN')}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cloudinary Image Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-zinc-800">
            <CloudinaryUpload
              label="Reference Output Images (Sketches / Design Photos)"
              description="Upload reference photos or design sketches provided by client."
              images={data.referenceImages}
              onChange={(urls) => onChange({ referenceImages: urls })}
            />

            <CloudinaryUpload
              label="Material Received Images (Raw Fabric Photos)"
              description="Upload photos of raw fabric/material received from client."
              images={data.materialImages}
              onChange={(urls) => onChange({ materialImages: urls })}
            />
          </div>

          {/* Material Received Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Material Details & Vendor Notes
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Received 50 meters Velvet fabric (Roll #A-102) + 30 meters satin lining on 30-July-2026. Includes matching thread spools and custom gold zippers."
              value={data.materialReceivedDetails}
              onChange={(e) => onChange({ materialReceivedDetails: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-xs leading-relaxed"
            />
          </div>

          {/* ── Delivery Timeline & Remarks ── */}
          <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40 space-y-4">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              Delivery Timeline & Order Remarks
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Estimated Delivery Date — REQUIRED */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                  Estimated Delivery Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={data.estimatedDelivery}
                  onChange={(e) => onChange({ estimatedDelivery: e.target.value })}
                  className={`w-full px-3 py-2 bg-white dark:bg-zinc-900 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/40 ${
                    !data.estimatedDelivery
                      ? 'border-red-400 dark:border-red-600 ring-1 ring-red-300 dark:ring-red-700'
                      : 'border-amber-300 dark:border-amber-700'
                  }`}
                />
                {!data.estimatedDelivery && (
                  <p className="text-[10px] text-red-500 mt-0.5 font-medium">
                    Estimated delivery date is required
                  </p>
                )}
              </div>

              {/* Delivery Schedule / Milestones */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                  Delivery Schedule / Milestones
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50% by Aug 15, balance by Aug 30"
                  value={data.deliverySchedule}
                  onChange={(e) => onChange({ deliverySchedule: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fabric Procurement Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                  Fabric Procurement Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Client to provide fabric by Aug 5. Factory to source buttons and zippers."
                  value={data.fabricProcurement}
                  onChange={(e) => onChange({ fabricProcurement: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                />
              </div>

              {/* Packing & Branding Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                  Packing & Branding Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Pack individually in poly bags. Attach label tags. Use brand tissue paper."
                  value={data.packingBrandingNotes}
                  onChange={(e) => onChange({ packingBrandingNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Billing & Summary */}
      {(step === 4 || !step) && (
        <div className="space-y-4 sm:space-y-6">
          {step === 4 && (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/45 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-bold text-zinc-750 dark:text-zinc-200 uppercase tracking-wider block mb-2.5">
                Items Selected Review
              </span>
              <div className="space-y-2">
                {data.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs text-zinc-650 dark:text-zinc-300 border-b border-zinc-200/50 dark:border-zinc-700/50 pb-1.5 last:border-0 last:pb-0">
                    <div>
                      <span className="font-bold">Item #{idx+1}: {item.itemDescription}</span>
                      <span className="text-[10px] text-zinc-500 block">Category: {item.category} | Qty: {item.quantity} pcs | Rate: ₹{item.unitRate}</span>
                    </div>
                    <span className="font-bold">₹{((item.quantity || 0) * (item.unitRate || 0)).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Packaging, Shipping & Discount */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-indigo-600" />
                Packing & Branding Charges (₹)
              </label>
              <NumberInput
                min={0}
                value={data.packingCharges}
                onChange={(val) => onChange({ packingCharges: val })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-indigo-600" />
                Estimated Shipping Charges (₹)
              </label>
              <NumberInput
                min={0}
                value={data.shippingCharges}
                onChange={(val) => onChange({ shippingCharges: val })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Order Discount
                </span>
                <select
                  value={data.discountType || 'fixed'}
                  onChange={(e) => onChange({ discountType: e.target.value as 'percentage' | 'fixed' })}
                  className="px-1.5 py-0.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-[11px] font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none"
                >
                  <option value="fixed">Fixed ₹ Amount</option>
                  <option value="percentage">% Percentage</option>
                </select>
              </label>
              <div className="flex items-center gap-1.5">
                {(data.discountType || 'fixed') === 'percentage' ? (
                  <div className="relative w-full">
                    <NumberInput
                      min={0}
                      max={100}
                      placeholder="Discount %"
                      value={data.discountPercentage || 0}
                      onChange={(val) => onChange({ discountPercentage: Math.min(100, Math.max(0, val)) })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">%</span>
                  </div>
                ) : (
                  <div className="relative w-full">
                    <span className="absolute left-3 top-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">₹</span>
                    <NumberInput
                      min={0}
                      placeholder="Discount ₹"
                      value={data.discountAmount || 0}
                      onChange={(val) => onChange({ discountAmount: val })}
                      className="w-full pl-7 pr-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Financial Summary Box */}
          <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-2">
            <div className="flex justify-between text-xs text-gray-700 dark:text-zinc-300">
              <span>Stitching Subtotal:</span>
              <span className="font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {data.materialProvidedBy === 'Company' && materialTotal > 0 && (
              <div className="flex justify-between text-xs text-gray-700 dark:text-zinc-300">
                <span>Company Material Charges (₹{(Number(data.materialCharges) || 0).toLocaleString('en-IN')}/pc × {totalUnits} pcs):</span>
                <span className="font-semibold">₹{materialTotal.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-700 dark:text-zinc-300">
              <span>Packing & Branding:</span>
              <span className="font-semibold">₹{(Number(data.packingCharges) || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-700 dark:text-zinc-300">
              <span>Shipping Charges:</span>
              <span className="font-semibold">₹{(Number(data.shippingCharges) || 0).toLocaleString('en-IN')}</span>
            </div>

            {discountValue > 0 && (
              <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400 font-semibold border-t border-indigo-200/40 dark:border-indigo-800/40 pt-1">
                <span>Order Discount ({discountType === 'percentage' ? `${data.discountPercentage}%` : 'Fixed'}):</span>
                <span>- ₹{Math.round(discountValue).toLocaleString('en-IN')}</span>
              </div>
            )}

            {data.gstEnabled && gstAmount > 0 && (
              <div className="flex justify-between text-xs text-indigo-700 dark:text-indigo-300 font-semibold border-t border-indigo-200/50 pt-1">
                <span>GST ({data.gstPercentage}%):</span>
                <span>+ ₹{gstAmount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold text-gray-900 dark:text-zinc-100 border-t border-indigo-200 dark:border-indigo-800/60 pt-2">
              <span>Grand Total Value:</span>
              <span>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-emerald-50 dark:bg-emerald-950/60 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-xs flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Advance Required:
                  </span>
                  <select
                    value={advanceType}
                    onChange={(e) => onChange({ advanceType: e.target.value as 'percentage' | 'custom' })}
                    className="px-1.5 py-0.5 bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-700 rounded text-[11px] font-bold text-emerald-800 dark:text-emerald-200 focus:outline-none"
                  >
                    <option value="percentage">% Percentage</option>
                    <option value="custom">Fixed ₹ Amount</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
                  {advanceType === 'percentage' ? (
                    <div className="flex items-center gap-1">
                      <NumberInput
                        min={0}
                        max={100}
                        value={advancePercentage}
                        onChange={(val) => onChange({ advancePercentage: Math.min(100, Math.max(0, val)) })}
                        className="w-16 px-2 py-1 bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-700 rounded text-xs font-bold text-emerald-700 dark:text-emerald-300 text-center"
                      />
                      <span className="font-bold text-xs">% Rate</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs">₹</span>
                      <NumberInput
                        min={0}
                        max={totalAmount}
                        value={data.advanceCustomAmount !== undefined ? data.advanceCustomAmount : Math.round(totalAmount * 0.5)}
                        onChange={(val) => onChange({ advanceCustomAmount: val })}
                        className="w-28 px-2 py-1 bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-700 rounded text-xs font-bold text-emerald-700 dark:text-emerald-300"
                      />
                    </div>
                  )}

                  <div className="text-right">
                    <span className="text-sm sm:text-base font-extrabold text-emerald-700 dark:text-emerald-300 block">
                      ₹{Math.round(advancePaid).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/60 p-3 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs flex flex-col justify-between">
                <span className="block font-semibold">Remaining Balance Due before Dispatch:</span>
                <span className="text-sm sm:text-base font-extrabold text-amber-700 dark:text-amber-300 block pt-1">
                  ₹{Math.round(balanceDue).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
