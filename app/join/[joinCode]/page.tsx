import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function JoinClassroomPage({
  params,
}: {
  params: Promise<{ joinCode: string }>;
}) {
  const { joinCode } = await params;

  const classroom = await prisma.classroom.findUnique({
    where: { joinCode },
    select: { id: true },
  });

  if (!classroom) notFound();

  redirect(`/classrooms/${classroom.id}`);
}
