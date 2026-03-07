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

    // Get date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Run all queries in parallel
    const [
      totalEstimates,
      estimatesThisMonth,
      estimatesLastMonth,
      pendingEstimates,
      acceptedThisMonth,
      acceptedLastMonth,
      totalCustomers,
      customersThisMonth,
      revenueThisMonthData,
      revenueLastMonthData,
      recentEstimates,
      recentActivity,
    ] = await Promise.all([
      // Total estimates
      prisma.estimate.count(),

      // Estimates this month
      prisma.estimate.count({
        where: { createdAt: { gte: startOfMonth } },
      }),

      // Estimates last month
      prisma.estimate.count({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),

      // Pending (DRAFT + SENT)
      prisma.estimate.count({
        where: { status: { in: ["DRAFT", "SENT"] } },
      }),

      // Accepted this month
      prisma.estimate.count({
        where: {
          status: "ACCEPTED",
          updatedAt: { gte: startOfMonth },
        },
      }),

      // Accepted last month
      prisma.estimate.count({
        where: {
          status: "ACCEPTED",
          updatedAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),

      // Total customers
      prisma.customer.count(),

      // Customers this month
      prisma.customer.count({
        where: { createdAt: { gte: startOfMonth } },
      }),

      // Revenue this month (grandTotal of accepted estimates)
      prisma.estimateVariant.findMany({
        where: {
          estimate: {
            status: "ACCEPTED",
            updatedAt: { gte: startOfMonth },
          },
          isRecommended: true,
        },
        select: { grandTotal: true },
      }),

      // Revenue last month
      prisma.estimateVariant.findMany({
        where: {
          estimate: {
            status: "ACCEPTED",
            updatedAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          },
          isRecommended: true,
        },
        select: { grandTotal: true },
      }),

      // Recent estimates
      prisma.estimate.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { name: true } },
          variants: {
            where: { isRecommended: true },
            select: { grandTotal: true },
            take: 1,
          },
        },
      }),

      // Recent activity
      prisma.activityLog.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true } },
        },
      }),
    ]);

    // Calculate revenue
    const revenueThisMonth = revenueThisMonthData.reduce(
      (sum: number, v: any) => sum + Number(v.grandTotal),
      0
    );
    const revenueLastMonth = revenueLastMonthData.reduce(
      (sum: number, v: any) => sum + Number(v.grandTotal),
      0
    );

    // Calculate % changes
    const estimateChange =
      estimatesLastMonth > 0
        ? Math.round(((estimatesThisMonth - estimatesLastMonth) / estimatesLastMonth) * 100)
        : estimatesThisMonth > 0
        ? 100
        : 0;

    const revenueChange =
      revenueLastMonth > 0
        ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
        : revenueThisMonth > 0
        ? 100
        : 0;

    const acceptedChange =
      acceptedLastMonth > 0
        ? Math.round(((acceptedThisMonth - acceptedLastMonth) / acceptedLastMonth) * 100)
        : acceptedThisMonth > 0
        ? 100
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalEstimates,
          estimatesThisMonth,
          estimateChange,
          pendingEstimates,
          acceptedThisMonth,
          acceptedChange,
          totalCustomers,
          customersThisMonth,
          revenueThisMonth,
          revenueChange,
        },
        recentEstimates: recentEstimates.map((e: any) => ({
          id: e.id,
          estimateNumber: e.estimateNumber,
          customerName: e.customer.name,
          status: e.status,
          grandTotal: e.variants[0] ? Number(e.variants[0].grandTotal) : 0,
          createdAt: e.createdAt,
        })),
        recentActivity: recentActivity.map((a: any) => ({
          id: a.id,
          action: a.action,
          entityType: a.entityType,
          userName: a.user?.name || "System",
          createdAt: a.createdAt,
          details: a.details,
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