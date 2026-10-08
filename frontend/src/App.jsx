import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import ParcelLayout from './layouts/ParcelLayout'
import AlertDetailLayout from './layouts/AlertDetailLayout'
import Home from './pages/Home'
import DemoStart from './pages/DemoStart'
import Dashboard from './pages/Dashboard'
import Investigate from './pages/Investigate'
import ParcelOverview from './pages/ParcelOverview'
import OwnershipHistory from './pages/OwnershipHistory'
import TransactionGraph from './pages/TransactionGraph'
import TransactionTimeline from './pages/TransactionTimeline'
import ParcelAlerts from './pages/ParcelAlerts'
import Alerts from './pages/Alerts'
import AlertEvidence from './pages/AlertEvidence'
import RegistrationMutation from './pages/RegistrationMutation'
import AiAnalysis from './pages/AiAnalysis'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/demo" element={<DemoStart />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/investigate" element={<Investigate />} />
        <Route path="/parcel/:parcelId" element={<ParcelLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<ParcelOverview />} />
          <Route path="ownership" element={<OwnershipHistory />} />
          <Route path="graph" element={<TransactionGraph />} />
          <Route path="timeline" element={<TransactionTimeline />} />
          <Route path="alerts" element={<ParcelAlerts />} />
        </Route>
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/alerts/:tid" element={<AlertDetailLayout />}>
          <Route index element={<AlertEvidence />} />
          <Route path="comparison" element={<RegistrationMutation />} />
          <Route path="ai" element={<AiAnalysis />} />
        </Route>
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
