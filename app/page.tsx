import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user.role === "TEACHER") redirect("/dashboard");
  if (session?.user.role === "STUDENT") redirect(`/classrooms/${session.user.classroomId}`);

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-lg w-full">
          <p className="label text-clay mb-3">01 — a roster, not a platform</p>
          <h1 className="font-display text-5xl leading-[1.05] mb-5">
            Know who submitted<br />before they tell you.
          </h1>
          <p className="text-muted text-[15px] leading-relaxed mb-9">
            ClassTrack is a lightweight submission ledger for teachers. Create a
            classroom, add students, add assignments, tick boxes — the progress
            math takes care of itself.
          </p>
          <div className="flex gap-3">
            <Link href="/login" className="btn btn-primary">
              Teacher sign in
            </Link>
            <Link href="/register" className="btn btn-secondary">
              Create teacher account
            </Link>
          </div>
          <p className="text-xs text-muted mt-8 leading-relaxed">
            Are you a student? Your teacher will send you a private class link —
            open it directly, there's nothing to sign up for.
          </p>
        </div>
      </div>
      <footer className="text-center text-xs text-muted py-6 border-t border-line">
        ClassTrack
      </footer>
    </main>
  );
}
