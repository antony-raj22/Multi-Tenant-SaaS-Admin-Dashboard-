"use client";

import Link from "next/link";
import { Save, Settings, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { settingsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

type SystemSettings = {
  app_name: string;
  support_email: string;
  billing_currency: string;
  maintenance_mode: boolean;
};

export default function SettingsPage() {
  const { isAuthenticated } = useAuthStore();
  const query = useQuery({
    queryKey: ["settings-page"],
    queryFn: async () => (await settingsApi.get()).data as SystemSettings,
    enabled: isAuthenticated,
  });
  const settings = query.data;

  return (
    <main className="min-h-screen bg-slate-950 grid-bg">
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Header />
        {!isAuthenticated ? <AuthNotice /> : (
          <section className="card p-6">
            <div className="grid gap-5">
              <Field label="Application Name" value={settings?.app_name ?? ""} />
              <Field label="Support Email" value={settings?.support_email ?? ""} />
              <Field label="Billing Currency" value={settings?.billing_currency ?? ""} />
              <label className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-4">
                <span>
                  <span className="block text-sm font-medium text-slate-200">Maintenance Mode</span>
                  <span className="text-sm text-slate-500">Temporarily restrict tenant access.</span>
                </span>
                <input type="checkbox" checked={Boolean(settings?.maintenance_mode)} readOnly className="h-5 w-5" />
              </label>
              <button className="btn-primary w-fit" onClick={() => settingsApi.update(settings ?? {})}>
                <Save className="h-4 w-4" />
                Save Settings
              </button>
            </div>
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
        <h1 className="page-title mt-1">System Settings</h1>
        <p className="mt-2 text-sm text-slate-400">Global app, billing, support, and maintenance controls.</p>
      </div>
      <Settings className="h-5 w-5 text-brand-300" />
    </header>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label>
      <span className="label">{label}</span>
      <input className="input" value={value} readOnly />
    </label>
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
