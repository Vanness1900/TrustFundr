// src/app/platform-manager/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PlatformManagerIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/platform-manager/categories");
  }, [router]);

  return null;
}
