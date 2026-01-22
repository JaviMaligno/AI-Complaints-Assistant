import { NextRequest, NextResponse } from "next/server";
import { processMessage } from "@/lib/ai/orchestrator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Message is required",
        },
        { status: 400 }
      );
    }

    // Process the message through the AI orchestrator
    const result = await processMessage(message, sessionId || null);

    return NextResponse.json({
      success: true,
      data: {
        message: result.response,
        conversationId: result.conversationId,
        intent: result.intent,
        confidence: result.confidence,
        actionTaken: result.actionTaken,
        shouldEscalate: result.shouldEscalate,
        escalateReason: result.escalateReason,
      },
    });
  } catch (error) {
    console.error("Failed to process message:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process message",
      },
      { status: 500 }
    );
  }
}
