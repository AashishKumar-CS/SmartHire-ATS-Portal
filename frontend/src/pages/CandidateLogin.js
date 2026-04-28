import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginCandidate } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CandidateLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) { toast.error('Fill all fields'); return; }
    setLoading(true);
    try {
      const { data } = await loginCandidate(form);
      if (data.success) {
        login({ role: 'CANDIDATE', candidateId: data.candidateId, username: data.username, fullName: data.fullName }, data.token);
        toast.success(`Welcome back, ${data.fullName}!`);
        navigate('/candidate');
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
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>👤</div>
          <h2 style={{ fontSize: '26px' }}>Candidate Login</h2>
          <p className="text-muted mt-1">Access your SmartHire dashboard</p>
        </div>

        <form onSubmit={handle}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-control" placeholder="Enter username" value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" placeholder="Enter password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div className="divider" />
        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text2)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: '600' }}>Register here</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '14px', color: 'var(--text2)' }}>
          <Link to="/login/admin" style={{ color: 'var(--text3)' }}>Admin? Login here</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '14px', color: 'var(--text2)' }}>
          <Link to="/" style={{ color: 'var(--text3)' }}>← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
