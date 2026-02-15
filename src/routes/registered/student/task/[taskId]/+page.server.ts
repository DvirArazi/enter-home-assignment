import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getSessionUser } from "$lib/server/session";
import { db } from "$lib/server/db";
import {
  enrollments,
  submissionFiles,
  submissions,
  taskFiles,
  tasks,
} from "$lib/server/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { error, fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

type StoredSubmissionFile = {
  name: string;
  url: string;
  mimeType: string | null;
  size: number | null;
};

const parseTaskId = (rawTaskId: string) => {
  const taskId = Number(rawTaskId);

  if (!Number.isInteger(taskId) || taskId < 0) {
    throw error(404, "Task not found");
  }

  return taskId;
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

const sanitizeFileName = (fileName: string) => {
  const trimmed = fileName.trim();

  if (!trimmed) {
    return "file";
  }

  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
};

const saveUploadedFiles = async (submissionId: number, files: File[]) => {
  if (files.length === 0) {
    return [] as StoredSubmissionFile[];
  }

  const uploadDir = join("static", "uploads", "submissions", String(submissionId));
  await mkdir(uploadDir, { recursive: true });

  const storedFiles: StoredSubmissionFile[] = [];

  for (const file of files) {
    const safeName = sanitizeFileName(file.name || "file");
    const storedName = `${Date.now()}-${randomUUID()}-${safeName}`;
    const absolutePath = join(uploadDir, storedName);
    const bytes = Buffer.from(await file.arrayBuffer());

    await writeFile(absolutePath, bytes);

    storedFiles.push({
      name: safeName,
      url: `/uploads/submissions/${submissionId}/${storedName}`,
      mimeType: file.type || null,
      size: file.size,
    });
  }

  return storedFiles;
};

const getStudentTaskContext = (
  cookies: Parameters<PageServerLoad>[0]["cookies"],
  rawTaskId: string,
) => {
  const user = requireStudent(cookies);
  const taskId = parseTaskId(rawTaskId);

  const task = db
    .select({
      id: tasks.id,
      title: tasks.title,
      instructions: tasks.instructions,
      submissionDate: tasks.submissionDate,
      classroomId: tasks.classroomId,
    })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .get();

  if (!task) {
    throw error(404, "Task not found");
  }

  const enrollment = db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.classroomId, task.classroomId), eq(enrollments.studentId, user.id)))
    .get();

  if (!enrollment) {
    throw error(404, "Task not found");
  }

  return { user, task };
};

export const load: PageServerLoad = async ({ params, cookies }) => {
  const { user, task } = getStudentTaskContext(cookies, params.taskId);

  const files = db
    .select({
      name: taskFiles.name,
      url: taskFiles.url,
      size: taskFiles.size,
    })
    .from(taskFiles)
    .where(eq(taskFiles.taskId, task.id))
    .orderBy(asc(taskFiles.id))
    .all();

  const submission = db
    .select({
      id: submissions.id,
      submittedAt: submissions.submittedAt,
      gradeScore: submissions.gradeScore,
    })
    .from(submissions)
    .where(and(eq(submissions.taskId, task.id), eq(submissions.studentId, user.id)))
    .get();

  const submittedFiles = submission
    ? db
      .select({
        name: submissionFiles.name,
        url: submissionFiles.url,
        size: submissionFiles.size,
      })
      .from(submissionFiles)
      .where(eq(submissionFiles.submissionId, submission.id))
      .orderBy(asc(submissionFiles.id))
      .all()
    : [];

  return {
    task: {
      id: task.id,
      title: task.title,
      instructions: task.instructions,
      submissionDate: task.submissionDate.toISOString(),
      classroomId: task.classroomId,
      files,
    },
    submission: submission
      ? {
        submittedAt: submission.submittedAt?.toISOString() ?? null,
        gradeScore: submission.gradeScore,
        files: submittedFiles,
      }
      : null,
  };
};

export const actions: Actions = {
  submit: async ({ params, cookies, request }) => {
    const { user, task } = getStudentTaskContext(cookies, params.taskId);
    const formData = await request.formData();
    const uploadedFiles = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    const existingSubmission = db
      .select({
        id: submissions.id,
      })
      .from(submissions)
      .where(and(eq(submissions.taskId, task.id), eq(submissions.studentId, user.id)))
      .get();

    const existingSubmissionFiles = existingSubmission
      ? db
        .select({ id: submissionFiles.id })
        .from(submissionFiles)
        .where(eq(submissionFiles.submissionId, existingSubmission.id))
        .all()
      : [];

    if (uploadedFiles.length === 0 && existingSubmissionFiles.length === 0) {
      return fail(400, {
        submitError: "Please attach at least one file before submitting.",
      });
    }

    const submittedAt = new Date();

    let submissionId = existingSubmission?.id ?? null;

    if (submissionId !== null) {
      db.update(submissions)
        .set({
          submittedAt,
          gradeScore: null,
        })
        .where(eq(submissions.id, submissionId))
        .run();
    } else {
      const insertResult = db.insert(submissions).values({
        taskId: task.id,
        studentId: user.id,
        submittedAt,
        gradeScore: null,
      }).run();

      submissionId = Number(insertResult.lastInsertRowid);

      if (!Number.isFinite(submissionId)) {
        throw error(500, "Could not submit task");
      }
    }

    if (uploadedFiles.length > 0) {
      const savedFiles = await saveUploadedFiles(submissionId, uploadedFiles);

      db.delete(submissionFiles)
        .where(eq(submissionFiles.submissionId, submissionId))
        .run();

      db.insert(submissionFiles)
        .values(
          savedFiles.map((file) => ({
            submissionId,
            name: file.name,
            url: file.url,
            mimeType: file.mimeType,
            size: file.size,
          })),
        )
        .run();
    }

    throw redirect(303, `/registered/student/task/${task.id}`);
  },
};
