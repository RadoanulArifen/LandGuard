import { NavLink, Outlet, useParams, useLocation, Link } from 'react-router-dom'
import { api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { ErrorBox, Spinner, StatusBadge } from '../components/ui'

const TABS = [['overview', 'Overview'], ['ownership', 'Ownership History'], ['graph', 'Transaction Graph'], ['timeline', 'Timeline'], ['alerts', 'Alerts']]

export default function ParcelLayout() {
  const { parcelId } = useParams()
  const loc = useLocation()
  const { data, loading, error, reload } = useApi(() => api.parcel(parcelId), [parcelId])
  if (loading) return <Spinner label="Loading parcel…" />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  const tab = TABS.find(([t]) => loc.pathname.endsWith(`/${t}`)) || TABS[0]
  return (
    <div>
      <div className="mb-1 text-xs text-slate-500"><Link to="/investigate" className="hover:underline">Investigate</Link> › {tab[0] === 'overview' ? 'Parcel Overview' : <>Parcel {parcelId} › {tab[1]}</>}</div>
      <div className="mb-4 flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold text-slate-900">Parcel ID: {parcelId}</h1><StatusBadge status={data.integrity_status} /></div>
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map(([to, label]) => (
          <NavLink key={to} to={to} className={({ isActive }) => `whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold ${isActive ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{label}</NavLink>))}
      </div>
      <Outlet context={{ parcel: data }} />
    </div>
  )
}
