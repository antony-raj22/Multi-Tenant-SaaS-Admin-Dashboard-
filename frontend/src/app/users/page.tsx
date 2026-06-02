"use client";

import Link from "next/link";
import { RefreshCcw, ShieldCheck, UserCheck, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { User } from "@/types";

export default function UsersPage() {
  const { isAuthenticated } = useAuthStore();
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await usersApi.list();
      return (response.data.results ?? response.data) as User[];
    },
    enabled: isAuthenticated,
  });

  const users = usersQuery.data ?? [];
  const activeUsers = users.filter((user) => user.status === "active").length;

  return (
    <main className="min-h-screen bg-slate-950 grid-bg">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Header />
        {!isAuthenticated ? (
          <AuthNotice />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Metric label="Total users" value={users.length.toString()} />
              <Metric label="Active users" value={activeUsers.toString()} />
              <Metric label="Tenant admins" value={users.filter((user) => user.role === "tenant_admin").length.toString()} />
            </div>

            <section className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 p-5">
                <h2 className="section-title">User Directory</h2>
                <button className="btn-secondary" onClick={() => usersQuery.refetch()}>
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3">User</th>
                      <th className="px-5 py-3">Tenant</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {users.map((user) => (
                      <tr key={user.id} className="table-row-hover">
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-100">{user.full_name || user.email}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-300">{user.tenant_name ?? "-"}</td>
                        <td className="px-5 py-4 text-slate-300">{user.role.replaceAll("_", " ")}</td>
                        <td className="px-5 py-4">
                          <span className={`badge ${user.status === "active" ? "border-emerald-500/30 text-emerald-300" : "border-amber-500/30 text-amber-300"}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-400">{new Date(user.date_joined).toLocaleDateString()}</td>
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

function Header() {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link href="/" className="text-sm font-medium text-brand-300">NexaAdmin</Link>
        <h1 className="page-title mt-1">Users</h1>
        <p className="mt-2 text-sm text-slate-400">User access, roles, status, and tenant assignments.</p>
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
        <UserCheck className="h-4 w-4 text-brand-300" />
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
