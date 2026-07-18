import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function RedirectPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role === "STUDENT" && session.user.classroomId) {
    redirect(`/classrooms/${session.user.classroomId}`);
  }
  if (session?.user.role === "TEACHER") {
    redirect("/dashboard");
  }
  redirect("/login");
}
