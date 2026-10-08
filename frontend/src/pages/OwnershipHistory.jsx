import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Empty, ErrorBox, LevelBadge, Spinner } from '../components/ui'
import { dateFmt, dec } from '../utils/format'

export default function OwnershipHistory() {
  const { parcelId } = useParams()
  const { data, loading, error, reload } = useApi(() => api.history(parcelId), [parcelId])
  const [open, setOpen] = useState(null)
  if (loading) return <Spinner />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  if (!data.events.length) return <Empty title="No ownership history" />
  return (
    <div className="card max-w-3xl p-6">
      <ol className="relative">
        <span className="absolute bottom-2 left-[88px] top-2 w-px bg-slate-300" />
        {data.events.map((e, i) => {
          const bad = e.priority_level === 'High' || e.priority_level === 'Critical'
          const isOpen = open === i
          return (
            <li key={i} className="relative flex gap-4 pb-7 last:pb-0">
              <div className="w-16 shrink-0 pt-0.5 text-right text-lg font-extrabold text-slate-800">{e.year}</div>
              <span className={`relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full ring-4 ring-white ${bad ? 'bg-red-500' : 'bg-sky-500'}`} />
              <button onClick={() => setOpen(isOpen ? null : i)} className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap items-center gap-2"><span className="text-lg font-bold text-slate-900">{e.owner_name}</span>{e.priority_level && e.signal_count > 0 && <LevelBadge level={e.priority_level} />}</div>
                <div className="text-sm text-slate-500">{e.kind === 'original' ? 'Original Owner' : `Transfer from ${e.from_name}`}</div>
                <div className="text-sm text-slate-500">Area: {dec(e.area)} Decimal</div>
                {e.transaction_id && <div className="text-sm text-slate-500">Transaction ID: {e.transaction_id}</div>}
                {isOpen && e.kind === 'transfer' && (
                  <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                    <div>Date: <b>{dateFmt(e.date)}</b> · Type: <b>{e.transaction_type}</b> · Status: <b>{e.transaction_status}</b></div>
                    <div>Share transferred: <b>{dec(e.share)}%</b> · Registration: <b>{e.registration_status}</b> · Mutation: <b>{e.mutation_status}</b></div>
                    {e.issues.length > 0 && <div className="text-red-700">Signals: {e.issues.join(', ')}</div>}
                    <Link className="mt-1 inline-block font-semibold text-brand-700 hover:underline" to={`/alerts/${e.transaction_id}`}>Open investigation →</Link>
                  </div>)}
                {isOpen && e.kind === 'original' && <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">First recorded owner on this parcel ({dateFmt(e.date)}), holding {dec(e.share)}%.</div>}
              </button>
            </li>)
        })}
      </ol>
    </div>
  )
}
