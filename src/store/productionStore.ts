import { create } from "zustand";
import {
  Customer,
  Order,
  Payment,
  ProductionActivity,
  CompanySettings,
  OrderStatus,
  PaymentStatus,
  Measurements,
  SizeSet,
  InventoryItem,
  BundleTicket,
  ProductionLine,
  QualityDefectLog,
} from "@/types";

interface ProductionStore {
  customers: Customer[];
  orders: Order[];
  payments: Payment[];
  activities: ProductionActivity[];
  settings: CompanySettings;

  // Garment ERP & MES Shop Floor Extension
  inventory: InventoryItem[];
  bundles: BundleTicket[];
  productionLines: ProductionLine[];
  qualityLogs: QualityDefectLog[];

  // Hydration
  hydrateStore: () => void;

  // Customer actions
  addCustomer: (customer: Omit<Customer, "id" | "createdAt"> & { sizeSets?: SizeSet[] }) => Customer;
  updateCustomer: (id: string, updates: Partial<Omit<Customer, "id" | "createdAt">>) => void;
  deleteCustomer: (id: string) => void;

  // Size Set actions
  addSizeSet: (customerId: string, sizeSet: Omit<SizeSet, "id" | "updatedAt">) => void;
  updateSizeSet: (customerId: string, sizeSetId: string, updates: Partial<Omit<SizeSet, "id" | "updatedAt">>) => void;
  deleteSizeSet: (customerId: string, sizeSetId: string) => void;

  // Order actions
  addOrder: (
    orderData: Omit<Order, "id" | "orderNumber" | "createdAt" | "payments" | "paymentStatus">,
    initialPaymentAmount?: number,
    paymentMethod?: Payment["method"]
  ) => Order;
  updateOrderStatus: (id: string, status: OrderStatus, notes?: string) => void;
  addPayment: (orderId: string, amount: number, method: Payment["method"], notes?: string) => void;

  // Inventory actions
  addInventoryItem: (item: Omit<InventoryItem, "id" | "lastRestocked">) => void;
  updateInventoryStock: (id: string, newQty: number) => void;
  deleteInventoryItem: (id: string) => void;

  // Bundle Ticket actions (Shop Floor MES)
  generateBundleTicketsForOrder: (orderId: string) => BundleTicket[];
  scanBundleTicket: (bundleId: string, nextStation: OrderStatus, notes?: string) => void;

  // Line & Quality actions
  updateProductionLine: (id: string, updates: Partial<ProductionLine>) => void;
  addQualityDefectLog: (log: Omit<QualityDefectLog, "id" | "timestamp">) => void;

