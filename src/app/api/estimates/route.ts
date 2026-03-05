import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";
import { generateEstimateNumber } from "@/lib/utils/estimateNumber";

// GET /api/estimates — List with search, filters, pagination
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { estimateNumber: { contains: search, mode: "insensitive" } },
        { productName: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { phone: { contains: search } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [estimates, total] = await Promise.all([
      prisma.estimate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          estimateNumber: true,
          productName: true,
          status: true,
          createdAt: true,
          validUntil: true,
          customer: {
            select: { id: true, name: true, phone: true },
          },
          category: {
            select: { id: true, name: true },
          },
          variants: {
            take: 1,
            orderBy: { sortOrder: "asc" },
            select: { grandTotal: true },
          },
          _count: {
            select: { variants: true },
          },
        },
      }),
      prisma.estimate.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: estimates.map((est) => ({
        id: est.id,
        estimateNumber: est.estimateNumber,
        productName: est.productName,
        status: est.status,
        createdAt: est.createdAt,
        validUntil: est.validUntil,
        customer: est.customer,
        category: est.category,
        grandTotal: est.variants[0] ? Number(est.variants[0].grandTotal) : 0,
        variantCount: est._count.variants,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get estimates error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/estimates — Create full estimate with variants
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

    const body = await request.json();

    // Generate estimate number
    const estimateNumber = await generateEstimateNumber();

    // Get settings for validity days and tax
    const settings = await prisma.shopSettings.findFirst();
    const validityDays = settings?.estimateValidityDays || 3;
    const cgstPct = settings?.cgstPct ? Number(settings.cgstPct) : 1.5;
    const sgstPct = settings?.sgstPct ? Number(settings.sgstPct) : 1.5;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);

    // Create estimate with all nested data in a transaction
    const estimate = await prisma.$transaction(async (tx) => {
      const est = await tx.estimate.create({
        data: {
          estimateNumber,
          customerId: body.customerId,
          categoryId: body.categoryId || null,
          createdById: payload.userId,
          productName: body.productName,
          productDescription: body.productDescription || null,
          notes: body.notes || null,
          status: "DRAFT",
          validUntil,
          version: 1,
        },
      });

      // Create variants
      for (let vi = 0; vi < body.variants.length; vi++) {
        const variant = body.variants[vi];

        // Calculate variant totals
        let totalMaterialCost = 0;
        let totalWeight = 0;

        for (const mat of variant.materials) {
          const wastageWeight = (mat.weight * (mat.wastagePct || 0)) / 100;
          const tw = mat.weight + wastageWeight;
          totalWeight += tw;
          totalMaterialCost += tw * mat.ratePerUnit;
        }

        // Calculate charges
        let totalMakingCharges = 0;
        let totalAdditionalCharges = 0;

        for (let ci = 0; ci < (variant.charges || []).length; ci++) {
          const charge = variant.charges[ci];
          let amount = 0;

          switch (charge.chargeType) {
            case "FIXED":
              amount = charge.chargeValue;
              break;
            case "PERCENTAGE":
              amount = (totalMaterialCost * charge.chargeValue) / 100;
              break;
            case "PER_GRAM":
              amount = totalWeight * charge.chargeValue;
              break;
          }

          if (ci === 0) {
            totalMakingCharges = amount;
          } else {
            totalAdditionalCharges += amount;
          }
        }

        const subtotal = totalMaterialCost + totalMakingCharges + totalAdditionalCharges;
        const cgstAmount = (subtotal * cgstPct) / 100;
        const sgstAmount = (subtotal * sgstPct) / 100;
        const taxAmount = cgstAmount + sgstAmount;

        // Old gold deduction
        let oldGoldDeduction = 0;
        for (const og of variant.oldGoldEntries || []) {
          oldGoldDeduction += og.netWeight * og.ratePerUnit;
        }

        const grandTotal = subtotal + taxAmount - oldGoldDeduction;

        const createdVariant = await tx.estimateVariant.create({
          data: {
            estimateId: est.id,
            variantLabel: variant.variantLabel || `Option ${String.fromCharCode(65 + vi)}`,
            sortOrder: vi,
            isRecommended: variant.isRecommended || vi === 0,
            totalMaterialCost: Math.round(totalMaterialCost * 100) / 100,
            totalMakingCharges: Math.round(totalMakingCharges * 100) / 100,
            totalAdditionalCharges: Math.round(totalAdditionalCharges * 100) / 100,
            subtotal: Math.round(subtotal * 100) / 100,
            taxAmount: Math.round(taxAmount * 100) / 100,
            oldGoldDeduction: Math.round(oldGoldDeduction * 100) / 100,
            grandTotal: Math.round(grandTotal * 100) / 100,
          },
        });

        // Create materials for this variant
        for (let mi = 0; mi < variant.materials.length; mi++) {
          const mat = variant.materials[mi];
          const wastageWeight = (mat.weight * (mat.wastagePct || 0)) / 100;
          const totalWt = mat.weight + wastageWeight;
          const lineTotal = totalWt * mat.ratePerUnit;

          await tx.variantMaterial.create({
            data: {
              variantId: createdVariant.id,
              materialId: mat.materialId,
              weight: mat.weight,
              unit: mat.unit,
              ratePerUnit: mat.ratePerUnit,
              wastagePct: mat.wastagePct || 0,
              wastageWeight,
              totalWeight: totalWt,
              lineTotal: Math.round(lineTotal * 100) / 100,
              huid: mat.huid || null,
            },
          });
        }

        // Create charges
        for (let ci = 0; ci < (variant.charges || []).length; ci++) {
          const charge = variant.charges[ci];
          let computedAmount = 0;

          switch (charge.chargeType) {
            case "FIXED":
              computedAmount = charge.chargeValue;
              break;
            case "PERCENTAGE":
              computedAmount = (totalMaterialCost * charge.chargeValue) / 100;
              break;
            case "PER_GRAM":
              computedAmount = totalWeight * charge.chargeValue;
              break;
          }

          await tx.variantCharge.create({
            data: {
              variantId: createdVariant.id,
              chargeName: charge.chargeName,
              chargeType: charge.chargeType,
              chargeValue: charge.chargeValue,
              calculatedAmount: Math.round(computedAmount * 100) / 100,
            },
          });
        }

        // Create taxes
        await tx.variantTax.create({
          data: {
            variantId: createdVariant.id,
            taxName: "CGST",
            taxPct: cgstPct,
            taxAmount: Math.round(cgstAmount * 100) / 100,
          },
        });

        await tx.variantTax.create({
          data: {
            variantId: createdVariant.id,
            taxName: "SGST",
            taxPct: sgstPct,
            taxAmount: Math.round(sgstAmount * 100) / 100,
          },
        });

        // Create old gold entries
        for (const og of variant.oldGoldEntries || []) {
          await tx.oldGoldEntry.create({
            data: {
              variantId: createdVariant.id,
              itemDescription: og.itemDescription || null,
              grossWeight: og.grossWeight,
              purity: og.purity || null,
              netWeight: og.netWeight,
              ratePerUnit: og.ratePerUnit,
              deductionAmount: Math.round(og.netWeight * og.ratePerUnit * 100) / 100,
            },
          });
        }
      }

      return est;
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: payload.userId,
        action: "create_estimate",
        entityType: "estimate",
        entityId: estimate.id,
        details: {
          estimateNumber,
          productName: body.productName,
          customerId: body.customerId,
        },
      },
    });

    return NextResponse.json(
      { success: true, data: { id: estimate.id, estimateNumber } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create estimate error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}