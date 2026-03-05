import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";
import { materialSchema } from "@/lib/utils/validators";

// PUT /api/materials/[id] — Update material
export async function PUT(
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
    const parsed = materialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.material.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Material not found" },
        { status: 404 }
      );
    }

    const material = await prisma.material.update({
      where: { id: params.id },
      data: {
        name: parsed.data.name,
        category: parsed.data.category,
        purity: parsed.data.purity || null,
        defaultUnit: parsed.data.defaultUnit,
        hsnCode: parsed.data.hsnCode || null,
      },
    });

    return NextResponse.json({ success: true, data: material });
  } catch (error) {
    console.error("Update material error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/materials/[id] — Soft delete (deactivate)
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

    const existing = await prisma.material.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Material not found" },
        { status: 404 }
      );
    }

    // Soft delete — just deactivate
    await prisma.material.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    await prisma.activityLog.create({
      data: {
        userId: payload.userId,
        action: "deactivate_material",
        entityType: "material",
        entityId: params.id,
        details: { name: existing.name },
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: "Material deactivated" },
    });
  } catch (error) {
    console.error("Delete material error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}