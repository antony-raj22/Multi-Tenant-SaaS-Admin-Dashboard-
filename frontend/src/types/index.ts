// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  initials: string;
  role: UserRole;
  status: UserStatus;
  tenant: string | null;
  tenant_name?: string;
  avatar?: string;
  two_factor_enabled: boolean;
  date_joined: string;
}

// ─── Users ───────────────────────────────────────────────────────────────────
export type UserRole = "super_admin" | "tenant_admin" | "member" | "billing" | "read_only";
export type UserStatus = "active" | "inactive" | "suspended" | "pending";

export interface User extends AuthUser {
  phone: string;
  timezone: string;
  last_login_ip?: string;
  updated_at: string;
}

// ─── Tenants ─────────────────────────────────────────────────────────────────
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logo?: string;
  is_active: boolean;
  user_count: number;
  created_at: string;
  updated_at: string;
}

// ─── Plans ───────────────────────────────────────────────────────────────────
export type PlanTier = "starter" | "pro" | "enterprise";
export type BillingInterval = "monthly" | "annual";

export interface PlanFeature {
  name: string;
  included: boolean;
}

export interface Plan {
  id: string;
  name: string;
  tier: PlanTier;
  description: string;
  price_monthly: number;
  price_annual: number;
  max_seats: number | null;
  max_storage_gb: number | null;
  features: PlanFeature[];
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  active_subscriptions: number;
  created_at: string;
  updated_at: string;
}

// ─── Subscriptions ───────────────────────────────────────────────────────────
export type SubscriptionStatus = "active" | "trial" | "past_due" | "cancelled" | "expired" | "paused";

export interface Subscription {
  id: string;
  tenant: string;
  tenant_name: string;
  plan: string;
  plan_name: string;
  plan_tier: PlanTier;
  status: SubscriptionStatus;
  billing_interval: BillingInterval;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  cancelled_at: string | null;
  seats_used: number;
  seats_limit: number | null;
  mrr: number;
  created_at: string;
  updated_at: string;
}

// ─── Payments ────────────────────────────────────────────────────────────────
export type PaymentStatus = "paid" | "pending" | "failed" | "refunded" | "partially_refunded";

export interface Payment {
  id: string;
  tenant: string;
  tenant_name: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string;
  description: string;
  failure_reason: string;
  refunded_amount: number;
  paid_at: string | null;
  created_at: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export interface DashboardSummary {
  total_tenants: number;
  active_users: number;
  total_users: number;
  mrr: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  revenue_mtd: number;
  churn_rate: number;
}

export interface RevenuePoint {
  month: string;
  revenue: number;
  count: number;
}

export interface GrowthPoint {
  month: string;
  count: number;
}

export interface UserGrowth {
  new_users: GrowthPoint[];
  churned: GrowthPoint[];
}

// ─── Notifications ────────────────────────────────────────────────────────────
export type NotificationType = "payment_failed" | "trial_expiring" | "new_signup" | "seat_limit" | "milestone" | "system";
export type NotificationSeverity = "info" | "warning" | "error" | "success";

export interface Notification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  is_read: boolean;
  action_url: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ─── API Pagination ───────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
