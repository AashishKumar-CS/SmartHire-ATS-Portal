import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import {
  getProfile, updateProfile, uploadResume, uploadProfileImage,
  getOpenJobs, getOpenExternalJobs, getCandidateApplications, applyToJob
} from '../services/api';

const NAV = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'profile',   icon: '👤', label: 'My Profile' },
  { id: 'resume',    icon: '📄', label: 'Resume & ATS' },
  { id: 'jobs',      icon: '💼', label: 'Browse Jobs' },
  { id: 'external',  icon: '🌐', label: 'External Jobs' },
  { id: 'applied',   icon: '📋', label: 'My Applications' },
];

function ScoreRing({ score }) {
  const cls = score >= 70 ? 'score-high' : score >= 40 ? 'score-medium' : 'score-low';
  return <div className={`score-ring ${cls}`}>{score ? score.toFixed(0) : 0}</div>;
}

function StatusBadge({ status }) {
  const map = { Applied: 'badge-blue', 'In Progress': 'badge-orange', Selected: 'badge-green', Rejected: 'badge-red' };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

export default function CandidateDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [extJobs, setExtJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [skillInput, setSkillInput] = useState('');
  const [atsResult, setAtsResult] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);

  const cid = user?.candidateId;

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await getProfile(cid);
      if (data.success) { setProfile(data.data); setEditForm(data.data); }
    } catch { toast.error('Failed to load profile'); }
  }, [cid]);

  const loadJobs = useCallback(async () => {
    try {
      const [r1, r2] = await Promise.all([getOpenJobs(), getOpenExternalJobs()]);
      setJobs(r1.data.data || []);
      setExtJobs(r2.data.data || []);
    } catch { toast.error('Failed to load jobs'); }
  }, []);

  const loadApplications = useCallback(async () => {
    try {
      const { data } = await getCandidateApplications(cid);
      setApplications(data.data || []);
    } catch { toast.error('Failed to load applications'); }
  }, [cid]);

  useEffect(() => { loadProfile(); loadJobs(); loadApplications(); }, [loadProfile, loadJobs, loadApplications]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const payload = { ...editForm, skills: editForm.skills || [] };
      const { data } = await updateProfile(cid, payload);
      if (data.success) { toast.success('Profile updated!'); setEditMode(false); loadProfile(); }
      else toast.error(data.message);
    } catch { toast.error('Update failed'); }
    finally { setLoading(false); }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) { toast.error('Select a PDF file'); return; }
    setLoading(true);
    try {
      const { data } = await uploadResume(cid, resumeFile);
      if (data.success) {
        setAtsResult(data);
        toast.success(`ATS Score: ${data.atsScore?.toFixed(1)}`);
        loadProfile();
      } else toast.error(data.message);
    } catch { toast.error('Upload failed'); }
    finally { setLoading(false); }
  };

  const handleApply = async (jobId, jobType, thirdPartyJobId) => {
    setLoading(true);
    try {
      const payload = { candidateId: cid, jobType };
      if (jobType === 'internal') payload.jobId = jobId;
      else payload.thirdPartyJobId = thirdPartyJobId;
      const { data } = await applyToJob(payload);
      if (data.success) {
        toast.success(`Applied! Match Score: ${data.matchScore?.toFixed(1)}%`);
        loadApplications();
      } else toast.error(data.message);
    } catch { toast.error('Application failed'); }
    finally { setLoading(false); }
  };

  const isApplied = (jobId, extJobId) =>
    applications.some(a => (jobId && a.jobId === jobId) || (extJobId && a.thirdPartyJobId === extJobId));

  const addSkillEdit = () => {
    const s = skillInput.trim();
    if (s && !(editForm.skills || []).includes(s)) {
      setEditForm(f => ({ ...f, skills: [...(f.skills || []), s] }));
      setSkillInput('');
    }
  };

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <span className="navbar-brand">⚡ SmartHire</span>
        <div className="navbar-nav flex-center gap-2">
          {profile?.atsScore > 0 && (
            <span style={{ fontSize: '13px', color: 'var(--text2)' }}>
              ATS Score: <strong style={{ color: 'var(--accent)' }}>{profile.atsScore.toFixed(1)}</strong>
            </span>
          )}
          <span style={{ fontSize: '13px', color: 'var(--text2)' }}>👋 {user?.fullName}</span>
          <button className="btn btn-secondary btn-sm" onClick={() => { logout(); navigate('/'); }}>Logout</button>
        </div>
      </nav>

      <div className="dash-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          {NAV.map(n => (
            <button key={n.id} className={`sidebar-item ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
              <span className="sidebar-icon">{n.icon}</span> {n.label}
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="dash-content">

          {/* ── Dashboard Overview ── */}
          {page === 'dashboard' && profile && (
            <div>
              <h2 className="section-title">Welcome back, <span>{profile.fullName?.split(' ')[0]}</span>!</h2>
              <div className="grid-4" style={{ marginBottom: '28px' }}>
                <div className={`stat-card blue`}>
                  <div className="stat-icon">🎯</div>
                  <div className="stat-number" style={{ color: '#60a5fa' }}>{profile.atsScore?.toFixed(0) || 0}</div>
                  <div className="stat-label">ATS Score</div>
                </div>
                <div className="stat-card green">
                  <div className="stat-icon">📋</div>
                  <div className="stat-number" style={{ color: '#34d399' }}>{applications.length}</div>
                  <div className="stat-label">Applications</div>
                </div>
                <div className="stat-card orange">
                  <div className="stat-icon">✅</div>
                  <div className="stat-number" style={{ color: '#fbbf24' }}>{applications.filter(a => a.status === 'Selected').length}</div>
                  <div className="stat-label">Selected</div>
                </div>
                <div className="stat-card purple">
                  <div className="stat-icon">🛠️</div>
                  <div className="stat-number" style={{ color: '#a78bfa' }}>{profile.skills?.length || 0}</div>
                  <div className="stat-label">Skills</div>
                </div>
              </div>

              {/* Recent Applications */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="flex-between mb-2">
                  <h3>Recent Applications</h3>
                  <button className="btn btn-secondary btn-sm" onClick={() => setPage('applied')}>View All</button>
                </div>
                {applications.length === 0 ? (
                  <div className="empty-state" style={{ padding: '30px' }}>
                    <div>📭</div>
                    <p style={{ color: 'var(--text2)', marginTop: '8px' }}>No applications yet. Browse jobs to apply!</p>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Job</th><th>Type</th><th>Match Score</th><th>Status</th></tr></thead>
                      <tbody>
                        {applications.slice(0, 5).map(a => (
                          <tr key={a.id}>
                            <td>{a.jobTitle || 'External Job'}</td>
                            <td><span className={`badge ${a.jobType === 'internal' ? 'badge-blue' : 'badge-orange'}`}>{a.jobType}</span></td>
                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="progress-bar-wrap" style={{ width: '80px' }}>
                                <div className="progress-bar-fill" style={{ width: `${a.matchScore}%`, background: a.matchScore >= 70 ? 'var(--green)' : a.matchScore >= 40 ? 'var(--orange)' : 'var(--red)' }} />
                              </div>
                              <span style={{ fontSize: '13px' }}>{a.matchScore?.toFixed(0)}%</span>
                            </div></td>
                            <td><StatusBadge status={a.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Profile Completion */}
              {!profile.resumePath && (
                <div className="alert alert-warning">
                  📄 Upload your resume to get an ATS score and better job matches!
                  <button className="btn btn-warning btn-sm" style={{ marginLeft: '12px' }} onClick={() => setPage('resume')}>Upload Resume</button>
                </div>
              )}
            </div>
          )}

          {/* ── Profile ── */}
          {page === 'profile' && (
            <div>
              <div className="flex-between mb-3">
                <h2 className="section-title" style={{ marginBottom: 0 }}>My <span>Profile</span></h2>
                <button className="btn btn-secondary" onClick={() => setEditMode(!editMode)}>
                  {editMode ? '✕ Cancel' : '✏️ Edit Profile'}
                </button>
              </div>

              {!editMode && profile ? (
                <div className="grid-2">
                  <div className="card">
                    <h3 style={{ marginBottom: '20px' }}>Personal Details</h3>
                    {[['Full Name', profile.fullName], ['Email', profile.email], ['Mobile', profile.mobile], ['Gender', profile.gender], ['Date of Birth', profile.dateOfBirth], ['Domain', profile.domain], ['Status', profile.internshipStatus], ['GitHub', profile.githubLink]].map(([k, v]) => v && (
                      <div key={k} style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '14px', borderBottom: '1px solid rgba(42,58,92,0.3)', paddingBottom: '10px' }}>
                        <span style={{ color: 'var(--text2)', minWidth: '120px' }}>{k}</span>
                        <span style={{ wordBreak: 'break-all' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="card" style={{ marginBottom: '16px' }}>
                      <h3 style={{ marginBottom: '16px' }}>Skills</h3>
                      <div className="tags-wrap">
                        {(profile.skills || []).map(s => <span key={s} className="tag">{s}</span>)}
                        {(!profile.skills || profile.skills.length === 0) && <p className="text-muted">No skills added</p>}
                      </div>
                    </div>
                    <div className="card">
                      <h3 style={{ marginBottom: '16px' }}>Education</h3>
                      {(profile.educationDetails || []).map((e, i) => (
                        <div key={i} style={{ marginBottom: '12px', padding: '12px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                          <div style={{ fontWeight: '600', fontSize: '13px' }}>{e.level}</div>
                          <div style={{ color: 'var(--text2)', fontSize: '13px' }}>{e.institutionName}</div>
                          <div style={{ color: 'var(--text3)', fontSize: '12px' }}>{e.yearOfPassing} · {e.percentageCgpa}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : editMode && (
                <div className="card">
                  <h3 style={{ marginBottom: '24px' }}>Edit Profile</h3>
                  <div className="grid-2">
                    {[['fullName','Full Name','text'], ['gender','Gender','text'], ['domain','Domain','text'], ['internshipStatus','Status','text'], ['githubLink','GitHub Link','text']].map(([k, l, t]) => (
                      <div key={k} className="form-group">
                        <label className="form-label">{l}</label>
                        <input className="form-control" type={t} value={editForm[k] || ''} onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))} />
                      </div>
                    ))}
                    <div className="form-group">
                      <label className="form-label">Date of Birth</label>
                      <input className="form-control" type="date" value={editForm.dateOfBirth || ''} onChange={e => setEditForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <textarea className="form-control" value={editForm.address || ''} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Skills</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input className="form-control" placeholder="Add skill and press Enter" value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkillEdit(); } }} />
                      <button type="button" className="btn btn-secondary" onClick={addSkillEdit}>Add</button>
                    </div>
                    <div className="tags-wrap mt-2">
                      {(editForm.skills || []).map(s => (
                        <span key={s} className="tag">
                          {s} <button type="button" className="tag-remove" onClick={() => setEditForm(f => ({ ...f, skills: f.skills.filter(x => x !== s) }))}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-between mt-3">
                    <button className="btn btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSaveProfile} disabled={loading}>
                      {loading ? 'Saving…' : '💾 Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Resume & ATS ── */}
          {page === 'resume' && (
            <div>
              <h2 className="section-title">Resume & <span>ATS Score</span></h2>
              <div className="grid-2">
                <div className="card">
                  <h3 style={{ marginBottom: '20px' }}>Upload Resume</h3>
                  <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: '40px 24px', textAlign: 'center', marginBottom: '20px', cursor: 'pointer', transition: 'var(--transition)' }}
                    onClick={() => document.getElementById('resumeInput').click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); setResumeFile(e.dataTransfer.files[0]); }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📄</div>
                    <p style={{ color: 'var(--text2)', marginBottom: '8px' }}>
                      {resumeFile ? `✅ ${resumeFile.name}` : 'Click or drag & drop your resume (PDF, max 5MB)'}
                    </p>
                    <input id="resumeInput" type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setResumeFile(e.target.files[0])} />
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleResumeUpload} disabled={loading || !resumeFile}>
                    {loading ? '⏳ Analysing with AI…' : '🤖 Upload & Get ATS Score'}
                  </button>
                  {profile?.resumePath && (
                    <div className="alert alert-success mt-2">✅ Resume on file. Upload a new one to re-analyse.</div>
                  )}
                </div>

                <div className="card">
                  <h3 style={{ marginBottom: '20px' }}>ATS Analysis</h3>
                  {(atsResult || profile?.atsScore) ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                        <ScoreRing score={atsResult?.atsScore || profile?.atsScore || 0} />
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700' }}>ATS Score</div>
                          <div className="text-muted" style={{ fontSize: '13px' }}>
                            {(atsResult?.atsScore || profile?.atsScore) >= 70 ? '🟢 Great! Strong ATS compatibility' :
                             (atsResult?.atsScore || profile?.atsScore) >= 40 ? '🟡 Good, some improvements needed' :
                             '🔴 Needs significant improvements'}
                          </div>
                        </div>
                      </div>
                      {atsResult && (
                        <>
                          {atsResult.strengths?.length > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                              <h4 style={{ color: 'var(--green)', fontSize: '13px', marginBottom: '8px' }}>✅ STRENGTHS</h4>
                              {atsResult.strengths.map((s, i) => <p key={i} style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>• {s}</p>)}
                            </div>
                          )}
                          {atsResult.weaknesses?.length > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                              <h4 style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '8px' }}>⚠️ WEAKNESSES</h4>
                              {atsResult.weaknesses.map((s, i) => <p key={i} style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>• {s}</p>)}
                            </div>
                          )}
                          {atsResult.suggestions?.length > 0 && (
                            <div>
                              <h4 style={{ color: 'var(--accent)', fontSize: '13px', marginBottom: '8px' }}>💡 SUGGESTIONS</h4>
                              {atsResult.suggestions.map((s, i) => <p key={i} style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>• {s}</p>)}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <div className="empty-state" style={{ padding: '30px' }}>
                      <div className="icon">🤖</div>
                      <h3>No ATS Score Yet</h3>
                      <p>Upload your resume to get an AI-powered ATS compatibility score</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Browse Jobs ── */}
          {page === 'jobs' && (
            <div>
              <h2 className="section-title">Browse <span>Jobs</span></h2>
              {jobs.length === 0 ? (
                <div className="empty-state"><div className="icon">💼</div><h3>No Open Jobs</h3><p>Check back later for new openings</p></div>
              ) : (
                <div className="grid-2">
                  {jobs.map(job => (
                    <div key={job.id} className="job-card">
                      <div className="job-card-header">
                        <div>
                          <div className="job-title">{job.title}</div>
                          <span className="badge badge-green" style={{ marginTop: '6px' }}>Internal</span>
                        </div>
                        <span className="badge badge-blue">{job.status}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '12px', lineHeight: '1.6' }}>
                        {job.description?.substring(0, 120)}{job.description?.length > 120 ? '…' : ''}
                      </p>
                      <div className="job-meta">
                        {job.salary && <span>💰 {job.salary}</span>}
                        {job.experience && <span>⏱ {job.experience}</span>}
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '6px' }}>REQUIRED SKILLS</div>
                        <div className="tags-wrap">
                          {(job.requiredSkills || '').split(',').slice(0, 4).map(s => <span key={s} className="tag">{s.trim()}</span>)}
                        </div>
                      </div>
                      <button
                        className={`btn ${isApplied(job.id, null) ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                        style={{ width: '100%' }}
                        disabled={isApplied(job.id, null) || loading}
                        onClick={() => handleApply(job.id, 'internal', null)}>
                        {isApplied(job.id, null) ? '✅ Applied' : '🚀 Apply Now'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── External Jobs ── */}
          {page === 'external' && (
            <div>
              <h2 className="section-title">External <span>Job Board</span></h2>
              <div className="alert alert-info mb-3">🌐 These jobs are from third-party platforms. Clicking "View & Apply" will redirect you to the external job portal.</div>
              <div className="grid-2">
                {extJobs.map(job => (
                  <div key={job.id} className="job-card">
                    <div className="job-card-header">
                      <div>
                        <div className="job-title">{job.title}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>🏢 {job.company}</div>
                      </div>
                      <span className="badge badge-orange">{job.source}</span>
                    </div>
                    <div className="job-meta">
                      {job.salary && <span>💰 {job.salary}</span>}
                      {job.location && <span>📍 {job.location}</span>}
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <div className="tags-wrap">
                        {(job.requiredSkills || '').split(',').slice(0, 4).map(s => <span key={s} className="tag">{s.trim()}</span>)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className={`btn btn-secondary btn-sm`}
                        style={{ flex: 1 }}
                        disabled={isApplied(null, job.id) || loading}
                        onClick={() => handleApply(null, 'external', job.id)}>
                        {isApplied(null, job.id) ? '✅ Tracked' : '📌 Track Application'}
                      </button>
                      <a href={job.externalUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ flex: 1, textDecoration: 'none', justifyContent: 'center' }}>
                        🔗 View & Apply
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── My Applications ── */}
          {page === 'applied' && (
            <div>
              <h2 className="section-title">My <span>Applications</span></h2>
              {applications.length === 0 ? (
                <div className="empty-state"><div className="icon">📭</div><h3>No Applications Yet</h3><p>Browse jobs and apply to track your applications here</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {applications.map(app => (
                    <div key={app.id} className="card" style={{ padding: '20px' }}>
                      <div className="flex-between" style={{ marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <h3 style={{ fontSize: '16px' }}>{app.jobTitle || 'External Position'}</h3>
                          <span className={`badge ${app.jobType === 'internal' ? 'badge-blue' : 'badge-orange'}`} style={{ marginTop: '4px' }}>
                            {app.jobType === 'internal' ? '🏢 Internal' : '🌐 External'}
                          </span>
                        </div>
                        <StatusBadge status={app.status} />
                      </div>
                      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                        <div>
                          <div className="text-muted" style={{ fontSize: '12px', marginBottom: '4px' }}>MATCH SCORE</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="progress-bar-wrap" style={{ width: '100px' }}>
                              <div className="progress-bar-fill" style={{ width: `${app.matchScore}%`, background: app.matchScore >= 70 ? 'var(--green)' : app.matchScore >= 40 ? 'var(--orange)' : 'var(--red)' }} />
                            </div>
                            <strong>{app.matchScore?.toFixed(1)}%</strong>
                          </div>
                        </div>
                        <div>
                          <div className="text-muted" style={{ fontSize: '12px', marginBottom: '4px' }}>APPLIED ON</div>
                          <div style={{ fontSize: '13px' }}>{app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '—'}</div>
                        </div>
                      </div>
                      {app.skillGap && (
                        <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)', fontSize: '13px' }}>
                          <span style={{ color: 'var(--orange)', fontWeight: '600' }}>💡 Skill Gap: </span>
                          <span style={{ color: 'var(--text2)' }}>{app.skillGap}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
