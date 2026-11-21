import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid or expired
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const projectsApi = {
  list: () => api.get('/projects'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (projectId, data) => api.post(`/projects/${projectId}/members`, data),
  removeMember: (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`),
};

export const ticketsApi = {
  list: (params) => api.get('/tickets', { params }),
  get: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post('/tickets', data),
  update: (id, data) => api.put(`/tickets/${id}`, data),
  updateStatus: (id, status, order_index) =>
    api.patch(`/tickets/${id}/status`, { status, order_index }),
  delete: (id) => api.delete(`/tickets/${id}`),
};

export const commentsApi = {
  list: (ticketId) => api.get(`/comments/ticket/${ticketId}`),
  create: (ticketId, data) => api.post(`/comments/ticket/${ticketId}`, data),
  delete: (commentId) => api.delete(`/comments/${commentId}`),
};

export const attachmentsApi = {
  upload: (ticketId, formData) =>
    api.post(`/attachments/ticket/${ticketId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (attachmentId) => api.delete(`/attachments/${attachmentId}`),
};

export const usersApi = {
  list: () => api.get('/users'),
  updateRole: (userId, role) => api.put(`/users/${userId}/role`, { role }),
};

export const bugmardiniApi = {
  analyze: (data) => api.post('/bugmardini/analyze', data),
  chat: (data) => api.post('/bugmardini/chat', data),
};

export default api;

