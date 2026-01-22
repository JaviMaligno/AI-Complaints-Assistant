import { generateContentMain, generateContentFast, parseJsonResponse } from "./gemini";
import { INTENT_PROMPT, buildConversationPrompt, WELCOME_MESSAGE } from "./prompts";
import { runGuardrails, isRefundAuthorized } from "./guardrails";
import { prisma } from "@/lib/db/prisma";
import { generateComplaintRef } from "@/lib/utils/formatting";
import type {
  AIResponse,
  Intent,
  CustomerContext,
  OrderContext,
  ChatMessage,
} from "@/types";

interface IntentClassification {
  intent: Intent;
  confidence: number;
  entities: {
    order_number?: string;
    vehicle_reg?: string;
    email?: string;
    amount?: number;
    name?: string;
  };
}

/**
 * Classify the intent of a customer message
 */
async function classifyIntent(message: string): Promise<IntentClassification> {
  const prompt = INTENT_PROMPT + message;

  try {
    const response = await generateContentFast(prompt);
    return parseJsonResponse<IntentClassification>(response);
  } catch (error) {
    console.error("Intent classification failed:", error);
    return {
      intent: "OTHER",
      confidence: 0.5,
      entities: {},
    };
  }
}

/**
 * Look up customer by email or order number
 */
async function lookupCustomer(
  email?: string,
  orderNumber?: string,
  vehicleReg?: string
): Promise<CustomerContext | null> {
  let customer = null;

  if (email) {
    customer = await prisma.customer.findUnique({
      where: { email },
      include: {
        orders: true,
        complaints: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
            },
          },
        },
      },
    });
  }

  if (!customer && orderNumber) {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        customer: {
          include: {
            orders: true,
            complaints: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                },
              },
            },
          },
        },
      },
    });
    customer = order?.customer;
  }

  if (!customer && vehicleReg) {
    const order = await prisma.order.findFirst({
      where: { vehicleReg: vehicleReg.toUpperCase().replace(/\s+/g, " ") },
      include: {
        customer: {
          include: {
            orders: true,
            complaints: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                },
              },
            },
          },
        },
      },
    });
    customer = order?.customer;
  }

  if (!customer) return null;

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone || undefined,
    orders: customer.orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      vehicleReg: o.vehicleReg,
      vehicleMake: o.vehicleMake,
      vehicleModel: o.vehicleModel,
      vehicleYear: o.vehicleYear,
      purchasePrice: o.purchasePrice,
      deliveryStatus: o.deliveryStatus as OrderContext["deliveryStatus"],
      deliveryDate: o.deliveryDate || undefined,
      deliveryAddress: o.deliveryAddress,
      warrantyExpiry: o.warrantyExpiry,
      warrantyType: o.warrantyType as OrderContext["warrantyType"],
      accessories: JSON.parse(o.accessories) as string[],
      accessoriesDelivered: o.accessoriesDelivered,
    })),
    previousComplaints: customer.complaints.length,
  };
}

/**
 * Get or create a conversation
 */
async function getOrCreateConversation(
  conversationId: string | null,
  customerId?: string
): Promise<string> {
  if (conversationId) {
    const existing = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (existing) return existing.id;
  }

  // Create new conversation
  const conversation = await prisma.conversation.create({
    data: {
      customerId: customerId || null,
      channel: "WEBCHAT",
      status: "ACTIVE",
    },
  });

  return conversation.id;
}

/**
 * Save a message to the database
 */
async function saveMessage(
  conversationId: string,
  role: "USER" | "ASSISTANT",
  content: string,
  intent?: Intent,
  confidence?: number,
  sentiment?: number
): Promise<void> {
  await prisma.message.create({
    data: {
      conversationId,
      role,
      content,
      intent,
      confidence,
      sentiment,
    },
  });
}

/**
 * Create a complaint record
 */
