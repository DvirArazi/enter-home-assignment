import { redirect, type Handle } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { teacherSessions } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

const STATIC_PREFIXES = ["/_app", "/build", "/@fs", "/@vite"];
const STATIC_PATHS = new Set([
  "/favicon.ico",
  "/favicon.svg",
  "/robots.txt",
  "/manifest.webmanifest"
]);

export const handle: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;

  const isStatic =
    STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    STATIC_PATHS.has(pathname);
  if (isStatic) return resolve(event);

  const token = event.cookies.get("teacher_session");
  const session = token
    ? db
        .select({ id: teacherSessions.id })
        .from(teacherSessions)
        .where(eq(teacherSessions.token, token))
        .get()
    : null;

  const loggedIn = Boolean(session);
  const inLoggedOut = pathname.startsWith("/logged-out");
  const inLoggedIn = pathname.startsWith("/logged-in");

  if (loggedIn) {
    if (!inLoggedIn) throw redirect(302, "/logged-in/students");
    return resolve(event);
  }

  event.cookies.delete("teacher_session", { path: "/" });
  if (!inLoggedOut) throw redirect(302, "/logged-out/login");

  return resolve(event);
};
