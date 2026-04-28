import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  createExternalJob,
  getAllExternalJobsAdmin,
  updateExternalJob,
  closeExternalJob,
  reopenExternalJob,
  deleteExternalJob,
} from '../services/api';

// ─── helpers ─────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  title: '', company: '', description: '', requiredSkills: '',
  externalUrl: '', salary: '', location: '', source: '', experience: '',
};

const normalize = (job) => ({
  title:          job.title          || job.title          || '',
  company:        job.company        || '',
  description:    job.description    || '',
  requiredSkills: job.required_skills || job.requiredSkills || '',
  externalUrl:    job.external_url   || job.externalUrl    || '',
  salary:         job.salary         || '',
  location:       job.location       || '',
  source:         job.source         || '',
  experience:     job.experience     || '',
});

// ─── component ───────────────────────────────────────────────────────────────
export default function AdminExternalJobs() {
  const [jobs, setJobs]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [filter, setFilter]       = useState('All'); // All | Open | Closed
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ── load all external jobs ────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getAllExternalJobsAdmin();
      setJobs(data.data || []);
    } catch { toast.error('Failed to load external jobs'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── form handlers ─────────────────────────────────────────────────────────
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    setTimeout(() => document.getElementById('ext-title')?.focus(), 50);
  };

  const openEdit = (job) => {
    setForm(normalize(job));
    setEditingId(job.id);
    setShowForm(true);
    setTimeout(() => document.getElementById('ext-title')?.focus(), 50);
  };

  const handleSubmit = async () => {
    if (!form.title.trim())       { toast.error('Job title is required');    return; }
    if (!form.company.trim())     { toast.error('Company name is required'); return; }
    if (!form.externalUrl.trim()) { toast.error('External apply link is required'); return; }
    if (!form.requiredSkills.trim()) { toast.error('Required skills are mandatory'); return; }

    setLoading(true);
    try {
      const payload = { ...form, adminId: 1 };
      if (editingId) {
        const { data } = await updateExternalJob(editingId, payload);
        if (data.success) { toast.success('External job updated!'); }
      } else {
        const { data } = await createExternalJob(payload);
        if (data.success) { toast.success('External job posted!'); }
      }
      setShowForm(false); setEditingId(null); setForm(EMPTY_FORM);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally { setLoading(false); }
  };

  const handleClose  = async (id) => { try { await closeExternalJob(id);  toast.success('Job closed');   load(); } catch { toast.error('Failed'); } };
  const handleReopen = async (id) => { try { await reopenExternalJob(id); toast.success('Job reopened'); load(); } catch { toast.error('Failed'); } };
  const handleDelete = async (id) => {
    try { await deleteExternalJob(id); toast.success('Job deleted'); setDeleteConfirm(null); load(); }
    catch { toast.error('Delete failed'); }
  };

  const displayed = jobs.filter(j => {
    if (filter === 'All')    return true;
    if (filter === 'Open')   return (j.status || 'Open') === 'Open';
    if (filter === 'Closed') return j.status === 'Closed';
    return true;
  });

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Page Header ── */}
      <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="section-title" style={{ marginBottom: '4px' }}>
            External <span>Job Board</span>
          </h2>
          <p className="text-muted" style={{ fontSize: '13px' }}>
            Add third-party job opportunities with apply links. Candidates see only Open jobs.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add External Job</button>
      </div>

      {/* ── Stats ── */}
      <div className="grid-3" style={{ marginBottom: '20px' }}>
        {[
          ['🌐', jobs.length,                                   'Total External Jobs', '#60a5fa'],
          ['🟢', jobs.filter(j => (j.status||'Open')==='Open').length, 'Open',         '#34d399'],
          ['🔴', jobs.filter(j =>  j.status==='Closed').length, 'Closed',              '#f87171'],
        ].map(([icon, num, label, color]) => (
          <div key={label} className="stat-card" style={{ borderColor: 'var(--border)' }}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-number" style={{ color }}>{num}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Create / Edit Form ── */}
      {showForm && (
        <div className="card" style={{ marginBottom: '24px', borderColor: 'var(--accent)' }}>
          <div className="flex-between mb-3">
            <h3 style={{ color: 'var(--accent)' }}>
              {editingId ? '✏️ Edit External Job' : '+ Post New External Job'}
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => { setShowForm(false); setEditingId(null); }}>✕ Cancel</button>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Job Title *</label>
              <input id="ext-title" className="form-control" placeholder="e.g. React Developer at Google"
                value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input className="form-control" placeholder="e.g. Google India"
                value={form.company} onChange={e => set('company', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">External Apply Link * <span style={{ color: 'var(--text3)', fontSize: '11px' }}>(full URL with https://)</span></label>
              <input className="form-control" placeholder="https://careers.google.com/jobs/..."
                value={form.externalUrl} onChange={e => set('externalUrl', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Job Source / Platform</label>
              <select className="form-control" value={form.source} onChange={e => set('source', e.target.value)}>
                <option value="">Select Source</option>
                <option>LinkedIn</option><option>Naukri</option><option>Indeed</option>
                <option>Glassdoor</option><option>Instahyre</option><option>Shine</option>
                <option>Company Website</option><option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Salary / CTC</label>
              <input className="form-control" placeholder="e.g. 12-18 LPA"
                value={form.salary} onChange={e => set('salary', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-control" placeholder="e.g. Bangalore / Remote"
                value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Experience Required</label>
              <input className="form-control" placeholder="e.g. 2-4 years"
                value={form.experience} onChange={e => set('experience', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Required Skills * <span style={{ color: 'var(--text3)', fontSize: '11px' }}>(comma-separated)</span></label>
            <input className="form-control" placeholder="React, JavaScript, TypeScript, CSS, REST APIs"
              value={form.requiredSkills} onChange={e => set('requiredSkills', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Job Description</label>
            <textarea className="form-control" rows={3}
              placeholder="Describe the role, responsibilities, and what the company is looking for..."
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? '⏳ Saving…' : editingId ? '💾 Update Job' : '🚀 Post Job'}
            </button>
            <button className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Filter Tabs ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['All', 'Open', 'Closed'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f)}>
            {f === 'Open' ? '🟢' : f === 'Closed' ? '🔴' : '📋'} {f}
            <span style={{ marginLeft: '6px', opacity: 0.7, fontSize: '11px' }}>
              ({f === 'All' ? jobs.length : jobs.filter(j => (j.status||'Open') === f).length})
            </span>
          </button>
        ))}
      </div>

      {/* ── Job Cards ── */}
      {loading && <div className="spinner" />}

      {!loading && displayed.length === 0 && (
        <div className="empty-state">
          <div className="icon">🌐</div>
          <h3>No External Jobs {filter !== 'All' ? `(${filter})` : ''}</h3>
          <p>Click "+ Add External Job" to post a new opportunity</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {displayed.map(job => {
          const isOpen = (job.status || 'Open') === 'Open';
          return (
            <div key={job.id} className="card" style={{
              padding: '18px 20px',
              borderColor: isOpen ? 'var(--border)' : 'rgba(42,58,92,0.4)',
              opacity: isOpen ? 1 : 0.7,
            }}>
              <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
                {/* Left info */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700' }}>{job.title}</h3>
                    <span className={`badge ${isOpen ? 'badge-green' : 'badge-red'}`}>
                      {isOpen ? '🟢 Open' : '🔴 Closed'}
                    </span>
                    {job.source && (
                      <span className="badge badge-orange">{job.source}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '8px', fontWeight: '500' }}>
                    🏢 {job.company}
                  </div>
                  <div className="job-meta">
                    {job.salary     && <span>💰 {job.salary}</span>}
                    {job.location   && <span>📍 {job.location}</span>}
                    {job.experience && <span>⏱ {job.experience}</span>}
                    <span>🔗 <a href={job.external_url || job.externalUrl} target="_blank" rel="noreferrer"
                      style={{ color: 'var(--accent)', fontSize: '12px' }}>Apply Link</a></span>
                  </div>
                  {(job.required_skills || job.requiredSkills) && (
                    <div className="tags-wrap mt-1">
                      {(job.required_skills || job.requiredSkills || '').split(',').map(s => (
                        <span key={s} className="tag">{s.trim()}</span>
                      ))}
                    </div>
                  )}
                  {job.description && (
                    <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '8px', lineHeight: '1.5' }}>
                      {job.description.substring(0, 150)}{job.description.length > 150 ? '…' : ''}
                    </p>
                  )}
                </div>

                {/* Right actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(job)}>✏️ Edit</button>
                  {isOpen
                    ? <button className="btn btn-warning btn-sm" onClick={() => handleClose(job.id)}>🔒 Close Job</button>
                    : <button className="btn btn-success btn-sm"  onClick={() => handleReopen(job.id)}>🔓 Reopen</button>
                  }
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(job.id)}>🗑 Delete</button>
                </div>
              </div>

              {/* Posted date */}
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(42,58,92,0.3)', fontSize: '11px', color: 'var(--text3)' }}>
                Posted: {job.created_at ? new Date(job.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—'}
                {job.updated_at && job.updated_at !== job.created_at && (
                  <span style={{ marginLeft: '16px' }}>
                    Updated: {new Date(job.updated_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="card" style={{ maxWidth: '380px', width: '100%', borderColor: 'var(--red)', padding: '24px' }}>
            <h3 style={{ color: 'var(--red)', marginBottom: '12px' }}>🗑 Delete External Job?</h3>
            <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px' }}>
              This will permanently delete the external job listing. Existing candidate applications linked to it will show as orphaned. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(deleteConfirm)}>Yes, Delete</button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}