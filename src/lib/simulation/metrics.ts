import { prisma } from '@/lib/db/prisma';
import type { SimulationMetrics } from '@/types/simulation';

export async function calculateMetrics(runId?: string): Promise<SimulationMetrics> {
  const where = runId ? { runId, status: 'COMPLETED' } : { status: 'COMPLETED' };

  const simulations = await prisma.simulation.findMany({
    where,
    select: {
      personaId: true,
      scenarioType: true,
      durationSeconds: true,
      messageCount: true,
      avgResponseLatency: true,
      wasResolved: true,
      wasEscalated: true,
      simulatedCsat: true,
      blockedAttempts: true,
    },
  });

  const total = simulations.length;
  if (total === 0) {
    return emptyMetrics();
  }

  // Basic aggregations
  const resolved = simulations.filter(s => s.wasResolved).length;
  const escalated = simulations.filter(s => s.wasEscalated).length;
  const blocked = simulations.filter(s => s.blockedAttempts > 0).length;

  const avgDuration = simulations.reduce((a, s) => a + (s.durationSeconds || 0), 0) / total;
  const avgMessageCount = simulations.reduce((a, s) => a + s.messageCount, 0) / total;
  const avgLatency = simulations.reduce((a, s) => a + (s.avgResponseLatency || 0), 0) / total;

  const withCsat = simulations.filter(s => s.simulatedCsat != null);
  const avgCsat = withCsat.length > 0
    ? withCsat.reduce((a, s) => a + (s.simulatedCsat || 0), 0) / withCsat.length
    : 0;

  // Count failed simulations for this run
  const failedCount = runId
    ? await prisma.simulation.count({ where: { runId, status: { in: ['FAILED', 'TIMEOUT'] } } })
    : await prisma.simulation.count({ where: { status: { in: ['FAILED', 'TIMEOUT'] } } });

  // Group by persona
  const byPersona: SimulationMetrics['byPersona'] = {};
  const personaGroups = groupBy(simulations, 'personaId');
  for (const [personaId, group] of Object.entries(personaGroups)) {
    const groupWithCsat = group.filter(s => s.simulatedCsat != null);
    byPersona[personaId] = {
      count: group.length,
      resolutionRate: group.filter(s => s.wasResolved).length / group.length,
      avgDuration: group.reduce((a, s) => a + (s.durationSeconds || 0), 0) / group.length,
      avgCsat: groupWithCsat.length > 0
        ? groupWithCsat.reduce((a, s) => a + (s.simulatedCsat || 0), 0) / groupWithCsat.length
        : 0,
    };
  }

  // Group by scenario
  const byScenario: SimulationMetrics['byScenario'] = {};
  const scenarioGroups = groupBy(simulations, 'scenarioType');
  for (const [scenarioType, group] of Object.entries(scenarioGroups)) {
    byScenario[scenarioType] = {
      count: group.length,
      resolutionRate: group.filter(s => s.wasResolved).length / group.length,
      avgDuration: group.reduce((a, s) => a + (s.durationSeconds || 0), 0) / group.length,
    };
  }

  return {
    totalSimulations: total + failedCount,
    completedSimulations: total,
    failedSimulations: failedCount,
    avgDuration,
    avgMessageCount,
    avgResponseLatency: avgLatency,
    resolutionRate: resolved / total,
    escalationRate: escalated / total,
    blockRate: blocked / total,
    avgSimulatedCsat: avgCsat,
    byPersona,
    byScenario,
  };
}

export async function getRecentRunsMetrics(limit: number = 5) {
  const runs = await prisma.simulationRun.findMany({
    where: { status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      personaSet: true,
      completedAt: true,
      avgDuration: true,
      avgMessageCount: true,
      resolutionRate: true,
      escalationRate: true,
      avgSatisfaction: true,
      avgLatency: true,
      scenarioCount: true,
      completedCount: true,
    },
  });

  return runs;
}

export async function getMetricsTrend(days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const runs = await prisma.simulationRun.findMany({
    where: {
      status: 'COMPLETED',
      completedAt: { gte: startDate },
    },
    orderBy: { completedAt: 'asc' },
    select: {
      completedAt: true,
      resolutionRate: true,
      escalationRate: true,
      avgSatisfaction: true,
      avgLatency: true,
    },
  });

  return runs.map(run => ({
    date: run.completedAt?.toISOString().split('T')[0],
    resolutionRate: run.resolutionRate,
    escalationRate: run.escalationRate,
    avgSatisfaction: run.avgSatisfaction,
    avgLatency: run.avgLatency,
  }));
}

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((groups, item) => {
    const value = String(item[key]);
    (groups[value] = groups[value] || []).push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

function emptyMetrics(): SimulationMetrics {
  return {
    totalSimulations: 0,
    completedSimulations: 0,
    failedSimulations: 0,
    avgDuration: 0,
    avgMessageCount: 0,
    avgResponseLatency: 0,
    resolutionRate: 0,
    escalationRate: 0,
    blockRate: 0,
    avgSimulatedCsat: 0,
    byPersona: {},
    byScenario: {},
  };
}
