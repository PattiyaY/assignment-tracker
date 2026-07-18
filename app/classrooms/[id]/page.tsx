import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireClassroomAccess } from "@/lib/guard";
import NavBar from "@/components/nav-bar";
import RosterGrid from "@/components/roster-grid";
import ClassroomLinkButton from "@/components/classroom-link-button";

export default async function ClassroomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let access;
  try {
    access = await requireClassroomAccess(id);
  } catch {
    notFound();
  }
  const { session, canEdit } = access!;
  const navbarRole = (session?.user?.role ?? "STUDENT") as
    | "ADMIN"
    | "TEACHER"
    | "STUDENT";
  const navbarName = session?.user?.name ?? (canEdit ? "ครู" : "นักเรียน");

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
    submissions: Object.fromEntries(
      s.submissions.map((sub) => [sub.columnId, sub.checked]),
    ),
  }));

  const totalPossible = students.length * classroom.columns.length;
  const totalChecked = classroom.students.reduce(
    (acc, s) => acc + s.submissions.filter((sub) => sub.checked).length,
    0,
  );
  const submitRate = totalPossible > 0 ? totalChecked / totalPossible : 0;

  const h = await headers();
  const host = h.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const siteUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`;

  return (
    <div>
      <NavBar userName={navbarName} role={navbarRole} />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="label text-clay mb-2">
              {classroom.subject || "ห้องเรียน"}
            </p>
            <h1 className="font-display text-3xl">{classroom.name}</h1>
          </div>
          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <ClassroomLinkButton
                joinCode={classroom.joinCode}
                siteUrl={siteUrl}
              />
              <Link
                href={`/classrooms/${classroom.id}/settings`}
                className="btn btn-secondary"
              >
                จัดการห้องเรียน
              </Link>
            </div>
          )}
        </div>

        <div className="flex gap-6 text-sm text-muted my-6">
          <span>
            <strong className="text-ink font-mono">{students.length}</strong>{" "}
            นักเรียน
          </span>
          <span>
            <strong className="text-ink font-mono">
              {classroom.columns.length}
            </strong>{" "}
            งานที่ต้องส่ง
          </span>
          <span>
            <strong className="text-ink font-mono">
              {Math.round(submitRate * 100)}%
            </strong>{" "}
            ส่งแล้ว ·{" "}
            <strong className="text-ink font-mono">
              {Math.round((1 - submitRate) * 100)}%
            </strong>{" "}
            ยังไม่ส่ง
          </span>
        </div>

        <RosterGrid
          classroomId={classroom.id}
          columns={classroom.columns.map((c) => ({ id: c.id, title: c.title }))}
          students={students}
          canEdit={canEdit}
          currentStudentId={
            session?.user?.role === "STUDENT" ? session.user.id : undefined
          }
        />

        {!canEdit && (
          <p className="text-xs text-muted mt-4">
            คุณกำลังดูห้องเรียนในฐานะนักเรียน
          </p>
        )}
      </main>
    </div>
  );
}
