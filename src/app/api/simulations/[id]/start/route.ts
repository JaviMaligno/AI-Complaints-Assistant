import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { runSimulationBatch } from '@/lib/simulation';
import type { SimulationConfig } from '@/types/simulation';

// POST /api/simulations/[id]/start - Start running a simulation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const run = await prisma.simulationRun.findUnique({
      where: { id },
    });

    if (!run) {
      return NextResponse.json(
        { success: false, error: 'Simulation run not found' },
        { status: 404 }
      );
    }

    if (run.status === 'RUNNING') {
      return NextResponse.json(
        { success: false, error: 'Simulation is already running' },
        { status: 400 }
      );
    }

    if (run.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Simulation has already completed' },
        { status: 400 }
      );
    }

    // Build config from run data
    const config: SimulationConfig = {
      runName: run.name,
      personaSet: run.personaSet as SimulationConfig['personaSet'],
      parallelism: 1,
      timeoutSeconds: 120,
      evaluateQuality: true,
    };

    // Run simulations (this can take a while)
    const results = await runSimulationBatch(id, config);

    // Calculate summary stats
    const completed = results.filter(r => r.status === 'completed');
    const summary = {
      total: results.length,
      completed: completed.length,
      failed: results.filter(r => r.status === 'failed').length,
      timedOut: results.filter(r => r.status === 'timeout').length,
      resolved: completed.filter(r => r.wasResolved).length,
      escalated: completed.filter(r => r.wasEscalated).length,
      avgCsat: completed.filter(r => r.simulatedCsat).length > 0
        ? (completed.reduce((a, b) => a + (b.simulatedCsat || 0), 0) /
           completed.filter(r => r.simulatedCsat).length).toFixed(2)
        : null,
    };

    return NextResponse.json({
      success: true,
      data: {
        runId: id,
        summary,
        results,
      },
    });
  } catch (error) {
    console.error('Failed to start simulation:', error);

    // Try to mark run as failed
    const { id } = await params;
    try {
      await prisma.simulationRun.update({
        where: { id },
        data: { status: 'FAILED' },
      });
    } catch {
      // Ignore update errors
    }

    return NextResponse.json(
      { success: false, error: 'Failed to start simulation' },
      { status: 500 }
    );
  }
}
