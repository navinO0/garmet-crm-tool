export interface Measurements {
  measurementMode?: "custom" | "standard";
  garmentType?: string; // e.g. "Blouse" | "Kurti" | "Kurta Set" | "Coord Set" | "Dress/Gown" | "Bottom Wear" | "Lehenga"
  standardSize?: string; // e.g. "38" or "XL"
  topSize?: string; // for Coord Set
  bottomSize?: string; // for Coord Set

  // Standard / Custom body measurement values (inches)
  chest?: number; // Bust / Chest
  underBust?: number;
  waist?: number;
  hip?: number;
  shoulder?: number;
  armhole?: number;
  sleeve?: number; // Sleeve Length
  sleeveRound?: number;
  neck?: number;
  height?: number;

  // Garment specific lengths & bottoms
  garmentLength?: number; // Blouse Length / Kurti Length / Pant Length / Lehenga Length
  thigh?: number;
  knee?: number;
  bottomOpening?: number;
  inseam?: number;
  flair?: string;
  canCan?: string;

  customGarmentName?: string;
  customFields?: Record<string, string | number>;
  notes?: string; // extra fitting notes
}

export interface SizeSet {
  id: string;
  name: string; // e.g. "Shirt Size Set", "Formal Suit", "Winter Kurti"
  measurementMode?: "custom" | "standard";
  garmentType?: string;
  standardSize?: string;
  topSize?: string;
  bottomSize?: string;

  chest?: number;
  underBust?: number;
  waist?: number;
  hip?: number;
  shoulder?: number;
  armhole?: number;
  sleeve?: number;
  sleeveRound?: number;
  neck?: number;
  height?: number;

  garmentLength?: number;
  thigh?: number;
  knee?: number;
  bottomOpening?: number;
  inseam?: number;
  flair?: string;
  canCan?: string;

  customFields?: Record<string, string | number>;
  notes?: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address: string;
  measurements: Measurements; // fallback or default set
  sizeSets?: SizeSet[]; // list of alternate size sets
  createdAt: string;
}

export interface MaterialItem {
  id: string;
  material: string;
  color: string;
  unit: string;
  quantity: number;
  price?: number;
  notes?: string;
  estimateCategory?: string; // e.g. "Kurta/Shirt" | "Pants" | "Blouse" | "Gown/Dress" | "Custom"
  customCategory?: string; // e.g. "Sharara", "Sherwani", "Kaftan"
}

export interface ColorSizeMatrixEntry {
  color: string;
  size: "XS" | "S" | "M" | "L" | "XL" | "XXL" | "Custom";
  quantity: number;
  unitPrice?: number;
}

export interface TechPackSpec {
  seamType?: string; // e.g. "ISO 401 Chainstitch" | "Lockstitch"
  threadSpec?: string; // e.g. "Coats Epic T-60 Cotton"
  stitchesPerInch?: number; // e.g. 12 SPI
  seamAllowance?: string; // e.g. "1/2 inch"
  notes?: string;
}

export interface ProductItem {
  id: string;
  product: string;
  quantity: number;
  stitchType: string;
  price: number;
  notes?: string;
  colorSizeMatrix?: ColorSizeMatrixEntry[];
  techPack?: TechPackSpec;
}

export interface OrderEstimate {
  stitching: number;
  embroidery: number;
  printing: number;
  transport: number;
  packing: number;
  discount: number;
  gst: number;
  total: number;
}

export type OrderStatus =
  | "Material Received"
  | "Cutting"
  | "Stitching"
  | "Embroidery"
  | "QC"
  | "Ready"
  | "Delivered"
  | "Completed";

export type PaymentStatus = "Unpaid" | "Partially Paid" | "Paid";

export interface BundleTicket {
  id: string;
  bundleNumber: string;
  orderId: string;
  orderNumber: string;
  productName: string;
  color: string;
  size: string;
  quantity: number;
  lineId?: string;
  lineName?: string;
  currentStation: OrderStatus;
  status: "In Progress" | "Passed QC" | "Flagged Defect" | "Completed";
  barcode: string;
  cutDate: string;
  operatorId?: string;
  notes?: string;
}

export interface ProductionLine {
  id: string;
  name: string;
  supervisor: string;
  operatorCount: number;
  targetPcsPerHour: number;
  activeOrderId?: string;
  status: "Active" | "Idle" | "Maintenance";
  samMinutes?: number; // Standard Allowed Minutes per unit
}

export type DefectSeverity = "Minor" | "Major" | "Critical";

export interface QualityDefectLog {
  id: string;
  orderId: string;
  orderNumber: string;
  bundleId?: string;
  bundleNumber?: string;
  station: OrderStatus;
  defectType:
    | "Skipped Stitch"
    | "Puckering"
    | "Fabric Stain"
    | "Needle Hole"
    | "Uncut Thread"
    | "Sizing Out of Spec"
    | "Shade Variation"
    | "Other";
  severity: DefectSeverity;
  operatorName?: string;
  lineName?: string;
  quantityAffected: number;
  actionTaken: "Rework" | "Scrap" | "Passed with Warning";
  timestamp: string;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: "Fabric" | "Trim" | "Packaging" | "Consumable";
  color?: string;
  unit: "Meters" | "Yards" | "Spools" | "Pieces" | "Kg" | "Boxes";
  stockQuantity: number;
  minStockThreshold: number;
  costPerUnit: number;
  supplier: string;
  lastRestocked: string;
}

export interface BillOfMaterials {
  id: string;
  orderId: string;
  fabricRequiredMeters: number;
  trimRequiredCount: number;
  wastageAllowancePct: number;
  fabricStockDeducted: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  lineId?: string;
  materials: MaterialItem[];
  products: ProductItem[];
  measurements: Measurements;
  sizeSetName?: string; // name of the selected size set if any
  estimate: OrderEstimate;
  payments: Payment[];
  paymentStatus: PaymentStatus;
  deliveryDate: string;
  notes?: string;
  createdAt: string;
  bom?: BillOfMaterials;
}

export interface Payment {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  method: "Cash" | "Card" | "Bank Transfer" | "UPI";
  date: string;
  notes?: string;
}

export interface ProductionActivity {
  id: string;
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  updatedBy: string;
  timestamp: string;
  notes?: string;
}

export interface CompanySettings {
  companyName: string;
  email: string;
  phone: string;
  address: string;
  contactPerson?: string;
  supportEmail?: string;
  logoUrl?: string;
  companySignature?: string;
  companySignatoryName?: string;
  companyDesignation?: string;
  invoicePrefix: string;
  gstRate: number; // percentage, e.g. 18
  currencySymbol: string;
  theme: "light" | "dark" | "system";
}
