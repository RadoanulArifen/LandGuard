import { useOutletContext } from 'react-router-dom'
import { AlertOctagon } from 'lucide-react'
import { LEVEL_COLOR } from '../utils/format'
import { useLanguage } from '../i18n'
import { banglaDisplay } from '../utils/banglaText'

const FEATURE_LABELS = {
  mutation_owner_match: 'নামজারির মালিক বনাম রেজিস্ট্রির ক্রেতা', mutation_previous_match: 'নামজারির আগের মালিক বনাম রেজিস্ট্রির বিক্রেতা',
  mutation_area_diff: 'নামজারির জমির পরিমাণ বনাম রেজিস্ট্রির জমির পরিমাণ', mutation_share_diff: 'নামজারির অংশ বনাম হস্তান্তরিত অংশ',
  mutation_type_match: 'নামজারির ধরন বনাম রেজিস্ট্রেশনের ধরন', has_mutation: 'নামজারির নথি রয়েছে',
  registration_buyer_match: 'রেজিস্ট্রির ক্রেতা বনাম লেনদেনের ক্রেতা', registration_seller_match: 'রেজিস্ট্রির বিক্রেতা বনাম লেনদেনের বিক্রেতা',
  registration_area_diff: 'রেজিস্ট্রির জমির পরিমাণ বনাম লেনদেনের জমির পরিমাণ', registration_type_match: 'রেজিস্ট্রেশনের ধরন বনাম লেনদেনের ধরন',
  has_registration: 'রেজিস্ট্রেশনের নথি রয়েছে', ownership_chain_consistent: 'মালিকানার ধারাবাহিকতা',
  seller_prior_share_sold: 'এই বিক্রেতার আগেই বিক্রি করা অংশ', seller_prior_txns_on_parcel: 'এই জমিতে বিক্রেতার আগের লেনদেন',
  share_ratio: 'হস্তান্তরিত অংশ বনাম বিক্রেতার নথিভুক্ত অংশ', transferred_share: 'হস্তান্তরিত অংশ', seller_share_before: 'বিক্রেতার নথিভুক্ত অংশ',
  transferred_area_ratio: 'হস্তান্তরিত জমির পরিমাণ বনাম জমির মোট পরিমাণ', days_since_previous_transfer: 'আগের হস্তান্তরের পর সময়ের ব্যবধান',
  has_previous_transfer: 'আগের হস্তান্তর রয়েছে', average_transfer_interval: 'হস্তান্তরের গড় ব্যবধান',
  reg_minus_txn_days: 'লেনদেন ও রেজিস্ট্রেশনের তারিখের ব্যবধান', mut_minus_reg_days: 'রেজিস্ট্রেশন ও নামজারির তারিখের ব্যবধান',
  registration_delay_days: 'রেজিস্ট্রেশনে বিলম্ব', mutation_delay_days: 'নামজারিতে বিলম্ব', parcel_transaction_count: 'বারবার হস্তান্তরের ইতিহাস',
  ownership_change_count: 'মালিকানা পরিবর্তনের সংখ্যা', ownership_sequence: 'মালিকানার ধারাবাহিকতায় অবস্থান', transaction_frequency: 'হস্তান্তরের হার',
}
const PRIORITY = { Critical: 'গুরুতর', High: 'উচ্চ', Medium: 'মাঝারি', Low: 'নিম্ন' }
const EXPLANATIONS = {
  mutation_owner_match: 'নামজারির নথি নেই, তাই নতুন মালিক নিশ্চিত করা যাচ্ছে না।', mutation_previous_match: 'নামজারিতে উল্লেখিত আগের মালিক রেজিস্ট্রিতে উল্লেখিত বিক্রেতার সঙ্গে মেলে না।',
  has_mutation: 'এই লেনদেনের সঙ্গে কোনো নামজারির নথি সংযুক্ত নেই।', has_registration: 'এই লেনদেনের সঙ্গে কোনো রেজিস্ট্রেশন নথি সংযুক্ত নেই।',
  registration_buyer_match: 'রেজিস্ট্রিতে উল্লেখিত ক্রেতা লেনদেনের ক্রেতার সঙ্গে মেলে না।', registration_seller_match: 'রেজিস্ট্রিতে উল্লেখিত বিক্রেতা লেনদেনের বিক্রেতার সঙ্গে মেলে না।',
  registration_type_match: 'রেজিস্ট্রেশনের ধরন লেনদেনের ধরনের সঙ্গে মেলে না।', mutation_type_match: 'নামজারির ধরন রেজিস্ট্রেশনের ধরনের সঙ্গে মেলে না।',
  ownership_chain_consistent: 'নথিভুক্ত বিক্রেতা নথিভুক্ত আগের মালিকের সঙ্গে মেলে না।', seller_prior_txns_on_parcel: 'এই বিক্রেতা আগে একই জমিতে হস্তান্তর করেছেন।',
  has_previous_transfer: 'আগের হস্তান্তরের সঙ্গে সময়ের ব্যবধান স্বাভাবিক।', reg_minus_txn_days: 'নথির তারিখগুলো প্রত্যাশিত ধারাবাহিকতায় নেই।', mut_minus_reg_days: 'নথির তারিখগুলো প্রত্যাশিত ধারাবাহিকতায় নেই।',
  parcel_transaction_count: 'জমিটির নথিতে একাধিক হস্তান্তর রয়েছে।', ownership_change_count: 'এই জমিতে একাধিকবার মালিকানা পরিবর্তিত হয়েছে।',
}
function explanation(f) {
  const exact = {
    'No mutation record exists, so the new owner cannot be confirmed.': 'নামজারির নথি নেই, তাই নতুন মালিক নিশ্চিত করা যাচ্ছে না.',
    'Mutation owner differs from the registered buyer.': 'নামজারির মালিক রেজিস্ট্রির ক্রেতার সঙ্গে মেলে না.', 'Mutation owner matches the registered buyer.': 'নামজারির মালিক রেজিস্ট্রির ক্রেতার সঙ্গে মেলে.',
    'Mutation previous owner differs from the registered seller.': 'নামজারিতে উল্লেখিত আগের মালিক রেজিস্ট্রিতে উল্লেখিত বিক্রেতার সঙ্গে মেলে না.', 'Mutation previous owner matches the registered seller.': 'নামজারিতে উল্লেখিত আগের মালিক রেজিস্ট্রিতে উল্লেখিত বিক্রেতার সঙ্গে মেলে.',
    'No mutation record to compare the area with.': 'জমির পরিমাণ তুলনা করার মতো নামজারির নথি নেই.', 'Mutated area matches the registered area.': 'নামজারিতে থাকা জমির পরিমাণ রেজিস্ট্রির জমির পরিমাণের সঙ্গে মেলে.',
    'Mutation share matches.': 'নামজারিতে থাকা অংশের সঙ্গে হস্তান্তরিত অংশ মেলে.', 'Mutation type differs from the registration type.': 'নামজারির ধরন রেজিস্ট্রেশনের ধরনের সঙ্গে মেলে না.', 'Mutation type matches the registration.': 'নামজারির ধরন রেজিস্ট্রেশনের ধরনের সঙ্গে মেলে.',
    'A mutation record exists.': 'নামজারির নথি রয়েছে.', 'No registration record exists for this transaction.': 'এই লেনদেনের সঙ্গে কোনো রেজিস্ট্রেশন নথি নেই.',
    'Registered buyer differs from the transaction buyer.': 'রেজিস্ট্রিতে উল্লেখিত ক্রেতা লেনদেনের ক্রেতার সঙ্গে মেলে না.', 'Registered buyer matches.': 'রেজিস্ট্রিতে উল্লেখিত ক্রেতা লেনদেনের ক্রেতার সঙ্গে মেলে.',
    'Registered seller differs from the transaction seller.': 'রেজিস্ট্রিতে উল্লেখিত বিক্রেতা লেনদেনের বিক্রেতার সঙ্গে মেলে না.', 'Registered seller matches.': 'রেজিস্ট্রিতে উল্লেখিত বিক্রেতা লেনদেনের বিক্রেতার সঙ্গে মেলে.',
    'No registration record to compare the area with.': 'জমির পরিমাণ তুলনা করার মতো রেজিস্ট্রেশনের নথি নেই.', 'Registered area matches.': 'রেজিস্ট্রির জমির পরিমাণ লেনদেনের জমির পরিমাণের সঙ্গে মেলে.',
    'Registration type differs from the transaction type.': 'রেজিস্ট্রেশনের ধরন লেনদেনের ধরনের সঙ্গে মেলে না.', 'Registration type matches.': 'রেজিস্ট্রেশনের ধরন লেনদেনের ধরনের সঙ্গে মেলে.',
    'A registration record exists.': 'রেজিস্ট্রেশনের নথি রয়েছে.', 'Seller matches the recorded previous owner.': 'বিক্রেতা নথিভুক্ত আগের মালিকের সঙ্গে মেলে.',
    'This seller had earlier sales on the same parcel.': 'এই বিক্রেতা আগে একই জমিতে বিক্রি করেছেন.', 'No earlier sales by this seller on this parcel.': 'এই বিক্রেতার একই জমিতে আগের কোনো বিক্রির নথি নেই.',
    'Transfer interval looks typical.': 'হস্তান্তরের সময়ের ব্যবধান স্বাভাবিক মনে হচ্ছে.', 'No earlier transfer to compare with.': 'তুলনা করার মতো আগের কোনো হস্তান্তর নেই.',
    'Record dates are out of the expected order.': 'নথির তারিখগুলো প্রত্যাশিত ধারাবাহিকতায় নেই.', 'Record dates are in the expected order.': 'নথির তারিখগুলো প্রত্যাশিত ধারাবাহিকতায় রয়েছে.',
  }[f.explanation]
  if (exact) return exact
  if (EXPLANATIONS[f.feature]) return EXPLANATIONS[f.feature]
  const area = f.explanation?.match(/(?:Mutated area differs from the registered area|Registered area differs from the transaction area) by ([\d.]+) decimal\./)
  if (area) return `নথিতে জমির পরিমাণ ${banglaDisplay(area[1])} শতক অমিল পাওয়া গেছে।`
  const sold = f.explanation?.match(/This seller had already sold ([\d.]+)% earlier on this parcel\./)
  if (sold) return `এই বিক্রেতা আগে একই জমির ${banglaDisplay(sold[1])}% বিক্রি করেছিলেন।`
  const transfer = f.explanation?.match(/Parcel was transferred again (\d+) day\(s\) after the previous transfer\./)
  if (transfer) return `আগের হস্তান্তরের ${banglaDisplay(transfer[1])} দিন পর জমিটি আবার হস্তান্তর করা হয়েছে।`
  return banglaDisplay(f.explanation || '')
}