  // Settings actions
  updateSettings: (updates: Partial<CompanySettings>) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

// Initial Mock Inventory
const initialInventory: InventoryItem[] = [
  {
    id: "inv-1",
    sku: "FAB-COT-01",
    name: "Organic Combed Cotton (180 GSM)",
    category: "Fabric",
    color: "Sky Blue",
    unit: "Meters",
    stockQuantity: 185,
    minStockThreshold: 50,
    costPerUnit: 12.5,
    supplier: "Vardhman Textiles Ltd",
    lastRestocked: "2026-07-01T10:00:00Z",
  },
  {
    id: "inv-2",
    sku: "FAB-SILK-02",
    name: "Mulberry Silk Crepe",
    category: "Fabric",
    color: "Emerald Green",
    unit: "Meters",
    stockQuantity: 42,
    minStockThreshold: 30,
    costPerUnit: 45.0,
    supplier: "Kashmiri Weavers Co",
    lastRestocked: "2026-06-20T14:30:00Z",
  },
  {
    id: "inv-3",
    sku: "FAB-DENIM-03",
    name: "Raw Indigo Denim (14 oz)",
    category: "Fabric",
    color: "Dark Navy",
    unit: "Meters",
    stockQuantity: 210,
    minStockThreshold: 60,
    costPerUnit: 18.0,
    supplier: "Arvind Mills Ltd",
    lastRestocked: "2026-07-10T11:15:00Z",
  },
  {
    id: "inv-4",
    sku: "TRM-THREAD-01",
    name: "Coats Epic Poly-Cotton Thread (Spool)",
    category: "Trim",
    color: "White",
    unit: "Spools",
    stockQuantity: 18,
    minStockThreshold: 25,
    costPerUnit: 4.5,
    supplier: "Coats Group PLC",
    lastRestocked: "2026-05-15T09:00:00Z",
  },
  {
    id: "inv-5",
    sku: "TRM-ZIP-02",
    name: "YKK Concealed Zipper 12-inch",
    category: "Trim",
    color: "Black",
    unit: "Pieces",
    stockQuantity: 340,
    minStockThreshold: 100,
    costPerUnit: 1.2,
    supplier: "YKK Fastening Corp",
    lastRestocked: "2026-07-05T16:00:00Z",
  },
  {
    id: "inv-6",
    sku: "TRM-BTN-03",
    name: "Natural Horn Buttons 18 Ligne",
    category: "Trim",
    color: "Dark Brown",
    unit: "Pieces",
    stockQuantity: 1200,
    minStockThreshold: 300,
    costPerUnit: 0.35,
    supplier: "Bottoni Italiani SpA",
    lastRestocked: "2026-06-28T08:45:00Z",
  },
];

// Initial Production Lines
const initialLines: ProductionLine[] = [
  {
    id: "line-1",
    name: "Line 1 - Tops & Dress Shirts",
    supervisor: "Marcus Vance",
    operatorCount: 14,
    targetPcsPerHour: 35,
    status: "Active",
    activeOrderId: "ord-2",
    samMinutes: 12.5,
  },
  {
    id: "line-2",
    name: "Line 2 - Evening Gowns & Silk",
    supervisor: "Elena Rostova",
    operatorCount: 10,
    targetPcsPerHour: 12,
    status: "Active",
    activeOrderId: "ord-3",
    samMinutes: 38.0,
  },
  {
    id: "line-3",
    name: "Line 3 - Tailored Jackets & Suits",
    supervisor: "Kenji Sato",
    operatorCount: 18,
    targetPcsPerHour: 20,
    status: "Active",
    activeOrderId: "ord-5",
    samMinutes: 45.0,
  },
];

// Initial Bundles for Shop Floor Execution
const initialBundles: BundleTicket[] = [
  {
    id: "bdl-101-A",
    bundleNumber: "BDL-002-A1",
    orderId: "ord-2",
    orderNumber: "ORD-002",
    productName: "Bespoke Silk Shirt",
    color: "Sky Blue",
    size: "M",
    quantity: 15,
    lineId: "line-1",
    lineName: "Line 1 - Tops & Dress Shirts",
    currentStation: "Stitching",
    status: "In Progress",
    barcode: "890123456001",
    cutDate: "2026-06-22T08:30:00Z",
    operatorId: "op-104",
    notes: "Front placket stitching in progress",
  },
  {
    id: "bdl-101-B",
    bundleNumber: "BDL-002-A2",
    orderId: "ord-2",
    orderNumber: "ORD-002",
    productName: "Bespoke Silk Shirt",
    color: "Sky Blue",
    size: "L",
    quantity: 10,
    lineId: "line-1",
    lineName: "Line 1 - Tops & Dress Shirts",
    currentStation: "QC",
    status: "Flagged Defect",
    barcode: "890123456002",
    cutDate: "2026-06-22T09:00:00Z",
    operatorId: "op-108",
    notes: "Sleeve seam puckering detected",
  },
  {
    id: "bdl-102-A",
    bundleNumber: "BDL-003-B1",
    orderId: "ord-3",
    orderNumber: "ORD-003",
    productName: "Hand-Embroidered Anarkali",
    color: "Emerald Green",
    size: "S",
    quantity: 6,
    lineId: "line-2",
    lineName: "Line 2 - Evening Gowns & Silk",
    currentStation: "Embroidery",
    status: "In Progress",
    barcode: "890123456003",
    cutDate: "2026-07-15T11:00:00Z",
    operatorId: "op-201",
    notes: "Zardosi hand work 60% completed",
  },
];

// Initial Quality Defect Logs
const initialQualityLogs: QualityDefectLog[] = [
  {
    id: "qlog-1",
    orderId: "ord-2",
    orderNumber: "ORD-002",
    bundleId: "bdl-101-B",
    bundleNumber: "BDL-002-A2",
    station: "QC",
    defectType: "Puckering",
    severity: "Major",
    operatorName: "Vikram Sharma",
    lineName: "Line 1 - Tops & Dress Shirts",
    quantityAffected: 2,
    actionTaken: "Rework",
    timestamp: "2026-07-21T14:20:00Z",
    notes: "High thread tension causing seam puckering on armhole.",
  },
  {
    id: "qlog-2",
    orderId: "ord-3",
    orderNumber: "ORD-003",
    station: "Cutting",
    defectType: "Shade Variation",
    severity: "Minor",
    operatorName: "Arjun Dev",
    lineName: "Line 2 - Evening Gowns & Silk",
    quantityAffected: 1,
    actionTaken: "Passed with Warning",
    timestamp: "2026-07-15T10:15:00Z",
    notes: "Slight shade variance on back panel lay.",
  },
];

// Initial Mock Customers
const initialCustomers: Customer[] = [
  {
    id: "cust-1",
    name: "Sarah Jenkins",
    email: "sarah.j@example.com",
    phone: "+1 (555) 234-5678",
    company: "Aura Boutique",
    address: "742 Evergreen Terrace, Springfield, OR 97477",
    measurements: {
      chest: 34,
      waist: 26,
      shoulder: 15,
      sleeve: 22,
      neck: 13.5,
      hip: 36,
      height: 65,
      customFields: { "Bust Point": "9.5 in", "Underbust": "29 in" },
    },
    sizeSets: [
      {
        id: "ss-1-1",
        name: "Formal Evening Gown Set",
        chest: 34,
        waist: 26,
        shoulder: 15,
        sleeve: 22,
        neck: 13.5,
        hip: 36,
        height: 65,
        customFields: { "Bust Point": "9.5 in", "Underbust": "29 in" },
        updatedAt: "2026-05-10T10:30:00Z",
      },
      {
        id: "ss-1-2",
        name: "Summer Silk Blouse Set",
        chest: 33.5,
        waist: 25.5,
        shoulder: 14.5,
        sleeve: 21,
        neck: 13,
        hip: 35.5,
        height: 65,
        updatedAt: "2026-06-15T12:00:00Z",
      },
    ],
    createdAt: "2026-05-10T10:30:00Z",
  },
  {
    id: "cust-2",
    name: "David Chen",
    email: "d.chen@designcorp.com",
    phone: "+1 (555) 876-5432",
    company: "DesignCorp International",
    address: "100 Pine Street, Suite 2400, San Francisco, CA 94111",
    measurements: {
      chest: 40,
      waist: 34,
      shoulder: 18.5,
      sleeve: 25,
      neck: 16,
      hip: 41,
      height: 71,
      customFields: { "Inseam": "32 in", "Collar Style": "Spread" },
    },
    sizeSets: [
      {
        id: "ss-2-1",
        name: "Slim Fit Corporate Suit Set",
        chest: 40,
        waist: 34,
        shoulder: 18.5,
        sleeve: 25,
        neck: 16,
        hip: 41,
        height: 71,
        customFields: { "Inseam": "32 in", "Jacket Length": "30 in" },
        updatedAt: "2026-06-01T14:00:00Z",
      },
    ],
    createdAt: "2026-06-01T14:00:00Z",
  },
  {
    id: "cust-3",
    name: "Elena Rostova",
    email: "elena.r@fashionhouse.co",
    phone: "+1 (555) 432-1098",
    company: "Rostova Couture",
    address: "450 Fifth Avenue, Floor 12, New York, NY 10018",
    measurements: {
      chest: 32,
      waist: 24,
      shoulder: 14,
      sleeve: 23,
      neck: 12.5,
      hip: 34,
      height: 68,
      customFields: { "Waist to Floor": "42 in" },
    },
    sizeSets: [],
    createdAt: "2026-06-20T09:15:00Z",
  },
];

// Initial Mock Payments
const initialPayments: Payment[] = [
  {
    id: "pay-1",
    orderId: "ord-1",
    orderNumber: "ORD-001",
    customerName: "Sarah Jenkins",
    amount: 1000,
    method: "Card",
    date: "2026-06-01T10:30:00Z",
    notes: "50% Advance Payment",
  },
  {
    id: "pay-2",
    orderId: "ord-1",
    orderNumber: "ORD-001",
    customerName: "Sarah Jenkins",
    amount: 1242,
    method: "Bank Transfer",
    date: "2026-06-10T15:00:00Z",
    notes: "Final Settlement upon delivery",
  },
  {
    id: "pay-3",
    orderId: "ord-2",
    orderNumber: "ORD-002",
    customerName: "David Chen",
    amount: 1500,
    method: "UPI",
    date: "2026-06-20T11:45:00Z",
    notes: "Deposit received",
  },
  {
    id: "pay-4",
    orderId: "ord-4",
    orderNumber: "ORD-004",
    customerName: "Sarah Jenkins",
    amount: 450,
    method: "Card",
    date: "2026-07-05T14:10:00Z",
    notes: "Full payment for alter job",
  },
];

const getPaymentStatus = (total: number, paid: number): PaymentStatus => {
  if (paid <= 0) return "Unpaid";
  if (paid >= total - 0.01) return "Paid";
  return "Partially Paid";
};

// Initial Mock Orders
const initialOrders: Order[] = [
  {
    id: "ord-1",
    orderNumber: "ORD-001",
    customerId: "cust-1",
    customerName: "Sarah Jenkins",
    status: "Completed",
    lineId: "line-2",
    materials: [
      { id: "m-1", material: "Silk Crepe", color: "Rose Pink", unit: "meters", quantity: 4.5, estimateCategory: "Gown/Dress" },
      { id: "m-2", material: "Silk Lining", color: "Nude", unit: "meters", quantity: 3.0 },
    ],
    products: [
      {
        id: "p-1",
        product: "Haute Couture Evening Gown",
        quantity: 1,
        stitchType: "Custom Bespoke",
        price: 1800,
        notes: "Hand-beaded bodices",
        colorSizeMatrix: [{ color: "Rose Pink", size: "M", quantity: 1, unitPrice: 1800 }],
        techPack: { seamType: "ISO 401 Chainstitch", stitchesPerInch: 14, seamAllowance: "1/2 inch" },
      },
    ],
    measurements: {
      chest: 34,
      waist: 26,
      shoulder: 15,
      sleeve: 22,
      neck: 13.5,
      hip: 36,
      height: 65,
    },
    estimate: {
      stitching: 1200,
      embroidery: 450,
      printing: 0,
      transport: 40,
      packing: 30,
      discount: 0,
      gst: 309.6,
      total: 2029.6,
    },
    payments: [],
    paymentStatus: "Paid",
    deliveryDate: "2026-06-10",
    notes: "Urgent red carpet fitting required.",
    createdAt: "2026-06-01T10:00:00Z",
    bom: {
      id: "bom-1",
      orderId: "ord-1",
      fabricRequiredMeters: 4.5,
      trimRequiredCount: 1,
      wastageAllowancePct: 8,
      fabricStockDeducted: true,
    },
  },
  {
    id: "ord-2",
    orderNumber: "ORD-002",
    customerId: "cust-2",
    customerName: "David Chen",
    status: "Stitching",
    lineId: "line-1",
    materials: [
      { id: "m-3", material: "Italian Cotton 180 GSM", color: "Sky Blue", unit: "meters", quantity: 18.0, estimateCategory: "Kurta/Shirt" },
      { id: "m-4", material: "Mother of Pearl Buttons", color: "White", unit: "pieces", quantity: 24 },
    ],
    products: [
      {
        id: "p-2",
        product: "Bespoke Executive Silk Shirt",
        quantity: 25,
        stitchType: "Semi-Bespoke",
        price: 180,
        notes: "Contrast white collar option",
        colorSizeMatrix: [
          { color: "Sky Blue", size: "S", quantity: 5, unitPrice: 180 },
          { color: "Sky Blue", size: "M", quantity: 15, unitPrice: 180 },
          { color: "Sky Blue", size: "L", quantity: 5, unitPrice: 180 },
        ],
        techPack: { seamType: "French Seam", stitchesPerInch: 16, seamAllowance: "1/4 inch" },
      },
    ],
    measurements: {
      chest: 40,
      waist: 34,
      shoulder: 18.5,
      sleeve: 25,
      neck: 16,
      hip: 41,
      height: 71,
    },
    estimate: {
      stitching: 3200,
      embroidery: 0,
      printing: 0,
      transport: 75,
      packing: 50,
      discount: 200,
      gst: 562.5,
      total: 3687.5,
    },
    payments: [],
    paymentStatus: "Partially Paid",
    deliveryDate: "2026-07-28",
    notes: "Deliver to DesignCorp corporate HQ.",
    createdAt: "2026-06-20T11:00:00Z",
    bom: {
      id: "bom-2",
      orderId: "ord-2",
      fabricRequiredMeters: 18.0,
      trimRequiredCount: 24,
      wastageAllowancePct: 6,
      fabricStockDeducted: true,
    },
  },
  {
    id: "ord-3",
    orderNumber: "ORD-003",
    customerId: "cust-3",
    customerName: "Elena Rostova",
    status: "Embroidery",
    lineId: "line-2",
    materials: [
      { id: "m-5", material: "Mulberry Silk Crepe", color: "Emerald Green", unit: "meters", quantity: 12.0, estimateCategory: "Gown/Dress" },
    ],
    products: [
      {
        id: "p-3",
        product: "Hand-Embroidered Anarkali",
        quantity: 6,
        stitchType: "Custom Bespoke",
        price: 650,
        notes: "Heavy hand embroidery on neckline",
        colorSizeMatrix: [
          { color: "Emerald Green", size: "S", quantity: 2, unitPrice: 650 },
          { color: "Emerald Green", size: "M", quantity: 4, unitPrice: 650 },
        ],
      },
    ],
    measurements: {
      chest: 32,
      waist: 24,
      shoulder: 14,
      sleeve: 23,
      neck: 12.5,
      hip: 34,
      height: 68,
    },
    estimate: {
      stitching: 2200,
      embroidery: 1200,
      printing: 0,
      transport: 60,
      packing: 40,
      discount: 0,
      gst: 630,
      total: 4130,
    },
    payments: [],
    paymentStatus: "Unpaid",
    deliveryDate: "2026-08-02",
    notes: "Requires hand embroidery artist inspection.",
    createdAt: "2026-07-02T14:30:00Z",
  },
  {
    id: "ord-4",
    orderNumber: "ORD-004",
    customerId: "cust-1",
    customerName: "Sarah Jenkins",
    status: "Cutting",
    materials: [
      { id: "m-6", material: "Raw Indigo Denim 14oz", color: "Dark Navy", unit: "meters", quantity: 15.0 },
    ],
    products: [
      {
        id: "p-4",
        product: "Custom Tailored Jacket",
        quantity: 5,
        stitchType: "Custom Bespoke",
        price: 320,
        colorSizeMatrix: [
          { color: "Dark Navy", size: "S", quantity: 2, unitPrice: 320 },
          { color: "Dark Navy", size: "M", quantity: 3, unitPrice: 320 },
        ],
      },
    ],
    measurements: {
      chest: 34,
      waist: 26,
      shoulder: 15,
      sleeve: 22,
      neck: 13.5,
      hip: 36,
      height: 65,
    },
    estimate: {
      stitching: 1100,
      embroidery: 0,
      printing: 0,
      transport: 25,
      packing: 25,
      discount: 0,
      gst: 207,
      total: 1357,
    },
    payments: [],
    paymentStatus: "Unpaid",
    deliveryDate: "2026-08-10",
    notes: "Vintage copper button fittings requested.",
    createdAt: "2026-07-15T09:00:00Z",
  },
];

// Associate payments to their respective orders
initialOrders.forEach((order) => {
  order.payments = initialPayments.filter((p) => p.orderId === order.id);
  const totalPaid = order.payments.reduce((acc, curr) => acc + curr.amount, 0);
  order.paymentStatus = getPaymentStatus(order.estimate.total, totalPaid);
});

// Initial Activities
const initialActivities: ProductionActivity[] = [
  {
    id: "act-1",
    orderId: "ord-1",
    orderNumber: "ORD-001",
    status: "Material Received",
    updatedBy: "Jane Smith",
    timestamp: "2026-06-01T10:15:00Z",
    notes: "Silk Crepe inspect passed.",
  },
  {
    id: "act-2",
    orderId: "ord-2",
    orderNumber: "ORD-002",
    status: "Stitching",
    updatedBy: "Robert Miller",
    timestamp: "2026-06-25T10:00:00Z",
  },
];

// Initial Settings
const defaultSettings: CompanySettings = {
  companyName: "Radhe Vastraz",
  email: "radhevastraz@gmail.com",
  phone: "+91 9063643342",
  address: "Shop No 1, Jal Vayu Vihar, Kukatpally, backside of community office building, Hyderabad, Telangana, India (500085)",
  contactPerson: "Divya",
  supportEmail: "raadhelabel@gmail.com",
  logoUrl: "",
  invoicePrefix: "RADHE",
  gstRate: 18,
  currencySymbol: "₹",
  theme: "light",
};

export const useProductionStore = create<ProductionStore>()((set, get) => ({
  customers: initialCustomers,
  orders: initialOrders,
  payments: initialPayments,
  activities: initialActivities,
  settings: defaultSettings,

  inventory: initialInventory,
  bundles: initialBundles,
  productionLines: initialLines,
  qualityLogs: initialQualityLogs,

  hydrateStore: () => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("garment-production-store-v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const parsedSettings = parsed.settings && parsed.settings.companyName !== "Atelier Haute Couture"
          ? { ...defaultSettings, ...parsed.settings }
          : defaultSettings;

        set({
          customers: parsed.customers || initialCustomers,
          orders: parsed.orders || initialOrders,
          payments: parsed.payments || initialPayments,
          activities: parsed.activities || initialActivities,
          settings: parsedSettings,
          inventory: parsed.inventory || initialInventory,
          bundles: parsed.bundles || initialBundles,
          productionLines: parsed.productionLines || initialLines,
          qualityLogs: parsed.qualityLogs || initialQualityLogs,
        });
      } catch (e) {
        console.error("Failed to parse localStorage data", e);
      }
    }
  },

  // Customer Actions
  addCustomer: (customerData) => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString(),
      sizeSets: customerData.sizeSets || [],
    };
    set((state) => ({ customers: [newCustomer, ...state.customers] }));
    return newCustomer;
  },

  updateCustomer: (id, updates) => {
    set((state) => ({
      customers: state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      orders: state.orders.map((o) => (o.customerId === id && updates.name ? { ...o, customerName: updates.name } : o)),
    }));
  },

  deleteCustomer: (id) => {
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id),
    }));
  },

  // Size Set Actions
  addSizeSet: (customerId, sizeSetData) => {
    const newSizeSet: SizeSet = {
      ...sizeSetData,
      id: `ss-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      customers: state.customers.map((c) => {
        if (c.id === customerId) {
          const currentSets = c.sizeSets || [];
          return { ...c, sizeSets: [...currentSets, newSizeSet] };
        }
        return c;
      }),
    }));
  },

  updateSizeSet: (customerId, sizeSetId, updates) => {
    set((state) => ({
      customers: state.customers.map((c) => {
        if (c.id === customerId && c.sizeSets) {
          const updatedSets = c.sizeSets.map((ss) =>
            ss.id === sizeSetId ? { ...ss, ...updates, updatedAt: new Date().toISOString() } : ss
          );
          return { ...c, sizeSets: updatedSets };
        }
        return c;
      }),
    }));
  },

  deleteSizeSet: (customerId, sizeSetId) => {
    set((state) => ({
      customers: state.customers.map((c) => {
        if (c.id === customerId && c.sizeSets) {
          return { ...c, sizeSets: c.sizeSets.filter((ss) => ss.id !== sizeSetId) };
        }
        return c;
      }),
    }));
  },

  // Order Actions
  addOrder: (orderData, initialPaymentAmount, paymentMethod = "Cash") => {
    const state = get();
    const orderId = `ord-${Date.now()}`;
    const orderCount = state.orders.length + 1;
    const orderNumber = `ORD-${String(orderCount).padStart(3, "0")}`;

    const createdPayments: Payment[] = [];
    const initialPaid = Number(initialPaymentAmount) || 0;

    if (initialPaid > 0) {
      createdPayments.push({
        id: `pay-${Date.now()}`,
        orderId,
        orderNumber,
        customerName: orderData.customerName,
        amount: initialPaid,
        method: paymentMethod,
        date: new Date().toISOString(),
        notes: "Initial deposit upon order placement",
      });
    }

    // Deduct stock automatically if fabric materials specified
    const updatedInventory = [...state.inventory];
    orderData.materials.forEach((mat) => {
      const match = updatedInventory.find(
        (inv) => inv.name.toLowerCase().includes(mat.material.toLowerCase()) || inv.category === "Fabric"
      );
      if (match) {
        match.stockQuantity = Math.max(0, match.stockQuantity - mat.quantity);
      }
    });

    const newOrder: Order = {
      ...orderData,
      id: orderId,
      orderNumber,
      payments: createdPayments,
      paymentStatus: getPaymentStatus(orderData.estimate.total, initialPaid),
      createdAt: new Date().toISOString(),
    };

    set((s) => ({
      orders: [newOrder, ...s.orders],
      inventory: updatedInventory,
      payments: createdPayments.length ? [...createdPayments, ...s.payments] : s.payments,
      activities: [
        {
          id: `act-${Date.now()}`,
          orderId,
          orderNumber,
          status: "Material Received",
          updatedBy: "System",
          timestamp: new Date().toISOString(),
          notes: "Order created successfully. Raw material reserved.",
        },
        ...s.activities,
      ],
    }));

    return newOrder;
  },

  updateOrderStatus: (id, status, notes) => {
    set((state) => {
      const targetOrder = state.orders.find((o) => o.id === id);
      if (!targetOrder) return {};

      const updatedOrders = state.orders.map((o) => {
        if (o.id === id) {
          return { ...o, status };
        }
        return o;
      });

      const newActivity: ProductionActivity = {
        id: `act-${Date.now()}`,
        orderId: id,
        orderNumber: targetOrder.orderNumber,
        status,
        updatedBy: "Factory Production Supervisor",
        timestamp: new Date().toISOString(),
        notes: notes || `Order stage updated to ${status}.`,
      };

      // Also update any bundle tickets associated with this order
      const updatedBundles = state.bundles.map((b) => {
        if (b.orderId === id && b.status !== "Completed") {
          return { ...b, currentStation: status };
        }
        return b;
      });

      return {
        orders: updatedOrders,
        bundles: updatedBundles,
        activities: [newActivity, ...state.activities],
      };
    });
  },

  addPayment: (orderId, amount, method, notes) => {
    set((state) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return {};

      const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        orderId,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        amount,
        method,
        date: new Date().toISOString(),
        notes,
      };

      const updatedPayments = [newPayment, ...state.payments];
      const newOrderPayments = [...order.payments, newPayment];
      const totalPaid = newOrderPayments.reduce((sum, p) => sum + p.amount, 0);
      const paymentStatus = getPaymentStatus(order.estimate.total, totalPaid);

      const updatedOrders = state.orders.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            payments: newOrderPayments,
            paymentStatus,
          };
        }
        return o;
      });

      return {
        payments: updatedPayments,
        orders: updatedOrders,
      };
    });
  },

  // Inventory Management Actions
  addInventoryItem: (itemData) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `inv-${Date.now()}`,
      lastRestocked: new Date().toISOString(),
    };
    set((state) => ({ inventory: [newItem, ...state.inventory] }));
  },

  updateInventoryStock: (id, newQty) => {
    set((state) => ({
      inventory: state.inventory.map((inv) =>
        inv.id === id ? { ...inv, stockQuantity: newQty, lastRestocked: new Date().toISOString() } : inv
      ),
    }));
  },

  deleteInventoryItem: (id) => {
    set((state) => ({
      inventory: state.inventory.filter((inv) => inv.id !== id),
    }));
  },

  // Shop Floor MES Bundle Actions
  generateBundleTicketsForOrder: (orderId) => {
    const state = get();
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return [];

    const newBundles: BundleTicket[] = [];
    let bundleCounter = 1;

    order.products.forEach((prod) => {
      if (prod.colorSizeMatrix && prod.colorSizeMatrix.length > 0) {
        prod.colorSizeMatrix.forEach((entry) => {
          if (entry.quantity > 0) {
            // Split into bundle sizes of ~10-15 pcs
            const bundleSize = 10;
            let remaining = entry.quantity;
            let subIdx = 1;

            while (remaining > 0) {
              const qtyThisBundle = Math.min(remaining, bundleSize);
              const bdlNumber = `BDL-${order.orderNumber.replace("ORD-", "")}-${entry.size}${subIdx}`;
              
              newBundles.push({
                id: `bdl-${Date.now()}-${bundleCounter}`,
                bundleNumber: bdlNumber,
                orderId: order.id,
                orderNumber: order.orderNumber,
                productName: prod.product,
                color: entry.color,
                size: entry.size,
                quantity: qtyThisBundle,
                lineId: order.lineId || "line-1",
                lineName: state.productionLines.find((l) => l.id === (order.lineId || "line-1"))?.name || "Line 1",
                currentStation: "Cutting",
                status: "In Progress",
                barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
                cutDate: new Date().toISOString(),
                notes: `Cut bundle lot ${subIdx} of ${entry.color} (${entry.size})`,
              });

              remaining -= qtyThisBundle;
              subIdx++;
              bundleCounter++;
            }
          }
        });
      } else {
        // Fallback for orders without matrix breakdown
        newBundles.push({
          id: `bdl-${Date.now()}-${bundleCounter}`,
          bundleNumber: `BDL-${order.orderNumber.replace("ORD-", "")}-M1`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          productName: prod.product,
          color: "Standard",
          size: "Custom Fit",
          quantity: prod.quantity,
          lineId: order.lineId || "line-1",
          lineName: "Line 1 - Tops & Shirts",
          currentStation: "Cutting",
          status: "In Progress",
          barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
          cutDate: new Date().toISOString(),
        });
      }
    });

    set((s) => ({ bundles: [...newBundles, ...s.bundles] }));
    return newBundles;
  },

  scanBundleTicket: (bundleId, nextStation, notes) => {
    set((state) => {
      const updatedBundles = state.bundles.map((b) => {
        if (b.id === bundleId) {
          const isCompleted = nextStation === "Ready" || nextStation === "Delivered" || nextStation === "Completed";
          return {
            ...b,
            currentStation: nextStation,
            status: isCompleted ? ("Completed" as const) : ("In Progress" as const),
            notes: notes || `Scanned at station ${nextStation}`,
          };
        }
        return b;
      });

      return { bundles: updatedBundles };
    });
  },

  // Quality Control Defect Logging
  addQualityDefectLog: (logData) => {
    const newLog: QualityDefectLog = {
      ...logData,
      id: `qlog-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    set((state) => {
      // Flag bundle status if serious defect
      const updatedBundles = state.bundles.map((b) => {
        if (b.id === logData.bundleId) {
          return { ...b, status: "Flagged Defect" as const };
        }
        return b;
      });

      return {
        qualityLogs: [newLog, ...state.qualityLogs],
        bundles: updatedBundles,
      };
    });
  },

  updateProductionLine: (id, updates) => {
    set((state) => ({
      productionLines: state.productionLines.map((line) => (line.id === id ? { ...line, ...updates } : line)),
    }));
  },

  // Settings Actions
  updateSettings: (updates) => {
    set((state) => ({
      settings: { ...state.settings, ...updates },
    }));
  },

  setTheme: (theme) => {
    set((state) => ({
      settings: { ...state.settings, theme },
    }));
  },
}));

if (typeof window !== "undefined") {
  useProductionStore.subscribe((state) => {
    localStorage.setItem(
      "garment-production-store-v2",
      JSON.stringify({
        customers: state.customers,
        orders: state.orders,
        payments: state.payments,
        activities: state.activities,
        settings: state.settings,
        inventory: state.inventory,
        bundles: state.bundles,
        productionLines: state.productionLines,
        qualityLogs: state.qualityLogs,
      })
    );
  });
}
