import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { db } from "$lib/server/db";
import { students } from "$lib/server/db/schema";

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData();

    const name = String(formData.get("name") ?? "").trim();
    const className = String(formData.get("class") ?? "").trim();
    const phoneNumber = String(formData.get("phone_number") ?? "").trim();

    if (!name || !className || !phoneNumber) {
      return fail(400, { error: "All fields are required." });
    }

    await db.insert(students).values({
      name,
      class: className,
      phoneNumber
    });

    throw redirect(303, "/logged-in/students");
  }
};
