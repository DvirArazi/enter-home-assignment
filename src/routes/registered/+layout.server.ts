import { getSessionUser } from "$lib/server/session";
import { db } from "$lib/server/db";
import { classrooms, enrollments, tasks } from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

type Breadcrumb = {
  label: string;
  href?: string;
};

const getTeacherBreadcrumbs = (userId: number, pathname: string): Breadcrumb[] => {
  const breadcrumbs: Breadcrumb[] = [{ label: "TaskIt", href: "/registered/teacher" }];

  const classroomRouteMatch = pathname.match(
    /^\/registered\/teacher\/classroom\/(\d+)\/(tasks|students)\/?$/,
  );

  if (classroomRouteMatch) {
    const classroomId = Number(classroomRouteMatch[1]);
    const classroom = db
      .select({ name: classrooms.name })
      .from(classrooms)
      .where(and(eq(classrooms.id, classroomId), eq(classrooms.teacherId, userId)))
      .get();

    if (classroom) {
      breadcrumbs.push({ label: classroom.name });
    }

    return breadcrumbs;
  }

  const taskRouteMatch = pathname.match(
    /^\/registered\/teacher\/(?:task-edit|task-review)\/(\d+)\/?$/,
  );

  if (taskRouteMatch) {
    const taskId = Number(taskRouteMatch[1]);
    const taskWithClassroom = db
      .select({
        taskTitle: tasks.title,
        classroomId: classrooms.id,
        classroomName: classrooms.name,
      })
      .from(tasks)
      .innerJoin(classrooms, eq(tasks.classroomId, classrooms.id))
      .where(and(eq(tasks.id, taskId), eq(classrooms.teacherId, userId)))
      .get();

    if (taskWithClassroom) {
      breadcrumbs.push({
        label: taskWithClassroom.classroomName,
        href: `/registered/teacher/classroom/${taskWithClassroom.classroomId}/tasks`,
      });
      breadcrumbs.push({ label: taskWithClassroom.taskTitle });
    }
  }

  return breadcrumbs;
};

const getStudentBreadcrumbs = (userId: number, pathname: string): Breadcrumb[] => {
  const breadcrumbs: Breadcrumb[] = [{ label: "TaskIt", href: "/registered/student" }];

  const classroomRouteMatch = pathname.match(
    /^\/registered\/student\/classroom\/(\d+)\/?$/,
  );

  if (classroomRouteMatch) {
    const classroomId = Number(classroomRouteMatch[1]);
    const classroom = db
      .select({ name: classrooms.name })
      .from(classrooms)
      .innerJoin(enrollments, eq(enrollments.classroomId, classrooms.id))
      .where(and(eq(classrooms.id, classroomId), eq(enrollments.studentId, userId)))
      .get();

    if (classroom) {
      breadcrumbs.push({ label: classroom.name });
    }

    return breadcrumbs;
  }

  const taskRouteMatch = pathname.match(/^\/registered\/student\/task\/(\d+)\/?$/);

  if (taskRouteMatch) {
    const taskId = Number(taskRouteMatch[1]);
    const taskWithClassroom = db
      .select({
        taskTitle: tasks.title,
        classroomId: classrooms.id,
        classroomName: classrooms.name,
      })
      .from(tasks)
      .innerJoin(classrooms, eq(tasks.classroomId, classrooms.id))
      .innerJoin(
        enrollments,
        and(eq(enrollments.classroomId, classrooms.id), eq(enrollments.studentId, userId)),
      )
      .where(eq(tasks.id, taskId))
      .get();

    if (taskWithClassroom) {
      breadcrumbs.push({
        label: taskWithClassroom.classroomName,
        href: `/registered/student/classroom/${taskWithClassroom.classroomId}`,
      });
      breadcrumbs.push({ label: taskWithClassroom.taskTitle });
    }
  }

  return breadcrumbs;
};

export const load: LayoutServerLoad = async ({ cookies, url }) => {
  const user = getSessionUser(cookies);

  if (!user) {
    throw redirect(303, "/");
  }

  const breadcrumbs =
    user.role === "teacher"
      ? getTeacherBreadcrumbs(user.id, url.pathname)
      : getStudentBreadcrumbs(user.id, url.pathname);

  return { user, breadcrumbs };
};
