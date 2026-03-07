import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import PublicEstimateView from "@/components/estimates/PublicEstimateView";

interface Props {
  params: { token: string };
}

export default async function SharedEstimatePage({ params }: Props) {
  const share = await prisma.estimateShare.findUnique({
    where: { shareToken: params.token },
    include: {
      estimate: {
        include: {
          customer: true,
          category: true,
          variants: {
            orderBy: { sortOrder: "asc" },
            include: {
              materials: { include: { material: true } },
              charges: true,
              taxes: true,
              oldGoldEntries: true,
            },
          },
        },
      },
    },
  });

  if (!share || !share.estimate) {
    notFound();
  }

  // Update viewedAt
  await prisma.estimateShare.update({
    where: { id: share.id },
    data: { viewedAt: new Date() },
  });

  const shop = await prisma.shopSettings.findFirst();

  // Convert decimals
  const estimate = {
    ...share.estimate,
    variants: share.estimate.variants.map((v: any) => ({
      ...v,
      totalMaterialCost: Number(v.totalMaterialCost),
      totalMakingCharges: Number(v.totalMakingCharges),
      totalAdditionalCharges: Number(v.totalAdditionalCharges),
      subtotal: Number(v.subtotal),
      cgstAmount: Number(v.cgstAmount),
      sgstAmount: Number(v.sgstAmount),
      taxAmount: Number(v.taxAmount),
      oldGoldDeduction: Number(v.oldGoldDeduction),
      grandTotal: Number(v.grandTotal),
      materials: v.materials.map((m: any) => ({
        ...m,
        weight: Number(m.weight),
        ratePerUnit: Number(m.ratePerUnit),
        wastagePct: Number(m.wastagePct),
        wastageWeight: Number(m.wastageWeight),
        totalWeight: Number(m.totalWeight),
        lineTotal: Number(m.lineTotal),
      })),
      charges: v.charges.map((c: any) => ({
        ...c,
        chargeValue: Number(c.chargeValue),
        calculatedAmount: Number(c.calculatedAmount),
      })),
      taxes: v.taxes.map((t: any) => ({
        ...t,
        taxPct: Number(t.taxPct),
        taxAmount: Number(t.taxAmount),
      })),
      oldGoldEntries: v.oldGoldEntries.map((o: any) => ({
        ...o,
        grossWeight: Number(o.grossWeight),
        netWeight: Number(o.netWeight),
        ratePerUnit: Number(o.ratePerUnit),
        deductionAmount: Number(o.deductionAmount),
      })),
    })),
  };

  return (
    <PublicEstimateView
      estimate={estimate}
      shopName={shop?.shopName || "Kanaka Jewellers"}
      shopAddress={shop?.address || ""}
      shopPhone={shop?.phone || ""}
      shopEmail={shop?.email || ""}
      shopGstin={shop?.gstin || ""}
    />
  );
}