import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { AlertOctagon, ArrowRight, CheckCircle2, Download, TriangleAlert, X } from 'lucide-react'
import { api } from '../services/api'
import FieldsArt from '../components/FieldsArt'
import { dec } from '../utils/format'

const Row = ({ k, v }) => <div className="flex justify-between gap-4 border-b border-slate-100 px-4 py-2.5 text-sm last:border-0"><dt className="text-slate-500">{k}</dt><dd className="text-right font-semibold text-slate-800">{v ?? '—'}</dd></div>
const POLY = '120,70 300,55 330,190 140,215'

export default function ParcelOverview() {
  const { parcel: p } = useOutletContext()
  const [big, setBig] = useState(false)
  const st = p.integrity_status
  const tone = st === 'High Concern' ? ['border-red-200 bg-red-50', 'text-red-600', AlertOctagon] : st === 'Review Required' ? ['border-amber-200 bg-amber-50', 'text-amber-600', TriangleAlert] : ['border-emerald-200 bg-emerald-50', 'text-emerald-600', CheckCircle2]
  const Icon = tone[2]
  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <dl className="card overflow-hidden">
          <Row k="District" v={p.district} /><Row k="Upazila" v={p.upazila} /><Row k="Mouza" v={p.mouza} /><Row k="Khatian No." v={p.khatian_no} /><Row k="Dag No." v={p.dag_no} />
          <Row k="Total Area" v={`${dec(p.total_area_decimal)} Decimal`} /><Row k="Current Owner" v={p.current_owner_name} />
          <Row k="Recorded Share" v={p.recorded_share === null ? 'Not derivable' : `${dec(p.recorded_area)} Decimal (${dec(p.recorded_share)}%)`} />
          <Row k="Ownership Status" v={p.ownership_status} /><Row k="Registration Status" v={p.registration_status} /><Row k="Mutation Status" v={p.mutation_status} />
        </dl>
        <div className="card relative overflow-hidden" style={{ minHeight: 300 }}>
          <FieldsArt seed={Number(p.parcel_id.slice(2)) % 997} w={440} h={300} polygon={POLY} label={p.dag_no} sub={`${dec(p.total_area_decimal)} Decimal`} className="absolute inset-0" />
          <button onClick={() => setBig(true)} className="absolute bottom-3 right-3 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow">View Larger</button>
          <span className="absolute left-3 top-3 rounded bg-black/40 px-2 py-0.5 text-[10px] text-white">Schematic view — not a survey map</span>
        </div>
      </div>
      <h2 className="mb-2 mt-6 text-sm font-bold text-slate-700">Integrity Status</h2>
      <div className={`card flex items-start gap-4 border p-5 ${tone[0]}`}>
        <Icon className={`h-9 w-9 shrink-0 ${tone[1]}`} />
        <div className="flex-1"><div className={`text-xl font-extrabold ${tone[1]}`}>{st}</div><p className="mt-0.5 text-sm text-slate-600">{p.summary}</p>
          <p className="mt-1 text-xs text-slate-500">{p.alert_count} of {p.transaction_count} transaction(s) have integrity signals.</p></div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link className="btn-primary" to="../ownership">Ownership history <ArrowRight className="h-4 w-4" /></Link>
        <Link className="btn-outline" to="../graph">Transaction graph</Link>
        {p.top_transaction_id && st !== 'Consistent' && <Link className="btn-outline" to={`/alerts/${p.top_transaction_id}`}>Open top alert</Link>}
        {p.top_transaction_id && <a className="btn-outline" href={api.reportUrl(p.top_transaction_id)}><Download className="h-4 w-4" />Report PDF</a>}
      </div>
      {big && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => setBig(false)}>
          <div className="relative h-[80vh] w-full max-w-4xl overflow-hidden rounded-xl" onClick={(e) => e.stopPropagation()}>
            <FieldsArt seed={Number(p.parcel_id.slice(2)) % 997} w={880} h={600} polygon="240,140 600,110 660,380 280,430" label={p.dag_no} sub={`${dec(p.total_area_decimal)} Decimal`} className="absolute inset-0" />
            <button className="absolute right-3 top-3 rounded-full bg-white p-2" onClick={() => setBig(false)} aria-label="Close"><X className="h-4 w-4" /></button>
          </div>
        </div>)}
    </div>
  )
}
