import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CreateCompany from './pages/CreateCompany'
import CompanyDetail from './pages/CompanyDetail'
import Accounting from './pages/Accounting'
import AML from './pages/AML'
import SuperAdmin from './pages/SuperAdmin'
import Verify from './pages/Verify'
import ChangePassword from './pages/ChangePassword'
import Profile from './pages/Profile'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/entreprises/nouvelle"
        element={
          <ProtectedRoute>
            <CreateCompany />
          </ProtectedRoute>
        }
      />
      <Route
        path="/entreprises/:id"
        element={
          <ProtectedRoute>
            <CompanyDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/comptabilite"
        element={
          <ProtectedRoute>
            <Accounting />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aml"
        element={
          <ProtectedRoute>
            <AML />
          </ProtectedRoute>
        }
      />
      <Route path="/verify/:token" element={<Verify />} />
      <Route
        path="/profil"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/changer-mot-de-passe"
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute>
            <SuperAdmin />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
