import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/layout/Navbar';

// Pages
import HomePage        from './pages/HomePage';
import FAQListPage     from './pages/FAQListPage';
import FAQDetailPage   from './pages/FAQDetailPage';
import SubmitFAQPage   from './pages/SubmitFAQPage';
import EditFAQPage     from './pages/EditFAQPage';
import ProfilePage     from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import SavedFAQsPage   from './pages/SavedFAQsPage';
import ActivityFeedPage from './pages/ActivityFeedPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ModQueuePage    from './pages/ModQueuePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage  from './pages/ResetPasswordPage';
import NotFoundPage    from './pages/NotFoundPage';

// ── Protected Route ─────────────────────────────────────────────────
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole === 'admin' && user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  if (requiredRole === 'moderator' && !['moderator', 'admin'].includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// ── App ──────────────────────────────────────────────────────────────
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ThemeProvider>
            <Navbar />
            <Routes>
              <Route path="/"                         element={<HomePage />} />
              <Route path="/faqs"                     element={<FAQListPage />} />
              <Route path="/faqs/submit"              element={<ProtectedRoute><SubmitFAQPage /></ProtectedRoute>} />
              <Route path="/faqs/:id"                 element={<FAQDetailPage />} />
              <Route path="/faqs/:id/edit"            element={<ProtectedRoute><EditFAQPage /></ProtectedRoute>} />
              <Route path="/profile/:id"              element={<ProfilePage />} />
              <Route path="/profile/edit"             element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
              <Route path="/saved"                    element={<ProtectedRoute><SavedFAQsPage /></ProtectedRoute>} />
              <Route path="/feed"                     element={<ProtectedRoute><ActivityFeedPage /></ProtectedRoute>} />
              <Route path="/leaderboard"              element={<LeaderboardPage />} />
              <Route path="/mod"                      element={<ProtectedRoute requiredRole="moderator"><ModQueuePage /></ProtectedRoute>} />
              <Route path="/admin"                    element={<ProtectedRoute requiredRole="admin"><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="/login"                    element={<LoginPage />} />
              <Route path="/register"                 element={<RegisterPage />} />
              <Route path="/forgot-password"          element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token"    element={<ResetPasswordPage />} />
              <Route path="*"                         element={<NotFoundPage />} />
            </Routes>
          </ThemeProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;