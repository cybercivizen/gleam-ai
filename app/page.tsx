"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Instagram, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import {
  clearCookies,
  setupAccessToken,
  fetchInstagramMessages,
  getStoredToken,
  getUserProfile,
  getWebhookStoredMessages,
} from "./actions";
import { DataTable } from "./(messages)/data-table";
import { columns } from "./(messages)/columns";
import { Message } from "@/lib/types";

export default function Home() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userProfile, setUserProfile] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  const URL = process.env.NEXT_PUBLIC_IG_LOGIN_EMBEDDING_URL as string;

  const fetchMessagesAsync = async () => {
    setIsTableLoading(true);
    setMessages([]);

    const existingToken = await getStoredToken();

    if (existingToken) {
      const instagramMessages = await fetchInstagramMessages(existingToken);
      const webhookResult = await getWebhookStoredMessages();
      const webhookMessages = webhookResult.success ? webhookResult.data : [];

      const allMessages = [...instagramMessages, ...webhookMessages];

      const uniqueMessages = allMessages.filter(
        (msg, index, self) =>
          index ===
          self.findIndex(
            (m) =>
              m.content === msg.content &&
              m.timestamp === msg.timestamp &&
              m.username === msg.username
          )
      );

      uniqueMessages.sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateB - dateA;
      });

      setMessages(uniqueMessages);
    }
    setIsTableLoading(false);
  };

  const handleDisconnect = async () => {
    await clearCookies();
    window.location.reload();
  };

  // Auth setup | Cookies setup | Initial messages load
  useEffect(() => {
    const handleInstagramAuth = async () => {
      const existingToken = await getStoredToken();
      if (existingToken) {
        setHasToken(true);
        console.log("Already authenticated!");

        const profile = await getUserProfile(existingToken);
        if (profile.success) {
          setUserProfile(profile.data);
        }
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      if (code) {
        const token = await setupAccessToken(code);

        setHasToken(true);

        const profile = await getUserProfile(token);
        if (profile.success) {
          setUserProfile(profile.data);
        }

        window.history.replaceState({}, document.title, "/");
      } else {
        setHasToken(false);
      }

      console.log("Welcome to Gleam AI!");
    };

    const fetchMessages = async () => {
      await fetchMessagesAsync();
    };

    handleInstagramAuth();
    fetchMessages();
  }, []);

  // SSE setup and event handlers
  useEffect(() => {
    if (!hasToken) return;

    const eventSource = new EventSource("/api/events");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("✅ SSE connection opened successfully");
    };

    eventSource.onmessage = (event) => {
      // Ignore keep-alive messages
      console.log("event", event);
      if (!event.data || event.data.trim() === "") return;

      try {
        const newMessage: Message = JSON.parse(event.data);
        console.log("📨 Received real-time message:", newMessage);

        setMessages((prev) => {
          const exists = prev.some(
            (m) =>
              m.content === newMessage.content &&
              m.timestamp === newMessage.timestamp &&
              m.username === newMessage.username
          );

          if (exists) {
            console.log("⚠️ Duplicate message, skipping");
            return prev;
          }

          console.log("✅ Adding new message to state");
          // Mark message as new for animation
          const messageWithAnimation = { ...newMessage, isNew: true };

          // Remove the isNew flag after animation completes
          setTimeout(() => {
            setMessages((current) =>
              current.map((msg) =>
                msg.content === newMessage.content &&
                msg.timestamp === newMessage.timestamp &&
                msg.username === newMessage.username
                  ? { ...msg, isNew: false }
                  : msg
              )
            );
          }, 500);

          return [messageWithAnimation, ...prev];
        });
      } catch (error) {
        console.error("Failed to parse SSE message:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("❌ SSE error:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [hasToken]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-8">
      <h1 className="text-6xl md:text-7xl font-light italic tracking-tight">
        Gleam<span className="text-white font-bold not-italic"> AI</span>
      </h1>

      {hasToken === null ? (
        <Card className="w-full max-w-xl">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      ) : hasToken ? (
        <Card className="w-full max-w-xl">
          <CardContent>
            {userProfile ? (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex flex-col">
                    <CardTitle className="text-2xl">Welcome Back!</CardTitle>
                    <CardDescription>
                      Your Instagram account is connected
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    {userProfile.profile_picture_url && (
                      <Image
                        src={userProfile.profile_picture_url}
                        alt={userProfile.username}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <p className="font-semibold text-lg">
                          @{userProfile.username}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ID: {userProfile.user_id}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        onClick={handleDisconnect}
                        title="Disconnect"
                        variant="ghost"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="w-full flex flex-col">
                  <Button
                    className="mb-4"
                    onClick={fetchMessagesAsync}
                    disabled={isTableLoading}
                  >
                    {isTableLoading ? "Refreshing..." : "Refresh Messages"}
                  </Button>
                  <DataTable
                    columns={columns}
                    data={messages}
                    isLoading={isTableLoading}
                  />
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Connect Your Instagram</CardTitle>
            <CardDescription>
              Sign in with your Instagram Business account to start analyzing
              your DMs for testimonials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg" asChild>
              <Link href={URL}>
                <Instagram className="mr-2" />
                Sign in with Instagram
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
