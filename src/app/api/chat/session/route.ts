import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWelcomeMessage } from "@/lib/ai/orchestrator";

export async function POST() {
  try {
    // Create a new conversation (customerId will be set when customer is identified)
    const conversation = await prisma.conversation.create({
      data: {
        channel: "WEBCHAT",
        status: "ACTIVE",
      },
    });

    // Save the welcome message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: getWelcomeMessage(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: conversation.id,
        conversationId: conversation.id,
        welcomeMessage: getWelcomeMessage(),
      },
    });
  } catch (error) {
    console.error("Failed to create chat session:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create chat session",
      },
      { status: 500 }
    );
  }
}