async function createComplaint(
  customerId: string,
  orderId: string | null,
  category: string,
  priority: string = "NORMAL"
): Promise<string> {
  const complaint = await prisma.complaint.create({
    data: {
      referenceNumber: generateComplaintRef(),
      customerId,
      orderId,
      category,
      priority,
      status: "OPEN",
    },
  });

  return complaint.id;
}

/**
 * Execute an action (refund, reship, etc.)
 */
async function executeAction(
  action: AIResponse["action"],
  complaintId: string
): Promise<{ success: boolean; description: string }> {
  if (!action) return { success: false, description: "No action specified" };

  const { type, params } = action;

  switch (type) {
    case "REFUND": {
      const amount = params.amount as number;
      if (!isRefundAuthorized(amount)) {
        return {
          success: false,
          description: `Refund of £${amount} exceeds AI authority limit`,
        };
      }

      await prisma.complaintAction.create({
        data: {
          complaintId,
          actionType: "REFUND",
          status: "EXECUTED",
          amount,
          description: `Refund of £${amount} processed`,
          authorizedBy: "AI",
          executedAt: new Date(),
        },
      });

      return { success: true, description: `Refund of £${amount} processed` };
    }

    case "RESHIP": {
      const item = params.item as string;
      await prisma.complaintAction.create({
        data: {
          complaintId,
          actionType: "RESHIP",
          status: "EXECUTED",
          description: `Replacement ${item} to be shipped`,
          authorizedBy: "AI",
          executedAt: new Date(),
        },
      });

      return { success: true, description: `Replacement ${item} arranged` };
    }

    case "COMPENSATION": {
      const value = params.value as number;
      const discountType = params.type as string;
      await prisma.complaintAction.create({
        data: {
          complaintId,
          actionType: "COMPENSATION",
          status: "EXECUTED",
          amount: value,
          description: `${discountType}: £${value} credit/discount issued`,
          authorizedBy: "AI",
          executedAt: new Date(),
        },
      });

      return { success: true, description: `Compensation of £${value} issued` };
    }

    case "CREATE_TICKET": {
      const description = params.description as string;
      await prisma.complaintAction.create({
        data: {
          complaintId,
          actionType: "CREATE_TICKET",
          status: "EXECUTED",
          description: `Internal ticket created: ${description}`,
          authorizedBy: "AI",
          executedAt: new Date(),
        },
      });

      return { success: true, description: "Internal ticket created" };
    }

    case "SCHEDULE_CALLBACK": {
      await prisma.complaintAction.create({
        data: {
          complaintId,
          actionType: "SCHEDULE_CALLBACK",
          status: "PENDING",
          description: "Human callback scheduled within 2 hours",
          authorizedBy: "AI",
        },
      });

      return { success: true, description: "Callback scheduled" };
    }

    case "ESCALATE": {
      const reason = params.reason as string;
      await prisma.complaintAction.create({
        data: {
          complaintId,
          actionType: "ESCALATE",
          status: "EXECUTED",
          description: `Escalated to human team: ${reason}`,
          authorizedBy: "AI",
          executedAt: new Date(),
        },
      });

      // Update complaint status
      await prisma.complaint.update({
        where: { id: complaintId },
        data: {
          status: "ESCALATED",
          escalatedReason: reason,
        },
      });

      return { success: true, description: `Escalated: ${reason}` };
    }

    default:
      return { success: false, description: `Unknown action type: ${type}` };
  }
}

/**
 * Main orchestrator function - process a customer message
 */
