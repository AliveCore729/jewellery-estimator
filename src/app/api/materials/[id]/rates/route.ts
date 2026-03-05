import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";
import { materialRateSchema } from "@/lib/utils/validators";

// GET /api/materials/[id]/rates — Rate history
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

    const rates = await prisma.materialRate.findMany({
      where: { materialId: params.id },
      orderBy: { effectiveDate: "desc" },
      take: 30,
      select: {
        id: true,
        ratePerUnit: true,
        unit: true,
        source: true,
        effectiveDate: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: rates.map((r) => ({
        ...r,
        ratePerUnit: Number(r.ratePerUnit),
      })),
    });
  } catch (error) {
    console.error("Get rates error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/materials/[id]/rates — Add new rate
export async function POST(
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

    const body = await request.json();

    // Override materialId with URL param
    const parsed = materialRateSchema.safeParse({
      ...body,
      materialId: params.id,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const material = await prisma.material.findUnique({
      where: { id: params.id },
    });

    if (!material) {
      return NextResponse.json(
        { success: false, error: "Material not found" },
        { status: 404 }
      );
    }

    const rate = await prisma.materialRate.create({
      data: {
        materialId: params.id,
        ratePerUnit: parsed.data.ratePerUnit,
        unit: parsed.data.unit,
        source: parsed.data.source,
        effectiveDate: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: payload.userId,
        action: "update_rate",
        entityType: "material",
        entityId: params.id,
        details: {
          materialName: material.name,
          newRate: parsed.data.ratePerUnit,
          unit: parsed.data.unit,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { ...rate, ratePerUnit: Number(rate.ratePerUnit) },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create rate error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}