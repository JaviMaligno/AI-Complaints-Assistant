import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createSimulationRun, getPersonasBySet } from '@/lib/simulation';
import type { SimulationConfig } from '@/types/simulation';

// GET /api/simulations - List all simulation runs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    const [runs, total] = await Promise.all([
      prisma.simulationRun.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { simulations: true },
          },
        },
      }),
      prisma.simulationRun.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        runs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Failed to get simulation runs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get simulation runs' },
      { status: 500 }
    );
  }
}

// POST /api/simulations - Create a new simulation run
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, personaSet } = body as {
      name?: string;
      personaSet?: SimulationConfig['personaSet'];
    };

    const set = personaSet || 'standard';
    const personaCount = getPersonasBySet(set).length;

    const config: SimulationConfig = {
      runName: name || `${set.charAt(0).toUpperCase() + set.slice(1)} Test - ${new Date().toLocaleDateString('en-GB')}`,
      personaSet: set,
      parallelism: 1,
      timeoutSeconds: 120,
      evaluateQuality: true,
    };

    const runId = await createSimulationRun(config);

    return NextResponse.json({
      success: true,
      data: {
        runId,
        name: config.runName,
        personaSet: set,
        personaCount,
      },
    });
  } catch (error) {
    console.error('Failed to create simulation run:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create simulation run' },
      { status: 500 }
    );
  }
}
