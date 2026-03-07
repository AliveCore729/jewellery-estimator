import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

// GET /api/settings
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let settings = await prisma.shopSettings.findFirst();

    if (!settings) {
      settings = await prisma.shopSettings.create({
        data: {
          shopName: "Kanaka Jewellers",
          estimatePrefix: "EST",
          estimateValidityDays: 3,
          defaultWeightUnit: "GRAM",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...settings,
        defaultTaxPct: settings.defaultTaxPct ? Number(settings.defaultTaxPct) : 0,
        cgstPct: settings.cgstPct ? Number(settings.cgstPct) : 0,
        sgstPct: settings.sgstPct ? Number(settings.sgstPct) : 0,
      },
    });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/settings
export async function PUT(request: NextRequest) {
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
    const {
      shopName,
      address,
      phone,
      email,
      gstin,
      defaultTaxPct,
      cgstPct,
      sgstPct,
      estimatePrefix,
      estimateValidityDays,
      defaultWeightUnit,
    } = body;

    const existing = await prisma.shopSettings.findFirst();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Settings not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.shopSettings.update({
      where: { id: existing.id },
      data: {
        shopName: shopName || existing.shopName,
        address: address !== undefined ? address : existing.address,
        phone: phone !== undefined ? phone : existing.phone,
        email: email !== undefined ? email : existing.email,
        gstin: gstin !== undefined ? gstin : existing.gstin,
        defaultTaxPct: defaultTaxPct !== undefined ? defaultTaxPct : existing.defaultTaxPct,
        cgstPct: cgstPct !== undefined ? cgstPct : existing.cgstPct,
        sgstPct: sgstPct !== undefined ? sgstPct : existing.sgstPct,
        estimatePrefix: estimatePrefix || existing.estimatePrefix,
        estimateValidityDays: estimateValidityDays || existing.estimateValidityDays,
        defaultWeightUnit: defaultWeightUnit || existing.defaultWeightUnit,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: payload.userId,
        action: "update_settings",
        entityType: "settings",
        entityId: updated.id,
        details: { updatedFields: Object.keys(body) },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        defaultTaxPct: updated.defaultTaxPct ? Number(updated.defaultTaxPct) : 0,
        cgstPct: updated.cgstPct ? Number(updated.cgstPct) : 0,
        sgstPct: updated.sgstPct ? Number(updated.sgstPct) : 0,
      },
    });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}