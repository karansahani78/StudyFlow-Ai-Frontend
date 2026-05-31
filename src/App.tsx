import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Suspense, lazy } from 'react'

const Spinner = () => (
  <div className="fixed inset-0 bg-gray-950 flex items-center justify-center">
    <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary-500/30 border-t-primary-500" />
  </div>
)

const L = (path: string) => lazy(() => import(path))
const LandingPage       = L('./pages/LandingPage')
const LoginPage         = L('./pages/LoginPage')
const RegisterPage      = L('./pages/RegisterPage')
const ForgotPasswordPage= L('./pages/ForgotPasswordPage')
const ResetPasswordPage = L('./pages/ResetPasswordPage')
const DashboardLayout   = L('./components/layout/DashboardLayout')
const DashboardHome     = L('./pages/DashboardHome')
const LeadsPage         = L('./pages/LeadsPage')
const LeadDetailPage    = L('./pages/LeadDetailPage')
const KanbanPage        = L('./pages/KanbanPage')
const InboxPage         = L('./pages/InboxPage')
const AppointmentsPage  = L('./pages/AppointmentsPage')
const DocumentsPage     = L('./pages/DocumentsPage')
const AnalyticsPage     = L('./pages/AnalyticsPage')
const FollowUpsPage     = L('./pages/FollowUpsPage')
const InvoicesPage      = L('./pages/InvoicesPage')
const KnowledgeBasePage = L('./pages/KnowledgeBasePage')
const TeamPage          = L('./pages/TeamPage')
const SettingsPage      = L('./pages/SettingsPage')

function Guard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}
function PublicOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
        <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
        <Route path="/reset-password" element={<PublicOnly><ResetPasswordPage /></PublicOnly>} />
        <Route path="/dashboard" element={<Guard><DashboardLayout /></Guard>}>
          <Route index element={<DashboardHome />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="leads/:id" element={<LeadDetailPage />} />
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="followups" element={<FollowUpsPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
