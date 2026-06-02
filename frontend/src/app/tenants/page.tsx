"use client";

import Link from "next/link";
import { Building2, CheckCircle2, CircleOff, RefreshCcw, ShieldCheck, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Tenant } from "@/types";

export default function TenantsPage() {
  const { isAuthenticated } = useAuthStore();
  const tenantsQuery = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const response = await usersApi.tenants.list();
      return (response.data.results ?? response.data) as Tenant[];
    },
    enabled: isAuthenticated,
  });

  const tenants = tenantsQuery.data ?? [];
  const activeCount = tenants.filter((tenant) => tenant.is_active).length;

  return (
    <main className="min-h-screen bg-slate-950 grid-bg">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Header title="Tenants" subtitle="Tenant accounts, domains, and activation status." />

        {!isAuthenticated ? (
          <AuthNotice />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Metric icon={Building2} label="Total tenants" value={tenants.length.toString()} />
              <Metric icon={CheckCircle2} label="Active" value={activeCount.toString()} />
              <Metric icon={CircleOff} label="Inactive" value={(tenants.length - activeCount).toString()} />
            </div>

            <section className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 p-5">
                <h2 className="section-title">Tenant Directory</h2>
                <button className="btn-secondary" onClick={() => tenantsQuery.refetch()}>
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Tenant</th>
                      <th className="px-5 py-3">Domain</th>
                      <th className="px-5 py-3">Users</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {tenants.map((tenant) => (
                      <tr key={tenant.id} className="table-row-hover">
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-100">{tenant.name}</p>
                          <p className="text-xs text-slate-500">{tenant.slug}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-300">{tenant.domain || "-"}</td>
                        <td className="px-5 py-4 text-slate-300">{tenant.user_count}</td>
                        <td className="px-5 py-4">
                          <span className={`badge ${tenant.is_active ? "border-emerald-500/30 text-emerald-300" : "border-red-500/30 text-red-300"}`}>
                            {tenant.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-400">{new Date(tenant.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
      <Link href="/" className="btn-secondary">Overview</Link>
    </header>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
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
      <p className="mt-2 text-sm text-slate-400">Go to the dashboard and load the demo account first.</p>
      <Link href="/" className="btn-primary mt-5">Go to Dashboard</Link>
    </section>
  );
}
