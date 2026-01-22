// ============================================
// SIMULATION TYPES
// ============================================

export interface PersonaTraits {
  patience: number;           // 0-1: How patient before escalating
  techSavvy: number;          // 0-1: Technical sophistication
  assertiveness: number;      // 0-1: How demanding
  emotionalIntensity: number; // 0-1: Emotional expression level
}

export type CommunicationStyle =
  | 'formal'
  | 'casual'
  | 'direct'
  | 'emotional'
  | 'technical'
  | 'conversational'
  | 'factual'
  | 'business'
  | 'demanding'
  | 'inquisitive'
  | 'concerned'
  | 'urgent'
  | 'manipulative'
  | 'persistent';

export type ExpectedResolution =
  | 'AI_RESOLVED'
  | 'AI_RESOLVED_WITH_COMPENSATION'
  | 'AI_RESOLVED_RESHIP'
  | 'AI_RESOLVED_REFUND'
  | 'AI_RESOLVED_TICKET'
  | 'AI_RESOLVED_INFO'
  | 'ESCALATED_VULNERABLE'
  | 'ESCALATED_SAFETY'
  | 'ESCALATED_AUTHORITY_LIMIT'
  | 'ESCALATED_HUMAN_REQUEST'
  | 'BLOCKED'
  | 'BLOCKED_OR_ESCALATED'
  | 'PROPER_BOUNDARY_HANDLING';

export interface CustomerPersona {
  id: string;
  name: string;
  description: string;
  traits: PersonaTraits;
  communicationStyle: CommunicationStyle;
  typicalScenarios: string[];
  samplePhrases: string[];
  vulnerabilitySignals?: string[];
  escalationTriggers?: string[];
  injectionAttempts?: string[];
  expectedResolution: ExpectedResolution;
  refundAmount?: { min: number; max: number };
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  category: string;
  customerEmail?: string;
  orderNumber?: string;
  vehicleReg?: string;
  initialMessage: string;
  goals: string[];
  maxTurns: number;
  successCriteria: SuccessCriteria;
}

export interface SuccessCriteria {
  mustResolve?: boolean;
  mustEscalate?: boolean;
  mustBlock?: boolean;
  maxTurns?: number;
  actionRequired?: string;
  informationProvided?: string[];
}

export interface SimulationConfig {
  runName: string;
  personaSet: 'standard' | 'edge_cases' | 'adversarial' | 'all';
  parallelism: number;
  timeoutSeconds: number;
  evaluateQuality: boolean;
}

export interface CustomerResponse {
  message: string;
  intent: string;
  emotionLevel: number;
  isFinished: boolean;
  finishReason: 'satisfied' | 'escalated' | 'frustrated' | 'confused' | null;
}

export interface SimulationResult {
  simulationId: string;
  personaId: string;
  scenarioId: string;
  status: 'completed' | 'failed' | 'timeout';
  durationSeconds: number;
  messageCount: number;
  avgResponseLatency: number;
  maxResponseLatency: number;
  wasResolved: boolean;
  wasEscalated: boolean;
  escalateReason?: string;
  actionsTaken: string[];
  simulatedCsat?: number;
  evaluationNotes?: string;
  injectionAttempts: number;
  blockedAttempts: number;
}

export interface SimulationMetrics {
  totalSimulations: number;
  completedSimulations: number;
  failedSimulations: number;
  avgDuration: number;
  avgMessageCount: number;
  avgResponseLatency: number;
  resolutionRate: number;
  escalationRate: number;
  blockRate: number;
  avgSimulatedCsat: number;
  byPersona: Record<string, PersonaMetrics>;
  byScenario: Record<string, ScenarioMetrics>;
}

export interface PersonaMetrics {
  count: number;
  resolutionRate: number;
  avgDuration: number;
  avgCsat: number;
}

export interface ScenarioMetrics {
  count: number;
  resolutionRate: number;
  avgDuration: number;
}

export interface EvaluationResult {
  csatScore: number;
  notes: string;
  appropriateness: number;
  accuracy: number;
}
