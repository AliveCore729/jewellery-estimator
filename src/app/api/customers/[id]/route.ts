import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";
import { customerSchema } from "@/lib/utils/validators";

// GET /api/customers/[id] — Get customer with estimates
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

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        estimates: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            estimateNumber: true,
            productName: true,
            status: true,
            createdAt: true,
            variants: {
              take: 1,
              orderBy: { sortOrder: "asc" },
              select: { grandTotal: true },
            },
          },
        },
        _count: {
          select: { estimates: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...customer,
        estimateCount: customer._count.estimates,
        estimates: customer.estimates.map((est) => ({
          ...est,
          grandTotal: est.variants[0] ? Number(est.variants[0].grandTotal) : 0,
          variants: undefined,
        })),
        _count: undefined,
      },
    });
  } catch (error) {
    console.error("Get customer error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[id] — Update customer
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
    const parsed = customerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.customer.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        address: parsed.data.address || null,
        notes: parsed.data.notes || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: payload.userId,
        action: "update_customer",
        entityType: "customer",
        entityId: customer.id,
        details: { name: customer.name },
      },
    });

    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    console.error("Update customer error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] — Delete customer (only if no estimates)
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

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: { _count: { select: { estimates: true } } },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    if (customer._count.estimates > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete customer with ${customer._count.estimates} estimate(s). Delete estimates first.`,
        },
        { status: 400 }
      );
    }

    await prisma.customer.delete({ where: { id: params.id } });

    await prisma.activityLog.create({
      data: {
        userId: payload.userId,
        action: "delete_customer",
        entityType: "customer",
        entityId: params.id,
        details: { name: customer.name },
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: "Customer deleted" },
    });
  } catch (error) {
    console.error("Delete customer error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}