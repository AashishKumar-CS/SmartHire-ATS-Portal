import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import {
  getDashboardStats, getAllCandidates, getAllJobs, getAllApplications,
  createJob, updateJob, closeJob, updateAppStatus, getJobApplications
} from '../services/api';
import AdminExternalJobs from './AdminExternalJobs';

const NAV = [
  { id: 'dashboard',    icon: '📊', label: 'Dashboard' },
  { id: 'jobs',         icon: '💼', label: 'Job Postings' },
  { id: 'external',     icon: '🌐', label: 'External Jobs' },
  { id: 'candidates',   icon: '👥', label: 'Candidates' },
  { id: 'applications', icon: '📋', label: 'Applications' },
  { id: 'ranking',      icon: '🏆', label: 'AI Ranking' },
];

function StatusBadge({ status }) {
  const map = { Applied: 'badge-blue', 'In Progress': 'badge-orange', Selected: 'badge-green', Rejected: 'badge-red', Open: 'badge-green', Closed: 'badge-red' };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

const JOB_INIT = { title: '', description: '', requiredSkills: '', experience: '', salary: '', status: 'Open' };

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [jobForm, setJobForm] = useState(JOB_INIT);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [jobRanking, setJobRanking] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [actionModal, setActionModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c, j, a] = await Promise.all([getDashboardStats(), getAllCandidates(), getAllJobs(), getAllApplications()]);
      setStats(s.data.data || {});
      setCandidates(c.data.data || []);
      setJobs(j.data.data || []);
      setApplications(a.data.data || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreateJob = async () => {
    if (!jobForm.title || !jobForm.requiredSkills) { toast.error('Title and Required Skills are required'); return; }
    setLoading(true);
    try {
      const payload = { ...jobForm, createdBy: user?.adminId || 1 };
      const { data } = editingJob ? await updateJob(editingJob, jobForm) : await createJob(payload);
      if (data.success) {
        toast.success(editingJob ? 'Job updated!' : 'Job created!');
        setJobForm(JOB_INIT); setShowJobForm(false); setEditingJob(null);
        load();
      }
    } catch { toast.error('Failed to save job'); }
    finally { setLoading(false); }
  };

  const handleCloseJob = async (jobId) => {
    try {
      await closeJob(jobId);
      toast.success('Job closed'); load();
    } catch { toast.error('Failed to close job'); }
  };

  const handleAction = async () => {
    if (!actionModal) return;
    setLoading(true);
    try {
      const { data } = await updateAppStatus(actionModal.appId, actionModal.action, feedback);
      if (data.success) { toast.success(`Candidate ${actionModal.action}!`); setActionModal(null); setFeedback(''); load(); }
    } catch { toast.error('Action failed'); }
    finally { setLoading(false); }
  };

  const loadRanking = async (jobId) => {
    setSelectedJobId(jobId);
    try {
      const { data } = await getJobApplications(jobId);
      setJobRanking(data.data || []);
    } catch { toast.error('Failed to load ranking'); }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <span className="navbar-brand">⚡ SmartHire <span style={{ fontSize: '13px', color: 'var(--text3)', fontFamily: 'var(--font-body)', fontWeight: '400' }}>Admin</span></span>
        <div className="navbar-nav">
          <span style={{ fontSize: '13px', color: 'var(--text2)' }}>🛡️ {user?.fullName}</span>
          <button className="btn btn-secondary btn-sm" onClick={() => { logout(); navigate('/'); }}>Logout</button>
        </div>
      </nav>

      <div className="dash-layout">
        <aside className="sidebar">
          {NAV.map(n => (
            <button key={n.id} className={`sidebar-item ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
              <span className="sidebar-icon">{n.icon}</span> {n.label}
            </button>
          ))}
          <div className="divider" style={{ margin: '8px 16px' }} />
          <button className="sidebar-item" style={{ color: 'var(--red)' }} onClick={() => { logout(); navigate('/'); }}>
            <span className="sidebar-icon">🚪</span> Logout
          </button>
        </aside>

        <main className="dash-content">

          {/* ── Dashboard ── */}
          {page === 'dashboard' && (
            <div>
              <h2 className="section-title">Admin <span>Dashboard</span></h2>
              <div className="grid-4" style={{ marginBottom: '32px' }}>
                {[['👥', stats.totalCandidates || 0, 'Total Candidates', 'blue'],
                  ['💼', stats.totalJobs || 0, 'Total Jobs', 'green'],
                  ['🟢', stats.openJobs || 0, 'Open Positions', 'orange'],
                  ['📋', stats.totalApplications || 0, 'Applications', 'purple']].map(([icon, num, label, color]) => (
                  <div key={label} className={`stat-card ${color}`}>
                    <div className="stat-icon">{icon}</div>
                    <div className="stat-number">{num}</div>
                    <div className="stat-label">{label}</div>
                  </div>
                ))}
              </div>

              {/* Recent Applications */}
              <div className="card">
                <div className="flex-between mb-3">
                  <h3>Recent Applications</h3>
                  <button className="btn btn-secondary btn-sm" onClick={() => setPage('applications')}>View All</button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Candidate</th><th>Job</th><th>ATS Score</th><th>Match</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {applications.slice(0, 8).map(a => (
                        <tr key={a.id}>
                          <td><div>{a.candidateName}</div><div style={{ fontSize: '12px', color: 'var(--text3)' }}>{a.candidateEmail}</div></td>
                          <td>{a.jobTitle || '—'}</td>
                          <td><span style={{ color: a.atsScore >= 70 ? 'var(--green)' : a.atsScore >= 40 ? 'var(--orange)' : 'var(--red)', fontWeight: '600' }}>{a.atsScore?.toFixed(0)}</span></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div className="progress-bar-wrap" style={{ width: '60px' }}>
                                <div className="progress-bar-fill" style={{ width: `${a.matchScore}%`, background: a.matchScore >= 70 ? 'var(--green)' : 'var(--orange)' }} />
                              </div>
                              <span style={{ fontSize: '12px' }}>{a.matchScore?.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td><StatusBadge status={a.status} /></td>
                          <td>
                            {a.status === 'Applied' || a.status === 'In Progress' ? (
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button className="btn btn-success btn-sm" onClick={() => setActionModal({ appId: a.id, action: 'Selected', name: a.candidateName })}>✓</button>
                                <button className="btn btn-danger btn-sm" onClick={() => setActionModal({ appId: a.id, action: 'Rejected', name: a.candidateName })}>✗</button>
                              </div>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Jobs ── */}
          {page === 'jobs' && (
            <div>
              <div className="flex-between mb-3">
                <h2 className="section-title" style={{ marginBottom: 0 }}>Job <span>Postings</span></h2>
                <button className="btn btn-primary" onClick={() => { setShowJobForm(true); setEditingJob(null); setJobForm(JOB_INIT); }}>+ Post New Job</button>
              </div>

              {showJobForm && (
                <div className="card" style={{ marginBottom: '24px', borderColor: 'var(--accent)' }}>
                  <h3 style={{ marginBottom: '20px', color: 'var(--accent)' }}>{editingJob ? 'Edit Job' : 'Create New Job Posting'}</h3>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Job Title *</label>
                      <input className="form-control" placeholder="e.g. Java Backend Developer" value={jobForm.title} onChange={e => setJobForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Experience Required</label>
                      <input className="form-control" placeholder="e.g. 2-4 years" value={jobForm.experience} onChange={e => setJobForm(f => ({ ...f, experience: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Salary Range</label>
                      <input className="form-control" placeholder="e.g. 8-12 LPA" value={jobForm.salary} onChange={e => setJobForm(f => ({ ...f, salary: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select className="form-control" value={jobForm.status} onChange={e => setJobForm(f => ({ ...f, status: e.target.value }))}>
                        <option>Open</option><option>Closed</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Required Skills (comma-separated) *</label>
                    <input className="form-control" placeholder="Java, Spring Boot, MySQL, REST APIs" value={jobForm.requiredSkills} onChange={e => setJobForm(f => ({ ...f, requiredSkills: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Job Description</label>
                    <textarea className="form-control" rows={4} placeholder="Describe the role, responsibilities, and requirements..." value={jobForm.description} onChange={e => setJobForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-primary" onClick={handleCreateJob} disabled={loading}>{loading ? 'Saving…' : editingJob ? '💾 Update Job' : '🚀 Post Job'}</button>
                    <button className="btn btn-secondary" onClick={() => { setShowJobForm(false); setEditingJob(null); }}>Cancel</button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {jobs.map(job => (
                  <div key={job.id} className="card" style={{ padding: '20px' }}>
                    <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <h3 style={{ fontSize: '16px' }}>{job.title}</h3>
                          <StatusBadge status={job.status} />
                        </div>
                        <div className="job-meta">
                          {job.salary && <span>💰 {job.salary}</span>}
                          {job.experience && <span>⏱ {job.experience}</span>}
                          <span>📅 {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '—'}</span>
                        </div>
                        <div className="tags-wrap mt-1">
                          {(job.requiredSkills || '').split(',').slice(0, 5).map(s => <span key={s} className="tag">{s.trim()}</span>)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditingJob(job.id); setJobForm({ ...job }); setShowJobForm(true); window.scrollTo(0,0); }}>✏️ Edit</button>
                        {job.status === 'Open' && <button className="btn btn-warning btn-sm" onClick={() => handleCloseJob(job.id)}>🔒 Close</button>}
                        <button className="btn btn-primary btn-sm" onClick={() => { setSelectedJobId(job.id); loadRanking(job.id); setPage('ranking'); }}>🏆 Rankings</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Candidates ── */}
          {page === 'candidates' && (
            <div>
              <h2 className="section-title">All <span>Candidates</span></h2>
              <div className="table-wrap card" style={{ padding: 0 }}>
                <table>
                  <thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Domain</th><th>ATS Score</th><th>Status</th><th>Skills</th></tr></thead>
                  <tbody>
                    {candidates.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.fullName}</strong></td>
                        <td style={{ color: 'var(--text2)' }}>{c.email}</td>
                        <td style={{ color: 'var(--text2)' }}>{c.mobile}</td>
                        <td>{c.domain || '—'}</td>
                        <td>
                          <span style={{
                            fontWeight: '700',
                            color: c.atsScore >= 70 ? 'var(--green)' : c.atsScore >= 40 ? 'var(--orange)' : 'var(--text3)'
                          }}>
                            {c.atsScore?.toFixed(0) || 0}
                          </span>
                        </td>
                        <td><span className={`badge ${c.internshipStatus === 'Job' ? 'badge-green' : c.internshipStatus === 'Internship' ? 'badge-orange' : 'badge-gray'}`}>{c.internshipStatus}</span></td>
                        <td><span className="text-muted">{c.skills?.length || 0} skills</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Applications ── */}
          {page === 'applications' && (
            <div>
              <h2 className="section-title">All <span>Applications</span></h2>
              <div className="table-wrap card" style={{ padding: 0 }}>
                <table>
                  <thead><tr><th>Candidate</th><th>Job</th><th>Type</th><th>ATS</th><th>Match</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                  <tbody>
                    {applications.map(a => (
                      <tr key={a.id}>
                        <td>
                          <div style={{ fontWeight: '500' }}>{a.candidateName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{a.candidateEmail}</div>
                        </td>
                        <td>{a.jobTitle || '—'}</td>
                        <td><span className={`badge ${a.jobType === 'internal' ? 'badge-blue' : 'badge-orange'}`}>{a.jobType}</span></td>
                        <td><strong style={{ color: a.atsScore >= 70 ? 'var(--green)' : 'var(--orange)' }}>{a.atsScore?.toFixed(0)}</strong></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div className="progress-bar-wrap" style={{ width: '50px' }}>
                              <div className="progress-bar-fill" style={{ width: `${a.matchScore}%`, background: a.matchScore >= 70 ? 'var(--green)' : 'var(--orange)' }} />
                            </div>
                            <span style={{ fontSize: '12px' }}>{a.matchScore?.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td><StatusBadge status={a.status} /></td>
                        <td style={{ fontSize: '12px', color: 'var(--text3)' }}>{a.appliedAt ? new Date(a.appliedAt).toLocaleDateString() : '—'}</td>
                        <td>
                          {(a.status === 'Applied' || a.status === 'In Progress') ? (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button className="btn btn-success btn-sm" onClick={() => setActionModal({ appId: a.id, action: 'Selected', name: a.candidateName })}>✓ Select</button>
                              <button className="btn btn-danger btn-sm" onClick={() => setActionModal({ appId: a.id, action: 'Rejected', name: a.candidateName })}>✗ Reject</button>
                            </div>
                          ) : <span className="text-muted" style={{ fontSize: '12px' }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── External Jobs (Admin-managed) ── */}
          {page === 'external' && (
            <AdminExternalJobs />
          )}

          {/* ── AI Ranking ── */}
          {page === 'ranking' && (
            <div>
              <h2 className="section-title">AI Candidate <span>Ranking</span></h2>
              <div className="card" style={{ marginBottom: '24px' }}>
                <label className="form-label">Select Job to View Rankings</label>
                <select className="form-control" style={{ maxWidth: '400px' }}
                  value={selectedJobId || ''} onChange={e => { if (e.target.value) loadRanking(parseInt(e.target.value)); }}>
                  <option value="">-- Select a Job --</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>

              {jobRanking.length > 0 ? (
                <div className="card" style={{ padding: 0 }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                    <h3>Ranked Candidates — {jobs.find(j => j.id === selectedJobId)?.title}</h3>
                    <p className="text-muted" style={{ fontSize: '13px', marginTop: '4px' }}>Sorted by AI match score (highest first)</p>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>#</th><th>Candidate</th><th>ATS Score</th><th>Match Score</th><th>Skill Gap</th><th>Status</th><th>Actions</th></tr></thead>
                      <tbody>
                        {jobRanking.map((a, i) => (
                          <tr key={a.id}>
                            <td>
                              <div style={{
                                width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: i === 0 ? 'rgba(234,179,8,0.2)' : i === 1 ? 'rgba(148,163,184,0.15)' : i === 2 ? 'rgba(180,83,9,0.15)' : 'var(--bg3)',
                                color: i === 0 ? '#eab308' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : 'var(--text3)',
                                fontWeight: '700', fontSize: '13px'
                              }}>
                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: '600' }}>{a.candidateName}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{a.candidateEmail}</div>
                            </td>
                            <td><span style={{ fontWeight: '700', color: a.atsScore >= 70 ? 'var(--green)' : a.atsScore >= 40 ? 'var(--orange)' : 'var(--red)' }}>{a.atsScore?.toFixed(0)}</span></td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="progress-bar-wrap" style={{ width: '80px' }}>
                                  <div className="progress-bar-fill" style={{ width: `${a.matchScore}%`, background: a.matchScore >= 70 ? 'var(--green)' : a.matchScore >= 40 ? 'var(--orange)' : 'var(--red)' }} />
                                </div>
                                <strong>{a.matchScore?.toFixed(1)}%</strong>
                              </div>
                            </td>
                            <td style={{ maxWidth: '200px' }}>
                              <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{a.skillGap || '—'}</span>
                            </td>
                            <td><StatusBadge status={a.status} /></td>
                            <td>
                              {(a.status === 'Applied' || a.status === 'In Progress') ? (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button className="btn btn-success btn-sm" onClick={() => setActionModal({ appId: a.id, action: 'Selected', name: a.candidateName })}>✓</button>
                                  <button className="btn btn-danger btn-sm" onClick={() => setActionModal({ appId: a.id, action: 'Rejected', name: a.candidateName })}>✗</button>
                                </div>
                              ) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : selectedJobId ? (
                <div className="empty-state"><div className="icon">📭</div><h3>No Applications</h3><p>No candidates have applied to this job yet</p></div>
              ) : null}
            </div>
          )}

        </main>
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', borderColor: actionModal.action === 'Selected' ? 'var(--green)' : 'var(--red)' }}>
            <h3 style={{ marginBottom: '16px', color: actionModal.action === 'Selected' ? 'var(--green)' : 'var(--red)' }}>
              {actionModal.action === 'Selected' ? '✅ Select Candidate' : '❌ Reject Candidate'}
            </h3>
            <p style={{ color: 'var(--text2)', marginBottom: '20px', fontSize: '14px' }}>
              {actionModal.action === 'Selected'
                ? `Mark "${actionModal.name}" as Selected for this position?`
                : `Reject "${actionModal.name}"? An email with feedback will be sent.`}
            </p>
            <div className="form-group">
              <label className="form-label">{actionModal.action === 'Selected' ? 'Message (optional)' : 'Rejection Feedback'}</label>
              <textarea className="form-control" rows={3} placeholder={actionModal.action === 'Selected' ? 'Congratulations message...' : 'Reason for rejection / areas to improve...'} value={feedback} onChange={e => setFeedback(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className={`btn ${actionModal.action === 'Selected' ? 'btn-success' : 'btn-danger'} btn-lg`} style={{ flex: 1 }} onClick={handleAction} disabled={loading}>
                {loading ? 'Processing…' : `Confirm ${actionModal.action}`}
              </button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setActionModal(null); setFeedback(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

