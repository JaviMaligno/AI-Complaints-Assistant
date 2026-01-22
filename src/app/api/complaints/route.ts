import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          customer: {
            select: {
              name: true,
              email: true,
            },
          },
          order: {
            select: {
              vehicleMake: true,
              vehicleModel: true,
              vehicleYear: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.complaint.count({ where }),
    ]);

    const formattedComplaints = complaints.map((c) => ({
      id: c.id,
      referenceNumber: c.referenceNumber,
      customerName: c.customer.name,
      customerEmail: c.customer.email,
      category: c.category,
      status: c.status,
      priority: c.priority,
      aiHandled: c.aiHandled,
      createdAt: c.createdAt,
      vehicleInfo: c.order
        ? `${c.order.vehicleYear} ${c.order.vehicleMake} ${c.order.vehicleModel}`
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        complaints: formattedComplaints,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Failed to get complaints:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get complaints",
      },
      { status: 500 }
    );
  }
}
