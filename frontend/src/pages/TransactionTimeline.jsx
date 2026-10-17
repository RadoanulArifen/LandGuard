import { Link, useParams } from 'react-router-dom'
import { api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Empty, ErrorBox, Spinner } from '../components/ui'
import { dateFmt, dec } from '../utils/format'
import { useLanguage } from '../i18n'
import { banglaDisplay, bnTerm, displayDate } from '../utils/banglaText'

const DOT = { Original: 'bg-emerald-500', Transaction: 'bg-sky-500', Registration: 'bg-indigo-500', Mutation: 'bg-slate-800' }

function timelineDetail(event, originalArea, bn) {
  if (!bn) return event.detail
  if (event.kind === 'Original') return `(${banglaDisplay(dec(originalArea))} শতক)`
  if (event.kind === 'Transaction') {
    const m = event.detail.match(/^(.+?), ([\d.]+) decimal \(([^)]+)%\) — (.+)$/)
    if (m) return `${bnTerm(m[1])}, ${banglaDisplay(m[2])} শতক (${banglaDisplay(m[3])}%) — ${bnTerm(m[4])}`
  }
  if (event.kind === 'Registration') {
    const m = event.detail.match(/^Deed (.+?), ([\d.]+) decimal — (.+)$/)
    if (m) return `দলিল ${m[1]}, ${banglaDisplay(m[2])} শতক — ${bnTerm(m[3])}`
  }
  if (event.kind === 'Mutation') {
    const m = event.detail.match(/^(.+?), ([\d.]+) decimal — (.+)$/)
    if (m) return `${m[1]}, ${banglaDisplay(m[2])} শতক — ${bnTerm(m[3])}`
  }
  return banglaDisplay(event.detail)
}

export default function TransactionTimeline() {
  const { parcelId } = useParams()
  const tl = useApi(() => api.timeline(parcelId), [parcelId])
  const hist = useApi(() => api.history(parcelId), [parcelId])
  const { language } = useLanguage()
  const bn = language === 'bn'
  const date = (v) => bn ? displayDate(v, language) : dateFmt(v)
  if (tl.loading || hist.loading) return <Spinner />
  if (tl.error || hist.error) return <ErrorBox error={tl.error || hist.error} onRetry={() => { tl.reload(); hist.reload() }} />
  if (!tl.data.events.length) return <Empty title="No transactions on this parcel" />
  const o = hist.data.events[0]
  const events = [{ date: o.date, kind: 'Original', title: 'Original Ownership', label: o.owner_name, detail: `(${dec(o.area)} Dec)`, conflict: false },
    ...tl.data.events.map((e) => ({ ...e, title: e.kind === 'Transaction' ? 'Transfer' : e.kind }))]
  const conflict = tl.data.status === 'High Concern'
  return (
    <div className="card p-6">
      <div className="overflow-x-auto pb-3">
        <div className="flex min-w-max items-start pt-1">
          <div className="relative flex items-start pt-1">
          <div className="absolute left-4 right-4 top-[46px] h-0.5 bg-slate-300" />
          {events.map((e, i) => (
            <div key={i} className="relative w-52 shrink-0 px-2 text-center">
              <div className="text-lg font-extrabold text-slate-800">{bn ? banglaDisplay(e.date.slice(0, 4)) : e.date.slice(0, 4)}</div>
              <div className="text-[11px] text-slate-400">{date(e.date)}</div>
              <span className={`relative z-10 mx-auto mt-2 block h-3.5 w-3.5 rounded-full ring-4 ring-white ${e.conflict ? 'bg-red-500' : DOT[e.kind]}`} />
              <div className="mt-3 text-sm font-bold text-slate-900">{bn ? bnTerm(e.title) : e.title}</div>
              <div className="text-xs text-slate-600">{bn ? String(e.label || '').split(' → ').map(banglaDisplay).join(' → ') : e.label}</div>
              <div className="text-xs text-slate-500">{timelineDetail(e, o.area, bn)}</div>
              {e.transaction_id && <Link className="text-xs font-semibold text-brand-700 hover:underline" to={`/alerts/${e.transaction_id}`}>{e.transaction_id}</Link>}
              {e.conflict && <div className="mt-1 text-[11px] font-semibold text-red-600">{bn ? 'অসংগতি শনাক্ত হয়েছে' : 'Inconsistency flagged'}</div>}
            </div>))}
          </div>
          {conflict && <div className="ml-3 mt-6 shrink-0 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{bn ? 'বিতর্কিত' : 'Conflict Detected'}</div>}
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">{bn ? 'সম্পূর্ণ ইতিহাস দেখতে আড়াআড়িভাবে সরান। নীল = লেনদেন, বেগুনি = রেজিস্ট্রেশন, কালো = নামজারি, লাল = চিহ্নিত অসংগতি।' : 'Scroll sideways for the full history. Blue = transaction, indigo = registration, black = mutation, red = flagged.'}</p>
    </div>
  )
}