function Gauge({ score, level, bn }) {
  const r = 50, c = 2 * Math.PI * r, col = LEVEL_COLOR[level]
  return (
    <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0" role="img" aria-label={bn ? `তদন্তের অগ্রাধিকার ১০০-এর মধ্যে ${banglaDisplay(score)}` : `Investigation priority ${score} out of 100`}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="#fee2e2" strokeWidth="13" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={col} strokeWidth="13" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} transform="rotate(-90 70 70)" />
      <text x="70" y="72" textAnchor="middle" fontSize="34" fontWeight="800" fill="#0f172a">{bn ? banglaDisplay(Math.round(score)) : Math.round(score)}</text>
      <text x="70" y="92" textAnchor="middle" fontSize="11" fill="#64748b">{bn ? '১০০-এর মধ্যে' : 'out of 100'}</text>
    </svg>)
}
const PILL = { Critical: 'bg-red-100 text-red-700 border-red-300', High: 'bg-red-50 text-red-600 border-red-200', Medium: 'bg-amber-50 text-amber-600 border-amber-200', Low: 'bg-emerald-50 text-emerald-600 border-emerald-200' }
const TEXT = { Critical: 'Critical review priority', High: 'High review priority', Medium: 'Medium review priority', Low: 'Low review priority' }

export default function AiAnalysis() {
  const { d } = useOutletContext()
  const { language } = useLanguage()
  const bn = language === 'bn'
  const ex = d.explanation
  const b = d.score_breakdown
  const max = ex?.increasing?.[0]?.share || 1
  return (
    <div className="min-w-0 max-w-3xl space-y-5">
      <div className="card min-w-0 p-4 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">{bn ? 'এআই তদন্তের অগ্রাধিকার' : 'AI Investigation Priority'}</h2>
        <div className="mt-3 flex flex-wrap items-center gap-6">
          <Gauge score={d.priority_score} level={d.priority_level} bn={bn} />
          <div className="min-w-0 flex-1 sm:min-w-[220px]">
            <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-sm font-extrabold uppercase ${PILL[d.priority_level]}`}><AlertOctagon className="h-4 w-4" />{bn ? PRIORITY[d.priority_level] : d.priority_level}</span>
            <p className="mt-2 text-sm text-slate-600">{bn ? `এই লেনদেনের জন্য ${PRIORITY[d.priority_level]} অগ্রাধিকার (মানবীয় পর্যালোচনা প্রয়োজন)। এটি তদন্তের অগ্রাধিকার স্কোর, জালিয়াতির সম্ভাবনা নয়।` : `${TEXT[d.priority_level]} for this transaction (requires human review). This is an Investigation Priority Score, not a fraud probability.`}</p>
            <table className="mt-3 w-full table-fixed text-xs"><tbody>
              <tr className="border-t"><td className="break-words py-1 text-slate-500">{bn ? `নিয়মভিত্তিক প্রমাণ (${banglaDisplay(d.signal_count)}টি সংকেত)` : `Rule evidence (${d.signal_count} signal${d.signal_count === 1 ? '' : 's'})`}</td><td className="w-20 text-right font-semibold">{bn ? banglaDisplay(`${b.rule_points.toFixed(0)} / ${b.rule_cap}`) : `${b.rule_points.toFixed(0)} / ${b.rule_cap}`}</td></tr>
              <tr className="border-t"><td className="py-1 text-slate-500">{bn ? `যন্ত্রশিক্ষার অসংগতি স্কোর (${banglaDisplay((b.ml_score * 100).toFixed(0))}%)` : `ML anomaly score (${(b.ml_score * 100).toFixed(0)}%)`}</td><td className="text-right font-semibold">{bn ? banglaDisplay(`${b.ml_points.toFixed(0)} / ${b.ml_max}`) : `${b.ml_points.toFixed(0)} / ${b.ml_max}`}</td></tr></tbody></table>
          </div>
        </div>
        <h3 className="mb-3 mt-6 font-bold text-slate-800">{bn ? 'এই লেনদেনটি কেন চিহ্নিত হয়েছে?' : 'Why this transaction is flagged?'}</h3>
        {!ex || ex.increasing.length === 0 ? <p className="text-sm text-slate-500">{bn ? 'এই লেনদেন পর্যালোচনার জন্য মডেল কোনো জোরালো কারণ পায়নি।' : 'The model found no strong factor pushing this transaction towards review.'}</p> : (
          <ul className="space-y-2.5">{ex.increasing.map((f) => (
            <li key={f.feature} className="grid grid-cols-[minmax(0,1fr)_minmax(52px,1.5fr)_40px] items-center gap-2 text-xs sm:grid-cols-[minmax(150px,1fr)_2fr_44px] sm:gap-3 sm:text-sm" title={bn ? `SHAP ${banglaDisplay(f.shap_value.toFixed(2))} · ${explanation(f)}` : `SHAP ${f.shap_value.toFixed(2)} · ${f.explanation}`}>
              <span className="break-words text-slate-700">{bn ? (FEATURE_LABELS[f.feature] || banglaDisplay(f.label)) : f.label}</span>
              <span className="h-3 overflow-hidden rounded bg-slate-100"><span className="block h-full rounded bg-sky-500" style={{ width: `${Math.max(5, (f.share / max) * 100)}%` }} /></span>
              <span className="text-right font-mono text-xs text-slate-600">{bn ? banglaDisplay(f.share.toFixed(2)) : f.share.toFixed(2)}</span></li>))}</ul>)}
        {ex?.decreasing?.length > 0 && <p className="mt-3 text-xs text-slate-500">{bn ? 'অগ্রাধিকার কমানোর প্রভাবক: ' : 'Reducing priority: '}{ex.decreasing.map((f) => bn ? (FEATURE_LABELS[f.feature] || banglaDisplay(f.label)) : f.label).join(', ')}.</p>}
        {ex && <p className="mt-2 text-[11px] text-slate-400">{bn ? `বারগুলোতে প্রতিটি বিষয়ের ধনাত্মক SHAP অবদানের অংশ দেখানো হয়েছে (মূল SHAP মান দেখতে কার্সর রাখুন)। মডেল: ${ex.model} (${ex.feature_set === 'records' ? 'নথিভিত্তিক' : banglaDisplay(ex.feature_set)} বৈশিষ্ট্য)।` : `Bars show each factor's share of the positive SHAP contribution (hover for the raw SHAP value). Model: ${ex.model} (${ex.feature_set} features).`}</p>}
      </div>
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 sm:p-5">
        <h3 className="font-bold text-slate-800">{bn ? 'সহজ ভাষায় ব্যাখ্যা' : 'Explanation (Plain Language)'}</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
          {ex?.increasing?.slice(0, 4).map((f) => <li key={f.feature}>{bn ? explanation(f) : f.explanation}</li>)}
          {(!ex || ex.increasing.length === 0) && (d.evidence.length ? d.evidence.map((e, i) => <li key={i}>{e.message}</li>) : <li>{bn ? 'কোনো অসংগতি শনাক্ত হয়নি; যন্ত্রশিক্ষার মডেলও অস্বাভাবিক কিছু দেখেনি।' : 'No integrity signals were raised; the ML model sees nothing unusual.'}</li>)}
        </ul>
        <p className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-600"><b>{bn ? 'প্রস্তাবিত পদক্ষেপ:' : 'Recommended action:'}</b> {bn ? 'মানবীয় পর্যালোচনা প্রয়োজন। কোনো সিদ্ধান্তের আগে অনুমোদিত কর্মকর্তার মূল দলিল ও নামজারির নথি যাচাই করা উচিত। এই বিশ্লেষণ জালিয়াতি নিশ্চিত করে না বা মালিকানা নির্ধারণ করে না।' : 'Human Review Required. An authorised officer should check the source deed and mutation file before any decision. This analysis does not confirm fraud or decide ownership.'}</p>
      </div>
    </div>)
}
