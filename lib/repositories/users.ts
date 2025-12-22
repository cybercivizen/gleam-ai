// create user repository functions here

import { prisma } from "../prisma";
import { User } from "../types";

export async function createUser(user: User) {
  try {
    const data = await prisma.users.create({
      data: {
        username: user.username.replace(/^@/, ""),
        access_token: user.accessToken,
        last_access: user.lastAccess,
        date_created: user.createdAt,
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
