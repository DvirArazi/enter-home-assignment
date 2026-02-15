import { getSessionUser } from "$lib/server/session";
import { db } from "$lib/server/db";
import { classrooms, tasks } from "$lib/server/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { error, fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

const parseClassroomId = (rawClassroomId: string) => {
  const classroomId = Number(rawClassroomId);

  if (!Number.isInteger(classroomId) || classroomId < 0) {
    throw error(404, "Classroom not found");
  }

  return classroomId;
};

const requireTeacherClassroom = (
  cookies: Parameters<PageServerLoad>[0]["cookies"],
  rawClassroomId: string,
) => {
  const user = getSessionUser(cookies);

  if (!user) {
    throw redirect(303, "/");
  }

  if (user.role !== "teacher") {
    throw redirect(303, "/registered/student");
  }

  const classroomId = parseClassroomId(rawClassroomId);

  const classroom = db
    .select({ id: classrooms.id })
    .from(classrooms)
    .where(and(eq(classrooms.id, classroomId), eq(classrooms.teacherId, user.id)))
    .get();

  if (!classroom) {
    throw error(404, "Classroom not found");
  }

  return classroomId;
};

export const load: PageServerLoad = async ({ parent }) => {
  const { classroom } = await parent();

  const classroomTasks = db
    .select({
      id: tasks.id,
      title: tasks.title,
      submissionDate: tasks.submissionDate,
    })
    .from(tasks)
    .where(eq(tasks.classroomId, classroom.id))
    .orderBy(asc(tasks.id))
    .all();

  return {
    tasks: classroomTasks,
  };
};

export const actions: Actions = {
  createTask: async ({ cookies, params }) => {
    const classroomId = requireTeacherClassroom(cookies, params.classroomId);
    const submissionDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);

    const insertResult = db.insert(tasks).values({
      title: "New Task",
      instructions: "",
      submissionDate,
      classroomId,
    }).run();

    const newTaskId = Number(insertResult.lastInsertRowid);

    if (!Number.isFinite(newTaskId)) {
      throw error(500, "Could not create task");
    }

    throw redirect(303, `/registered/teacher/task-edit/${newTaskId}`);
  },
  deleteTask: async ({ cookies, params, request }) => {
    const classroomId = requireTeacherClassroom(cookies, params.classroomId);
    const formData = await request.formData();
    const taskIdValue = formData.get("taskId");
    const taskId = typeof taskIdValue === "string" ? Number(taskIdValue) : Number.NaN;

    if (!Number.isInteger(taskId) || taskId < 0) {
      return fail(400, { deleteError: "Invalid task id." });
    }

    const existingTask = db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.classroomId, classroomId)))
      .get();

    if (!existingTask) {
      return fail(404, { deleteError: "Task not found." });
    }

    db.delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.classroomId, classroomId)))
      .run();

    throw redirect(303, `/registered/teacher/classroom/${classroomId}/tasks`);
  },
};
