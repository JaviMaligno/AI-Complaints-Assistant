/**
 * Vulnerability detection signals
 */
export const VULNERABILITY_SIGNALS = [
  // Financial hardship
  "can't afford",
  "cannot afford",
  "financial hardship",
  "debt",
  "foodbank",
  "food bank",
  "lost my job",
  "lost job",
  "unemployed",
  "benefits",
  "universal credit",
  "struggling financially",
  "can't pay",
  "cannot pay",

  // Health
  "mental health",
  "depression",
  "depressed",
  "anxiety",
  "anxious",
  "disability",
  "disabled",
  "wheelchair",
  "blind",
  "deaf",
  "illness",
  "hospital",
  "cancer",
  "terminal",

  // Life events
  "bereavement",
  "bereaved",
  "died",
  "death",
  "passed away",
  "funeral",
  "divorce",
  "divorced",
  "separated",

  // Age indicators
  "elderly",
  "pension",
  "pensioner",
  "retired",
  "my son is handling",
  "my daughter is handling",
  "my child is handling",
];

/**
 * Immediate escalation trigger patterns
 */
export const ESCALATION_PATTERNS = [
  // Legal
  /\b(solicitor|lawyer|barrister|court|legal action|sue|suing|ombudsman|fca|fos|trading standards)\b/i,

  // Safety concerns
  /\b(dangerous|unsafe|brakes?\s+(fail|failed|failing|issue|problem)|steering\s+(fail|failed|problem)|crash|crashed|accident|injur(y|ed|ies))\b/i,

  // Explicit human request
  /\b(speak to\s+(a\s+)?human|real person|actual person|manager|supervisor|someone else|not a (robot|bot|ai))\b/i,

  // Discrimination
  /\b(discriminat|racist|racism|sexist|sexism|harass|harassment)\b/i,

  // Threats
  /\b(threat|threaten|report you|media|journalist|newspaper|social media blast)\b/i,
];

/**
 * Prompt injection patterns to detect and block
 * Severity levels: HIGH (block immediately), MEDIUM (log and monitor), LOW (log only)
 */
