import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Empty, ErrorBox, LevelBadge, Spinner } from '../components/ui'
import { dateFmt, dec } from '../utils/format'
import { useLanguage } from '../i18n'
import { banglaDisplay, bnTerm, displayDate } from '../utils/banglaText'

export default function OwnershipHistory() {
  const { parcelId } = useParams()
  const { data, loading, error, reload } = useApi(() => api.history(parcelId), [parcelId])
  const [open, setOpen] = useState(null)
  const { language } = useLanguage()
  const bn = language === 'bn'
  const date = (v) => bn ? displayDate(v, language) : dateFmt(v)
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
              <div className="w-16 shrink-0 pt-0.5 text-right text-lg font-extrabold text-slate-800">{bn ? banglaDisplay(e.year) : e.year}</div>
              <span className={`relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full ring-4 ring-white ${bad ? 'bg-red-500' : 'bg-sky-500'}`} />
              <button onClick={() => setOpen(isOpen ? null : i)} className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap items-center gap-2"><span className="text-lg font-bold text-slate-900">{bn ? banglaDisplay(e.owner_name) : e.owner_name}</span>{e.priority_level && e.signal_count > 0 && <LevelBadge level={e.priority_level} />}</div>
                <div className="text-sm text-slate-500">{e.kind === 'original' ? (bn ? 'প্রাথমিক মালিক' : 'Original Owner') : `${bn ? 'হস্তান্তরকারী: ' : 'Transfer from '}${bn ? banglaDisplay(e.from_name) : e.from_name}`}</div>
                <div className="text-sm text-slate-500">{bn ? 'জমির পরিমাণ' : 'Area'}: {bn ? banglaDisplay(dec(e.area)) : dec(e.area)} {bn ? 'শতক' : 'Decimal'}</div>
                {e.transaction_id && <div className="text-sm text-slate-500">{bn ? 'লেনদেনের আইডি' : 'Transaction ID'}: {e.transaction_id}</div>}
                {isOpen && e.kind === 'transfer' && (
                  <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                    <div>{bn ? 'তারিখ' : 'Date'}: <b>{date(e.date)}</b> · {bn ? 'ধরন' : 'Type'}: <b>{bn ? bnTerm(e.transaction_type) : e.transaction_type}</b> · {bn ? 'অবস্থা' : 'Status'}: <b>{bn ? bnTerm(e.transaction_status) : e.transaction_status}</b></div>
                    <div>{bn ? 'হস্তান্তরিত অংশ' : 'Share transferred'}: <b>{bn ? banglaDisplay(dec(e.share)) : dec(e.share)}%</b> · {bn ? 'রেজিস্ট্রেশন' : 'Registration'}: <b>{bn ? bnTerm(e.registration_status) : e.registration_status}</b> · {bn ? 'নামজারি' : 'Mutation'}: <b>{bn ? bnTerm(e.mutation_status) : e.mutation_status}</b></div>
                    {e.issues.length > 0 && <div className="text-red-700">{bn ? 'সংকেত' : 'Signals'}: {bn ? e.issues.map(bnTerm).join(', ') : e.issues.join(', ')}</div>}
                    <Link className="mt-1 inline-block font-semibold text-brand-700 hover:underline" to={`/alerts/${e.transaction_id}`}>{bn ? 'তদন্ত খুলুন →' : 'Open investigation →'}</Link>
                  </div>)}
                {isOpen && e.kind === 'original' && <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{bn ? `এই জমির প্রথম নথিভুক্ত মালিক (${date(e.date)}); মালিকানার অংশ ${banglaDisplay(dec(e.share))}%` : `First recorded owner on this parcel (${date(e.date)}), holding ${dec(e.share)}%.`}</div>}
              </button>
            </li>)
        })}
      </ol>
    </div>
  )
}
