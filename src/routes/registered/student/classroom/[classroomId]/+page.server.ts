import { getSessionUser } from "$lib/server/session";
import { db } from "$lib/server/db";
import { classrooms, enrollments, submissions, tasks } from "$lib/server/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

const parseClassroomId = (rawClassroomId: string) => {
  const classroomId = Number(rawClassroomId);

  if (!Number.isInteger(classroomId) || classroomId < 0) {
    throw error(404, "Classroom not found");
  }

  return classroomId;
};

const requireStudent = (cookies: Parameters<PageServerLoad>[0]["cookies"]) => {
  const user = getSessionUser(cookies);

  if (!user) {
    throw redirect(303, "/");
  }

  if (user.role !== "student") {
    throw redirect(303, "/registered/teacher");
  }

  return user;
};

export const load: PageServerLoad = async ({ cookies, params }) => {
  const user = requireStudent(cookies);
  const classroomId = parseClassroomId(params.classroomId);

  const classroom = db
    .select({
      id: classrooms.id,
      name: classrooms.name,
    })
    .from(classrooms)
    .innerJoin(enrollments, eq(enrollments.classroomId, classrooms.id))
    .where(and(eq(classrooms.id, classroomId), eq(enrollments.studentId, user.id)))
    .get();

  if (!classroom) {
    throw error(404, "Classroom not found");
  }

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

  const studentSubmissions = db
    .select({
      taskId: submissions.taskId,
      gradeScore: submissions.gradeScore,
      submittedAt: submissions.submittedAt,
    })
    .from(submissions)
    .innerJoin(tasks, eq(tasks.id, submissions.taskId))
    .where(and(eq(submissions.studentId, user.id), eq(tasks.classroomId, classroom.id)))
    .all();

  const submissionByTaskId = new Map(
    studentSubmissions.map((submission) => [submission.taskId, submission]),
  );

  const tasksWithStatus = classroomTasks.map((task) => {
    const submission = submissionByTaskId.get(task.id);

    if (submission && submission.gradeScore !== null) {
      return {
        id: task.id,
        title: task.title,
        dueDate: task.submissionDate.toISOString(),
        status: "graded" as const,
        gradeScore: submission.gradeScore,
      };
    }

    if (submission && submission.submittedAt !== null) {
      return {
        id: task.id,
        title: task.title,
        dueDate: task.submissionDate.toISOString(),
        status: "submitted" as const,
        gradeScore: null,
      };
    }

    return {
      id: task.id,
      title: task.title,
      dueDate: task.submissionDate.toISOString(),
      status: "due" as const,
      gradeScore: null,
    };
  });

  return {
    classroom,
    tasks: tasksWithStatus,
  };
};
