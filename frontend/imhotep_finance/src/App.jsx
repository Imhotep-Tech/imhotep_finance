import { AuthProvider } from './contexts/AuthContext'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import LandingPage from './components/main/LandingPage'

//Auth
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import ForgotPassword from './components/auth/ForgotPassword'
import ResetPassword from './components/auth/ResetPassword'
import EmailVerification from './components/auth/EmailVerification'
import GoogleCallback from './components/auth/GoogleCallback'
import Profile from './components/profile/Profile'
import EmailChangeVerification from './components/profile/EmailChangeVerification'

//main app
import Dashboard from './components/main/Dashboard'
import ShowTransactions from './components/main/ShowTransactions'
import ShowNetWorthDetails from './components/main/ShowNetWorthDetails'
import ShowWishlist from './components/main/ShowWishlist'
import ShowScheduledTransactions from './components/main/ShowScheduledTransactions'
import ShowTargetHistory from './components/main/ShowTargetHistory'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div>
          <Routes>
            <Route 
              path="/" 
              element={<LandingPage />} 
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
