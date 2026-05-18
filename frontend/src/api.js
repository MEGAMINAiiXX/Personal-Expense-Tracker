const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}

// ─── Categories ──────────────────────────────────────────────────────────────
export const getCategories = () => request("/categories");
export const createCategory = (data) => request("/categories", { method: "POST", body: JSON.stringify(data) });
export const updateCategory = (id, data) => request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteCategory = (id) => request(`/categories/${id}`, { method: "DELETE" });

// ─── Transactions ─────────────────────────────────────────────────────────────
export const getTransactions = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "" && v !== null) q.append(k, v); });
  return request(`/transactions?${q}`);
};
export const createTransaction = (data) => request("/transactions", { method: "POST", body: JSON.stringify(data) });
export const updateTransaction = (id, data) => request(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteTransaction = (id) => request(`/transactions/${id}`, { method: "DELETE" });

// ─── Analytics ───────────────────────────────────────────────────────────────
export const getSummary = (year, month) => {
  const q = new URLSearchParams({ year });
  if (month) q.append("month", month);
  return request(`/analytics/summary?${q}`);
};
export const getByCategory = (year, month, type = "expense") => {
  const q = new URLSearchParams({ year, type });
  if (month) q.append("month", month);
  return request(`/analytics/by-category?${q}`);
};
export const getMonthly = (year) => request(`/analytics/monthly?year=${year}`);

// ─── Export ──────────────────────────────────────────────────────────────────
export const exportCSV = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) q.append(k, v); });
  window.open(`${BASE}/export/csv?${q}`, "_blank");
};
