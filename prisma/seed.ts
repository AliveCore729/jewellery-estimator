import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...\n");

  // ============================================
  // 1. Create Admin User
  // ============================================
  const passwordHash = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@kanakajewellers.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@kanakajewellers.com",
      phone: "+919876543210",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // ============================================
  // 2. Create Materials
  // ============================================
  const materialsData = [
    { name: "Gold 24K", category: "GOLD" as const, purity: "24K", defaultUnit: "GRAM" as const, hsnCode: "7113" },
    { name: "Gold 22K", category: "GOLD" as const, purity: "22K", defaultUnit: "GRAM" as const, hsnCode: "7113" },
    { name: "Gold 18K", category: "GOLD" as const, purity: "18K", defaultUnit: "GRAM" as const, hsnCode: "7113" },
    { name: "Gold 14K", category: "GOLD" as const, purity: "14K", defaultUnit: "GRAM" as const, hsnCode: "7113" },
    { name: "Silver 925", category: "SILVER" as const, purity: "925", defaultUnit: "GRAM" as const, hsnCode: "7113" },
    { name: "Silver 999", category: "SILVER" as const, purity: "999", defaultUnit: "GRAM" as const, hsnCode: "7113" },
    { name: "Platinum 950", category: "PLATINUM" as const, purity: "950", defaultUnit: "GRAM" as const, hsnCode: "7113" },
    { name: "Diamond", category: "DIAMOND" as const, purity: null, defaultUnit: "CARAT" as const, hsnCode: "7102" },
    { name: "Ruby", category: "GEMSTONE" as const, purity: null, defaultUnit: "CARAT" as const, hsnCode: "7103" },
    { name: "Emerald", category: "GEMSTONE" as const, purity: null, defaultUnit: "CARAT" as const, hsnCode: "7103" },
    { name: "Sapphire", category: "GEMSTONE" as const, purity: null, defaultUnit: "CARAT" as const, hsnCode: "7103" },
    { name: "Pearl", category: "GEMSTONE" as const, purity: null, defaultUnit: "PIECE" as const, hsnCode: "7101" },
  ];

  const materials: Record<string, { id: string }> = {};
  for (const mat of materialsData) {
    const material = await prisma.material.create({ data: mat });
    materials[mat.name] = material;
    console.log(`  💎 Material: ${mat.name}`);
  }
  console.log("✅ Materials created\n");

  // ============================================
  // 3. Create Default Rates (sample prices in ₹)
  // ============================================
  const ratesData: { materialName: string; rate: number; unit: "GRAM" | "TOLA" | "CARAT" | "PIECE" }[] = [
    { materialName: "Gold 24K", rate: 7200, unit: "GRAM" },
    { materialName: "Gold 22K", rate: 6600, unit: "GRAM" },
    { materialName: "Gold 18K", rate: 5400, unit: "GRAM" },
    { materialName: "Gold 14K", rate: 4200, unit: "GRAM" },
    { materialName: "Silver 925", rate: 85, unit: "GRAM" },
    { materialName: "Silver 999", rate: 92, unit: "GRAM" },
    { materialName: "Platinum 950", rate: 3100, unit: "GRAM" },
    { materialName: "Diamond", rate: 45000, unit: "CARAT" },
    { materialName: "Ruby", rate: 15000, unit: "CARAT" },
    { materialName: "Emerald", rate: 12000, unit: "CARAT" },
    { materialName: "Sapphire", rate: 18000, unit: "CARAT" },
    { materialName: "Pearl", rate: 2500, unit: "PIECE" },
  ];

  for (const rate of ratesData) {
    await prisma.materialRate.create({
      data: {
        materialId: materials[rate.materialName].id,
        ratePerUnit: rate.rate,
        unit: rate.unit,
        source: "MANUAL",
        effectiveDate: new Date(),
      },
    });
  }
  console.log("✅ Material rates created\n");

  // ============================================
  // 4. Create Categories
  // ============================================
  const categoriesData = [
    { name: "Ring", defaultWastagePct: 5.0, defaultMakingType: "PER_GRAM" as const, defaultMakingValue: 800, sortOrder: 1 },
    { name: "Necklace", defaultWastagePct: 8.0, defaultMakingType: "PER_GRAM" as const, defaultMakingValue: 1200, sortOrder: 2 },
    { name: "Bangle", defaultWastagePct: 6.0, defaultMakingType: "PER_GRAM" as const, defaultMakingValue: 900, sortOrder: 3 },
    { name: "Chain", defaultWastagePct: 10.0, defaultMakingType: "PER_GRAM" as const, defaultMakingValue: 700, sortOrder: 4 },
    { name: "Earring", defaultWastagePct: 5.0, defaultMakingType: "PER_GRAM" as const, defaultMakingValue: 1000, sortOrder: 5 },
    { name: "Pendant", defaultWastagePct: 5.0, defaultMakingType: "FIXED" as const, defaultMakingValue: 3000, sortOrder: 6 },
    { name: "Bracelet", defaultWastagePct: 7.0, defaultMakingType: "PER_GRAM" as const, defaultMakingValue: 850, sortOrder: 7 },
    { name: "Mangalsutra", defaultWastagePct: 6.0, defaultMakingType: "PER_GRAM" as const, defaultMakingValue: 1100, sortOrder: 8 },
    { name: "Custom Design", defaultWastagePct: 8.0, defaultMakingType: "PER_GRAM" as const, defaultMakingValue: 1500, sortOrder: 9 },
  ];

  for (const cat of categoriesData) {
    await prisma.category.create({ data: cat });
    console.log(`  📂 Category: ${cat.name}`);
  }
  console.log("✅ Categories created\n");

  // ============================================
  // 5. Create Shop Settings
  // ============================================
  await prisma.shopSettings.create({
    data: {
      shopName: "Kanaka Jewellers",
      address: "123 Gold Market, Main Road",
      phone: "+919876543210",
      email: "info@kanakajewellers.com",
      gstin: "",
      defaultTaxPct: 3.0,
      cgstPct: 1.5,
      sgstPct: 1.5,
      estimatePrefix: "EST",
      estimateValidityDays: 3,
      defaultWeightUnit: "GRAM",
    },
  });
  console.log("✅ Shop settings created\n");

  // ============================================
  // 6. Create Sample Customer
  // ============================================
  await prisma.customer.create({
    data: {
      name: "Rahul Sharma",
      phone: "+919812345678",
      email: "rahul.sharma@email.com",
      address: "456 Park Street, Mumbai",
      notes: "Regular customer, prefers 22K gold",
    },
  });
  console.log("✅ Sample customer created\n");

  console.log("🎉 Seed completed successfully!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔑 Login credentials:");
  console.log("   Email:    admin@kanakajewellers.com");
  console.log("   Password: admin123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });