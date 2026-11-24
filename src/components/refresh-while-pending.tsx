"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The agent works in the background, so the page polls until the workspace is ready.
export function RefreshWhilePending({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs]);

  return null;
}
