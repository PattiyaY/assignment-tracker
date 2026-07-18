import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: "ClassTrack — ติดตามการส่งงานในห้องเรียน",
  description: "ติดตามการส่งงานและความคืบหน้าของนักเรียนอย่างง่ายดาย",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
