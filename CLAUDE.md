# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:seed          # Seed mock data (npx tsx prisma/seed.ts)
npm run db:studio        # Open Prisma Studio GUI
```

## Architecture

This is an AI-powered complaints handling system for a UK car retailer. The core flow is:

**Chat Widget → API Route → Orchestrator → Guardrails + Gemini AI → Database**

### Key Components

**`src/lib/ai/orchestrator.ts`** - Main entry point for message processing:
1. Runs guardrails (injection detection, vulnerability, escalation triggers)
2. If HIGH severity injection → returns blocked response immediately
3. If vulnerability/escalation detected → escalates to human
4. Otherwise → classifies intent, looks up customer, generates AI response, executes actions

**`src/lib/ai/guardrails.ts`** - Security and safety layer:
- `INJECTION_PATTERNS`: 18 patterns with HIGH/MEDIUM/LOW severity
- `VULNERABILITY_SIGNALS`: 50+ phrases indicating customer hardship
- `ESCALATION_PATTERNS`: Legal, safety, discrimination triggers
- HIGH severity injections are blocked at application layer, never reach AI

**`src/lib/ai/prompts.ts`** - System prompts and context building:
- `SYSTEM_PROMPT`: Defines AI role, authority limits (£100 refund, 15% discount), escalation rules
- `buildConversationPrompt()`: Injects customer/order context into prompt

**`src/lib/ai/gemini.ts`** - Google Gemini API wrapper with JSON response parsing

### Data Flow

1. `POST /api/chat/message` receives user message
2. `processMessage()` in orchestrator runs full pipeline
3. Customer lookup by email or vehicle registration
4. AI generates JSON response with message, intent, action
5. Actions (REFUND, RESHIP, ESCALATE) executed and logged to ComplaintAction table

### Database Models (Prisma)

- **Conversation** → has many **Message** (chat history)
- **Customer** → has many **Order** and **Complaint**
- **Complaint** → has many **ComplaintAction** (audit trail)
- Conversation can be linked to Customer and/or Complaint

### Authority Limits

Hardcoded in environment and enforced in `guardrails.ts`:
- `AI_REFUND_LIMIT=100` (£100 max)
- `AI_DISCOUNT_LIMIT=15` (15% max)
- Amounts exceeding limits trigger escalation
