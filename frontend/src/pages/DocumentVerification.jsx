import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, FileText, Loader2, Search, Trash2, Upload, ZoomIn, ZoomOut } from 'lucide-react'
import { api } from '../services/api'
import { PageHeader } from '../components/ui'
import { banglaDisplay } from '../utils/banglaText'
import { useLanguage } from '../i18n'

const MAX_SIZE = 15 * 1024 * 1024
const FIELDS = [
  ['district', 'District', 'জেলা'], ['upazila', 'Upazila', 'উপজেলা'], ['mouza', 'Mouza', 'মৌজা'], ['khatian', 'Khatian number', 'খতিয়ান নম্বর'], ['dag', 'Dag number', 'দাগ নম্বর'],
  ['area', 'Land area', 'জমির পরিমাণ'], ['land_class', 'Land class', 'জমির শ্রেণি'], ['owner', 'Owner name', 'মালিকের নাম'], ['father_spouse', 'Father / spouse name', 'পিতা/স্বামীর নাম'],
  ['grantor', 'Grantor', 'দাতা'], ['grantee', 'Grantee', 'গ্রহীতা'], ['deed_no', 'Deed number', 'দলিল নম্বর'], ['deed_date', 'Deed date', 'দলিলের তারিখ'], ['registration', 'Registration details', 'রেজিস্ট্রেশন তথ্য'],
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
  const { language } = useLanguage()
  const bn = language === 'bn'
  const t = (english, bengali) => bn ? bengali : english
  const labelFor = (key) => { const row = FIELDS.find(([field]) => field === key); return row ? row[bn ? 2 : 1] : key }
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
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(next.type)) { setMessage(t('Upload a PDF, JPG, JPEG, or PNG file only.', 'শুধু PDF, JPG, JPEG অথবা PNG ফাইল আপলোড করুন।')); return }
    if (next.size > MAX_SIZE) { setMessage(t('The maximum file size is 15 MB.', 'ফাইলের সর্বোচ্চ আকার ১৫ MB।')); return }
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
      if (!result.readable_text) setMessage(t('Not enough information could be read. Please upload a clearer image or scan.', 'দলিল থেকে পর্যাপ্ত তথ্য শনাক্ত করা যায়নি। অনুগ্রহ করে পরিষ্কার ছবি বা স্ক্যান আপলোড করুন।'))
    } catch (error) {
      setMessage(error.status === 404
        ? t('The document verification API was not found (404). Restart or redeploy the backend with the latest API.', 'দলিল যাচাই API পাওয়া যাচ্ছে না (404)। নতুন API চালু করতে ব্যাকএন্ড সার্ভারটি restart করুন।')
        : error.status === 401
          ? t('Your session has expired. Please log in again.', 'আপনার সেশন শেষ হয়েছে। আবার লগ-ইন করুন।')
          : (bn ? error.message : null) || t('The document could not be processed. Please try again.', 'দলিলটি প্রক্রিয়া করা যায়নি। আবার চেষ্টা করুন।'))
    }
    finally { setBusy(false) }
  }
  const verify = async () => {
    setBusy(true); setMessage('')
    try { const result = await api.verifyDocument(fields); setMatches(result.matches || []); if (!result.matches?.length) setMessage(t('No matching land records were found.', result.message || 'কোনো মিল থাকা জমির রেকর্ড পাওয়া যায়নি।')) }
    catch (error) { setMessage((bn ? error.message : null) || t('Could not connect to the server. Please try again.', 'সার্ভারে সংযোগ করা যায়নি। আবার চেষ্টা করুন।')) }
    finally { setBusy(false) }
  }

  const comparisons = useMemo(() => {
    if (!matches?.length) return []
    const record = matches[0]
    const pairs = [
      [labelFor('district'), fields.district, record.district], [labelFor('upazila'), fields.upazila, record.upazila], [labelFor('mouza'), fields.mouza, record.mouza],
      [labelFor('khatian'), fields.khatian, record.khatian_no], [labelFor('dag'), fields.dag, record.dag_no],
      [labelFor('area'), areaDecimal(fields.area), record.total_area_decimal], [labelFor('owner'), fields.owner, record.current_owner_name],
    ]
    return pairs.map(([label, doc, db]) => {
      if (doc === '' || doc == null || db === '' || db == null) return { label, doc, db, status: 'missing' }
      const equal = label === labelFor('area') ? Math.abs(Number(doc) - Number(db)) < 0.01 : String(doc).trim().toLocaleLowerCase() === String(db).trim().toLocaleLowerCase()
      return { label, doc, db, status: equal ? 'match' : 'mismatch' }
    })
  }, [matches, fields, bn])
  const mismatch = comparisons.some((row) => row.status === 'mismatch')
  const display = (v) => v === '' || v == null ? t('No data found', 'তথ্য পাওয়া যায়নি') : bn ? banglaDisplay(v) : String(v)

  return <div className="mx-auto max-w-6xl">
    <PageHeader title={t('Document verification', 'দলিল যাচাই')} subtitle={t('Review the document details and compare them with existing LandGuard land records.', 'দলিলের তথ্য পর্যালোচনা করে বিদ্যমান LandGuard জমির রেকর্ডের সঙ্গে তুলনা করুন।')} />
    <section className="card p-4 sm:p-5">
      <h2 className="text-base font-bold text-slate-800">{t('Upload a digital or handwritten document', 'ডিজিটাল বা হাতে লেখা দলিল আপলোড করুন')}</h2>
      <p className="mt-1 text-sm text-slate-500">{t('Supported files: PDF, JPG, JPEG, PNG · Maximum 15 MB', 'সমর্থিত ফাইল: PDF, JPG, JPEG, PNG · সর্বোচ্চ ১৫ MB')}</p>
      {!file ? <label className="mt-4 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 px-4 py-8 text-center hover:bg-brand-50">
        <Upload className="mb-2 h-7 w-7 text-brand-700" /><span className="font-semibold text-slate-700">{t('Choose a file or drop it here', 'ফাইল বেছে নিন বা এখানে দিন')}</span><span className="mt-1 text-xs text-slate-500">{t('Digital, scanned, or handwritten document', 'ডিজিটাল, স্ক্যান করা বা হাতে লেখা দলিল')}</span>
        <input className="sr-only" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(e) => chooseFile(e.target.files?.[0])} />
      </label> : <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
        <div className="flex min-w-0 items-center gap-3"><span className="rounded-lg bg-brand-50 p-2 text-brand-700"><FileText className="h-5 w-5" /></span><div className="min-w-0"><p className="break-all font-semibold text-slate-800">{file.name}</p><p className="text-xs text-slate-500">{file.type || t('File', 'ফাইল')} · {(file.size / 1024 / 1024).toFixed(2)} MB {extraction && `· ${bn ? banglaDisplay(extraction.page_count) : extraction.page_count} ${t('pages', 'পৃষ্ঠা')} · ${extraction.document_type === 'digital/typed' ? t('Digital / typed', 'ডিজিটাল / টাইপ করা') : t('Scanned / typed or handwritten', 'স্ক্যান করা / টাইপ করা বা হাতে লেখা')}`}</p></div></div>
        <div className="flex gap-2"><button className="btn-outline" type="button" disabled={busy} onClick={removeFile}><Trash2 className="h-4 w-4" />{t('Remove', 'সরান')}</button><button className="btn-primary" type="button" disabled={busy} onClick={extract}>{busy ? <><Loader2 className="h-4 w-4 animate-spin" />{t('Processing…', 'প্রক্রিয়াকরণ…')}</> : <><Search className="h-4 w-4" />{t('Extract information', 'তথ্য শনাক্ত করুন')}</>}</button></div>
      </div>}
      {file && <div className="mt-3" aria-live="polite">
        {!busy && !extraction && <p className="text-xs text-slate-500">{t('File ready · Press “Extract information” to begin.', 'ফাইল প্রস্তুত · শনাক্তকরণ শুরু করতে “তথ্য শনাক্ত করুন” চাপুন।')}</p>}
        {(busy || extraction) && <><p className="mb-1 text-xs text-slate-500">{busy ? t('Uploading and extracting information…', 'ফাইল পাঠানো ও তথ্য শনাক্ত করা হচ্ছে…') : t('Information extraction complete', 'তথ্য শনাক্তকরণ সম্পন্ন')}</p><div className="h-1.5 overflow-hidden rounded-full bg-slate-100" aria-label={extraction ? t('Processing complete', 'প্রক্রিয়াকরণ সম্পন্ন') : t('Processing', 'প্রক্রিয়াকরণ চলছে')}><div className={`h-full rounded-full bg-brand-600 transition-all ${busy ? 'w-2/3 animate-pulse' : 'w-full'}`} /></div></>}
      </div>}
      {message && <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{message}</p>}
    </section>

    {extraction && <div className="mt-5 grid gap-4 lg:grid-cols-2">
      <section className="card min-w-0 p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold text-slate-800">{t('Original document', 'মূল দলিল')}</h2>{isPdf && <div className="flex items-center gap-1"><button className="btn-outline !px-2 !py-1" aria-label={t('Zoom out', 'ছোট করুন')} onClick={() => setZoom((z) => Math.max(50, z - 10))}><ZoomOut className="h-4 w-4" /></button><span className="min-w-12 text-center text-xs">{zoom}%</span><button className="btn-outline !px-2 !py-1" aria-label={t('Zoom in', 'বড় করুন')} onClick={() => setZoom((z) => Math.min(180, z + 10))}><ZoomIn className="h-4 w-4" /></button></div>}</div>
        {isPdf ? <><p className="mb-2 flex items-center justify-between text-xs text-slate-500"><span>{t('Total', 'মোট')} {display(extraction.page_count)} {t('pages', 'পৃষ্ঠা')}</span><span className="flex items-center gap-2"><button className="btn-outline !px-2 !py-1" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t('Previous', 'আগের')}</button>{display(page)} / {display(extraction.page_count)}<button className="btn-outline !px-2 !py-1" disabled={page >= extraction.page_count} onClick={() => setPage((p) => p + 1)}>{t('Next', 'পরের')}</button></span></p><iframe title={t('Original PDF document', 'মূল PDF দলিল')} className="h-[520px] w-full rounded-lg border border-slate-200" src={`${previewUrl}#page=${page}&zoom=${zoom}`} /></> : <img className="max-h-[600px] w-full rounded-lg border border-slate-200 object-contain" src={previewUrl} alt={t('Uploaded original document', 'আপলোড করা মূল দলিল')} />}
      </section>
      <section className="card min-w-0 p-4"><h2 className="font-bold text-slate-800">{t('Extracted information', 'প্রাপ্ত তথ্য')}</h2><p className="mt-1 text-xs text-slate-500">{t('Review each field and correct it if needed. Extraction may be uncertain.', 'প্রতিটি তথ্য যাচাই করে প্রয়োজন হলে সংশোধন করুন। শনাক্তকরণ অনিশ্চিত হতে পারে।')}</p>
        {extraction.warning && <p className="mt-3 flex gap-2 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{bn ? extraction.warning : extraction.used_ocr ? 'OCR was used to read this document. Please review the extracted details.' : 'Some document text may not have been read accurately. Please review the extracted details.'}</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{FIELDS.map(([key, en, bnLabel]) => <label key={key} className="block min-w-0"><span className="mb-1 block text-xs font-semibold text-slate-600">{bn ? bnLabel : en} <span className={`font-normal ${extraction.fields?.[key]?.confidence === 'Low' ? 'text-amber-600' : 'text-slate-400'}`}>{extraction.fields?.[key]?.confidence === 'Medium' ? t('· Medium confidence', '· মাঝারি নিশ্চয়তা') : extraction.fields?.[key]?.confidence === 'Low' ? t('· Low confidence — review', '· কম নিশ্চয়তা—পর্যালোচনা করুন') : !fields[key] ? t('· No data found', '· তথ্য পাওয়া যায়নি') : ''}</span></span><input className="input h-10" value={fields[key] || ''} onChange={(e) => setFields((old) => ({ ...old, [key]: e.target.value }))} placeholder={t('Could not identify with confidence', 'নিশ্চিতভাবে শনাক্ত করা যায়নি')} /></label>)}</div>
        <div className="mt-4 flex flex-wrap justify-end gap-2"><button className="btn-primary" disabled={busy} onClick={verify}><Check className="h-4 w-4" />{t('Start verification', 'যাচাই শুরু করুন')}</button></div>
      </section>
    </div>}

    {matches && <section className="card mt-5 overflow-hidden">
      <div className="border-b border-slate-100 p-4"><h2 className="font-bold text-slate-800">{t('Verification results', 'যাচাই ফলাফল')}</h2>{matches.length > 0 && <p className="mt-1 text-sm text-slate-600">{matches.length > 1 ? t('Multiple possible records were found. Review the comparisons below; the first record is shown for comparison.', 'একাধিক সম্ভাব্য রেকর্ড পাওয়া গেছে—নিচের মিলের তালিকা পর্যালোচনা করুন। প্রথমটি তুলনার জন্য দেখানো হয়েছে।') : t('A related land record was found.', 'সংশ্লিষ্ট জমির রেকর্ড পাওয়া গেছে')}</p>}</div>
      {matches.length > 0 && <><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-600"><tr><th className="p-3">{t('Field', 'তথ্য')}</th><th className="p-3">{t('From document', 'দলিল থেকে প্রাপ্ত')}</th><th className="p-3">{t('LandGuard record', 'LandGuard রেকর্ড')}</th><th className="p-3">{t('Status', 'অবস্থা')}</th></tr></thead><tbody>{comparisons.map((row) => <tr className="border-t border-slate-100" key={row.label}><td className="p-3 font-medium">{row.label}</td><td className="p-3">{row.label === labelFor('area') && row.doc != null ? `${display(row.doc)} ${t('decimal', 'শতক')}` : display(row.doc)}</td><td className="p-3">{row.label === labelFor('area') && row.db != null ? `${display(row.db)} ${t('decimal', 'শতক')}` : display(row.db)}</td><td className="p-3">{row.status === 'match' ? <span className="font-semibold text-emerald-700">✓ {t('Matched', 'মিলেছে')}</span> : row.status === 'mismatch' ? <span className="font-semibold text-amber-700">! {t('Mismatch', 'অমিল')}</span> : <span className="text-slate-500">— {t('No data found', 'তথ্য পাওয়া যায়নি')}</span>}</td></tr>)}</tbody></table></div>
        <div className={`m-4 rounded-lg p-3 text-sm ${mismatch ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900'}`}>{mismatch ? t('Differences were found between the document and existing records. Further review is needed; this is not a finding of fraud.', 'দলিল ও বিদ্যমান রেকর্ডের মধ্যে অমিল পাওয়া গেছে। বিস্তারিত যাচাই প্রয়োজন। এটি জালিয়াতির সিদ্ধান্ত নয়।') : t('No significant differences were found in this initial check.', 'প্রাথমিক যাচাইয়ে তথ্যের মধ্যে উল্লেখযোগ্য অমিল পাওয়া যায়নি।')}</div>
        <div className="flex flex-wrap gap-2 px-4 pb-4">{matches.map((record) => <Link key={record.parcel_id} to={`/parcel/${record.parcel_id}/overview`} className="btn-outline">{t('View record', 'রেকর্ড দেখুন')} · {record.parcel_id}</Link>)}{mismatch && <Link className="btn-primary" to={`/investigate?parcel_id=${encodeURIComponent(matches[0].parcel_id)}`}>{t('Send for investigation', 'তদন্তে পাঠান')}</Link>}</div>
      </>}
    </section>}
  </div>
}
