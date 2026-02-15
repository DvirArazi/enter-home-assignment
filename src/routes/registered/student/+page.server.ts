import { getSessionUser } from "$lib/server/session";
import { db } from "$lib/server/db";
import { classrooms, enrollments, users } from "$lib/server/db/schema";
import { isValidClassroomCode } from "$lib/server/classrooms";
import { and, asc, eq } from "drizzle-orm";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

const NAME_REGEX = /^[\p{L}][\p{L}\s'-]{0,79}$/u;
const ID_NUMBER_REGEX = /^[A-Za-z0-9._-]{2,64}$/;
const PHONE_REGEX = /^\+?[0-9 ()-]{7,20}$/;

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

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

export const load: PageServerLoad = async ({ cookies }) => {
  const user = requireStudent(cookies);
  const userDetails = db
    .select({
      firstName: users.firstName,
      lastName: users.lastName,
      idNumber: users.idNumber,
      phoneNumber: users.phoneNumber,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .get();

  if (!userDetails) {
    throw redirect(303, "/");
  }

  const studentClassrooms = db
    .select({
      id: classrooms.id,
      name: classrooms.name,
    })
    .from(enrollments)
    .innerJoin(classrooms, eq(classrooms.id, enrollments.classroomId))
    .where(eq(enrollments.studentId, user.id))
    .orderBy(asc(classrooms.name), asc(classrooms.id))
    .all();

  return {
    userDetails,
    classrooms: studentClassrooms,
  };
};

export const actions: Actions = {
  updateDetails: async ({ cookies, request }) => {
    const user = requireStudent(cookies);
    const formData = await request.formData();
    const firstName = getString(formData, "firstName");
    const lastName = getString(formData, "lastName");
    const idNumber = getString(formData, "idNumber");
    const phoneNumberRaw = getString(formData, "phoneNumber");
    const detailsValues = {
      firstName,
      lastName,
      idNumber,
      phoneNumber: phoneNumberRaw,
    };

    if (!firstName || !lastName || !idNumber) {
      return fail(400, {
        detailsError: "First name, last name, and ID number are required.",
        detailsValues,
      });
    }

    if (!NAME_REGEX.test(firstName)) {
      return fail(400, {
        detailsError: "Please enter a valid first name.",
        detailsValues,
      });
    }

    if (!NAME_REGEX.test(lastName)) {
      return fail(400, {
        detailsError: "Please enter a valid last name.",
        detailsValues,
      });
    }

    if (!ID_NUMBER_REGEX.test(idNumber)) {
      return fail(400, {
        detailsError: "ID number can include letters, numbers, dot, dash, and underscore.",
        detailsValues,
      });
    }

    if (phoneNumberRaw) {
      if (!PHONE_REGEX.test(phoneNumberRaw)) {
        return fail(400, {
          detailsError: "Please enter a valid phone number.",
          detailsValues,
        });
      }

      const phoneDigits = phoneNumberRaw.replace(/\D/g, "");

      if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        return fail(400, {
          detailsError: "Phone number must contain between 7 and 15 digits.",
          detailsValues,
        });
      }
    }

    const existingUserWithId = db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.idNumber, idNumber))
      .get();

    if (existingUserWithId && existingUserWithId.id !== user.id) {
      return fail(409, {
        detailsError: "A user with that ID number already exists.",
        detailsValues,
      });
    }

    db.update(users)
      .set({
        firstName,
        lastName,
        idNumber,
        phoneNumber: phoneNumberRaw || null,
      })
      .where(eq(users.id, user.id))
      .run();

    throw redirect(303, "/registered/student");
  },
  joinClassroom: async ({ cookies, request }) => {
    const user = requireStudent(cookies);
    const formData = await request.formData();
    const code = getString(formData, "code").toUpperCase();
    const joinClassroomValues = { code };

    if (!code) {
      return fail(400, {
        joinClassroomError: "Please enter a classroom code.",
        joinClassroomValues,
      });
    }

    if (!isValidClassroomCode(code)) {
      return fail(400, {
        joinClassroomError: "Classroom code must be 7 letters or numbers.",
        joinClassroomValues,
      });
    }

    const classroom = db
      .select({
        id: classrooms.id,
      })
      .from(classrooms)
      .where(eq(classrooms.code, code))
      .get();

    if (!classroom) {
      return fail(404, {
        joinClassroomError: "No classroom found with that code.",
        joinClassroomValues,
      });
    }

    const existingEnrollment = db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.classroomId, classroom.id), eq(enrollments.studentId, user.id)))
      .get();

    if (!existingEnrollment) {
      db.insert(enrollments)
        .values({
          classroomId: classroom.id,
          studentId: user.id,
        })
        .run();
    }

    throw redirect(303, `/registered/student/classroom/${classroom.id}`);
  },
  leaveClassroom: async ({ cookies, request }) => {
    const user = requireStudent(cookies);
    const formData = await request.formData();
    const classroomIdRaw = formData.get("classroomId");

    if (typeof classroomIdRaw !== "string") {
      return fail(400, {
        leaveClassroomError: "Invalid classroom selection.",
      });
    }

    const classroomId = Number.parseInt(classroomIdRaw, 10);

    if (!Number.isInteger(classroomId) || classroomId <= 0) {
      return fail(400, {
        leaveClassroomError: "Invalid classroom selection.",
      });
    }

    const existingEnrollment = db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.classroomId, classroomId), eq(enrollments.studentId, user.id)))
      .get();

    if (!existingEnrollment) {
      return fail(404, {
        leaveClassroomError: "You are not enrolled in this classroom.",
      });
    }

    db.delete(enrollments)
      .where(and(eq(enrollments.classroomId, classroomId), eq(enrollments.studentId, user.id)))
      .run();

    throw redirect(303, "/registered/student");
  },
};
