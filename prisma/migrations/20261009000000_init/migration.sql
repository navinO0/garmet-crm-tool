-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessName" TEXT,
    "mobileNumber" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Estimate Generated',
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "subtotalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "advancePayment" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "remainingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "shippingCharges" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "packingCharges" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "materialCharges" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "materialProvidedBy" TEXT NOT NULL DEFAULT 'Client',
    "gstEnabled" BOOLEAN NOT NULL DEFAULT false,
    "gstPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deleteReason" TEXT,

    CONSTRAINT "BulkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "category" TEXT,
    "outfitStyleId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitRate" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "fabricDetails" TEXT,
    "sizeBreakdown" TEXT,
    "priceBreakupJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BulkOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "clientSignatoryName" TEXT NOT NULL,
    "clientDesignation" TEXT,
    "clientSignature" TEXT,
    "clientSignedDate" TEXT,
    "companySignatoryName" TEXT NOT NULL DEFAULT 'RAADHE LABEL part of RADHE VASTRAZ',
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "subtotal" DOUBLE PRECISION NOT NULL,
    "shippingCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "packingCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "materialCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "advancePaid" DOUBLE PRECISION NOT NULL,
    "balanceDue" DOUBLE PRECISION NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'Partial',
    "invoicePdfBucketUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoutiqueOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "garmentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "advancePaid" DOUBLE PRECISION NOT NULL,
    "detailsJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoutiqueOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutfitStyle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Ethnic Wear',
    "baseStitchingCost" DOUBLE PRECISION NOT NULL DEFAULT 500,
    "boutiqueBaseStitchingCost" DOUBLE PRECISION NOT NULL DEFAULT 500,
    "bulkBaseStitchingCost" DOUBLE PRECISION NOT NULL DEFAULT 500,
    "materialRequiredSpecs" TEXT,
    "materialsJson" TEXT,
    "description" TEXT,
    "referenceImages" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutfitStyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomSize" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "measurementsJson" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomSize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomMeasurement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "unit" TEXT NOT NULL DEFAULT 'inches',

    CONSTRAINT "CustomMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "gstEnabled" BOOLEAN NOT NULL DEFAULT false,
    "gstPercentage" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "sizeChartEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_mobileNumber_key" ON "Client"("mobileNumber");

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

-- CreateIndex
CREATE UNIQUE INDEX "OutfitStyle_name_key" ON "OutfitStyle"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CustomSize_code_key" ON "CustomSize"("code");

-- AddForeignKey
ALTER TABLE "BulkOrder" ADD CONSTRAINT "BulkOrder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkOrderItem" ADD CONSTRAINT "BulkOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "BulkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "BulkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "BulkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

