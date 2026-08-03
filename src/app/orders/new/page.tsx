"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useProductionStore } from "@/store/productionStore";
import { Stepper, MeasurementCard } from "@/components/shared/ReusableComponents";
import { MaterialItem, ProductItem, OrderEstimate, Measurements, Customer, OrderStatus } from "@/types";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
  ShoppingBag,
  Scissors,
  FileText,
  Printer,
  DollarSign,
  CheckCircle,
  Search,
  Check,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import { ColorPickerInput } from "@/components/ui/color-picker";
import { GarmentSizeSelector } from "@/components/customers/GarmentSizeSelector";
import { GARMENT_SIZE_CONFIGS, GarmentType } from "@/config/sizeCharts";
import { generateInvoiceHTML, generateSizeChartHTML } from "@/lib/documentGenerator";


const STEPS = [
  "Customer",
  "Order Info",
  "Garments, Sizes & Materials",
  "Estimate",
  "Payment",
  "Review",
];

const MOBILE_STEPS = [
  "Client",
  "Info",
  "Items, Sizes & Fabric",
  "Cost",
  "Pay",
  "Done",
];

// Helper to auto-calculate suggested fabric based on measurements, unit requirements, category, and garment item quantities
function calculateSuggestedFabric(
  measurements: Measurements,
  unit: string,
  category: string = "Kurta/Shirt",
  products: Omit<ProductItem, "id">[] = []
): { amount: number; description: string } | null {
  const height = measurements.height;
  const sleeve = measurements.sleeve;
  const chest = measurements.chest;

  // Determine Garment Item Quantity from Products (Garments to Tailor) step
  let itemQty = 1;
  if (products && products.length > 0) {
    const categoryLower = category.toLowerCase().split("/")[0].trim();
    const matchingProducts = products.filter((p) => p.product && p.product.toLowerCase().includes(categoryLower));
    if (matchingProducts.length > 0) {
      itemQty = matchingProducts.reduce((sum, p) => sum + (p.quantity || 1), 0);
    } else {
      itemQty = products.reduce((sum, p) => sum + (p.quantity || 1), 0) || 1;
    }
  }

  if (!height && !sleeve && category !== "Blouse") {
    return null;
  }

  const h = height || 60; // Fallback to standard height
  const s = sleeve || 22; // Fallback to standard sleeve
  const c = chest || 36;  // Fallback to standard chest

  const unitLower = (unit || "").toLowerCase().trim();
  const isMeter = unitLower === "meters" || unitLower === "meter" || unitLower === "m";
  const isYard = unitLower === "yards" || unitLower === "yard" || unitLower === "yd" || unitLower === "gaj";

  if (!isMeter && !isYard) {
    return null;
  }

  let singleFabricInches = 0;
  let categoryLabel = "";

  if (category === "Kurta/Shirt") {
    categoryLabel = "Kurta/Shirt";
    if (c <= 40) {
      singleFabricInches = h + s + 6;
    } else {
      singleFabricInches = (h * 2) + s + 8;
    }
  } else if (category === "Pants") {
    categoryLabel = "Trouser/Pants";
    singleFabricInches = (h * 1.2) + 6;
  } else if (category === "Blouse") {
    categoryLabel = "Saree Blouse";
    singleFabricInches = 40; // ~1.0 meter
  } else if (category === "Gown/Dress") {
    categoryLabel = "Dress/Gown";
    singleFabricInches = (h * 3.5) + s + 12;
  } else {
    categoryLabel = category || "Garment";
    singleFabricInches = h + s + 6;
  }

  let singleAmount = isMeter ? singleFabricInches / 39.37 : singleFabricInches / 36;
  singleAmount = Math.ceil(singleAmount * 4) / 4; // round to nearest 0.25

  const totalAmount = parseFloat((singleAmount * itemQty).toFixed(2));
  const unitLabel = isMeter ? "m" : "yd";

  const desc = itemQty > 1
    ? `${categoryLabel}: ${singleAmount}${unitLabel} per item x ${itemQty} qty = ${totalAmount}${unitLabel}`
    : `${categoryLabel}: ${totalAmount}${unitLabel}`;

  return { amount: totalAmount, description: desc };
}

