"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTeacher, requireClassroomOwner } from "@/lib/guard";

// Every action re-checks authorization server-side (requireTeacher /
// requireClassroomOwner) — the client is never trusted, even though the
// UI also hides controls students shouldn't see.

// ---------- Classrooms ----------

const classroomSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  subject: z.string().max(120).optional(),
});

export async function createClassroom(input: { name: string; subject?: string }) {
  const teacherId = await requireTeacher();
  const data = classroomSchema.parse(input);
  const classroom = await prisma.classroom.create({
    data: { name: data.name.trim(), subject: data.subject?.trim() || null, teacherId },
  });
  revalidatePath("/dashboard");
  return classroom;
}

export async function updateClassroom(classroomId: string, input: { name: string; subject?: string }) {
  await requireClassroomOwner(classroomId);
  const data = classroomSchema.parse(input);
  await prisma.classroom.update({
    where: { id: classroomId },
    data: { name: data.name.trim(), subject: data.subject?.trim() || null },
  });
  revalidatePath(`/classrooms/${classroomId}`);
  revalidatePath(`/classrooms/${classroomId}/settings`);
  revalidatePath("/dashboard");
}

export async function deleteClassroom(classroomId: string) {
  await requireClassroomOwner(classroomId);
  await prisma.classroom.delete({ where: { id: classroomId } });
  revalidatePath("/dashboard");
}

// ---------- Students ----------

const studentSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email().optional().or(z.literal("")),
});

export async function addStudent(classroomId: string, input: { name: string; email?: string }) {
  await requireClassroomOwner(classroomId);
  const data = studentSchema.parse(input);

  const last = await prisma.student.findFirst({
    where: { classroomId },
    orderBy: { number: "desc" },
  });
  const nextNumber = (last?.number ?? 0) + 1;

  const student = await prisma.student.create({
    data: {
      classroomId,
      number: nextNumber,
      name: data.name.trim(),
      email: data.email || null,
    },
  });
  revalidatePath(`/classrooms/${classroomId}`);
  revalidatePath(`/classrooms/${classroomId}/settings`);
  return student;
}

export async function updateStudent(
  studentId: string,
  input: { name: string; email?: string }
) {
  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });
  await requireClassroomOwner(student.classroomId);
  const data = studentSchema.parse(input);
  await prisma.student.update({
    where: { id: studentId },
    data: { name: data.name.trim(), email: data.email || null },
  });
  revalidatePath(`/classrooms/${student.classroomId}`);
  revalidatePath(`/classrooms/${student.classroomId}/settings`);
}

export async function deleteStudent(studentId: string) {
  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });
  await requireClassroomOwner(student.classroomId);
  await prisma.student.delete({ where: { id: studentId } });
  revalidatePath(`/classrooms/${student.classroomId}`);
  revalidatePath(`/classrooms/${student.classroomId}/settings`);
}

export async function regenerateStudentLink(studentId: string) {
  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });
  await requireClassroomOwner(student.classroomId);
  const updated = await prisma.student.update({
    where: { id: studentId },
    data: { accessToken: crypto.randomUUID() },
  });
  revalidatePath(`/classrooms/${student.classroomId}/settings`);
  return updated.accessToken;
}

export async function setStudentPin(studentId: string, pin: string | null) {
  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });
  await requireClassroomOwner(student.classroomId);
  const pinHash = pin ? await bcrypt.hash(pin, 10) : null;
  await prisma.student.update({ where: { id: studentId }, data: { pinHash } });
  revalidatePath(`/classrooms/${student.classroomId}/settings`);
}

// ---------- Assignment columns ----------

const columnSchema = z.object({ title: z.string().min(1, "Title is required").max(120) });

export async function addColumn(classroomId: string, input: { title: string }) {
  await requireClassroomOwner(classroomId);
  const data = columnSchema.parse(input);
  const last = await prisma.assignmentColumn.findFirst({
    where: { classroomId },
    orderBy: { order: "desc" },
  });
  const column = await prisma.assignmentColumn.create({
    data: { classroomId, title: data.title.trim(), order: (last?.order ?? 0) + 1 },
  });
  revalidatePath(`/classrooms/${classroomId}`);
  return column;
}

export async function renameColumn(columnId: string, title: string) {
  const column = await prisma.assignmentColumn.findUniqueOrThrow({ where: { id: columnId } });
  await requireClassroomOwner(column.classroomId);
  columnSchema.parse({ title });
  await prisma.assignmentColumn.update({ where: { id: columnId }, data: { title: title.trim() } });
  revalidatePath(`/classrooms/${column.classroomId}`);
}

export async function deleteColumn(columnId: string) {
  const column = await prisma.assignmentColumn.findUniqueOrThrow({ where: { id: columnId } });
  await requireClassroomOwner(column.classroomId);
  await prisma.assignmentColumn.delete({ where: { id: columnId } });
  revalidatePath(`/classrooms/${column.classroomId}`);
}

// ---------- Submissions (the checkboxes) ----------

export async function toggleSubmission(studentId: string, columnId: string, checked: boolean) {
  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });
  await requireClassroomOwner(student.classroomId);

  await prisma.submission.upsert({
    where: { studentId_columnId: { studentId, columnId } },
    update: { checked },
    create: { studentId, columnId, checked },
  });
  revalidatePath(`/classrooms/${student.classroomId}`);
}
