import { getSessionUser } from "$lib/server/session";
import { db } from "$lib/server/db";
import { classrooms } from "$lib/server/db/schema";
import {
  createUniqueClassroomCode,
  isValidClassroomCode,
} from "$lib/server/classrooms";
import { and, eq } from "drizzle-orm";
import { error, redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

const parseClassroomId = (rawClassroomId: string) => {
  const classroomId = Number(rawClassroomId);

  if (!Number.isInteger(classroomId) || classroomId < 0) {
    throw error(404, "Classroom not found");
  }

  return classroomId;
};

const requireTeacherUser = (cookies: Parameters<LayoutServerLoad>[0]["cookies"]) => {
  const user = getSessionUser(cookies);

  if (!user) {
    throw redirect(303, "/");
  }

  if (user.role !== "teacher") {
    throw redirect(303, "/registered/student");
  }

  return user;
};

const getTeacherClassroom = (teacherId: number, rawClassroomId: string) => {
  const classroomId = parseClassroomId(rawClassroomId);

  let classroom = db
    .select({
      id: classrooms.id,
      name: classrooms.name,
      code: classrooms.code,
    })
    .from(classrooms)
    .where(and(eq(classrooms.id, classroomId), eq(classrooms.teacherId, teacherId)))
    .get();

  if (!classroom) {
    throw error(404, "Classroom not found");
  }

  if (!isValidClassroomCode(classroom.code)) {
    const generatedCode = createUniqueClassroomCode();

    db.update(classrooms)
      .set({ code: generatedCode })
      .where(eq(classrooms.id, classroom.id))
      .run();

    classroom = { ...classroom, code: generatedCode };
  }

  return classroom;
};

export const load: LayoutServerLoad = async ({ params, cookies }) => {
  const user = requireTeacherUser(cookies);
  const classroom = getTeacherClassroom(user.id, params.classroomId);

  return { classroom };
};
