import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";
import { materialSchema } from "@/lib/utils/validators";

// GET /api/materials — List all materials with latest rate
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
    const category = searchParams.get("category");
    const activeOnly = searchParams.get("active") !== "false";

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (activeOnly) where.isActive = true;

    const materials = await prisma.material.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
      include: {
        rates: {
          take: 1,
          orderBy: { effectiveDate: "desc" },
          select: {
            id: true,
            ratePerUnit: true,
            unit: true,
            source: true,
            effectiveDate: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: materials.map((m) => ({
        id: m.id,
        name: m.name,
        category: m.category,
        purity: m.purity,
        defaultUnit: m.defaultUnit,
        hsnCode: m.hsnCode,
        isActive: m.isActive,
        createdAt: m.createdAt,
        latestRate: m.rates[0]
          ? {
              id: m.rates[0].id,
              ratePerUnit: Number(m.rates[0].ratePerUnit),
              unit: m.rates[0].unit,
              source: m.rates[0].source,
              effectiveDate: m.rates[0].effectiveDate,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Get materials error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/materials — Create material
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
    const parsed = materialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const material = await prisma.material.create({
      data: {
        name: parsed.data.name,
        category: parsed.data.category,
        purity: parsed.data.purity || null,
        defaultUnit: parsed.data.defaultUnit,
        hsnCode: parsed.data.hsnCode || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: payload.userId,
        action: "create_material",
        entityType: "material",
        entityId: material.id,
        details: { name: material.name },
      },
    });

    return NextResponse.json(
      { success: true, data: material },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create material error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}