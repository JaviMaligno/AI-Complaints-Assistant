import { NextResponse } from 'next/server';
import { getRandomCompletedSimulation } from '@/lib/simulation';

// GET /api/simulations/demo - Get a random simulation for demo replay
export async function GET() {
  try {
    const simulation = await getRandomCompletedSimulation();

    if (!simulation) {
      return NextResponse.json(
        { success: false, error: 'No completed simulations available for demo' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: simulation.id,
        personaName: simulation.personaName,
        scenarioType: simulation.scenarioType,
        scenarioDescription: simulation.scenarioDescription,
        wasResolved: simulation.wasResolved,
        wasEscalated: simulation.wasEscalated,
        simulatedCsat: simulation.simulatedCsat,
        messages: simulation.messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          intent: m.intent,
          confidence: m.confidence,
          responseLatency: m.responseLatency,
          actionTaken: m.actionTaken,
          emotionLevel: m.emotionLevel,
        })),
      },
    });
  } catch (error) {
    console.error('Failed to get demo simulation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get demo simulation' },
      { status: 500 }
    );
  }
}
