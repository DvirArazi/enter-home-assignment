import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { students } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async () => {
  const allStudents = db
    .select({
      id: students.id,
      name: students.name,
      class: students.class,
      phoneNumber: students.phoneNumber
    })
    .from(students)
    .all();

  return { students: allStudents };
};

export const actions: Actions = {
  update: async ({ request }) => {
    const formData = await request.formData();

    const id = Number(formData.get("id"));
    const name = String(formData.get("name") ?? "").trim();
    const className = String(formData.get("class") ?? "").trim();
    const phoneNumber = String(formData.get("phone_number") ?? "").trim();

    if (!id || Number.isNaN(id)) {
      return { error: "Invalid student id." };
    }

    if (!name || !className || !phoneNumber) {
      return { error: "All fields are required." };
    }

    db.update(students)
      .set({ name, class: className, phoneNumber })
      .where(eq(students.id, id))
      .run();

    return { success: true };
  }
};
