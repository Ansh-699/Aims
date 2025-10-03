"use client";

import { usePathname } from "next/navigation";
import React from "react";
import { AttendanceProvider } from "@/contexts/AttendanceContext";

export default function ConditionalWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";

  // If current route is root, don't apply the wrapper classes or background
  const isRoot = pathname === "/";
  const className = isRoot ? undefined : "md:max-w-6xl lg:max-w-6xl mx-auto";
  const style = isRoot ? undefined : { backgroundColor: "#ECF3FF" } as React.CSSProperties;

  return (
    <AttendanceProvider>
      <div className={className} style={style}>
        {children}
      </div>
    </AttendanceProvider>
  );
}
