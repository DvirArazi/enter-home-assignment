import type { Cookies } from "@sveltejs/kit";
import { hashSessionToken, SESSION_COOKIE_NAME } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { sessions, users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

export const getSessionUser = (cookies: Cookies) => {
  const sessionToken = cookies.get(SESSION_COOKIE_NAME);

  if (!sessionToken) {
    return null;
  }

  const tokenHash = hashSessionToken(sessionToken);

  const session = db
    .select({
      id: sessions.id,
      userId: sessions.userId,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .where(eq(sessions.tokenHash, tokenHash))
    .get();

  if (!session || session.expiresAt.getTime() <= Date.now()) {
    if (session) {
      db.delete(sessions).where(eq(sessions.id, session.id)).run();
    }

    cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
    return null;
  }

  const user = db
    .select({
      id: users.id,
      firstName: users.firstName,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .get();

  if (!user) {
    cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
    return null;
  }

  return user;
};
