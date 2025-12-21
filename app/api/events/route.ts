import { NextRequest } from "next/server";

const clients = new Set<ReadableStreamDefaultController>();

export async function GET(req: NextRequest) {
  console.log("📡 New SSE connection request received");

  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);
      console.log(`✅ Client added. Total clients: ${clients.size}`);

      // Send initial connection message
      const connectMessage = `: connected\n\n`;
      controller.enqueue(new TextEncoder().encode(connectMessage));

      // Send keep-alive every 30 seconds
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`: keep-alive\n\n`));
        } catch (e) {
          console.error("Keep-alive failed:", e);
          clearInterval(keepAlive);
          clients.delete(controller);
        }
      }, 30000);

      req.signal.addEventListener("abort", () => {
        console.log(
          `❌ Client disconnected. Remaining clients: ${clients.size - 1}`
        );
        clearInterval(keepAlive);
        clients.delete(controller);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering for nginx
    },
  });
}

export function broadcastMessage(message: unknown) {
  console.log(`📢 Broadcasting message to ${clients.size} clients:`, message);

  if (clients.size === 0) {
    console.warn("⚠️ No clients connected to broadcast to!");
    return;
  }

  const data = `data: ${JSON.stringify(message)}\n\n`;

  clients.forEach((controller) => {
    try {
      controller.enqueue(new TextEncoder().encode(data));
      console.log("✅ Message sent to client");
    } catch (e) {
      console.error("❌ Failed to send message to client:", e);
      clients.delete(controller);
    }
  });
}
