"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BoutiqueSection } from '@/components/boutique/BoutiqueSection';
import { ClientForm, ClientData } from '@/components/bulk/ClientForm';
import { BulkOrderForm, BulkOrderFormData } from '@/components/bulk/BulkOrderForm';
import { AgreementSignatureSection, AgreementData } from '@/components/bulk/AgreementSignatureSection';
import { OrderLifecycleModal } from '@/components/bulk/OrderLifecycleModal';
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

function DashboardContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as 'bulk' | 'boutique' | 'orders' | null;

  const [activeTab, setActiveTab] = useState<'bulk' | 'boutique' | 'orders'>('bulk');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected Order for Lifecycle Management Modal
  const [selectedOrderForLifecycle, setSelectedOrderForLifecycle] = useState<any>(null);

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
        itemDescription: 'Bridal Lehenga Choli Set',
        category: 'Bridal / Heavy',
        quantity: 25,
        unitRate: 1500,
        fabricDetails: '4.5m Velvet + 3m Satin Lining provided by client',
        sizeBreakdown: 'S: 5, M: 10, L: 8, XL: 2',
        priceBreakup: {
          baseStitching: 800,
          liningCanvas: 300,
          handworkEmbroidery: 300,
          finishingLatkan: 100,
        },
      },
    ],
    shippingCharges: 1200,
    packingCharges: 800,
    estimatedDelivery: '25 Working Days',
    deliverySchedule: 'Single Complete Dispatch',
    fabricProcurement: 'Directly paid by client to fabric vendor',
    packingBrandingNotes: 'Includes brand label, size tag, wash care tag & transparent cover',
    materialReceivedDetails: 'Received 50 meters Velvet fabric + 30 meters satin lining on 30-July-2026.',
    referenceImages: [],
    materialImages: [],
  });

  const [agreementData, setAgreementData] = useState<AgreementData>({
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

  const [completedOrderResult, setCompletedOrderResult] = useState<any>(null);

  // Load past orders from SQLite
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

  useEffect(() => {
    fetchOrders();
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
      if (!agreementData.clientSignature) {
        setErrorMsg('Please provide the Client Digital Signature.');
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
          className={`py-1.5 px-1 rounded-md text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition ${
            activeTab === 'bulk'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Bulk Order</span>
        </button>
        <button
          onClick={() => setActiveTab('boutique')}
          className={`py-1.5 px-1 rounded-md text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition ${
            activeTab === 'boutique'
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
          className={`py-1.5 px-1 rounded-md text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition ${
            activeTab === 'orders'
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
                <div className="flex justify-between items-center max-w-2xl flex-1 mx-auto">
                  <div className={`flex items-center gap-1.5 ${currentStep >= 1 ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-400'}`}>
                    <div className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs ${currentStep >= 1 ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                      1
                    </div>
                    <span className="text-[11px] sm:text-xs">Client</span>
                  </div>
                  <div className={`h-0.5 flex-1 mx-1.5 sm:mx-3 ${currentStep >= 2 ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                  <div className={`flex items-center gap-1.5 ${currentStep >= 2 ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-400'}`}>
                    <div className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs ${currentStep >= 2 ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                      2
                    </div>
                    <span className="text-[11px] sm:text-xs">Specs</span>
                  </div>
                  <div className={`h-0.5 flex-1 mx-1.5 sm:mx-3 ${currentStep >= 3 ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                  <div className={`flex items-center gap-1.5 ${currentStep >= 3 ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-400'}`}>
                    <div className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs ${currentStep >= 3 ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                      3
                    </div>
                    <span className="text-[11px] sm:text-xs">Agreement</span>
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
                <ClientForm data={clientData} onChange={(u) => setClientData((prev) => ({ ...prev, ...u }))} errors={clientErrors} />
              )}

              {/* Form Step 2: Order Specifications */}
              {currentStep === 2 && (
                <BulkOrderForm data={orderData} onChange={(u) => setOrderData((prev) => ({ ...prev, ...u }))} />
              )}

              {/* Form Step 3: Agreement & Signatures */}
              {currentStep === 3 && (
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

                {currentStep < 3 ? (
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
