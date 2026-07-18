import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavBar from "@/components/nav-bar";
import CreateClassroomForm from "@/components/create-classroom-form";
import ClassroomSearch from "@/components/classroom-search";

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

  const statsByClassroom = new Map<
    string,
    { checked: number; total: number }
  >();
  for (const c of classrooms) {
    statsByClassroom.set(c.id, {
      checked: 0,
      total: c.students.length * c.columns.length,
    });
  }
  for (const s of submissions) {
    const entry = statsByClassroom.get(s.column.classroomId);
    if (entry && s.checked) entry.checked += 1;
  }

  const totalChecked = [...statsByClassroom.values()].reduce(
    (a, b) => a + b.checked,
    0,
  );
  const totalPossible = [...statsByClassroom.values()].reduce(
    (a, b) => a + b.total,
    0,
  );
  const overallRate = totalPossible > 0 ? totalChecked / totalPossible : 0;
  const totalStudents = classrooms.reduce((a, c) => a + c._count.students, 0);
  const totalAssignments = classrooms.reduce((a, c) => a + c._count.columns, 0);

  return (
    <div>
      <NavBar userName={session!.user.name ?? "Teacher"} role="TEACHER" />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <p className="label text-clay mb-2">overview</p>
        <h1 className="font-display text-3xl mb-8">Dashboard</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="ห้องเรียน" value={String(classrooms.length)} />
          <StatCard label="นักเรียน" value={String(totalStudents)} />
          <StatCard label="งานที่ต้องส่ง" value={String(totalAssignments)} />
          <StatCard
            label="อัตราการส่งรวม"
            value={totalPossible > 0 ? pct(overallRate) : "—"}
            accent
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          {/* <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">ห้องเรียนของคุณ</h2>
          </div> */}
        </div>
        {classrooms.length === 0 ? (
          <div className="card p-8 text-center text-muted">
            ยังไม่มีห้องเรียนเลย
            สร้างห้องเรียนแรกจากด้านบนแล้วคุณจะเพิ่มนักเรียนและงานที่ต้องส่งได้ทันที
          </div>
        ) : (
          <ClassroomSearch
            classrooms={classrooms.map((c) => {
              const stat = statsByClassroom.get(c.id)!;
              const rate = stat.total > 0 ? stat.checked / stat.total : 0;
              return {
                id: c.id,
                name: c.name,
                subject: c.subject,
                studentCount: c._count.students,
                columnCount: c._count.columns,
                progressPercent: stat.total > 0 ? Math.round(rate * 100) : 0,
              };
            })}
          />
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="card p-4">
      <p className="label mb-1">{label}</p>
      <p className={`font-display text-2xl ${accent ? "text-mossdark" : ""}`}>
        {value}
      </p>
    </div>
  );
}