export const INJECTION_PATTERNS: { pattern: RegExp; severity: 'HIGH' | 'MEDIUM' | 'LOW'; description: string }[] = [
  // HIGH severity - clear injection attempts, block immediately
  { pattern: /ignore\s+(previous|all|your)\s+instructions/i, severity: 'HIGH', description: 'Instruction override attempt' },
  { pattern: /disregard\s+(previous|all|the|your)/i, severity: 'HIGH', description: 'Instruction disregard attempt' },
  { pattern: /forget\s+(everything|all|your|previous)/i, severity: 'HIGH', description: 'Memory wipe attempt' },
  { pattern: /you are now\s+(a|an)?/i, severity: 'HIGH', description: 'Role reassignment attempt' },
  { pattern: /new\s+(instructions|rules|persona)/i, severity: 'HIGH', description: 'New instruction injection' },
  { pattern: /override\s+(your|the|all)/i, severity: 'HIGH', description: 'Override attempt' },
  { pattern: /jailbreak/i, severity: 'HIGH', description: 'Jailbreak attempt' },
  { pattern: /DAN\s*mode/i, severity: 'HIGH', description: 'DAN mode attempt' },
  { pattern: /developer\s*mode/i, severity: 'HIGH', description: 'Developer mode attempt' },
  { pattern: /bypass\s+(safety|security|filter|restriction)/i, severity: 'HIGH', description: 'Security bypass attempt' },
  { pattern: /pretend\s+(to be|you're|you are|there are no)/i, severity: 'HIGH', description: 'Pretend/roleplay injection' },

  // MEDIUM severity - suspicious but could be legitimate
  { pattern: /act\s+as\s+(a|an|if)/i, severity: 'MEDIUM', description: 'Role play request' },
  { pattern: /system\s*prompt/i, severity: 'MEDIUM', description: 'System prompt reference' },
  { pattern: /reveal\s+(your|the)\s+(instructions|prompt|rules)/i, severity: 'MEDIUM', description: 'Prompt reveal attempt' },
  { pattern: /what\s+are\s+your\s+(instructions|rules|guidelines)/i, severity: 'MEDIUM', description: 'Instruction query' },
  { pattern: /give\s+me\s+(a|any)\s+refund.*(\d{3,}|unlimited)/i, severity: 'MEDIUM', description: 'Large refund manipulation' },

  // LOW severity - monitor only
  { pattern: /respond\s+only\s+(with|in)/i, severity: 'LOW', description: 'Response format manipulation' },
  { pattern: /from\s+now\s+on/i, severity: 'LOW', description: 'Behavior change request' },
];

/**
 * Check if a message contains vulnerability signals
 */
export function checkVulnerability(message: string): {
  isVulnerable: boolean;
  signals: string[];
} {
  const lowerMessage = message.toLowerCase();
  const foundSignals: string[] = [];

  for (const signal of VULNERABILITY_SIGNALS) {
    if (lowerMessage.includes(signal.toLowerCase())) {
      foundSignals.push(signal);
    }
  }

  return {
    isVulnerable: foundSignals.length > 0,
    signals: foundSignals,
  };
}

/**
 * Check if a message triggers immediate escalation
 */
export function checkEscalationTriggers(message: string): {
  shouldEscalate: boolean;
  reason: string | null;
} {
  for (const pattern of ESCALATION_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      // Determine the reason based on which pattern matched
      if (pattern.source.includes("solicitor|lawyer")) {
        return { shouldEscalate: true, reason: "Legal language detected" };
      }
      if (pattern.source.includes("dangerous|unsafe|brakes")) {
        return { shouldEscalate: true, reason: "Safety concern detected" };
      }
      if (pattern.source.includes("speak to")) {
        return { shouldEscalate: true, reason: "Customer requested human agent" };
      }
      if (pattern.source.includes("discriminat")) {
        return { shouldEscalate: true, reason: "Discrimination concern" };
      }
      if (pattern.source.includes("threat")) {
        return { shouldEscalate: true, reason: "Threat or escalation to media" };
      }
      return { shouldEscalate: true, reason: "Escalation trigger detected" };
    }
  }

  return { shouldEscalate: false, reason: null };
}

/**
 * Check for prompt injection attempts
 */
export function checkPromptInjection(message: string): {
  detected: boolean;
  shouldBlock: boolean;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  patterns: { pattern: string; severity: string; description: string }[];
} {
  const detectedPatterns: { pattern: string; severity: string; description: string }[] = [];
  let highestSeverity: 'HIGH' | 'MEDIUM' | 'LOW' | null = null;

  for (const { pattern, severity, description } of INJECTION_PATTERNS) {
    if (pattern.test(message)) {
      detectedPatterns.push({
        pattern: pattern.source,
        severity,
        description,
      });

      // Track highest severity
      if (severity === 'HIGH' || (severity === 'MEDIUM' && highestSeverity !== 'HIGH')) {
        highestSeverity = severity;
      } else if (severity === 'LOW' && !highestSeverity) {
        highestSeverity = severity;
      }
    }
  }

  return {
    detected: detectedPatterns.length > 0,
    shouldBlock: highestSeverity === 'HIGH',
    severity: highestSeverity,
    patterns: detectedPatterns,
  };
}

/**
 * Sanitize user input (basic)
 */
export function sanitizeInput(message: string): string {
  // Trim whitespace
  let sanitized = message.trim();

  // Limit length
  if (sanitized.length > 2000) {
    sanitized = sanitized.slice(0, 2000);
  }

  return sanitized;
}

/**
 * Check if refund amount is within AI authority
 */
export function isRefundAuthorized(amount: number): boolean {
  const limit = parseInt(process.env.AI_REFUND_LIMIT || "100", 10);
  return amount <= limit;
}

/**
 * Check if discount is within AI authority
 */
export function isDiscountAuthorized(percentOrValue: number, isPercent: boolean): boolean {
  const limit = parseInt(process.env.AI_DISCOUNT_LIMIT || "15", 10);
  if (isPercent) {
    return percentOrValue <= limit;
  }
  // If it's a value, check against £50 max
  return percentOrValue <= 50;
}

/**
 * Safe response for blocked injection attempts
 */
export const INJECTION_BLOCK_RESPONSE =
  "I'm here to help with your Carsa purchase or complaint. Could you please describe the issue you're experiencing with your order or vehicle? I can help with delivery status, missing accessories, refunds up to £100, or connect you with our specialist team.";

/**
 * Run all guardrail checks on a message
 */
export function runGuardrails(message: string): {
  sanitizedMessage: string;
  vulnerability: { isVulnerable: boolean; signals: string[] };
  escalation: { shouldEscalate: boolean; reason: string | null };
  injection: {
    detected: boolean;
    shouldBlock: boolean;
    severity: 'HIGH' | 'MEDIUM' | 'LOW' | null;
    patterns: { pattern: string; severity: string; description: string }[];
    blockResponse?: string;
  };
} {
  const sanitizedMessage = sanitizeInput(message);
  const vulnerability = checkVulnerability(sanitizedMessage);
  const escalation = checkEscalationTriggers(sanitizedMessage);
  const injection = checkPromptInjection(sanitizedMessage);

  // Log injection attempts with severity
  if (injection.detected) {
    const logLevel = injection.severity === 'HIGH' ? 'error' :
                     injection.severity === 'MEDIUM' ? 'warn' : 'info';

    console[logLevel](
      `🚨 SECURITY: Prompt injection ${injection.severity} - ${injection.shouldBlock ? 'BLOCKED' : 'MONITORED'}`,
      {
        severity: injection.severity,
        blocked: injection.shouldBlock,
        patterns: injection.patterns.map(p => p.description),
        messagePreview: sanitizedMessage.slice(0, 100) + (sanitizedMessage.length > 100 ? '...' : ''),
        timestamp: new Date().toISOString(),
      }
    );
  }

  return {
    sanitizedMessage,
    vulnerability,
    escalation,
    injection: {
      ...injection,
      blockResponse: injection.shouldBlock ? INJECTION_BLOCK_RESPONSE : undefined,
    },
  };
}
