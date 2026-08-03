const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const styles = [
  { name: "Normal Blouse", category: "Blouse / Tops", baseStitchingCost: 600 },
  { name: "Normal Blouse (With Lining)", category: "Blouse / Tops", baseStitchingCost: 650 },
  { name: "Normal Blouse (Piping)", category: "Blouse / Tops", baseStitchingCost: 700 },
  { name: "Princess Cut Blouse", category: "Blouse / Tops", baseStitchingCost: 700 },
  { name: "Princess Cut Blouse (With Lining)", category: "Blouse / Tops", baseStitchingCost: 750 },
  { name: "Princess Cut Blouse (Piping)", category: "Blouse / Tops", baseStitchingCost: 800 },
  { name: "Designer Blouse", category: "Blouse / Tops", baseStitchingCost: 950 },
  { name: "Normal Lehenga Set", category: "Ethnic Wear", baseStitchingCost: 2000 },
  { name: "Pleats or Frills Lehenga Set", category: "Ethnic Wear", baseStitchingCost: 2500 },
  { name: "Kali Lehenga Set", category: "Bridal / Heavy", baseStitchingCost: 3500 },
  { name: "Basic Frock / Gown", category: "Ethnic Wear", baseStitchingCost: 1800 },
  { name: "Kurti Set", category: "Ethnic Wear", baseStitchingCost: 850 },
  { name: "Kurti Set (With Lining)", category: "Ethnic Wear", baseStitchingCost: 950 },
  { name: "Kurti Set (Collar Neck)", category: "Ethnic Wear", baseStitchingCost: 1050 },
  { name: "Cord Set", category: "Western Wear", baseStitchingCost: 1800 },
  { name: "Crop Top", category: "Blouse / Tops", baseStitchingCost: 800 },
  { name: "Only Lehenga", category: "Ethnic Wear", baseStitchingCost: 1200 },
  { name: "Only Kurti Top", category: "Ethnic Wear", baseStitchingCost: 650 },
  { name: "Only Kurti Top (With Lining)", category: "Ethnic Wear", baseStitchingCost: 750 },
  { name: "Kali Frock", category: "Ethnic Wear", baseStitchingCost: 2500 }
];

