"use server";

import { cookies } from "next/headers";

export async function getStoredToken() {
  const cookieStore = await cookies();
  return cookieStore.get("instagram_access_token")?.value || null;
}

export async function getAccessToken(code: string) {
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

export async function getConversations(userToken: string) {
  try {
    const response = await fetch(
      `https://graph.instagram.com/v24.0/me/conversations?platform=instagram&access_token=${userToken}`
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
    console.log("Instagram conversations fetched successfully:", data);
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
    console.log("Conversation messages fetched successfully:", data);
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
    console.log("Message details fetched successfully:", data);
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
