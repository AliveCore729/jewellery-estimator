import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

// POST /api/estimates/duplicate — Clone an estimate
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { estimateId } = await request.json();

    if (!estimateId) {
      return NextResponse.json(
        { success: false, error: "estimateId is required" },
        { status: 400 }
      );
    }

    // Get original estimate with all relations
    const original = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        variants: {
          include: {
            materials: true,
            charges: true,
            taxes: true,
            oldGoldEntries: true,
          },
        },
      },
    });

    if (!original) {
      return NextResponse.json(
        { success: false, error: "Estimate not found" },
        { status: 404 }
      );
    }

    // Generate new estimate number
    const settings = await prisma.shopSettings.findFirst();
    const prefix = settings?.estimatePrefix || "EST";
    const year = new Date().getFullYear();
    const pattern = `${prefix}-${year}-`;

    const lastEstimate = await prisma.estimate.findFirst({
      where: { estimateNumber: { startsWith: pattern } },
      orderBy: { estimateNumber: "desc" },
      select: { estimateNumber: true },
    });

    let nextNum = 1;
    if (lastEstimate) {
      const lastNum = parseInt(lastEstimate.estimateNumber.split("-").pop() || "0");
      nextNum = lastNum + 1;
    }

    const newEstimateNumber = `${pattern}${String(nextNum).padStart(4, "0")}`;

    // Calculate validity
    const validityDays = settings?.estimateValidityDays || 3;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);

    // Clone in transaction
    const newEstimate = await prisma.$transaction(async (tx) => {
      const est = await tx.estimate.create({
        data: {
          estimateNumber: newEstimateNumber,
          customerId: original.customerId,
          categoryId: original.categoryId,
          productName: `${original.productName} (Copy)`,
          productDescription: original.productDescription,
          status: "DRAFT",
          rateLockDate: new Date(),
          validUntil,
          version: 1,
          notes: original.notes,
          createdById: payload.userId,
        },
      });

      for (const variant of original.variants) {
        const newVariant = await tx.estimateVariant.create({
          data: {
            estimateId: est.id,
            variantLabel: variant.variantLabel,
            sortOrder: variant.sortOrder,
            isRecommended: variant.isRecommended,
            totalMaterialCost: variant.totalMaterialCost,
            totalMakingCharges: variant.totalMakingCharges,
            totalAdditionalCharges: variant.totalAdditionalCharges,
            subtotal: variant.subtotal,
            cgstAmount: variant.cgstAmount,
            sgstAmount: variant.sgstAmount,
            taxAmount: variant.taxAmount,
            oldGoldDeduction: variant.oldGoldDeduction,
            grandTotal: variant.grandTotal,
          },
        });

        for (const mat of variant.materials) {
          await tx.variantMaterial.create({
            data: {
              variantId: newVariant.id,
              materialId: mat.materialId,
              weight: mat.weight,
              unit: mat.unit,
              ratePerUnit: mat.ratePerUnit,
              wastagePct: mat.wastagePct,
              wastageWeight: mat.wastageWeight,
              totalWeight: mat.totalWeight,
              lineTotal: mat.lineTotal,
              huid: mat.huid,
            },
          });
        }

        for (const charge of variant.charges) {
          await tx.variantCharge.create({
            data: {
              variantId: newVariant.id,
              chargeName: charge.chargeName,
              chargeType: charge.chargeType,
              chargeValue: charge.chargeValue,
              calculatedAmount: charge.calculatedAmount,
            },
          });
        }

        for (const tax of variant.taxes) {
          await tx.variantTax.create({
            data: {
              variantId: newVariant.id,
              taxName: tax.taxName,
              taxPct: tax.taxPct,
              taxAmount: tax.taxAmount,
            },
          });
        }

        for (const og of variant.oldGoldEntries) {
          await tx.oldGoldEntry.create({
            data: {
              variantId: newVariant.id,
              itemDescription: og.itemDescription,
              grossWeight: og.grossWeight,
              purity: og.purity,
              netWeight: og.netWeight,
              ratePerUnit: og.ratePerUnit,
              deductionAmount: og.deductionAmount,
            },
          });
        }
      }

      return est;
    });

    await prisma.activityLog.create({
      data: {
        userId: payload.userId,
        action: "duplicate_estimate",
        entityType: "estimate",
        entityId: newEstimate.id,
        details: {
          originalId: estimateId,
          newEstimateNumber: newEstimateNumber,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { id: newEstimate.id, estimateNumber: newEstimateNumber },
    });
  } catch (error) {
    console.error("Duplicate estimate error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}