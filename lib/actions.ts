"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { prisma } from "@/lib/prisma";
import { requireTeacher, requireClassroomOwner } from "@/lib/guard";

// Every action re-checks authorization server-side (requireTeacher /
// requireClassroomOwner) — the client is never trusted, even though the
// UI also hides controls students shouldn't see.

function parseDelimitedRows(input: string) {
  return input
    .replace(/\ufeff/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cells = line
        .split(/[\t,;]/)
        .map((cell) => cell.trim())
        .filter(Boolean);
      if (cells.length === 0) return null;
      const [name, ...rest] = cells;
      const emailCandidate = rest.find((value) => value.includes("@"));
      return {
        name,
        ...(emailCandidate ? { email: emailCandidate } : {}),
      };
    })
    .filter((item): item is { name: string; email?: string } => Boolean(item));
}

async function parseXlsxRows(buffer: Buffer) {
  const tempDir = await fs.mkdtemp(path.join(tmpdir(), "classtrack-import-"));
  const inputPath = path.join(tempDir, "import.xlsx");
  const scriptPath = path.join(tempDir, "parse_xlsx.py");
  await fs.writeFile(inputPath, buffer);
  await fs.writeFile(
    scriptPath,
    `import json, sys, zipfile, os
from xml.etree import ElementTree as ET
from posixpath import normpath

ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main', 'rel': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}

with zipfile.ZipFile(sys.argv[1]) as z:
    shared = []
    if 'xl/sharedStrings.xml' in z.namelist():
        root = ET.fromstring(z.read('xl/sharedStrings.xml'))
        for si in root.findall('main:si', ns):
            parts = []
            for node in si.iter():
                if node.tag == '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t':
                    parts.append(node.text or '')
            shared.append(''.join(parts))

    rels_root = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    rels = {r.attrib['Id']: r.attrib['Target'] for r in rels_root}
    workbook = ET.fromstring(z.read('xl/workbook.xml'))
    sheets = workbook.find('main:sheets', ns)
    first_sheet = sheets[0]
    r_id = first_sheet.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
    target = rels[r_id]
    sheet_path = normpath(target if target.startswith('xl/') else f'xl/{target}')
    if target.startswith('/'):
        sheet_path = normpath(target.lstrip('/'))
    sheet_xml = ET.fromstring(z.read(sheet_path))
    data = sheet_xml.find('main:sheetData', ns)
    rows = []
    for row in data.findall('main:row', ns):
        values = []
        for cell in row.findall('main:c', ns):
            cell_type = cell.attrib.get('t')
            value_node = cell.find('main:v', ns)
            if cell_type == 's' and value_node is not None and value_node.text is not None:
                index = int(value_node.text)
                values.append(shared[index] if index < len(shared) else '')
            elif value_node is not None and value_node.text is not None:
                values.append(value_node.text)
            else:
                values.append('')
        rows.append(values)

print(json.dumps(rows))
`,
  );
  const { stdout } = await promisify(execFile)(
    "python3",
    [scriptPath, inputPath],
    {
      maxBuffer: 10 * 1024 * 1024,
    },
  );
  await fs.rm(tempDir, { recursive: true, force: true });
  return JSON.parse(stdout.toString()) as Array<string[]>;
}

async function parseImportedRows(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = path.extname(file.name).toLowerCase();

  if (
    extension === ".csv" ||
    extension === ".tsv" ||
    extension === ".txt" ||
    extension === ".text"
  ) {
    const text = buffer.toString("utf8");
    return parseDelimitedRows(text);
  }

  if (extension === ".xlsx" || extension === ".xlsm") {
    const rows = await parseXlsxRows(buffer);
    return rows
      .filter((row) => row.some((cell) => cell.trim()))
      .map((row) => {
        const [name, ...rest] = row.map((cell) => cell.trim());
        const email = rest.find((cell) => cell.includes("@"));
        return { name: name ?? "", ...(email ? { email } : {}) };
      })
      .filter((row) => row.name);
  }

  throw new Error("รองรับไฟล์ .csv, .txt, .xlsx เท่านั้น");
}

// ---------- Classrooms ----------

const classroomSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  subject: z.string().max(120).optional(),
});

