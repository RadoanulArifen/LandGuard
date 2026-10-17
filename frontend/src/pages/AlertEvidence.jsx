import { Link, useOutletContext } from 'react-router-dom'
import { Card } from '../components/ui'
import { dateFmt, dec } from '../utils/format'
import { useLanguage } from '../i18n'
import { banglaDisplay, bnTerm, displayDate, evidenceMessage, evidenceTitle } from '../utils/banglaText'

const LABELS = { ID: 'আইডি', Date: 'তারিখ', Type: 'ধরন', Status: 'অবস্থা', Seller: 'বিক্রেতা', Buyer: 'ক্রেতা',
  'Area (decimal)': 'জমির পরিমাণ (শতক)', 'Share before %': 'আগের মালিকানার অংশ (%)', 'Share transferred %': 'হস্তান্তরিত অংশ (%)',
  'Seller recorded share before (%)': 'হস্তান্তরের আগে বিক্রেতার নথিভুক্ত অংশ (%)', 'Transferred share (%)': 'হস্তান্তরিত অংশ (%)',
  'Excess share (%)': 'অতিরিক্ত অংশ (%)', 'Seller-controlled area (decimal)': 'বিক্রেতার নিয়ন্ত্রণাধীন জমির পরিমাণ (শতক)',
  'Transferred area (decimal)': 'হস্তান্তরিত জমির পরিমাণ (শতক)', 'Potential excess area (decimal)': 'সম্ভাব্য অতিরিক্ত জমির পরিমাণ (শতক)',
  'This transaction': 'এই লেনদেন', 'Earlier full transfer': 'আগের সম্পূর্ণ হস্তান্তর', 'Recorded seller': 'নথিভুক্ত বিক্রেতা',
  'Recorded previous owner': 'নথিভুক্ত আগের মালিক', 'Ownership sequence': 'মালিকানার ধারাবাহিকতায় অবস্থান',
  'Buyer (this transaction)': 'ক্রেতা (এই লেনদেন)', 'Days since previous transfer': 'আগের হস্তান্তরের পর কেটে যাওয়া দিন',
  'Strong threshold (days)': 'জোরালো সংকেতের সীমা (দিন)', 'Moderate threshold (days)': 'মাঝারি সংকেতের সীমা (দিন)',
  'Document / reference': 'নথি / সূত্র', Verification: 'যাচাইকরণ', Deed: 'দলিল', Reference: 'সূত্র', Area: 'জমির পরিমাণ (শতক)',
  Issues: 'অসংগতির ধরন',
}

function KV({ obj, bn, date }) {
  return <table className="w-full table-fixed text-sm"><tbody>{Object.entries(obj).filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => {
    const value = typeof v === 'number' ? dec(v) : String(v)
    const shown = bn ? (k === 'Date' ? date(value) : bnTerm(value)) : value
    return <tr key={k} className="border-t border-slate-100 first:border-0"><td className="w-2/5 break-words py-1.5 text-slate-500">{bn ? (LABELS[k] || bnTerm(k.replace(/_/g, ' '))) : k.replace(/_/g, ' ')}</td><td className="break-all py-1.5 text-right font-semibold">{shown}</td></tr>
  })}</tbody></table>
}

function EvidenceTable({ t, bn }) {
  const rowLabel = (label) => {
    if (!bn) return label
    if (label === 'Total Transferred') return 'মোট হস্তান্তরিত'
    if (label === 'Potential Excess') return 'সম্ভাব্য অতিরিক্ত অংশ'
    if (label === 'Potential Overlap (sold after full transfer)') return 'সম্ভাব্য ওভারল্যাপ (সম্পূর্ণ হস্তান্তরের পর বিক্রি)'
    const share = label.match(/^Recorded Share \((.+)\)$/)
    if (share) return `নথিভুক্ত অংশ (${banglaDisplay(share[1])})`
    const transfer = label.match(/^Transfer to (.+?) \((T-\d+)\)$/)
    if (transfer) return `${banglaDisplay(transfer[1])}-এর কাছে হস্তান্তর (${transfer[2]})`
    const earlier = label.match(/^Earlier full transfer to (.+?) \((T-\d+)\)$/)
    if (earlier) return `${banglaDisplay(earlier[1])}-এর কাছে আগের সম্পূর্ণ হস্তান্তর (${earlier[2]})`
    const current = label.match(/^This transfer to (.+?) \((T-\d+)\)$/)
    if (current) return `${banglaDisplay(current[1])}-এর কাছে এই হস্তান্তর (${current[2]})`
    return bnTerm(label)
  }
  const note = (value) => {
    if (!bn) return value
    const m = value.match(/^(.+?) had already transferred their entire interest in (T-\d+); this later transfer overlaps it\.$/)
    return m ? `${banglaDisplay(m[1])} ${m[2]} লেনদেনে তাঁর সম্পূর্ণ অংশ আগেই হস্তান্তর করেছিলেন; পরবর্তী এই হস্তান্তরটি আগের সম্পূর্ণ হস্তান্তরিত অংশের সঙ্গে মিলে যাচ্ছে।` : banglaDisplay(value)
  }
  return <div><div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[360px] text-sm">
    <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-3 text-left font-semibold">{bn ? 'বিবরণ' : 'Description'}</th><th className="p-3 text-right font-semibold">{bn ? `জমির পরিমাণ (${t.unit === 'Decimal' ? 'শতক' : banglaDisplay(t.unit)})` : `Area (${t.unit})`}</th></tr></thead>
    <tbody>{t.rows.map((r, i) => <tr key={i} className={`border-t border-slate-100 ${r.kind === 'total' ? 'font-bold' : ''} ${r.kind === 'excess' ? 'bg-red-50 font-bold text-red-600' : ''}`}><td className="p-3">{rowLabel(r.label)}</td><td className="p-3 text-right">{bn ? banglaDisplay(dec(r.value)) : dec(r.value)}</td></tr>)}</tbody>
  </table></div><div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{note(t.note)}</div></div>
}

