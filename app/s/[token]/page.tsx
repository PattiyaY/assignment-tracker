"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

export default function StudentAccessPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void attempt();
  }, [params.token]);

  async function attempt() {
    setLoading(true);
    setError(null);
    const res = await signIn("student", {
      token: params.token,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("ลิงก์เข้าห้องเรียนไม่ถูกต้องหรือหมดอายุแล้ว");
      return;
    }
    router.push("/classrooms/redirect");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#fff4d9,_#f8f6ef_55%,_#eef6ee)] px-6">
        <div className="card p-8 max-w-sm w-full text-center">
          <p className="label text-clay mb-2">กำลังเข้าสู่ห้องเรียน</p>
          <p className="text-muted text-sm">กรุณารอสักครู่…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#fff4d9,_#f8f6ef_55%,_#eef6ee)] px-6">
      <div className="card p-8 max-w-md w-full text-center">
        <p className="label text-clay mb-2">ลิงก์เข้าห้องเรียน</p>
        <h1 className="font-display text-2xl mb-3">
          ไม่สามารถเข้าห้องเรียนได้
        </h1>
        <p className="text-sm text-muted">
          {error ?? "กรุณาติดต่อครูเพื่อขอลิงก์ใหม่"}
        </p>
      </div>
    </main>
  );
}
