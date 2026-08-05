"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BoutiqueSection } from '@/components/boutique/BoutiqueSection';
import { ClientForm, ClientData } from '@/components/bulk/ClientForm';
import { BulkOrderForm, BulkOrderFormData } from '@/components/bulk/BulkOrderForm';
import { AgreementSignatureSection, AgreementData } from '@/components/bulk/AgreementSignatureSection';
import { OrderLifecycleModal } from '@/components/bulk/OrderLifecycleModal';
import { BulkOrderDetailModal } from '@/components/bulk/BulkOrderDetailModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { clientSchema } from '@/lib/validations/schemas';
import {
  Scissors,
  Layers,
  FileText,
  CheckCircle2,
  HardDrive,
  ExternalLink,
  PlusCircle,
  Loader2,
  Building,
  User,
  ShoppingBag,
  ShieldCheck,
  ChevronRight,
  Edit,
  Clock,
  RotateCcw,
  Image as ImageIcon,
} from 'lucide-react';
import { useProductionStore } from '@/store/productionStore';
import { toast } from 'sonner';

function DashboardContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as 'bulk' | 'boutique' | 'orders' | null;

  const [activeTab, setActiveTab] = useState<'bulk' | 'boutique' | 'orders'>('bulk');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsgState] = useState<string | null>(null);
  const setErrorMsg = (msg: string | null) => {
    setErrorMsgState(msg);
    if (msg) {
      toast.error(msg);
    }
  };

  // Selected Order for Lifecycle Management Modal
  const [selectedOrderForLifecycle, setSelectedOrderForLifecycle] = useState<any>(null);
  const [registeredClients, setRegisteredClients] = useState<any[]>([]);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<any>(null);

  // Date and Search filters for Bulk order history
  const [bulkSearchQuery, setBulkSearchQuery] = useState("");
  const [bulkStartDate, setBulkStartDate] = useState("");
  const [bulkEndDate, setBulkEndDate] = useState("");
  const [bulkStatusFilter, setBulkStatusFilter] = useState("ALL");

  // Sync state with URL query param if present
  useEffect(() => {
    if (tabParam && ['bulk', 'boutique', 'orders'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Stored orders state from SQLite / API
  const [savedOrders, setSavedOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);

  // Form State
  const [clientData, setClientData] = useState<ClientData>({
    clientName: '',
    businessName: '',
    mobileNumber: '',
    email: '',
    address: '',
  });

  const [orderData, setOrderData] = useState<BulkOrderFormData>({
    items: [
      {
        itemDescription: '',
        category: '',
        quantity: 0,
        unitRate: 0,
        fabricDetails: '',
        sizeBreakdown: '',
        priceBreakup: {
          baseStitching: 0,
          liningCanvas: 0,
          handworkEmbroidery: 300,
          finishingLatkan: 100,
        },
      },
    ],
    shippingCharges: 1200,
    packingCharges: 800,
    estimatedDelivery: '',
    deliverySchedule: '',
    fabricProcurement: '',
    packingBrandingNotes: '',
    materialReceivedDetails: '',
    referenceImages: [],
    materialImages: [],
  });

  const [agreementData, setAgreementData] = useState<AgreementData>({
    clientSignatoryName: '',
    clientDesignation: '',
    clientSignature: '',
    witnessName: '',
    witnessMobile: '',
    witnessSignature: '',
    clientInitials: '',
    labelInitials: '',
    ipAccepted: true,
    termsAccepted: true,
  });

  const [completedOrderResult, setCompletedOrderResult] = useState<any>(null);

  // Load past orders from SQLite / PostgreSQL
  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const res = await fetch('/api/bulk-orders');
      const data = await res.json();
      if (data.success) {
        setSavedOrders(data.orders || []);
      }
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (data.success) {
        setRegisteredClients(data.clients || []);
      }
    } catch (e) {
      console.error('Failed to fetch clients:', e);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchClients();
  }, []);

  // Load draft state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedDraft = localStorage.getItem('garment_bulk_order_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.clientData && parsed.clientData.clientName) setClientData(parsed.clientData);
        if (parsed.orderData && parsed.orderData.items) setOrderData(parsed.orderData);
        if (parsed.agreementData) setAgreementData(parsed.agreementData);
        if (parsed.currentStep && typeof parsed.currentStep === 'number') setCurrentStep(parsed.currentStep);
      } catch (e) {
        console.error('Failed to parse draft from localStorage:', e);
      }
    }
  }, []);

  // Auto-save form draft state to localStorage whenever changed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const draft = { clientData, orderData, agreementData, currentStep };
    localStorage.setItem('garment_bulk_order_draft', JSON.stringify(draft));
  }, [clientData, orderData, agreementData, currentStep]);

  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  const handleNextStep = () => {
    setErrorMsg(null);
    setClientErrors({});
    if (currentStep === 1) {
      const validation = clientSchema.safeParse({
        name: clientData.clientName,
        businessName: clientData.businessName,
        mobileNumber: clientData.mobileNumber,
        email: clientData.email,
        address: clientData.address,
      });

      if (!validation.success) {
        const fieldErrors = validation.error.flatten().fieldErrors;
        const errMap: Record<string, string> = {};
        if (fieldErrors.name?.[0]) errMap.clientName = fieldErrors.name[0];
        if (fieldErrors.mobileNumber?.[0]) errMap.mobileNumber = fieldErrors.mobileNumber[0];
        if (fieldErrors.email?.[0]) errMap.email = fieldErrors.email[0];
        setClientErrors(errMap);
        setErrorMsg('Please fix the validation errors in client information.');
        return;
      }

      // Save / Update client in Customers Store & DB for immediate accessibility in Customers tab
      try {
        const { customers, addCustomer, updateCustomer } = useProductionStore.getState();
        const existing = customers.find(
          (c) => c.phone === clientData.mobileNumber || (c.email && clientData.email && c.email === clientData.email)
        );
        if (existing) {
          updateCustomer(existing.id, {
            name: clientData.clientName,
            company: clientData.businessName,
            phone: clientData.mobileNumber,
            email: clientData.email,
            address: clientData.address,
          });
        } else {
          addCustomer({
            name: clientData.clientName,
            company: clientData.businessName,
            phone: clientData.mobileNumber,
            email: clientData.email || `${clientData.clientName.toLowerCase().replace(/\s+/g, '')}@client.com`,
            address: clientData.address,
            notes: `Added from Bulk Order Step 1 (${new Date().toLocaleDateString()})`,
            measurements: {},
            totalOrders: 1,
            totalSpent: 0,
          });
        }

        // Only sync to DB if this is a manually-typed client (not already a registered one)
        if (!clientData.clientId) {
          fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: clientData.clientName,
              businessName: clientData.businessName,
              mobileNumber: clientData.mobileNumber,
              email: clientData.email,
              address: clientData.address,
            }),
          }).catch((err) => console.error('Error syncing client to DB:', err));
        }
      } catch (err) {
        console.error('Error saving customer profile:', err);
      }
    } else if (currentStep === 2) {
      if (orderData.items.length === 0 || !orderData.items[0].itemDescription) {
        setErrorMsg('Please add at least one garment item to the order.');
        return;
      }
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmitBulkOrder = async () => {
    try {
      setErrorMsg(null);
      if (!agreementData.termsAccepted) {
        setErrorMsg('You must accept the terms & conditions to proceed.');
        return;
      }

      setIsSubmitting(true);

      const payload = {
        clientName: clientData.clientName,
        businessName: clientData.businessName,
        mobileNumber: clientData.mobileNumber,
        email: clientData.email,
        address: clientData.address,

        items: orderData.items,
        shippingCharges: orderData.shippingCharges,
        packingCharges: orderData.packingCharges,
        materialCharges: orderData.materialCharges,
        materialProvidedBy: orderData.materialProvidedBy,
        gstEnabled: orderData.gstEnabled,
        gstPercentage: orderData.gstPercentage,
        advanceType: orderData.advanceType,
        advancePercentage: orderData.advancePercentage,
        advanceCustomAmount: orderData.advanceCustomAmount,
        discountType: orderData.discountType,
        discountPercentage: orderData.discountPercentage,
        discountAmount: orderData.discountAmount,
        estimatedDelivery: orderData.estimatedDelivery,
        deliverySchedule: orderData.deliverySchedule,
        fabricProcurement: orderData.fabricProcurement,
        packingBrandingNotes: orderData.packingBrandingNotes,
        materialReceivedDetails: orderData.materialReceivedDetails,

        referenceImages: orderData.referenceImages,
        materialImages: orderData.materialImages,

        clientSignatoryName: agreementData.clientSignatoryName || clientData.clientName,
        clientDesignation: agreementData.clientDesignation,
        clientSignature: agreementData.clientSignature,
        witnessName: agreementData.witnessName,
        witnessMobile: agreementData.witnessMobile,
        witnessSignature: agreementData.witnessSignature,
        clientInitials: agreementData.clientInitials,
        labelInitials: agreementData.labelInitials,
      };

      const res = await fetch('/api/bulk-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to process order.');
      }

      setCompletedOrderResult(result);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('garment_bulk_order_draft');
      }
      fetchOrders();
    } catch (e: any) {
      setErrorMsg(e.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCompletedOrderResult(null);
    setCurrentStep(1);
    setClientData({
      clientName: '',
      businessName: '',
      mobileNumber: '',
      email: '',
      address: '',
    });
    setAgreementData({
      clientSignatoryName: '',
      clientDesignation: 'Proprietor',
      clientSignature: '',
      witnessName: '',
      witnessMobile: '',
      witnessSignature: '',
      clientInitials: 'RS',
      labelInitials: 'RL',
      ipAccepted: true,
      termsAccepted: true,
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('garment_bulk_order_draft');
    }
  };

  return (
    <div className="w-full space-y-3 sm:space-y-6 pb-8 px-0 sm:px-4 md:px-6">
      {/* Compact Sub-Navigation Tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-200/60 dark:bg-zinc-800/80 rounded-lg border border-zinc-300/50 dark:border-zinc-700 text-center">
        <button
          onClick={() => setActiveTab('bulk')}
          className={`py-1.5 px-1 rounded-md text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition ${activeTab === 'bulk'
            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Bulk Order</span>
        </button>
        <button
          onClick={() => setActiveTab('boutique')}
          className={`py-1.5 px-1 rounded-md text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition ${activeTab === 'boutique'
            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
        >
          <Scissors className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Boutique</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('orders');
            fetchOrders();
          }}
          className={`py-1.5 px-1 rounded-md text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition ${activeTab === 'orders'
            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
        >
          <HardDrive className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Storage ({savedOrders.length})</span>
        </button>
      </div>

      {/* BOUTIQUE SECTION */}
      {activeTab === 'boutique' && <BoutiqueSection />}

      {/* STORAGE / BULK ORDERS SECTION */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-150 dark:border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
                Bulk Stitching Storage Records
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Verify and manage bulk manufacturing contracts, invoices, status, and output image collections.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveTab('bulk');
                resetForm();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-md shadow transition shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" /> New Bulk Order
            </button>
          </div>

          {/* Filters Area */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-zinc-50 dark:bg-zinc-950/20 p-3 rounded-lg border border-zinc-150 dark:border-zinc-850">
            {/* Search */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Search</label>
              <input
                type="text"
                placeholder="Search Client or Order..."
                value={bulkSearchQuery}
                onChange={(e) => setBulkSearchQuery(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 transition"
              />
            </div>

            {/* Date Range Start */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Start Date</label>
              <input
                type="date"
                value={bulkStartDate}
                onChange={(e) => setBulkStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 transition"
              />
            </div>

            {/* Date Range End */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">End Date</label>
              <input
                type="date"
                value={bulkEndDate}
                onChange={(e) => setBulkEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 transition"
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Status</label>
              <select
                value={bulkStatusFilter}
                onChange={(e) => setBulkStatusFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 transition cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="Estimate Generated">Estimate Generated</option>
                <option value="Estimate Approved">Estimate Approved</option>
                <option value="Work Started">Work Started</option>
                <option value="In Production">In Production</option>
                <option value="Completed">Completed</option>
                <option value="Delivered">Delivered</option>
                <option value="Extended">Extended</option>
              </select>
            </div>
          </div>

          {/* Stored Orders Table */}
          {isLoadingOrders ? (
            <div className="text-center py-12 text-zinc-500 flex items-center justify-center gap-1.5 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" /> Loading bulk records...
            </div>
          ) : savedOrders.length === 0 ? (
            <div className="text-center py-12 text-zinc-455 text-xs italic">
              No bulk order storage sheets found. Create one under the &quot;Bulk Order&quot; tab.
            </div>
          ) : (
            <div className="border border-zinc-150 dark:border-zinc-800 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-50 dark:bg-zinc-900/60">
                  <TableRow>
                    <TableHead className="text-xs text-zinc-450">Order #</TableHead>
                    <TableHead className="text-xs text-zinc-450">Client / Company</TableHead>
                    <TableHead className="text-xs text-zinc-450 text-center">Status</TableHead>
                    <TableHead className="text-xs text-zinc-450 text-right">Grand Total</TableHead>
                    <TableHead className="text-xs text-zinc-450 text-center">Order Date</TableHead>
                    <TableHead className="text-xs text-zinc-450 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedOrders
                    .filter((order) => {
                      const q = bulkSearchQuery.toLowerCase();
                      const matchText =
                        order.orderNumber.toLowerCase().includes(q) ||
                        (order.client?.name || "").toLowerCase().includes(q) ||
                        (order.client?.businessName || "").toLowerCase().includes(q);

                      const matchStatus = bulkStatusFilter === "ALL" || order.status === bulkStatusFilter;

                      let matchDate = true;
                      const orderDate = new Date(order.createdAt);
                      if (bulkStartDate) {
                        const start = new Date(bulkStartDate);
                        start.setHours(0, 0, 0, 0);
                        if (orderDate < start) matchDate = false;
                      }
                      if (bulkEndDate) {
                        const end = new Date(bulkEndDate);
                        end.setHours(23, 59, 59, 999);
                        if (orderDate > end) matchDate = false;
                      }

                      return matchText && matchStatus && matchDate;
                    })
                    .map((order) => (
                      <TableRow key={order.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20">
                        <TableCell className="font-bold text-xs text-zinc-900 dark:text-zinc-100 py-3">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell className="text-xs py-3">
                          <p className="font-semibold text-zinc-800 dark:text-zinc-200">{order.client?.name}</p>
                          <p className="text-[10px] text-zinc-400">{order.client?.businessName || 'Direct Client'}</p>
                        </TableCell>
                        <TableCell className="text-xs text-center py-3">
                          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${order.status === 'Completed' || order.status === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/50'
                            : order.status === 'Extended'
                              ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/50'
                              : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/50'
                            }`}>
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-right font-extrabold py-3">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(order.totalAmount)}
                        </TableCell>
                        <TableCell className="text-xs text-center text-zinc-400 py-3">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-xs text-right py-3 space-x-1.5">
                          <button
                            onClick={() => setSelectedOrderForDetail(order)}
                            className="px-2.5 py-1 text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-white dark:border-zinc-800 rounded font-semibold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Detail View
                          </button>
                          {order.status !== 'Delivered' && (
                            <button
                              onClick={() => setSelectedOrderForLifecycle(order)}
                              className="px-2.5 py-1 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded font-semibold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" /> Lifecycle
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* BULK MANUFACTURING SECTION */}
      {activeTab === 'bulk' && (
        <div>
          {completedOrderResult ? (
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Order & Manufacturing Agreement Created!
              </h2>
              <p className="text-xs text-zinc-500">
                Order #{completedOrderResult.order?.orderNumber} has been processed successfully. Order and invoice history are available in the Customers and Invoices sections.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => (window.location.href = '/orders')}
                  className="px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-md hover:bg-zinc-800 transition cursor-pointer"
                >
                  View Orders
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-md hover:bg-indigo-700 transition cursor-pointer"
                >
                  Create Another Order
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-6">
              {/* Compact Stepper Progress Bar */}
              <div className="bg-white dark:bg-zinc-900 p-2.5 sm:p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between gap-3">
                <div className="flex justify-between items-center max-w-3xl flex-1 mx-auto">
                  {/* Step 1: Client */}
                  <div className={`flex items-center gap-1.5 ${currentStep >= 1 ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-400'}`}>
                    <div className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs ${currentStep >= 1 ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                      1
                    </div>
                    <span className={`text-[11px] sm:text-xs ${currentStep === 1 ? 'inline font-bold' : 'hidden sm:inline'}`}>Client</span>
                  </div>
                  <div className={`h-0.5 flex-1 mx-1 sm:mx-2 ${currentStep >= 2 ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-800'}`} />

                  {/* Step 2: Garments */}
                  <div className={`flex items-center gap-1.5 ${currentStep >= 2 ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-400'}`}>
                    <div className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs ${currentStep >= 2 ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                      2
                    </div>
                    <span className={`text-[11px] sm:text-xs ${currentStep === 2 ? 'inline font-bold' : 'hidden sm:inline'}`}>Garments</span>
                  </div>
                  <div className={`h-0.5 flex-1 mx-1 sm:mx-2 ${currentStep >= 3 ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-800'}`} />

                  {/* Step 3: Materials */}
                  <div className={`flex items-center gap-1.5 ${currentStep >= 3 ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-400'}`}>
                    <div className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs ${currentStep >= 3 ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                      3
                    </div>
                    <span className={`text-[11px] sm:text-xs ${currentStep === 3 ? 'inline font-bold' : 'hidden sm:inline'}`}>Materials</span>
                  </div>
                  <div className={`h-0.5 flex-1 mx-1 sm:mx-2 ${currentStep >= 4 ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-800'}`} />

                  {/* Step 4: Billing */}
                  <div className={`flex items-center gap-1.5 ${currentStep >= 4 ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-400'}`}>
                    <div className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs ${currentStep >= 4 ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                      4
                    </div>
                    <span className={`text-[11px] sm:text-xs ${currentStep === 4 ? 'inline font-bold' : 'hidden sm:inline'}`}>Billing</span>
                  </div>
                  <div className={`h-0.5 flex-1 mx-1 sm:mx-2 ${currentStep >= 5 ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-800'}`} />

                  {/* Step 5: Agreement */}
                  <div className={`flex items-center gap-1.5 ${currentStep >= 5 ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-400'}`}>
                    <div className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs ${currentStep >= 5 ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                      5
                    </div>
                    <span className={`text-[11px] sm:text-xs ${currentStep === 5 ? 'inline font-bold' : 'hidden sm:inline'}`}>Agreement</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800 transition shrink-0 cursor-pointer"
                  title="Reset form fields & clear draft"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset Form</span>
                </button>
              </div>

              {/* Error Banner */}
              {errorMsg && (
                <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs rounded-xl font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Form Step 1: Client Details */}
              {currentStep === 1 && (
                <ClientForm
                  data={clientData}
                  onChange={(u) => setClientData((prev) => ({ ...prev, ...u }))}
                  errors={clientErrors}
                  clientsList={registeredClients}
                  onSelectClient={(client) => {
                    setClientData({
                      clientId: client.id,
                      clientName: client.name,
                      businessName: client.businessName || '',
                      mobileNumber: client.mobileNumber,
                      email: client.email || '',
                      address: client.address || '',
                    });
                  }}
                />
              )}

              {/* Form Step 2: Garment Specifications */}
              {currentStep === 2 && (
                <BulkOrderForm data={orderData} step={2} onChange={(u) => setOrderData((prev) => ({ ...prev, ...u }))} />
              )}

              {/* Form Step 3: Materials & Sourcing */}
              {currentStep === 3 && (
                <BulkOrderForm data={orderData} step={3} onChange={(u) => setOrderData((prev) => ({ ...prev, ...u }))} />
              )}

              {/* Form Step 4: Logistics & Billing Summary */}
              {currentStep === 4 && (
                <BulkOrderForm data={orderData} step={4} onChange={(u) => setOrderData((prev) => ({ ...prev, ...u }))} />
              )}

              {/* Form Step 5: Agreement & Signatures */}
              {currentStep === 5 && (
                <AgreementSignatureSection
                  data={agreementData}
                  clientNameDefault={clientData.clientName}
                  clientData={clientData}
                  orderData={orderData}
                  onChange={(u) => setAgreementData((prev) => ({ ...prev, ...u }))}
                />
              )}

              {/* Compact Navigation Action Buttons */}
              <div className="flex justify-between items-center gap-2 pt-2">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-900 dark:text-zinc-100 font-semibold text-xs rounded-md transition text-center"
                  >
                    ← Back
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 sm:flex-initial px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold text-xs rounded-md transition shadow-sm text-center"
                  >
                    Continue to Next Step →
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmitBulkOrder}
                    className="flex-1 sm:flex-initial px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Submit Bulk Order
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Lifecycle Modal */}
      {selectedOrderForLifecycle && (
        <OrderLifecycleModal
          order={selectedOrderForLifecycle}
          isOpen={!!selectedOrderForLifecycle}
          onClose={() => setSelectedOrderForLifecycle(null)}
          onUpdated={() => {
            fetchOrders();
          }}
        />
      )}

      {/* Bulk Order Detail Modal */}
      {selectedOrderForDetail && (
        <BulkOrderDetailModal
          order={selectedOrderForDetail}
          isOpen={!!selectedOrderForDetail}
          onClose={() => setSelectedOrderForDetail(null)}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading Garment Production System...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
