import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "TEACHER" | "STUDENT";
      classroomId?: string;
    } & DefaultSession["user"];
  }
}
