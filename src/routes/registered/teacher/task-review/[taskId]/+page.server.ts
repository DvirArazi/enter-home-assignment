import { getSessionUser } from "$lib/server/session";
import { db } from "$lib/server/db";
import {
  classrooms,
  enrollments,
  submissionFiles,
  submissions,
  tasks,
  users,
} from "$lib/server/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { error, fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

const parseTaskId = (rawTaskId: string) => {
  const taskId = Number(rawTaskId);

  if (!Number.isInteger(taskId) || taskId < 0) {
    throw error(404, "Task not found");
  }

  return taskId;
};

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const getTeacherTask = (
  cookies: Parameters<PageServerLoad>[0]["cookies"],
  rawTaskId: string,
) => {
  const user = getSessionUser(cookies);

  if (!user) {
    throw redirect(303, "/");
  }

  if (user.role !== "teacher") {
    throw redirect(303, "/registered/student");
  }

  const taskId = parseTaskId(rawTaskId);
  const task = db
    .select({
      id: tasks.id,
      title: tasks.title,
      classroomId: tasks.classroomId,
    })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .get();

  if (!task) {
    throw error(404, "Task not found");
  }

  const teacherClassroom = db
    .select({ id: classrooms.id })
    .from(classrooms)
    .where(and(eq(classrooms.id, task.classroomId), eq(classrooms.teacherId, user.id)))
    .get();

  if (!teacherClassroom) {
    throw error(404, "Task not found");
  }

  return task;
};

export const load: PageServerLoad = async ({ params, cookies }) => {
  const task = getTeacherTask(cookies, params.taskId);

  const classroomStudents = db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      idNumber: users.idNumber,
    })
    .from(enrollments)
    .innerJoin(users, eq(users.id, enrollments.studentId))
    .where(and(eq(enrollments.classroomId, task.classroomId), eq(users.role, "student")))
    .orderBy(asc(users.lastName), asc(users.firstName), asc(users.id))
    .all();

  const taskSubmissions = db
    .select({
      id: submissions.id,
      studentId: submissions.studentId,
      submittedAt: submissions.submittedAt,
      gradeScore: submissions.gradeScore,
    })
    .from(submissions)
    .where(eq(submissions.taskId, task.id))
    .all();

  const taskSubmissionFiles = db
    .select({
      submissionId: submissionFiles.submissionId,
      name: submissionFiles.name,
      url: submissionFiles.url,
    })
    .from(submissionFiles)
    .innerJoin(submissions, eq(submissions.id, submissionFiles.submissionId))
    .where(eq(submissions.taskId, task.id))
    .orderBy(asc(submissionFiles.id))
    .all();

  const filesBySubmissionId = new Map<number, { name: string; url: string }[]>();

  for (const file of taskSubmissionFiles) {
    const existingFiles = filesBySubmissionId.get(file.submissionId) ?? [];
    existingFiles.push({ name: file.name, url: file.url });
    filesBySubmissionId.set(file.submissionId, existingFiles);
  }

  const submissionByStudentId = new Map(
    taskSubmissions.map((submission) => [submission.studentId, submission]),
  );

  const submissionsByStudent = classroomStudents.map((student) => {
    const submission = submissionByStudentId.get(student.id);
    const files = submission ? (filesBySubmissionId.get(submission.id) ?? []) : [];

    return {
      submissionId: submission?.id ?? null,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      idNumber: student.idNumber,
      submittedAt: submission?.submittedAt?.toISOString() ?? null,
      gradeScore: submission?.gradeScore ?? null,
      files,
    };
  });

  return {
    task,
    submissions: submissionsByStudent,
  };
};

export const actions: Actions = {
  renameTask: async ({ params, cookies, request }) => {
    const task = getTeacherTask(cookies, params.taskId);
    const formData = await request.formData();
    const title = getString(formData, "title");

    if (!title) {
      return fail(400, {
        renameTaskError: "Task name is required.",
        renameTaskValues: { title },
      });
    }

    db.update(tasks).set({ title }).where(eq(tasks.id, task.id)).run();

    throw redirect(303, `/registered/teacher/task-review/${task.id}`);
  },
  updateGrade: async ({ params, cookies, request }) => {
    const task = getTeacherTask(cookies, params.taskId);
    const formData = await request.formData();
    const submissionIdRaw = getString(formData, "submissionId");
    const gradeRaw = getString(formData, "grade");
    const gradeValues = {
      submissionId: submissionIdRaw,
      grade: gradeRaw,
    };

    const submissionId = Number(submissionIdRaw);

    if (!Number.isInteger(submissionId) || submissionId < 0) {
      return fail(400, {
        gradeError: "Invalid submission id.",
        gradeValues,
      });
    }

    if (!gradeRaw) {
      return fail(400, {
        gradeError: "Grade is required.",
        gradeValues,
      });
    }

    if (!/^\d+$/.test(gradeRaw)) {
      return fail(400, {
        gradeError: "Grade must be an integer.",
        gradeValues,
      });
    }

    const gradeScore = Number(gradeRaw);

    if (gradeScore < 0 || gradeScore > 100) {
      return fail(400, {
        gradeError: "Grade must be between 0 and 100.",
        gradeValues,
      });
    }

    const submission = db
      .select({
        id: submissions.id,
        submittedAt: submissions.submittedAt,
      })
      .from(submissions)
      .where(and(eq(submissions.id, submissionId), eq(submissions.taskId, task.id)))
      .get();

    if (!submission || submission.submittedAt === null) {
      return fail(404, {
        gradeError: "Submission not found.",
        gradeValues,
      });
    }

    db.update(submissions)
      .set({ gradeScore })
      .where(eq(submissions.id, submission.id))
      .run();

    throw redirect(303, `/registered/teacher/task-review/${task.id}`);
  },
};
