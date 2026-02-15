import { getSessionUser } from "$lib/server/session";
import { db } from "$lib/server/db";
import { classrooms, users } from "$lib/server/db/schema";
import { createUniqueClassroomCode } from "$lib/server/classrooms";
import { and, desc, eq } from "drizzle-orm";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

const NAME_REGEX = /^[\p{L}][\p{L}\s'-]{0,79}$/u;
const ID_NUMBER_REGEX = /^[A-Za-z0-9._-]{2,64}$/;
const PHONE_REGEX = /^\+?[0-9 ()-]{7,20}$/;

const requireTeacher = (cookies: Parameters<PageServerLoad>[0]["cookies"]) => {
  const user = getSessionUser(cookies);

  if (!user) {
    throw redirect(303, "/");
  }

  if (user.role !== "teacher") {
    throw redirect(303, "/registered/student");
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
  const user = requireTeacher(cookies);
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

  const teacherClassrooms = db
    .select({
      id: classrooms.id,
      name: classrooms.name,
    })
    .from(classrooms)
    .where(eq(classrooms.teacherId, user.id))
    .orderBy(classrooms.id)
    .all();

  return {
    userDetails,
    classrooms: teacherClassrooms,
  };
};

export const actions: Actions = {
  updateDetails: async ({ cookies, request }) => {
    const user = requireTeacher(cookies);
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

    throw redirect(303, "/registered/teacher");
  },
  createClassroom: async ({ cookies }) => {
    const user = requireTeacher(cookies);

    const latestClassroom = db
      .select({ id: classrooms.id })
      .from(classrooms)
      .orderBy(desc(classrooms.id))
      .limit(1)
      .get();

    const nextClassroomId = latestClassroom ? latestClassroom.id + 1 : 0;

    db.insert(classrooms)
      .values({
        id: nextClassroomId,
        name: "New Classroom",
        code: createUniqueClassroomCode(),
        teacherId: user.id,
      })
      .run();

    throw redirect(303, `/registered/teacher/classroom/${nextClassroomId}/tasks`);
  },
  deleteClassroom: async ({ cookies, request }) => {
    const user = requireTeacher(cookies);
    const formData = await request.formData();
    const classroomIdValue = formData.get("classroomId");
    const classroomId =
      typeof classroomIdValue === "string" ? Number(classroomIdValue) : Number.NaN;

    if (!Number.isInteger(classroomId) || classroomId < 0) {
      return fail(400, { deleteError: "Invalid classroom id." });
    }

    const classroom = db
      .select({ id: classrooms.id })
      .from(classrooms)
      .where(and(eq(classrooms.id, classroomId), eq(classrooms.teacherId, user.id)))
      .get();

    if (!classroom) {
      return fail(404, { deleteError: "Classroom not found." });
    }

    db.delete(classrooms)
      .where(and(eq(classrooms.id, classroomId), eq(classrooms.teacherId, user.id)))
      .run();

    throw redirect(303, "/registered/teacher");
  },
};