export async function processMessage(
  message: string,
  conversationId: string | null,
  existingContext?: CustomerContext
): Promise<{
  response: string;
  conversationId: string;
  intent?: Intent;
  confidence?: number;
  actionTaken?: { type: string; description: string };
  shouldEscalate: boolean;
  escalateReason?: string;
  customerContext?: CustomerContext;
  blocked?: boolean;
}> {
  // Run guardrails
  const guardrails = runGuardrails(message);
  const sanitizedMessage = guardrails.sanitizedMessage;

  // Block HIGH severity injection attempts
  if (guardrails.injection.shouldBlock && guardrails.injection.blockResponse) {
    const convId = await getOrCreateConversation(conversationId, existingContext?.id);
    await saveMessage(convId, "USER", sanitizedMessage);
    await saveMessage(convId, "ASSISTANT", guardrails.injection.blockResponse);

    return {
      response: guardrails.injection.blockResponse,
      conversationId: convId,
      intent: "OTHER",
      confidence: 1.0,
      shouldEscalate: false,
      blocked: true,
    };
  }

  // Check for immediate escalation triggers
  if (guardrails.escalation.shouldEscalate) {
    // Try to look up customer from message content
    let customerContext = existingContext;
    if (!customerContext) {
      const emailMatch = sanitizedMessage.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) {
        customerContext = await lookupCustomer(emailMatch[0]) || undefined;
      }
    }

    const convId = await getOrCreateConversation(conversationId, customerContext?.id);
    await saveMessage(convId, "USER", sanitizedMessage);

    const escalationResponse = generateEscalationResponse(guardrails.escalation.reason!);
    await saveMessage(convId, "ASSISTANT", escalationResponse);

    // Create escalated complaint if we have customer context
    if (customerContext) {
      const complaintId = await createComplaint(
        customerContext.id,
        customerContext.orders[0]?.id || null,
        "VEHICLE_CONDITION", // Safety issues typically relate to vehicle
        "URGENT"
      );
      await executeAction(
        { type: "ESCALATE", params: { reason: guardrails.escalation.reason! } },
        complaintId
      );
    }

    return {
      response: escalationResponse,
      conversationId: convId,
      shouldEscalate: true,
      escalateReason: guardrails.escalation.reason!,
      customerContext,
    };
  }

  // Check for vulnerability
  if (guardrails.vulnerability.isVulnerable) {
    // Try to look up customer from message content
    let customerContext = existingContext;
    if (!customerContext) {
      const emailMatch = sanitizedMessage.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) {
        customerContext = await lookupCustomer(emailMatch[0]) || undefined;
      }
    }

    const convId = await getOrCreateConversation(conversationId, customerContext?.id);
    await saveMessage(convId, "USER", sanitizedMessage);

    const vulnerableResponse = generateVulnerableCustomerResponse();
    await saveMessage(convId, "ASSISTANT", vulnerableResponse);

    // Create escalated complaint for vulnerable customer
    if (customerContext) {
      const complaintId = await createComplaint(
        customerContext.id,
        customerContext.orders[0]?.id || null,
        "COMMUNICATION",
        "HIGH"
      );
      await executeAction(
        { type: "ESCALATE", params: { reason: `Vulnerable customer: ${guardrails.vulnerability.signals.join(", ")}` } },
        complaintId
      );
    }

    return {
      response: vulnerableResponse,
      conversationId: convId,
      shouldEscalate: true,
      escalateReason: `Vulnerability detected: ${guardrails.vulnerability.signals.join(", ")}`,
      customerContext,
    };
  }

  // Classify intent
  const classification = await classifyIntent(sanitizedMessage);

  // Try to look up customer if we have identifying info
  let customerContext = existingContext;
  if (!customerContext) {
    const { entities } = classification;
    customerContext =
      (await lookupCustomer(entities.email, entities.order_number, entities.vehicle_reg)) ||
      undefined;
  }

  // Get conversation
  const convId = await getOrCreateConversation(conversationId, customerContext?.id);
  await saveMessage(convId, "USER", sanitizedMessage, classification.intent, classification.confidence);

  // Get conversation history
  const history = await prisma.message.findMany({
    where: { conversationId: convId },
    orderBy: { createdAt: "asc" },
    take: 20, // Last 20 messages
  });

  const messages = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Build the prompt and get AI response
  const prompt = buildConversationPrompt(
    messages,
    customerContext,
    customerContext?.orders[0] // Use first order as context
  );

  let aiResponse: AIResponse;
  try {
    const rawResponse = await generateContentMain(prompt);
    aiResponse = parseJsonResponse<AIResponse>(rawResponse);
  } catch (error) {
    console.error("AI response generation failed:", error);
    aiResponse = {
      message: "I apologize, but I'm having trouble processing your request right now. Would you like me to connect you with a member of our team?",
      intent: "OTHER",
      confidence: 0.5,
      action: null,
      shouldEscalate: false,
      escalateReason: null,
      dataNeeded: null,
    };
  }

  // Save the response
  await saveMessage(convId, "ASSISTANT", aiResponse.message);

  // Execute any actions
  let actionTaken: { type: string; description: string } | undefined;
  if (aiResponse.action && customerContext) {
    // Create or get complaint
    const complaintId = await createComplaint(
      customerContext.id,
      customerContext.orders[0]?.id || null,
      mapIntentToCategory(aiResponse.intent)
    );

    const result = await executeAction(aiResponse.action, complaintId);
    if (result.success) {
      actionTaken = {
        type: aiResponse.action.type,
        description: result.description,
      };
    }
  }

  return {
    response: aiResponse.message,
    conversationId: convId,
    intent: aiResponse.intent,
    confidence: aiResponse.confidence,
    actionTaken,
    shouldEscalate: aiResponse.shouldEscalate,
    escalateReason: aiResponse.escalateReason || undefined,
    customerContext,
  };
}

