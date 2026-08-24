/**
 * @file api.js
 * @description Universal API client communicating with Shopo Multi-Tenant Backend with Firebase Bearer token injection.
 */
import { auth } from '@/firebase.config';

const DEFAULT_PROD_API_URL = 'https://shopo-api.vidflix.live';

const getBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (envUrl) {
    return `${envUrl.replace(/\/+$/, '').replace(/\/api(\/v1)?\/?$/, '')}/api/v1`;
  }

  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return `${DEFAULT_PROD_API_URL}/api/v1`;
  }

  return 'http://localhost:8000/api/v1';
};

const BASE_URL = getBaseUrl();

/**
 * Clean URL search params helper avoiding 'undefined', 'null', or empty values
 */
const toQueryString = (params = {}) => {
  const clean = Object.entries(params).filter(
    ([_, v]) => v !== undefined && v !== null && v !== '' && v !== 'undefined' && v !== 'null' && v !== 'all'
  );
  if (clean.length === 0) return '';
  return new URLSearchParams(Object.fromEntries(clean)).toString();
};

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

  // Inject active shop ID header if stored in session
  if (typeof window !== 'undefined') {
    const activeShopId = localStorage.getItem('shopo_active_shop_id');
    if (activeShopId) {
      headers['x-shop-id'] = activeShopId;
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
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutError = new Error('Network request timed out. Please check your connection.');
      timeoutError.status = 408;
      throw timeoutError;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  // Authentication & Profile Sync
  auth: {
    getMe: () => request('/auth/me'),
    updateProfile: (data) =>
      request('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // Shops & Settings
  shops: {
    list: () => request('/shops'),
    create: (shopData) =>
      request('/shops', {
        method: 'POST',
        body: JSON.stringify(shopData),
      }),
    switch: (id) =>
      request(`/shops/${id}/switch`, {
        method: 'POST',
      }),
    getCurrent: () => request('/shops/current'),
    update: (updateData) =>
      request('/shops/current', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      }),
  },

  // Users, Roles & Connected Devices
  users: {
    list: () => request('/users'),
    create: (data) =>
      request('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    setOffline: (id) =>
      request(`/users/${id}/set-offline`, {
        method: 'POST',
      }),
    toggleSession: (id, action) =>
      request(`/users/${id}/toggle-session`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      }),
    checkVerification: (id) =>
      request(`/users/${id}/check-verification`, {
        method: 'POST',
      }),
    delete: (id) =>
      request(`/users/${id}`, {
        method: 'DELETE',
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
    payDue: (id, data) =>
      request(`/suppliers/${id}/pay-due`, {
        method: 'POST',
        body: JSON.stringify(data),
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

  // Membership & Reward Points
  membership: {
    getSettings: () => request('/membership/settings'),
    updateSettings: (data) =>
      request('/membership/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getMembers: (params = {}) => {
      const qs = toQueryString(params);
      return request(`/membership/members${qs ? `?${qs}` : ''}`);
    },
    listMembers: (params = {}) => {
      const qs = toQueryString(params);
      return request(`/membership/members${qs ? `?${qs}` : ''}`);
    },
    getStats: () =>
      request('/membership/members').then((res) => ({
        success: true,
        data: res?.stats || {},
      })),
    enrollMember: (data) =>
      request('/membership/members', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    adjustPoints: (id, data) =>
      request(`/membership/members/${id}/points`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    removeMembership: (id) =>
      request(`/membership/members/${id}`, {
        method: 'DELETE',
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
    return: (id, data) =>
      request(`/sales/${id}/return`, {
        method: 'POST',
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

  // Restaurant Management Module
  restaurant: {
    getDashboard: () => request('/restaurant/dashboard'),
    getAnalytics: () => request('/restaurant/analytics'),

    tables: {
      list: (params) => {
        const qs = params ? new URLSearchParams(params).toString() : '';
        return request(`/restaurant/tables${qs ? `?${qs}` : ''}`);
      },
      create: (data) =>
        request('/restaurant/tables', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id, data) =>
        request(`/restaurant/tables/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
      delete: (id) =>
        request(`/restaurant/tables/${id}`, {
          method: 'DELETE',
        }),
      occupy: (id, data) =>
        request(`/restaurant/tables/${id}/occupy`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      free: (id) =>
        request(`/restaurant/tables/${id}/free`, {
          method: 'POST',
        }),
      transfer: (data) =>
        request('/restaurant/tables/transfer', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
    },

    menu: {
      list: (params) => {
        const qs = params ? new URLSearchParams(params).toString() : '';
        return request(`/restaurant/menu${qs ? `?${qs}` : ''}`);
      },
      create: (data) =>
        request('/restaurant/menu', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id, data) =>
        request(`/restaurant/menu/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
      delete: (id) =>
        request(`/restaurant/menu/${id}`, {
          method: 'DELETE',
        }),
    },

    orders: {
      list: (params) => {
        const qs = params ? new URLSearchParams(params).toString() : '';
        return request(`/restaurant/orders${qs ? `?${qs}` : ''}`);
      },
      getById: (id) => request(`/restaurant/orders/${id}`),
      create: (data) =>
        request('/restaurant/orders', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      appendItems: (id, data) =>
        request(`/restaurant/orders/${id}/append`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      complete: (id, data) =>
        request(`/restaurant/orders/${id}/complete`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),
    },

    kds: {
      getTickets: (station) => {
        const qs = station ? `?station=${station}` : '';
        return request(`/restaurant/kds${qs}`);
      },
      updateItemStatus: (data) =>
        request('/restaurant/kds/item-status', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
    },

    rawMaterials: {
      list: (params) => {
        const qs = params ? new URLSearchParams(params).toString() : '';
        return request(`/restaurant/raw-materials${qs ? `?${qs}` : ''}`);
      },
      create: (data) =>
        request('/restaurant/raw-materials', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id, data) =>
        request(`/restaurant/raw-materials/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
      restock: (id, data) =>
        request(`/restaurant/raw-materials/${id}/restock`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      delete: (id) =>
        request(`/restaurant/raw-materials/${id}`, {
          method: 'DELETE',
        }),
    },

    reservations: {
      list: (params) => {
        const qs = params ? new URLSearchParams(params).toString() : '';
        return request(`/restaurant/reservations${qs ? `?${qs}` : ''}`);
      },
      create: (data) =>
        request('/restaurant/reservations', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id, data) =>
        request(`/restaurant/reservations/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
      delete: (id) =>
        request(`/restaurant/reservations/${id}`, {
          method: 'DELETE',
        }),
    },
  },
};

export const apiClient = api;
export default api;
