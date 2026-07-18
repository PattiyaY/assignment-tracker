"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CreateClassroomForm from "./create-classroom-form";

type ClassroomListItem = {
  id: string;
  name: string;
  subject: string | null;
  studentCount: number;
  columnCount: number;
  progressPercent: number;
};

export default function ClassroomSearch({
  classrooms,
}: {
  classrooms: ClassroomListItem[];
}) {
  const [query, setQuery] = useState("");

  const filteredClassrooms = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return classrooms;
    return classrooms.filter((c) => {
      const name = c.name.toLowerCase();
      const subject = c.subject?.toLowerCase() ?? "";
      return name.includes(normalized) || subject.includes(normalized);
    });
  }, [classrooms, query]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="mb-4">
          <label className="label block mb-2">ค้นหาห้องเรียน</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาตามชื่อหรือต้นเรื่อง"
            className="input max-w-lg"
          />
        </div>
        <div className="pt-2">
          <CreateClassroomForm />
        </div>
      </div>
      {filteredClassrooms.length === 0 ? (
        <div className="card p-8 text-center text-muted">
          ไม่พบห้องเรียนที่ตรงกับคำค้นหา
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredClassrooms.map((c) => (
            <Link
              key={c.id}
              href={`/classrooms/${c.id}`}
              className="card p-5 hover:border-mossdark transition-colors block"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display text-lg">{c.name}</h3>
                  {c.subject && (
                    <p className="text-sm text-muted">{c.subject}</p>
                  )}
                </div>
                <span className="font-mono text-xs text-muted">
                  {c.studentCount} นักเรียน
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-line overflow-hidden">
                  <div
                    className="h-full bg-moss"
                    style={{ width: `${c.progressPercent}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-muted w-10 text-right">
                  {c.progressPercent}%
                </span>
              </div>
              <p className="text-xs text-muted mt-2">
                {c.columnCount} งานที่ต้องส่ง
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
