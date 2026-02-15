import { getSessionUser } from "$lib/server/session";
import { db } from "$lib/server/db";
import { classrooms } from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";
import { error, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const parseClassroomId = (rawClassroomId: string) => {
  const classroomId = Number(rawClassroomId);

  if (!Number.isInteger(classroomId) || classroomId < 0) {
    throw error(404, "Classroom not found");
  }

  return classroomId;
};

const getTeacherClassroom = (teacherId: number, rawClassroomId: string) => {
  const classroomId = parseClassroomId(rawClassroomId);

  const classroom = db
    .select({
      id: classrooms.id,
      name: classrooms.name,
    })
    .from(classrooms)
    .where(and(eq(classrooms.id, classroomId), eq(classrooms.teacherId, teacherId)))
    .get();

  if (!classroom) {
    throw error(404, "Classroom not found");
  }

  return classroom;
};

const getSafeReturnPath = (candidate: FormDataEntryValue | null, classroomId: number) => {
  if (typeof candidate !== "string") {
    return `/registered/teacher/classroom/${classroomId}/tasks`;
  }

  const expectedPrefix = `/registered/teacher/classroom/${classroomId}/`;
  return candidate.startsWith(expectedPrefix)
    ? candidate
    : `/registered/teacher/classroom/${classroomId}/tasks`;
};

export const POST: RequestHandler = async ({ params, cookies, request }) => {
  const user = getSessionUser(cookies);

  if (!user) {
    throw redirect(303, "/");
  }

  if (user.role !== "teacher") {
    throw redirect(303, "/registered/student");
  }

  const classroom = getTeacherClassroom(user.id, params.classroomId);

  const formData = await request.formData();
  const nameValue = formData.get("name");
  const trimmedName = typeof nameValue === "string" ? nameValue.trim() : "";
  const returnTo = getSafeReturnPath(formData.get("returnTo"), classroom.id);

  if (trimmedName) {
    db.update(classrooms)
      .set({ name: trimmedName })
      .where(eq(classrooms.id, classroom.id))
      .run();
  }

  throw redirect(303, returnTo);
};
