import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

// GET /api/estimates/[id]/pdf — Generate PDF data
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
        createdBy: { select: { name: true } },
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

    const settings = await prisma.shopSettings.findFirst();

    // Return all data needed for PDF
    return NextResponse.json({
      success: true,
      data: {
        estimate: {
          ...estimate,
          variants: estimate.variants.map((v: any) => ({
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
        },
        shop: settings
          ? {
              shopName: settings.shopName,
              address: settings.address,
              phone: settings.phone,
              email: settings.email,
              gstin: settings.gstin,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("PDF data error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}