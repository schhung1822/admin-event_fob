"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center space-y-2 text-center">
      <h1 className="font-semibold text-2xl">Không tìm thấy trang.</h1>
      <p className="text-muted-foreground">Không tìm thấy trang bạn đang tìm kiếm.</p>
      <Link prefetch={false} replace href="/dashboard/default">
        <Button variant="outline">Về trang chủ</Button>
      </Link>
    </div>
  );
}
