import { STANDARD_PERSONAS } from './standard';
import { ADVERSARIAL_PERSONAS } from './adversarial';
import type { CustomerPersona } from '@/types/simulation';

export { STANDARD_PERSONAS } from './standard';
export { ADVERSARIAL_PERSONAS } from './adversarial';

export type PersonaSet = 'standard' | 'edge_cases' | 'adversarial' | 'all';

export function getPersonasBySet(set: PersonaSet): CustomerPersona[] {
  switch (set) {
    case 'standard':
      return STANDARD_PERSONAS;
    case 'adversarial':
      return ADVERSARIAL_PERSONAS;
    case 'edge_cases':
      // Edge cases include vulnerability and escalation scenarios
      return [
        ...STANDARD_PERSONAS.filter(p =>
          p.expectedResolution.includes('ESCALATED') ||
          p.vulnerabilitySignals?.length ||
          p.escalationTriggers?.length
        ),
        ...ADVERSARIAL_PERSONAS.slice(0, 2),
      ];
    case 'all':
      return [...STANDARD_PERSONAS, ...ADVERSARIAL_PERSONAS];
    default:
      return STANDARD_PERSONAS;
  }
}

export function getPersonaById(id: string): CustomerPersona | undefined {
  return [...STANDARD_PERSONAS, ...ADVERSARIAL_PERSONAS].find(p => p.id === id);
}

export function getPersonaCount(set: PersonaSet): number {
  return getPersonasBySet(set).length;
}
