import { getInstagramUsernameById, saveMessage } from "@/app/actions";
import { Message, MessagingEvent } from "@/lib/types";
import { formatTimestampToDate } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { broadcastMessage } from "../events/route";

const VERIFY_TOKEN = process.env.IG_WEBHOOK_VERIFY_TOKEN;

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Handle messages received events
  if (
    body.object === "instagram" &&
    body.entry[0]?.messaging[0]?.message?.text
  ) {
    const messagingEvent: MessagingEvent = {
      senderId: body.entry[0].messaging[0].sender.id,
      timestamp: body.entry[0].messaging[0].timestamp,
      message: body.entry[0].messaging[0].message.text,
    };

    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();

    if (!accessToken) {
      console.error("No access token available for webhook processing");
      return new NextResponse(null, { status: 200 }); // Still acknowledge
    }

    const usernameResult = await getInstagramUsernameById(
      accessToken,
      messagingEvent.senderId
    );

    if (usernameResult.success) {
      const message: Message = {
        username: `@${usernameResult.data}`,
        content: messagingEvent.message,
        timestamp: formatTimestampToDate(messagingEvent.timestamp),
      };
      // Store in Redis
      await saveMessage(message);

      // Broadcast to connected clients via SSE
      broadcastMessage(message);
    }
  }
  // Acknowledge receipt immediately
  return new NextResponse(null, { status: 200 });
}
