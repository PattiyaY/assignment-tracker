"use client";

import { useState } from "react";

export default function ClassroomLinkButton({
  joinCode,
  siteUrl,
}: {
  joinCode: string;
  siteUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const link = `${siteUrl}/join/${joinCode}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("คัดลอกลิงก์เข้าห้องเรียนนี้", link);
    }
  }

  return (
    <button onClick={copyLink} className="btn btn-primary">
      {copied ? "คัดลอกแล้ว!" : "คัดลอกลิงก์เข้าห้อง"}
    </button>
  );
}
