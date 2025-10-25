import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import LandingPage from './pages/main/LandingPage'

//Auth
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import EmailVerification from './pages/auth/EmailVerification'
import GoogleCallback from './pages/auth/GoogleCallback'
import Profile from './pages/profile/Profile'
import EmailChangeVerification from './pages/profile/EmailChangeVerification'

//main app
import Dashboard from './pages/main/Dashboard'
import ShowTransactions from './pages/main/ShowTransactions'
import ShowNetWorthDetails from './pages/main/ShowNetWorthDetails'
import ShowWishlist from './pages/main/ShowWishlist'
import ShowScheduledTransactions from './pages/main/ShowScheduledTransactions'
import ShowTargetHistory from './pages/main/ShowTargetHistory'
import Reports from './pages/main/Reports'
import Version from './components/common/Version'

// PWA Components
import InstallPrompt from './components/pwa/InstallPrompt';
import OfflineIndicator from './components/pwa/OfflineIndicator';
import UpdatePrompt from './components/pwa/UpdatePrompt';
import InstallButton from './components/pwa/InstallButton';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors">
          {/* Global PWA Components */}
          <InstallPrompt />
          <OfflineIndicator />
          <UpdatePrompt />
          
          <Routes>
            <Route 
              path="/" 
              element={
                <div>
                  <LandingPage />
                  <InstallButton className="fixed bottom-4 right-4 z-50" />
                </div>
              } 
            />
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            <Route 
              path="/forgot-password" 
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              } 
            />
            <Route 
              path="/reset-password" 
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              } 
            />
            <Route path="/verify-email/:uid/:token" element={<EmailVerification />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/verify-email-change/:uid/:token/:new_email" 
              element={<EmailChangeVerification />} 
            />
            <Route 
              path="/show_trans"
              element={
                <ProtectedRoute>
                  <ShowTransactions />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/show_networth_details"
              element={
                <ProtectedRoute>
                  <ShowNetWorthDetails />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/wishlist" 
              element={
                <ProtectedRoute>
                  <ShowWishlist />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/show_scheduled_trans"
              element={
                <ProtectedRoute>
                  <ShowScheduledTransactions />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/show-target-history"
              element={
                <ProtectedRoute>
                  <ShowTargetHistory />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/version-history" 
              element={<Version />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
