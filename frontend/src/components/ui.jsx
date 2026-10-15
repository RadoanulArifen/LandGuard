import { AlertTriangle, Inbox, Loader2 } from 'lucide-react'
import { LEVEL_STYLE, STATUS_STYLE } from '../utils/format'

export const Spinner = ({ label = 'Loading…' }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />{label}</div>
)
export const ErrorBox = ({ error, onRetry }) => (
  <div className="card border-red-200 bg-red-50 p-5 text-red-800">
    <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-5 w-5" />Could not load this page</div>
    <p className="mt-1 text-sm">{error}</p>
    {onRetry && <button className="btn-outline mt-3" onClick={onRetry}>Try again</button>}
  </div>
)
export const Empty = ({ title = 'Nothing to show', hint }) => (
  <div className="card flex flex-col items-center gap-2 p-10 text-center text-slate-500"><Inbox className="h-8 w-8" /><div className="font-semibold text-slate-700">{title}</div>{hint && <div className="text-sm">{hint}</div>}</div>
)
export const LevelBadge = ({ level }) => (
  <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${LEVEL_STYLE[level] || LEVEL_STYLE.Low}`}>{level}</span>
)
export const StatusBadge = ({ status }) => (
  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status] || STATUS_STYLE['No transactions']}`}>{status}</span>
)
export const PageHeader = ({ title, subtitle, right, crumbs }) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div className="min-w-0 flex-1">
      {crumbs && <div className="mb-1 text-xs text-slate-500">{crumbs}</div>}
      <h1 className="break-words text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
      {subtitle && <p className="mt-0.5 break-words text-sm text-slate-500">{subtitle}</p>}
    </div>
    {right}
  </div>
)
export const Disclaimer = () => (
  <p className="mt-6 rounded-lg bg-slate-100 px-4 py-2 text-xs text-slate-500">
    ভূমি প্রহরী is decision-support only. Results show potential inconsistencies for human review; they are not a legal finding or a fraud probability. Synthetic hackathon data.
  </p>
)
export const Card = ({ title, children, className = '', right }) => (
  <div className={`card min-w-0 p-4 sm:p-5 ${className}`}>
    {(title || right) && <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="min-w-0 break-words text-sm font-bold uppercase tracking-wide text-slate-600">{title}</h2>{right}</div>}
    {children}
  </div>
)
export const Pager = ({ total, limit, offset, onChange }) => (
  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 text-sm text-slate-500">
    <span>{total === 0 ? 0 : offset + 1}–{Math.min(offset + limit, total)} of {total.toLocaleString()}</span>
    <div className="flex gap-2">
      <button className="btn-outline py-1" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - limit))}>Previous</button>
      <button className="btn-outline py-1" disabled={offset + limit >= total} onClick={() => onChange(offset + limit)}>Next</button>
    </div>
  </div>
)
