import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LandingPage       from './pages/LandingPage';
import CandidateLogin    from './pages/CandidateLogin';
import AdminLogin        from './pages/AdminLogin';
import RegisterWizard    from './pages/RegisterWizard';
import CandidateDashboard from './pages/CandidateDashboard';
import AdminDashboard    from './pages/AdminDashboard';

function ProtectedCandidate({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" />;
  if (!user || user.role !== 'CANDIDATE') return <Navigate to="/login/candidate" replace />;
  return children;
}

function ProtectedAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" />;
  if (!user || user.role !== 'ADMIN') return <Navigate to="/login/admin" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"                element={<LandingPage />} />
          <Route path="/login/candidate" element={<CandidateLogin />} />
          <Route path="/login/admin"     element={<AdminLogin />} />
          <Route path="/register"        element={<RegisterWizard />} />
          <Route path="/candidate/*"     element={<ProtectedCandidate><CandidateDashboard /></ProtectedCandidate>} />
          <Route path="/admin/*"         element={<ProtectedAdmin><AdminDashboard /></ProtectedAdmin>} />
          <Route path="*"               element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={3500} theme="dark" />
    </AuthProvider>
  );
}
