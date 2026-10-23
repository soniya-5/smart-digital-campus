import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Layout } from './components/common/Layout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ComplaintsListPage } from './pages/ComplaintsListPage';
import { SubmitComplaintPage } from './pages/SubmitComplaintPage';
import { ComplaintDetailsPage } from './pages/ComplaintDetailsPage';
import { HotspotsMapPage } from './pages/HotspotsMapPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { StudyGroupsPage } from './pages/StudyGroupsPage';
import { FacilityRatingsPage } from './pages/FacilityRatingsPage';
import { LostFoundPage } from './pages/LostFoundPage';
import { CanteenPage } from './pages/CanteenPage';
import { TimetablePage } from './pages/TimetablePage';
import { CalendarEventsPage } from './pages/CalendarEventsPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { ExamCountdownPage } from './pages/ExamCountdownPage';
import { AttendanceTrackerPage } from './pages/AttendanceTrackerPage';
import { SOSPage } from './pages/SOSPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage';
import { ProfilePage } from './pages/ProfilePage';

// Route Guard Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: ('STUDENT' | 'STAFF' | 'ADMIN')[];
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-royal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard
    if (user.role === 'ADMIN') return <Navigate to="/admin-dashboard" replace />;
    if (user.role === 'STAFF') return <Navigate to="/staff-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Workspace wrapped in Layout */}
            <Route element={<Layout />}>
              {/* Student Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Staff Dashboard */}
              <Route
                path="/staff-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Dashboard */}
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Complaints Module */}
              <Route
                path="/complaints"
                element={
                  <ProtectedRoute>
                    <ComplaintsListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/complaints/submit"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                    <SubmitComplaintPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/complaints/:id"
                element={
                  <ProtectedRoute>
                    <ComplaintDetailsPage />
                  </ProtectedRoute>
                }
              />

              {/* Campus Infrastructure & Hotspots */}
              <Route
                path="/hotspots"
                element={
                  <ProtectedRoute>
                    <HotspotsMapPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <LeaderboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Campus Modules */}
              <Route
                path="/marketplace"
                element={
                  <ProtectedRoute>
                    <MarketplacePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/study-groups"
                element={
                  <ProtectedRoute>
                    <StudyGroupsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ratings"
                element={
                  <ProtectedRoute>
                    <FacilityRatingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lost-found"
                element={
                  <ProtectedRoute>
                    <LostFoundPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/canteen"
                element={
                  <ProtectedRoute>
                    <CanteenPage />
                  </ProtectedRoute>
                }
              />

              {/* Academic Hub */}
              <Route
                path="/timetable"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                    <TimetablePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events"
                element={
                  <ProtectedRoute>
                    <CalendarEventsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/announcements"
                element={
                  <ProtectedRoute>
                    <AnnouncementsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exams"
                element={
                  <ProtectedRoute>
                    <ExamCountdownPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                    <AttendanceTrackerPage />
                  </ProtectedRoute>
                }
              />

              {/* Emergency SOS */}
              <Route
                path="/sos"
                element={
                  <ProtectedRoute>
                    <SOSPage />
                  </ProtectedRoute>
                }
              />

              {/* Administration Exclusive */}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminAuditLogsPage />
                  </ProtectedRoute>
                }
              />

              {/* User Settings */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
