"use server";

import { Message, User } from "@/lib/types";
import { formatTimestampToDate } from "@/lib/utils";
import { cookies } from "next/headers";
import { redis, REDIS_KEYS } from "@/lib/redis";
import { createMessage } from "@/lib/repositories/messages";
import { users } from "@/generated/prisma/client";
import { createUser } from "@/lib/repositories/users";

export async function getStoredToken() {
  const cookieStore = await cookies();
  return cookieStore.get("instagram_access_token")?.value || null;
}

export async function clearCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("instagram_access_token");
  cookieStore.delete("instagram_username");
}

export async function setupAccessToken(code: string) {
  const slv = await getShortLivedToken(code);
  if (!slv.success) {
    throw new Error("Failed to get short-lived token");
  }
  const llv = await getLongLivedToken(slv.data.access_token);
  if (!llv.success) {
    throw new Error("Failed to get long-lived token");
  }
  // setup token in cookies
  const cookieStore = await cookies();
  cookieStore.set("instagram_access_token", llv.data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 60, // 60 days
  });

  return llv.data.access_token;
}

async function getShortLivedToken(code: string) {
  try {
    const params = new URLSearchParams({
      client_id: process.env.INSTAGRAM_CLIENT_ID!,
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
      grant_type: "authorization_code",
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI!,
      code,
    });

    const response = await fetch(
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Instagram API error details:", errorData);
      throw new Error(
        `Instagram API error: ${response.statusText} - ${JSON.stringify(
          errorData
        )}`
      );
    }

    const data = await response.json();
    console.log("Token exchange successful:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to exchange Instagram token:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to exchange token",
    };
  }
}

async function getLongLivedToken(shortLivedToken: string) {
  try {
    const params = new URLSearchParams({
      grant_type: "ig_exchange_token",
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
      access_token: shortLivedToken,
    });

    const response = await fetch(
      `https://graph.instagram.com/access_token?${params.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Instagram long-lived token error details:", errorData);
      throw new Error(
        `Instagram API error: ${response.statusText} - ${JSON.stringify(
          errorData
        )}`
      );
    }

    const data = await response.json();
    console.log("Long-lived token exchange successful:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to get long-lived token:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get long-lived token",
    };
  }
}

export async function getConversations(accessToken: string) {
  try {
    const response = await fetch(
      `https://graph.instagram.com/v24.0/me/conversations?platform=instagram&access_token=${accessToken}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Instagram API error details:", errorData);
      throw new Error(
        `Instagram API error: ${response.statusText} - ${JSON.stringify(
          errorData
        )}`
      );
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch Instagram conversations:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch conversations",
    };
  }
}

export async function getConversationMessages(
  conversationId: string,
  accessToken: string
) {
  try {
    const response = await fetch(
      `https://graph.instagram.com/v24.0/${conversationId}?fields=messages&access_token=${accessToken}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Instagram API error details:", errorData);
      throw new Error(
        `Instagram API error: ${response.statusText} - ${JSON.stringify(
          errorData
        )}`
      );
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch conversation messages:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch messages",
    };
  }
}

export async function getMessageDetails(
  messageId: string,
  accessToken: string
) {
  try {
    const response = await fetch(
      `https://graph.instagram.com/v24.0/${messageId}?fields=id,created_time,from,to,message&access_token=${accessToken}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Instagram API error details:", errorData);
      throw new Error(
        `Instagram API error: ${response.statusText} - ${JSON.stringify(
          errorData
        )}`
      );
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch message details:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch message details",
    };
  }
}

export async function fetchInstagramMessages(accessToken: string) {
  const conversationsResult = await getConversations(accessToken);
  const allConversationsIds = conversationsResult.success
    ? conversationsResult.data.data.map((conv: { id: string }) => conv.id)
    : [];

  // Use Promise.all to wait for all async operations to complete
  const allMessagesIdsArrays = await Promise.all(
    allConversationsIds.map(async (id: string) => {
      const conversationMessages = await getConversationMessages(
        id,
        accessToken
      );
      const messagesIds = conversationMessages.success
        ? conversationMessages.data.messages.data.map(
            (msg: { id: string }) => msg.id
          )
        : [];
      return messagesIds;
    })
  );

  // Flatten the array of arrays into a single array
  const allMessagesIds = allMessagesIdsArrays.flat();

  const allMessagesArrays = await Promise.all(
    allMessagesIds.map(async (msgId: string) => {
      const messageDetails = await getMessageDetails(msgId, accessToken);
      return messageDetails;
    })
  );

  // Map Instagram API response to Message type
  const cookieStore = await cookies();
  const username: string = cookieStore.get("instagram_username")
    ?.value as string;

  const allMessages: Message[] = allMessagesArrays
    .filter(
      (res) =>
        res.success && res.data.from?.username !== username && res.data.message
    )
    .map((res) => {
      return {
        username: "@" + res.data.from?.username,
        content: res.data.message,
        timestamp: formatTimestampToDate(res.data.created_time),
      };
    });
  return allMessages;
}

export async function getUserProfile(accessToken: string) {
  try {
    const response = await fetch(
      `https://graph.instagram.com/v24.0/me?fields=user_id,username,profile_picture_url&access_token=${accessToken}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Instagram API error details:", errorData);
      throw new Error(
        `Instagram API error: ${response.statusText} - ${JSON.stringify(
          errorData
        )}`
      );
    }

    const data = await response.json();
    console.log("User profile fetched successfully:", data);

    const cookieStore = await cookies();
    cookieStore.set("instagram_username", data.username, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 60, // 60 days
    });

    const user: User = {
      username: data.username,
      accessToken: accessToken,
      lastAccess: new Date(),
      createdAt: new Date(),
    };

    await createUser(user);

    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch user profile",
    };
  }
}

export async function getInstagramUsernameById(
  accessToken: string,
  userId: string
) {
  try {
    const response = await fetch(
      `https://graph.instagram.com/v24.0/${userId}?fields=username&access_token=${accessToken}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Instagram API error details:", errorData);
      throw new Error(
        `Instagram API error: ${response.statusText} - ${JSON.stringify(
          errorData
        )}`
      );
    }

    const data = await response.json();
    return { success: true, data: data.username };
  } catch (error) {
    console.error("Failed to fetch username by ID:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch username by ID",
    };
  }
}

// Redis operations
export async function saveMessage(message: Message) {
  try {
    await createMessage({
      username: message.username,
      content: message.content,
      timestamp: message.timestamp,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to save message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save message",
    };
  }
}

export async function getWebhookStoredMessages(limit = 1000) {
  try {
    // Get messages in reverse chronological order (newest first)
    const messages = await redis.zrange(
      REDIS_KEYS.messages,
      0,
      limit - 1,
      "REV"
    );

    const parsedMessages: Message[] = messages.map((msg) => {
      const parsed = JSON.parse(msg);
      // Remove the key field we added for uniqueness
      const { key, ...message } = parsed;
      return message;
    });

    console.log(`📦 Retrieved ${parsedMessages.length} messages from Redis`);
    return { success: true, data: parsedMessages };
  } catch (error) {
    console.error("Failed to fetch messages from Redis:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch messages",
      data: [],
    };
  }
}

export async function clearWebhookMessages() {
  try {
    await redis.del(REDIS_KEYS.messages);
    console.log("🗑️ Cleared all messages from Redis");
    return { success: true };
  } catch (error) {
    console.error("Failed to clear messages from Redis:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to clear messages",
    };
  }
}
