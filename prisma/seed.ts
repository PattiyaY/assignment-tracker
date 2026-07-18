import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@example.com" },
    update: {},
    create: {
      name: "Alex Rivera",
      email: "teacher@example.com",
      passwordHash,
      role: "TEACHER",
    },
  });

  const classroom = await prisma.classroom.create({
    data: {
      name: "Grade 9 — Biology",
      subject: "Biology",
      teacherId: teacher.id,
      columns: {
        create: [
          { title: "Homework 1", order: 1 },
          { title: "Lab Report", order: 2 },
          { title: "Reading Quiz", order: 3 },
        ],
      },
      students: {
        create: [
          { number: 1, name: "Amara Chen" },
          { number: 2, name: "Diego Fernandez" },
          { number: 3, name: "Priya Nair" },
          { number: 4, name: "Liam O'Connor" },
        ],
      },
    },
    include: { columns: true, students: true },
  });

  // Mark some submissions checked so the demo dashboard has real numbers.
  const pattern = [
    [true, true, false],
    [true, false, false],
    [true, true, true],
    [false, false, false],
  ];
  for (let i = 0; i < classroom.students.length; i++) {
    for (let j = 0; j < classroom.columns.length; j++) {
      await prisma.submission.create({
        data: {
          studentId: classroom.students[i].id,
          columnId: classroom.columns[j].id,
          checked: pattern[i][j],
        },
      });
    }
  }

  console.log("Seeded demo data.");
  console.log("Teacher login: teacher@example.com / password123");
  console.log(
    "Student links:",
    classroom.students.map((s) => `${s.name}: /s/${s.accessToken}`)
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
