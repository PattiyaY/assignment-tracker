import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavBar from "@/components/nav-bar";
import CreateClassroomForm from "@/components/create-classroom-form";

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const teacherId = session!.user.id;

  const classrooms = await prisma.classroom.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
    include: {
      students: { select: { id: true } },
      columns: { select: { id: true } },
      _count: { select: { students: true, columns: true } },
    },
  });

  // Pull all submissions for these classrooms in one query for the overall rate.
  const classroomIds = classrooms.map((c) => c.id);
  const submissions = await prisma.submission.findMany({
    where: { column: { classroomId: { in: classroomIds } } },
    select: { checked: true, column: { select: { classroomId: true } } },
  });

  const statsByClassroom = new Map<string, { checked: number; total: number }>();
  for (const c of classrooms) {
    statsByClassroom.set(c.id, { checked: 0, total: c.students.length * c.columns.length });
  }
  for (const s of submissions) {
    const entry = statsByClassroom.get(s.column.classroomId);
    if (entry && s.checked) entry.checked += 1;
  }

  const totalChecked = [...statsByClassroom.values()].reduce((a, b) => a + b.checked, 0);
  const totalPossible = [...statsByClassroom.values()].reduce((a, b) => a + b.total, 0);
  const overallRate = totalPossible > 0 ? totalChecked / totalPossible : 0;
  const totalStudents = classrooms.reduce((a, c) => a + c._count.students, 0);
  const totalAssignments = classrooms.reduce((a, c) => a + c._count.columns, 0);

  return (
    <div>
      <NavBar userName={session!.user.name ?? "Teacher"} role="TEACHER" />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <p className="label text-clay mb-2">Overview</p>
        <h1 className="font-display text-3xl mb-8">Dashboard</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="Classrooms" value={String(classrooms.length)} />
          <StatCard label="Students" value={String(totalStudents)} />
          <StatCard label="Assignments" value={String(totalAssignments)} />
          <StatCard
            label="Overall submit rate"
            value={totalPossible > 0 ? pct(overallRate) : "—"}
            accent
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">Your classrooms</h2>
        </div>

        <div className="mb-6">
          <CreateClassroomForm />
        </div>

        {classrooms.length === 0 ? (
          <div className="card p-8 text-center text-muted">
            No classrooms yet. Create your first one above — you'll be able to add
            students and assignments right after.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {classrooms.map((c) => {
              const stat = statsByClassroom.get(c.id)!;
              const rate = stat.total > 0 ? stat.checked / stat.total : 0;
              return (
                <Link
                  key={c.id}
                  href={`/classrooms/${c.id}`}
                  className="card p-5 hover:border-mossdark transition-colors block"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display text-lg">{c.name}</h3>
                      {c.subject && <p className="text-sm text-muted">{c.subject}</p>}
                    </div>
                    <span className="font-mono text-xs text-muted">{c._count.students} students</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-line overflow-hidden">
                      <div
                        className="h-full bg-moss"
                        style={{ width: `${Math.round(rate * 100)}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-muted w-10 text-right">
                      {stat.total > 0 ? pct(rate) : "—"}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-2">
                    {c._count.columns} assignment{c._count.columns === 1 ? "" : "s"} tracked
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card p-4">
      <p className="label mb-1">{label}</p>
      <p className={`font-display text-2xl ${accent ? "text-mossdark" : ""}`}>{value}</p>
    </div>
  );
}
