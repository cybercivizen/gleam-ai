import { prisma } from "@/lib/prisma";
import type { Message } from "@/lib/types";

export async function createMessage(message: Message) {
  try {
    const data = await prisma.messages.create({
      data: {
        sender_username: message.username.replace(/^@/, ""),
        content: message.content,
        date: new Date(message.timestamp),
      },
    });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to create message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Create failed",
    };
  }
}

export async function getMessages(limit = 100) {
  try {
    const data = await prisma.messages.findMany({
      orderBy: { date: "desc" },
      take: limit,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Fetch failed",
      data: [] as Message[],
    };
  }
}