const SEV = { High: 'border-red-200 bg-red-50', Medium: 'border-amber-200 bg-amber-50', Low: 'border-emerald-200 bg-emerald-50' }

export default function AlertEvidence() {
  const { d } = useOutletContext()
  const { language } = useLanguage()
  const bn = language === 'bn'
  const date = (v) => bn ? displayDate(v, language) : dateFmt(v)
  const r = d.related
  const withTable = d.evidence.filter((e) => e.table)
  const others = d.evidence.filter((e) => !e.table)
  return <div className="space-y-5">
    <Card title={bn ? 'প্রমাণের বিস্তারিত' : 'Evidence Details'}>
      {d.evidence.length === 0 && <p className="text-sm text-slate-500">{bn ? 'এই লেনদেনে কোনো অসংগতি শনাক্ত হয়নি।' : 'No integrity signals were raised for this transaction.'}</p>}
      <div className="space-y-6">
        {withTable.map((e, i) => <div key={i}><div className="mb-2 font-bold text-slate-800">{bn ? evidenceTitle(e.type, e.title) : e.title}</div><p className="mb-2 text-sm text-slate-500">{bn ? evidenceMessage(e) : e.message}</p><EvidenceTable t={e.table} bn={bn} /></div>)}
        {others.length > 0 && <div className="grid gap-4 md:grid-cols-2">{others.map((e, i) => <div key={i} className={`rounded-xl border p-4 ${SEV[e.severity] || SEV.Low}`}>
          <div className="mb-1 font-bold text-slate-900">{bn ? evidenceTitle(e.type, e.title) : e.title}</div><p className="mb-2 text-sm text-slate-700">{bn ? evidenceMessage(e) : e.message}</p><div className="rounded-lg bg-white/80 px-3 py-1"><KV obj={e.details} bn={bn} date={date} /></div>
        </div>)}</div>}
      </div>
    </Card>
    <Card title={bn ? 'সংশ্লিষ্ট নথি' : 'Related records'}><div className="grid gap-4 md:grid-cols-3">
      <div><div className="mb-1 text-xs font-bold uppercase text-slate-500">{bn ? 'লেনদেন' : 'Transaction'}</div><KV bn={bn} date={date} obj={{ ID: r.transaction.transaction_id, Date: r.transaction.transaction_date, Type: r.transaction.transaction_type, Status: r.transaction.transaction_status, Seller: r.transaction.seller, Buyer: r.transaction.buyer, 'Area (decimal)': r.transaction.transferred_area_decimal, 'Share before %': r.transaction.seller_share_before, 'Share transferred %': r.transaction.transferred_share }} /></div>
      <div><div className="mb-1 text-xs font-bold uppercase text-slate-500">{bn ? 'রেজিস্ট্রেশন' : 'Registration'}</div>{r.registration ? <KV bn={bn} date={date} obj={{ ID: r.registration.r_id, Date: r.registration.r_date, Area: r.registration.r_area, Type: r.registration.r_type, Status: r.registration.r_status, Deed: r.registration.r_deed, Verification: r.registration.r_verif }} /> : <p className="text-sm font-semibold text-red-600">{bn ? 'কোনো রেজিস্ট্রেশন নথি সংযুক্ত নেই।' : 'No registration record linked.'}</p>}</div>
      <div><div className="mb-1 text-xs font-bold uppercase text-slate-500">{bn ? 'নামজারি' : 'Mutation'}</div>{r.mutation ? <KV bn={bn} date={date} obj={{ ID: r.mutation.m_id, Date: r.mutation.m_date, Area: r.mutation.m_area, Type: r.mutation.m_type, Status: r.mutation.m_status, Reference: r.mutation.m_ref, Verification: r.mutation.m_verif }} /> : <p className="text-sm font-semibold text-red-600">{bn ? 'কোনো নামজারির নথি সংযুক্ত নেই।' : 'No mutation record linked.'}</p>}</div>
    </div><div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-sky-600">
      <Link to={`/parcel/${d.parcel_id}/ownership`}>{bn ? 'মালিকানার ইতিহাস' : 'Ownership history'}</Link><Link to={`/parcel/${d.parcel_id}/graph`}>{bn ? 'লেনদেনের গ্রাফ' : 'Transaction graph'}</Link><Link to="comparison">{bn ? 'রেজিস্ট্রেশন বনাম নামজারি' : 'Registration vs mutation'}</Link><Link to="ai">{bn ? 'এআই বিশ্লেষণ' : 'AI analysis'}</Link>
    </div></Card>
    <div className="card flex flex-wrap items-center gap-3 border-red-200 p-4"><span className="h-3 w-3 rounded-full bg-red-500" /><span className="font-bold text-red-600">{bn ? 'চূড়ান্ত অবস্থা: মানবীয় পর্যালোচনা প্রয়োজন' : 'Final status: Human Review Required'}</span><span className="text-sm text-slate-500">{bn ? '— ভূমি প্রহরী কোনো আইনি সিদ্ধান্ত দেয়নি।' : '— ভূমি প্রহরী has not made any legal determination.'}</span></div>
  </div>
}
