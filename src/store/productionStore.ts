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
  softDeleteOrder: (id: string, reason?: string) => void;
  restoreOrder: (id: string) => void;

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

const initialInventory: InventoryItem[] = [];
const initialLines: ProductionLine[] = [];
const initialBundles: BundleTicket[] = [];
const initialQualityLogs: QualityDefectLog[] = [];
const initialCustomers: Customer[] = [];
const initialPayments: Payment[] = [];
const initialOrders: Order[] = [];
const initialActivities: ProductionActivity[] = [];

const getPaymentStatus = (total: number, paid: number): PaymentStatus => {
  if (paid <= 0) return "Unpaid";
  if (paid >= total - 0.01) return "Paid";
  return "Partially Paid";
};

// Initial Settings
const defaultSettings: CompanySettings = {
  companyName: "Radhe Vastraz",
  email: "radhevastraz@gmail.com",
  phone: "+91 9063643342",
  address: "Shop No 1, Jal Vayu Vihar, Kukatpally, backside of community office building, Hyderabad, Telangana, India (500085)",
  contactPerson: "Divya",
  supportEmail: "radhelabel@gmail.com",
  logoUrl: "",
  companySignature: "",
  companySignatoryName: "RAADHE LABEL part of RADHE VASTRAZ",
  companyDesignation: "Authorized Signatory & Managing Director",
  invoicePrefix: "RADHE",
  gstRate: 18,
  currencySymbol: "₹",
  theme: "light",
};

export const useProductionStore = create<ProductionStore>()((set, get) => ({
  customers: [],
  orders: [],
  payments: [],
  activities: [],
  settings: defaultSettings,

  inventory: [],
  bundles: [],
  productionLines: [],
  qualityLogs: [],

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
          customers: parsed.customers || [],
          orders: parsed.orders || [],
          payments: parsed.payments || [],
          activities: parsed.activities || [],
          settings: parsedSettings,
          inventory: parsed.inventory || [],
          bundles: parsed.bundles || [],
          productionLines: parsed.productionLines || [],
          qualityLogs: parsed.qualityLogs || [],
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

  softDeleteOrder: (id, reason) => {
    set((state) => {
      const targetOrder = state.orders.find((o) => o.id === id);
      if (!targetOrder) return {};

      const now = new Date().toISOString();
      const updatedOrders = state.orders.map((o) => {
        if (o.id === id) {
          return {
            ...o,
            isDeleted: true,
            deletedAt: now,
            deletedReason: reason || "Soft-deleted by user",
          };
        }
        return o;
      });

      const newActivity: ProductionActivity = {
        id: `act-${Date.now()}`,
        orderId: id,
        orderNumber: targetOrder.orderNumber,
        status: targetOrder.status,
        updatedBy: "Supervisor / Admin",
        timestamp: now,
        notes: `Order moved to Trash/History (Soft Delete).${reason ? ` Reason: ${reason}` : ""}`,
      };

      return {
        orders: updatedOrders,
        activities: [newActivity, ...state.activities],
      };
    });
  },

  restoreOrder: (id) => {
    set((state) => {
      const targetOrder = state.orders.find((o) => o.id === id);
      if (!targetOrder) return {};

      const now = new Date().toISOString();
      const updatedOrders = state.orders.map((o) => {
        if (o.id === id) {
          return {
            ...o,
            isDeleted: false,
            deletedAt: undefined,
            deletedReason: undefined,
          };
        }
        return o;
      });

      const newActivity: ProductionActivity = {
        id: `act-${Date.now()}`,
        orderId: id,
        orderNumber: targetOrder.orderNumber,
        status: targetOrder.status,
        updatedBy: "Supervisor / Admin",
        timestamp: now,
        notes: "Order restored from Trash/History back to active status.",
      };

      return {
        orders: updatedOrders,
        activities: [newActivity, ...state.activities],
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
