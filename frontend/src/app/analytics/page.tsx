"use client";

import Link from "next/link";
import { Activity, DollarSign, ShieldCheck, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { DashboardSummary, RevenuePoint, UserGrowth } from "@/types";

const fallback: DashboardSummary = {
  total_tenants: 0,
  active_users: 0,
  total_users: 0,
  mrr: 0,
  active_subscriptions: 0,
  trial_subscriptions: 0,
  revenue_mtd: 0,
  churn_rate: 0,
};

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export default function AnalyticsPage() {
  const { isAuthenticated } = useAuthStore();
  const summaryQuery = useQuery({
    queryKey: ["analytics-page-summary"],
    queryFn: async () => (await analyticsApi.summary()).data as DashboardSummary,
    enabled: isAuthenticated,
  });
  const revenueQuery = useQuery({
    queryKey: ["analytics-page-revenue"],
    queryFn: async () => (await analyticsApi.revenue(6)).data as RevenuePoint[],
    enabled: isAuthenticated,
  });
  const growthQuery = useQuery({
    queryKey: ["analytics-page-growth"],
    queryFn: async () => (await analyticsApi.userGrowth(6)).data as UserGrowth,
    enabled: isAuthenticated,
  });

  const summary = summaryQuery.data ?? fallback;
  const revenue = revenueQuery.data ?? [];
  const growth = growthQuery.data;

  return (
    <main className="min-h-screen bg-slate-950 grid-bg">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Header />
        {!isAuthenticated ? <AuthNotice /> : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Metric icon={DollarSign} label="MRR" value={money(summary.mrr)} />
              <Metric icon={DollarSign} label="Revenue MTD" value={money(summary.revenue_mtd)} />
              <Metric icon={Users} label="Active Users" value={summary.active_users.toString()} />
              <Metric icon={Activity} label="Churn" value={`${summary.churn_rate}%`} />
            </div>
            <section className="card p-5">
              <h2 className="section-title">Revenue Trend</h2>
              <div className="mt-6 flex h-72 items-end gap-3">
                {(revenue.length ? revenue : [{ month: "No data", revenue: 0, count: 0 }]).map((point) => {
                  const max = Math.max(...revenue.map((item) => item.revenue), 1);
                  const height = Math.max((point.revenue / max) * 100, point.revenue ? 8 : 2);
                  return (
                    <div key={point.month} className="flex min-w-0 flex-1 flex-col items-center gap-3">
                      <div className="flex h-56 w-full items-end">
                        <div className="w-full rounded-t-md bg-brand-500/80" style={{ height: `${height}%` }} />
                      </div>
                      <div className="w-full truncate text-center text-xs text-slate-500">{point.month}</div>
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="card p-5">
              <h2 className="section-title">User Growth</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {(growth?.new_users ?? []).map((point) => (
                  <div key={point.month} className="card-sm p-4">
                    <p className="text-sm text-slate-500">{point.month}</p>
                    <p className="mt-1 text-2xl font-bold">{point.count}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
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
        <h1 className="page-title mt-1">Analytics</h1>
        <p className="mt-2 text-sm text-slate-400">MRR, revenue, churn, growth, and platform health.</p>
      </div>
      <Link href="/" className="btn-secondary">Overview</Link>
    </header>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <article className="stat-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <Icon className="h-4 w-4 text-brand-300" />
      </div>
      <p className="text-2xl font-bold text-slate-50">{value}</p>
    </article>
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
