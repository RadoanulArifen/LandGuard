import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { AlertOctagon, CheckCircle2, Eye, FileText, TriangleAlert, X } from 'lucide-react'
import overviewImage from '../image/overview.jpeg'
import khatianImage from '../image/nothipotro/khotiyan nothi.png'
import deedImage from '../image/nothipotro/dolil.jpeg'
import mutationImage from '../image/nothipotro/namjari nothi.png'
import registrationImage from '../image/nothipotro/registration nothi.jpg'
import { dec } from '../utils/format'
import { useLanguage } from '../i18n'
import { banglaDisplay } from '../utils/banglaText'

const Row = ({ k, v }) => <div className="flex justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-sm last:border-0 sm:px-4"><dt className="shrink-0 text-slate-500">{k}</dt><dd className="min-w-0 break-words text-right font-semibold text-slate-800">{v ?? '—'}</dd></div>
export default function ParcelOverview() {
  const { parcel: p } = useOutletContext()
  const [big, setBig] = useState(false)
  const [documentPreview, setDocumentPreview] = useState(null)
  const { language } = useLanguage()
  const bn = language === 'bn'
  const docs = p.documents || {}
  const dateLabel = bn ? 'তারিখ' : 'Date'
  const noDocument = bn ? 'নথি সংযুক্ত নেই' : 'No document linked'
  const display = (value) => bn ? banglaDisplay(value) : value
  const statusDisplay = (value) => bn ? ({ Active: 'সক্রিয়', Inactive: 'নিষ্ক্রিয়', Registered: 'নিবন্ধিত', Completed: 'সম্পন্ন', Pending: 'অপেক্ষমাণ', 'Under Review': 'পর্যালোচনাধীন', 'Not derivable': 'নির্ধারণযোগ্য নয়' }[value] || banglaDisplay(value)) : value
  const docItems = [
    { key: 'khatian', title: bn ? 'খতিয়ান নথি' : 'Khatian record', image: khatianImage, doc: docs.khatian },
    { key: 'deed', title: bn ? 'দলিল' : 'Deed', image: deedImage, doc: docs.deed },
    { key: 'mutation', title: bn ? 'নামজারি নথি' : 'Mutation record', image: mutationImage, doc: docs.mutation },
    { key: 'registration', title: bn ? 'রেজিস্ট্রেশন নথি' : 'Registration record', image: registrationImage, doc: docs.registration },
  ]
  const dateText = (value) => value ? new Intl.DateTimeFormat(bn ? 'bn-BD' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : '—'
  const st = p.integrity_status
  const statusLabel = bn ? ({ 'High Concern': 'উচ্চ উদ্বেগ', 'Review Required': 'পর্যালোচনা প্রয়োজন', Consistent: 'সামঞ্জস্যপূর্ণ', 'No transactions': 'কোনো লেনদেন নেই' }[st] || st) : st
  const summaryLabel = bn ? ({ 'Multiple inconsistencies detected in linked records. Human review recommended.': 'সংযুক্ত নথিতে একাধিক অসংগতি পাওয়া গেছে। মানুষের পর্যালোচনা প্রয়োজন।', 'Some records need review.': 'কিছু নথি পর্যালোচনা করা প্রয়োজন।', 'No significant inconsistencies detected in the linked records.': 'সংযুক্ত নথিতে উল্লেখযোগ্য কোনো অসংগতি পাওয়া যায়নি।' }[p.summary] || banglaDisplay(p.summary)) : p.summary
  const area = `${display(dec(p.total_area_decimal))} ${bn ? 'শতক' : 'Decimal'}`
  const tone = st === 'High Concern' ? ['border-red-200 bg-red-50', 'text-red-600', AlertOctagon] : st === 'Review Required' ? ['border-amber-200 bg-amber-50', 'text-amber-600', TriangleAlert] : ['border-emerald-200 bg-emerald-50', 'text-emerald-600', CheckCircle2]
  const Icon = tone[2]
  return (
    <div>
      <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
        <dl className="card overflow-hidden">
          <Row k="District" v={display(p.district)} /><Row k="Upazila" v={display(p.upazila)} /><Row k="Mouza" v={display(p.mouza)} /><Row k="Khatian No." v={p.khatian_no} /><Row k="Dag No." v={p.dag_no} />
          <Row k="Total Area" v={area} /><Row k="Current Owner" v={display(p.current_owner_name)} />
          <Row k="Recorded Share" v={p.recorded_share === null ? statusDisplay('Not derivable') : `${display(dec(p.recorded_area))} ${bn ? 'শতক' : 'Decimal'} (${display(dec(p.recorded_share))}%)`} />
          <Row k="Ownership Status" v={statusDisplay(p.ownership_status)} /><Row k="Registration Status" v={statusDisplay(p.registration_status)} /><Row k="Mutation Status" v={statusDisplay(p.mutation_status)} />
        </dl>
        <div className="card relative overflow-hidden" style={{ minHeight: 300 }}>
          <img src={overviewImage} alt="Parcel overview" className="absolute inset-0 h-full w-full object-cover" />
          <svg viewBox="0 0 440 300" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <polygon points="100,70 310,55 345,220 120,245" fill="#86efac" fillOpacity=".28" stroke="#bbf7d0" strokeWidth="4" />
            <text x="220" y="155" textAnchor="middle" fill="white" fontSize="38" fontWeight="800" stroke="#14532d" strokeWidth="5" paintOrder="stroke">{p.dag_no}</text>
            <text x="220" y="193" textAnchor="middle" fill="white" fontSize="24" fontWeight="700" stroke="#14532d" strokeWidth="4" paintOrder="stroke">{area}</text>
          </svg>
          <button onClick={() => setBig(true)} className="absolute bottom-3 right-3 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow">View Larger</button>
          <span className="absolute left-3 top-3 rounded bg-black/50 px-2 py-0.5 text-[10px] text-white">Illustrative overview image · not a survey map</span>
        </div>
      </div>
      <section className="mt-6" aria-labelledby="parcel-documents-title">
        <div className="mb-3 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700"><FileText className="h-5 w-5" /></span>
          <div className="min-w-0"><h2 id="parcel-documents-title" className="text-lg font-bold text-slate-900">{bn ? 'নথিপত্র' : 'Documents'}</h2><p className="mt-0.5 text-sm text-slate-500">{bn ? 'এই জমির সাথে সংশ্লিষ্ট গুরুত্বপূর্ণ নথিপত্র' : 'Important documents linked to this parcel'}</p></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {docItems.map((item) => {
            return <article key={item.key} className="card flex min-w-0 gap-3 p-3 sm:flex-col sm:p-4">
              <button type="button" onClick={() => setDocumentPreview(item)} className="group relative h-28 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 sm:h-36 sm:w-full" aria-label={`${bn ? 'দেখুন' : 'View'} ${item.title}`}>
                <img src={item.image} alt="" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" />
              </button>
              <div className="flex min-w-0 flex-1 flex-col">
                <h3 className="break-words font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{bn ? 'নথি নম্বর:' : 'Document ID:'} <span className="break-all font-medium text-slate-700">{item.doc?.id || '—'}</span></p>
                <p className="mt-0.5 text-sm text-slate-500">{dateLabel}: <span className="text-slate-700">{dateText(item.doc?.date)}</span></p>
                <button type="button" onClick={() => setDocumentPreview(item)} className="btn-primary mt-3 w-full sm:mt-auto sm:pt-2.5"><Eye className="h-4 w-4" />{bn ? 'নথি দেখুন' : 'View document'}</button>
              </div>
            </article>
          })}
        </div>
      </section>
      <h2 className="mb-2 mt-6 text-sm font-bold text-slate-700">Integrity Status</h2>
      <div className={`card flex items-start gap-4 border p-5 ${tone[0]}`}>
        <Icon className={`h-9 w-9 shrink-0 ${tone[1]}`} />
        <div className="flex-1"><div className={`text-xl font-extrabold ${tone[1]}`}>{statusLabel}</div><p className="mt-0.5 text-sm text-slate-600">{summaryLabel}</p>
          <p className="mt-1 text-xs text-slate-500">{bn ? `${display(p.transaction_count)}টির মধ্যে ${display(p.alert_count)}টি লেনদেনে অসংগতির সংকেত রয়েছে।` : `${p.alert_count} of ${p.transaction_count} transaction(s) have integrity signals.`}</p></div>
      </div>
      {big && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-6" onClick={() => setBig(false)}>
          <div className="relative h-[75vh] w-full max-w-4xl overflow-hidden rounded-xl sm:h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <img src={overviewImage} alt="Parcel overview" className="absolute inset-0 h-full w-full object-cover" />
            <svg viewBox="0 0 440 300" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
              <polygon points="100,70 310,55 345,220 120,245" fill="#86efac" fillOpacity=".28" stroke="#bbf7d0" strokeWidth="4" />
              <text x="220" y="155" textAnchor="middle" fill="white" fontSize="38" fontWeight="800" stroke="#14532d" strokeWidth="5" paintOrder="stroke">{p.dag_no}</text>
              <text x="220" y="193" textAnchor="middle" fill="white" fontSize="24" fontWeight="700" stroke="#14532d" strokeWidth="4" paintOrder="stroke">{area}</text>
            </svg>
            <button className="absolute right-3 top-3 rounded-full bg-white p-2" onClick={() => setBig(false)} aria-label="Close"><X className="h-4 w-4" /></button>
          </div>
        </div>)}
      {documentPreview && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6" onClick={() => setDocumentPreview(null)}>
        <div role="dialog" aria-modal="true" aria-label={documentPreview.title} className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3"><div className="min-w-0"><h2 className="truncate font-bold text-slate-900">{documentPreview.title}</h2><p className="text-xs text-slate-500">{documentPreview.doc?.id || noDocument}</p></div><button type="button" className="rounded-full p-2 text-slate-600 hover:bg-slate-100" onClick={() => setDocumentPreview(null)} aria-label={bn ? 'বন্ধ করুন' : 'Close'}><X className="h-5 w-5" /></button></div>
          <div className="min-h-0 overflow-auto bg-slate-100 p-3 text-center sm:p-5"><img src={documentPreview.image} alt={documentPreview.title} className="mx-auto max-h-[72vh] max-w-full rounded shadow-md" /></div>
          <div className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm text-slate-600"><span>{dateLabel}: {dateText(documentPreview.doc?.date)}</span><span>{documentPreview.doc?.id || noDocument}</span></div>
        </div>
      </div>}
    </div>
  )
}
