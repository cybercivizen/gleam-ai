import Redis from "ioredis";

// Create Redis client (connects to localhost:6379 by default)
export const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      console.error("❌ Redis connection failed after 3 attempts");
      return null; // Stop retrying
    }
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true, // Don't connect immediately
});

redis.on("connect", () => {
  console.log("🔄 Attempting to connect to Redis...");
});

redis.on("ready", () => {
  console.log("✅ Redis connected and ready");
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
});

redis.on("close", () => {
  console.log("⚠️ Redis connection closed");
});

// Attempt to connect when the module is loaded
redis.connect().catch((err) => {
  console.error("❌ Failed to connect to Redis:", err.message);
});

// Key patterns
export const REDIS_KEYS = {
  messages: "gleam:messages", // Sorted set for chronological ordering
} as const;

// Helper to check if Redis is available
export async function isRedisAvailable(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    return false;
  }
}
