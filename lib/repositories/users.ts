// create user repository functions here

import { prisma } from "../prisma";
import { User } from "../types";

export async function createUser(user: User) {
  try {
    const data = await prisma.users.upsert({
      where: {
        instagram_id: user.instagramId,
      },
      update: {
        access_token: user.accessToken,
        last_access: new Date(),
      },
      create: {
        username: user.username.replace(/^@/, ""),
        instagram_id: user.instagramId,
        access_token: user.accessToken,
        last_access: new Date(),
        date_created: new Date(),
      },
    });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to create/update user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upsert failed",
    };
  }
}

export async function updateUserAccessToken(id: number, accessToken: string) {
  try {
    const data = await prisma.users.update({
      where: {
        id: id,
      },
      data: {
        access_token: accessToken,
        last_access: new Date(),
      },
    });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to update user access token:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
}
