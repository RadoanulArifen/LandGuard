import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, MapPin, Search, X } from 'lucide-react'
import { api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Empty, ErrorBox, Pager, Spinner, StatusBadge } from '../components/ui'
import { useLanguage } from '../i18n'
import { banglaDisplay } from '../utils/banglaText'

const EMPTY = { district: '', upazila: '', mouza: '', khatian: '', dag: '', parcel_id: '' }

export default function Investigate() {
  const { language } = useLanguage()
  const bn = language === 'bn'
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const [f, setF] = useState({ ...EMPTY, parcel_id: sp.get('parcel_id') || '' })
  const [query, setQuery] = useState(sp.get('parcel_id') ? { parcel_id: sp.get('parcel_id') } : null)
  const [category, setCategory] = useState('')
  const [offset, setOffset] = useState(0)
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value, ...(k === 'district' ? { upazila: '', mouza: '' } : {}), ...(k === 'upazila' ? { mouza: '' } : {}) }))
  const loc = useApi(() => api.locations({ district: f.district, upazila: f.upazila }), [f.district, f.upazila])
  const res = useApi(() => (query ? api.parcels({ ...query, integrity_status: category, limit: 12, offset }) : Promise.resolve(null)), [query, category, offset])
  useEffect(() => { setOffset(0) }, [query, category])

  const submit = (e) => {
    e.preventDefault()
    const q = Object.fromEntries(Object.entries(f).filter(([, v]) => v.trim() !== ''))
    if (q.parcel_id && /^P-\d{6}$/i.test(q.parcel_id.trim()) && Object.keys(q).length === 1) return nav(`/parcel/${q.parcel_id.trim().toUpperCase()}/overview`)
    setQuery(q)
  }
  const L = loc.data || {}
  const labels = bn
    ? { title: 'জমি খুঁজুন', subtitle: 'জেলা, উপজেলা, মৌজা অথবা জমির নম্বর দিয়ে খুঁজুন।', district: 'জেলা', upazila: 'উপজেলা', mouza: 'মৌজা', khatian: 'খতিয়ান নম্বর', dag: 'দাগ নম্বর', parcel: 'জমির আইডি (ঐচ্ছিক)', select: 'বেছে নিন', search: 'জমি খুঁজুন', clear: 'সব তথ্য মুছুন', results: 'খোঁজের ফলাফল', emptyTitle: 'খোঁজ শুরু করুন', emptyHint: 'জেলা বেছে নিন অথবা জমির আইডি লিখুন। গুরুতর অসংগতি থাকা জমি আগে দেখানো হবে।', noResults: 'কোনো জমি মেলেনি', noResultsHint: 'ফিল্টার কমিয়ে আবার চেষ্টা করুন, অথবা খতিয়ান ও দাগ নম্বর যাচাই করুন।', location: 'অবস্থান', landNumbers: 'খতিয়ান ও দাগ', area: 'জমির পরিমাণ', owner: 'বর্তমান মালিক', inspect: 'বিস্তারিত দেখুন', category: 'ক্যাটাগরি', allCategories: 'সব ক্যাটাগরি', highConcern: 'উচ্চ উদ্বেগ', reviewRequired: 'পর্যালোচনা প্রয়োজন', consistent: 'সামঞ্জস্যপূর্ণ', noTransactions: 'কোনো লেনদেন নেই', examples: ['যেমন K-46760', 'যেমন D-36650', 'যেমন P-014133'] }
    : { title: 'Search a parcel', subtitle: 'Search by district, upazila, mouza, or parcel number.', district: 'District', upazila: 'Upazila', mouza: 'Mouza', khatian: 'Khatian number', dag: 'Dag number', parcel: 'Parcel ID (optional)', select: 'Choose', search: 'Search parcels', clear: 'Clear all fields', results: 'Search results', emptyTitle: 'Start your search', emptyHint: 'Choose a district or enter a parcel ID. Parcels with serious inconsistencies appear first.', noResults: 'No parcels found', noResultsHint: 'Try fewer filters or check the Khatian and Dag numbers.', location: 'Location', landNumbers: 'Khatian and Dag', area: 'Area', owner: 'Current owner', inspect: 'View details', category: 'Category', allCategories: 'All categories', highConcern: 'High concern', reviewRequired: 'Review required', consistent: 'Consistent', noTransactions: 'No transactions', examples: ['e.g. K-46760', 'e.g. D-36650', 'e.g. P-014133'] }
  const field = (k, label, placeholder, options, disabled) => (
    <label className="block min-w-0" key={k}>
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      {options
        ? <select className="input h-11" value={f[k]} onChange={set(k)} disabled={disabled}><option value="">{labels.select} {label.toLocaleLowerCase()}</option>{(options || []).map((o) => <option key={o} value={o}>{bn ? banglaDisplay(o) : o}</option>)}</select>
        : <input className="input h-11" value={f[k]} onChange={set(k)} placeholder={placeholder} autoComplete="off" />}
    </label>)

  return (
    <div className="mx-auto max-w-6xl">
      <form onSubmit={submit} className="card mx-auto max-w-4xl overflow-hidden">
        <div className="border-b border-brand-100 bg-gradient-to-r from-brand-50 to-white px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700"><MapPin className="h-5 w-5" /></span>
            <div className="min-w-0"><h1 className="break-words text-xl font-bold text-slate-900 sm:text-2xl">{labels.title}</h1><p className="mt-1 text-sm leading-6 text-slate-600">{labels.subtitle}</p></div>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {field('district', labels.district, '', L.districts)}{field('upazila', labels.upazila, '', L.upazilas, !f.district)}
            {field('mouza', labels.mouza, '', L.mouzas, !f.upazila)}{field('khatian', labels.khatian, labels.examples[0])}
            {field('dag', labels.dag, labels.examples[1])}{field('parcel_id', labels.parcel, labels.examples[2])}
          </div>
          <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" className="btn-outline w-full sm:w-auto" onClick={() => { setF(EMPTY); setQuery(null); setOffset(0) }}><X className="h-4 w-4" />{labels.clear}</button>
            <button className="btn-primary w-full py-2.5 sm:w-auto sm:px-6" type="submit"><Search className="h-4 w-4" />{labels.search}<ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      </form>

      <div className="mx-auto mt-6 max-w-5xl">
        {res.data && res.data.items.length > 0 && <h2 className="mb-3 text-lg font-bold text-slate-900">{labels.results}</h2>}
        {res.loading && <Spinner label="Searching…" />}
        {res.error && <ErrorBox error={res.error} onRetry={res.reload} />}
        {!res.loading && !res.error && !query && <Empty title={labels.emptyTitle} hint={labels.emptyHint} />}
        {res.data && res.data.items.length === 0 && <Empty title={labels.noResults} hint={labels.noResultsHint} />}
        {res.data && res.data.items.length > 0 && (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
              <span>{res.data.total.toLocaleString(bn ? 'bn-BD' : 'en-US')} {bn ? 'টি জমি পাওয়া গেছে' : 'parcels found'}</span>
              <label className="flex items-center gap-2 font-semibold text-slate-700">{labels.category}
                <select className="input h-10 min-w-40 !py-1.5" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">{labels.allCategories}</option>
                  <option value="High Concern">{labels.highConcern}</option>
                  <option value="Review Required">{labels.reviewRequired}</option>
                  <option value="Consistent">{labels.consistent}</option>
                  <option value="No transactions">{labels.noTransactions}</option>
                </select>
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {res.data.items.map((p) => (
                <article key={p.parcel_id} className="card min-w-0 p-4 transition-shadow hover:shadow-md sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{bn ? 'জমির আইডি' : 'Parcel ID'}</p><h3 className="mt-0.5 break-all text-lg font-bold text-slate-900">{p.parcel_id}</h3></div>
                    <StatusBadge status={p.integrity_status} />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-slate-100 pt-3 text-sm">
                    <div className="min-w-0"><dt className="text-xs text-slate-500">{labels.location}</dt><dd className="mt-0.5 break-words font-medium text-slate-800">{bn ? banglaDisplay(`${p.mouza}, ${p.upazila}, ${p.district}`) : `${p.mouza}, ${p.upazila}, ${p.district}`}</dd></div>
                    <div><dt className="text-xs text-slate-500">{labels.landNumbers}</dt><dd className="mt-0.5 break-words font-medium text-slate-800">{p.khatian_no} / {p.dag_no}</dd></div>
                    <div><dt className="text-xs text-slate-500">{labels.area}</dt><dd className="mt-0.5 font-medium text-slate-800">{bn ? banglaDisplay(p.total_area_decimal) : p.total_area_decimal} {bn ? 'শতক' : 'decimal'}</dd></div>
                    <div className="min-w-0"><dt className="text-xs text-slate-500">{labels.owner}</dt><dd className="mt-0.5 break-words font-medium text-slate-800">{bn ? banglaDisplay(p.current_owner_name) : p.current_owner_name}</dd></div>
                  </dl>
                  <Link className="btn-primary mt-4 w-full sm:w-auto" to={`/parcel/${p.parcel_id}/overview`}>{labels.inspect}<ArrowRight className="h-4 w-4" /></Link>
                </article>))}
            </div>
            <div className="mt-2"><Pager total={res.data.total} limit={12} offset={offset} onChange={setOffset} /></div>
          </div>)}
      </div>
    </div>
  )
}
