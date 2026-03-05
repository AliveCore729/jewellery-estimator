import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

// GET /api/estimates/[id] — Full estimate with all relations
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const estimate = await prisma.estimate.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        category: true,
        createdBy: { select: { id: true, name: true, email: true } },
        variants: {
          orderBy: { sortOrder: "asc" },
          include: {
            materials: {
              include: { material: true },
            },
            charges: true,
            taxes: true,
            oldGoldEntries: true,
          },
        },
      },
    });

    if (!estimate) {
      return NextResponse.json(
        { success: false, error: "Estimate not found" },
        { status: 404 }
      );
    }

    // Convert Decimals to numbers
    const data = {
      ...estimate,
      variants: estimate.variants.map((v) => ({
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

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Get estimate error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/estimates/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("token")?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const estimate = await prisma.estimate.findUnique({
      where: { id: params.id },
      select: { id: true, estimateNumber: true, status: true },
    });

    if (!estimate) {
      return NextResponse.json(
        { success: false, error: "Estimate not found" },
        { status: 404 }
      );
    }

    // Delete all related data in transaction
    await prisma.$transaction(async (tx) => {
      const variants = await tx.estimateVariant.findMany({
        where: { estimateId: params.id },
        select: { id: true },
      });
      const variantIds = variants.map((v) => v.id);

      await tx.variantMaterial.deleteMany({ where: { variantId: { in: variantIds } } });
      await tx.variantCharge.deleteMany({ where: { variantId: { in: variantIds } } });
      await tx.variantTax.deleteMany({ where: { variantId: { in: variantIds } } });
      await tx.oldGoldEntry.deleteMany({ where: { variantId: { in: variantIds } } });
      await tx.estimateVariant.deleteMany({ where: { estimateId: params.id } });
      await tx.estimateShare.deleteMany({ where: { estimateId: params.id } });
      await tx.estimate.delete({ where: { id: params.id } });
    });

    await prisma.activityLog.create({
      data: {
        userId: payload.userId,
        action: "delete_estimate",
        entityType: "estimate",
        entityId: params.id,
        details: { estimateNumber: estimate.estimateNumber },
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: "Estimate deleted" },
    });
  } catch (error) {
    console.error("Delete estimate error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}