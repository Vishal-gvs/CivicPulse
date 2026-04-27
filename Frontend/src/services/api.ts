import axios, { AxiosResponse } from 'axios';

// Check if we should use mock API
const USE_MOCK_API = false; // ✅ Switch to real backend

const API = axios.create({
  baseURL: "/api", // Relying on Vite proxy to route to http://localhost:5000/api
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

/** Normalize GET /api/issues axios response to an array of issues. */
export const parseIssuesFromResponse = (axiosResponse: any) => {
  const body = axiosResponse?.data;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data?.issues)) return body.data.issues;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.issues)) return body.issues;
  return [];
};

/** GET /api/users — body is { data: { users, pagination } }. */
export const parseUsersListResponse = (axiosResponse: any) => {
  const body = axiosResponse?.data;
  if (Array.isArray(body?.data?.users)) return body.data.users;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body)) return body;
  return [];
};



/** GET /api/users/pending-managers — body is { data: User[] }. */
export const parsePendingManagersResponse = (axiosResponse: any) => {
  const body = axiosResponse?.data;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body)) return body;
  return [];
};

/** GET /api/issues/resolve-requests/pending — body is { data: PendingRequest[] }. */
export const parsePendingResolveRequestsResponse = (axiosResponse: any) => {
  const body = axiosResponse?.data;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body)) return body;
  return [];
};

/** GET /api/analytics — body is { data: analyticsObject }. */
export const parseAnalyticsResponse = (axiosResponse: any) => {
  const body = axiosResponse?.data;
  if (body?.data != null && typeof body.data === 'object' && !Array.isArray(body.data)) {
    return body.data;
  }
  return {};
};


// Auth APIs - Using Real Backend
export const register = (userData: any) => API.post("/auth/register", userData);
export const login = (credentials: any) => API.post("/auth/login", credentials);

// Issue APIs - Using Real Backend
export const getIssues = (userId?: string, userRole?: string) => {
  if (userId && userRole) {
    return API.get("/issues", { params: { userId, userRole } });
  }
  return API.get("/issues");
};
export const createIssue = (issueData: any) => API.post("/issues", issueData);
export const updateIssue = (id: string, issueData: any) => API.put(`/issues/${id}`, issueData);
export const voteIssue = (id: string) => API.post(`/issues/${id}/vote`);

// Manager Resolve Request APIs
export const raiseResolveRequest = (issueId: string, note?: string) =>
  API.post(`/issues/${issueId}/resolve-request`, { note: note || '' });
export const approveResolveRequest = (issueId: string, reqId: string) =>
  API.put(`/issues/${issueId}/resolve-request/${reqId}/approve`);
export const rejectResolveRequest = (issueId: string, reqId: string) =>
  API.put(`/issues/${issueId}/resolve-request/${reqId}/reject`);
export const managerResolveIssue = (issueId: string) =>
  API.put(`/issues/${issueId}/manager-resolve`);
export const getPendingResolveRequests = () =>
  API.get('/issues/resolve-requests/pending');

// Feedback APIs - Using Real Backend
export const getFeedback = () => API.get("/feedback");
export const createFeedback = (feedbackData: any) => API.post("/feedback", feedbackData);
export const likeFeedback = (id: string) => API.put(`/feedback/${id}/like`);
export const dislikeFeedback = (id: string) => API.put(`/feedback/${id}/dislike`);
export const starFeedback = (id: string) => API.put(`/feedback/${id}/star`);

// User APIs - Using Real Backend
export const getUsers = () => API.get("/users");
export const getPendingManagers = () => API.get("/users/pending-managers");
export const approveManager = (id: string) => API.put(`/users/${id}/approve`);
export const rejectManager = (id: string) => API.put(`/users/${id}/reject`);

// Analytics APIs - Using Real Backend
export const getAnalytics = (userId?: string, userRole?: string) => {
  if (userId && userRole) {
    return API.get("/analytics", { params: { userId, userRole } });
  }
  return API.get("/analytics");
};

export default API;
