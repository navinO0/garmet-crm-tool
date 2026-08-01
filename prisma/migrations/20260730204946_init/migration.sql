-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "businessName" TEXT,
    "mobileNumber" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BulkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "totalAmount" REAL NOT NULL DEFAULT 0.0,
    "advancePayment" REAL NOT NULL DEFAULT 0.0,
    "remainingAmount" REAL NOT NULL DEFAULT 0.0,
    "shippingCharges" REAL NOT NULL DEFAULT 0.0,
    "packingCharges" REAL NOT NULL DEFAULT 0.0,
    "estimatedDelivery" TEXT,
    "deliverySchedule" TEXT,
    "fabricProcurement" TEXT,
    "packingBrandingNotes" TEXT,
    "clientInitials" TEXT,
    "labelInitials" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BulkOrder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BulkOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "category" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitRate" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "fabricDetails" TEXT,
    "sizeBreakdown" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BulkOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "BulkOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "clientSignatoryName" TEXT NOT NULL,
    "clientDesignation" TEXT,
    "clientSignature" TEXT,
    "clientSignedDate" TEXT,
    "companySignatoryName" TEXT NOT NULL DEFAULT 'RAADHE LABEL by RADHE VASTRAZ',
    "companyDesignation" TEXT DEFAULT 'Authorized Signatory',
    "companySignature" TEXT,
    "companySignedDate" TEXT,
    "witnessName" TEXT,
    "witnessMobile" TEXT,
    "witnessSignature" TEXT,
    "witnessDate" TEXT,
    "ipClauseAccepted" BOOLEAN NOT NULL DEFAULT true,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT true,
    "agreementPdfBucketUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Agreement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "BulkOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "subtotal" REAL NOT NULL,
    "shippingCharges" REAL NOT NULL DEFAULT 0,
    "packingCharges" REAL NOT NULL DEFAULT 0,
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

-- CreateTable
CREATE TABLE "BoutiqueOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "garmentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "totalAmount" REAL NOT NULL,
    "advancePaid" REAL NOT NULL,
    "detailsJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "BulkOrder_orderNumber_key" ON "BulkOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_orderId_key" ON "Agreement"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_orderId_key" ON "Invoice"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "BoutiqueOrder_orderNumber_key" ON "BoutiqueOrder"("orderNumber");
