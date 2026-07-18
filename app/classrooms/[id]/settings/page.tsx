import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireClassroomOwner } from "@/lib/guard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import NavBar from "@/components/nav-bar";
import EditClassroomForm from "@/components/edit-classroom-form";
import ManageStudents from "@/components/manage-students";

export default async function ClassroomSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    await requireClassroomOwner(id);
  } catch {
    notFound();
  }
  const session = await getServerSession(authOptions);

  const classroom = await prisma.classroom.findUnique({
    where: { id },
    include: { students: { orderBy: { number: "asc" } } },
  });
  if (!classroom) notFound();

  const h = await headers();
  const host = h.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const siteUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`;

  return (
    <div>
      <NavBar userName={session!.user.name ?? "Teacher"} role="TEACHER" />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <Link
          href={`/classrooms/${classroom.id}`}
          className="text-sm text-muted hover:text-mossdark"
        >
          ← กลับไปยังแผงรายชื่อ
        </Link>
        <p className="label text-clay mt-4 mb-2">จัดการ</p>
        <h1 className="font-display text-3xl mb-8">{classroom.name}</h1>

        <section className="mb-10">
          <h2 className="font-display text-lg mb-3">รายละเอียดห้องเรียน</h2>
          <EditClassroomForm
            classroomId={classroom.id}
            initialName={classroom.name}
            initialSubject={classroom.subject ?? ""}
          />
        </section>

        <section>
          <h2 className="font-display text-lg mb-1">นักเรียน</h2>
          <p className="text-sm text-muted mb-4">
            ใช้ลิงก์เดียวสำหรับทั้งห้องเรียน
            เพื่อให้นักเรียนเข้าดูห้องเรียนได้ง่าย
          </p>
          <ManageStudents
            classroomId={classroom.id}
            joinCode={classroom.joinCode}
            siteUrl={siteUrl}
            students={classroom.students.map((s) => ({
              id: s.id,
              number: s.number,
              name: s.name,
              email: s.email,
            }))}
          />
        </section>
      </main>
    </div>
  );
}
