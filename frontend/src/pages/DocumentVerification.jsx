import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, FileText, Loader2, Search, Trash2, Upload, ZoomIn, ZoomOut } from 'lucide-react'
import { api } from '../services/api'
import { PageHeader } from '../components/ui'
import { banglaDisplay } from '../utils/banglaText'

const MAX_SIZE = 15 * 1024 * 1024
const FIELDS = [
  ['district', 'জেলা'], ['upazila', 'উপজেলা'], ['mouza', 'মৌজা'], ['khatian', 'খতিয়ান নম্বর'], ['dag', 'দাগ নম্বর'],
  ['area', 'জমির পরিমাণ'], ['land_class', 'জমির শ্রেণি'], ['owner', 'মালিকের নাম'], ['father_spouse', 'পিতা/স্বামীর নাম'],
  ['grantor', 'দাতা'], ['grantee', 'গ্রহীতা'], ['deed_no', 'দলিল নম্বর'], ['deed_date', 'দলিলের তারিখ'], ['registration', 'রেজিস্ট্রেশন তথ্য'],
]
const EMPTY = Object.fromEntries(FIELDS.map(([key]) => [key, '']))

function areaDecimal(value) {
  const match = String(value || '').match(/[\d০-৯]+(?:[.,][\d০-৯]+)?/)
  if (!match) return null
  const digitMap = { '০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9' }
  const n = Number(match[0].replace(/[০-৯]/g, (d) => digitMap[d]).replace(',', '.'))
  if (!Number.isFinite(n)) return null
  return /একর|acre/i.test(value) ? n * 100 : n
}

