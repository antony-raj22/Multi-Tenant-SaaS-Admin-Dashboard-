"use client";

import Link from "next/link";
import { Activity, RefreshCcw, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { subscriptionsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Subscription } from "@/types";

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export default function SubscriptionsPage() {
  const { isAuthenticated } = useAuthStore();
  const query = useQuery({
    queryKey: ["subscriptions-page"],
    queryFn: async () => {
      const response = await subscriptionsApi.list();
      return (response.data.results ?? response.data) as Subscription[];
    },
    enabled: isAuthenticated,
  });
  const subscriptions = query.data ?? [];

  return (
    <main className="min-h-screen bg-slate-950 grid-bg">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Header onRefresh={() => query.refetch()} />
        {!isAuthenticated ? <AuthNotice /> : (
          <section className="card overflow-hidden">
            <div className="border-b border-slate-800 p-5">
              <h2 className="section-title">Subscription Accounts</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Tenant</th>
                    <th className="px-5 py-3">Plan</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Seats</th>
                    <th className="px-5 py-3">MRR</th>
                    <th className="px-5 py-3">Period End</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {subscriptions.map((subscription) => (
                    <tr key={subscription.id} className="table-row-hover">
                      <td className="px-5 py-4 font-medium text-slate-100">{subscription.tenant_name}</td>
                      <td className="px-5 py-4 text-slate-300">{subscription.plan_name}</td>
                      <td className="px-5 py-4"><span className="badge border-brand-500/30 text-brand-200">{subscription.status}</span></td>
                      <td className="px-5 py-4 text-slate-300">{subscription.seats_used} / {subscription.seats_limit ?? "Unlimited"}</td>
                      <td className="px-5 py-4 text-slate-300">{money(Number(subscription.mrr))}</td>
                      <td className="px-5 py-4 text-slate-400">{subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Header({ onRefresh }: { onRefresh: () => void }) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link href="/" className="text-sm font-medium text-brand-300">NexaAdmin</Link>
        <h1 className="page-title mt-1">Subscriptions</h1>
        <p className="mt-2 text-sm text-slate-400">Account plans, status, billing interval, seats, and MRR.</p>
      </div>
      <button className="btn-secondary" onClick={onRefresh}>
        <RefreshCcw className="h-4 w-4" />
        Refresh
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
