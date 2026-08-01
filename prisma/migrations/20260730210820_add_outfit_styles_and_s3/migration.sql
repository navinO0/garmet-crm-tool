-- AlterTable
ALTER TABLE "BulkOrderItem" ADD COLUMN "outfitStyleId" TEXT;
ALTER TABLE "BulkOrderItem" ADD COLUMN "priceBreakupJson" TEXT;

-- CreateTable
CREATE TABLE "OutfitStyle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Ethnic Wear',
    "baseStitchingCost" REAL NOT NULL DEFAULT 500,
    "materialRequiredSpecs" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CustomSize" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CustomMeasurement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "unit" TEXT NOT NULL DEFAULT 'inches'
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
    "advancePayment" REAL NOT NULL DEFAULT 0.0,
    "remainingAmount" REAL NOT NULL DEFAULT 0.0,
    "shippingCharges" REAL NOT NULL DEFAULT 0.0,
    "packingCharges" REAL NOT NULL DEFAULT 0.0,
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
INSERT INTO "new_BulkOrder" ("advancePayment", "clientId", "clientInitials", "createdAt", "deliverySchedule", "estimatedDelivery", "fabricProcurement", "id", "labelInitials", "orderNumber", "packingBrandingNotes", "packingCharges", "remainingAmount", "shippingCharges", "status", "totalAmount", "updatedAt") SELECT "advancePayment", "clientId", "clientInitials", "createdAt", "deliverySchedule", "estimatedDelivery", "fabricProcurement", "id", "labelInitials", "orderNumber", "packingBrandingNotes", "packingCharges", "remainingAmount", "shippingCharges", "status", "totalAmount", "updatedAt" FROM "BulkOrder";
DROP TABLE "BulkOrder";
ALTER TABLE "new_BulkOrder" RENAME TO "BulkOrder";
CREATE UNIQUE INDEX "BulkOrder_orderNumber_key" ON "BulkOrder"("orderNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "OutfitStyle_name_key" ON "OutfitStyle"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CustomSize_code_key" ON "CustomSize"("code");
