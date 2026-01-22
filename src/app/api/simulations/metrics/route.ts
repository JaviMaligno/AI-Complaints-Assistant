import { NextRequest, NextResponse } from 'next/server';
import { calculateMetrics, getRecentRunsMetrics, getMetricsTrend } from '@/lib/simulation';

// GET /api/simulations/metrics - Get aggregated metrics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const runId = searchParams.get('runId') || undefined;
    const includeTrend = searchParams.get('includeTrend') === 'true';
    const includeRecent = searchParams.get('includeRecent') !== 'false';

    const [metrics, recentRuns, trend] = await Promise.all([
      calculateMetrics(runId),
      includeRecent ? getRecentRunsMetrics(5) : Promise.resolve([]),
      includeTrend ? getMetricsTrend(7) : Promise.resolve([]),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        recentRuns,
        trend: includeTrend ? trend : undefined,
      },
    });
  } catch (error) {
    console.error('Failed to get simulation metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get simulation metrics' },
      { status: 500 }
    );
  }
}
