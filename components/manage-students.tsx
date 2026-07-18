"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addStudent,
  updateStudent,
  deleteStudent,
  importStudentsFromFile,
} from "@/lib/actions";

type Student = {
  id: string;
  number: number;
  name: string;
  email: string | null;
};

export default function ManageStudents({
  classroomId,
  joinCode,
  students,
  siteUrl,
}: {
  classroomId: string;
  joinCode: string;
  students: Student[];
  siteUrl: string;
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [searchText, setSearchText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await addStudent(classroomId, {
      name: newName.trim(),
      email: newEmail.trim() || undefined,
    });
    setNewName("");
    setNewEmail("");
    router.refresh();
  }

  function startEdit(s: Student) {
    setEditingId(s.id);
    setEditName(s.name);
    setEditEmail(s.email ?? "");
  }

  async function saveEdit(id: string) {
    await updateStudent(id, {
      name: editName.trim(),
      email: editEmail.trim() || undefined,
    });
    setEditingId(null);
    router.refresh();
  }

  async function onDelete(id: string, name: string) {
    if (
      !confirm(
        `ลบ ${name} ออกจากห้องเรียนนี้จริงหรือไม่? การส่งงานเดิมจะหายไปด้วย`,
      )
    ) {
      return;
    }
    await deleteStudent(id);
    router.refresh();
  }

  async function copyJoinLink() {
    const link = `${siteUrl}/join/${joinCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("คัดลอกลิงก์เข้าห้องเรียน", link);
    }
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportMessage(null);
    try {
      const result = await importStudentsFromFile(classroomId, file);
      setImportMessage(result.message);
      router.refresh();
    } catch (error) {
      setImportMessage(
        error instanceof Error ? error.message : "ไม่สามารถอัปโหลดไฟล์ได้",
      );
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  }

  const normalizedSearch = searchText.trim().toLowerCase();
  const filteredStudents = students.filter((s) => {
    if (!normalizedSearch) return true;
    const haystack = `${s.name} ${s.email ?? ""}`.toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  return (
    <div className="card">
      <div className="p-5 border-b border-line">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <form
            onSubmit={onAdd}
            className="flex flex-1 flex-wrap items-end gap-2"
          >
            <div className="min-w-[180px] flex-1 sm:flex-none">
              <label className="label block mb-1.5">ชื่อนักเรียน</label>
              <input
                className="input w-full sm:w-48"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div className="min-w-[220px] flex-1 sm:flex-none">
              <label className="label block mb-1.5">อีเมล (ไม่บังคับ)</label>
              <input
                className="input w-full sm:w-56"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary whitespace-nowrap">
              เพิ่มนักเรียน
            </button>
          </form>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.text,.tsv,.xlsx,.xlsm"
              className="hidden"
              onChange={handleImportFile}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary whitespace-nowrap"
              disabled={importing}
            >
              {importing
                ? "กำลังอัปโหลด..."
                : "อัปโหลดรายชื่อ (.csv/.txt/.xlsx)"}
            </button>
            <button
              type="button"
              onClick={copyJoinLink}
              className="btn btn-secondary whitespace-nowrap"
            >
              {copied ? "คัดลอกแล้ว!" : "คัดลอกลิงก์ห้องเรียน"}
            </button>
          </div>
        </div>
        {importMessage && (
          <p className="mt-3 text-sm text-mossdark">{importMessage}</p>
        )}
      </div>

      <div className="border-b border-line bg-soft px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-sm text-muted">ค้นหานักเรียน</label>
          <input
            className="input w-full sm:w-72"
            placeholder="พิมพ์ชื่อนักเรียนหรืออีเมล"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      <ul className="divide-y divide-line">
        {filteredStudents.map((s) => (
          <li key={s.id} className="p-4">
            {editingId === s.id ? (
              <div className="flex flex-wrap gap-2 items-end">
                <input
                  className="input w-40"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <input
                  className="input w-56"
                  type="email"
                  placeholder="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => saveEdit(s.id)}
                >
                  บันทึก
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setEditingId(null)}
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-xs text-muted mr-2">
                    #{s.number}
                  </span>
                  <span className="font-medium">{s.name}</span>
                  {s.email && (
                    <span className="text-sm text-muted ml-2">{s.email}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn btn-secondary"
                    onClick={() => startEdit(s)}
                  >
                    แก้ไข
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => onDelete(s.id, s.name)}
                  >
                    ลบ
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
        {filteredStudents.length === 0 && (
          <li className="p-6 text-center text-muted text-sm">
            {students.length === 0
              ? "ยังไม่มีนักเรียน เพิ่มคนแรกจากด้านบนได้เลย"
              : "ไม่พบนักเรียนที่ตรงกับคำค้นหานี้"}
          </li>
        )}
      </ul>
    </div>
  );
}
