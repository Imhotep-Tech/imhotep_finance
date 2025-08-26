import { AuthProvider } from './contexts/AuthContext'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import ForgotPassword from './components/auth/ForgotPassword'
import ResetPassword from './components/auth/ResetPassword'
import Dashboard from './components/main/Dashboard'
import LandingPage from './components/main/LandingPage'
import EmailVerification from './components/auth/EmailVerification'
import GoogleCallback from './components/auth/GoogleCallback'
import Profile from './components/profile/Profile'
import EmailChangeVerification from './components/profile/EmailChangeVerification'
import PublicPortfolio from './components/main/PublicPortfolio'
import PromptExamples from './components/main/PromptExamples'

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
             path="/prompts"
              element={
                <ProtectedRoute>
                  <PromptExamples />
                </ProtectedRoute>
            }
            />
            <Route 
              path="/verify-email-change/:uid/:token/:new_email" 
              element={<EmailChangeVerification />} 
            />
            <Route path="/u/:username" element={<PublicPortfolio />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