export default function NewOrder() {
  const router = useRouter();
  const { customers, settings, addOrder, addCustomer, addSizeSet } = useProductionStore();

  const [step, setStep] = useState(0);
  const [outfitStyles, setOutfitStyles] = useState<any[]>([]);
  const [dbGstEnabled, setDbGstEnabled] = useState(false);
  const [dbGstRate, setDbGstRate] = useState(18);

  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const res = await fetch("/api/settings/outfit-styles");
        if (res.ok) {
          const data = await res.json();
          setOutfitStyles(data.styles || []);
        }
      } catch (err) {
        console.error("Failed fetching styles", err);
      }
    };
    const fetchGst = async () => {
      try {
        const res = await fetch("/api/settings/gst");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.setting) {
            setDbGstEnabled(data.setting.gstEnabled);
            setDbGstRate(data.setting.gstPercentage);
          }
        }
      } catch (err) {
        console.error("Failed fetching GST settings", err);
      }
    };
    fetchStyles();
    fetchGst();
  }, []);

  // Step 1: Customer State
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isCreatingNewCustomer, setIsCreatingNewCustomer] = useState(false);
  // New Customer Form State
  const [newCustName, setNewCustName] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustCompany, setNewCustCompany] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");
  const [custError, setCustError] = useState("");

  // Step 2: Order Info State
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 14); // Default to 2 weeks out
    return today.toISOString().split("T")[0];
  });
  const [orderNotes, setOrderNotes] = useState("");

  // Step 3: Materials State
  const [materials, setMaterials] = useState<Omit<MaterialItem, "id">[]>([
    { material: "", color: "", unit: "meters", quantity: 0, price: undefined, notes: "", estimateCategory: "Kurta/Shirt" },
  ]);

  // Step 4: Measurements State
  const [measurements, setMeasurements] = useState<Measurements>({
    chest: undefined,
    waist: undefined,
    shoulder: undefined,
    sleeve: undefined,
    neck: undefined,
    hip: undefined,
    height: undefined,
    customFields: {},
  });
  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string }>>([]);

  // Sizing sets state
  const [selectedSizeSetId, setSelectedSizeSetId] = useState<string>("primary");
  const [newSizeSetName, setNewSizeSetName] = useState<string>("");

  // Step 5: Products State
  const [products, setProducts] = useState<Omit<ProductItem, "id">[]>([
    { product: "", quantity: 1, stitchType: "Standard Stitch", price: 0, notes: "" },
  ]);

  // Step 6: Estimate State
  const [embroidery, setEmbroidery] = useState(0);
  const [printing, setPrinting] = useState(0);
  const [transport, setTransport] = useState(0);
  const [packing, setPacking] = useState(0);
  const [discount, setDiscount] = useState(0);

  // Step 7: Payment State
  const [initialPayment, setInitialPayment] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card" | "Bank Transfer" | "UPI">("Cash");

  // Filtered customers for dropdown
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.includes(customerSearch)
    );
  }, [customers, customerSearch]);

  const selectedCustomerObj = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const [customerDraftMsg, setCustomerDraftMsg] = useState<string>("");

  // Handle selected customer change & prefill or resume measurements
  const handleSelectCustomer = (customerId: string) => {
    // Save previous customer's draft if changing customers mid-form
    if (selectedCustomerId && selectedCustomerId !== customerId) {
      saveCurrentDraft(step, selectedCustomerId);
    }

    setSelectedCustomerId(customerId);
    setSelectedSizeSetId("primary");
    setNewSizeSetName("");

    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    // Check if a saved draft exists for this specific customer
    const savedCustomerDraft = typeof window !== "undefined"
      ? localStorage.getItem(`garment_order_draft_${customerId}`)
      : null;

    if (savedCustomerDraft) {
      try {
        const parsed = JSON.parse(savedCustomerDraft);
        if (parsed.deliveryDate) setDeliveryDate(parsed.deliveryDate);
        if (parsed.orderNotes !== undefined) setOrderNotes(parsed.orderNotes);
        if (parsed.measurements) setMeasurements(parsed.measurements);
        if (parsed.customFields) setCustomFields(parsed.customFields);
        if (parsed.materials && parsed.materials.length) setMaterials(parsed.materials);
        if (parsed.products && parsed.products.length) setProducts(parsed.products);
        if (parsed.embroidery !== undefined) setEmbroidery(parsed.embroidery);
        if (parsed.printing !== undefined) setPrinting(parsed.printing);
        if (parsed.transport !== undefined) setTransport(parsed.transport);
        if (parsed.packing !== undefined) setPacking(parsed.packing);
        if (parsed.discount !== undefined) setDiscount(parsed.discount);
        if (parsed.initialPayment !== undefined) setInitialPayment(parsed.initialPayment);
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
        if (parsed.step !== undefined) setStep(parsed.step);

        setCustomerDraftMsg(`Resumed in-progress order draft for ${cust.name}`);
        return;
      } catch (e) {
        console.error("Failed to restore customer draft", e);
      }
    }

    // Fallback: No draft saved for this customer -> reset to profile defaults
    setCustomerDraftMsg("");
    setOrderNotes("");
    setMaterials([{ material: "", color: "", unit: "meters", quantity: 0, price: undefined, notes: "", estimateCategory: "Kurta/Shirt" }]);
    setProducts([{ product: "", quantity: 1, stitchType: "Standard Stitch", price: 0, notes: "" }]);
    setEmbroidery(0);
    setPrinting(0);
    setTransport(0);
    setPacking(0);
    setDiscount(0);
    setInitialPayment(0);
    setMeasurements({
      chest: cust.measurements.chest,
      waist: cust.measurements.waist,
      shoulder: cust.measurements.shoulder,
      sleeve: cust.measurements.sleeve,
      neck: cust.measurements.neck,
      hip: cust.measurements.hip,
      height: cust.measurements.height,
      customFields: cust.measurements.customFields || {},
      notes: cust.measurements.notes || "",
    });
    if (cust.measurements.customFields) {
      setCustomFields(
        Object.entries(cust.measurements.customFields).map(([key, value]) => ({
          key,
          value: String(value),
        }))
      );
    } else {
      setCustomFields([]);
    }
  };

  const handleClearCustomerDraft = () => {
    if (!selectedCustomerId) return;
    if (typeof window !== "undefined") {
      localStorage.removeItem(`garment_order_draft_${selectedCustomerId}`);
    }
    const cust = customers.find((c) => c.id === selectedCustomerId);
    if (cust) {
      setMeasurements({
        chest: cust.measurements.chest,
        waist: cust.measurements.waist,
        shoulder: cust.measurements.shoulder,
        sleeve: cust.measurements.sleeve,
        neck: cust.measurements.neck,
        hip: cust.measurements.hip,
        height: cust.measurements.height,
        customFields: cust.measurements.customFields || {},
        notes: cust.measurements.notes || "",
      });
      if (cust.measurements.customFields) {
        setCustomFields(
          Object.entries(cust.measurements.customFields).map(([key, value]) => ({
            key,
            value: String(value),
          }))
        );
      } else {
        setCustomFields([]);
      }
    }
    setOrderNotes("");
    setMaterials([{ material: "", color: "", unit: "meters", quantity: 0, price: undefined, notes: "", estimateCategory: "Kurta/Shirt" }]);
    setProducts([{ product: "", quantity: 1, stitchType: "Standard Stitch", price: 0, notes: "" }]);
    setEmbroidery(0);
    setPrinting(0);
    setTransport(0);
    setPacking(0);
    setDiscount(0);
    setInitialPayment(0);
    setStep(0);
    setCustomerDraftMsg("");
  };

  const handleSelectSizeSet = (sizeSetId: string) => {
    setSelectedSizeSetId(sizeSetId);
    if (!selectedCustomerObj) return;

    if (sizeSetId === "primary") {
      setMeasurements({
        chest: selectedCustomerObj.measurements.chest,
        waist: selectedCustomerObj.measurements.waist,
        shoulder: selectedCustomerObj.measurements.shoulder,
        sleeve: selectedCustomerObj.measurements.sleeve,
        neck: selectedCustomerObj.measurements.neck,
        hip: selectedCustomerObj.measurements.hip,
        height: selectedCustomerObj.measurements.height,
        customFields: selectedCustomerObj.measurements.customFields || {},
        notes: selectedCustomerObj.measurements.notes || "",
      });
      if (selectedCustomerObj.measurements.customFields) {
        setCustomFields(
          Object.entries(selectedCustomerObj.measurements.customFields).map(([key, value]) => ({
            key,
            value: String(value),
          }))
        );
      } else {
        setCustomFields([]);
      }
    } else {
      const ss = selectedCustomerObj.sizeSets?.find((s) => s.id === sizeSetId);
      if (ss) {
        setMeasurements({
          chest: ss.chest,
          waist: ss.waist,
          shoulder: ss.shoulder,
          sleeve: ss.sleeve,
          neck: ss.neck,
          hip: ss.hip,
          height: ss.height,
          customFields: ss.customFields || {},
          notes: ss.notes || "",
        });
        if (ss.customFields) {
          setCustomFields(
            Object.entries(ss.customFields).map(([key, value]) => ({
              key,
              value: String(value),
            }))
          );
        } else {
          setCustomFields([]);
        }
      }
    }
  };

  const handleSaveCurrentAsSizeSet = () => {
    if (!selectedCustomerId) {
      alert("Please select a customer first.");
      return;
    }
    if (!newSizeSetName.trim()) {
      alert("Please enter a name for the new size set.");
      return;
    }

    const customFieldsObj: Record<string, string | number> = {};
    customFields.forEach((f) => {
      if (f.key.trim() && f.value.trim()) {
        customFieldsObj[f.key.trim()] = f.value.trim();
      }
    });

    const ssData = {
      name: newSizeSetName.trim(),
      chest: measurements.chest,
      waist: measurements.waist,
      shoulder: measurements.shoulder,
      sleeve: measurements.sleeve,
      neck: measurements.neck,
      hip: measurements.hip,
      height: measurements.height,
      customFields: Object.keys(customFieldsObj).length ? customFieldsObj : undefined,
      notes: measurements.notes || undefined,
    };

    addSizeSet(selectedCustomerId, ssData);
    setNewSizeSetName("");
    alert(`Size set "${ssData.name}" has been successfully saved to customer profile.`);
  };

  // Inline Customer Creation
  const handleCreateCustomerSubmit = () => {
    setCustError("");
    if (!newCustName || !newCustEmail || !newCustPhone || !newCustAddress) {
      setCustError("Name, Email, Phone, and Address are required.");
      return;
    }
    const added = addCustomer({
      name: newCustName,
      email: newCustEmail,
      phone: newCustPhone,
      company: newCustCompany || undefined,
      address: newCustAddress,
      measurements: {
        chest: undefined,
        waist: undefined,
        shoulder: undefined,
        sleeve: undefined,
        neck: undefined,
        hip: undefined,
        height: undefined,
      },
    });
    handleSelectCustomer(added.id);
    setIsCreatingNewCustomer(false);
    // Clear inputs
    setNewCustName("");
    setNewCustEmail("");
    setNewCustPhone("");
    setNewCustCompany("");
    setNewCustAddress("");
  };

  // Step 3: Material dynamic rows
  const handleAddMaterial = () => {
    setMaterials([...materials, { material: "", color: "", unit: "meters", quantity: 0, price: undefined, notes: "", estimateCategory: "Kurta/Shirt" }]);
  };
  const handleRemoveMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };
  const handleMaterialChange = (index: number, field: keyof Omit<MaterialItem, "id">, val: any) => {
    const updated = [...materials];
    // @ts-ignore
    updated[index][field] = val;
    setMaterials(updated);
  };

  // Step 4: Custom measurements
  const handleAddCustomField = () => {
    setCustomFields([...customFields, { key: "", value: "" }]);
  };
  const handleRemoveCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };
  const handleCustomFieldChange = (index: number, field: "key" | "value", val: string) => {
    const updated = [...customFields];
    updated[index][field] = val;
    setCustomFields(updated);
  };

  const handleSelectOutfitStyle = (index: number, styleId: string) => {
    const selected = outfitStyles.find((s) => s.id === styleId);
    const updated = [...products];
    if (selected) {
      updated[index] = {
        ...updated[index],
        product: selected.name,
        price: selected.baseStitchingCost || 0,
        // @ts-ignore
        outfitStyleId: selected.id
      };

      // Auto-detect garment type / category from style name or category string
      const styleName = selected.name.toLowerCase();
      const styleCategory = (selected.category || "").toLowerCase();
      let determinedType: GarmentType = "Custom";

      if (styleName.includes("kurta set") || styleName.includes("kurti set") || styleCategory.includes("kurta set") || styleCategory.includes("kurti set")) {
        determinedType = "Kurta Set";
      } else if (styleName.includes("coord set") || styleName.includes("cord set") || styleCategory.includes("coord set") || styleCategory.includes("cord set")) {
        determinedType = "Coord Set";
      } else if (styleName.includes("blouse") || styleCategory.includes("blouse")) {
        determinedType = "Blouse";
      } else if (styleName.includes("kurti") || styleCategory.includes("kurti")) {
        determinedType = "Kurti";
      } else if (styleName.includes("gown") || styleName.includes("frock") || styleName.includes("dress") || styleCategory.includes("gown") || styleCategory.includes("frock") || styleCategory.includes("dress")) {
        determinedType = "Dress/Gown";
      } else if (styleName.includes("lehenga") || styleCategory.includes("lehenga")) {
        determinedType = "Lehenga";
      } else if (styleName.includes("bottom") || styleName.includes("pant") || styleName.includes("salwar") || styleCategory.includes("bottom") || styleCategory.includes("pant") || styleCategory.includes("salwar")) {
        determinedType = "Bottom Wear";
      }

      // Auto-populate size chart configuration and measurements
      const newConfig = GARMENT_SIZE_CONFIGS[determinedType] || GARMENT_SIZE_CONFIGS["Custom"];
      if (newConfig) {
        if (determinedType === "Coord Set") {
          const defaultTop = "M";
          const defaultBottom = "30";
          const autoFilled = newConfig.getMeasurements(defaultTop, defaultBottom);
          setMeasurements({
            ...measurements,
            measurementMode: measurements.measurementMode || "standard",
            garmentType: determinedType,
            topSize: defaultTop,
            bottomSize: defaultBottom,
            standardSize: `Top: ${defaultTop} / Bottom: ${defaultBottom}`,
            ...autoFilled,
          });
        } else {
          // Blouse default size is 34; other categories default to M
          const defaultSize = newConfig.availableSizes.includes("34")
            ? "34"
            : newConfig.availableSizes.includes("M")
            ? "M"
            : newConfig.availableSizes[0];
          const autoFilled = newConfig.getMeasurements(defaultSize);
          setMeasurements({
            ...measurements,
            measurementMode: measurements.measurementMode || "standard",
            garmentType: determinedType,
            standardSize: defaultSize,
            ...autoFilled,
          });
        }
      }
    } else {
      updated[index] = {
        ...updated[index],
        product: "",
        price: 0,
        // @ts-ignore
        outfitStyleId: undefined
      };
    }
    setProducts(updated);
  };

  // Step 5: Product dynamic rows
  const handleAddProduct = () => {
    setProducts([...products, { product: "", quantity: 1, stitchType: "Standard Stitch", price: 0, notes: "" }]);
  };
  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };
  const handleProductChange = (index: number, field: keyof Omit<ProductItem, "id">, val: any) => {
    const updated = [...products];
    // @ts-ignore
    updated[index][field] = val;
    setProducts(updated);
  };

  // Step 6: Calculations
  const totalProductQty = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.quantity || 0), 0);
  }, [products]);

  const stitchingTotal = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.price || 0) * (p.quantity || 1), 0);
  }, [products]);

  const materialsTotal = useMemo(() => {
    return materials.reduce((sum, m) => sum + (m.price && Number(m.price) > 0 ? Number(m.price) : 0), 0);
  }, [materials]);

  const pricingEstimate: OrderEstimate = useMemo(() => {
    const totalEmbroidery = embroidery * totalProductQty;
    const totalPrinting = printing * totalProductQty;
    const subtotal = stitchingTotal + materialsTotal + totalEmbroidery + totalPrinting + transport + packing - discount;
    const gst = dbGstEnabled ? Math.max(0, subtotal * (dbGstRate / 100)) : 0;
    const total = Math.max(0, subtotal + gst);
    return {
      stitching: stitchingTotal,
      embroidery: totalEmbroidery,
      printing: totalPrinting,
      transport,
      packing,
      discount,
      gst,
      subtotal,
      total,
    };
  }, [stitchingTotal, materialsTotal, embroidery, printing, totalProductQty, transport, packing, discount, dbGstEnabled, dbGstRate]);

  const [draftRestored, setDraftRestored] = useState(false);

  // Auto-Save Draft to LocalStorage (Global & Per-Customer)
  const saveCurrentDraft = (targetStep?: number, custId?: string) => {
    if (typeof window === "undefined") return;
    const activeCustId = custId || selectedCustomerId;
    const draftData = {
      step: targetStep !== undefined ? targetStep : step,
      selectedCustomerId: activeCustId,
      deliveryDate,
      orderNotes,
      measurements,
      customFields,
      materials,
      products,
      embroidery,
      printing,
      transport,
      packing,
      discount,
      initialPayment,
      paymentMethod,
      timestamp: new Date().toISOString(),
    };
    try {
      localStorage.setItem("garment_order_wizard_draft", JSON.stringify(draftData));
      if (activeCustId) {
        localStorage.setItem(`garment_order_draft_${activeCustId}`, JSON.stringify(draftData));
      }
    } catch (e) {
      console.error("Failed to save draft", e);
    }
  };

  // Restore Draft on Mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("garment_order_wizard_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.selectedCustomerId) setSelectedCustomerId(parsed.selectedCustomerId);
        if (parsed.deliveryDate) setDeliveryDate(parsed.deliveryDate);
        if (parsed.orderNotes !== undefined) setOrderNotes(parsed.orderNotes);
        if (parsed.measurements) setMeasurements(parsed.measurements);
        if (parsed.customFields) setCustomFields(parsed.customFields);
        if (parsed.materials && parsed.materials.length) setMaterials(parsed.materials);
        if (parsed.products && parsed.products.length) setProducts(parsed.products);
        if (parsed.embroidery !== undefined) setEmbroidery(parsed.embroidery);
        if (parsed.printing !== undefined) setPrinting(parsed.printing);
        if (parsed.transport !== undefined) setTransport(parsed.transport);
        if (parsed.packing !== undefined) setPacking(parsed.packing);
        if (parsed.discount !== undefined) setDiscount(parsed.discount);
        if (parsed.initialPayment !== undefined) setInitialPayment(parsed.initialPayment);
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
        if (parsed.step !== undefined) setStep(parsed.step);
        setDraftRestored(true);
      } catch (e) {
        console.error("Failed to restore draft", e);
      }
    }
  }, []);

  const handleClearDraft = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("garment_order_wizard_draft");
      if (selectedCustomerId) {
        localStorage.removeItem(`garment_order_draft_${selectedCustomerId}`);
      }
    }
    setStep(0);
    setSelectedCustomerId("");
    setOrderNotes("");
    setMaterials([{ material: "", color: "", unit: "meters", quantity: 0, price: undefined, notes: "", estimateCategory: "Kurta/Shirt" }]);
    setProducts([{ product: "", quantity: 1, stitchType: "Standard Stitch", price: 0, notes: "" }]);
    setMeasurements({ chest: undefined, waist: undefined, shoulder: undefined, sleeve: undefined, neck: undefined, hip: undefined, height: undefined, customFields: {} });
    setCustomFields([]);
    setEmbroidery(0);
    setPrinting(0);
    setTransport(0);
    setPacking(0);
    setDiscount(0);
    setInitialPayment(0);
    setDraftRestored(false);
  };

  // Navigation Logic
  const populatePresetMaterials = () => {
    const collected: Omit<MaterialItem, "id">[] = [];

    products.forEach((prod) => {
      // @ts-ignore
      const styleId = prod.outfitStyleId;
      if (!styleId) return;

      const style = outfitStyles.find((s) => s.id === styleId);
      if (!style || !style.materialsJson) return;

      try {
        const parsed = JSON.parse(style.materialsJson);
        if (Array.isArray(parsed)) {
          parsed.forEach((mat: any) => {
            collected.push({
              material: mat.name || mat.material || "",
              color: "",
              unit: mat.unit || "meters",
              quantity: (mat.quantityPerPc || mat.quantity || 0) * (prod.quantity || 1),
              price: undefined,
              notes: `Preset: ${style.name}`,
              estimateCategory: style.category || "Custom"
            });
          });
        }
      } catch (e) {
        console.error("Failed parsing preset materialsJson", e);
      }
    });

    if (collected.length > 0) {
      const isDefaultEmpty = materials.length === 1 && materials[0].material === "" && (materials[0].quantity === 0 || !materials[0].quantity);
      if (isDefaultEmpty) {
        setMaterials(collected);
      } else {
        const existingNames = new Set(materials.map((m) => m.material.toLowerCase().trim()));
        const toAppend = collected.filter((c) => !existingNames.has(c.material.toLowerCase().trim()));
        if (toAppend.length > 0) {
          setMaterials([...materials, ...toAppend]);
        }
      }
    }
  };

  useEffect(() => {
    populatePresetMaterials();
  }, [products]);

  useEffect(() => {
    const focusFirstInput = () => {
      const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement>(
        "input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button[role='combobox']"
      );
      if (input) {
        input.focus();
        if (input.tagName === "INPUT" && typeof input.select === "function") {
          input.select();
        }
      }
    };
    const timer = setTimeout(focusFirstInput, 150);
    return () => clearTimeout(timer);
  }, [step]);

  const handleNext = () => {
    if (step === 0 && !selectedCustomerId) {
      alert("Please select a customer or create a new one first.");
      return;
    }
    if (step === 1 && !deliveryDate) {
      alert("Please specify a delivery date.");
      return;
    }
    if (step === 2 && products.some((p) => !p.product || p.price <= 0)) {
      alert("Please specify garment item description and price for all items.");
      return;
    }
    const nextStep = step + 1;
    setStep(nextStep);
    saveCurrentDraft(nextStep);
  };

  const handleBack = () => {
    const prevStep = Math.max(0, step - 1);
    setStep(prevStep);
    saveCurrentDraft(prevStep);
  };

  // Submit Order to Store
  const handleSubmitOrder = () => {
    if (!selectedCustomerObj) return;

    // Build measurements payload
    const customFieldsObj: Record<string, string | number> = {};
    customFields.forEach((f) => {
      if (f.key.trim() && f.value.trim()) {
        customFieldsObj[f.key.trim()] = f.value.trim();
      }
    });

    const finalMeasurements: Measurements = {
      ...measurements,
      customFields: Object.keys(customFieldsObj).length ? customFieldsObj : undefined,
    };

    // Format materials with IDs
    const finalMaterials: MaterialItem[] = materials
      .filter((m) => m.material.trim())
      .map((m, idx) => ({
        ...m,
        id: `m-${Date.now()}-${idx}`,
      }));

    // Format products with IDs
    const finalProducts: ProductItem[] = products.map((p, idx) => ({
      ...p,
      id: `p-${Date.now()}-${idx}`,
    }));

    const orderData = {
      customerId: selectedCustomerObj.id,
      customerName: selectedCustomerObj.name,
      status: "Material Received" as OrderStatus,
      materials: finalMaterials,
      products: finalProducts,
      measurements: finalMeasurements,
      sizeSetName: selectedSizeSetId === "primary" ? "Primary Measurements" : (selectedCustomerObj.sizeSets?.find(s => s.id === selectedSizeSetId)?.name || "Custom Set"),
      estimate: pricingEstimate,
      deliveryDate,
      notes: orderNotes.trim() || undefined,
    };

    addOrder(orderData, initialPayment, paymentMethod);

    if (typeof window !== "undefined") {
      localStorage.removeItem("garment_order_wizard_draft");
    }

    router.push("/orders");
  };

  const formatCurrency = (val: number) => {
    return `${settings.currencySymbol}${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handlePrintDraftInvoice = () => {
    if (!selectedCustomerObj) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to preview the invoice.");
      return;
    }

    const items = products.map((p) => ({
      itemDescription: p.product || "Garment Item",
      category: p.stitchType,
      quantity: p.quantity,
      unitRate: p.price,
      totalPrice: p.price * p.quantity,
      fabricDetails: p.notes,
    }));

    const subtotal = pricingEstimate.stitching || 0;
    const laborPrinting = (pricingEstimate.embroidery || 0) + (pricingEstimate.printing || 0);
    const shipping = pricingEstimate.transport || 0;
    const packing = pricingEstimate.packing || 0;
    const totalAmount = pricingEstimate.total;
    const advancePaid = initialPayment;
    const balanceDue = Math.max(0, totalAmount - advancePaid);

    const invoiceHtml = generateInvoiceHTML({
      invoiceNumber: `DRAFT-${Date.now().toString().slice(-4)}`,
      orderNumber: "DRAFT",
      clientName: selectedCustomerObj.name,
      businessName: selectedCustomerObj.company || undefined,
      mobileNumber: selectedCustomerObj.phone || "",
      email: selectedCustomerObj.email || undefined,
      address: selectedCustomerObj.address || orderNotes || undefined,
      paymentTerms: `Payment Terms: ${advancePaid > 0 ? formatCurrency(advancePaid) : 'No'} Advance`,
      items,
      subtotal,
      laborPrintingCharges: laborPrinting,
      shippingCharges: shipping,
      packingCharges: packing,
      gstAmount: pricingEstimate.gst,
      discountAmount: pricingEstimate.discount,
      totalAmount,
      advancePaid,
      balanceDue,
      invoiceDate: new Date().toLocaleDateString(),
      isBoutique: true,
    });

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Draft_Invoice_${selectedCustomerObj.name.replace(/\s+/g, '_')}</title>
          <style>
            * { box-sizing: border-box !important; }
            @media print {
              button, .print-hide { display: none !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background: #fff;">
          ${invoiceHtml}
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `;

    printWindow.document.write(fullHtml);
    printWindow.document.close();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center space-x-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Custom Order</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Bespoke garment workflow designer wizard.</p>
        </div>
      </div>

      {/* Customer Specific Draft Restored Banner */}
      {customerDraftMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-lg text-xs text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shadow-xs">
          <span className="font-medium flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            {customerDraftMsg}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearCustomerDraft}
            className="h-7 text-[11px] font-semibold border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900"
          >
            Clear Customer Draft & Reset
          </Button>
        </div>
      )}

      {/* Draft Restored Banner */}
      {!customerDraftMsg && draftRestored && (
        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-lg text-xs text-blue-900 dark:text-blue-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shadow-xs">
          <span>Draft restored from your last session. All section inputs auto-save when clicking Next/Back.</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearDraft}
            className="h-7 text-[11px] font-semibold border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900"
          >
            Clear Draft & Start Fresh
          </Button>
        </div>
      )}

      {/* Stepper progress */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-md shadow-sm">
        <Stepper steps={STEPS} mobileSteps={MOBILE_STEPS} currentStep={step} />
      </div>

      {/* Active Step Panel */}
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm min-h-[400px] flex flex-col justify-between">
        <CardContent className="p-6">
          {/* STEP 0: Customer */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-450 flex items-center">
                  <User className="h-4 w-4 mr-2" /> Select Client Profile
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreatingNewCustomer(!isCreatingNewCustomer)}
                  className="text-xs font-semibold"
                >
                  {isCreatingNewCustomer ? "Select Existing Profile" : "Register New Profile Inline"}
                </Button>
              </div>

              {isCreatingNewCustomer ? (
                // Create inline customer
                <div className="space-y-4 max-w-xl">
                  <p className="text-xs text-zinc-400">Register a new client and save directly to local state.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Full Name *</Label>
                      <Input
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        placeholder="e.g. Eleanor Vance"
                        className="h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Company / Brand</Label>
                      <Input
                        value={newCustCompany}
                        onChange={(e) => setNewCustCompany(e.target.value)}
                        placeholder="e.g. Manor Inc (Optional)"
                        className="h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Email Address *</Label>
                      <Input
                        type="email"
                        value={newCustEmail}
                        onChange={(e) => setNewCustEmail(e.target.value)}
                        placeholder="e.g. e.vance@example.com"
                        className="h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Phone Number *</Label>
                      <Input
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                        placeholder="e.g. +1 555-908-1122"
                        className="h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Billing Address *</Label>
                      <Input
                        value={newCustAddress}
                        onChange={(e) => setNewCustAddress(e.target.value)}
                        placeholder="e.g. 100 Hill House Road, Boston, MA"
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>
                  {custError && <p className="text-[10px] text-red-500 font-bold">{custError}</p>}
                  <Button type="button" size="sm" onClick={handleCreateCustomerSubmit} className="font-semibold text-xs tracking-tight">
                    Add & Select Client
                  </Button>
                </div>
              ) : (
                // Search list of customers
                <div className="space-y-4">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input
                      placeholder="Type name, email, or phone to search..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-9 bg-zinc-50 dark:bg-zinc-950 focus-visible:bg-white text-sm"
                    />
                  </div>

                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden max-h-72 overflow-y-auto">
                    <div className="divide-y divide-zinc-150 dark:divide-zinc-850">
                      {filteredCustomers.length === 0 ? (
                        <p className="p-4 text-xs text-zinc-400 italic text-center">No customers match search criteria.</p>
                      ) : (
                        filteredCustomers.map((c) => {
                          const isSelected = selectedCustomerId === c.id;
                          return (
                            <div
                              key={c.id}
                              onClick={() => handleSelectCustomer(c.id)}
                              className={cn(
                                "p-3 flex justify-between items-center cursor-pointer transition-colors",
                                isSelected
                                  ? "bg-zinc-100 dark:bg-zinc-800/60"
                                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800/10"
                              )}
                            >
                              <div>
                                <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{c.name}</p>
                                <p className="text-xs text-zinc-400 mt-0.5">{c.email} | {c.phone}</p>
                              </div>
                              <div className="flex items-center space-x-3">
                                {c.company && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-zinc-50 dark:bg-zinc-900 border text-zinc-400 rounded">
                                    {c.company}
                                  </span>
                                )}
                                <div className={cn(
                                  "h-5 w-5 rounded-full border flex items-center justify-center transition-all",
                                  isSelected ? "bg-zinc-900 border-zinc-900 text-white dark:bg-white dark:text-black" : "border-zinc-250 bg-white dark:bg-zinc-950"
                                )}>
                                  {isSelected && <Check className="h-3 w-3" />}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {selectedCustomerObj && (
                    <div className="bg-emerald-50/20 border border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30 p-4 rounded-md text-xs leading-normal">
                      Selected: <span className="font-bold">{selectedCustomerObj.name}</span> ({selectedCustomerObj.email})
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 1: Order Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-450 border-b border-zinc-150 dark:border-zinc-800 pb-3 flex items-center">
                <ShoppingBag className="h-4 w-4 mr-2" /> Order Metadata
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                <div className="space-y-1.5">
                  <Label htmlFor="deliveryDate" className="text-xs font-bold uppercase tracking-wider text-zinc-450">Target Delivery Date *</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="h-10 text-sm"
                  />
                  <p className="text-[10px] text-zinc-455">Est. scheduling timeline: 14 business days standard.</p>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="orderNotes" className="text-xs font-bold uppercase tracking-wider text-zinc-450">Design Notes & Fabric Instructions</Label>
                  <Textarea
                    id="orderNotes"
                    placeholder="Provide specific notes regarding cutting, fitting margins, embroidery layouts, details..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="h-28 text-xs resize-none"
                  />
                </div>
              </div>
            </div>
          )}



          {/* STEP 2: Garments & Measurements */}
          {step === 2 && (
            <div className="space-y-8">
              {/* Garments to Tailor Block */}
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-zinc-150 dark:border-zinc-800 pb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-450 flex items-center">
                    <ShoppingBag className="h-4 w-4 mr-2 text-zinc-500" /> Garments to Tailor
                  </h2>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddProduct} className="h-8 text-xs font-semibold">
                    + Add Garment Item
                  </Button>
                </div>

                <div className="space-y-4">
                  {products.map((p, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-6 gap-3 p-4 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 rounded-md items-end">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Preset Style</Label>
                        <select
                          // @ts-ignore
                          value={p.outfitStyleId || ""}
                          onChange={(e) => handleSelectOutfitStyle(index, e.target.value)}
                          className="w-full h-9 px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-400"
                        >
                          <option value="">Custom Outfit</option>
                          {outfitStyles.map((style) => (
                            <option key={style.id} value={style.id}>
                              {style.name} (₹{style.baseStitchingCost})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Garment Description *</Label>
                        <Input
                          placeholder="e.g. Silk Tuxedo Jacket"
                          value={p.product}
                          onChange={(e) => handleProductChange(index, "product", e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Stitch Type / Tier</Label>
                        <Input
                          placeholder="e.g. Bespoke Couture"
                          value={p.stitchType}
                          onChange={(e) => handleProductChange(index, "stitchType", e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Quantity</Label>
                        <NumberInput
                          value={p.quantity || 1}
                          onChange={(val) => handleProductChange(index, "quantity", val)}
                          allowDecimals={false}
                          min={1}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="space-y-1 flex-1">
                          <Label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Unit Price ({settings.currencySymbol}) *</Label>
                          <NumberInput
                            value={p.price || ""}
                            onChange={(val) => handleProductChange(index, "price", val)}
                            className="h-9 text-xs"
                          />
                        </div>
                        {products.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveProduct(index)}
                            className="text-red-500 h-9 w-9 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fitting Dimensions & Size Chart Block */}
              <div className="border-t border-zinc-200/60 dark:border-zinc-800 pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-150 dark:border-zinc-800 pb-3 mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-850 dark:text-zinc-200 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>Fitting Dimensions & Size Chart</span>
                  </h2>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddCustomField} className="h-8 text-xs font-semibold shrink-0">
                    + Add Custom Field
                  </Button>
                </div>

                {/* Garment-wise Standard Size Chart & Custom Mode Selector */}
                <GarmentSizeSelector
                  measurements={measurements}
                  onChange={(updated) => setMeasurements(updated)}
                />
              </div>

              {selectedCustomerObj && (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md">
                    <div className="space-y-1.5 flex-1 w-full">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Load Saved Sizing Set</Label>
                      <Select
                        value={selectedSizeSetId}
                        onValueChange={(val) => val && handleSelectSizeSet(val)}
                      >
                        <SelectTrigger className="h-9 text-xs bg-white dark:bg-zinc-900 w-full sm:max-w-xs">
                          <SelectValue placeholder="Choose a size set..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary" className="text-xs">Primary Measurements</SelectItem>
                          {selectedCustomerObj.sizeSets?.map((ss) => (
                            <SelectItem key={ss.id} value={ss.id} className="text-xs">
                              {ss.name} (Updated: {new Date(ss.updatedAt).toLocaleDateString()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end gap-2 w-full md:w-auto self-end md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-zinc-200 dark:border-zinc-800">
                      <div className="space-y-1 flex-1 md:flex-initial">
                        <Label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">Save Current as New Set</Label>
                        <Input
                          placeholder="Set Name (e.g. Suit Size)"
                          value={newSizeSetName}
                          onChange={(e) => setNewSizeSetName(e.target.value)}
                          className="h-9 text-xs w-full md:w-44 bg-white dark:bg-zinc-900"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSaveCurrentAsSizeSet}
                        className="h-9 text-xs font-semibold px-3 shrink-0"
                      >
                        Save Set
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Reference & Tailored Measurements Grid (Filtered by Garment Category) */}
              {(() => {
                const activeGarmentConfig = GARMENT_SIZE_CONFIGS[(measurements.garmentType as GarmentType) || "Kurti"] || GARMENT_SIZE_CONFIGS["Kurti"];
                
                const allFields = [
                  { key: "chest", label: measurements.garmentType === "Blouse" ? "Bust" : "Bust / Chest" },
                  { key: "underBust", label: "Under Bust" },
                  { key: "waist", label: "Waist" },
                  { key: "hip", label: "Hip" },
                  { key: "shoulder", label: "Shoulder" },
                  { key: "armhole", label: "Armhole" },
                  { key: "sleeve", label: "Sleeve Length" },
                  { key: "sleeveRound", label: "Sleeve Round" },
                  { key: "neck", label: "Neck" },
                  { key: "height", label: "Height" },
                  { key: "garmentLength", label: measurements.garmentType === "Blouse" ? "Blouse Length" : measurements.garmentType === "Bottom Wear" ? "Pant Length" : measurements.garmentType === "Lehenga" ? "Lehenga Length" : "Garment Length" },
                  { key: "thigh", label: "Thigh" },
                  { key: "knee", label: "Knee" },
                  { key: "bottomOpening", label: "Bottom Opening" },
                  { key: "inseam", label: "Inseam" },
                ];

                // Filter fields relevant to the selected garment category
                const visibleFields = measurements.garmentType
                  ? allFields.filter((f) => activeGarmentConfig.relevantFields.includes(f.key as any))
                  : allFields.slice(0, 8); // Default fallback: core body fields

                return (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-150 dark:border-zinc-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                          {measurements.garmentType ? `${measurements.garmentType} Specific Dimensions` : "Body Measurements"}
                        </Label>
                        <span className="text-[10px] font-semibold text-zinc-400">
                          (Showing {visibleFields.length} {measurements.garmentType || "garment"} fields)
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddCustomField}
                        className="h-8 text-xs font-semibold text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer shrink-0"
                      >
                        + Add Custom Measurement
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      {visibleFields.map(({ key, label }) => (
                        <div key={key} className="space-y-1">
                          <Label htmlFor={key} className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 truncate block" title={label}>
                            {label}
                          </Label>
                          <NumberInput
                            id={key}
                            // @ts-ignore
                            value={measurements[key] !== undefined ? measurements[key] : ""}
                            // @ts-ignore
                            onChange={(val) => setMeasurements({ ...measurements, [key]: val !== "" ? val : undefined })}
                            className="h-9 text-xs"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Additional specs for Lehenga */}
                    {measurements.garmentType === "Lehenga" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Lehenga Flair (Meters)</Label>
                          <Input
                            value={measurements.flair || ""}
                            onChange={(e) => setMeasurements({ ...measurements, flair: e.target.value })}
                            placeholder="e.g. 4.0 meters"
                            className="h-9 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Can Can Attachment</Label>
                          <Input
                            value={measurements.canCan || ""}
                            onChange={(e) => setMeasurements({ ...measurements, canCan: e.target.value })}
                            placeholder="e.g. Included (Double Net)"
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Custom Measurements fields */}
              {customFields.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-850">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Additional dimensions / specs</h4>
                  <div className="space-y-2">
                    {customFields.map((field, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <Input
                          placeholder="Measurement (e.g. Inseam)"
                          value={field.key}
                          onChange={(e) => handleCustomFieldChange(idx, "key", e.target.value)}
                          className="flex-1 h-9 text-xs"
                        />
                        <Input
                          placeholder="Value (e.g. 30 in)"
                          value={field.value}
                          onChange={(e) => handleCustomFieldChange(idx, "value", e.target.value)}
                          className="flex-1 h-9 text-xs"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCustomField(idx)}
                          className="text-red-500 h-9 w-9"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Extra Sizing Notes field */}
              <div className="space-y-1.5 pt-4 border-t border-zinc-100 dark:border-zinc-850">
                <Label htmlFor="sizingNotes" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Extra Fitting Notes / Sizing Instructions</Label>
                <Textarea
                  id="sizingNotes"
                  placeholder="Enter specific instructions (e.g., needs loose fit around shoulders, collar should be stiff, keep 2 inch margin for future alterations)"
                  value={measurements.notes || ""}
                  onChange={(e) => setMeasurements({ ...measurements, notes: e.target.value })}
                  className="min-h-20 text-xs bg-zinc-50/50 dark:bg-zinc-950"
                />
              </div>

              {/* Materials Block */}
              <div className="border-t border-zinc-200/60 dark:border-zinc-800 pt-6">
                <div className="flex justify-between items-center border-b border-zinc-150 dark:border-zinc-800 pb-3 mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-450 flex items-center">
                    <Scissors className="h-4 w-4 mr-2 text-zinc-500" /> Material Requirements Checklist
                  </h2>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddMaterial} className="h-8 text-xs font-semibold">
                    + Add Material Row
                  </Button>
                </div>

                <div className="space-y-4">
                  {materials.map((m, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-7 gap-3 p-4 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 rounded-md items-end">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Material Name</Label>
                        <Input
                          placeholder="e.g. Silk Organza"
                          value={m.material}
                          onChange={(e) => handleMaterialChange(index, "material", e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Color / Dye</Label>
                        <ColorPickerInput
                          placeholder="e.g. Ivory #09"
                          value={m.color}
                          onChange={(col) => handleMaterialChange(index, "color", col)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Unit Type</Label>
                        <Input
                          placeholder="meters"
                          value={m.unit}
                          onChange={(e) => handleMaterialChange(index, "unit", e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Garment Type</Label>
                        <Select
                          value={m.estimateCategory || "Kurta/Shirt"}
                          onValueChange={(val) => handleMaterialChange(index, "estimateCategory", val)}
                        >
                          <SelectTrigger className="h-9 text-xs bg-white dark:bg-zinc-900 border-zinc-250 dark:border-zinc-800">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Kurta/Shirt">Kurta/Shirt</SelectItem>
                            <SelectItem value="Pants">Trouser/Pants</SelectItem>
                            <SelectItem value="Blouse">Blouse (Choli)</SelectItem>
                            <SelectItem value="Gown/Dress">Dress/Gown</SelectItem>
                            <SelectItem value="Custom">Custom / Other Garment</SelectItem>
                          </SelectContent>
                        </Select>
                        {m.estimateCategory === "Custom" && (
                          <Input
                            placeholder="Garment name (e.g. Sharara)"
                            value={m.customCategory || ""}
                            onChange={(e) => handleMaterialChange(index, "customCategory", e.target.value)}
                            className="h-8 text-xs mt-1 bg-white dark:bg-zinc-900 border-amber-300 dark:border-amber-800"
                          />
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Quantity Needed</Label>
                        <NumberInput
                          value={m.quantity || ""}
                          onChange={(val) => handleMaterialChange(index, "quantity", val)}
                          className="h-9 text-xs"
                        />
                        {(() => {
                          const suggestion = calculateSuggestedFabric(measurements, m.unit, m.estimateCategory, products);
                          if (!suggestion) return null;
                          return (
                            <button
                              type="button"
                              onClick={() => handleMaterialChange(index, "quantity", suggestion.amount)}
                              className="text-[9px] text-left text-zinc-550 hover:text-black dark:text-zinc-400 dark:hover:text-white mt-1 underline cursor-pointer block font-semibold transition"
                              title={suggestion.description}
                            >
                              Suggest: {suggestion.amount} {m.unit}
                            </button>
                          );
                        })()}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                          <span>Price (₹)</span>
                          <span className="text-[8px] text-zinc-400 font-normal">Optional</span>
                        </Label>
                        <NumberInput
                          placeholder="e.g. 500"
                          value={m.price ?? ""}
                          onChange={(val) => handleMaterialChange(index, "price", val)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="space-y-1 flex-1">
                          <Label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Fabric Notes</Label>
                          <Input
                            placeholder="Notes"
                            value={m.notes}
                            onChange={(e) => handleMaterialChange(index, "notes", e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                        {materials.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMaterial(index)}
                            className="text-red-500 h-9 w-9 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}



          {/* STEP 3: Estimate pricing */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-450 border-b border-zinc-150 dark:border-zinc-800 pb-3 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" /> Costing & Adjustments
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Cost inputs */}
                <div className="space-y-4">
                  <p className="text-xs text-zinc-400">Input extra labor or logistics charges to update estimate.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Embroidery labor ({settings.currencySymbol} / unit)</Label>
                      <NumberInput
                        value={embroidery || ""}
                        onChange={(val) => setEmbroidery(val)}
                        className="h-9 text-xs"
                      />
                      {embroidery > 0 && (
                        <p className="text-[9px] text-zinc-400 mt-1">
                          Total: {formatCurrency(embroidery * totalProductQty)} ({formatCurrency(embroidery)} × {totalProductQty} {totalProductQty === 1 ? "unit" : "units"})
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Fabric Printing ({settings.currencySymbol} / unit)</Label>
                      <NumberInput
                        value={printing || ""}
                        onChange={(val) => setPrinting(val)}
                        className="h-9 text-xs"
                      />
                      {printing > 0 && (
                        <p className="text-[9px] text-zinc-400 mt-1">
                          Total: {formatCurrency(printing * totalProductQty)} ({formatCurrency(printing)} × {totalProductQty} {totalProductQty === 1 ? "unit" : "units"})
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Transport / Courier ({settings.currencySymbol})</Label>
                      <NumberInput
                        value={transport || ""}
                        onChange={(val) => setTransport(val)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Packing Material ({settings.currencySymbol})</Label>
                      <NumberInput
                        value={packing || ""}
                        onChange={(val) => setPacking(val)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Discounts ({settings.currencySymbol})</Label>
                      <NumberInput
                        value={discount || ""}
                        onChange={(val) => setDiscount(val)}
                        className="h-9 text-xs text-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Live estimate display */}
                <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-6 rounded-md space-y-3.5 text-xs h-fit self-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Live Price Calculation</h3>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Stitching charges</span>
                    <span className="font-semibold">{formatCurrency(pricingEstimate.stitching || 0)}</span>
                  </div>
                  {(pricingEstimate.embroidery || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Embroidery labor</span>
                      <span className="font-semibold">{formatCurrency(pricingEstimate.embroidery || 0)}</span>
                    </div>
                  )}
                  {(pricingEstimate.printing || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Printing fee</span>
                      <span className="font-semibold">{formatCurrency(pricingEstimate.printing || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Shipping & Packing</span>
                    <span className="font-semibold">
                      {formatCurrency((pricingEstimate.transport || 0) + (pricingEstimate.packing || 0))}
                    </span>
                  </div>
                  {(pricingEstimate.discount || 0) > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Discount</span>
                      <span className="font-semibold">-{formatCurrency(pricingEstimate.discount || 0)}</span>
                    </div>
                  )}
                  {dbGstEnabled && (
                    <div className="flex justify-between border-t pt-2 border-zinc-200/50 dark:border-zinc-800">
                      <span className="text-zinc-500">GST ({dbGstRate}%)</span>
                      <span className="font-semibold">{formatCurrency(pricingEstimate.gst || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 border-zinc-200/80 dark:border-zinc-800 text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
                    <span>Grand Total</span>
                    <span>{formatCurrency(pricingEstimate.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Payment Screen */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-450 border-b border-zinc-150 dark:border-zinc-800 pb-3 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" /> Initial Payment Deposit
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Panel: Deposit Input & Percentage Buttons */}
                <div className="space-y-5">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-450">
                      Quick Advance Deposit Presets (% of Estimated Total)
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                      {[0.25, 0.5, 0.75, 1.0].map((pct) => {
                        const pctAmount = Math.round(pricingEstimate.total * pct * 100) / 100;
                        const isSelected = Math.abs((initialPayment || 0) - pctAmount) < 1;
                        const label = `${pct * 100}%${pct === 0.5 ? " (Standard)" : pct === 1.0 ? " (Full)" : ""}`;

                        return (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setInitialPayment(pctAmount)}
                            className={`p-2.5 rounded-lg border text-xs font-medium transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                              isSelected
                                ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-sm"
                                : "bg-white dark:bg-zinc-900 border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                            }`}
                          >
                            <span>{label}</span>
                            <span className="text-[11px] font-mono opacity-80">{formatCurrency(pctAmount)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="initialPayment" className="text-xs font-bold uppercase tracking-wider text-zinc-450">
                        Deposit Amount ({settings.currencySymbol}) *
                      </Label>
                      <NumberInput
                        id="initialPayment"
                        value={initialPayment || ""}
                        onChange={(val) => setInitialPayment(val)}
                        className="h-10 text-sm font-semibold"
                        placeholder="0.00"
                      />
                      <div className="text-[11px] text-zinc-500 mt-1.5 flex justify-between">
                        <span>Paid: <strong>{pricingEstimate.total > 0 ? ((initialPayment / pricingEstimate.total) * 100).toFixed(1) : 0}%</strong></span>
                        <span>Due on Delivery: <strong>{formatCurrency(Math.max(0, pricingEstimate.total - (initialPayment || 0)))}</strong></span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-zinc-450">Payment Method</Label>
                      <Select
                        value={paymentMethod}
                        onValueChange={(val) => val && setPaymentMethod(val as any)}
                      >
                        <SelectTrigger className="h-10 text-sm bg-white dark:bg-zinc-950">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Card">Credit Card</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Wire</SelectItem>
                          <SelectItem value="UPI">UPI / QR Code</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Estimated Price Breakup Summary */}
                <div className="bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      Estimated Cost Breakup Summary
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-400">Order Estimation</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Stitching Charges</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(pricingEstimate.stitching || 0)}</span>
                    </div>

                    {(pricingEstimate.embroidery || 0) > 0 && (
                      <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                        <span>Embroidery Labor</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(pricingEstimate.embroidery || 0)}</span>
                      </div>
                    )}

                    {(pricingEstimate.printing || 0) > 0 && (
                      <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                        <span>Fabric Printing</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(pricingEstimate.printing || 0)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Logistics & Packaging</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency((pricingEstimate.transport || 0) + (pricingEstimate.packing || 0))}
                      </span>
                    </div>

                    {(pricingEstimate.discount || 0) > 0 && (
                      <div className="flex justify-between text-red-500">
                        <span>Promotional Discount</span>
                        <span className="font-semibold">-{formatCurrency(pricingEstimate.discount || 0)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400 border-t border-zinc-200/60 dark:border-zinc-800 pt-2">
                      <span>GST Tax ({settings.gstRate}%)</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(pricingEstimate.gst || 0)}</span>
                    </div>

                    <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-700 pt-2 text-sm font-extrabold text-zinc-950 dark:text-zinc-50">
                      <span>Estimated Grand Total</span>
                      <span>{formatCurrency(pricingEstimate.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Review order before saving */}
          {step === 5 && selectedCustomerObj && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-450 border-b border-zinc-150 dark:border-zinc-800 pb-3 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" /> Verify Details & Blueprint
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Client & metadata */}
                <div className="space-y-4">
                  <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-4 rounded-md space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Client Profile</h3>
                    <p className="font-semibold text-sm text-zinc-950 dark:text-zinc-50">{selectedCustomerObj.name}</p>
                    <p className="text-zinc-500">{selectedCustomerObj.email} &bull; {selectedCustomerObj.phone}</p>
                    <div className="border-t border-zinc-200/50 dark:border-zinc-800/50 pt-2 flex justify-between">
                      <span className="text-zinc-450">Delivery Date</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{deliveryDate}</span>
                    </div>
                  </div>

                  {/* Garments to Tailor list */}
                  <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-4 rounded-md space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Garments List</h3>
                    <div className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
                      {products.map((p, idx) => (
                        <div key={idx} className="py-2 flex justify-between">
                          <span>{p.quantity}x {p.product} ({p.stitchType})</span>
                          <span className="font-semibold">{formatCurrency(p.price * p.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Estimate Summary details */}
                <div className="space-y-4">
                  <div className="bg-zinc-55 bg-zinc-900 text-white dark:bg-zinc-950 p-4 rounded-md space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Costing Statement</h3>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Stitching charges</span>
                      <span>{formatCurrency(pricingEstimate.stitching || 0)}</span>
                    </div>
                    {((pricingEstimate.embroidery || 0) > 0 || (pricingEstimate.printing || 0) > 0) && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Labor & Printing</span>
                        <span>{formatCurrency((pricingEstimate.embroidery || 0) + (pricingEstimate.printing || 0))}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Shipping & Packing</span>
                      <span>{formatCurrency((pricingEstimate.transport || 0) + (pricingEstimate.packing || 0))}</span>
                    </div>
                    {(pricingEstimate.discount || 0) > 0 && (
                      <div className="flex justify-between text-red-400">
                        <span>Discount</span>
                        <span>-{formatCurrency(pricingEstimate.discount || 0)}</span>
                      </div>
                    )}
                    {dbGstEnabled && (
                      <div className="flex justify-between border-t border-zinc-800 pt-2">
                        <span className="text-zinc-400">GST ({dbGstRate}%)</span>
                        <span>{formatCurrency(pricingEstimate.gst || 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-zinc-700 pt-2 text-sm font-bold text-white">
                      <span>Grand Total</span>
                      <span>{formatCurrency(pricingEstimate.total)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 border-t border-zinc-800 pt-2">
                      <span>Deposit Paid ({paymentMethod})</span>
                      <span>-{formatCurrency(initialPayment)}</span>
                    </div>
                    <div className="flex justify-between border-t border-zinc-800 pt-2 font-semibold">
                      <span className="text-zinc-350">Balance Outstanding</span>
                      <span>{formatCurrency(Math.max(0, pricingEstimate.total - initialPayment))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer Navigation Buttons */}
        <div className="p-4 sm:p-6 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={step === 0}
            className="font-semibold shrink-0"
          >
            <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>

          {step === STEPS.length - 1 ? (
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrintDraftInvoice}
                className="border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer shrink-0"
              >
                <Printer className="mr-1.5 h-4 w-4 text-zinc-500" />
                <span className="hidden sm:inline">Preview &amp; Print Invoice</span>
                <span className="sm:hidden">Print</span>
              </Button>
              <Button
                type="button"
                onClick={handleSubmitOrder}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-sm shrink-0"
              >
                <span className="hidden sm:inline">Submit Order</span>
                <span className="sm:hidden">Submit</span>
                <CheckCircle className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              className="font-semibold cursor-pointer shrink-0"
            >
              Next <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
