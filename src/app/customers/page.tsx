"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useProductionStore } from "@/store/productionStore";
import { MeasurementCard, StatusBadge, EmptyState } from "@/components/shared/ReusableComponents";
import { Customer, Measurements, SizeSet } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Phone,
  Mail,
  Building,
  MapPin,
  Calendar,
  History,
  ShoppingBag,
  SlidersHorizontal,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CustomerFormValues {
  name: string;
  email: string;
  phone: string;
  company?: string;
  address: string;
  chest?: number;
  waist?: number;
  shoulder?: number;
  sleeve?: number;
  neck?: number;
  hip?: number;
  height?: number;
  notes?: string;
}

// Zod Validation Schema for Customer Add/Edit
const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(6, "Phone must be at least 6 characters"),
  company: z.string().optional(),
  address: z.string().min(5, "Address must be at least 5 characters"),
  chest: z.preprocess((val) => (val === "" || val === null ? undefined : Number(val)), z.number().min(0).optional()),
  waist: z.preprocess((val) => (val === "" || val === null ? undefined : Number(val)), z.number().min(0).optional()),
  shoulder: z.preprocess((val) => (val === "" || val === null ? undefined : Number(val)), z.number().min(0).optional()),
  sleeve: z.preprocess((val) => (val === "" || val === null ? undefined : Number(val)), z.number().min(0).optional()),
  neck: z.preprocess((val) => (val === "" || val === null ? undefined : Number(val)), z.number().min(0).optional()),
  hip: z.preprocess((val) => (val === "" || val === null ? undefined : Number(val)), z.number().min(0).optional()),
  height: z.preprocess((val) => (val === "" || val === null ? undefined : Number(val)), z.number().min(0).optional()),
  notes: z.string().optional(),
}) as z.ZodType<CustomerFormValues>;

function CustomersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    customers,
    orders,
    settings,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addSizeSet,
    updateSizeSet,
    deleteSizeSet,
  } = useProductionStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string }>>([]);

  // Size Set Form State
  const [sizeSetModalOpen, setSizeSetModalOpen] = useState(false);
  const [editingSizeSetId, setEditingSizeSetId] = useState<string | null>(null);
  const [sizeSetName, setSizeSetName] = useState("");
  const [sizeSetChest, setSizeSetChest] = useState("");
  const [sizeSetWaist, setSizeSetWaist] = useState("");
  const [sizeSetShoulder, setSizeSetShoulder] = useState("");
  const [sizeSetSleeve, setSizeSetSleeve] = useState("");
  const [sizeSetNeck, setSizeSetNeck] = useState("");
  const [sizeSetHip, setSizeSetHip] = useState("");
  const [sizeSetHeight, setSizeSetHeight] = useState("");
  const [sizeSetCustomFields, setSizeSetCustomFields] = useState<Array<{ key: string; value: string }>>([]);
  const [sizeSetNotes, setSizeSetNotes] = useState("");

  // Check URL query parameters for selected customer (e.g. from global search)
  useEffect(() => {
    const selectId = searchParams.get("select");
    if (selectId) {
      const exists = customers.some((c) => c.id === selectId);
      if (exists) {
        setSelectedCustomerId(selectId);
      }
    }
  }, [searchParams, customers]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.company && c.company.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const customerOrders = useMemo(() => {
    if (!selectedCustomerId) return [];
    return orders.filter((o) => o.customerId === selectedCustomerId);
  }, [orders, selectedCustomerId]);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema as any),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      address: "",
      notes: "",
    },
  });

  const handleOpenAddForm = () => {
    setEditingId(null);
    setCustomFields([]);
    reset({
      name: "",
      email: "",
      phone: "",
      company: "",
      address: "",
      chest: undefined,
      waist: undefined,
      shoulder: undefined,
      sleeve: undefined,
      neck: undefined,
      hip: undefined,
      height: undefined,
      notes: "",
    });
    setFormOpen(true);
  };

  const handleOpenEditForm = (customer: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(customer.id);
    
    // Set standard fields
    reset({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company || "",
      address: customer.address,
      chest: customer.measurements.chest,
      waist: customer.measurements.waist,
      shoulder: customer.measurements.shoulder,
      sleeve: customer.measurements.sleeve,
      neck: customer.measurements.neck,
      hip: customer.measurements.hip,
      height: customer.measurements.height,
      notes: customer.measurements.notes || "",
    });

    // Load custom measurements fields
    if (customer.measurements.customFields) {
      const fields = Object.entries(customer.measurements.customFields).map(([key, value]) => ({
        key,
        value: String(value),
      }));
      setCustomFields(fields);
    } else {
      setCustomFields([]);
    }

    setFormOpen(true);
  };

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

  const onSubmit = (values: CustomerFormValues) => {
    const customFieldsObj: Record<string, string | number> = {};
    customFields.forEach((f) => {
      if (f.key.trim() && f.value.trim()) {
        customFieldsObj[f.key.trim()] = f.value.trim();
      }
    });

    const measurementsData: Measurements = {
      chest: values.chest,
      waist: values.waist,
      shoulder: values.shoulder,
      sleeve: values.sleeve,
      neck: values.neck,
      hip: values.hip,
      height: values.height,
      customFields: Object.keys(customFieldsObj).length ? customFieldsObj : undefined,
      notes: values.notes || undefined,
    };

    const customerData = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      company: values.company || undefined,
      address: values.address,
      measurements: measurementsData,
    };

    if (editingId) {
      updateCustomer(editingId, customerData);
    } else {
      const added = addCustomer(customerData);
      setSelectedCustomerId(added.id);
    }

    setFormOpen(false);
    reset();
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("Are you sure you want to delete this customer?")) {
      deleteCustomer(id);
      if (selectedCustomerId === id) {
        setSelectedCustomerId(null);
      }
    }
  };

  const handleCloseDetails = () => {
    setSelectedCustomerId(null);
    // Clear url query select parameter
    router.replace("/customers");
  };

  const handleOpenAddSizeSet = () => {
    setEditingSizeSetId(null);
    setSizeSetName("");
    setSizeSetChest("");
    setSizeSetWaist("");
    setSizeSetShoulder("");
    setSizeSetSleeve("");
    setSizeSetNeck("");
    setSizeSetHip("");
    setSizeSetHeight("");
    setSizeSetCustomFields([]);
    setSizeSetNotes("");
    setSizeSetModalOpen(true);
  };

  const handleOpenEditSizeSet = (ss: SizeSet) => {
    setEditingSizeSetId(ss.id);
    setSizeSetName(ss.name);
    setSizeSetChest(ss.chest ? String(ss.chest) : "");
    setSizeSetWaist(ss.waist ? String(ss.waist) : "");
    setSizeSetShoulder(ss.shoulder ? String(ss.shoulder) : "");
    setSizeSetSleeve(ss.sleeve ? String(ss.sleeve) : "");
    setSizeSetNeck(ss.neck ? String(ss.neck) : "");
    setSizeSetHip(ss.hip ? String(ss.hip) : "");
    setSizeSetHeight(ss.height ? String(ss.height) : "");
    setSizeSetNotes(ss.notes || "");
    if (ss.customFields) {
      setSizeSetCustomFields(
        Object.entries(ss.customFields).map(([key, value]) => ({
          key,
          value: String(value),
        }))
      );
    } else {
      setSizeSetCustomFields([]);
    }
    setSizeSetModalOpen(true);
  };

  const handleSaveSizeSet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !sizeSetName.trim()) return;

    const customFieldsObj: Record<string, string | number> = {};
    sizeSetCustomFields.forEach((f) => {
      if (f.key.trim() && f.value.trim()) {
        customFieldsObj[f.key.trim()] = f.value.trim();
      }
    });

    const ssData = {
      name: sizeSetName.trim(),
      chest: sizeSetChest ? Number(sizeSetChest) : undefined,
      waist: sizeSetWaist ? Number(sizeSetWaist) : undefined,
      shoulder: sizeSetShoulder ? Number(sizeSetShoulder) : undefined,
      sleeve: sizeSetSleeve ? Number(sizeSetSleeve) : undefined,
      neck: sizeSetNeck ? Number(sizeSetNeck) : undefined,
      hip: sizeSetHip ? Number(sizeSetHip) : undefined,
      height: sizeSetHeight ? Number(sizeSetHeight) : undefined,
      customFields: Object.keys(customFieldsObj).length ? customFieldsObj : undefined,
      notes: sizeSetNotes.trim() || undefined,
    };

    if (editingSizeSetId) {
      updateSizeSet(selectedCustomerId, editingSizeSetId, ssData);
    } else {
      addSizeSet(selectedCustomerId, ssData);
    }

    setSizeSetModalOpen(false);
  };

  const handleDeleteSizeSet = (ssId: string) => {
    if (!selectedCustomerId) return;
    if (confirm("Are you sure you want to delete this size set?")) {
      deleteSizeSet(selectedCustomerId, ssId);
    }
  };

  const handleAddSizeSetCustomField = () => {
    setSizeSetCustomFields([...sizeSetCustomFields, { key: "", value: "" }]);
  };

  const handleRemoveSizeSetCustomField = (index: number) => {
    setSizeSetCustomFields(sizeSetCustomFields.filter((_, i) => i !== index));
  };

  const handleSizeSetCustomFieldChange = (index: number, field: "key" | "value", val: string) => {
    const updated = [...sizeSetCustomFields];
    updated[index][field] = val;
    setSizeSetCustomFields(updated);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Customers</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage profiles, measurement records, and history.</p>
        </div>
        <Button onClick={handleOpenAddForm} className="font-semibold tracking-tight cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Control bar: Search and filter */}
      <div className="flex items-center space-x-3 bg-white dark:bg-zinc-900 p-4 rounded-md border border-zinc-200 dark:border-zinc-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search customers by name, email, phone or business..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus-visible:bg-white"
          />
        </div>
      </div>

      {/* Customer List Section */}
      {filteredCustomers.length === 0 ? (
        <EmptyState
          title="No Customers Found"
          description={searchQuery ? "Try refining your search terms." : "Add your first customer to get started."}
          actionText={!searchQuery ? "Add Customer" : undefined}
          onAction={!searchQuery ? handleOpenAddForm : undefined}
        />
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden">
          {/* Desktop Table View (Hidden on Mobile) */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-zinc-500">Name</TableHead>
                  <TableHead className="font-bold text-zinc-500">Email</TableHead>
                  <TableHead className="font-bold text-zinc-500">Phone</TableHead>
                  <TableHead className="font-bold text-zinc-500">Company</TableHead>
                  <TableHead className="font-bold text-zinc-500 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className="cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20"
                  >
                    <TableCell className="font-semibold text-zinc-950 dark:text-zinc-150">
                      {customer.name}
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>
                      {customer.company ? (
                        <span className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-850 rounded border border-zinc-200 dark:border-zinc-700/60 font-medium">
                          {customer.company}
                        </span>
                      ) : (
                        <span className="text-zinc-350 italic text-xs">&mdash;</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleOpenEditForm(customer, e)}
                          title="Edit Customer"
                        >
                          <Edit2 className="h-4 w-4 text-zinc-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDelete(customer.id, e)}
                          title="Delete Customer"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Stacked Card View (Hidden on Desktop) */}
          <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomerId(customer.id)}
                className="p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 active:bg-zinc-100/50 cursor-pointer flex justify-between items-center"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="font-semibold text-sm text-zinc-950 dark:text-zinc-100">{customer.name}</p>
                    {customer.company && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-zinc-655 rounded truncate max-w-[100px]">
                        {customer.company}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-zinc-400">
                    <span className="flex items-center"><Mail className="h-3 w-3 mr-1" /> {customer.email}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-zinc-400">
                    <span className="flex items-center"><Phone className="h-3 w-3 mr-1" /> {customer.phone}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-350 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Detail Side Sheet */}
      <Sheet open={selectedCustomerId !== null} onOpenChange={(open) => !open && handleCloseDetails()}>
        <SheetContent showCloseButton={false} className="w-full sm:max-w-xl max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:border-none bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden flex flex-col h-full">
          {selectedCustomer && (
            <>
              <SheetHeader className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex flex-row items-center justify-between space-y-0">
                <div>
                  <SheetTitle className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                    Customer Details
                  </SheetTitle>
                  <p className="text-xs text-zinc-400 mt-1">Profile overview & specs</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEditForm(selectedCustomer)}>
                    <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-750 dark:border-red-900/30 dark:hover:bg-red-950/20"
                    onClick={() => handleDelete(selectedCustomer.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCloseDetails}
                    className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </SheetHeader>

              {/* Panel content scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Contact Card */}
                <div className="space-y-4 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 p-4 rounded-md">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-lg">
                      {selectedCustomer.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">{selectedCustomer.name}</h3>
                      {selectedCustomer.company && (
                        <p className="text-xs text-zinc-400 mt-0.5 flex items-center">
                          <Building className="h-3 w-3 mr-1" /> {selectedCustomer.company}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-zinc-200/50 dark:border-zinc-800/50 pt-4">
                    <div className="flex items-center text-zinc-600 dark:text-zinc-350">
                      <Mail className="h-3.5 w-3.5 mr-2 text-zinc-400 shrink-0" />
                      <span className="truncate">{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center text-zinc-600 dark:text-zinc-350">
                      <Phone className="h-3.5 w-3.5 mr-2 text-zinc-400 shrink-0" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                    <div className="flex items-start text-zinc-600 dark:text-zinc-350 sm:col-span-2 mt-1">
                      <MapPin className="h-3.5 w-3.5 mr-2 text-zinc-400 shrink-0 mt-0.5" />
                      <span>{selectedCustomer.address}</span>
                    </div>
                  </div>
                </div>

                {/* Measurements Widget */}
                <MeasurementCard measurements={selectedCustomer.measurements} title="Primary Measurements" />

                {/* Sizing Sets section */}
                <div className="space-y-4 pt-4 border-t border-zinc-150 dark:border-zinc-800">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      <span>Named Size Sets ({selectedCustomer.sizeSets?.length || 0})</span>
                    </h4>
                    <Button type="button" variant="outline" size="sm" onClick={handleOpenAddSizeSet} className="h-7 text-[10px] font-bold uppercase tracking-wider">
                      + Add Size Set
                    </Button>
                  </div>

                  {(!selectedCustomer.sizeSets || selectedCustomer.sizeSets.length === 0) ? (
                    <p className="text-xs text-zinc-400 italic bg-zinc-50 dark:bg-zinc-900/50 p-4 border rounded border-dashed text-center">
                      No alternate size sets saved. Add specific sets for Shirts, Pants, Gowns, etc.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {selectedCustomer.sizeSets.map((ss) => (
                        <div key={ss.id} className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden bg-white dark:bg-zinc-900">
                          <div className="bg-zinc-50/50 dark:bg-zinc-950/20 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <div>
                              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-50">{ss.name}</span>
                              <span className="text-[9px] text-zinc-400 block mt-0.5">Updated: {new Date(ss.updatedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEditSizeSet(ss)}>
                                <Edit2 className="h-3.5 w-3.5 text-zinc-500" />
                              </Button>
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-655" onClick={() => handleDeleteSizeSet(ss.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="p-3 bg-zinc-50/20 dark:bg-zinc-950/10">
                            <MeasurementCard measurements={ss} title="" className="border-none shadow-none p-0 bg-transparent dark:bg-transparent" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Customer Orders History */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center">
                    <ShoppingBag className="h-3.5 w-3.5 mr-2" />
                    <span>Order History ({customerOrders.length})</span>
                  </h4>
                  {customerOrders.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic bg-zinc-50 dark:bg-zinc-900/50 p-4 border rounded border-dashed text-center">
                      No orders found for this customer.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {customerOrders.map((order) => (
                        <div
                          key={order.id}
                          className="border border-zinc-150 dark:border-zinc-800 p-3 rounded-md flex justify-between items-center hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 cursor-pointer"
                          onClick={() => {
                            // Close customers detail sheet and open orders detail page/drawer
                            handleCloseDetails();
                            router.push(`/orders?select=${order.id}`);
                          }}
                        >
                          <div>
                            <p className="text-xs font-bold text-zinc-950 dark:text-zinc-50">
                              {order.orderNumber}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">
                              {order.products.map((p) => `${p.quantity}x ${p.product}`).join(", ")}
                            </p>
                          </div>
                          <div className="text-right flex items-center space-x-3">
                            <div>
                              <p className="text-xs font-bold">
                                {settings.currencySymbol}{order.estimate.total.toLocaleString()}
                              </p>
                              <p className="text-[9px] text-zinc-400 mt-0.5">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <StatusBadge status={order.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Customer History Timeline */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center">
                    <History className="h-3.5 w-3.5 mr-2" />
                    <span>Timeline Activities</span>
                  </h4>
                  <div className="flow-root pl-2">
                    <ul className="-mb-8">
                      {/* Created Event */}
                      <li>
                        <div className="relative pb-8">
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />
                          <div className="relative flex space-x-3">
                            <span className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-850 flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-zinc-450" />
                            </span>
                            <div className="pt-1.5 flex-1">
                              <p className="text-xs text-zinc-700 dark:text-zinc-300">Profile registered in Atelier database.</p>
                              <p className="text-[9px] text-zinc-400 mt-0.5">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </li>

                      {/* Orders Events */}
                      {customerOrders.map((order, idx) => (
                        <li key={order.id}>
                          <div className="relative pb-8">
                            {idx !== customerOrders.length - 1 && (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />
                            )}
                            <div className="relative flex space-x-3">
                              <span className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-850 flex items-center justify-center">
                                <ShoppingBag className="h-4 w-4 text-zinc-450" />
                              </span>
                              <div className="pt-1.5 flex-1">
                                <p className="text-xs text-zinc-700 dark:text-zinc-300">
                                  Order <span className="font-semibold">{order.orderNumber}</span> placed for {order.estimate.total.toLocaleString()} total value. Status is &ldquo;{order.status}&rdquo;.
                                </p>
                                <p className="text-[9px] text-zinc-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add / Edit Customer Dialog Sheet */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent showCloseButton={false} className="w-full sm:max-w-xl max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:border-none bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden flex flex-col h-full">
          <SheetHeader className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex flex-row items-center justify-between space-y-0">
            <div>
              <SheetTitle className="text-xl font-bold tracking-tight">
                {editingId ? "Edit Customer Profile" : "Register New Customer"}
              </SheetTitle>
              <p className="text-xs text-zinc-400 mt-1">Fill out customer details and sizes.</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setFormOpen(false)}
              className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetHeader>

          {/* Form container scrollable */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto flex flex-col justify-between">
            <div className="p-6 space-y-6">
              {/* Step 1: Contact Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-zinc-450">Full Name *</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="e.g. Sarah Jenkins"
                      className="h-10 bg-zinc-50/50 dark:bg-zinc-950"
                    />
                    {errors.name && <p className="text-[10px] text-red-500 font-medium">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="company" className="text-xs font-bold uppercase tracking-wider text-zinc-450">Company / Studio</Label>
                    <Input
                      id="company"
                      {...register("company")}
                      placeholder="e.g. Aura Designs (Optional)"
                      className="h-10 bg-zinc-50/50 dark:bg-zinc-950"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-zinc-450">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="e.g. sarah@example.com"
                      className="h-10 bg-zinc-50/50 dark:bg-zinc-950"
                    />
                    {errors.email && <p className="text-[10px] text-red-500 font-medium">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-zinc-450">Phone Number *</Label>
                    <Input
                      id="phone"
                      {...register("phone")}
                      placeholder="e.g. +1 (555) 000-0000"
                      className="h-10 bg-zinc-50/50 dark:bg-zinc-950"
                    />
                    {errors.phone && <p className="text-[10px] text-red-500 font-medium">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-zinc-450">Billing / Shipping Address *</Label>
                    <Input
                      id="address"
                      {...register("address")}
                      placeholder="e.g. 123 Main Street, Suite A, New York, NY"
                      className="h-10 bg-zinc-50/50 dark:bg-zinc-950"
                    />
                    {errors.address && <p className="text-[10px] text-red-500 font-medium">{errors.address.message}</p>}
                  </div>
                </div>
              </div>

              {/* Step 2: Body Measurements */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  Body Sizes (inches)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="chest" className="text-xs font-bold uppercase tracking-wider text-zinc-450">Chest</Label>
                    <Input id="chest" type="text" inputMode="decimal" {...register("chest")} className="h-10 bg-zinc-50/50 dark:bg-zinc-950" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="waist" className="text-xs font-bold uppercase tracking-wider text-zinc-450">Waist</Label>
                    <Input id="waist" type="text" inputMode="decimal" {...register("waist")} className="h-10 bg-zinc-50/50 dark:bg-zinc-950" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="shoulder" className="text-xs font-bold uppercase tracking-wider text-zinc-450">Shoulder</Label>
                    <Input id="shoulder" type="text" inputMode="decimal" {...register("shoulder")} className="h-10 bg-zinc-50/50 dark:bg-zinc-950" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sleeve" className="text-xs font-bold uppercase tracking-wider text-zinc-450">Sleeve</Label>
                    <Input id="sleeve" type="text" inputMode="decimal" {...register("sleeve")} className="h-10 bg-zinc-50/50 dark:bg-zinc-950" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="neck" className="text-xs font-bold uppercase tracking-wider text-zinc-450">Neck</Label>
                    <Input id="neck" type="text" inputMode="decimal" {...register("neck")} className="h-10 bg-zinc-50/50 dark:bg-zinc-950" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="hip" className="text-xs font-bold uppercase tracking-wider text-zinc-450">Hip</Label>
                    <Input id="hip" type="text" inputMode="decimal" {...register("hip")} className="h-10 bg-zinc-50/50 dark:bg-zinc-950" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="height" className="text-xs font-bold uppercase tracking-wider text-zinc-450">Height</Label>
                    <Input id="height" type="text" inputMode="decimal" {...register("height")} className="h-10 bg-zinc-50/50 dark:bg-zinc-950" />
                  </div>
                </div>
              </div>

              {/* Step 3: Custom Fields */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Custom Fields / Fitting Notes
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddCustomField} className="h-7 text-[10px] font-bold uppercase tracking-wider">
                    + Add Field
                  </Button>
                </div>

                {customFields.length > 0 && (
                  <div className="space-y-3">
                    {customFields.map((field, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <Input
                          placeholder="Measurement Name (e.g. Inseam)"
                          value={field.key}
                          onChange={(e) => handleCustomFieldChange(idx, "key", e.target.value)}
                          className="flex-1 bg-zinc-50/50 dark:bg-zinc-950 h-9 text-xs"
                        />
                        <Input
                          placeholder="Size (e.g. 32 in or Broad)"
                          value={field.value}
                          onChange={(e) => handleCustomFieldChange(idx, "value", e.target.value)}
                          className="flex-1 bg-zinc-50/50 dark:bg-zinc-950 h-9 text-xs"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCustomField(idx)}
                          className="h-9 w-9 text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Notes Textarea */}
                <div className="space-y-1.5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-zinc-400">Extra Fitting Notes / Sizing Instructions</Label>
                  <Textarea
                    id="notes"
                    placeholder="Enter customer specific fitting guidelines (e.g. prefers high collars, sleeves require extra half inch margin)"
                    {...register("notes")}
                    className="min-h-20 text-xs bg-zinc-50/50 dark:bg-zinc-950"
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-6 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-end space-x-3 shrink-0">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="font-semibold">
                Cancel
              </Button>
              <Button type="submit" className="font-semibold cursor-pointer">
                {editingId ? "Save Changes" : "Register Customer"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
      {/* Size Set Add/Edit Dialog Modal */}
      <Dialog open={sizeSetModalOpen} onOpenChange={setSizeSetModalOpen}>
        <DialogContent className="w-full max-w-xl max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-6 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              {editingSizeSetId ? "Edit Sizing Set" : "Add Sizing Set"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveSizeSet} className="space-y-5 pt-2 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="sizeSetName" className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Size Set Name *</Label>
              <Input
                id="sizeSetName"
                placeholder="e.g. Kurtis Custom, Slim Suit"
                value={sizeSetName}
                onChange={(e) => setSizeSetName(e.target.value)}
                className="h-10 text-sm bg-zinc-50/50 dark:bg-zinc-950"
                required
              />
              <p className="text-[9px] text-zinc-400">Give a descriptive name to categorize this size set (e.g. Shirts, Pants, Gowns).</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-455 border-b pb-1">Dimensions (Inches)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Chest", value: sizeSetChest, setter: setSizeSetChest },
                  { label: "Waist", value: sizeSetWaist, setter: setSizeSetWaist },
                  { label: "Shoulder", value: sizeSetShoulder, setter: setSizeSetShoulder },
                  { label: "Sleeve", value: sizeSetSleeve, setter: setSizeSetSleeve },
                  { label: "Neck", value: sizeSetNeck, setter: setSizeSetNeck },
                  { label: "Hip", value: sizeSetHip, setter: setSizeSetHip },
                  { label: "Height", value: sizeSetHeight, setter: setSizeSetHeight },
                ].map((f) => (
                  <div key={f.label} className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-wider text-zinc-450">{f.label}</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={f.value}
                      onChange={(e) => f.setter(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Custom fields */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center border-b pb-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Custom Dimensions</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddSizeSetCustomField} className="h-6 text-[9px] font-bold uppercase tracking-wider">
                  + Add Field
                </Button>
              </div>

              {sizeSetCustomFields.length > 0 && (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {sizeSetCustomFields.map((field, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <Input
                        placeholder="Measurement Name (e.g. Inseam)"
                        value={field.key}
                        onChange={(e) => handleSizeSetCustomFieldChange(idx, "key", e.target.value)}
                        className="flex-1 h-8 text-[11px]"
                      />
                      <Input
                        placeholder="Value (e.g. 32)"
                        value={field.value}
                        onChange={(e) => handleSizeSetCustomFieldChange(idx, "value", e.target.value)}
                        className="flex-1 h-8 text-[11px]"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSizeSetCustomField(idx)}
                        className="h-8 w-8 text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sizing Notes Field */}
            <div className="space-y-1.5 pt-2">
              <Label htmlFor="sizeSetNotes" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Extra Fitting Notes / Instructions</Label>
              <Textarea
                id="sizeSetNotes"
                placeholder="Enter sizing details (e.g. requires 1.5 inch loose margin, double stitching for collars)"
                value={sizeSetNotes}
                onChange={(e) => setSizeSetNotes(e.target.value)}
                className="min-h-16 text-xs bg-zinc-50/50 dark:bg-zinc-950"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-zinc-150 dark:border-zinc-800">
              <Button type="button" variant="outline" onClick={() => setSizeSetModalOpen(false)} className="font-semibold text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" className="font-semibold text-xs h-9 cursor-pointer">
                {editingSizeSetId ? "Save Sizes" : "Add Size Set"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Customers() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="h-10 w-44 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
        <div className="h-16 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
        <div className="h-80 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
      </div>
    }>
      <CustomersContent />
    </Suspense>
  );
}
