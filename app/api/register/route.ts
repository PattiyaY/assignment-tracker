import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "ไม่มีสิทธิ์สร้างบัญชีครู" },
      { status: 403 },
    );
  }

  return NextResponse.json(
    { error: "ใช้ API ผู้ดูแลระบบเพื่อสร้างบัญชีครู" },
    { status: 403 },
  );
}
