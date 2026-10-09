"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Plus, Check, Scissors, Ruler, Percent, Save, Trash2, PenTool, UploadCloud, Building, Pencil, X, Loader2, Layers, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { useProductionStore } from '@/store/productionStore';
import { CloudinaryUpload } from '@/components/ui/CloudinaryUpload';
import { toast } from 'sonner';


export interface OutfitMaterialItem {
  name: string;
  quantityPerPc: number;
  unit: string;
}

export default function SettingsPage() {
  const { settings, updateSettings } = useProductionStore();

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'profile' | 'outfits' | 'sizes' | 'tax' | 'security'>('profile');

  // Password Management State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Company Profile & Digital Signature State
  const [companyName, setCompanyName] = useState(settings.companyName || 'Radhe Vastraz');
  const [companySignatoryName, setCompanySignatoryName] = useState(settings.companySignatoryName || 'RAADHE LABEL part of RADHE VASTRAZ');
  const [companyDesignation, setCompanyDesignation] = useState(settings.companyDesignation || 'Authorized Signatory & Managing Director');
  const [companySignature, setCompanySignature] = useState(settings.companySignature || '');
  const [companyAddress, setCompanyAddress] = useState(settings.address || '');
  const [companyEmail, setCompanyEmail] = useState(settings.email || '');
  const [companyPhone, setCompanyPhone] = useState(settings.phone || '');

  const [outfitStyles, setOutfitStyles] = useState<any[]>([]);
  const [customSizes, setCustomSizes] = useState<any[]>([]);

  // GST State
  const [gstEnabled, setGstEnabled] = useState<boolean>(false);
  const [gstPercentage, setGstPercentage] = useState<string>('5');
  const [sizeChartEnabled, setSizeChartEnabled] = useState<boolean>(true);


  // New Outfit Style Form
  const [newStyleName, setNewStyleName] = useState('');
  const [newStyleCategory, setNewStyleCategory] = useState('Ethnic Wear');
  const [newStyleCost, setNewStyleCost] = useState('800');
  const [newStyleBoutiqueCost, setNewStyleBoutiqueCost] = useState('800');
  const [newStyleBulkCost, setNewStyleBulkCost] = useState('600');
  const [newStyleImages, setNewStyleImages] = useState<string[]>([]);
  const [materialsList, setMaterialsList] = useState<OutfitMaterialItem[]>([
    { name: 'Main Fabric', quantityPerPc: 4.5, unit: 'meters' },
    { name: 'Inner Lining', quantityPerPc: 3.0, unit: 'meters' },
  ]);

  // New Custom Size Form
  const [newSizeName, setNewSizeName] = useState('');
  const [newSizeCode, setNewSizeCode] = useState('');
  const [sizeMeasurementsMap, setSizeMeasurementsMap] = useState<Record<string, string>>({
    Bust: '36 in',
    Waist: '30 in',
    Hip: '40 in',
    Shoulder: '14.5 in',
  });

  const [newMeasKey, setNewMeasKey] = useState('');
  const [newMeasVal, setNewMeasVal] = useState('');

  // Edit Mode Trackers
  const [editingStyleId, setEditingStyleId] = useState<string | null>(null);
  const [editingSizeId, setEditingSizeId] = useState<string | null>(null);

  const [msg, setMsg] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingStyle, setIsSavingStyle] = useState(false);
  const [isSavingSize, setIsSavingSize] = useState(false);
  const [isSavingGst, setIsSavingGst] = useState(false);
  const [deletingStyleId, setDeletingStyleId] = useState<string | null>(null);
  const [deletingSizeId, setDeletingSizeId] = useState<string | null>(null);

  const loadSettingsData = async () => {
    try {
      const resStyles = await fetch('/api/settings/outfit-styles');
      const dataStyles = await resStyles.json();
      if (dataStyles.success) setOutfitStyles(dataStyles.styles || []);

      const resSizes = await fetch('/api/settings/sizes');
      const dataSizes = await resSizes.json();
      if (dataSizes.success) setCustomSizes(dataSizes.sizes || []);

      const resGst = await fetch('/api/settings/gst');
      const dataGst = await resGst.json();
      if (dataGst.success && dataGst.setting) {
        setGstEnabled(dataGst.setting.gstEnabled);
        setGstPercentage(String(dataGst.setting.gstPercentage));
        setSizeChartEnabled(dataGst.setting.sizeChartEnabled ?? true);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  useEffect(() => {
    if (settings) {
      if (settings.companyName) setCompanyName(settings.companyName);
      if (settings.companySignatoryName) setCompanySignatoryName(settings.companySignatoryName);
      if (settings.companyDesignation) setCompanyDesignation(settings.companyDesignation);
      if (settings.companySignature !== undefined) setCompanySignature(settings.companySignature);
      if (settings.address !== undefined) setCompanyAddress(settings.address);
      if (settings.email !== undefined) setCompanyEmail(settings.email);
      if (settings.phone !== undefined) setCompanyPhone(settings.phone);
    }
  }, [settings]);

  const handleSignatureFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCompanySignature(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCompanyProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      updateSettings({
        companyName,
        companySignatoryName,
        companyDesignation,
        companySignature,
        address: companyAddress,
        email: companyEmail,
        phone: companyPhone,
      });
      toast.success('Company profile, address, and signature saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save company profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveGst = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGst(true);
    try {
      const res = await fetch('/api/settings/gst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gstEnabled,
          gstPercentage: parseFloat(gstPercentage) || 0,
          sizeChartEnabled,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('GST configuration saved successfully!');
      } else {
        toast.error(data.error || 'Failed to save GST configuration');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'An error occurred while saving GST configuration');
    } finally {
      setIsSavingGst(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Current password and new password are required');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to update password');
      } else {
        toast.success(data.message || 'Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  
  // Material Item handlers
  const handleAddMaterialField = () => {
    setMaterialsList([...materialsList, { name: '', quantityPerPc: 1.0, unit: 'meters' }]);
  };

  const handleRemoveMaterialField = (index: number) => {
    setMaterialsList(materialsList.filter((_, i) => i !== index));
  };

  const handleUpdateMaterialField = (index: number, field: keyof OutfitMaterialItem, val: any) => {
    const updated = [...materialsList];
    updated[index] = { ...updated[index], [field]: val };
    setMaterialsList(updated);
  };

  const handleAddOutfitStyle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStyleName) return;

    const specsSummary = materialsList
      .filter((m) => m.name)
      .map((m) => `${m.quantityPerPc}${m.unit} ${m.name}`)
      .join(' + ');

    setIsSavingStyle(true);
    try {
      const url = '/api/settings/outfit-styles';
      const method = editingStyleId ? 'PUT' : 'POST';
      const payload = {
        id: editingStyleId || undefined,
        name: newStyleName,
        category: newStyleCategory,
        baseStitchingCost: parseFloat(newStyleBoutiqueCost) || 500,
        boutiqueBaseStitchingCost: parseFloat(newStyleBoutiqueCost) || 500,
        bulkBaseStitchingCost: parseFloat(newStyleBulkCost) || 500,
        materialRequiredSpecs: specsSummary,
        materials: materialsList.filter((m) => m.name),
        referenceImages: newStyleImages,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingStyleId ? 'Outfit Style template updated!' : 'Outfit Style template added!');
        handleCancelEditStyle();
        loadSettingsData();
      } else {
        toast.error(data.error || 'Failed to save outfit style template');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'An error occurred while saving outfit style template');
    } finally {
      setIsSavingStyle(false);
    }
  };

  const handleStartEditStyle = (style: any) => {
    setEditingStyleId(style.id);
    setNewStyleName(style.name);
    setNewStyleCategory(style.category || 'Ethnic Wear');
    setNewStyleCost(String(style.baseStitchingCost || 800));
    setNewStyleBoutiqueCost(String(style.boutiqueBaseStitchingCost || style.baseStitchingCost || 800));
    setNewStyleBulkCost(String(style.bulkBaseStitchingCost || style.baseStitchingCost || 600));

    let styleImages: string[] = [];
    try {
      if (style.referenceImages) styleImages = JSON.parse(style.referenceImages);
    } catch (e) { }
    setNewStyleImages(styleImages);

    let materialsArray: OutfitMaterialItem[] = [];
    try {
      if (style.materialsJson) materialsArray = JSON.parse(style.materialsJson);
    } catch (e) { }
    setMaterialsList(materialsArray);
  };

  const handleCancelEditStyle = () => {
    setEditingStyleId(null);
    setNewStyleName('');
    setNewStyleBoutiqueCost('800');
    setNewStyleBulkCost('600');
    setNewStyleImages([]);
    setMaterialsList([
      { name: 'Main Fabric', quantityPerPc: 4.5, unit: 'meters' },
      { name: 'Inner Lining', quantityPerPc: 3.0, unit: 'meters' },
    ]);
  };

  const handleDeleteStyle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this outfit style preset?')) return;
    setDeletingStyleId(id);
    try {
      const res = await fetch(`/api/settings/outfit-styles?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Outfit Style template deleted successfully.');
        loadSettingsData();
        if (editingStyleId === id) handleCancelEditStyle();
      } else {
        toast.error(data.error || 'Failed to delete outfit style template');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'An error occurred while deleting outfit style template');
    } finally {
      setDeletingStyleId(null);
    }
  };

  // Size Measurement Handlers
  const handleAddMeasurementToMap = () => {
    if (!newMeasKey || !newMeasVal) return;
    setSizeMeasurementsMap((prev) => ({ ...prev, [newMeasKey]: newMeasVal }));
    setNewMeasKey('');
    setNewMeasVal('');
  };

  const handleRemoveMeasurementFromMap = (key: string) => {
    const updated = { ...sizeMeasurementsMap };
    delete updated[key];
    setSizeMeasurementsMap(updated);
  };

  const handleUpdateMeasurementInMap = (oldKey: string, newKey: string, newVal: string) => {
    setSizeMeasurementsMap((prev) => {
      const updated: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (k === oldKey) {
          updated[newKey] = newVal;
        } else {
          updated[k] = v;
        }
      }
      return updated;
    });
  };

  const handleAddSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSizeName || !newSizeCode) return;

    setIsSavingSize(true);
    try {
      const url = '/api/settings/sizes';
      const method = editingSizeId ? 'PUT' : 'POST';
      const payload = {
        id: editingSizeId || undefined,
        name: newSizeName,
        code: newSizeCode,
        measurements: sizeMeasurementsMap,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingSizeId ? 'Size specs updated!' : 'Size specs added!');
        handleCancelEditSize();
        loadSettingsData();
      } else {
        toast.error(data.error || 'Failed to save size specs');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'An error occurred while saving size specs');
    } finally {
      setIsSavingSize(false);
    }
  };

  const handleStartEditSize = (sz: any) => {
    setEditingSizeId(sz.id);
    setNewSizeName(sz.name);
    setNewSizeCode(sz.code);

    let measObj: Record<string, string> = {};
    try {
      if (sz.measurementsJson) measObj = JSON.parse(sz.measurementsJson);
    } catch (e) { }
    setSizeMeasurementsMap(measObj);
  };

  const handleCancelEditSize = () => {
    setEditingSizeId(null);
    setNewSizeName('');
    setNewSizeCode('');
    setSizeMeasurementsMap({
      Bust: '36 in',
      Waist: '30 in',
      Hip: '40 in',
      Shoulder: '14.5 in',
    });
  };

  const handleDeleteSize = async (id: string) => {
    if (!confirm('Are you sure you want to delete this size guide preset?')) return;
    setDeletingSizeId(id);
    try {
      const res = await fetch(`/api/settings/sizes?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Size specs deleted successfully.');
        loadSettingsData();
        if (editingSizeId === id) handleCancelEditSize();
      } else {
        toast.error(data.error || 'Failed to delete size specs');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'An error occurred while deleting size specs');
    } finally {
      setDeletingSizeId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-0 py-2 sm:p-6 space-y-3 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="p-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg">
          <Settings className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
            Admin Configuration & Master Settings
          </h1>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Configure material specs per piece, size measurements, base costs, and tax settings.
          </p>
        </div>
      </div>

      {msg && (
        <div className="p-2.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs rounded-md font-medium flex items-center gap-1.5 shadow-sm">
          <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" /> {msg}
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`py-2 px-2 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition ${activeTab === 'profile'
              ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-850'
            }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>Profile & Signature</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('outfits')}
          className={`py-2 px-2 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition ${activeTab === 'outfits'
              ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-850'
            }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Preset Outfits</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sizes')}
          className={`py-2 px-2 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition ${activeTab === 'sizes'
              ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-850'
            }`}
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>Sizes & Specs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tax')}
          className={`py-2 px-2 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition ${activeTab === 'tax'
              ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-850'
            }`}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>Tax Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`py-2 px-2 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition ${activeTab === 'security'
              ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-850'
            }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Security & Auth</span>
        </button>
      </div>

      {/* Tab 1: Company Profile & Official Digital Signature Manager */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-zinc-900 p-3 sm:p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <PenTool className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Company Profile & Authorized Digital Signature Manager
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Upload company official signature image to automatically embed digital signatures on agreements and invoices.
            </p>
          </div>

          <form onSubmit={handleSaveCompanyProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Company Name
                </label>
                <Input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Radhe Vastraz"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Authorized Signatory Name
                </label>
                <Input
                  type="text"
                  value={companySignatoryName}
                  onChange={(e) => setCompanySignatoryName(e.target.value)}
                  placeholder="e.g. RAADHE LABEL part of RADHE VASTRAZ"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Signatory Designation
                </label>
                <Input
                  type="text"
                  value={companyDesignation}
                  onChange={(e) => setCompanyDesignation(e.target.value)}
                  placeholder="e.g. Authorized Signatory & Managing Director"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Email Address <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>
                <Input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="e.g. radhevastraz@gmail.com"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Contact Phone
                </label>
                <Input
                  type="text"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="e.g. +91 9063643342"
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Company Official Address
              </label>
              <textarea
                rows={2}
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="Enter complete company address for invoices, billing, and contracts..."
                className="w-full px-3 py-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                This address will appear automatically on PDF invoices, bulk production job sheets, and client agreements.
              </p>
            </div>

            {/* Signature Upload Box */}
            <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-md border border-zinc-200 dark:border-zinc-800 space-y-3">
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Company Official Digital Signature Image
              </label>

              {companySignature ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-3 rounded border border-zinc-200 dark:border-zinc-800">
                  <div className="bg-white p-2 border border-dashed border-zinc-300 rounded shadow-xs">
                    <img
                      src={companySignature}
                      alt="Company Signature Preview"
                      className="h-16 max-w-[220px] object-contain"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Signature Uploaded & Active
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      This signature will automatically appear on printed legal agreements & contracts.
                    </p>
                    <button
                      type="button"
                      onClick={() => setCompanySignature('')}
                      className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold pt-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Remove Signature
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-4 text-center hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 transition">
                  <input
                    type="file"
                    id="signature-upload"
                    accept="image/*"
                    onChange={handleSignatureFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="signature-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-full">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        Click to Upload Official Signature Image
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        PNG with transparent background, JPG or WEBP (Max 5MB)
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingProfile ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {isSavingProfile ? 'Saving...' : 'Save Company Profile & Signature'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Preset Outfit Style Templates Manager */}
      {activeTab === 'outfits' && (
        <div className="bg-white dark:bg-zinc-900 p-3 sm:p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3 sm:space-y-4">
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Scissors className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              Preset Outfit Style Templates & Material Specs
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Configure material specs per piece (e.g. 4.5m Main Fabric, 3m Lining) and upload lookbook references for auto calculation.
            </p>
          </div>

          {/* Add New Outfit Style Form */}
          <form onSubmit={handleAddOutfitStyle} className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-md border border-zinc-200 dark:border-zinc-800 space-y-3">
            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Add New Style Template
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">Style Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bridal Lehenga"
                  value={newStyleName}
                  onChange={(e) => setNewStyleName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">Category</label>
                <select
                  value={newStyleCategory}
                  onChange={(e) => setNewStyleCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100"
                >
                  <option value="Ethnic Wear">Ethnic Wear</option>
                  <option value="Bridal / Heavy">Bridal / Heavy</option>
                  <option value="Casual / Festive">Casual / Festive</option>
                  <option value="Blouse / Tops">Blouse / Tops</option>
                  <option value="Western Wear">Western Wear</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">Boutique Stitching Cost (₹) *</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  required
                  value={newStyleBoutiqueCost}
                  onChange={(e) => setNewStyleBoutiqueCost(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-bold text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">Bulk Stitching Cost (₹) *</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  required
                  value={newStyleBulkCost}
                  onChange={(e) => setNewStyleBulkCost(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-bold text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Itemized Material Requirements Builder */}
            <div className="p-3 bg-white dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-1">
                <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 uppercase">
                  Material Specs per Piece
                </span>
                <button
                  type="button"
                  onClick={handleAddMaterialField}
                  className="px-2 py-1 bg-zinc-100 dark:bg-zinc-850 text-zinc-905 dark:text-zinc-100 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Material
                </button>
              </div>

              <div className="space-y-1.5">
                {materialsList.map((m, idx) => (
                  <div key={idx} className="flex gap-1.5 items-center text-xs w-full">
                    <input
                      type="text"
                      placeholder="Material Name (e.g. Main Fabric)"
                      value={m.name}
                      onChange={(e) => handleUpdateMaterialField(idx, 'name', e.target.value)}
                      className="flex-1 min-w-0 px-2 py-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100"
                    />
                    <NumberInput
                      min={0}
                      placeholder="Qty"
                      value={m.quantityPerPc}
                      onChange={(val) => handleUpdateMaterialField(idx, 'quantityPerPc', val)}
                      className="w-14 sm:w-20 px-1 py-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-bold text-center text-zinc-900 dark:text-zinc-100 shrink-0"
                    />
                    <select
                      value={m.unit}
                      onChange={(e) => handleUpdateMaterialField(idx, 'unit', e.target.value)}
                      className="w-16 sm:w-20 px-1 py-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-[11px] text-zinc-900 dark:text-zinc-100 shrink-0"
                    >
                      <option value="meters">meters</option>
                      <option value="yards">yards</option>
                      <option value="pcs">pcs</option>
                      <option value="sets">sets</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveMaterialField(idx)}
                      className="p-1 text-red-500 hover:text-red-700 shrink-0"
                      title="Remove Field"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Reference Images Upload */}
            <div className="p-3 bg-white dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800 space-y-2">
              <CloudinaryUpload
                label="Reference Design / Lookbook Images"
                description="Upload sketches, sample photos, or design inspirations for this style template."
                images={newStyleImages}
                onChange={(urls) => setNewStyleImages(urls)}
              />
            </div>

            <div className="text-right flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelEditStyle}
                className="px-4 py-1.5 bg-zinc-100 hover:bg-zinc-205 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-semibold rounded transition inline-flex items-center gap-1 cursor-pointer"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isSavingStyle}
                className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-bold rounded transition inline-flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingStyle ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                {isSavingStyle ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </form>

          {/* Existing Outfit Styles Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {outfitStyles.map((style) => {
              let materialsArray: OutfitMaterialItem[] = [];
              try {
                if (style.materialsJson) materialsArray = JSON.parse(style.materialsJson);
              } catch (e) { }

              let styleImages: string[] = [];
              try {
                if (style.referenceImages) styleImages = JSON.parse(style.referenceImages);
              } catch (e) { }

              return (
                <div key={style.id} className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-md border border-zinc-200 dark:border-zinc-800 space-y-2 flex flex-col justify-between group relative">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{style.name}</h4>
                          <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditStyle(style)}
                              className="p-0.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                              title="Edit Preset"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={deletingStyleId === style.id}
                              onClick={() => handleDeleteStyle(style.id)}
                              className="p-0.5 text-red-500 hover:text-red-700 cursor-pointer disabled:opacity-50"
                              title="Delete Preset"
                            >
                              {deletingStyleId === style.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                        <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded font-mono">
                          {style.category}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        Base: ₹{style.baseStitchingCost?.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {materialsArray.length > 0 ? (
                      <div className="pt-1 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase block">Material Specs:</span>
                        {materialsArray.map((m, idx) => (
                          <div key={idx} className="flex justify-between font-mono text-[10px] bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                            <span>{m.name}</span>
                            <strong className="text-zinc-900 dark:text-zinc-100">{m.quantityPerPc} {m.unit} / pc</strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      style.materialRequiredSpecs && (
                        <p className="text-[10px] text-zinc-500 italic">
                          Specs: {style.materialRequiredSpecs}
                        </p>
                      )
                    )}
                  </div>

                  {/* Render reference images in lookbook */}
                  {styleImages && styleImages.length > 0 && (
                    <div className="pt-1.5 border-t border-zinc-200/50 dark:border-zinc-850">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase block mb-1">Design References:</span>
                      <div className="flex flex-wrap gap-1">
                        {styleImages.map((imgUrl, idx) => (
                          <a
                            href={imgUrl}
                            target="_blank"
                            rel="noreferrer"
                            key={idx}
                            className="block w-9 h-9 border border-zinc-250 dark:border-zinc-800 rounded overflow-hidden shadow-xs hover:border-zinc-400 dark:hover:border-zinc-650 transition duration-150"
                          >
                            <img
                              src={imgUrl}
                              alt={`${style.name} design ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Custom Defined Sizes & Body Measurements Manager */}
      {activeTab === 'sizes' && (
        <div className="bg-white dark:bg-zinc-900 p-3 sm:p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3 sm:space-y-4">
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Ruler className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              Custom Garment Sizes & Body Measurement Specifications
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Configure custom size codes (S, M, L, XL, XXL, 3XL) with default body measurement specs.
            </p>
          </div>
          {/* Add Size Form */}
          <form onSubmit={handleAddSize} className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-md border border-zinc-200 dark:border-zinc-800 space-y-3">
            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Configure New Size Specs
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">Size Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Medium"
                  value={newSizeName}
                  onChange={(e) => setNewSizeName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">Size Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. M"
                  value={newSizeCode}
                  onChange={(e) => setNewSizeCode(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-mono uppercase text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Configured Body Measurements */}
            <div className="p-3 bg-white dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800 space-y-2">
              <span className="block text-[11px] font-bold text-zinc-800 dark:text-zinc-200 uppercase">
                Configured Body Measurements ({newSizeCode || 'Code'})
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {Object.entries(sizeMeasurementsMap).map(([k, v], idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-zinc-50 dark:bg-zinc-950 p-1.5 rounded border border-zinc-205 dark:border-zinc-800">
                    <input
                      type="text"
                      value={k}
                      onChange={(e) => handleUpdateMeasurementInMap(k, e.target.value, v)}
                      className="w-24 px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-semibold text-zinc-900 dark:text-zinc-100 shrink-0 font-sans"
                      placeholder="e.g. Bust"
                    />
                    <input
                      type="text"
                      value={v}
                      onChange={(e) => handleUpdateMeasurementInMap(k, k, e.target.value)}
                      className="flex-1 min-w-0 px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-mono text-zinc-900 dark:text-zinc-100 font-bold"
                      placeholder="e.g. 36 in"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveMeasurementFromMap(k)}
                      className="p-1 text-red-500 hover:text-red-700 shrink-0 cursor-pointer"
                      title="Remove Measurement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Custom Measurement Field on the Fly */}
              <div className="flex gap-1.5 items-center pt-1.5 border-t border-zinc-100 dark:border-zinc-800 w-full">
                <input
                  type="text"
                  placeholder="Measurement (e.g. Bust)"
                  value={newMeasKey}
                  onChange={(e) => setNewMeasKey(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded text-xs text-zinc-900 dark:text-zinc-100"
                />
                <input
                  type="text"
                  placeholder="Value (36 in)"
                  value={newMeasVal}
                  onChange={(e) => setNewMeasVal(e.target.value)}
                  className="w-20 sm:w-24 px-2 py-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded text-xs text-zinc-900 dark:text-zinc-100 shrink-0"
                />
                <button
                  type="button"
                  onClick={handleAddMeasurementToMap}
                  className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded text-xs font-semibold flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
            </div>

            <div className="text-right flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelEditSize}
                className="px-4 py-1.5 bg-zinc-100 hover:bg-zinc-205 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-semibold rounded transition inline-flex items-center gap-1 cursor-pointer"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isSavingSize}
                className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-bold rounded transition inline-flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingSize ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                {isSavingSize ? 'Saving...' : 'Save Size Specs'}
              </button>
            </div>
          </form>

          {/* Sizes & Measurements Cards - Compact Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {customSizes.map((sz) => {
              let measObj: Record<string, string> = {};
              try {
                if (sz.measurementsJson) measObj = JSON.parse(sz.measurementsJson);
              } catch (e) { }

              const isEditing = editingSizeId === sz.id;
              return (
                <div
                  key={sz.id}
                  className={`p-2.5 rounded-md border space-y-1 relative transition-all ${isEditing
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-400 dark:border-amber-600 ring-1 ring-amber-300 dark:ring-amber-700'
                      : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'
                    }`}
                >
                  {/* Card Header: Code + Name + Action buttons */}
                  <div className="flex justify-between items-start border-b border-zinc-200 dark:border-zinc-800 pb-1.5 gap-1">
                    <div>
                      <span className="font-bold text-xs font-mono text-zinc-900 dark:text-zinc-100 block">{sz.code}</span>
                      <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 truncate block" title={sz.name}>{sz.name}</span>
                    </div>
                    {/* Edit + Delete always visible */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditSize(sz)}
                        className={`p-1 rounded transition ${isEditing
                            ? 'bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-400'
                          }`}
                        title="Edit Size Specs"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={deletingSizeId === sz.id}
                        onClick={() => handleDeleteSize(sz.id)}
                        className="p-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 transition disabled:opacity-50"
                        title="Delete Size Preset"
                      >
                        {deletingSizeId === sz.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {Object.keys(measObj).length > 0 ? (
                    <div className="space-y-0.5 pt-0.5 text-[10px]">
                      {Object.entries(measObj).map(([k, v]) => (
                        <div key={k} className="flex justify-between font-mono bg-white dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-100 dark:border-zinc-800">
                          <span className="text-zinc-500">{k}:</span>
                          <strong className="text-zinc-900 dark:text-zinc-100">{v}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-400 italic">No measurements</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: GST Configuration Manager */}
      {activeTab === 'tax' && (
        <div className="bg-white dark:bg-zinc-900 p-3 sm:p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              GST Tax Percentage Configuration
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Enable tax calculation on invoices and set tax rate (%).
            </p>
          </div>

          <form onSubmit={handleSaveGst} className="flex flex-wrap items-center gap-3 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-md border border-zinc-200 dark:border-zinc-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <input
                type="checkbox"
                checked={gstEnabled}
                onChange={(e) => setGstEnabled(e.target.checked)}
                className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-500"
              />
              <span>Enable GST Tax on Invoices</span>
            </label>

            <div className="flex items-center gap-1.5">
              <label className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">GST Rate (%):</label>
              <Input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                disabled={!gstEnabled}
                value={gstPercentage}
                onChange={(e) => setGstPercentage(e.target.value)}
                className="w-20 px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-bold text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingGst}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold rounded transition inline-flex items-center gap-1 ml-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingGst ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {isSavingGst ? 'Saving...' : 'Save Tax'}
            </button>
          </form>

          {/* Size Chart Print Setting */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-1">
            <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 mb-1">
              <Layers className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              Size Chart Document Settings
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mb-3">
              Configure whether to enable the &quot;Print Size Chart&quot; feature in Order details and Invoices.
            </p>
            <div className="flex flex-wrap items-center gap-3 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-md border border-zinc-200 dark:border-zinc-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={sizeChartEnabled}
                  onChange={(e) => setSizeChartEnabled(e.target.checked)}
                  className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-500"
                />
                <span>Enable &quot;Print Size Chart&quot; Feature</span>
              </label>
              <button
                type="button"
                onClick={async () => {
                  setIsSavingGst(true);
                  try {
                    const res = await fetch('/api/settings/gst', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        gstEnabled,
                        gstPercentage: parseFloat(gstPercentage) || 0,
                        sizeChartEnabled,
                      }),
                    });
                    const data = await res.json();
                    if (data.success) toast.success('Size chart setting saved!');
                    else toast.error(data.error || 'Failed to save');
                  } catch (err: any) {
                    toast.error(err.message || 'An error occurred');
                  } finally {
                    setIsSavingGst(false);
                  }
                }}
                disabled={isSavingGst}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold rounded transition inline-flex items-center gap-1 ml-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingGst ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {isSavingGst ? 'Saving...' : 'Save Setting'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Security & Admin Password Manager */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-zinc-900 p-3 sm:p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Portal Access Security & Password Management
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Manage master credentials and update your password to safeguard garment production data.
            </p>
          </div>

          {/* Account Overview Card */}
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/70 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Single-User Master Protection Active
                </span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  30-Day Persisted Session
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Primary Login Email: <strong className="text-zinc-800 dark:text-zinc-200 font-mono">admin@radhevastraz.com</strong>. All system routes and production data are securely locked.
              </p>
            </div>
          </div>

          {/* Password Update Form */}
          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Current Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                  className="pr-10 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    className="pr-10 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    minLength={8}
                    className="pr-10 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Tip: Use a strong password with a mix of letters, numbers, and symbols to ensure total security.
            </p>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-bold rounded-md transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingPassword ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
                {isUpdatingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      )}

            {/* Edit Outfit Style Modal Overlay */}
      {editingStyleId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-2xl w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                Edit Outfit Style Template
              </h3>
              <button
                type="button"
                onClick={handleCancelEditStyle}
                className="text-zinc-400 hover:text-zinc-650 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddOutfitStyle} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">Style Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bridal Lehenga"
                    value={newStyleName}
                    onChange={(e) => setNewStyleName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">Category</label>
                  <select
                    value={newStyleCategory}
                    onChange={(e) => setNewStyleCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="Ethnic Wear">Ethnic Wear</option>
                    <option value="Bridal / Heavy">Bridal / Heavy</option>
                    <option value="Casual / Festive">Casual / Festive</option>
                    <option value="Blouse / Tops">Blouse / Tops</option>
                    <option value="Western Wear">Western Wear</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">Boutique Stitching Cost (₹) *</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    required
                    value={newStyleBoutiqueCost}
                    onChange={(e) => setNewStyleBoutiqueCost(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded text-xs font-bold text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">Bulk Stitching Cost (₹) *</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    required
                    value={newStyleBulkCost}
                    onChange={(e) => setNewStyleBulkCost(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded text-xs font-bold text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Itemized Material Specs */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-md border border-zinc-200 dark:border-zinc-855 space-y-2">
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-850 pb-1">
                  <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 uppercase">
                    Material Specs per Piece
                  </span>
                  <button
                    type="button"
                    onClick={handleAddMaterialField}
                    className="px-2 py-1 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Material
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[25vh] overflow-y-auto">
                  {materialsList.map((m, idx) => (
                    <div key={idx} className="flex gap-1.5 items-center text-xs w-full">
                      <input
                        type="text"
                        placeholder="Material Name"
                        value={m.name}
                        onChange={(e) => handleUpdateMaterialField(idx, 'name', e.target.value)}
                        className="flex-1 min-w-0 px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100"
                      />
                      <NumberInput
                        min={0}
                        placeholder="Qty"
                        value={m.quantityPerPc}
                        onChange={(val) => handleUpdateMaterialField(idx, 'quantityPerPc', val)}
                        className="w-14 sm:w-20 px-1 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-bold text-center text-zinc-900 dark:text-zinc-100 shrink-0"
                      />
                      <select
                        value={m.unit}
                        onChange={(e) => handleUpdateMaterialField(idx, 'unit', e.target.value)}
                        className="w-16 sm:w-20 px-1 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-[11px] text-zinc-900 dark:text-zinc-100 shrink-0"
                      >
                        <option value="meters">meters</option>
                        <option value="yards">yards</option>
                        <option value="pcs">pcs</option>
                        <option value="sets">sets</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterialField(idx)}
                        className="p-1 text-red-500 hover:text-red-750 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reference Images */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-md border border-zinc-205 dark:border-zinc-850 space-y-2">
                <CloudinaryUpload
                  label="Reference Design / Lookbook Images"
                  description="Upload sketches, sample photos, or design inspirations for this style template."
                  images={newStyleImages}
                  onChange={(urls) => setNewStyleImages(urls)}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <button
                  type="button"
                  onClick={handleCancelEditStyle}
                  className="px-4 py-1.5 bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-850 dark:text-zinc-200 text-xs font-bold rounded transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingStyle}
                  className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-bold rounded transition inline-flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingStyle ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {isSavingStyle ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Size Specs Modal Overlay */}
      {editingSizeId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-zinc-750 dark:text-zinc-300" />
                Edit Size Specification Preset
              </h3>
              <button
                type="button"
                onClick={handleCancelEditSize}
                className="text-zinc-400 hover:text-zinc-650 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSize} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">Size Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Medium"
                    value={newSizeName}
                    onChange={(e) => setNewSizeName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-0.5">Size Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. M"
                    value={newSizeCode}
                    onChange={(e) => setNewSizeCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-mono uppercase text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Configured Measurements */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-md border border-zinc-200 dark:border-zinc-850 space-y-2">
                <span className="block text-[11px] font-bold text-zinc-800 dark:text-zinc-200 uppercase">
                  Configured Body Measurements ({newSizeCode || 'Code'})
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 max-h-[30vh] overflow-y-auto pr-1">
                  {Object.entries(sizeMeasurementsMap).map(([k, v], idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-white dark:bg-zinc-900 p-1.5 rounded border border-zinc-200 dark:border-zinc-800">
                      <input
                        type="text"
                        value={k}
                        onChange={(e) => handleUpdateMeasurementInMap(k, e.target.value, v)}
                        className="w-24 px-2 py-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-semibold text-zinc-900 dark:text-zinc-100 shrink-0 font-sans"
                        placeholder="e.g. Bust"
                      />
                      <input
                        type="text"
                        value={v}
                        onChange={(e) => handleUpdateMeasurementInMap(k, k, e.target.value)}
                        className="flex-1 min-w-0 px-2 py-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-mono text-zinc-900 dark:text-zinc-100 font-bold"
                        placeholder="e.g. 36 in"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMeasurementFromMap(k)}
                        className="p-1 text-red-500 hover:text-red-700 shrink-0 cursor-pointer"
                        title="Remove Measurement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Custom Measurement Fields */}
                <div className="flex gap-1.5 items-center pt-1.5 border-t border-zinc-100 dark:border-zinc-850 w-full">
                  <input
                    type="text"
                    placeholder="Measurement (e.g. Bust)"
                    value={newMeasKey}
                    onChange={(e) => setNewMeasKey(e.target.value)}
                    className="flex-1 min-w-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-905 dark:text-zinc-100"
                  />
                  <input
                    type="text"
                    placeholder="Value (36 in)"
                    value={newMeasVal}
                    onChange={(e) => setNewMeasVal(e.target.value)}
                    className="w-20 sm:w-24 px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-905 dark:text-zinc-100 shrink-0"
                  />
                  <button
                    type="button"
                    onClick={handleAddMeasurementToMap}
                    className="px-2 py-1 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded text-xs font-semibold flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <button
                  type="button"
                  onClick={handleCancelEditSize}
                  className="px-4 py-1.5 bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-855 dark:text-zinc-200 text-xs font-bold rounded transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSize}
                  className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-855 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-bold rounded transition inline-flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingSize ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {isSavingSize ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