const sizes = [
  // Standard Letter Sizes (XS - 3XL) for Kurtis, Dresses, and Gowns
  {
    name: "Extra Small (Size 32)",
    code: "XS",
    measurementsJson: JSON.stringify({
      Bust: "32 in",
      Waist: "26 in",
      Hip: "35 in",
      Shoulder: "13 in",
      Armhole: "14 in",
      Sleeve: "16 in",
      Neck: "7.5 in"
    })
  },
  {
    name: "Small (Size 34)",
    code: "S",
    measurementsJson: JSON.stringify({
      Bust: "34 in",
      Waist: "28 in",
      Hip: "37 in",
      Shoulder: "13.5 in",
      Armhole: "15 in",
      Sleeve: "16 in",
      Neck: "7.5 in"
    })
  },
  {
    name: "Medium (Size 36)",
    code: "M",
    measurementsJson: JSON.stringify({
      Bust: "36 in",
      Waist: "30 in",
      Hip: "39 in",
      Shoulder: "14 in",
      Armhole: "16 in",
      Sleeve: "17 in",
      Neck: "8 in"
    })
  },
  {
    name: "Large (Size 38)",
    code: "L",
    measurementsJson: JSON.stringify({
      Bust: "38 in",
      Waist: "32 in",
      Hip: "41 in",
      Shoulder: "14.5 in",
      Armhole: "17 in",
      Sleeve: "17 in",
      Neck: "8 in"
    })
  },
  {
    name: "Extra Large (Size 40)",
    code: "XL",
    measurementsJson: JSON.stringify({
      Bust: "40 in",
      Waist: "34 in",
      Hip: "43 in",
      Shoulder: "15 in",
      Armhole: "18 in",
      Sleeve: "18 in",
      Neck: "8.5 in"
    })
  },
  {
    name: "Double Extra Large (Size 42)",
    code: "XXL",
    measurementsJson: JSON.stringify({
      Bust: "42 in",
      Waist: "36 in",
      Hip: "45 in",
      Shoulder: "15.5 in",
      Armhole: "19 in",
      Sleeve: "18 in",
      Neck: "8.5 in"
    })
  },
  {
    name: "Triple Extra Large (Size 44)",
    code: "3XL",
    measurementsJson: JSON.stringify({
      Bust: "44 in",
      Waist: "38 in",
      Hip: "47 in",
      Shoulder: "16 in",
      Armhole: "20 in",
      Sleeve: "18 in",
      Neck: "9 in"
    })
  },

  // Saree Blouse Numbered Sizes (32 - 48)
  {
    name: "Blouse Size 32 (XS)",
    code: "Blouse 32",
    measurementsJson: JSON.stringify({
      Bust: "32 in",
      "Under Bust": "28 in",
      Waist: "26 in",
      Shoulder: "13 in",
      Armhole: "14 in",
      "Sleeve Round": "10 in",
      Sleeve: "10 in",
      "Blouse Length": "13 in"
    })
  },
  {
    name: "Blouse Size 34 (S)",
    code: "Blouse 34",
    measurementsJson: JSON.stringify({
      Bust: "34 in",
      "Under Bust": "30 in",
      Waist: "28 in",
      Shoulder: "13.5 in",
      Armhole: "15 in",
      "Sleeve Round": "11 in",
      Sleeve: "10 in",
      "Blouse Length": "13.5 in"
    })
  },
  {
    name: "Blouse Size 36 (M)",
    code: "Blouse 36",
    measurementsJson: JSON.stringify({
      Bust: "36 in",
      "Under Bust": "32 in",
      Waist: "30 in",
      Shoulder: "14 in",
      Armhole: "16 in",
      "Sleeve Round": "12 in",
      Sleeve: "10.5 in",
      "Blouse Length": "14 in"
    })
  },
  {
    name: "Blouse Size 38 (L)",
    code: "Blouse 38",
    measurementsJson: JSON.stringify({
      Bust: "38 in",
      "Under Bust": "34 in",
      Waist: "32 in",
      Shoulder: "14.5 in",
      Armhole: "17 in",
      "Sleeve Round": "13 in",
      Sleeve: "11 in",
      "Blouse Length": "14.5 in"
    })
  },
  {
    name: "Blouse Size 40 (XL)",
    code: "Blouse 40",
    measurementsJson: JSON.stringify({
      Bust: "40 in",
      "Under Bust": "36 in",
      Waist: "34 in",
      Shoulder: "15 in",
      Armhole: "18 in",
      "Sleeve Round": "14 in",
      Sleeve: "11 in",
      "Blouse Length": "15 in"
    })
  },
  {
    name: "Blouse Size 42 (XXL)",
    code: "Blouse 42",
    measurementsJson: JSON.stringify({
      Bust: "42 in",
      "Under Bust": "38 in",
      Waist: "36 in",
      Shoulder: "15.5 in",
      Armhole: "19 in",
      "Sleeve Round": "15 in",
      Sleeve: "11.5 in",
      "Blouse Length": "15.5 in"
    })
  },
  {
    name: "Blouse Size 44 (3XL)",
    code: "Blouse 44",
    measurementsJson: JSON.stringify({
      Bust: "44 in",
      "Under Bust": "40 in",
      Waist: "38 in",
      Shoulder: "16 in",
      Armhole: "20 in",
      "Sleeve Round": "16 in",
      Sleeve: "12 in",
      "Blouse Length": "16 in"
    })
  },
  {
    name: "Blouse Size 46 (4XL)",
    code: "Blouse 46",
    measurementsJson: JSON.stringify({
      Bust: "46 in",
      "Under Bust": "42 in",
      Waist: "40 in",
      Shoulder: "16.5 in",
      Armhole: "21 in",
      "Sleeve Round": "17 in",
      Sleeve: "12 in",
      "Blouse Length": "16.5 in"
    })
  },
  {
    name: "Blouse Size 48 (5XL)",
    code: "Blouse 48",
    measurementsJson: JSON.stringify({
      Bust: "48 in",
      "Under Bust": "44 in",
      Waist: "42 in",
      Shoulder: "17 in",
      Armhole: "22 in",
      "Sleeve Round": "18 in",
      Sleeve: "12.5 in",
      "Blouse Length": "17 in"
    })
  }
];

async function main() {
  console.log("Seeding boutique outfit style templates...");
  for (const style of styles) {
    await prisma.outfitStyle.upsert({
      where: { name: style.name },
      update: {
        category: style.category,
        baseStitchingCost: style.baseStitchingCost
      },
      create: style
    });
  }

  console.log("Seeding standard size guides chart presets...");
  for (const sz of sizes) {
    await prisma.customSize.upsert({
      where: { code: sz.code },
      update: {
        name: sz.name,
        measurementsJson: sz.measurementsJson
      },
      create: sz
    });
  }

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
