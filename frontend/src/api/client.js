import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('cpe_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('cpe_token');
      sessionStorage.removeItem('cpe_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  getChallenge: (publicKey) => client.post('/auth/challenge', { publicKey }),
  login: (data) => client.post('/auth/login', data),
  getMe: () => client.get('/auth/me'),
  fundTestnet: () => client.post('/auth/fund-testnet'),
  getNotifications: (all = false) => client.get(`/auth/notifications?all=${all}`),
  markNotificationRead: (id) => client.post(`/auth/notifications/${id}/read`),
  markAllRead: () => client.post('/auth/notifications/read-all'),
};

// Contracts API
export const contractsApi = {
  create: (data) => client.post('/contracts', data),
  list: (params) => client.get('/contracts', { params }),
  get: (id) => client.get(`/contracts/${id}`),
  fund: (id, txHash) => client.post(`/contracts/${id}/fund`, { txHash }),
  getFundXdr: (id) => client.post(`/contracts/${id}/fund`),
  approve: (id) => client.post(`/contracts/${id}/approve`),
  cancel: (id) => client.post(`/contracts/${id}/cancel`),
  getStatus: (id) => client.get(`/contracts/${id}/status`),
  findPaths: (data) => client.post('/contracts/find-paths', data),
};

// Transactions API
export const transactionsApi = {
  list: (params) => client.get('/transactions', { params }),
  forContract: (contractId) => client.get(`/transactions/contract/${contractId}`),
};

export default client;
