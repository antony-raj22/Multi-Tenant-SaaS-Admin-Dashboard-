import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// ── Request interceptor: attach access token ─────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: refresh on 401 ─────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      const refresh = Cookies.get("refresh_token");
      if (!refresh) {
        clearAuthCookies();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refresh });
        Cookies.set("access_token", data.access, { expires: 1 / 24, secure: true, sameSite: "strict" });
        processQueue(null, data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError);
        clearAuthCookies();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const clearAuthCookies = () => {
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
  Cookies.remove("user");
};

export default api;

// ─── Typed API helpers ────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  refresh: (refresh: string) =>
    api.post("/auth/refresh", { refresh }),
  me: () => api.get("/users/me"),
};

export const usersApi = {
  list: (params?: Record<string, string | number>) => api.get("/users", { params }),
  get: (id: string) => api.get(`/users/${id}/`),
  create: (data: unknown) => api.post("/users", data),
  update: (id: string, data: unknown) => api.patch(`/users/${id}/`, data),
  delete: (id: string) => api.delete(`/users/${id}/`),
  suspend: (id: string) => api.post(`/users/${id}/suspend/`),
  activate: (id: string) => api.post(`/users/${id}/activate/`),
  stats: () => api.get("/users/stats"),
  tenants: {
    list: (params?: Record<string, string | number>) => api.get("/users/tenants", { params }),
    get: (id: string) => api.get(`/users/tenants/${id}`),
    create: (data: unknown) => api.post("/users/tenants", data),
    update: (id: string, data: unknown) => api.patch(`/users/tenants/${id}`, data),
    suspend: (id: string) => api.post(`/users/tenants/${id}/suspend`),
    activate: (id: string) => api.post(`/users/tenants/${id}/activate`),
  },
};

export const plansApi = {
  list: () => api.get("/plans"),
  get: (id: string) => api.get(`/plans/${id}`),
  create: (data: unknown) => api.post("/plans", data),
  update: (id: string, data: unknown) => api.patch(`/plans/${id}`, data),
  delete: (id: string) => api.delete(`/plans/${id}`),
};

export const subscriptionsApi = {
  list: (params?: Record<string, string | number>) => api.get("/subscriptions", { params }),
  get: (id: string) => api.get(`/subscriptions/${id}`),
  cancel: (id: string) => api.post(`/subscriptions/${id}/cancel`),
  reactivate: (id: string) => api.post(`/subscriptions/${id}/reactivate`),
  summary: () => api.get("/subscriptions/summary"),
};

export const paymentsApi = {
  list: (params?: Record<string, string | number>) => api.get("/payments", { params }),
  get: (id: string) => api.get(`/payments/${id}`),
  refund: (id: string, amount?: number) => api.post(`/payments/${id}/refund`, { amount }),
  summary: () => api.get("/payments/summary"),
};

export const analyticsApi = {
  summary: () => api.get("/analytics/summary"),
  revenue: (months?: number) => api.get("/analytics/revenue", { params: { months } }),
  userGrowth: (months?: number) => api.get("/analytics/user-growth", { params: { months } }),
  planDistribution: () => api.get("/analytics/plan-distribution"),
};

export const notificationsApi = {
  list: (params?: Record<string, string>) => api.get("/notifications", { params }),
  markRead: (id: string) => api.post(`/notifications/${id}/mark_read`),
  markAllRead: () => api.post("/notifications/mark_all_read"),
};

export const settingsApi = {
  get: () => api.get("/settings"),
  update: (data: Record<string, unknown>) => api.patch("/settings", data),
};
