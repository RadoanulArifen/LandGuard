import { useOutletContext } from 'react-router-dom'
import { AlertCircle, CheckCircle2, MinusCircle } from 'lucide-react'
import { useLanguage } from '../i18n'
import { banglaDisplay, bnTerm, displayDate } from '../utils/banglaText'

const find = (c, f) => c.rows.find((r) => r.field === f)
function Rec({ title, head, rows }) {
  return (
    <div className="card overflow-hidden">
      <div className={`px-5 py-3 text-lg font-bold ${head}`}>{title}</div>
      <dl>{rows.map(([k, v, bad]) => (
        <div key={k} className="flex justify-between gap-3 border-b border-slate-100 px-4 py-2.5 text-sm last:border-0 sm:px-5"><dt className="shrink-0 text-slate-500">{k}</dt><dd className={`min-w-0 break-words text-right font-semibold ${bad ? 'text-red-600' : 'text-slate-800'}`}>{v}</dd></div>))}</dl>
    </div>)
}
const Icon = ({ m }) => m === null ? <MinusCircle className="h-4 w-4 text-slate-300" /> : m ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />

export default function RegistrationMutation() {
  const { d } = useOutletContext()
  const { language } = useLanguage()
  const bn = language === 'bn'
  const c = d.comparison
  const g = (f) => find(c, f)
  const bad = c.rows.filter((r) => r.match === false)
  const rr = (f, side) => [f, g(f)[side], g(f)[side === 'registration' ? 'registration_match' : 'mutation_match'] === false]
  const fields = { 'Record ID': 'নথির আইডি', 'Seller / Previous owner': 'বিক্রেতা / আগের মালিক', 'Buyer / New owner': 'ক্রেতা / নতুন মালিক', 'Area (decimal)': 'জমির পরিমাণ (শতক)', 'Ownership share (%)': 'মালিকানার অংশ (%)', 'Transaction type': 'লেনদেনের ধরন', Date: 'তারিখ', Status: 'অবস্থা', Verification: 'যাচাইকরণ', 'Document / reference': 'নথি / সূত্র' }
  const value = (field, raw) => {
    if (!bn || raw === null || raw === undefined) return raw
    if (raw === '—') return '—'
    if (raw === 'Missing') return 'অনুপস্থিত'
    if (field === 'Date') {
      const parsed = new Date(raw)
      return Number.isNaN(parsed.getTime()) ? banglaDisplay(raw) : displayDate(parsed, language)
    }
    if (field === 'Transaction type') return bnTerm(raw)
    return bnTerm(String(raw))
  }
  const field = (raw) => bn ? (fields[raw] || banglaDisplay(raw)) : raw
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Rec title={bn ? 'রেজিস্ট্রেশন নথি' : 'Registration Record'} head="bg-sky-100 text-sky-900" rows={[
          [bn ? 'লেনদেনের আইডি' : 'Transaction ID', c.transaction_id, false], [bn ? 'রেজিস্ট্রেশন আইডি' : 'Registration ID', value('Record ID', g('Record ID').registration), !c.has_registration], [bn ? 'বিক্রেতা' : 'Seller', value('Seller / Previous owner', g('Seller / Previous owner').registration), g('Seller / Previous owner').registration_match === false],
          [bn ? 'ক্রেতা' : 'Buyer', value('Buyer / New owner', g('Buyer / New owner').registration), g('Buyer / New owner').registration_match === false], [bn ? 'জমির পরিমাণ (শতক)' : 'Area (Decimal)', value('Area (decimal)', g('Area (decimal)').registration), g('Area (decimal)').registration_match === false],
          [bn ? 'তারিখ' : 'Date', value('Date', g('Date').registration), g('Date').registration_match === false], [bn ? 'নথি নম্বর' : 'Document No.', value('Document / reference', g('Document / reference').registration), false]]} />
        <Rec title={bn ? 'নামজারির নথি' : 'Mutation Record'} head="bg-emerald-100 text-emerald-900" rows={[
          [bn ? 'নামজারি আইডি' : 'Mutation ID', value('Record ID', g('Record ID').mutation), !c.has_mutation], [bn ? 'আগের মালিক' : 'Previous Owner', value('Seller / Previous owner', g('Seller / Previous owner').mutation), g('Seller / Previous owner').mutation_match === false],
          [bn ? 'নতুন মালিক' : 'New Owner', value('Buyer / New owner', g('Buyer / New owner').mutation), g('Buyer / New owner').mutation_match === false], [bn ? 'জমির পরিমাণ (শতক)' : 'Area (Decimal)', value('Area (decimal)', g('Area (decimal)').mutation), g('Area (decimal)').mutation_match === false],
          [bn ? 'তারিখ' : 'Date', value('Date', g('Date').mutation), g('Date').mutation_match === false], [bn ? 'অবস্থা' : 'Status', value('Status', g('Status').mutation), false], [bn ? 'সূত্র' : 'Reference', value('Document / reference', g('Document / reference').mutation), false]]} />
      </div>
      {bad.length > 0 ? (
        <div className="card border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2 font-bold text-red-600"><AlertCircle className="h-5 w-5" />{bn ? `${banglaDisplay(bad.length)}টি অসংগতি শনাক্ত হয়েছে` : `${bad.length} ${bad.length === 1 ? 'inconsistency' : 'inconsistencies'} detected`}</div>
          <ol className={`mt-2 space-y-1 text-sm text-red-700 ${bn ? 'list-none' : 'list-inside list-decimal'}`}>{bad.map((r, i) => (
            <li key={r.field}>{bn && <b className="mr-1">{banglaDisplay(i + 1)}.</b>}<b>{field(r.field)}</b>: {bn ? `লেনদেন “${value(r.field, r.transaction)}”, রেজিস্ট্রেশন “${value(r.field, r.registration)}”, নামজারি “${value(r.field, r.mutation)}”` : `transaction “${r.transaction}”, registration “${r.registration}”, mutation “${r.mutation}”`}</li>))}</ol>
        </div>) : <div className="card border-emerald-200 bg-emerald-50 p-5 font-semibold text-emerald-700">{bn ? 'রেজিস্ট্রেশন ও নামজারির নথি লেনদেনের সঙ্গে মেলে।' : 'Registration and mutation records agree with the transaction.'}</div>}
      <details className="card min-w-0 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">{bn ? 'প্রতিটি তথ্যের তুলনা (লেনদেন · রেজিস্ট্রেশন · নামজারি)' : 'Full field-by-field comparison (transaction · registration · mutation)'}</summary>
        <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[600px] text-sm">
          <thead className="text-xs text-slate-500"><tr><th className="p-2 text-left">{bn ? 'তথ্য' : 'Field'}</th><th className="text-left">{bn ? 'লেনদেন' : 'Transaction'}</th><th className="text-left">{bn ? 'রেজিস্ট্রেশন' : 'Registration'}</th><th className="text-left">{bn ? 'নামজারি' : 'Mutation'}</th></tr></thead>
          <tbody>{c.rows.map((r) => (
            <tr key={r.field} className={`border-t border-slate-100 ${r.match === false ? 'bg-red-50' : ''}`}><td className="flex items-center gap-2 p-2 font-semibold text-slate-600"><Icon m={r.match} />{field(r.field)}</td><td>{value(r.field, r.transaction)}</td>
              <td className={r.registration_match === false ? 'font-bold text-red-600' : ''}>{value(r.field, r.registration)}</td><td className={r.mutation_match === false ? 'font-bold text-red-600' : ''}>{value(r.field, r.mutation)}</td></tr>))}</tbody></table></div>
        <p className="mt-2 text-xs text-slate-400">{bn ? 'রেজিস্ট্রেশনের তথ্য লেনদেনের সঙ্গে এবং নামজারির তথ্য রেজিস্ট্রেশনের সঙ্গে মিলতে হবে। জমির পরিমাণে ০.০১ শতক পর্যন্ত পার্থক্য গ্রহণযোগ্য।' : 'Registration should match the transaction; mutation should match the registration. Area tolerance 0.01 decimal.'}</p>
      </details>
    </div>
  )
}
