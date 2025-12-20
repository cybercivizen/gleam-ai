"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Instagram } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  getAccessToken,
  getConversationMessages,
  getConversations,
  getMessageDetails,
  getStoredToken,
  getUserProfile,
} from "./actions";

export default function Home() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const handleInstagramAuth = async () => {
      // Check if token already exists
      const existingToken = await getStoredToken();
      if (existingToken) {
        setHasToken(true);
        setAccessToken(existingToken);
        console.log("Already authenticated!");

        // Fetch user profile
        const profile = await getUserProfile(existingToken);
        if (profile.success) {
          setUserProfile(profile.data);
        }

        const conversations = await getConversations(existingToken);
        console.log("Instagram Conversations:", conversations);

        const convId = conversations?.data?.data?.[0]?.id;
        console.log("Extracted Conversation ID:", convId);

        if (convId) {
          console.log("First Conversation ID:", convId);
          const messages = await getConversationMessages(convId, existingToken);
          console.log("Conversation Messages:", messages);
          const messageId = messages?.data?.messages?.data?.[3]?.id;
          if (messageId) {
            console.log("First Message ID:", messageId);
            const messageDetails = await getMessageDetails(
              messageId,
              existingToken
            );
            console.log("Message Details:", messageDetails);
          }
        }
        return;
      }

      //extract code from URL if present
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      if (code) {
        console.log("Authorization code:", code);

        const token = await getAccessToken(code);

        setHasToken(true);
        setAccessToken(token);

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
                  <div className="flex flex-col">
                    <p className="font-semibold text-lg">
                      @{userProfile.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ID: {userProfile.user_id}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <CardTitle className="text-2xl">Welcome Back!</CardTitle>
                <CardDescription>
                  You&apos;re all set to analyze your DMs
                </CardDescription>
              </div>
            )}
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
              <Link href="https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=1520790535695330&redirect_uri=https://9a5b7c1b0363.ngrok-free.app&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights">
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