export async function createClassroom(input: {
  name: string;
  subject?: string;
}) {
  const teacherId = await requireTeacher();
  const data = classroomSchema.parse(input);
  const classroom = await prisma.classroom.create({
    data: {
      name: data.name.trim(),
      subject: data.subject?.trim() || null,
      teacherId,
    },
  });
  revalidatePath("/dashboard");
  return classroom;
}

export async function updateClassroom(
  classroomId: string,
  input: { name: string; subject?: string },
) {
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

export async function addStudent(
  classroomId: string,
  input: { name: string; email?: string },
) {
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
  input: { name: string; email?: string },
) {
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
  });
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
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
  });
  await requireClassroomOwner(student.classroomId);
  await prisma.student.delete({ where: { id: studentId } });
  revalidatePath(`/classrooms/${student.classroomId}`);
  revalidatePath(`/classrooms/${student.classroomId}/settings`);
}

export async function importStudentsFromFile(classroomId: string, file: File) {
  await requireClassroomOwner(classroomId);
  if (!file?.name) throw new Error("กรุณาเลือกไฟล์ก่อน");

  const rows = await parseImportedRows(file);
  if (rows.length === 0) throw new Error("ไม่พบข้อมูลนักเรียนในไฟล์นี้");

  const last = await prisma.student.findFirst({
    where: { classroomId },
    orderBy: { number: "desc" },
  });
  let nextNumber = (last?.number ?? 0) + 1;

  for (const row of rows) {
    if (!row.name?.trim()) continue;
    await prisma.student.create({
      data: {
        classroomId,
        number: nextNumber,
        name: row.name.trim(),
        email: row.email?.trim() || null,
      },
    });
    nextNumber += 1;
  }

  revalidatePath(`/classrooms/${classroomId}`);
  revalidatePath(`/classrooms/${classroomId}/settings`);
  return {
    importedCount: rows.length,
    message: `เพิ่มนักเรียน ${rows.length} คนจากไฟล์เรียบร้อยแล้ว`,
  };
}

export async function regenerateStudentLink(studentId: string) {
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
  });
  await requireClassroomOwner(student.classroomId);
  const updated = await prisma.student.update({
    where: { id: studentId },
    data: { accessToken: crypto.randomUUID() },
  });
  revalidatePath(`/classrooms/${student.classroomId}/settings`);
  return updated.accessToken;
}

export async function setStudentPin(studentId: string, pin: string | null) {
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
  });
  await requireClassroomOwner(student.classroomId);
  const pinHash = pin ? await bcrypt.hash(pin, 10) : null;
  await prisma.student.update({ where: { id: studentId }, data: { pinHash } });
  revalidatePath(`/classrooms/${student.classroomId}/settings`);
}

// ---------- Assignment columns ----------

const columnSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
});

export async function addColumn(classroomId: string, input: { title: string }) {
  await requireClassroomOwner(classroomId);
  const data = columnSchema.parse(input);
  const last = await prisma.assignmentColumn.findFirst({
    where: { classroomId },
    orderBy: { order: "desc" },
  });
  const column = await prisma.assignmentColumn.create({
    data: {
      classroomId,
      title: data.title.trim(),
      order: (last?.order ?? 0) + 1,
    },
  });
  revalidatePath(`/classrooms/${classroomId}`);
  return column;
}

export async function renameColumn(columnId: string, title: string) {
  const column = await prisma.assignmentColumn.findUniqueOrThrow({
    where: { id: columnId },
  });
  await requireClassroomOwner(column.classroomId);
  columnSchema.parse({ title });
  await prisma.assignmentColumn.update({
    where: { id: columnId },
    data: { title: title.trim() },
  });
  revalidatePath(`/classrooms/${column.classroomId}`);
}

export async function deleteColumn(columnId: string) {
  const column = await prisma.assignmentColumn.findUniqueOrThrow({
    where: { id: columnId },
  });
  await requireClassroomOwner(column.classroomId);
  await prisma.assignmentColumn.delete({ where: { id: columnId } });
  revalidatePath(`/classrooms/${column.classroomId}`);
}

// ---------- Submissions (the checkboxes) ----------

export async function toggleSubmission(
  studentId: string,
  columnId: string,
  checked: boolean,
) {
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
  });
  await requireClassroomOwner(student.classroomId);

  await prisma.submission.upsert({
    where: { studentId_columnId: { studentId, columnId } },
    update: { checked },
    create: { studentId, columnId, checked },
  });
  revalidatePath(`/classrooms/${student.classroomId}`);
}
