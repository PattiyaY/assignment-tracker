import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireClassroomAccess } from "@/lib/guard";
import NavBar from "@/components/nav-bar";
import RosterGrid from "@/components/roster-grid";

export default async function ClassroomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let access;
  try {
    access = await requireClassroomAccess(id);
  } catch {
    notFound();
  }
  const { session, canEdit } = access!;

  const classroom = await prisma.classroom.findUnique({
    where: { id },
    include: {
      students: {
        orderBy: { number: "asc" },
        include: { submissions: true },
      },
      columns: { orderBy: { order: "asc" } },
    },
  });
  if (!classroom) notFound();

  const students = classroom.students.map((s) => ({
    id: s.id,
    number: s.number,
    name: s.name,
    submissions: Object.fromEntries(s.submissions.map((sub) => [sub.columnId, sub.checked])),
  }));

  const totalPossible = students.length * classroom.columns.length;
  const totalChecked = classroom.students.reduce(
    (acc, s) => acc + s.submissions.filter((sub) => sub.checked).length,
    0
  );
  const submitRate = totalPossible > 0 ? totalChecked / totalPossible : 0;

  return (
    <div>
      <NavBar userName={session.user.name ?? (canEdit ? "Teacher" : "Student")} role={session.user.role} />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="label text-clay mb-2">{classroom.subject || "Classroom"}</p>
            <h1 className="font-display text-3xl">{classroom.name}</h1>
          </div>
          {canEdit && (
            <Link href={`/classrooms/${classroom.id}/settings`} className="btn btn-secondary">
              Manage classroom
            </Link>
          )}
        </div>

        <div className="flex gap-6 text-sm text-muted my-6">
          <span><strong className="text-ink font-mono">{students.length}</strong> students</span>
          <span><strong className="text-ink font-mono">{classroom.columns.length}</strong> assignments</span>
          <span>
            <strong className="text-ink font-mono">{Math.round(submitRate * 100)}%</strong> submitted ·{" "}
            <strong className="text-ink font-mono">{Math.round((1 - submitRate) * 100)}%</strong> not submitted
          </span>
        </div>

        <RosterGrid
          classroomId={classroom.id}
          columns={classroom.columns.map((c) => ({ id: c.id, title: c.title }))}
          students={students}
          canEdit={canEdit}
          currentStudentId={session.user.role === "STUDENT" ? session.user.id : undefined}
        />

        {!canEdit && (
          <p className="text-xs text-muted mt-4">
            You're viewing this classroom as a student — checkmarks are set by your teacher.
          </p>
        )}
      </main>
    </div>
  );
}
