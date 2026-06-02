"use client";

import Link from "next/link";
import { Bell, CheckCheck, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Notification } from "@/types";

export default function NotificationsPage() {
  const { isAuthenticated } = useAuthStore();
  const query = useQuery({
    queryKey: ["notifications-page"],
    queryFn: async () => {
      const response = await notificationsApi.list();
      return (response.data.results ?? response.data) as Notification[];
    },
    enabled: isAuthenticated,
  });
  const notifications = query.data ?? [];

  return (
    <main className="min-h-screen bg-slate-950 grid-bg">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Header />
        {!isAuthenticated ? <AuthNotice /> : (
          <section className="card divide-y divide-slate-800">
            {notifications.map((item) => (
              <article key={item.id} className="flex items-start justify-between gap-4 p-5">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600/20">
                    <Bell className="h-5 w-5 text-brand-200" />
                  </div>
                  <div>
                    <h2 className="font-medium text-slate-100">{item.title}</h2>
                    <p className="mt-1 text-sm text-slate-400">{item.message}</p>
                    <p className="mt-2 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <span className="badge border-slate-700 text-slate-300">{item.severity}</span>
              </article>
            ))}
            {!notifications.length ? <div className="p-6 text-sm text-slate-500">No notifications to show.</div> : null}
          </section>
        )}
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link href="/" className="text-sm font-medium text-brand-300">NexaAdmin</Link>
        <h1 className="page-title mt-1">Notifications</h1>
        <p className="mt-2 text-sm text-slate-400">Alerts for billing failures, trials, signups, seats, and system events.</p>
      </div>
      <button className="btn-secondary" onClick={() => notificationsApi.markAllRead()}>
        <CheckCheck className="h-4 w-4" />
        Mark all read
      </button>
    </header>
  );
}

function AuthNotice() {
  return (
    <section className="card max-w-xl p-6">
      <ShieldCheck className="h-5 w-5 text-brand-300" />
      <h2 className="section-title mt-4">Sign in required</h2>
      <Link href="/" className="btn-primary mt-5">Go to Dashboard</Link>
    </section>
  );
}