export default function DocumentVerification() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [extraction, setExtraction] = useState(null)
  const [fields, setFields] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [matches, setMatches] = useState(null)
  const [zoom, setZoom] = useState(100)
  const [page, setPage] = useState(1)
  const isPdf = file?.type === 'application/pdf'

  const chooseFile = (next) => {
    setMessage(''); setExtraction(null); setMatches(null)
    if (!next) return
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(next.type)) { setMessage('শুধু PDF, JPG, JPEG অথবা PNG ফাইল আপলোড করুন।'); return }
    if (next.size > MAX_SIZE) { setMessage('ফাইলের সর্বোচ্চ আকার ১৫ MB।'); return }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(next); setPreviewUrl(URL.createObjectURL(next)); setPage(1)
  }
  const removeFile = () => { if (previewUrl) URL.revokeObjectURL(previewUrl); setFile(null); setPreviewUrl(''); setExtraction(null); setMatches(null); setFields(EMPTY); setMessage('') }
  const extract = async () => {
    if (!file) return
    setBusy(true); setMessage(''); setMatches(null)
    try {
      const result = await api.extractDocument(file)
      setExtraction(result)
      setFields(Object.fromEntries(FIELDS.map(([key]) => [key, result.fields?.[key]?.value || ''])))
      if (!result.readable_text) setMessage('দলিল থেকে পর্যাপ্ত তথ্য শনাক্ত করা যায়নি। অনুগ্রহ করে পরিষ্কার ছবি বা স্ক্যান আপলোড করুন।')
    } catch (error) {
      setMessage(error.status === 404
        ? 'দলিল যাচাই API পাওয়া যাচ্ছে না (404)। নতুন API চালু করতে ব্যাকএন্ড সার্ভারটি restart করুন।'
        : error.status === 401
          ? 'আপনার সেশন শেষ হয়েছে। আবার লগ-ইন করুন।'
          : error.message || 'দলিলটি প্রক্রিয়া করা যায়নি। আবার চেষ্টা করুন।')
    }
    finally { setBusy(false) }
  }
  const verify = async () => {
    setBusy(true); setMessage('')
    try { const result = await api.verifyDocument(fields); setMatches(result.matches || []); if (!result.matches?.length) setMessage(result.message || 'কোনো মিল থাকা জমির রেকর্ড পাওয়া যায়নি।') }
    catch (error) { setMessage(error.message || 'সার্ভারে সংযোগ করা যায়নি। আবার চেষ্টা করুন।') }
    finally { setBusy(false) }
  }

  const comparisons = useMemo(() => {
    if (!matches?.length) return []
    const record = matches[0]
    const pairs = [
      ['জেলা', fields.district, record.district], ['উপজেলা', fields.upazila, record.upazila], ['মৌজা', fields.mouza, record.mouza],
      ['খতিয়ান', fields.khatian, record.khatian_no], ['দাগ', fields.dag, record.dag_no],
      ['জমির পরিমাণ', areaDecimal(fields.area), record.total_area_decimal], ['মালিকের নাম', fields.owner, record.current_owner_name],
    ]
    return pairs.map(([label, doc, db]) => {
      if (doc === '' || doc == null || db === '' || db == null) return { label, doc, db, status: 'missing' }
      const equal = label === 'জমির পরিমাণ' ? Math.abs(Number(doc) - Number(db)) < 0.01 : String(doc).trim().toLocaleLowerCase() === String(db).trim().toLocaleLowerCase()
      return { label, doc, db, status: equal ? 'match' : 'mismatch' }
    })
  }, [matches, fields])
  const mismatch = comparisons.some((row) => row.status === 'mismatch')
  const display = (v) => v === '' || v == null ? 'তথ্য পাওয়া যায়নি' : typeof v === 'number' ? banglaDisplay(v) : banglaDisplay(v)

  return <div className="mx-auto max-w-6xl">
    <PageHeader title="দলিল যাচাই" subtitle="দলিলের তথ্য পর্যালোচনা করে বিদ্যমান LandGuard জমির রেকর্ডের সঙ্গে তুলনা করুন।" />
    <section className="card p-4 sm:p-5">
      <h2 className="text-base font-bold text-slate-800">ডিজিটাল বা হাতে লেখা দলিল আপলোড করুন</h2>
      <p className="mt-1 text-sm text-slate-500">সমর্থিত ফাইল: PDF, JPG, JPEG, PNG · সর্বোচ্চ ১৫ MB</p>
      {!file ? <label className="mt-4 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 px-4 py-8 text-center hover:bg-brand-50">
        <Upload className="mb-2 h-7 w-7 text-brand-700" /><span className="font-semibold text-slate-700">ফাইল বেছে নিন বা এখানে দিন</span><span className="mt-1 text-xs text-slate-500">ডিজিটাল, স্ক্যান করা বা হাতে লেখা দলিল</span>
        <input className="sr-only" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(e) => chooseFile(e.target.files?.[0])} />
      </label> : <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
        <div className="flex min-w-0 items-center gap-3"><span className="rounded-lg bg-brand-50 p-2 text-brand-700"><FileText className="h-5 w-5" /></span><div className="min-w-0"><p className="break-all font-semibold text-slate-800">{file.name}</p><p className="text-xs text-slate-500">{file.type || 'ফাইল'} · {(file.size / 1024 / 1024).toFixed(2)} MB {extraction && `· ${extraction.page_count} পৃষ্ঠা · ${extraction.document_type}`}</p></div></div>
        <div className="flex gap-2"><button className="btn-outline" type="button" disabled={busy} onClick={removeFile}><Trash2 className="h-4 w-4" />সরান</button><button className="btn-primary" type="button" disabled={busy} onClick={extract}>{busy ? <><Loader2 className="h-4 w-4 animate-spin" />প্রক্রিয়াকরণ…</> : <><Search className="h-4 w-4" />তথ্য শনাক্ত করুন</>}</button></div>
      </div>}
      {file && <div className="mt-3" aria-live="polite">
        {!busy && !extraction && <p className="text-xs text-slate-500">ফাইল প্রস্তুত · শনাক্তকরণ শুরু করতে “তথ্য শনাক্ত করুন” চাপুন।</p>}
        {(busy || extraction) && <><p className="mb-1 text-xs text-slate-500">{busy ? 'ফাইল পাঠানো ও তথ্য শনাক্ত করা হচ্ছে…' : 'তথ্য শনাক্তকরণ সম্পন্ন'}</p><div className="h-1.5 overflow-hidden rounded-full bg-slate-100" aria-label={extraction ? 'প্রক্রিয়াকরণ সম্পন্ন' : 'প্রক্রিয়াকরণ চলছে'}><div className={`h-full rounded-full bg-brand-600 transition-all ${busy ? 'w-2/3 animate-pulse' : 'w-full'}`} /></div></>}
      </div>}
      {message && <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{message}</p>}
    </section>

    {extraction && <div className="mt-5 grid gap-4 lg:grid-cols-2">
      <section className="card min-w-0 p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold text-slate-800">মূল দলিল</h2>{isPdf && <div className="flex items-center gap-1"><button className="btn-outline !px-2 !py-1" aria-label="ছোট করুন" onClick={() => setZoom((z) => Math.max(50, z - 10))}><ZoomOut className="h-4 w-4" /></button><span className="min-w-12 text-center text-xs">{zoom}%</span><button className="btn-outline !px-2 !py-1" aria-label="বড় করুন" onClick={() => setZoom((z) => Math.min(180, z + 10))}><ZoomIn className="h-4 w-4" /></button></div>}</div>
        {isPdf ? <><p className="mb-2 flex items-center justify-between text-xs text-slate-500"><span>মোট {banglaDisplay(extraction.page_count)} পৃষ্ঠা</span><span className="flex items-center gap-2"><button className="btn-outline !px-2 !py-1" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>আগের</button>{banglaDisplay(page)} / {banglaDisplay(extraction.page_count)}<button className="btn-outline !px-2 !py-1" disabled={page >= extraction.page_count} onClick={() => setPage((p) => p + 1)}>পরের</button></span></p><iframe title="মূল PDF দলিল" className="h-[520px] w-full rounded-lg border border-slate-200" src={`${previewUrl}#page=${page}&zoom=${zoom}`} /></> : <img className="max-h-[600px] w-full rounded-lg border border-slate-200 object-contain" src={previewUrl} alt="আপলোড করা মূল দলিল" />}
      </section>
      <section className="card min-w-0 p-4"><h2 className="font-bold text-slate-800">প্রাপ্ত তথ্য</h2><p className="mt-1 text-xs text-slate-500">প্রতিটি তথ্য যাচাই করে প্রয়োজন হলে সংশোধন করুন। শনাক্তকরণ অনিশ্চিত হতে পারে।</p>
        {extraction.warning && <p className="mt-3 flex gap-2 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{extraction.warning}</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{FIELDS.map(([key, label]) => <label key={key} className="block min-w-0"><span className="mb-1 block text-xs font-semibold text-slate-600">{label} <span className="font-normal text-slate-400">{extraction.fields?.[key]?.confidence === 'Medium' ? '· মাঝারি নিশ্চয়তা' : !fields[key] ? '· তথ্য পাওয়া যায়নি' : ''}</span></span><input className="input h-10" value={fields[key] || ''} onChange={(e) => setFields((old) => ({ ...old, [key]: e.target.value }))} placeholder="নিশ্চিতভাবে শনাক্ত করা যায়নি" /></label>)}</div>
        <div className="mt-4 flex flex-wrap justify-end gap-2"><button className="btn-primary" disabled={busy} onClick={verify}><Check className="h-4 w-4" />যাচাই শুরু করুন</button></div>
      </section>
    </div>}

    {matches && <section className="card mt-5 overflow-hidden">
      <div className="border-b border-slate-100 p-4"><h2 className="font-bold text-slate-800">যাচাই ফলাফল</h2>{matches.length > 0 && <p className="mt-1 text-sm text-slate-600">{matches.length > 1 ? 'একাধিক সম্ভাব্য রেকর্ড পাওয়া গেছে—নিচের মিলের তালিকা পর্যালোচনা করুন। প্রথমটি তুলনার জন্য দেখানো হয়েছে।' : 'সংশ্লিষ্ট জমির রেকর্ড পাওয়া গেছে'}</p>}</div>
      {matches.length > 0 && <><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-600"><tr><th className="p-3">তথ্য</th><th className="p-3">দলিল থেকে প্রাপ্ত</th><th className="p-3">LandGuard রেকর্ড</th><th className="p-3">অবস্থা</th></tr></thead><tbody>{comparisons.map((row) => <tr className="border-t border-slate-100" key={row.label}><td className="p-3 font-medium">{row.label}</td><td className="p-3">{row.label === 'জমির পরিমাণ' && row.doc != null ? `${display(row.doc)} শতক` : display(row.doc)}</td><td className="p-3">{row.label === 'জমির পরিমাণ' && row.db != null ? `${display(row.db)} শতক` : display(row.db)}</td><td className="p-3">{row.status === 'match' ? <span className="font-semibold text-emerald-700">✓ মিলেছে</span> : row.status === 'mismatch' ? <span className="font-semibold text-amber-700">! অমিল</span> : <span className="text-slate-500">— তথ্য পাওয়া যায়নি</span>}</td></tr>)}</tbody></table></div>
        <div className={`m-4 rounded-lg p-3 text-sm ${mismatch ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900'}`}>{mismatch ? 'দলিল ও বিদ্যমান রেকর্ডের মধ্যে অমিল পাওয়া গেছে। বিস্তারিত যাচাই প্রয়োজন। এটি জালিয়াতির সিদ্ধান্ত নয়।' : 'প্রাথমিক যাচাইয়ে তথ্যের মধ্যে উল্লেখযোগ্য অমিল পাওয়া যায়নি।'}</div>
        <div className="flex flex-wrap gap-2 px-4 pb-4">{matches.map((record) => <Link key={record.parcel_id} to={`/parcel/${record.parcel_id}/overview`} className="btn-outline">রেকর্ড দেখুন · {record.parcel_id}</Link>)}{mismatch && <Link className="btn-primary" to={`/investigate?parcel_id=${encodeURIComponent(matches[0].parcel_id)}`}>তদন্তে পাঠান</Link>}</div>
      </>}
    </section>}
  </div>
}
