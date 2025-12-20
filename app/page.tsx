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
import { useEffect, useState } from "react";
import {
  clearCookies,
  setupAccessToken,
  getAllMessages,
  getStoredToken,
  getUserProfile,
} from "./actions";
import { DataTable } from "./(messages)/data-table";
import { columns } from "./(messages)/columns";

export default function Home() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userProfile, setUserProfile] = useState<any>(null);
  const [messages, setMessages] = useState<
    Array<{
      username: string;
      content: string;
      timestamp: string;
    }>
  >([]);

  const [isTableLoading, setIsTableLoading] = useState<boolean>(false);

  const URL =
    process.env.NEXT_PUBLIC_IG_LOGIN_EMBEDDING_URL ||
    "https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=1520790535695330&redirect_uri=https://bd89a4fd1c1a.ngrok-free.app&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights";

  const fetchMessagesAsync = async () => {
    setIsTableLoading(true);
    setMessages([]); // Clear messages to show spinner

    const existingToken = await getStoredToken();

    if (existingToken) {
      const allMessages = await getAllMessages(existingToken);
      setMessages(allMessages);
    }
    setIsTableLoading(false);
  };

  const handleDisconnect = async () => {
    await clearCookies();
    window.location.reload();
  };

  useEffect(() => {
    const handleInstagramAuth = async () => {
      // If user already has token stored in cookies
      const existingToken = await getStoredToken();
      if (existingToken) {
        setHasToken(true);
        console.log("Already authenticated!");

        // Fetch user profile
        const profile = await getUserProfile(existingToken);
        if (profile.success) {
          setUserProfile(profile.data);
        }

        await fetchMessagesAsync();

        return;
      }

      //If user not yet authenticated
      //extract code from URL if present
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      if (code) {
        console.log("Authorization code:", code);

        const token = await setupAccessToken(code);

        setHasToken(true);

        // Fetch user profile
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

    handleInstagramAuth();
  }, []);

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
