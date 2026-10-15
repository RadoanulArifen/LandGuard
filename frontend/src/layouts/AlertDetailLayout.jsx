import { useState } from 'react'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { Download, RefreshCw } from 'lucide-react'
import { api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { ErrorBox, Spinner } from '../components/ui'
import { SIGNAL_SUBTITLE } from '../utils/format'
import { useLanguage } from '../i18n'
import { banglaDisplay, evidenceMessage, evidenceTitle } from '../utils/banglaText'

const TABS = [['', 'Evidence'], ['comparison', 'Registration vs Mutation'], ['ai', 'AI Analysis']]
const PILL = { Critical: 'bg-red-100 text-red-700 border-red-300', High: 'bg-red-50 text-red-600 border-red-200', Medium: 'bg-amber-50 text-amber-600 border-amber-200', Low: 'bg-yellow-50 text-yellow-600 border-yellow-200' }

export default function AlertDetailLayout() {
  const { tid } = useParams()
  const { data, loading, error, reload } = useApi(() => api.alert(tid), [tid])
  const [live, setLive] = useState(null)
  const [busy, setBusy] = useState(false)
  const [liveErr, setLiveErr] = useState(null)
  const { language } = useLanguage()
  const bn = language === 'bn'
  const rerun = async () => { setBusy(true); setLiveErr(null); try { setLive(await api.investigate(tid)) } catch (e) { setLiveErr(e.message) } finally { setBusy(false) } }
  if (loading) return <Spinner label="Loading investigation…" />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  const d = live || data
  const title = d.primary_signal ? (bn ? evidenceTitle(d.primary_signal, d.primary_label) : d.primary_label) : (bn ? 'কোনো অসংগতি শনাক্ত হয়নি' : 'No integrity signal')
  const subtitleBn = { double_sale: 'একই জমির অংশ একাধিক ক্রেতার কাছে হস্তান্তর করা হয়েছে বলে মনে হচ্ছে।', over_transfer: 'বিক্রেতার নথিভুক্ত মালিকানার চেয়ে বেশি জমি বা অংশ হস্তান্তর করা হয়েছে বলে দেখা যাচ্ছে।', rapid_transfer: 'অল্প সময়ের মধ্যে জমিটি আবার হস্তান্তর করা হয়েছে।', ownership_chain_break: 'নথিভুক্ত বিক্রেতার তথ্য আগের মালিকের তথ্যের সঙ্গে মেলে না।', registration_mismatch: 'রেজিস্ট্রেশনের নথির তথ্য লেনদেনের তথ্যের সঙ্গে মেলে না।', mutation_mismatch: 'নামজারির নথির তথ্য রেজিস্ট্রেশনের তথ্যের সঙ্গে মেলে না।', temporal_inconsistency: 'নথিগুলোর তারিখ প্রত্যাশিত ধারাবাহিকতায় নেই।' }
  const priorityBn = { Critical: 'গুরুতর', High: 'উচ্চ', Medium: 'মাঝারি', Low: 'নিম্ন' }
  return (
    <div>
      <div className="mb-3 text-xs text-slate-500"><Link to="/alerts" className="hover:underline">{bn ? 'সতর্কতা' : 'Alerts'}</Link> › {title} › {tid}</div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-lg font-bold text-white">!</span>
          <div>
            <div className="flex flex-wrap items-center gap-2"><h1 className="break-words text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1><span className={`rounded border px-2 py-0.5 text-xs font-bold ${PILL[d.priority_level]}`}>{bn ? priorityBn[d.priority_level] : d.priority_level}</span></div>
            <p className="break-words text-sm text-slate-500">{bn ? (subtitleBn[d.primary_signal] || evidenceMessage({ message: d.problem })) : (SIGNAL_SUBTITLE[d.primary_signal] || d.problem)}</p>
            <p className="mt-0.5 text-xs text-slate-400">{bn ? 'লেনদেন' : 'Transaction'} {tid} · {bn ? 'জমি' : 'Parcel'} <Link className="text-brand-700 underline" to={`/parcel/${d.parcel_id}/overview`}>{d.parcel_id}</Link> · {bn ? 'অগ্রাধিকার' : 'Priority'} {bn ? banglaDisplay(d.priority_score.toFixed(0)) : d.priority_score.toFixed(0)} / {bn ? '১০০' : '100'}</p>
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <button className="btn-outline flex-1 sm:flex-none" onClick={rerun} disabled={busy}><RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />{busy ? (bn ? 'তদন্ত চলছে…' : 'Investigating…') : (bn ? 'আবার তদন্ত করুন' : 'Re-run investigation')}</button>
          <a className="btn-primary flex-1 sm:flex-none" href={api.reportUrl(tid)}><Download className="h-4 w-4" />{bn ? 'PDF প্রতিবেদন' : 'Report PDF'}</a>
        </div>
      </div>
      {liveErr && <div className="mb-3"><ErrorBox error={liveErr} /></div>}
      {live && <div className="mb-3 rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-800">{bn ? 'সংরক্ষিত নথি দিয়ে এইমাত্র আবার তদন্ত চালানো হয়েছে। নিয়মভিত্তিক বিশ্লেষণ নতুন করে হয়েছে; যন্ত্রশিক্ষার স্কোরটি সংরক্ষিত আগের স্কোর।' : 'Investigation re-run on the stored records just now. The rule engine ran again; the ML score is the stored out-of-fold score.'}</div>}
      <div className="mb-5 flex max-w-full overflow-x-auto rounded-lg border border-slate-300 bg-white">
        {TABS.map(([to, label], i) => (
          <NavLink key={label} to={to} end className={({ isActive }) => `shrink-0 whitespace-nowrap px-3 py-2 text-xs font-semibold sm:px-4 sm:text-sm ${i > 0 ? 'border-l border-slate-300' : ''} ${isActive ? 'bg-brand-50 text-brand-700 shadow-[inset_0_-2px_0_0_#16a34a]' : 'text-slate-600 hover:bg-slate-50'}`}>{bn ? ({ Evidence: 'প্রমাণ', 'Registration vs Mutation': 'রেজিস্ট্রেশন বনাম নামজারি', 'AI Analysis': 'এআই বিশ্লেষণ' }[label]) : label}</NavLink>))}
      </div>
      <Outlet context={{ d }} />
    </div>
  )
}
