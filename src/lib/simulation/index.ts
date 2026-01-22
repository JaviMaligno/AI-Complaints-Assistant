// Main exports for simulation module
export {
  createSimulationRun,
  runSingleSimulation,
  runSimulationBatch,
  getSimulationRun,
  getSimulationById,
  getRandomCompletedSimulation,
  getPersonasBySet,
  getPersonaById,
  generateScenarioForPersona,
} from './controller';

export {
  generateCustomerResponse,
  evaluateIfConversationComplete,
} from './customer-simulator';

export {
  evaluateConversation,
  assessResolutionMatch,
} from './evaluator';

export {
  calculateMetrics,
  getRecentRunsMetrics,
  getMetricsTrend,
} from './metrics';

export { STANDARD_PERSONAS } from './personas/standard';
export { ADVERSARIAL_PERSONAS } from './personas/adversarial';
export { TEST_CUSTOMERS } from './scenarios/templates';

// Re-export types
export type {
  CustomerPersona,
  PersonaTraits,
  CommunicationStyle,
  ExpectedResolution,
  SimulationScenario,
  SuccessCriteria,
  SimulationConfig,
  CustomerResponse,
  SimulationResult,
  SimulationMetrics,
  PersonaMetrics,
  ScenarioMetrics,
  EvaluationResult,
} from '@/types/simulation';