/**
 * Generate welcome message for new session
 */
export function getWelcomeMessage(): string {
  return WELCOME_MESSAGE;
}

/**
 * Generate escalation response
 */
function generateEscalationResponse(reason: string): string {
  const responses: Record<string, string> = {
    "Legal language detected":
      "I understand this is a serious matter. I'm connecting you with our specialist team who can properly assist with your concerns. A member of our team will call you within 2 hours.",
    "Safety concern detected":
      "Your safety is our absolute priority. I'm immediately escalating this to our specialist vehicle team. Please do not drive the vehicle if you feel it's unsafe. Someone will contact you within 1 hour.",
    "Customer requested human agent":
      "Of course, I'll connect you with a member of our customer care team right away. They'll be able to help you directly. Please hold while I transfer you.",
    "Discrimination concern":
      "I take this very seriously. I'm connecting you with a senior member of our team who will personally handle your concern. You'll receive a call within 1 hour.",
    default:
      "I'm connecting you with a member of our customer care team who will be better placed to help with this. They'll be in touch shortly.",
  };

  return responses[reason] || responses.default;
}

/**
 * Generate response for vulnerable customer detection
 */
function generateVulnerableCustomerResponse(): string {
  return "I hear you, and I want to make sure you get the best possible support. I'm connecting you with a member of our customer care team who has more options available to help. They'll call you within 1 hour. In the meantime, is there anything urgent I can help with right now?";
}

/**
 * Map intent to complaint category
 */
function mapIntentToCategory(intent: Intent): string {
  const mapping: Record<Intent, string> = {
    DELIVERY_STATUS: "DELIVERY",
    DELIVERY_PROBLEM: "DELIVERY",
    VEHICLE_DEFECT: "VEHICLE_CONDITION",
    MISSING_ITEM: "MISSING_ITEMS",
    REFUND_REQUEST: "MISSING_ITEMS",
    WARRANTY_QUESTION: "WARRANTY",
    WARRANTY_CLAIM: "WARRANTY",
    FINANCE_ISSUE: "ADMIN_FINANCE",
    ADMIN_ISSUE: "ADMIN_FINANCE",
    SPEAK_TO_HUMAN: "COMMUNICATION",
    GENERAL_QUESTION: "OTHER",
    GREETING: "OTHER",
    OTHER: "OTHER",
  };

  return mapping[intent] || "OTHER";
}
