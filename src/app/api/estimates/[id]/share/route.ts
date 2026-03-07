import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

// POST /api/estimates/[id]/share — Create shareable link
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

    const estimate = await prisma.estimate.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        estimateNumber: true,
        customer: { select: { phone: true, name: true } },
      },
    });

    if (!estimate) {
      return NextResponse.json(
        { success: false, error: "Estimate not found" },
        { status: 404 }
      );
    }

    // Check if a share already exists for this estimate
    const existingShare = await prisma.estimateShare.findFirst({
      where: { estimateId: params.id },
    });

    if (existingShare) {
      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/share/${existingShare.shareToken}`;

      return NextResponse.json({
        success: true,
        data: {
          shareToken: existingShare.shareToken,
          shareUrl,
          customerPhone: estimate.customer.phone,
          customerName: estimate.customer.name,
          estimateNumber: estimate.estimateNumber,
        },
      });
    }

    // Create new share
    const share = await prisma.estimateShare.create({
      data: {
        estimateId: params.id,
        channel: "WHATSAPP",
        recipient: estimate.customer.phone,
      },
    });

    // Update estimate status to SENT
    await prisma.estimate.update({
      where: { id: params.id },
      data: { status: "SENT" },
    });

    await prisma.activityLog.create({
      data: {
        userId: payload.userId,
        action: "share_estimate",
        entityType: "estimate",
        entityId: params.id,
        details: { method: "WHATSAPP", estimateNumber: estimate.estimateNumber },
      },
    });

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/share/${share.shareToken}`;

    return NextResponse.json({
      success: true,
      data: {
        shareToken: share.shareToken,
        shareUrl,
        customerPhone: estimate.customer.phone,
        customerName: estimate.customer.name,
        estimateNumber: estimate.estimateNumber,
      },
    });
  } catch (error) {
    console.error("Share estimate error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}