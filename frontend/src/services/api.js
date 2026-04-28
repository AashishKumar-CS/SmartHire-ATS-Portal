import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8080/api' });

// Attach JWT automatically
API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const loginCandidate = (data) => API.post('/auth/candidate/login', data);
export const loginAdmin     = (data) => API.post('/auth/admin/login', data);
export const validateToken  = ()     => API.get('/auth/validate');

// ── Candidate ─────────────────────────────────────────────────────────────────
export const sendOtp            = (mobile) => API.post('/candidate/send-otp', { mobile });
export const verifyOtp          = (mobile, otp) => API.post('/candidate/verify-otp', { mobile, otp });
export const registerCandidate  = (data) => API.post('/candidate/register', data);
export const getProfile         = (id)   => API.get(`/candidate/profile/${id}`);
export const updateProfile      = (id, data) => API.put(`/candidate/profile/${id}`, data);
export const uploadResume       = (id, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return API.post(`/candidate/upload-resume/${id}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const uploadProfileImage = (id, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return API.post(`/candidate/upload-profile-image/${id}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// ── Jobs ──────────────────────────────────────────────────────────────────────
export const getOpenJobs        = () => API.get('/jobs/internal');
export const getAllJobs         = () => API.get('/jobs/internal/all');
export const getJobById         = (id) => API.get(`/jobs/internal/${id}`);
export const getExternalJobs    = () => API.get('/jobs/external');
export const createJob          = (data) => API.post('/jobs/admin/create', data);
export const updateJob          = (id, data) => API.put(`/jobs/admin/update/${id}`, data);
export const closeJob           = (id) => API.put(`/jobs/admin/close/${id}`);

// ── Applications ──────────────────────────────────────────────────────────────
export const applyToJob           = (data) => API.post('/jobs/apply', data);
export const getCandidateApplications = (id) => API.get(`/jobs/applications/candidate/${id}`);
export const getJobApplications   = (id) => API.get(`/jobs/applications/job/${id}`);
export const getAllApplications   = () => API.get('/jobs/applications/all');
export const updateAppStatus      = (appId, status, feedback) =>
  API.put(`/jobs/applications/${appId}/status`, { status, feedback });

// ── Admin ─────────────────────────────────────────────────────────────────────
export const getAllCandidates   = () => API.get('/admin/candidates');
export const getCandidateById  = (id) => API.get(`/admin/candidates/${id}`);
export const getDashboardStats = () => API.get('/admin/dashboard/stats');
export const selectCandidate   = (appId, feedback) => API.put(`/admin/applications/${appId}/select`, { feedback });
export const rejectCandidate   = (appId, feedback) => API.put(`/admin/applications/${appId}/reject`, { feedback });
export const getRankedCandidates = (jobId) => API.get(`/jobs/admin/ranking/${jobId}`);

export default API;

// ── Admin: External Jobs Management ──────────────────────────────────────────
export const createExternalJob      = (data) => API.post('/external-jobs/admin/create', data);
export const getAllExternalJobsAdmin = ()     => API.get('/external-jobs/admin/all');
export const updateExternalJob      = (id, data) => API.put(`/external-jobs/admin/update/${id}`, data);
export const closeExternalJob       = (id)   => API.put(`/external-jobs/admin/close/${id}`);
export const reopenExternalJob      = (id)   => API.put(`/external-jobs/admin/reopen/${id}`);
export const deleteExternalJob      = (id)   => API.delete(`/external-jobs/admin/delete/${id}`);

// ── Candidate: Open External Jobs only ───────────────────────────────────────
export const getOpenExternalJobs = () => API.get('/external-jobs/open');
