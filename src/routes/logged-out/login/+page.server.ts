import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";

import { db } from "$lib/server/db";
import { teachers, teacherSessions } from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();

    const name = String(formData.get("name") ?? "").trim();
    const idNumber = String(formData.get("idNumber") ?? "").trim();

    if (!name || !idNumber) {
      return fail(400, { error: "Please fill in both fields." });
    }

    // Find teacher by exact match (name + id_number)
    const teacher = db
      .select({ id: teachers.id })
      .from(teachers)
      .where(and(eq(teachers.name, name), eq(teachers.idNumber, idNumber)))
      .get();

    if (!teacher) {
      return fail(400, { error: "Incorrect name or ID number." });
    }

    const token = crypto.randomUUID();

    await db.insert(teacherSessions).values({
      teacherId: teacher.id,
      token,
    });

    cookies.set("teacher_session", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 14
    });

    throw redirect(303, "/logged-in/students");
  }
};
