import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user.role === "ADMIN") redirect("/admin/teachers");
  if (session?.user.role === "TEACHER") redirect("/dashboard");
  if (session?.user.role === "STUDENT")
    redirect(`/classrooms/${session.user.classroomId}`);

  redirect("/login");
}
