import { z } from "zod";

// Helper for optional or empty string numbers
const optionalNumber = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
  z.number({ message: "Must be a valid number" }).min(0, "Must be greater than or equal to 0").optional()
);

const requiredNumber = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? NaN : Number(val)),
  z.number({ message: "Must be a valid number" }).min(0, "Must be greater than or equal to 0")
);

// 1. Client Schema
export const clientSchema = z.object({
  name: z.string().trim().min(2, "Client name must be at least 2 characters"),
  businessName: z.string().trim().optional(),
  mobileNumber: z.string().trim().min(7, "Mobile number must be at least 7 digits").regex(/^[+0-9\s\-()]+$/, "Invalid phone number format"),
  email: z.string().trim().email("Invalid email address").or(z.literal("")).optional(),
  address: z.string().trim().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;

// 2. Bulk Order Item Schema
export const bulkOrderItemSchema = z.object({
  styleNumber: z.string().trim().min(1, "Style number is required"),
  garmentType: z.string().trim().min(1, "Garment type is required"),
  quantity: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? NaN : Number(val)),
    z.number().int("Quantity must be an integer").min(1, "Quantity must be at least 1")
  ),
  unitPrice: requiredNumber,
  targetDeliveryDate: z.string().optional(),
  sizeXS: optionalNumber,
  sizeS: optionalNumber,
  sizeM: optionalNumber,
  sizeL: optionalNumber,
  sizeXL: optionalNumber,
  sizeXXL: optionalNumber,
  notes: z.string().optional(),
});

export type BulkOrderItemInput = z.infer<typeof bulkOrderItemSchema>;

// 3. Bulk Order Schema
export const bulkOrderSchema = z.object({
  clientId: z.string().optional(),
  clientName: z.string().trim().min(2, "Client name is required"),
  businessName: z.string().optional(),
  mobileNumber: z.string().trim().min(7, "Mobile number is required"),
  email: z.string().trim().email("Invalid email").or(z.literal("")).optional(),
  address: z.string().optional(),
  items: z.array(bulkOrderItemSchema).min(1, "At least one order item is required"),
  materialProvidedBy: z.enum(["Client", "Factory", "Company", "Partial"]).default("Client"),
  materialCharges: optionalNumber,
  shippingCharges: optionalNumber,
  packingCharges: optionalNumber,
  gstEnabled: z.boolean().optional(),
  gstPercentage: optionalNumber,
  advanceType: z.enum(["percentage", "custom"]).optional(),
  advancePercentage: optionalNumber,
  advanceCustomAmount: optionalNumber,
  discountType: z.enum(["percentage", "fixed"]).optional(),
  discountPercentage: optionalNumber,
  discountAmount: optionalNumber,
  estimatedDelivery: z.string().min(1, "Estimated delivery date is required"),
  deliverySchedule: z.string().optional(),
  fabricProcurement: z.string().optional(),
  packingBrandingNotes: z.string().optional(),
  materialReceivedDetails: z.string().optional(),
  clientSignatoryName: z.string().optional(),
  clientDesignation: z.string().optional(),
  witnessName: z.string().optional(),
  witnessMobile: z.string().optional(),
});

export type BulkOrderInput = z.infer<typeof bulkOrderSchema>;

// 4. Customer Schema
export const customerSchema = z.object({
  name: z.string().trim().min(2, "Customer name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address").or(z.literal("")).optional(),
  phone: z.string().trim().min(7, "Phone number must be at least 7 digits"),
  company: z.string().optional(),
  address: z.string().trim().min(3, "Address must be at least 3 characters"),
  chest: optionalNumber,
  underBust: optionalNumber,
  waist: optionalNumber,
  hip: optionalNumber,
  shoulder: optionalNumber,
  armhole: optionalNumber,
  sleeve: optionalNumber,
  sleeveRound: optionalNumber,
  neck: optionalNumber,
  height: optionalNumber,
  garmentLength: optionalNumber,
  notes: z.string().optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;

// 5. Inventory Item Schema
export const inventoryItemSchema = z.object({
  sku: z.string().trim().min(2, "SKU/Item Code is required"),
  name: z.string().trim().min(2, "Item name is required"),
  category: z.enum(["Fabric", "Trim", "Packaging", "Consumable"]),
  unit: z.enum(["Meters", "Yards", "Spools", "Pieces", "Kg", "Boxes"]),
  stockQuantity: requiredNumber,
  minStockThreshold: requiredNumber,
  costPerUnit: requiredNumber,
  supplier: z.string().trim().min(2, "Supplier name is required"),
  color: z.string().optional(),
});

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;

// 6. Payment Schema
export const paymentSchema = z.object({
  orderId: z.string().trim().min(1, "Order selection is required"),
  customerName: z.string().optional(),
  amount: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? NaN : Number(val)),
    z.number({ message: "Amount is required" }).min(1, "Amount must be greater than 0")
  ),
  method: z.enum(["Cash", "Card", "Bank Transfer", "UPI"]),
  date: z.string().min(1, "Payment date is required"),
  notes: z.string().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

// 7. Company Settings Schema
export const settingsSchema = z.object({
  companyName: z.string().trim().min(2, "Company name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  phone: z.string().trim().min(7, "Phone number must be at least 7 digits"),
  address: z.string().trim().min(3, "Address is required"),
  contactPerson: z.string().optional(),
  supportEmail: z.string().trim().email("Invalid email").or(z.literal("")).optional(),
  invoicePrefix: z.string().trim().min(1, "Invoice prefix is required"),
  gstRate: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
    z.number().min(0, "GST rate cannot be negative").max(100, "GST rate cannot exceed 100%")
  ),
  currencySymbol: z.string().trim().min(1, "Currency symbol is required"),
  theme: z.enum(["light", "dark", "system"]).default("light"),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

// 8. Boutique Custom Order Schema
export const boutiqueOrderSchema = z.object({
  customerId: z.string().trim().min(1, "Customer selection is required"),
  customerName: z.string().optional(),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  products: z.array(z.object({
    product: z.string().min(1, "Product name required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    stitchType: z.string().min(1, "Stitching type required"),
    price: z.number().min(0, "Price must be >= 0"),
    notes: z.string().optional(),
  })).min(1, "At least one product item is required"),
  estimate: z.object({
    stitching: optionalNumber,
    embroidery: optionalNumber,
    printing: optionalNumber,
    transport: optionalNumber,
    packing: optionalNumber,
    discount: optionalNumber,
    gst: optionalNumber,
    total: optionalNumber,
  }),
  notes: z.string().optional(),
});

export type BoutiqueOrderInput = z.infer<typeof boutiqueOrderSchema>;

// Helper function for safe validation parsing
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[]>;
  return { success: false, errors: fieldErrors };
}
