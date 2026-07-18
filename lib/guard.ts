import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Throws unless the caller is a signed-in teacher. Returns the teacher's user id. */
export async function requireTeacher() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") {
    throw new Error("Not authorized");
  }
  return session.user.id;
}

/** Throws unless the signed-in teacher owns this classroom. */
export async function requireClassroomOwner(classroomId: string) {
  const teacherId = await requireTeacher();
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom || classroom.teacherId !== teacherId) {
    throw new Error("Not authorized");
  }
  return { teacherId, classroom };
}

/**
 * Returns the current session and, for classroom-scoped pages, verifies
 * the caller may view `classroomId` — either as its owning teacher or as
 * one of its enrolled students (read-only).
 */
export async function requireClassroomAccess(classroomId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Not authorized");

  if (session.user.role === "TEACHER") {
    const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
    if (!classroom || classroom.teacherId !== session.user.id) throw new Error("Not authorized");
    return { session, canEdit: true as const };
  }

  if (session.user.role === "STUDENT") {
    if (session.user.classroomId !== classroomId) throw new Error("Not authorized");
    return { session, canEdit: false as const };
  }

  throw new Error("Not authorized");
}
