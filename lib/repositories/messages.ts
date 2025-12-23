import { prisma } from "@/lib/prisma";
import type { Message } from "@/lib/types";

export async function createMessage(message: Message, instagramId: string) {
  try {
    const user = await prisma.users.findFirst({
      where: {
        instagram_id: instagramId,
      },
    });

    if (!user) {
      throw new Error("User not found for instagramId: " + instagramId);
    }

    const data = await prisma.messages.create({
      data: {
        sender_username: message.username.replace(/^@/, ""),
        content: message.content,
        date: new Date(message.timestamp),
        user_id: user.id,
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

export async function getMessagesByUser(instagramId: string, limit = 100) {
  try {
    const data = await prisma.messages.findMany({
      where: {
        users: {
          instagram_id: instagramId,
        },
      },
      orderBy: { date: "desc" },
      take: limit,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Fetch failed",
      data: [],
    };
  }
}
