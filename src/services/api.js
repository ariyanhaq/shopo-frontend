/**
 * @file api.js
 * @description Universal API client communicating with Shopo Multi-Tenant Backend with Firebase Bearer token injection.
 */
import { auth } from '@/firebase.config';

let rawApiUrl = (import.meta?.env?.VITE_API_URL || '').replace(/\/+$/, '').replace(/\/api(\/v1)?\/?$/, '');

// Prevent Mixed Content: If the application is running over HTTPS, never make direct insecure HTTP calls.
// Instead, use relative '/api/v1' which is securely proxied via Netlify / reverse proxy.
if (typeof window !== 'undefined' && window.location.protocol === 'https:' && rawApiUrl.startsWith('http://')) {
  rawApiUrl = '';
}

const BASE_URL = rawApiUrl ? `${rawApiUrl}/api/v1` : '/api/v1';

/**
 * Universal request wrapper attaching Firebase ID Token with safety timeout
 */
async function request(endpoint, options = {}) {
  const { timeout = 8000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const headers = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers || {}),
  };

  // Inject Firebase ID Token if user is logged in
  if (auth && auth.currentUser) {
    try {
      const idToken = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${idToken}`;
    } catch (err) {
      console.warn('Could not retrieve Firebase ID token:', err);
    }
  }

  const url = `${BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error(`Request timed out after ${timeout / 1000}s: ${endpoint}`);
      timeoutErr.code = 'TIMEOUT';
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  // Auth & Profile
  auth: {
    getMe: () => request('/auth/me'),
  },

  // Shops & Settings
  shops: {
    create: (shopData) =>
      request('/shops', {
        method: 'POST',
        body: JSON.stringify(shopData),
      }),
    getCurrent: () => request('/shops/current'),
    update: (updateData) =>
      request('/shops/current', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      }),
  },

  // Categories
  categories: {
    list: () => request('/categories'),
    create: (data) =>
      request('/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/categories/${id}`, {
        method: 'DELETE',
      }),
  },

  // Brands
  brands: {
    list: () => request('/brands'),
    create: (data) =>
      request('/brands', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/brands/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/brands/${id}`, {
        method: 'DELETE',
      }),
  },

  // Products & Inventory Catalog
  products: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/products${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/products/${id}`),
    create: (data) =>
      request('/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/products/${id}`, {
        method: 'DELETE',
      }),
  },

  // Suppliers
  suppliers: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/suppliers${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/suppliers/${id}`),
    getPurchases: (id) => request(`/suppliers/${id}/purchases`),
    create: (data) =>
      request('/suppliers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/suppliers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/suppliers/${id}`, {
        method: 'DELETE',
      }),
  },

  // Purchases & Stock In
  purchases: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/purchases${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/purchases/${id}`),
    getStats: () => request('/purchases/stats'),
    create: (data) =>
      request('/purchases', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/purchases/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/purchases/${id}`, {
        method: 'DELETE',
      }),
  },

  // Customers
  customers: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/customers${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/customers/${id}`),
    getHistory: (id) => request(`/customers/${id}/history`),
    create: (data) =>
      request('/customers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/customers/${id}`, {
        method: 'DELETE',
      }),
    collectDue: (id, data) =>
      request(`/customers/${id}/collect-due`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Sales & POS Checkout
  sales: {
    create: (data) =>
      request('/sales', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/sales${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/sales/${id}`),
    collectDue: (id, data) =>
      request(`/sales/${id}/collect-due`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/sales/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/sales/${id}`, {
        method: 'DELETE',
      }),
  },

  // Inventory Ledger & Adjustments
  inventory: {
    getTransactions: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/inventory/transactions${qs ? `?${qs}` : ''}`);
    },
    adjust: (data) =>
      request('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Operating Expenses
  expenses: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/expenses${qs ? `?${qs}` : ''}`);
    },
    create: (data) =>
      request('/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/expenses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/expenses/${id}`, {
        method: 'DELETE',
      }),
  },

  // Analytics & Reports
  analytics: {
    getDashboard: () => request('/analytics/dashboard'),
    getProfitLoss: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/analytics/profit-loss${qs ? `?${qs}` : ''}`);
    },
    getSalesReport: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/analytics/sales-report${qs ? `?${qs}` : ''}`);
    },
  },

  // Employees & Staff Payroll
  employees: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/employees${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/employees/${id}`),
    create: (data) =>
      request('/employees', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/employees/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/employees/${id}`, {
        method: 'DELETE',
      }),
    getSalaries: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/employees/salary/payments${qs ? `?${qs}` : ''}`);
    },
    recordSalary: (data) =>
      request('/employees/salary/payments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Gym Management Module
  gym: {
    getDashboard: () => request('/gym/dashboard'),
    members: {
      list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/gym/members${qs ? `?${qs}` : ''}`);
      },
      getById: (id) => request(`/gym/members/${id}`),
      create: (data) =>
        request('/gym/members', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id, data) =>
        request(`/gym/members/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
      delete: (id) =>
        request(`/gym/members/${id}`, {
          method: 'DELETE',
        }),
    },
    attendance: {
      list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/gym/attendance${qs ? `?${qs}` : ''}`);
      },
      checkIn: (data) =>
        request('/gym/attendance/checkin', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      checkOut: (id) =>
        request(`/gym/attendance/${id}/checkout`, {
          method: 'PATCH',
        }),
    },
    payments: {
      list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/gym/payments${qs ? `?${qs}` : ''}`);
      },
      create: (data) =>
        request('/gym/payments', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
    },
    packages: {
      list: () => request('/gym/packages'),
      create: (data) =>
        request('/gym/packages', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id, data) =>
        request(`/gym/packages/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
      delete: (id) =>
        request(`/gym/packages/${id}`, {
          method: 'DELETE',
        }),
    },
    trainers: {
      list: () => request('/gym/trainers'),
      create: (data) =>
        request('/gym/trainers', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id, data) =>
        request(`/gym/trainers/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
      delete: (id) =>
        request(`/gym/trainers/${id}`, {
          method: 'DELETE',
        }),
    },
    equipment: {
      list: () => request('/gym/equipment'),
      create: (data) =>
        request('/gym/equipment', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
    },
    classes: {
      list: () => request('/gym/classes'),
      create: (data) =>
        request('/gym/classes', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
    },
    workouts: {
      list: () => request('/gym/workouts'),
      create: (data) =>
        request('/gym/workouts', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
    },
  },
};

export const apiClient = api;
export default api;
