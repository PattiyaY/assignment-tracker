import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavBar from "@/components/nav-bar";
import CreateTeacherAccountForm from "@/components/create-teacher-account-form";

export default async function AdminTeachersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <NavBar userName={session.user.name ?? "Admin"} role="ADMIN" />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <p className="label text-clay mb-2">ผู้ดูแลระบบ</p>
        <h1 className="font-display text-3xl mb-8">จัดการบัญชีครู</h1>

        <div className="mb-8">
          <CreateTeacherAccountForm />
        </div>

        <section className="card p-5">
          <h2 className="font-display text-xl mb-4">บัญชีครูที่มีอยู่</h2>
          {teachers.length === 0 ? (
            <p className="text-sm text-muted">ยังไม่มีบัญชีครู</p>
          ) : (
            <ul className="divide-y divide-line">
              {teachers.map((teacher) => (
                <li
                  key={teacher.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium">{teacher.name}</p>
                    <p className="text-sm text-muted">{teacher.email}</p>
                  </div>
                  <p className="text-xs text-muted">
                    สร้างเมื่อ{" "}
                    {new Date(teacher.createdAt).toLocaleDateString("th-TH")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
