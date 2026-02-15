import { SESSION_COOKIE_NAME, hashSessionToken } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { sessions } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ cookies }) => {
  const sessionToken = cookies.get(SESSION_COOKIE_NAME);

  if (sessionToken) {
    const tokenHash = hashSessionToken(sessionToken);

    db.delete(sessions).where(eq(sessions.tokenHash, tokenHash)).run();
  }

  cookies.delete(SESSION_COOKIE_NAME, { path: "/" });

  throw redirect(303, "/");
};
