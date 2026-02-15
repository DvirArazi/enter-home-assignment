import {
  createPasswordHash,
  createSessionToken,
  hashSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  verifyPassword,
} from "$lib/server/auth";
import { db } from "$lib/server/db";
import { sessions, userRoles, users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";

type SignupRole = (typeof userRoles)[number];

const isSignupRole = (value: string): value is SignupRole =>
  (userRoles as readonly string[]).includes(value);

const getString = (formData: FormData, key: string, trim = true) => {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return "";
  }

  return trim ? value.trim() : value;
};

export const actions: Actions = {
  signup: async ({ request, cookies, url }) => {
    const formData = await request.formData();

    const firstName = getString(formData, "firstName");
    const lastName = getString(formData, "lastName");
    const idNumber = getString(formData, "idNumber");
    const password = getString(formData, "password", false);
    const confirmPassword = getString(formData, "confirmPassword", false);
    const roleValue = getString(formData, "role");

    const signupValues = {
      firstName,
      lastName,
      idNumber,
      role: roleValue,
    };

    if (!firstName || !lastName || !idNumber || !password || !confirmPassword) {
      return fail(400, {
        signupError: "Please fill in all sign up fields.",
        signupValues,
      });
    }

    if (!isSignupRole(roleValue)) {
      return fail(400, {
        signupError: "Please choose a valid role.",
        signupValues,
      });
    }

    if (password !== confirmPassword) {
      return fail(400, {
        signupError: "Password and confirm password must match.",
        signupValues,
      });
    }

    const existingUser = db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.idNumber, idNumber))
      .get();

    if (existingUser) {
      return fail(409, {
        signupError: "A user with that ID number already exists.",
        signupValues,
      });
    }

    const passwordHash = createPasswordHash(password);
    const sessionToken = createSessionToken();
    const tokenHash = hashSessionToken(sessionToken);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    try {
      db.transaction((tx) => {
        const userInsertResult = tx
          .insert(users)
          .values({
            firstName,
            lastName,
            idNumber,
            passwordHash,
            role: roleValue,
          })
          .run();

        const userId = Number(userInsertResult.lastInsertRowid);

        if (!Number.isFinite(userId)) {
          throw new Error("Could not resolve created user ID.");
        }

        tx.insert(sessions)
          .values({
            userId,
            tokenHash,
            expiresAt,
          })
          .run();
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("UNIQUE constraint failed: users.id_number")
      ) {
        return fail(409, {
          signupError: "A user with that ID number already exists.",
          signupValues,
        });
      }

      throw error;
    }

    cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: url.protocol === "https:",
      expires: expiresAt,
    });

    throw redirect(
      303,
      roleValue === "teacher" ? "/registered/teacher" : "/registered/student",
    );
  },
  login: async ({ request, cookies, url }) => {
    const formData = await request.formData();

    const idNumber = getString(formData, "loginIdNumber");
    const password = getString(formData, "loginPassword", false);
    const loginValues = { idNumber };

    if (!idNumber || !password) {
      return fail(400, {
        loginError: "Please fill in both login fields.",
        loginValues,
      });
    }

    const user = db
      .select({
        id: users.id,
        passwordHash: users.passwordHash,
        role: users.role,
      })
      .from(users)
      .where(eq(users.idNumber, idNumber))
      .get();

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return fail(401, {
        loginError: "Invalid ID number or password.",
        loginValues,
      });
    }

    const sessionToken = createSessionToken();
    const tokenHash = hashSessionToken(sessionToken);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    db.insert(sessions)
      .values({
        userId: user.id,
        tokenHash,
        expiresAt,
      })
      .run();

    cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: url.protocol === "https:",
      expires: expiresAt,
    });

    throw redirect(
      303,
      user.role === "teacher" ? "/registered/teacher" : "/registered/student",
    );
  },
};
