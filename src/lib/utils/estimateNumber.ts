import prisma from "@/lib/db";

/**
 * Generate next estimate number: EST-2026-0001
 */
export async function generateEstimateNumber(): Promise<string> {
  // Get shop settings for prefix
  const settings = await prisma.shopSettings.findFirst();
  const prefix = settings?.estimatePrefix || "EST";

  const year = new Date().getFullYear();
  const yearPrefix = `${prefix}-${year}-`;

  // Find the last estimate number for this year
  const lastEstimate = await prisma.estimate.findFirst({
    where: {
      estimateNumber: {
        startsWith: yearPrefix,
      },
    },
    orderBy: {
      estimateNumber: "desc",
    },
    select: {
      estimateNumber: true,
    },
  });

  let nextNumber = 1;

  if (lastEstimate) {
    const lastNum = lastEstimate.estimateNumber.split("-").pop();
    if (lastNum) {
      nextNumber = parseInt(lastNum, 10) + 1;
    }
  }

  return `${yearPrefix}${nextNumber.toString().padStart(4, "0")}`;
}