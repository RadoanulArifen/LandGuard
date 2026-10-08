import { useState } from 'react'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { Download, RefreshCw } from 'lucide-react'
import { api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { ErrorBox, Spinner } from '../components/ui'
import { SIGNAL_SUBTITLE } from '../utils/format'

const TABS = [['', 'Evidence'], ['comparison', 'Registration vs Mutation'], ['ai', 'AI Analysis']]
const PILL = { Critical: 'bg-red-100 text-red-700 border-red-300', High: 'bg-red-50 text-red-600 border-red-200', Medium: 'bg-amber-50 text-amber-600 border-amber-200', Low: 'bg-yellow-50 text-yellow-600 border-yellow-200' }

export default function AlertDetailLayout() {
  const { tid } = useParams()
  const { data, loading, error, reload } = useApi(() => api.alert(tid), [tid])
  const [live, setLive] = useState(null)
  const [busy, setBusy] = useState(false)
  const [liveErr, setLiveErr] = useState(null)
  const rerun = async () => { setBusy(true); setLiveErr(null); try { setLive(await api.investigate(tid)) } catch (e) { setLiveErr(e.message) } finally { setBusy(false) } }
  if (loading) return <Spinner label="Loading investigation…" />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  const d = live || data
  const title = d.primary_signal ? d.primary_label : 'No integrity signal'
  return (
    <div>
      <div className="mb-3 text-xs text-slate-500"><Link to="/alerts" className="hover:underline">Alerts</Link> › {title} › {tid}</div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-lg font-bold text-white">!</span>
          <div>
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold text-slate-900">{title}</h1><span className={`rounded border px-2 py-0.5 text-xs font-bold ${PILL[d.priority_level]}`}>{d.priority_level}</span></div>
            <p className="text-sm text-slate-500">{SIGNAL_SUBTITLE[d.primary_signal] || d.problem}</p>
            <p className="mt-0.5 text-xs text-slate-400">Transaction {tid} · Parcel <Link className="text-brand-700 underline" to={`/parcel/${d.parcel_id}/overview`}>{d.parcel_id}</Link> · Priority {d.priority_score.toFixed(0)} / 100</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={rerun} disabled={busy}><RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />{busy ? 'Investigating…' : 'Re-run investigation'}</button>
          <a className="btn-primary" href={api.reportUrl(tid)}><Download className="h-4 w-4" />Report PDF</a>
        </div>
      </div>
      {liveErr && <div className="mb-3"><ErrorBox error={liveErr} /></div>}
      {live && <div className="mb-3 rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-800">Investigation re-run on the stored records just now. The rule engine ran again; the ML score is the stored out-of-fold score.</div>}
      <div className="mb-5 inline-flex overflow-hidden rounded-lg border border-slate-300 bg-white">
        {TABS.map(([to, label], i) => (
          <NavLink key={label} to={to} end className={({ isActive }) => `px-4 py-2 text-sm font-semibold ${i > 0 ? 'border-l border-slate-300' : ''} ${isActive ? 'bg-brand-50 text-brand-700 shadow-[inset_0_-2px_0_0_#16a34a]' : 'text-slate-600 hover:bg-slate-50'}`}>{label}</NavLink>))}
      </div>
      <Outlet context={{ d }} />
    </div>
  )
}
