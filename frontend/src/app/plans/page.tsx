"use client";

import Link from "next/link";
import { CheckCircle2, Layers3, RefreshCcw, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { plansApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Plan } from "@/types";

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export default function PlansPage() {
  const { isAuthenticated } = useAuthStore();
  const plansQuery = useQuery({
    queryKey: ["plans-page"],
    queryFn: async () => {
      const response = await plansApi.list();
      return (response.data.results ?? response.data) as Plan[];
    },
    enabled: isAuthenticated,
  });
  const plans = plansQuery.data ?? [];

  return (
    <main className="min-h-screen bg-slate-950 grid-bg">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Header title="Plans" subtitle="Pricing plans, feature bundles, seats, and storage limits." />
        {!isAuthenticated ? <AuthNotice /> : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Metric label="Plans" value={plans.length.toString()} />
              <Metric label="Featured" value={plans.filter((plan) => plan.is_featured).length.toString()} />
              <Metric label="Active" value={plans.filter((plan) => plan.is_active).length.toString()} />
            </div>
            <section className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <article key={plan.id} className="card-sm p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-display text-lg font-semibold">{plan.name}</h2>
                    <span className="badge border-brand-500/30 text-brand-200">{plan.tier}</span>
                  </div>
                  <p className="mt-3 text-3xl font-bold">{money(Number(plan.price_monthly))}</p>
                  <p className="text-sm text-slate-500">per month / {money(Number(plan.price_annual))} yearly</p>
                  <p className="mt-4 text-sm leading-6 text-slate-400">{plan.description}</p>
                  <div className="mt-4 space-y-2">
                    {plan.features.map((feature) => (
                      <div key={feature.name} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        {feature.name}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link href="/" className="text-sm font-medium text-brand-300">NexaAdmin</Link>
        <h1 className="page-title mt-1">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
      </div>
      <button className="btn-secondary" onClick={() => location.reload()}>
        <RefreshCcw className="h-4 w-4" />
        Refresh
      </button>
    </header>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="stat-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <Layers3 className="h-4 w-4 text-brand-300" />
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
      <p className="mt-2 text-sm text-slate-400">Go to the dashboard and load the demo account first.</p>
      <Link href="/" className="btn-primary mt-5">Go to Dashboard</Link>
    </section>
  );
}
