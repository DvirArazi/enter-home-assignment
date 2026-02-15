import { getSessionUser } from "$lib/server/session";
import { db } from "$lib/server/db";
import { classrooms, enrollments, submissions, tasks, users } from "$lib/server/db/schema";
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

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

export const load: PageServerLoad = async ({ parent }) => {
  const { classroom } = await parent();

  const students = db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      idNumber: users.idNumber,
      phoneNumber: users.phoneNumber,
    })
    .from(enrollments)
    .innerJoin(users, eq(users.id, enrollments.studentId))
    .where(and(eq(enrollments.classroomId, classroom.id), eq(users.role, "student")))
    .orderBy(asc(users.lastName), asc(users.firstName), asc(users.id))
    .all();

  const classroomTasks = db
    .select({
      id: tasks.id,
      title: tasks.title,
    })
    .from(tasks)
    .where(eq(tasks.classroomId, classroom.id))
    .orderBy(asc(tasks.id))
    .all();

  const classroomSubmissions = db
    .select({
      taskId: submissions.taskId,
      studentId: submissions.studentId,
      gradeScore: submissions.gradeScore,
      submittedAt: submissions.submittedAt,
    })
    .from(submissions)
    .innerJoin(tasks, eq(tasks.id, submissions.taskId))
    .where(eq(tasks.classroomId, classroom.id))
    .all();

  const submissionByStudentAndTask = new Map(
    classroomSubmissions.map((submission) => [
      `${submission.studentId}:${submission.taskId}`,
      submission,
    ]),
  );

  const studentsWithTaskStatuses = students.map((student) => ({
    ...student,
    taskStatuses: classroomTasks.map((task) => {
      const submission = submissionByStudentAndTask.get(`${student.id}:${task.id}`);

      if (submission && submission.gradeScore !== null) {
        return submission.gradeScore;
      }

      if (submission && submission.submittedAt !== null) {
        return "pending review";
      }

      return "not submitted";
    }),
  }));

  return {
    students: studentsWithTaskStatuses,
    tasks: classroomTasks,
  };
};

export const actions: Actions = {
  addStudent: async ({ cookies, params, request }) => {
    const classroomId = requireTeacherClassroom(cookies, params.classroomId);
    const formData = await request.formData();
    const idNumber = getString(formData, "idNumber");
    const addStudentValues = { idNumber };

    if (!idNumber) {
      return fail(400, {
        addStudentError: "Please enter a student ID number.",
        addStudentValues,
      });
    }

    const student = db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(and(eq(users.idNumber, idNumber), eq(users.role, "student")))
      .get();

    if (!student) {
      return fail(404, {
        addStudentError: "No student found with that ID number.",
        addStudentValues,
      });
    }

    const existingEnrollment = db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.classroomId, classroomId),
          eq(enrollments.studentId, student.id),
        ),
      )
      .get();

    if (existingEnrollment) {
      return fail(409, {
        addStudentError: `${student.firstName} ${student.lastName} is already enrolled.`,
        addStudentValues,
      });
    }

    db.insert(enrollments)
      .values({
        classroomId,
        studentId: student.id,
      })
      .run();

    throw redirect(303, `/registered/teacher/classroom/${classroomId}/students`);
  },
  removeStudent: async ({ cookies, params, request }) => {
    const classroomId = requireTeacherClassroom(cookies, params.classroomId);
    const formData = await request.formData();
    const studentIdValue = formData.get("studentId");
    const studentId =
      typeof studentIdValue === "string" ? Number(studentIdValue) : Number.NaN;

    if (!Number.isInteger(studentId) || studentId < 0) {
      return fail(400, { removeStudentError: "Invalid student id." });
    }

    const enrollment = db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(eq(enrollments.classroomId, classroomId), eq(enrollments.studentId, studentId)),
      )
      .get();

    if (!enrollment) {
      return fail(404, { removeStudentError: "Student is not enrolled in this classroom." });
    }

    db.delete(enrollments)
      .where(
        and(eq(enrollments.classroomId, classroomId), eq(enrollments.studentId, studentId)),
      )
      .run();

    throw redirect(303, `/registered/teacher/classroom/${classroomId}/students`);
  },
};
