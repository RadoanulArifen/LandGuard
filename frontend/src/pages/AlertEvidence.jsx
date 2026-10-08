import { Link, useOutletContext } from 'react-router-dom'
import { Card } from '../components/ui'
import { dateFmt, dec } from '../utils/format'

const KV = ({ obj }) => (
  <table className="w-full text-sm"><tbody>{Object.entries(obj).filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => (
    <tr key={k} className="border-t border-slate-100 first:border-0"><td className="py-1.5 text-slate-500">{k.replace(/_/g, ' ')}</td><td className="py-1.5 text-right font-semibold">{typeof v === 'number' ? dec(v) : String(v)}</td></tr>))}</tbody></table>)

function EvidenceTable({ t }) {
  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-3 text-left font-semibold">Description</th><th className="p-3 text-right font-semibold">Area ({t.unit})</th></tr></thead>
          <tbody>{t.rows.map((r, i) => (
            <tr key={i} className={`border-t border-slate-100 ${r.kind === 'total' ? 'font-bold' : ''} ${r.kind === 'excess' ? 'bg-red-50 font-bold text-red-600' : ''}`}><td className="p-3">{r.label}</td><td className="p-3 text-right">{dec(r.value)}</td></tr>))}</tbody>
        </table>
      </div>
      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{t.note}</div>
    </div>)
}
const SEV = { High: 'border-red-200 bg-red-50', Medium: 'border-amber-200 bg-amber-50', Low: 'border-emerald-200 bg-emerald-50' }

export default function AlertEvidence() {
  const { d } = useOutletContext()
  const r = d.related
  const withTable = d.evidence.filter((e) => e.table)
  const others = d.evidence.filter((e) => !e.table)
  return (
    <div className="space-y-5">
      <Card title="Evidence Details">
        {d.evidence.length === 0 && <p className="text-sm text-slate-500">No integrity signals were raised for this transaction.</p>}
        <div className="space-y-6">
          {withTable.map((e, i) => (<div key={i}><div className="mb-2 font-bold text-slate-800">{e.title}</div><p className="mb-2 text-sm text-slate-500">{e.message}</p><EvidenceTable t={e.table} /></div>))}
          {others.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {others.map((e, i) => (
                <div key={i} className={`rounded-xl border p-4 ${SEV[e.severity] || SEV.Low}`}>
                  <div className="mb-1 font-bold text-slate-900">{e.title}</div><p className="mb-2 text-sm text-slate-700">{e.message}</p>
                  <div className="rounded-lg bg-white/80 px-3 py-1"><KV obj={e.details} /></div>
                </div>))}
            </div>)}
        </div>
      </Card>
      <Card title="Related records">
        <div className="grid gap-4 md:grid-cols-3">
          <div><div className="mb-1 text-xs font-bold uppercase text-slate-500">Transaction</div><KV obj={{ ID: r.transaction.transaction_id, Date: dateFmt(r.transaction.transaction_date), Type: r.transaction.transaction_type, Status: r.transaction.transaction_status, Seller: r.transaction.seller, Buyer: r.transaction.buyer, 'Area (decimal)': r.transaction.transferred_area_decimal, 'Share before %': r.transaction.seller_share_before, 'Share transferred %': r.transaction.transferred_share }} /></div>
          <div><div className="mb-1 text-xs font-bold uppercase text-slate-500">Registration</div>{r.registration ? <KV obj={{ ID: r.registration.r_id, Date: dateFmt(r.registration.r_date), Area: r.registration.r_area, Type: r.registration.r_type, Status: r.registration.r_status, Deed: r.registration.r_deed, Verification: r.registration.r_verif }} /> : <p className="text-sm font-semibold text-red-600">No registration record linked.</p>}</div>
          <div><div className="mb-1 text-xs font-bold uppercase text-slate-500">Mutation</div>{r.mutation ? <KV obj={{ ID: r.mutation.m_id, Date: dateFmt(r.mutation.m_date), Area: r.mutation.m_area, Type: r.mutation.m_type, Status: r.mutation.m_status, Reference: r.mutation.m_ref, Verification: r.mutation.m_verif }} /> : <p className="text-sm font-semibold text-red-600">No mutation record linked.</p>}</div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-sky-600">
          <Link to={`/parcel/${d.parcel_id}/ownership`}>Ownership history</Link><Link to={`/parcel/${d.parcel_id}/graph`}>Transaction graph</Link><Link to="comparison">Registration vs mutation</Link><Link to="ai">AI analysis</Link>
        </div>
      </Card>
      <div className="card flex flex-wrap items-center gap-3 border-red-200 p-4"><span className="h-3 w-3 rounded-full bg-red-500" /><span className="font-bold text-red-600">Final status: Human Review Required</span>
        <span className="text-sm text-slate-500">— LandGuard has not made any legal determination.</span></div>
    </div>
  )
}
