import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { sendOtp, verifyOtp, registerCandidate } from '../services/api';

const STEPS = ['Personal Info', 'Education', 'Skills & Experience', 'OTP Verify', 'Review & Submit'];

const INITIAL = {
  fullName: '', email: '', mobile: '', gender: '', address: '', dateOfBirth: '',
  domain: '', certifications: '', internshipStatus: 'Fresher', githubLink: '',
  educationDetails: [
    { level: '10th',           institutionName: '', boardUniversity: '', yearOfPassing: '', percentageCgpa: '' },
    { level: '12th',           institutionName: '', boardUniversity: '', yearOfPassing: '', percentageCgpa: '' },
    { level: 'Graduation',     institutionName: '', boardUniversity: '', yearOfPassing: '', percentageCgpa: '' },
    { level: 'PostGraduation', institutionName: '', boardUniversity: '', yearOfPassing: '', percentageCgpa: '' },
  ],
  skills: [], mobileVerified: false,
};

export default function RegisterWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL);
  const [skillInput, setSkillInput] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setEdu = (i, k, v) => setForm(f => {
    const ed = [...f.educationDetails];
    ed[i] = { ...ed[i], [k]: v };
    return { ...f, educationDetails: ed };
  });

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) { set('skills', [...form.skills, s]); setSkillInput(''); }
  };
  const removeSkill = (s) => set('skills', form.skills.filter(x => x !== s));

  const handleSendOtp = async () => {
    if (!form.mobile || form.mobile.length < 10) { toast.error('Enter valid 10-digit mobile'); return; }
    setLoading(true);
    try {
      const { data } = await sendOtp(form.mobile);
      if (data.success) {
        setOtpSent(true);
        toast.success('OTP sent! Check server console (simulated)');
        //if (data.otp) toast.info(`[DEV] OTP: ${data.otp}`, { autoClose: 15000 });
      }
    } catch { toast.error('Failed to send OTP'); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const { data } = await verifyOtp(form.mobile, otp);
      if (data.success) { set('mobileVerified', true); toast.success('Mobile verified!'); }
      else toast.error('Invalid OTP. Try again.');
    } catch { toast.error('Verification failed'); }
    finally { setLoading(false); }
  };

  const validate = () => {
    if (step === 0) {
      if (!form.fullName || !form.email || !form.mobile || !form.gender)
        return 'Full name, email, mobile and gender are required';
      if (!/\S+@\S+\.\S+/.test(form.email)) return 'Invalid email';
      if (form.mobile.length < 10) return 'Invalid mobile';
    }
    if (step === 2) {
      if (form.skills.length === 0) return 'Add at least one skill';
    }
    if (step === 3 && !form.mobileVerified) return 'Verify your mobile number first';
    return null;
  };

  const next = () => {
    const err = validate(); if (err) { toast.error(err); return; }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep(s => Math.max(s - 1, 0));

  const submit = async () => {
    setLoading(true);
    try {
      const { data } = await registerCandidate(form);
      if (data.success) {
        setResult(data);
        toast.success('Registration successful!');
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (result) return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 520, textAlign: 'center' }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>🎉</div>
        <h2 style={{ marginBottom: '12px' }}>Registration Successful!</h2>
        <p className="text-muted mb-3">Your credentials have been generated and sent to your email.</p>
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
          <p style={{ marginBottom: '8px' }}><strong>Username:</strong> <code style={{ color: 'var(--accent)' }}>{result.username}</code></p>
          <p><strong>Password:</strong> <code style={{ color: 'var(--accent)' }}>{result.password}</code></p>
        </div>
        <div className="alert alert-warning" style={{ textAlign: 'left', fontSize: '13px', marginBottom: '20px' }}>
          ⚠️ Save your credentials! In production, they are emailed to you.
        </div>
        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => navigate('/login/candidate')}>
          Go to Login →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '32px 16px' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div className="navbar-brand" style={{ display: 'inline-block', marginBottom: '8px', fontSize: '28px' }}>⚡ SmartHire</div>
          <h2 style={{ fontSize: '24px' }}>Create Your Candidate Profile</h2>
          <p className="text-muted">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>

        {/* Steps bar */}
        <div className="steps-bar">
          {STEPS.map((s, i) => (
            <div key={i} className="step-item">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className={`step-num ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <div className={`step-label ${i === step ? 'active' : ''}`}>{s}</div>
              </div>
              {i < STEPS.length - 1 && <div className={`step-connector ${i < step ? 'done' : ''}`} style={{ marginBottom: '20px' }} />}
            </div>
          ))}
        </div>

        <div className="card">
          {/* ── Step 0: Personal Info ── */}
          {step === 0 && (
            <div>
              <h3 style={{ marginBottom: '24px', color: 'var(--accent)' }}>Personal Information</h3>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-control" placeholder="John Doe" value={form.fullName} onChange={e => set('fullName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email ID *</label>
                  <input className="form-control" type="email" placeholder="john@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input className="form-control" placeholder="9876543210" maxLength={10} value={form.mobile} onChange={e => set('mobile', e.target.value.replace(/\D/,''))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender *</label>
                  <select className="form-control" value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="">Select Gender</option>
                    <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input className="form-control" type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Domain / Specialization</label>
                  <input className="form-control" placeholder="e.g. Full Stack Development" value={form.domain} onChange={e => set('domain', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="form-control" placeholder="Enter your full address" value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
            </div>
          )}

          {/* ── Step 1: Education ── */}
          {step === 1 && (
            <div>
              <h3 style={{ marginBottom: '24px', color: 'var(--accent)' }}>Education Details</h3>
              {form.educationDetails.map((edu, i) => (
                <div key={i} style={{ marginBottom: '28px', padding: '20px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <h4 style={{ marginBottom: '16px', color: 'var(--text2)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {edu.level} {i === 3 && <span className="badge badge-gray">Optional</span>}
                  </h4>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Institution Name</label>
                      <input className="form-control" placeholder="School / College / University" value={edu.institutionName} onChange={e => setEdu(i, 'institutionName', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Board / University</label>
                      <input className="form-control" placeholder="CBSE / Mumbai University" value={edu.boardUniversity} onChange={e => setEdu(i, 'boardUniversity', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Year of Passing</label>
                      <input className="form-control" type="number" placeholder="2020" min="1990" max="2030" value={edu.yearOfPassing} onChange={e => setEdu(i, 'yearOfPassing', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Percentage / CGPA</label>
                      <input className="form-control" placeholder="85% or 8.5 CGPA" value={edu.percentageCgpa} onChange={e => setEdu(i, 'percentageCgpa', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Step 2: Skills & Experience ── */}
          {step === 2 && (
            <div>
              <h3 style={{ marginBottom: '24px', color: 'var(--accent)' }}>Skills & Experience</h3>

              <div className="form-group">
                <label className="form-label">Add Skills *</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input className="form-control" placeholder="e.g. Java, React, SQL" value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
                  <button type="button" className="btn btn-secondary" onClick={addSkill}>Add</button>
                </div>
                <div className="tags-wrap mt-2">
                  {form.skills.map(s => (
                    <span key={s} className="tag">
                      {s} <button type="button" className="tag-remove" onClick={() => removeSkill(s)}>×</button>
                    </span>
                  ))}
                </div>
                {form.skills.length === 0 && <p className="text-muted mt-1" style={{ fontSize: '12px' }}>Press Enter or click Add to add skills</p>}
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.internshipStatus} onChange={e => set('internshipStatus', e.target.value)}>
                    <option>Fresher</option><option>Internship</option><option>Job</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">GitHub Profile Link</label>
                  <input className="form-control" placeholder="https://github.com/username" value={form.githubLink} onChange={e => set('githubLink', e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Certifications</label>
                <textarea className="form-control" placeholder="List your certifications (e.g. AWS Solutions Architect, Google Cloud, etc.)" value={form.certifications} onChange={e => set('certifications', e.target.value)} />
              </div>
            </div>
          )}

          {/* ── Step 3: OTP Verify ── */}
          {step === 3 && (
            <div style={{ maxWidth: '420px', margin: '0 auto', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
              <h3 style={{ marginBottom: '12px' }}>Verify Mobile Number</h3>
              <p className="text-muted mb-3">We'll send a 6-digit OTP to <strong style={{ color: 'var(--text)' }}>{form.mobile}</strong></p>

              {form.mobileVerified ? (
                <div className="alert alert-success">✅ Mobile number verified successfully!</div>
              ) : (
                <>
                  {!otpSent ? (
                    <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleSendOtp} disabled={loading}>
                      {loading ? 'Sending…' : 'Send OTP'}
                    </button>
                  ) : (
                    <>
                      <div className="alert alert-info mb-3">OTP sent! Check the server console (simulated SMS).</div>
                      <div className="form-group">
                        <label className="form-label">Enter OTP</label>
                        <input className="form-control" placeholder="6-digit OTP" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} style={{ textAlign: 'center', fontSize: '22px', letterSpacing: '8px' }} />
                      </div>
                      <button className="btn btn-success btn-lg" style={{ width: '100%', marginBottom: '12px' }} onClick={handleVerifyOtp} disabled={loading}>
                        {loading ? 'Verifying…' : 'Verify OTP'}
                      </button>
                      <button className="btn btn-secondary" onClick={handleSendOtp} disabled={loading}>Resend OTP</button>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Step 4: Review & Submit ── */}
          {step === 4 && (
            <div>
              <h3 style={{ marginBottom: '24px', color: 'var(--accent)' }}>Review Your Information</h3>
              <div className="grid-2">
                <div>
                  <h4 className="text-muted" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Personal</h4>
                  {[['Name', form.fullName], ['Email', form.email], ['Mobile', form.mobile + (form.mobileVerified ? ' ✅' : ' ⚠️ Not Verified')], ['Gender', form.gender], ['DOB', form.dateOfBirth], ['Domain', form.domain]].map(([k, v]) => v && (
                    <div key={k} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '14px' }}>
                      <span style={{ color: 'var(--text2)', minWidth: '70px' }}>{k}:</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="text-muted" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Skills & Status</h4>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: 'var(--text2)', fontSize: '14px' }}>Status: </span>
                    <span className="badge badge-blue">{form.internshipStatus}</span>
                  </div>
                  <div className="tags-wrap">
                    {form.skills.map(s => <span key={s} className="tag">{s}</span>)}
                  </div>
                </div>
              </div>

              <div className="divider" />
              <h4 className="text-muted" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Education</h4>
              <div className="grid-2">
                {form.educationDetails.filter(e => e.institutionName).map((e, i) => (
                  <div key={i} style={{ background: 'var(--bg3)', padding: '14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{e.level}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{e.institutionName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{e.yearOfPassing} · {e.percentageCgpa}</div>
                  </div>
                ))}
              </div>

              {!form.mobileVerified && (
                <div className="alert alert-warning mt-3">⚠️ Mobile not verified. Go back to Step 4 to verify.</div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
            <button type="button" className="btn btn-secondary" onClick={step === 0 ? () => navigate('/') : back}>
              {step === 0 ? '← Home' : '← Back'}
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={next}>Continue →</button>
            ) : (
              <button type="button" className="btn btn-success btn-lg" onClick={submit} disabled={loading}>
                {loading ? 'Submitting…' : '🚀 Complete Registration'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
