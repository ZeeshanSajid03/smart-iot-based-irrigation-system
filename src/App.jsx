import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// User Pages
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import WeatherPage from './pages/WeatherPage';
import FieldsPage from './pages/FieldsPage';
import HistoryPage from './pages/HistoryPage';
import ForgotPassword from './pages/ForgotPassword';
import DashboardPage from './pages/DashboardPage';
import VerifyEmail from './Components/VerifyEmail';
import SettingsPage from './pages/SettingsPage';
import SensorsPage from './pages/SensorsPage';
import TeamPage from './pages/TeamPage';

// Admin Pages
import AdminUsersPage from './pages/AdminUsersPage'; 
import AdminHistoryPage from './pages/AdminHistoryPage'; 
import AdminNotificationsPage from './pages/AdminNotificationsPage'; // 👈 IMPORT ADDED HERE
import AdminProfilePage from './pages/AdminProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout'; 


// ==========================================
//             ROUTE GUARDS
// ==========================================

// 1. Protects regular user routes (Must be logged in)
const UserGuard = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
      return <Navigate to="/login" replace />; // Not logged in? Go to login.
  }
  return <Outlet />; // Logged in? Proceed to the requested page.
};

// 2. Protects Admin routes (Must be logged in AND have 'admin' role)
const AdminGuard = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
      return <Navigate to="/login" replace />; // Not logged in? Go to login.
  }
  if (user.role !== 'admin') {
      return <Navigate to="/dashboard" replace />; // Not an admin? Kick them to user dashboard.
  }
  return <Outlet />; // Is an admin? Proceed to the admin page.
};

// ==========================================

function App() {
  return (
    <Router>
      <Routes>
        {/* --- PUBLIC ROUTES --- */}
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/" element={<Navigate to="/login" />} />

        {/* --- USER DASHBOARD ROUTES --- */}
        <Route element={<UserGuard />}> 
            <Route element={<DashboardLayout />}>
               <Route path="/dashboard" element={<DashboardPage />} />
               <Route path="/profile" element={<ProfilePage />} />
               <Route path="/weather" element={<WeatherPage />} />
               <Route path="/sensors" element={<SensorsPage />} />
               <Route path="/history" element={<HistoryPage />} />
               <Route path="/fields" element={<FieldsPage />} />
               <Route path="/settings" element={<SettingsPage />} />
            </Route>
        </Route>

        {/* --- ADMIN ROUTES (PROTECTED) --- */}
        <Route element={<AdminGuard />}> 
            <Route element={<AdminLayout />}>
                {/* Redirect /admin to /admin/users for now */}
                <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
                
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/history" element={<AdminHistoryPage />} />

                {/* 👇 ADMIN NOTIFICATIONS ROUTE UPDATED HERE 👇 */}
                <Route path="/admin/notifications" element={<AdminNotificationsPage />} />

                {/* Admin Placeholders to prevent errors on clicking other tabs */}
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/profile" element={<AdminProfilePage />} />
            </Route>
        </Route>

      </Routes>
    </Router>
  );
}

export default App;