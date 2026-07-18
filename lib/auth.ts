import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// ClassTrack has two very different sign-in flows behind ONE credentials
// provider (NextAuth only allows email/password style UIs to be swapped
// out easily this way):
//
//  - Teachers sign in with email + password, like any normal account.
//  - Students never set a password. A teacher adds them by name and
//    ClassTrack generates a shared classroom link for the class.
//    Opening that link signs the student in automatically as themselves,
//    read-only.
//
// Both flows resolve to a NextAuth session with a `role` claim, which is
// what every server action and page checks before doing anything.

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "teacher",
      name: "Teacher",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });
        if (!user) return null;
        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );
        if (!valid) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as "ADMIN" | "TEACHER" | "STUDENT",
        };
      },
    }),
    CredentialsProvider({
      id: "student",
      name: "Student",
      credentials: {
        token: { label: "ลิงก์เข้าห้องเรียน", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;
        const student = await prisma.student.findUnique({
          where: { accessToken: credentials.token },
        });
        if (!student) return null;
        return {
          id: student.id,
          name: student.name,
          role: "STUDENT" as const,
          classroomId: student.classroomId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.uid = user.id;
        if ((user as any).classroomId)
          token.classroomId = (user as any).classroomId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.uid as string;
        (session.user as any).role = token.role as string;
        if (token.classroomId)
          (session.user as any).classroomId = token.classroomId as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
