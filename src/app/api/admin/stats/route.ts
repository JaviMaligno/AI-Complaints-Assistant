import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get total complaints
    const totalComplaints = await prisma.complaint.count();

    // Get open complaints
    const openComplaints = await prisma.complaint.count({
      where: {
        status: {
          in: ["OPEN", "IN_PROGRESS", "AWAITING_CUSTOMER", "AWAITING_INTERNAL"],
        },
      },
    });

    // Get AI resolved complaints
    const aiResolved = await prisma.complaint.count({
      where: {
        aiHandled: true,
        status: {
          in: ["RESOLVED", "CLOSED"],
        },
      },
    });

    // Calculate AI resolved percentage
    const resolvedTotal = await prisma.complaint.count({
      where: {
        status: {
          in: ["RESOLVED", "CLOSED"],
        },
      },
    });
    const aiResolvedPercent = resolvedTotal > 0 ? Math.round((aiResolved / resolvedTotal) * 100) : 0;

    // Get escalated count
    const escalatedCount = await prisma.complaint.count({
      where: {
        status: "ESCALATED",
      },
    });

    // Get today's complaints
    const todayComplaints = await prisma.complaint.count({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },
    });

    // Calculate average resolution time (for complaints in last 30 days)
    const resolvedComplaints = await prisma.complaint.findMany({
      where: {
        resolvedAt: {
          not: null,
          gte: thirtyDaysAgo,
        },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    let avgResolutionTimeHours = 0;
    if (resolvedComplaints.length > 0) {
      const totalHours = resolvedComplaints.reduce((sum, c) => {
        const diff = c.resolvedAt!.getTime() - c.createdAt.getTime();
        return sum + diff / (1000 * 60 * 60);
      }, 0);
      avgResolutionTimeHours = Math.round(totalHours / resolvedComplaints.length);
    }

    // Calculate CSAT average
    const csatComplaints = await prisma.complaint.findMany({
      where: {
        csatScore: {
          not: null,
        },
      },
      select: {
        csatScore: true,
      },
    });

    let csatAverage = 0;
    if (csatComplaints.length > 0) {
      const totalScore = csatComplaints.reduce((sum, c) => sum + (c.csatScore || 0), 0);
      csatAverage = Math.round((totalScore / csatComplaints.length) * 10) / 10;
    }

    return NextResponse.json({
      success: true,
      data: {
        totalComplaints,
        openComplaints,
        aiResolved,
        aiResolvedPercent,
        avgResolutionTimeHours,
        escalatedCount,
        todayComplaints,
        csatAverage,
      },
    });
  } catch (error) {
    console.error("Failed to get stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get statistics",
      },
      { status: 500 }
    );
  }
}
