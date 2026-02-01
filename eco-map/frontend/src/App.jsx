import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import CreateMissionPage from './pages/CreateMissionPage';
import ProjectProgressPage from './pages/ProjectProgressPage';
import UserDashboard from './pages/UserDashboard';  
import TaskWorkspace from './pages/TaskWorkspace';

// Protected Route 
const ProtectedRoute = ({ children, requireAdmin }) => {
  const { user, token } = useAuth();

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && !user?.is_admin) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-900">
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Admin Route */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route 
              path="/admin/create-mission" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <CreateMissionPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/projects/:projectId/progress" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ProjectProgressPage />
                </ProtectedRoute>
              } 
            />

            {/* User Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } />

            <Route path="/task/:projectId" element={
              <ProtectedRoute>
                <TaskWorkspace />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;