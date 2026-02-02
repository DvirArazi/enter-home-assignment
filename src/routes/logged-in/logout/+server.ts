import { redirect, type RequestHandler } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { teacherSessions } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

export const POST: RequestHandler = async ({ cookies }) => {
  const token = cookies.get("teacher_session");

  if (token) {
    db.delete(teacherSessions).where(eq(teacherSessions.token, token)).run();
  }

  cookies.delete("teacher_session", { path: "/" });
  throw redirect(303, "/logged-out/login");
};
