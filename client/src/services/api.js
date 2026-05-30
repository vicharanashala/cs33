import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(new Error('Session expired. Please login again.'));
    }
    const data = err.response?.data;
    if (data?.errors?.length) {
      return Promise.reject(new Error(data.errors.map(e => `${e.field}: ${e.message}`).join('; ')));
    }
    return Promise.reject(new Error(data?.message || data?.error || 'Something went wrong'));
  }
);

// ── Auth ──────────────────────────────────────────────
export const auth = {
  register:        (data) => api.post('/auth/register', data),
  login:           (data) => api.post('/auth/login', data),
  getMe:           ()     => api.get('/auth/me'),
  forgotPassword:  (data) => api.post('/auth/forgot-password', data),
  resetPassword:   (token, data) => api.put(`/auth/reset-password/${token}`, data),
};

// ── FAQs ──────────────────────────────────────────────
export const faqs = {
  getAll:        (params)    => api.get('/faqs', { params }),
  search:        (q)         => api.get('/faqs/search', { params: { q } }),
  getTrending:   (params)    => api.get('/faqs/trending', { params }),
  getMeta:       (id, params) => api.get(`/faqs/${id}/meta`, { params }),
  getOne:        (id, params) => api.get(`/faqs/${id}`, { params }),
  create:        (data)      => api.post('/faqs', data),
  update:        (id, data)  => api.put(`/faqs/${id}`, data),
  remove:        (id)        => api.delete(`/faqs/${id}`),
  vote:          (id, vote)  => api.put(`/faqs/${id}/vote`, { vote }),
  addAnswer:     (id, data)  => api.post(`/faqs/${id}/answers`, data),
  updateAnswer:  (id, aid, data) => api.put(`/faqs/${id}/answers/${aid}`, data),
  voteAnswer:    (id, aid, data) => api.put(`/faqs/${id}/answers/${aid}/vote`, data),
  deleteAnswer:  (id, aid)   => api.delete(`/faqs/${id}/answers/${aid}`),
  acceptAnswer:  (id, aid)   => api.put(`/faqs/${id}/answers/${aid}/accept`),
  addComment:    (id, data)  => api.post(`/faqs/${id}/comments`, data),
  deleteComment: (id, cid, data) => api.delete(`/faqs/${id}/comments/${cid}`, { data }),
  report:        (id, data)  => api.post(`/faqs/${id}/report`, data),
  togglePin:     (id)        => api.put(`/faqs/${id}/pin`),
  updateStatus:  (id, status, reason) => api.put(`/faqs/${id}/status`, { status, reason }),
};

// ── Users ─────────────────────────────────────────────
export const users = {
  getProfile:      (id)   => api.get(`/users/${id}`),
  updateProfile:   (id, data) => api.put(`/users/${id}/profile`, data),
  changePassword:  (id, data) => api.put(`/users/${id}/password`, data),
  follow:          (id)  => api.post(`/users/${id}/follow`),
  unfollow:        (id)  => api.delete(`/users/${id}/follow`),
  saveFAQ:         (faqId) => api.post(`/users/saved/${faqId}`),
  getSaved:        ()    => api.get('/users/saved'),
  getFeed:         ()    => api.get('/users/feed/activity'),
  getUserActivity: (id) => api.get(`/users/${id}/activity`),
  getUserAnswers:  (id) => api.get(`/users/${id}/answers`),
  getLeaderboard:  ()    => api.get('/users/leaderboard'),
};

// ── Admin reports ──────────────────────────────────────
export const getReports = (status) =>
  api.get('/reports', status ? { params: { status } } : {});

export const reviewReport = (id, decision, notes) =>
  api.put(`/reports/${id}`, { decision, notes });

// ── Upload ─────────────────────────────────────────────
export const upload = {
  image: (formData) => api.post('/upload/image', formData),
};

// ── Notifications ──────────────────────────────────────
export const notifications = {
  getAll:      ()     => api.get('/notifications'),
  markRead:    (id)   => api.patch(`/notifications/${id}/read`),
  markAllRead: ()     => api.patch('/notifications/read/all'),
  deleteOne:   (id)   => api.delete(`/notifications/${id}`),
};

// ── Admin ─────────────────────────────────────────────
export const admin = {
  getStats:    ()          => api.get('/admin/stats'),
  getUsers:    (params)    => api.get('/admin/users', { params }),
  updateRole:  (id, role)  => api.put(`/admin/users/${id}/role`, { role }),
  suspendUser: (id)        => api.put(`/admin/users/${id}/suspend`),
  deleteUser:  (id)        => api.delete(`/admin/users/${id}`),
};

// ── Stats ──────────────────────────────────────────────
export const stats = {
  get: () => api.get('/stats'),
};

export default api;