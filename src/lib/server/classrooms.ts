import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { classrooms } from "$lib/server/db/schema";

const CLASSROOM_CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CLASSROOM_CODE_LENGTH = 7;
const CLASSROOM_CODE_REGEX = /^[A-Z0-9]{7}$/;
const MAX_CLASSROOM_CODE_ATTEMPTS = 1000;

export const isValidClassroomCode = (code: string) =>
  CLASSROOM_CODE_REGEX.test(code);

export const createClassroomCode = () => {
  let code = "";

  for (let index = 0; index < CLASSROOM_CODE_LENGTH; index += 1) {
    const randomIndex = randomInt(0, CLASSROOM_CODE_ALPHABET.length);
    code += CLASSROOM_CODE_ALPHABET[randomIndex];
  }

  return code;
};

export const createUniqueClassroomCode = () => {
  for (let attempt = 0; attempt < MAX_CLASSROOM_CODE_ATTEMPTS; attempt += 1) {
    const code = createClassroomCode();
    const existingClassroom = db
      .select({ id: classrooms.id })
      .from(classrooms)
      .where(eq(classrooms.code, code))
      .get();

    if (!existingClassroom) {
      return code;
    }
  }

  throw new Error("Could not generate a unique classroom code.");
};
