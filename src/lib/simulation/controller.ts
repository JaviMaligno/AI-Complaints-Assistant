import { prisma } from '@/lib/db/prisma';
import { processMessage } from '@/lib/ai/orchestrator';
import { generateCustomerResponse, evaluateIfConversationComplete } from './customer-simulator';
import { evaluateConversation, assessResolutionMatch } from './evaluator';
import { getPersonasBySet, getPersonaById } from './personas';
import { generateScenarioForPersona } from './scenarios';
import type {
  CustomerPersona,
  SimulationScenario,
  SimulationConfig,
  SimulationResult,
} from '@/types/simulation';

export async function createSimulationRun(config: SimulationConfig): Promise<string> {
  const personas = getPersonasBySet(config.personaSet);

  const run = await prisma.simulationRun.create({
    data: {
      name: config.runName,
      status: 'PENDING',
      personaSet: config.personaSet,
      scenarioCount: personas.length,
      completedCount: 0,
    },
  });

  return run.id;
}

export async function runSingleSimulation(
  runId: string,
  persona: CustomerPersona,
  scenario: SimulationScenario,
  timeoutSeconds: number = 120
): Promise<SimulationResult> {
  const startTime = Date.now();
  const latencies: number[] = [];
  const actionsTaken: string[] = [];

  // Create simulation record
  const simulation = await prisma.simulation.create({
    data: {
      runId,
      personaId: persona.id,
      personaName: persona.name,
      scenarioType: scenario.category,
      scenarioDescription: scenario.description,
      status: 'RUNNING',
      startedAt: new Date(),
    },
  });

  try {
    let conversationId: string | null = null;
    const conversationHistory: Array<{ role: string; content: string }> = [];
    let isFinished = false;
    let wasEscalated = false;
    let wasResolved = false;
    let wasBlocked = false;
    let escalateReason: string | undefined;
    let injectionAttempts = 0;
    let blockedAttempts = 0;
    let vulnerabilityFlags = 0;

    // Run conversation loop
    for (let turn = 0; turn < scenario.maxTurns && !isFinished; turn++) {
      // Check timeout
      if (Date.now() - startTime > timeoutSeconds * 1000) {
        throw new Error('Simulation timeout');
      }

      // Generate customer message
      const customerResponse = await generateCustomerResponse(
        persona,
        conversationHistory,
        scenario.goals,
        turn
      );

      conversationHistory.push({
        role: 'USER',
        content: customerResponse.message,
      });

      // Track injection attempts for adversarial personas
      if (persona.injectionAttempts?.length) {
        const hasInjectionPattern = persona.injectionAttempts.some(pattern =>
          customerResponse.message.toLowerCase().includes(pattern.toLowerCase().slice(0, 20))
        );
        if (hasInjectionPattern) {
          injectionAttempts++;
        }
      }

      // Track vulnerability signals
      if (persona.vulnerabilitySignals?.length) {
        const hasVulnerabilitySignal = persona.vulnerabilitySignals.some(signal =>
          customerResponse.message.toLowerCase().includes(signal.toLowerCase())
        );
        if (hasVulnerabilitySignal) {
          vulnerabilityFlags++;
        }
      }

      // Process through actual orchestrator
      const messageStart = Date.now();
      const result = await processMessage(customerResponse.message, conversationId);
      const latency = Date.now() - messageStart;
      latencies.push(latency);

      conversationId = result.conversationId;

      conversationHistory.push({
        role: 'ASSISTANT',
        content: result.response,
      });

      // Track outcomes
      if (result.blocked) {
        blockedAttempts++;
        wasBlocked = true;
      }

      if (result.actionTaken) {
        actionsTaken.push(result.actionTaken.type);
      }

      if (result.shouldEscalate) {
        wasEscalated = true;
        escalateReason = result.escalateReason;
      }

      // Save message records
      await prisma.simulationMessage.create({
        data: {
          simulationId: simulation.id,
          role: 'USER',
          content: customerResponse.message,
          personaIntent: customerResponse.intent,
          emotionLevel: customerResponse.emotionLevel,
        },
      });

      await prisma.simulationMessage.create({
        data: {
          simulationId: simulation.id,
          role: 'ASSISTANT',
          content: result.response,
          intent: result.intent,
          confidence: result.confidence,
          responseLatency: latency,
          actionTaken: result.actionTaken?.type,
        },
      });

      // Check if conversation should end
      if (customerResponse.isFinished) {
        isFinished = true;
        wasResolved = customerResponse.finishReason === 'satisfied';
      }

      // Also check our internal completion logic
      const completionCheck = await evaluateIfConversationComplete(
        persona,
        conversationHistory,
        wasEscalated,
        wasBlocked
      );

      if (completionCheck.isComplete) {
        isFinished = true;
        if (completionCheck.reason === 'escalated_to_human') {
          wasEscalated = true;
        }
      }
    }

    const durationSeconds = (Date.now() - startTime) / 1000;
    const avgLatency = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;
    const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;

    // Evaluate conversation quality
    const evaluation = await evaluateConversation(conversationHistory, persona, scenario);

    // Assess if resolution matched expectations
    const resolutionMatch = assessResolutionMatch(
      persona,
      wasResolved,
      wasEscalated,
      wasBlocked,
      actionsTaken
    );

    // Update simulation record
    await prisma.simulation.update({
      where: { id: simulation.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        conversationId,
        durationSeconds,
        messageCount: conversationHistory.length,
        userMessageCount: conversationHistory.filter(m => m.role === 'USER').length,
        assistantMsgCount: conversationHistory.filter(m => m.role === 'ASSISTANT').length,
        wasResolved,
        wasEscalated,
        escalateReason,
        actionsTaken: JSON.stringify(actionsTaken),
        avgResponseLatency: avgLatency,
        maxResponseLatency: maxLatency,
        simulatedCsat: evaluation.csatScore,
        evaluationNotes: `${evaluation.notes}\n\nResolution match: ${resolutionMatch.details}`,
        injectionAttempts,
        blockedAttempts,
        vulnerabilityFlags,
      },
    });

    return {
      simulationId: simulation.id,
      personaId: persona.id,
      scenarioId: scenario.id,
      status: 'completed',
      durationSeconds,
      messageCount: conversationHistory.length,
      avgResponseLatency: avgLatency,
      maxResponseLatency: maxLatency,
      wasResolved,
      wasEscalated,
      escalateReason,
      actionsTaken,
      simulatedCsat: evaluation.csatScore,
      evaluationNotes: evaluation.notes,
      injectionAttempts,
      blockedAttempts,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await prisma.simulation.update({
      where: { id: simulation.id },
      data: {
        status: errorMessage.includes('timeout') ? 'TIMEOUT' : 'FAILED',
        errorMessage,
        completedAt: new Date(),
      },
    });

    return {
      simulationId: simulation.id,
      personaId: persona.id,
      scenarioId: scenario.id,
      status: errorMessage.includes('timeout') ? 'timeout' : 'failed',
      durationSeconds: (Date.now() - startTime) / 1000,
      messageCount: 0,
      avgResponseLatency: 0,
      maxResponseLatency: 0,
      wasResolved: false,
      wasEscalated: false,
      actionsTaken: [],
      injectionAttempts: 0,
      blockedAttempts: 0,
    };
  }
}

export async function runSimulationBatch(
  runId: string,
  config: SimulationConfig
): Promise<SimulationResult[]> {
  const personas = getPersonasBySet(config.personaSet);
  const results: SimulationResult[] = [];

  // Update run status
  await prisma.simulationRun.update({
    where: { id: runId },
    data: { status: 'RUNNING', startedAt: new Date() },
  });

  for (const persona of personas) {
    const scenario = generateScenarioForPersona(persona);

    try {
      const result = await runSingleSimulation(runId, persona, scenario, config.timeoutSeconds);
      results.push(result);

      // Update progress
      await prisma.simulationRun.update({
        where: { id: runId },
        data: { completedCount: { increment: 1 } },
      });
    } catch (error) {
      console.error(`Simulation failed for persona ${persona.id}:`, error);
    }
  }

  // Calculate aggregated metrics
  const completed = results.filter(r => r.status === 'completed');
  const metrics = {
    avgDuration: completed.length > 0
      ? completed.reduce((a, b) => a + b.durationSeconds, 0) / completed.length
      : null,
    avgMessageCount: completed.length > 0
      ? completed.reduce((a, b) => a + b.messageCount, 0) / completed.length
      : null,
    resolutionRate: completed.length > 0
      ? completed.filter(r => r.wasResolved).length / completed.length
      : null,
    escalationRate: completed.length > 0
      ? completed.filter(r => r.wasEscalated).length / completed.length
      : null,
    avgSatisfaction: completed.filter(r => r.simulatedCsat).length > 0
      ? completed.reduce((a, b) => a + (b.simulatedCsat || 0), 0) / completed.filter(r => r.simulatedCsat).length
      : null,
    avgLatency: completed.length > 0
      ? completed.reduce((a, b) => a + b.avgResponseLatency, 0) / completed.length
      : null,
  };

  // Update run with final metrics
  await prisma.simulationRun.update({
    where: { id: runId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      avgDuration: metrics.avgDuration,
      avgMessageCount: metrics.avgMessageCount,
      resolutionRate: metrics.resolutionRate,
      escalationRate: metrics.escalationRate,
      avgSatisfaction: metrics.avgSatisfaction,
      avgLatency: metrics.avgLatency,
    },
  });

  return results;
}

export async function getSimulationRun(runId: string) {
  return prisma.simulationRun.findUnique({
    where: { id: runId },
    include: {
      simulations: {
        orderBy: { createdAt: 'asc' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  });
}

export async function getSimulationById(simulationId: string) {
  return prisma.simulation.findUnique({
    where: { id: simulationId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
      run: true,
    },
  });
}

export async function getRandomCompletedSimulation() {
  // First try to get simulations with real outcomes (resolved or escalated)
  let simulations = await prisma.simulation.findMany({
    where: {
      status: 'COMPLETED',
      messageCount: { gte: 4 }, // At least 4 messages for interesting demo
      OR: [
        { wasResolved: true },
        { wasEscalated: true },
      ],
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  // Filter out simulations where AI just returned fallback/error messages
  const fallbackPatterns = [
    "i apologize, but i'm having trouble processing",
    "having trouble processing your request",
    "would you like me to connect you",
    "i need some assistance please",
    "i need assistance",
  ];

  simulations = simulations.filter(sim => {
    const assistantMessages = sim.messages
      .filter(m => m.role === 'ASSISTANT')
      .map(m => m.content.toLowerCase());

    if (assistantMessages.length === 0) return false;

    // Count how many messages match fallback patterns
    const fallbackCount = assistantMessages.filter(msg =>
      fallbackPatterns.some(pattern => msg.includes(pattern))
    ).length;

    // Reject if more than 30% are fallback messages
    const fallbackRatio = fallbackCount / assistantMessages.length;
    if (fallbackRatio > 0.3) return false;

    // Check for message variety (avoid repetitive conversations)
    const uniqueMessages = new Set(assistantMessages);
    const uniqueRatio = uniqueMessages.size / assistantMessages.length;
    if (uniqueRatio < 0.5) return false;

    return true;
  });

  if (simulations.length === 0) {
    // Fallback: get any completed simulation with good CSAT score
    const anySimulation = await prisma.simulation.findFirst({
      where: {
        status: 'COMPLETED',
        messageCount: { gte: 4 },
        simulatedCsat: { gte: 3 },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { simulatedCsat: 'desc' },
    });
    return anySimulation;
  }

  // Return random from filtered simulations
  return simulations[Math.floor(Math.random() * simulations.length)];
}

export { getPersonasBySet, getPersonaById } from './personas';
export { generateScenarioForPersona } from './scenarios';
