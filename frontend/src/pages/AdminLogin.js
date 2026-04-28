import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginAdmin } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) { toast.error('Fill all fields'); return; }
    setLoading(true);
    try {
      const { data } = await loginAdmin(form);
      if (data.success) {
        login({ role: 'ADMIN', adminId: data.adminId, username: data.username, fullName: data.fullName }, data.token);
        toast.success(`Welcome, ${data.fullName}!`);
        navigate('/admin');
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🛡️</div>
          <h2 style={{ fontSize: '26px' }}>Admin Portal</h2>
          <p className="text-muted mt-1">SmartHire administration console</p>
          <div className="alert alert-info mt-2" style={{ fontSize: '12px' }}>
            Default credentials: <strong></strong>
          </div>
        </div>

        <form onSubmit={handle}>
          <div className="form-group">
            <label className="form-label">Admin Username</label>
            <input className="form-control" placeholder="Enter admin username" value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" placeholder="Enter password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in…' : 'Access Admin Panel →'}
          </button>
        </form>

        <div className="divider" />
        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text2)' }}>
          <Link to="/login/candidate" style={{ color: 'var(--text3)' }}>Candidate login</Link>
          {' · '}
          <Link to="/" style={{ color: 'var(--text3)' }}>Home</Link>
        </p>
      </div>
    </div>
  );
}
