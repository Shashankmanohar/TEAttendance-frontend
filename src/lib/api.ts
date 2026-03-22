import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/').replace(/\/?$/, '/'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const staffApi = {
  clockIn: () => api.post('/staff/clock-in'),
  clockOut: () => api.post('/staff/clock-out'),
  getTodayStatus: () => api.get('/staff/status/today'),
  getAttendance: (month?: number, year?: number) => 
    api.get('/staff/attendance', { params: { month, year } }),
  getAllStaff: (month?: string) => api.get(month ? `/staff/all?month=${month}` : '/staff/all'),
  getStaffAttendance: (staffId: string, month?: number, year?: number) => 
    api.get(`/staff/attendance/${staffId}`, { params: { month, year } }),
  updateStaff: (id: string, data: any) => api.put(`/staff/${id}`, data),
  deleteStaff: (id: string) => api.delete(`/staff/${id}`),
};

export default api;
