"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Building2,
  CreditCard,
  DollarSign,
  RefreshCcw,
  ShieldCheck,
  type LucideIcon,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  analyticsApi,
  notificationsApi,
  plansApi,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { DashboardSummary, Notification, Plan, RevenuePoint } from "@/types";

const fallbackSummary: DashboardSummary = {
  total_tenants: 0,
  active_users: 0,
  total_users: 0,
  mrr: 0,
  active_subscriptions: 0,
  trial_subscriptions: 0,
  revenue_mtd: 0,
  churn_rate: 0,
};

const navItems: Array<[string, LucideIcon, string]> = [
  ["Overview", Activity, "/"],
  ["Tenants", Building2, "/tenants"],
  ["Users", Users, "/users"],
  ["Billing", CreditCard, "/billing"],
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export default function DashboardPage() {
  const { isAuthenticated, isLoading, login, logout, user } = useAuthStore();
  const [loginError, setLoginError] = useState("");

  const summaryQuery = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: async () => (await analyticsApi.summary()).data as DashboardSummary,
    enabled: isAuthenticated,
  });

  const revenueQuery = useQuery({
    queryKey: ["analytics-revenue"],
    queryFn: async () => (await analyticsApi.revenue(6)).data as RevenuePoint[],
    enabled: isAuthenticated,
  });

  const plansQuery = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const response = await plansApi.list();
      return (response.data.results ?? response.data) as Plan[];
    },
    enabled: isAuthenticated,
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await notificationsApi.list();
      return (response.data.results ?? response.data) as Notification[];
    },
    enabled: isAuthenticated,
  });

  const summary = summaryQuery.data ?? fallbackSummary;
  const revenue = revenueQuery.data ?? [];
  const plans = plansQuery.data ?? [];
  const notifications = notificationsQuery.data ?? [];
  const hasApiError =
    summaryQuery.isError ||
    revenueQuery.isError ||
    plansQuery.isError ||
    notificationsQuery.isError;

  return (
    <main className="min-h-screen bg-slate-950 grid-bg">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 border-r border-slate-800 pr-6 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold">NexaAdmin</p>
              <p className="text-xs text-slate-500">Control plane</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map(([label, Icon, href], index) => (
              <Link
                key={label}
                href={href}
                className={`sidebar-item w-full ${index === 0 ? "sidebar-item-active" : ""}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 flex-1 space-y-6">
          <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-brand-300">Multi-tenant SaaS</p>
              <h1 className="page-title mt-1">Admin Dashboard</h1>
            </div>
            {isAuthenticated ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-slate-400">{user?.email}</span>
                <button
                  type="button"
                  className="btn-secondary w-fit"
                  onClick={() => {
                    summaryQuery.refetch();
                    revenueQuery.refetch();
                    plansQuery.refetch();
                    notificationsQuery.refetch();
                  }}
                >
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </button>
                <button type="button" className="btn-ghost" onClick={logout}>
                  Sign out
                </button>
              </div>
            ) : null}
          </header>

          {!isAuthenticated ? (
            <section className="card max-w-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-600/20 text-brand-200">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="section-title">Demo Sign In</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Use the seeded super admin account to load the sample dashboard data.
                  </p>
                  <div className="mt-4 grid gap-3 text-sm text-slate-300">
                    <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
                      admin@nexasaas.io
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
                      Admin@12345
                    </div>
                  </div>
                  {loginError ? <p className="mt-3 text-sm text-red-300">{loginError}</p> : null}
                  <button
                    type="button"
                    className="btn-primary mt-5"
                    disabled={isLoading}
                    onClick={async () => {
                      setLoginError("");
                      try {
                        await login("admin@nexasaas.io", "Admin@12345");
                      } catch {
                        setLoginError("Demo login failed. Django must be running on port 8000.");
                      }
                    }}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {isLoading ? "Signing in..." : "Load Demo Dashboard"}
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {isAuthenticated && hasApiError ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              A dashboard request failed. Check that Django is still running on port 8000.
            </div>
          ) : null}

          {isAuthenticated ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  icon={Building2}
                  label="Tenants"
                  value={summary.total_tenants.toLocaleString()}
                  detail={`${summary.active_subscriptions} active subscriptions`}
                />
                <MetricCard
                  icon={Users}
                  label="Users"
                  value={summary.total_users.toLocaleString()}
                  detail={`${summary.active_users} active users`}
                />
                <MetricCard
                  icon={DollarSign}
                  label="MRR"
                  value={formatCurrency(summary.mrr)}
                  detail={`${formatCurrency(summary.revenue_mtd)} collected this month`}
                />
                <MetricCard
                  icon={Activity}
                  label="Churn"
                  value={`${summary.churn_rate}%`}
                  detail={`${summary.trial_subscriptions} trials running`}
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="section-title">Revenue</h2>
                    <span className="text-sm text-slate-500">{revenue.length} months</span>
                  </div>
                  <div className="card p-5">
                    <div className="flex h-72 items-end gap-3">
                      {(revenue.length ? revenue : [{ month: "No data", revenue: 0, count: 0 }]).map(
                        (point) => {
                          const max = Math.max(...revenue.map((item) => item.revenue), 1);
                          const height = Math.max((point.revenue / max) * 100, point.revenue ? 8 : 2);

                          return (
                            <div key={point.month} className="flex min-w-0 flex-1 flex-col items-center gap-3">
                              <div className="flex h-56 w-full items-end">
                                <div
                                  className="w-full rounded-t-md bg-brand-500/80"
                                  style={{ height: `${height}%` }}
                                  title={`${point.month}: ${formatCurrency(point.revenue)}`}
                                />
                              </div>
                              <div className="w-full truncate text-center text-xs text-slate-500">
                                {point.month}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="section-title">Notifications</h2>
                  <div className="card divide-y divide-slate-800">
                    {notifications.slice(0, 5).map((item) => (
                      <div key={item.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium text-slate-100">{item.title}</p>
                          <span className="badge border-slate-700 text-slate-300">{item.severity}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-400">{item.message}</p>
                      </div>
                    ))}
                    {!notifications.length ? (
                      <div className="p-6 text-sm text-slate-500">No notifications to show.</div>
                    ) : null}
                  </div>
                </section>
              </div>

              <section className="space-y-4">
                <h2 className="section-title">Plans</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {plans.slice(0, 3).map((plan) => (
                    <article key={plan.id} className="card-sm p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-base font-semibold">{plan.name}</h3>
                        <span className="badge border-brand-500/30 text-brand-200">{plan.tier}</span>
                      </div>
                      <p className="mt-3 text-2xl font-bold">{formatCurrency(plan.price_monthly)}</p>
                      <p className="mt-1 text-sm text-slate-500">per month</p>
                    </article>
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="stat-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <Icon className="h-4 w-4 text-brand-300" />
      </div>
      <p className="text-2xl font-bold text-slate-50">{value}</p>
      <p className="text-sm text-slate-500">{detail}</p>
    </article>
  );
}
