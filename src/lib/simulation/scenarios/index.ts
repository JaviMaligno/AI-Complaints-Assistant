import type { SimulationScenario, CustomerPersona } from '@/types/simulation';
import { SCENARIO_TEMPLATES, TEST_CUSTOMERS, generateInitialMessage } from './templates';

export { TEST_CUSTOMERS } from './templates';

export function generateScenarioForPersona(persona: CustomerPersona): SimulationScenario {
  const scenarioType = persona.typicalScenarios[0] || 'GENERAL_QUESTION';
  const template = SCENARIO_TEMPLATES[scenarioType] || {
    category: scenarioType,
    goals: ['Get help with inquiry'],
    maxTurns: 6,
    successCriteria: {},
  };

  const scenario: SimulationScenario = {
    id: `${persona.id}_${scenarioType}_${Date.now()}`,
    name: `${persona.name} - ${scenarioType}`,
    description: persona.description,
    category: template.category || scenarioType,
    customerEmail: TEST_CUSTOMERS.standard.email,
    orderNumber: TEST_CUSTOMERS.standard.orderNumber,
    vehicleReg: TEST_CUSTOMERS.standard.vehicleReg,
    initialMessage: generateInitialMessage(persona),
    goals: template.goals || ['Resolve inquiry'],
    maxTurns: template.maxTurns || 6,
    successCriteria: template.successCriteria || {},
  };

  return scenario;
}

export function generateScenariosForPersonas(personas: CustomerPersona[]): SimulationScenario[] {
  return personas.map(persona => generateScenarioForPersona(persona));
}
