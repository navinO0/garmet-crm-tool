const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const styles = await prisma.outfitStyle.findMany();
  console.log("Database Outfit Styles count:", styles.length);
  console.log(styles.map(s => s.name));
}
main().finally(() => prisma.$disconnect());
