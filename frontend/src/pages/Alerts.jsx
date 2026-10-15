import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Empty, ErrorBox, PageHeader, Pager, Spinner } from '../components/ui'
import { SIGNAL_OPTIONS, dateFmt } from '../utils/format'
import { useLanguage } from '../i18n'
import { banglaDisplay, displayDate, evidenceMessage, evidenceTitle } from '../utils/banglaText'

const PILL = { Critical: 'bg-red-100 text-red-700 border-red-300', High: 'bg-red-50 text-red-600 border-red-200', Medium: 'bg-amber-50 text-amber-600 border-amber-200', Low: 'bg-yellow-50 text-yellow-600 border-yellow-200' }
const BORDER = { Critical: 'border-l-red-600', High: 'border-l-red-400', Medium: 'border-l-amber-400', Low: 'border-l-yellow-400' }

function FilterDropdown({ value, options, placeholder, onChange }) {
  const ref = useRef(null)
  const selected = options.find(([optionValue]) => optionValue === value)?.[1] || placeholder
  return (
    <details ref={ref} className="group relative w-full sm:w-auto sm:min-w-40">
      <summary className="input flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 !py-2 sm:w-auto">
        <span className="truncate">{selected}</span><ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 min-w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
        {options.map(([optionValue, label]) => <button key={optionValue || 'all'} type="button" onClick={() => { onChange(optionValue); if (ref.current) ref.current.open = false }} className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-brand-50 hover:text-brand-800 ${value === optionValue ? 'bg-brand-50 font-semibold text-brand-800' : 'text-slate-700'}`}>
          {label}
        </button>)}
      </div>
    </details>
  )
}

export default function Alerts() {
  const [sp] = useSearchParams()
  const [type, setType] = useState('')
  const [level, setLevel] = useState('')
  const [district, setDistrict] = useState('')
  const [text, setText] = useState(sp.get('parcel_id') || '')
  const [offset, setOffset] = useState(0)
  const { language } = useLanguage()
  const bn = language === 'bn'
  const loc = useApi(() => api.locations(), [])
  const { data, loading, error, reload } = useApi(() => api.alerts({ type, level, district, q: text.trim(), limit: 12, offset }), [type, level, district, text, offset])
  useEffect(() => setOffset(0), [type, level, district, text])
  const counts = data?.level_counts || {}
  const all = Object.values(counts).reduce((a, b) => a + b, 0)
  const parcelOnly = /^P-\d{6}$/i.test(text.trim()) ? text.trim().toUpperCase() : null

  return (
    <div>
      <PageHeader title={parcelOnly ? `${bn ? 'তথ্যগত অসংগতি' : 'Integrity Alerts'} (${parcelOnly})` : (bn ? 'তথ্যগত অসংগতি' : 'Integrity Alerts')} subtitle={bn ? 'তদন্তের অগ্রাধিকার অনুযায়ী সম্ভাব্য অসংগতিগুলো সাজানো হয়েছে। প্রতিটি সতর্কতায় মানুষের পর্যালোচনা প্রয়োজন।' : 'Potential inconsistencies ranked by Investigation Priority. Every alert requires human review.'} />
      <div className="mb-4 flex flex-wrap gap-2">
        {['', 'Critical', 'High', 'Medium', 'Low'].map((l) => (
          <button key={l || 'all'} onClick={() => setLevel(l)} className={`rounded-lg border px-4 py-1.5 text-sm font-semibold ${level === l ? (l ? 'border-slate-800 bg-slate-800 text-white' : 'border-brand-600 bg-brand-600 text-white') : l === '' ? 'border-slate-200 bg-white text-slate-600' : `bg-white ${PILL[l]}`}`}>
            {(bn ? ({ '': 'সব', Critical: 'গুরুতর', High: 'উচ্চ', Medium: 'মাঝারি', Low: 'নিম্ন' }[l]) : (l || 'All'))} {data && `(${l ? counts[l] ?? 0 : level ? '…' : all})`}</button>))}
        <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap">
          <FilterDropdown value={type} placeholder={bn ? 'সব ধরন' : 'All types'} options={ [['', bn ? 'সব ধরন' : 'All types'], ...SIGNAL_OPTIONS.map(([v, label]) => [v, bn ? ({ double_sale: 'একই জমি একাধিকবার হস্তান্তর', over_transfer: 'অতিরিক্ত হস্তান্তর', rapid_transfer: 'দ্রুত হস্তান্তর', ownership_chain_break: 'মালিকানার ধারাবাহিকতা ভঙ্গ', registration_mismatch: 'রেজিস্ট্রেশনের অমিল', mutation_mismatch: 'রেজিস্ট্রেশন ও নামজারির অমিল', temporal_inconsistency: 'তারিখের অসংগতি' }[v]) : label])] } onChange={setType} />
          <FilterDropdown value={district} placeholder={bn ? 'সব জেলা' : 'All districts'} options={ [['', bn ? 'সব জেলা' : 'All districts'], ...(loc.data?.districts || []).map((d) => [d, bn ? banglaDisplay(d) : d])] } onChange={setDistrict} />
          <input className="input w-full sm:!w-48" value={text} onChange={(e) => setText(e.target.value)} placeholder={bn ? 'জমি / লেনদেনের আইডি' : 'Parcel / transaction ID'} />
        </div>
      </div>
      {loading && <Spinner label="Loading alerts…" />}
      {error && <ErrorBox error={error} onRetry={reload} />}
      {data && data.items.length === 0 && <Empty title="No alerts match these filters" hint="Clear a filter to see more." />}
      {data && data.items.length > 0 && (
        <>
          <div className="space-y-3">
            {data.items.map((a) => (
              <div key={a.transaction_id} className={`card flex flex-col gap-3 border-l-4 p-4 sm:flex-row sm:items-start sm:justify-between ${BORDER[a.priority_level]}`}>
                <div className="min-w-0">
                  <span className={`rounded border px-2 py-0.5 text-xs font-bold ${PILL[a.priority_level]}`}>{bn ? ({ Critical: 'গুরুতর', High: 'উচ্চ', Medium: 'মাঝারি', Low: 'নিম্ন' }[a.priority_level]) : a.priority_level}</span>
                  <div className="mt-1.5 font-bold text-slate-900">{bn ? evidenceTitle(a.primary_signal, a.primary_label) : a.primary_label}{a.signal_count > 1 && <span className="ml-2 text-xs font-medium text-slate-400">{bn ? `আরও ${banglaDisplay(a.signal_count - 1)}টি` : `+${a.signal_count - 1} more`}</span>}</div>
                  <p className="text-sm text-slate-500">{bn ? evidenceMessage({ message: a.headline }) : a.headline}</p>
                  <p className="mt-1 break-words text-xs text-slate-400">{bn ? 'জমি' : 'Parcel'} {a.parcel_id} · {a.transaction_id} · {bn ? displayDate(a.date, language) : dateFmt(a.date)} · {bn ? banglaDisplay(a.upazila) : a.upazila}, {bn ? banglaDisplay(a.district) : a.district}</p>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-4 text-left sm:block sm:text-right">
                  <div className="text-2xl font-extrabold text-slate-900">{a.priority_score.toFixed(0)}<span className="text-xs font-medium text-slate-400">/100</span></div>
                  <Link className="text-sm font-semibold text-sky-600 hover:underline" to={`/alerts/${a.transaction_id}`}>{bn ? 'বিস্তারিত দেখুন →' : 'View Details →'}</Link>
                </div>
              </div>))}
          </div>
          <Pager total={data.total} limit={12} offset={offset} onChange={setOffset} />
        </>)}
    </div>
  )
}
