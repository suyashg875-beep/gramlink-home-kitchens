import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth, type Role } from "@/lib/auth";
import { Empty, Page } from "@/components/gram";

export function RequireRole({ role, children }: { role: Exclude<Role, null>; children: ReactNode }) {
  const { role: current, loading } = useAuth();
  if (loading) return <Page><div className="h-40 animate-pulse rounded-3xl bg-muted" /></Page>;
  if (current !== role) {
    return (
      <Page>
        <Empty emoji="🔒" title="This page is not for your account">
          <Link to="/" className="font-bold text-primary underline">Go to home</Link>
        </Empty>
      </Page>
    );
  }
  return <>{children}</>;
}
