import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Empty, ErrorBox, PageHeader, Pager, Spinner } from '../components/ui'
import { SIGNAL_OPTIONS, dateFmt } from '../utils/format'

const PILL = { Critical: 'bg-red-100 text-red-700 border-red-300', High: 'bg-red-50 text-red-600 border-red-200', Medium: 'bg-amber-50 text-amber-600 border-amber-200', Low: 'bg-yellow-50 text-yellow-600 border-yellow-200' }
const BORDER = { Critical: 'border-l-red-600', High: 'border-l-red-400', Medium: 'border-l-amber-400', Low: 'border-l-yellow-400' }

export default function Alerts() {
  const [sp] = useSearchParams()
  const [type, setType] = useState('')
  const [level, setLevel] = useState('')
  const [district, setDistrict] = useState('')
  const [text, setText] = useState(sp.get('parcel_id') || '')
  const [offset, setOffset] = useState(0)
  const loc = useApi(() => api.locations(), [])
  const { data, loading, error, reload } = useApi(() => api.alerts({ type, level, district, q: text.trim(), limit: 12, offset }), [type, level, district, text, offset])
  useEffect(() => setOffset(0), [type, level, district, text])
  const counts = data?.level_counts || {}
  const all = Object.values(counts).reduce((a, b) => a + b, 0)
  const parcelOnly = /^P-\d{6}$/i.test(text.trim()) ? text.trim().toUpperCase() : null

  return (
    <div>
      <PageHeader title={parcelOnly ? `Integrity Alerts (${parcelOnly})` : 'Integrity Alerts'} subtitle="Potential inconsistencies ranked by Investigation Priority. Every alert requires human review." />
      <div className="mb-4 flex flex-wrap gap-2">
        {['', 'Critical', 'High', 'Medium', 'Low'].map((l) => (
          <button key={l || 'all'} onClick={() => setLevel(l)} className={`rounded-lg border px-4 py-1.5 text-sm font-semibold ${level === l ? (l ? 'border-slate-800 bg-slate-800 text-white' : 'border-brand-600 bg-brand-600 text-white') : l === '' ? 'border-slate-200 bg-white text-slate-600' : `bg-white ${PILL[l]}`}`}>
            {l || 'All'} {data && `(${l ? counts[l] ?? 0 : level ? '…' : all})`}</button>))}
        <div className="ml-auto flex flex-wrap gap-2">
          <select className="input !w-auto" value={type} onChange={(e) => setType(e.target.value)}><option value="">All types</option>{SIGNAL_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <select className="input !w-auto" value={district} onChange={(e) => setDistrict(e.target.value)}><option value="">All districts</option>{(loc.data?.districts || []).map((d) => <option key={d}>{d}</option>)}</select>
          <input className="input !w-48" value={text} onChange={(e) => setText(e.target.value)} placeholder="Parcel / transaction ID" />
        </div>
      </div>
      {loading && <Spinner label="Loading alerts…" />}
      {error && <ErrorBox error={error} onRetry={reload} />}
      {data && data.items.length === 0 && <Empty title="No alerts match these filters" hint="Clear a filter to see more." />}
      {data && data.items.length > 0 && (
        <>
          <div className="space-y-3">
            {data.items.map((a) => (
              <div key={a.transaction_id} className={`card flex items-start justify-between gap-4 border-l-4 p-4 ${BORDER[a.priority_level]}`}>
                <div className="min-w-0">
                  <span className={`rounded border px-2 py-0.5 text-xs font-bold ${PILL[a.priority_level]}`}>{a.priority_level}</span>
                  <div className="mt-1.5 font-bold text-slate-900">{a.primary_label}{a.signal_count > 1 && <span className="ml-2 text-xs font-medium text-slate-400">+{a.signal_count - 1} more</span>}</div>
                  <p className="text-sm text-slate-500">{a.headline}</p>
                  <p className="mt-1 text-xs text-slate-400">Parcel {a.parcel_id} · {a.transaction_id} · {dateFmt(a.date)} · {a.upazila}, {a.district}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-2xl font-extrabold text-slate-900">{a.priority_score.toFixed(0)}<span className="text-xs font-medium text-slate-400">/100</span></div>
                  <Link className="text-sm font-semibold text-sky-600 hover:underline" to={`/alerts/${a.transaction_id}`}>View Details →</Link>
                </div>
              </div>))}
          </div>
          <Pager total={data.total} limit={12} offset={offset} onChange={setOffset} />
        </>)}
    </div>
  )
}
