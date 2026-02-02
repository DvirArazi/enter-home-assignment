import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const teachers = sqliteTable("teachers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  idNumber: text("id_number").notNull(),
});

export const students = sqliteTable("students", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  class: text("class").notNull(),
  phoneNumber: text("phone_number").notNull(),
});

export const teacherSessions = sqliteTable("teacher_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  teacherId: integer("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),

  // random token stored in DB + cookie (simple session model)
  token: text("token").notNull()
});
