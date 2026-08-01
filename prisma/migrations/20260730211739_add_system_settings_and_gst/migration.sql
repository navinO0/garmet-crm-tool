-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "gstEnabled" BOOLEAN NOT NULL DEFAULT false,
    "gstPercentage" REAL NOT NULL DEFAULT 5.0,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BulkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Estimate Generated',
    "totalAmount" REAL NOT NULL DEFAULT 0.0,
    "subtotalAmount" REAL NOT NULL DEFAULT 0.0,
    "advancePayment" REAL NOT NULL DEFAULT 0.0,
    "remainingAmount" REAL NOT NULL DEFAULT 0.0,
    "shippingCharges" REAL NOT NULL DEFAULT 0.0,
    "packingCharges" REAL NOT NULL DEFAULT 0.0,
    "materialCharges" REAL NOT NULL DEFAULT 0.0,
    "materialProvidedBy" TEXT NOT NULL DEFAULT 'Client',
    "gstEnabled" BOOLEAN NOT NULL DEFAULT false,
    "gstPercentage" REAL NOT NULL DEFAULT 0.0,
    "gstAmount" REAL NOT NULL DEFAULT 0.0,
    "estimatedDelivery" TEXT,
    "extendedDeliveryDate" TEXT,
    "extensionReason" TEXT,
    "deliverySchedule" TEXT,
    "fabricProcurement" TEXT,
    "packingBrandingNotes" TEXT,
    "materialReceivedDetails" TEXT,
    "leftoverMaterialNotes" TEXT,
    "referenceImages" TEXT,
    "materialImages" TEXT,
    "outputImages" TEXT,
    "clientInitials" TEXT,
    "labelInitials" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BulkOrder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BulkOrder" ("advancePayment", "clientId", "clientInitials", "createdAt", "deliverySchedule", "estimatedDelivery", "extendedDeliveryDate", "extensionReason", "fabricProcurement", "id", "labelInitials", "leftoverMaterialNotes", "materialImages", "materialReceivedDetails", "orderNumber", "outputImages", "packingBrandingNotes", "packingCharges", "referenceImages", "remainingAmount", "shippingCharges", "status", "totalAmount", "updatedAt") SELECT "advancePayment", "clientId", "clientInitials", "createdAt", "deliverySchedule", "estimatedDelivery", "extendedDeliveryDate", "extensionReason", "fabricProcurement", "id", "labelInitials", "leftoverMaterialNotes", "materialImages", "materialReceivedDetails", "orderNumber", "outputImages", "packingBrandingNotes", "packingCharges", "referenceImages", "remainingAmount", "shippingCharges", "status", "totalAmount", "updatedAt" FROM "BulkOrder";
DROP TABLE "BulkOrder";
ALTER TABLE "new_BulkOrder" RENAME TO "BulkOrder";
CREATE UNIQUE INDEX "BulkOrder_orderNumber_key" ON "BulkOrder"("orderNumber");
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "subtotal" REAL NOT NULL,
    "shippingCharges" REAL NOT NULL DEFAULT 0,
    "packingCharges" REAL NOT NULL DEFAULT 0,
    "materialCharges" REAL NOT NULL DEFAULT 0,
    "gstAmount" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL,
    "advancePaid" REAL NOT NULL,
    "balanceDue" REAL NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'Partial',
    "invoicePdfBucketUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "BulkOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("advancePaid", "balanceDue", "createdAt", "dueDate", "gstAmount", "id", "invoiceDate", "invoiceNumber", "invoicePdfBucketUrl", "orderId", "packingCharges", "paymentStatus", "shippingCharges", "subtotal", "totalAmount", "updatedAt") SELECT "advancePaid", "balanceDue", "createdAt", "dueDate", "gstAmount", "id", "invoiceDate", "invoiceNumber", "invoicePdfBucketUrl", "orderId", "packingCharges", "paymentStatus", "shippingCharges", "subtotal", "totalAmount", "updatedAt" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE UNIQUE INDEX "Invoice_orderId_key" ON "Invoice"("orderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
