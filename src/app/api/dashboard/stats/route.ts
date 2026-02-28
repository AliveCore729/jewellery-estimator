import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get first day of current month
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Run all queries in parallel
    const [
      estimatesToday,
      estimatesThisMonth,
      totalCustomers,
      goldRate,
      recentEstimates,
    ] = await Promise.all([
      // Estimates created today
      prisma.estimate.count({
        where: {
          createdAt: { gte: today, lt: tomorrow },
        },
      }),

      // Estimates this month
      prisma.estimate.count({
        where: {
          createdAt: { gte: firstOfMonth },
        },
      }),

      // Total customers
      prisma.customer.count(),

      // Latest Gold 22K rate
      prisma.materialRate.findFirst({
        where: {
          material: {
            name: "Gold 22K",
          },
        },
        orderBy: {
          effectiveDate: "desc",
        },
        select: {
          ratePerUnit: true,
        },
      }),

      // Recent 10 estimates
      prisma.estimate.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          estimateNumber: true,
          productName: true,
          status: true,
          createdAt: true,
          customer: {
            select: { name: true },
          },
          variants: {
            take: 1,
            orderBy: { sortOrder: "asc" },
            select: { grandTotal: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        estimatesToday,
        estimatesThisMonth,
        totalCustomers,
        todaysGoldRate: goldRate ? Number(goldRate.ratePerUnit) : null,
        recentEstimates: recentEstimates.map((est) => ({
          id: est.id,
          estimateNumber: est.estimateNumber,
          customerName: est.customer.name,
          productName: est.productName,
          grandTotal: est.variants[0] ? Number(est.variants[0].grandTotal) : 0,
          status: est.status,
          createdAt: est.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}