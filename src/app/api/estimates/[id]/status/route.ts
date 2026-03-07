import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

// PUT /api/estimates/[id]/status — Update status
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
    const { status } = body;

    const validStatuses = ["DRAFT", "SENT", "APPROVED", "REJECTED", "EXPIRED", "REVISED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
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

    await prisma.estimate.update({
      where: { id: params.id },
      data: { status },
    });

    await prisma.activityLog.create({
      data: {
        userId: payload.userId,
        action: "update_status",
        entityType: "estimate",
        entityId: params.id,
        details: {
          estimateNumber: estimate.estimateNumber,
          from: estimate.status,
          to: status,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { status },
    });
  } catch (error) {
    console.error("Update status error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}