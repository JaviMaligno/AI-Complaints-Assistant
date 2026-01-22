import { NextRequest, NextResponse } from 'next/server';
import { getSimulationRun } from '@/lib/simulation';

// GET /api/simulations/[id] - Get simulation run details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const run = await getSimulationRun(id);

    if (!run) {
      return NextResponse.json(
        { success: false, error: 'Simulation run not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: run,
    });
  } catch (error) {
    console.error('Failed to get simulation run:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get simulation run' },
      { status: 500 }
    );
  }
}
