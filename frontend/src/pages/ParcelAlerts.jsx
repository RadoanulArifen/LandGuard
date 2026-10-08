import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Empty, ErrorBox, Spinner } from '../components/ui'

const PILL = { High: 'bg-red-50 text-red-600 border-red-200', Medium: 'bg-amber-50 text-amber-600 border-amber-200', Low: 'bg-yellow-50 text-yellow-600 border-yellow-200' }
const BORDER = { High: 'border-red-300', Medium: 'border-amber-300', Low: 'border-yellow-300' }

export default function ParcelAlerts() {
  const { parcelId } = useParams()
  const { data, loading, error, reload } = useApi(() => api.parcelAlerts(parcelId), [parcelId])
  const [tab, setTab] = useState('All')
  if (loading) return <Spinner />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  const items = data.alerts.flatMap((a) => a.evidence.map((e) => ({ ...e, transaction_id: a.transaction_id })))
  const order = { High: 0, Medium: 1, Low: 2 }
  items.sort((a, b) => order[a.severity] - order[b.severity])
  if (!items.length) return <Empty title="No integrity signals on this parcel" hint="All linked records on this parcel look consistent." />
  const count = (s) => items.filter((i) => i.severity === s).length
  const shown = tab === 'All' ? items : items.filter((i) => i.severity === tab)
  return (
    <div className="max-w-3xl">
      <h2 className="mb-3 text-xl font-bold">Integrity Alerts ({parcelId})</h2>
      <div className="mb-4 flex gap-2">
        {['All', 'High', 'Medium', 'Low'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-lg border px-4 py-1.5 text-sm font-semibold ${tab === t ? (t === 'All' ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-800 bg-slate-800 text-white') : t === 'High' ? 'border-red-200 bg-white text-red-600' : t === 'Medium' ? 'border-amber-200 bg-white text-amber-600' : t === 'Low' ? 'border-yellow-200 bg-white text-yellow-600' : 'border-slate-200 bg-white text-slate-600'}`}>
            {t} ({t === 'All' ? items.length : count(t)})</button>))}
      </div>
      <div className="space-y-3">
        {shown.map((e, i) => (
          <div key={i} className={`card flex items-start justify-between gap-4 border-l-4 p-4 ${BORDER[e.severity]}`}>
            <div className="min-w-0"><span className={`rounded border px-2 py-0.5 text-xs font-bold ${PILL[e.severity]}`}>{e.severity}</span>
              <div className="mt-1.5 font-bold text-slate-900">{e.title}</div><p className="text-sm text-slate-500">{e.message}</p><p className="mt-0.5 text-xs text-slate-400">{e.transaction_id}</p></div>
            <Link to={`/alerts/${e.transaction_id}`} className="shrink-0 pt-1 text-sm font-semibold text-sky-600 hover:underline">View Details →</Link>
          </div>))}
      </div>
    </div>
  )
}
