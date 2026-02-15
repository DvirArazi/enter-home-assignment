import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getSessionUser } from "$lib/server/session";
import { db } from "$lib/server/db";
import { classrooms, taskFiles, tasks } from "$lib/server/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { error, fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

type StoredTaskFile = {
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

const parseSubmissionDate = (rawDate: string) => {
  const trimmed = rawDate.trim();

  if (!trimmed) {
    return null;
  }

  const createUtcDate = (year: number, month: number, day: number) => {
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() !== year
      || date.getUTCMonth() !== month - 1
      || date.getUTCDate() !== day
    ) {
      return null;
    }

    return date;
  };

  const dayMonthYearMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);

  if (dayMonthYearMatch) {
    const [, dayRaw, monthRaw, yearRaw] = dayMonthYearMatch;
    return createUtcDate(Number(yearRaw), Number(monthRaw), Number(dayRaw));
  }

  const yearMonthDayMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

  if (yearMonthDayMatch) {
    const [, yearRaw, monthRaw, dayRaw] = yearMonthDayMatch;
    return createUtcDate(Number(yearRaw), Number(monthRaw), Number(dayRaw));
  }

  return null;
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

const formatDateForInput = (date: Date) => {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = String(date.getUTCFullYear());
  return `${day}/${month}/${year}`;
};

const getStartOfTodayUtc = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

const sanitizeFileName = (fileName: string) => {
  const trimmed = fileName.trim();

  if (!trimmed) {
    return "file";
  }

  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
};

const saveUploadedFiles = async (taskId: number, files: File[]) => {
  if (files.length === 0) {
    return [] as StoredTaskFile[];
  }

  const uploadDir = join("static", "uploads", "tasks", String(taskId));
  await mkdir(uploadDir, { recursive: true });

  const storedFiles: StoredTaskFile[] = [];

  for (const file of files) {
    const safeName = sanitizeFileName(file.name || "file");
    const storedName = `${Date.now()}-${randomUUID()}-${safeName}`;
    const absolutePath = join(uploadDir, storedName);
    const bytes = Buffer.from(await file.arrayBuffer());

    await writeFile(absolutePath, bytes);

    storedFiles.push({
      name: safeName,
      url: `/uploads/tasks/${taskId}/${storedName}`,
      mimeType: file.type || null,
      size: file.size,
    });
  }

  return storedFiles;
};

export const load: PageServerLoad = async ({ params, cookies }) => {
  const task = getTeacherTask(cookies, params.taskId);
  const files = db
    .select({
      name: taskFiles.name,
      url: taskFiles.url,
      mimeType: taskFiles.mimeType,
      size: taskFiles.size,
    })
    .from(taskFiles)
    .where(eq(taskFiles.taskId, task.id))
    .orderBy(asc(taskFiles.id))
    .all();

  return {
    task: {
      id: task.id,
      title: task.title,
      instructions: task.instructions,
      files,
      submissionDate: formatDateForInput(task.submissionDate),
      classroomId: task.classroomId,
    },
  };
};

export const actions: Actions = {
  save: async ({ params, cookies, request }) => {
    const currentTask = getTeacherTask(cookies, params.taskId);
    const formData = await request.formData();

    const titleValue = formData.get("title");
    const instructionsValue = formData.get("instructions");
    const submissionDateValue = formData.get("submissionDate");

    const title = typeof titleValue === "string" ? titleValue.trim() : "";
    const instructions = typeof instructionsValue === "string" ? instructionsValue : "";
    const submissionDateRaw =
      typeof submissionDateValue === "string" ? submissionDateValue : "";
    const submissionDate = parseSubmissionDate(submissionDateRaw);

    if (!title) {
      return fail(400, {
        saveError: "Title is required.",
        values: {
          title,
          instructions,
          submissionDate: submissionDateRaw,
        },
      });
    }

    if (!submissionDate) {
      return fail(400, {
        saveError: "Submission date is invalid. Use day/month/year.",
        values: {
          title,
          instructions,
          submissionDate: submissionDateRaw,
        },
      });
    }

    if (submissionDate.getTime() < getStartOfTodayUtc().getTime()) {
      return fail(400, {
        saveError: "Submission date cannot be in the past.",
        values: {
          title,
          instructions,
          submissionDate: submissionDateRaw,
        },
      });
    }

    const uploadedFiles = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);
    const savedUploadedFiles = await saveUploadedFiles(currentTask.id, uploadedFiles);

    db.update(tasks)
      .set({
        title,
        instructions,
        submissionDate,
      })
      .where(eq(tasks.id, currentTask.id))
      .run();

    if (savedUploadedFiles.length > 0) {
      db.insert(taskFiles)
        .values(
          savedUploadedFiles.map((file) => ({
            taskId: currentTask.id,
            name: file.name,
            url: file.url,
            mimeType: file.mimeType,
            size: file.size,
          })),
        )
        .run();
    }

    throw redirect(
      303,
      `/registered/teacher/classroom/${currentTask.classroomId}/tasks`,
    );
  },
};
