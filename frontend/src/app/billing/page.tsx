"use client";

import Link from "next/link";
import { CreditCard, DollarSign, RefreshCcw, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { paymentsApi, subscriptionsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Payment, Subscription } from "@/types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export default function BillingPage() {
  const { isAuthenticated } = useAuthStore();
  const paymentsQuery = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const response = await paymentsApi.list();
      return (response.data.results ?? response.data) as Payment[];
    },
    enabled: isAuthenticated,
  });
  const subscriptionsQuery = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const response = await subscriptionsApi.list();
      return (response.data.results ?? response.data) as Subscription[];
    },
    enabled: isAuthenticated,
  });

  const payments = paymentsQuery.data ?? [];
  const subscriptions = subscriptionsQuery.data ?? [];
  const collected = payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <main className="min-h-screen bg-slate-950 grid-bg">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Header />
        {!isAuthenticated ? (
          <AuthNotice />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Metric label="Collected" value={formatCurrency(collected)} />
              <Metric label="Payments" value={payments.length.toString()} />
              <Metric label="Subscriptions" value={subscriptions.length.toString()} />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <section className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 p-5">
                  <h2 className="section-title">Payments</h2>
                  <button className="btn-secondary" onClick={() => paymentsQuery.refetch()}>
                    <RefreshCcw className="h-4 w-4" />
                    Refresh
                  </button>
                </div>
                <div className="divide-y divide-slate-800">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between gap-4 p-5">
                      <div>
                        <p className="font-medium text-slate-100">{payment.invoice_number}</p>
                        <p className="text-sm text-slate-500">{payment.tenant_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-100">{formatCurrency(Number(payment.amount))}</p>
                        <span className={`badge mt-1 ${payment.status === "paid" ? "border-emerald-500/30 text-emerald-300" : "border-amber-500/30 text-amber-300"}`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 p-5">
                  <h2 className="section-title">Subscriptions</h2>
                  <button className="btn-secondary" onClick={() => subscriptionsQuery.refetch()}>
                    <RefreshCcw className="h-4 w-4" />
                    Refresh
                  </button>
                </div>
                <div className="divide-y divide-slate-800">
                  {subscriptions.map((subscription) => (
                    <div key={subscription.id} className="flex items-center justify-between gap-4 p-5">
                      <div>
                        <p className="font-medium text-slate-100">{subscription.tenant_name}</p>
                        <p className="text-sm text-slate-500">{subscription.plan_name} / {subscription.billing_interval}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-100">{formatCurrency(Number(subscription.mrr))} MRR</p>
                        <span className="badge mt-1 border-brand-500/30 text-brand-200">{subscription.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
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
        <h1 className="page-title mt-1">Billing</h1>
        <p className="mt-2 text-sm text-slate-400">Payments, subscriptions, MRR, and account billing state.</p>
      </div>
      <Link href="/" className="btn-secondary">Overview</Link>
    </header>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="stat-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <DollarSign className="h-4 w-4 text-brand-300" />
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
