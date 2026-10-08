import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Download, FileText } from 'lucide-react'
import { api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Card, Empty, ErrorBox, LevelBadge, PageHeader, Spinner, StatusBadge } from '../components/ui'
import { dec } from '../utils/format'

function Preview({ tid }) {
  const { data: d, loading, error, reload } = useApi(() => api.alert(tid), [tid])
  if (loading) return <Spinner label="Preparing report preview…" />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  const p = d.parcel
  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-2xl font-extrabold text-slate-900">LandGuard Investigation Report</h2><p className="text-xs text-slate-500">Transaction {tid} · decision-support only</p></div>
        <a className="btn-primary" href={api.reportUrl(tid)}><Download className="h-4 w-4" />Download PDF</a>
      </div>
      <div className="mt-4 grid gap-5 md:grid-cols-[1fr_1fr_1fr]">
        <dl className="space-y-1 text-sm">
          <div>Parcel ID: <b>{p.parcel_id}</b></div><div>Location: <b>{p.upazila}, {p.district} (Mouza {p.mouza}, Khatian {p.khatian_no}, Dag {p.dag_no})</b></div>
          <div>Total area: <b>{dec(p.total_area_decimal)} decimal</b></div><div>Current owner: <b>{p.current_owner_name}</b></div>
          <div className="pt-1">Integrity status: <StatusBadge status={p.integrity_status} /></div>
        </dl>
        <div><div className="mb-1 text-xs font-bold uppercase text-slate-500">Detected issues</div>
          <ol className="list-inside list-decimal space-y-0.5 text-sm">{d.issues.length ? d.issues.map((i) => <li key={i}>{i}</li>) : <li>None</li>}</ol></div>
        <div><div className="mb-1 text-xs font-bold uppercase text-slate-500">AI investigation priority</div>
          <div className="flex items-center gap-2"><LevelBadge level={d.priority_level} /><b>{d.priority_level} ({d.priority_score.toFixed(0)})</b></div>
          <div className="mt-3 mb-1 text-xs font-bold uppercase text-slate-500">Recommendation</div><div className="rounded border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-bold text-red-700">Human Review Required</div></div>
      </div>
      <div className="mt-5 border-t border-slate-100 pt-4"><div className="mb-1 text-xs font-bold uppercase text-slate-500">Evidence summary</div>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">{d.evidence.map((e, i) => <li key={i}>{e.message}</li>)}</ul></div>
      <p className="mt-4 text-xs text-slate-500">The PDF also contains ownership history, transaction timeline, registration vs mutation comparison and the AI explanation.</p>
    </div>
  )
}

export default function Reports() {
  const [sp, setSp] = useSearchParams()
  const [text, setText] = useState('')
  const tid = sp.get('tx')
  const list = useApi(() => api.alerts({ limit: 12, q: text.trim() }), [text])
  return (
    <div>
      <PageHeader title="Investigation Reports" subtitle="Pick a transaction to preview and download its investigation report (PDF)." />
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <Card title="Highest-priority transactions">
          <input className="input mb-3" placeholder="Search parcel / transaction ID" value={text} onChange={(e) => setText(e.target.value)} />
          {list.loading && <Spinner />}{list.error && <ErrorBox error={list.error} onRetry={list.reload} />}
          {list.data && list.data.items.length === 0 && <p className="text-sm text-slate-500">No matching transactions.</p>}
          <ul className="space-y-1.5">{list.data?.items.map((a) => (
            <li key={a.transaction_id}><button onClick={() => setSp({ tx: a.transaction_id })} className={`w-full rounded-lg border p-2.5 text-left text-sm ${tid === a.transaction_id ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'}`}>
              <div className="flex items-center justify-between"><b>{a.parcel_id}</b><LevelBadge level={a.priority_level} /></div><div className="text-xs text-slate-500">{a.transaction_id} · {a.primary_label} · {a.priority_score.toFixed(0)}/100</div></button></li>))}</ul>
        </Card>
        {tid ? <Preview tid={tid} /> : <Empty title="No transaction selected" hint="Choose one from the list to preview its report." />}
      </div>
    </div>
  )
}
