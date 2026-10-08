import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Empty, ErrorBox, Pager, Spinner, StatusBadge } from '../components/ui'

const EMPTY = { district: '', upazila: '', mouza: '', khatian: '', dag: '', parcel_id: '' }

export default function Investigate() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const [f, setF] = useState({ ...EMPTY, parcel_id: sp.get('parcel_id') || '' })
  const [query, setQuery] = useState(sp.get('parcel_id') ? { parcel_id: sp.get('parcel_id') } : null)
  const [offset, setOffset] = useState(0)
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value, ...(k === 'district' ? { upazila: '', mouza: '' } : {}), ...(k === 'upazila' ? { mouza: '' } : {}) }))
  const loc = useApi(() => api.locations({ district: f.district, upazila: f.upazila }), [f.district, f.upazila])
  const res = useApi(() => (query ? api.parcels({ ...query, limit: 12, offset }) : Promise.resolve(null)), [query, offset])
  useEffect(() => { setOffset(0) }, [query])
  useEffect(() => { if (res.data && res.data.total === 1 && query && Object.keys(query).length > 0) nav(`/parcel/${res.data.items[0].parcel_id}/overview`) }, [res.data])  // eslint-disable-line

  const submit = (e) => {
    e.preventDefault()
    const q = Object.fromEntries(Object.entries(f).filter(([, v]) => v.trim() !== ''))
    if (q.parcel_id && /^P-\d{6}$/i.test(q.parcel_id.trim()) && Object.keys(q).length === 1) return nav(`/parcel/${q.parcel_id.trim().toUpperCase()}/overview`)
    setQuery(q)
  }
  const L = loc.data || {}
  const sel = (k, label, options, disabled) => (
    <div><label className="mb-1 block text-sm font-semibold text-slate-700">{label}</label>
      <select className="input" value={f[k]} onChange={set(k)} disabled={disabled}><option value="">Select {label}</option>{(options || []).map((o) => <option key={o}>{o}</option>)}</select></div>)
  const txt = (k, label, ph) => (<div><label className="mb-1 block text-sm font-semibold text-slate-700">{label}</label><input className="input" value={f[k]} onChange={set(k)} placeholder={ph} /></div>)

  return (
    <div>
      <form onSubmit={submit} className="card mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-bold text-slate-900">Investigate a Parcel</h1>
        <p className="mb-5 mt-1 text-sm text-slate-500">Search by location or parcel information to analyze transaction integrity.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {sel('district', 'District', L.districts)}{sel('upazila', 'Upazila', L.upazilas, !f.district)}
          {sel('mouza', 'Mouza', L.mouzas, !f.upazila)}{txt('khatian', 'Khatian No.', 'e.g. K-46760')}
          {txt('dag', 'Dag No.', 'e.g. D-36650')}{txt('parcel_id', 'Parcel ID (Optional)', 'e.g. P-014133')}
        </div>
        <button className="btn-primary mt-6 w-full py-3 text-base" type="submit">Investigate <ArrowRight className="h-4 w-4" /></button>
      </form>

      <div className="mx-auto mt-8 max-w-5xl">
        {res.loading && <Spinner label="Searching…" />}
        {res.error && <ErrorBox error={res.error} onRetry={res.reload} />}
        {!res.loading && !res.error && !query && <Empty title="Start with a search" hint="Pick a district, or type a parcel ID. Parcels with the most serious findings are listed first." />}
        {res.data && res.data.items.length === 0 && <Empty title="No parcels matched" hint="Try fewer filters or check the Khatian/Dag number." />}
        {res.data && res.data.items.length > 1 && (
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 p-3 text-sm font-semibold text-slate-700">{res.data.total.toLocaleString()} matching parcels — highest priority first</div>
            <div className="overflow-x-auto"><table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-3">Parcel</th><th>Location</th><th>Khatian / Dag</th><th>Area</th><th>Current owner</th><th>Status</th><th /></tr></thead>
              <tbody>{res.data.items.map((p) => (
                <tr key={p.parcel_id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-semibold">{p.parcel_id}</td><td>{p.mouza}, {p.upazila}, {p.district}</td><td>{p.khatian_no} / {p.dag_no}</td>
                  <td>{p.total_area_decimal} dec</td><td>{p.current_owner_name}</td><td><StatusBadge status={p.integrity_status} /></td>
                  <td className="pr-3 text-right"><Link className="btn-primary py-1" to={`/parcel/${p.parcel_id}/overview`}>Investigate</Link></td></tr>))}</tbody></table></div>
            <div className="px-4 pb-3"><Pager total={res.data.total} limit={12} offset={offset} onChange={setOffset} /></div>
          </div>)}
      </div>
    </div>
  )
}
