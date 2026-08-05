import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database cleanup...');
  
  // 1. Delete Invoices
  const invoices = await prisma.invoice.deleteMany({});
  console.log(`Deleted ${invoices.count} invoice records.`);

  // 2. Delete Agreements
  const agreements = await prisma.agreement.deleteMany({});
  console.log(`Deleted ${agreements.count} agreement records.`);

  // 3. Delete Bulk Order Items
  const items = await prisma.bulkOrderItem.deleteMany({});
  console.log(`Deleted ${items.count} bulk order item records.`);

  // 4. Delete Bulk Orders
  const bulkOrders = await prisma.bulkOrder.deleteMany({});
  console.log(`Deleted ${bulkOrders.count} bulk order records.`);

  // 5. Delete Clients
  const clients = await prisma.client.deleteMany({});
  console.log(`Deleted ${clients.count} client records.`);

  // 6. Delete Boutique Orders
  const boutiqueOrders = await prisma.boutiqueOrder.deleteMany({});
  console.log(`Deleted ${boutiqueOrders.count} boutique order records.`);

  console.log('Database cleanup completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
