"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleSubmission, addColumn, deleteColumn, addStudent } from "@/lib/actions";

type Column = { id: string; title: string };
type Student = {
  id: string;
  number: number;
  name: string;
  submissions: Record<string, boolean>;
};

export default function RosterGrid({
  classroomId,
  columns,
  students,
  canEdit,
  currentStudentId,
}: {
  classroomId: string;
  columns: Column[];
  students: Student[];
  canEdit: boolean;
  currentStudentId?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localChecks, setLocalChecks] = useState<Record<string, boolean>>({});
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");

  function key(studentId: string, columnId: string) {
    return `${studentId}:${columnId}`;
  }

  function isChecked(s: Student, columnId: string) {
    const k = key(s.id, columnId);
    return k in localChecks ? localChecks[k] : !!s.submissions[columnId];
  }

  function onToggle(studentId: string, columnId: string, current: boolean) {
    if (!canEdit) return;
    const next = !current;
    setLocalChecks((prev) => ({ ...prev, [key(studentId, columnId)]: next }));
    startTransition(async () => {
      try {
        await toggleSubmission(studentId, columnId, next);
      } catch {
        // revert on failure
        setLocalChecks((prev) => ({ ...prev, [key(studentId, columnId)]: current }));
      }
    });
  }

  function progress(s: Student) {
    if (columns.length === 0) return 0;
    const checkedCount = columns.filter((c) => isChecked(s, c.id)).length;
    return checkedCount / columns.length;
  }

  async function onAddColumn(e: React.FormEvent) {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;
    await addColumn(classroomId, { title: newColumnTitle.trim() });
    setNewColumnTitle("");
    setAddingColumn(false);
    router.refresh();
  }

  async function onAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    await addStudent(classroomId, { name: newStudentName.trim() });
    setNewStudentName("");
    setAddingStudent(false);
    router.refresh();
  }

  async function onDeleteColumn(columnId: string) {
    if (!confirm("Delete this assignment column? This removes all checkmarks for it.")) return;
    await deleteColumn(columnId);
    router.refresh();
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-line">
            <th className="text-left px-4 py-3 label w-12">No.</th>
            <th className="text-left px-4 py-3 label min-w-[160px]">Student</th>
            {columns.map((c) => (
              <th key={c.id} className="px-3 py-3 label text-center min-w-[100px]">
                <div className="flex items-center justify-center gap-1.5 group">
                  <span>{c.title}</span>
                  {canEdit && (
                    <button
                      onClick={() => onDeleteColumn(c.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted hover:text-clay transition-opacity"
                      title="Delete column"
                      aria-label={`Delete ${c.title}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              </th>
            ))}
            <th className="px-4 py-3 label text-right min-w-[110px]">Progress</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const p = progress(s);
            const isMe = s.id === currentStudentId;
            return (
              <tr
                key={s.id}
                className={`border-b border-line last:border-0 ${isMe ? "bg-gold/10" : ""}`}
              >
                <td className="px-4 py-2.5 font-mono text-muted">{s.number}</td>
                <td className="px-4 py-2.5 font-medium">
                  {s.name}
                  {isMe && <span className="ml-2 text-xs text-muted">(you)</span>}
                </td>
                {columns.map((c) => {
                  const checked = isChecked(s, c.id);
                  return (
                    <td key={c.id} className="text-center px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!canEdit}
                        onChange={() => onToggle(s.id, c.id, checked)}
                        className="w-4 h-4 accent-[#2B4132] disabled:cursor-not-allowed cursor-pointer"
                        aria-label={`${s.name} — ${c.title}`}
                      />
                    </td>
                  );
                })}
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2 justify-end">
                    <div className="w-16 h-1.5 rounded-full bg-line overflow-hidden">
                      <div className="h-full bg-moss" style={{ width: `${Math.round(p * 100)}%` }} />
                    </div>
                    <span className="font-mono text-xs text-muted w-9 text-right">
                      {Math.round(p * 100)}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
          {students.length === 0 && (
            <tr>
              <td colSpan={columns.length + 3} className="px-4 py-8 text-center text-muted">
                No students yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {canEdit && (
        <div className="p-4 border-t border-line flex flex-wrap gap-3">
          {addingColumn ? (
            <form onSubmit={onAddColumn} className="flex gap-2 items-center">
              <input
                autoFocus
                className="input w-48"
                placeholder="Assignment name"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Add</button>
              <button type="button" className="btn btn-secondary" onClick={() => setAddingColumn(false)}>
                Cancel
              </button>
            </form>
          ) : (
            <button className="btn btn-secondary" onClick={() => setAddingColumn(true)}>
              + Add assignment column
            </button>
          )}

          {addingStudent ? (
            <form onSubmit={onAddStudent} className="flex gap-2 items-center">
              <input
                autoFocus
                className="input w-48"
                placeholder="Student name"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Add</button>
              <button type="button" className="btn btn-secondary" onClick={() => setAddingStudent(false)}>
                Cancel
              </button>
            </form>
          ) : (
            <button className="btn btn-secondary" onClick={() => setAddingStudent(true)}>
              + Add student
            </button>
          )}
        </div>
      )}
    </div>
  );
}
