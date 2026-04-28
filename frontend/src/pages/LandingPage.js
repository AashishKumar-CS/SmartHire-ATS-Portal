import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    { icon: '🤖', title: 'AI-Powered ATS Scoring', desc: 'OpenAI analyses your resume and gives an ATS compatibility score from 0–100 with actionable feedback.' },
    { icon: '🎯', title: 'Smart Job Matching', desc: 'Our AI engine calculates a match score for every job based on your skills, experience, and resume.' },
    { icon: '📊', title: 'Candidate Ranking', desc: 'Admins see ranked candidate lists per job with match scores, saving hours of manual screening.' },
    { icon: '🔔', title: 'Email Notifications', desc: 'Automated emails notify candidates of selection, rejection, and application status updates.' },
    { icon: '🌐', title: 'External Job Board', desc: 'Browse third-party job listings from LinkedIn, Naukri, Indeed and track your applications.' },
    { icon: '📈', title: 'Skill Gap Analysis', desc: 'AI identifies missing skills for each role and suggests targeted learning resources.' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Navbar */}
      <nav className="navbar">
        <span className="navbar-brand">⚡ SmartHire</span>
        <div className="navbar-nav">
          <button className="nav-link" onClick={() => navigate('/login/candidate')}>Candidate Login</button>
          <button className="nav-link" onClick={() => navigate('/login/admin')}>Admin Login</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '100px 24px 80px', textAlign: 'center', position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-block', padding: '6px 18px', borderRadius: '20px',
            background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
            color: '#60a5fa', fontSize: '13px', fontWeight: '600', marginBottom: '28px'
          }}>
            🚀 AI-Powered Recruitment Platform
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: '800', lineHeight: '1.1', marginBottom: '24px' }}>
            Hire Smarter with<br />
            <span style={{ background: 'linear-gradient(135deg, #60a5fa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AI Resume Screening
            </span>
          </h1>
          <p style={{ fontSize: '17.5px', color: 'var(--text2)', maxWidth: '600px', margin: '0 auto 40px', lineHeight: '1.7' }}>
           SmartHire automates resume screening with OpenAI, ranks candidates by job-fit score, and helps you find the perfect match — in minutes, not days.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>
              Create Candidate Profile →
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/login/admin')}>
              Admin Portal
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '0 24px 80px' }}>
        <div className="page-wrap">
          <div className="grid-4">
            {[['500+', 'Active Jobs'], ['10K+', 'Resumes Screened'], ['98%', 'ATS Accuracy'], ['4x', 'Faster Hiring']].map(([num, label]) => (
              <div key={label} style={{ textAlign: 'center', padding: '32px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: '800', background: 'linear-gradient(135deg, #60a5fa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{num}</div>
                <div style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '6px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '0 24px 100px' }}>
        <div className="page-wrap">
          <h2 style={{ textAlign: 'center', fontSize: '36px', fontWeight: '800', marginBottom: '48px' }}>
            Everything you need to <span style={{ color: 'var(--accent)' }}>hire right</span>
          </h2>
          <div className="grid-3">
            {features.map(f => (
              <div key={f.title} className="card" style={{ padding: '32px' }}>
                <div style={{ fontSize: '36px', marginBottom: '16px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>{f.title}</h3>
                <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: '1.7' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center', background: 'var(--bg2)', borderTop: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '16px' }}>Ready to transform your hiring?</h2>
        <p style={{ color: 'var(--text2)', marginBottom: '32px' }}>Join thousands of candidates and companies already using SmartHire</p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>
          Start for Free — Register Now
        </button>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px', borderTop: '1px solid var(--border)' }}>
        © 2026 SmartHire. AI Resume Screening Portal (By ASHTECH).
      </footer>
    </div>
  );
}
