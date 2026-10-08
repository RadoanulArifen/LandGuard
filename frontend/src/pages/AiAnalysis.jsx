import { useOutletContext } from 'react-router-dom'
import { AlertOctagon } from 'lucide-react'
import { LEVEL_COLOR } from '../utils/format'

function Gauge({ score, level }) {
  const r = 50, c = 2 * Math.PI * r, col = LEVEL_COLOR[level]
  return (
    <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0" role="img" aria-label={`Investigation priority ${score} out of 100`}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="#fee2e2" strokeWidth="13" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={col} strokeWidth="13" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} transform="rotate(-90 70 70)" />
      <text x="70" y="72" textAnchor="middle" fontSize="34" fontWeight="800" fill="#0f172a">{Math.round(score)}</text>
      <text x="70" y="92" textAnchor="middle" fontSize="11" fill="#64748b">out of 100</text>
    </svg>)
}
const PILL = { Critical: 'bg-red-100 text-red-700 border-red-300', High: 'bg-red-50 text-red-600 border-red-200', Medium: 'bg-amber-50 text-amber-600 border-amber-200', Low: 'bg-emerald-50 text-emerald-600 border-emerald-200' }
const TEXT = { Critical: 'Critical review priority', High: 'High review priority', Medium: 'Medium review priority', Low: 'Low review priority' }

export default function AiAnalysis() {
  const { d } = useOutletContext()
  const ex = d.explanation
  const b = d.score_breakdown
  const max = ex?.increasing?.[0]?.share || 1
  return (
    <div className="max-w-3xl space-y-5">
      <div className="card p-6">
        <h2 className="text-lg font-bold text-slate-900">AI Investigation Priority</h2>
        <div className="mt-3 flex flex-wrap items-center gap-6">
          <Gauge score={d.priority_score} level={d.priority_level} />
          <div className="min-w-[220px] flex-1">
            <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-sm font-extrabold uppercase ${PILL[d.priority_level]}`}><AlertOctagon className="h-4 w-4" />{d.priority_level}</span>
            <p className="mt-2 text-sm text-slate-600">{TEXT[d.priority_level]} for this transaction (requires human review). This is an Investigation Priority Score, not a fraud probability.</p>
            <table className="mt-3 w-full text-xs"><tbody>
              <tr className="border-t"><td className="py-1 text-slate-500">Rule evidence ({d.signal_count} signal{d.signal_count === 1 ? '' : 's'})</td><td className="text-right font-semibold">{b.rule_points.toFixed(0)} / {b.rule_cap}</td></tr>
              <tr className="border-t"><td className="py-1 text-slate-500">ML anomaly score ({(b.ml_score * 100).toFixed(0)}%)</td><td className="text-right font-semibold">{b.ml_points.toFixed(0)} / {b.ml_max}</td></tr></tbody></table>
          </div>
        </div>
        <h3 className="mb-3 mt-6 font-bold text-slate-800">Why this transaction is flagged?</h3>
        {!ex || ex.increasing.length === 0 ? <p className="text-sm text-slate-500">The model found no strong factor pushing this transaction towards review.</p> : (
          <ul className="space-y-2.5">{ex.increasing.map((f) => (
            <li key={f.feature} className="grid grid-cols-[minmax(150px,1fr)_2fr_44px] items-center gap-3 text-sm" title={`SHAP ${f.shap_value.toFixed(2)} · ${f.explanation}`}>
              <span className="text-slate-700">{f.label}</span>
              <span className="h-3 overflow-hidden rounded bg-slate-100"><span className="block h-full rounded bg-sky-500" style={{ width: `${Math.max(5, (f.share / max) * 100)}%` }} /></span>
              <span className="text-right font-mono text-xs text-slate-600">{f.share.toFixed(2)}</span></li>))}</ul>)}
        {ex?.decreasing?.length > 0 && <p className="mt-3 text-xs text-slate-500">Reducing priority: {ex.decreasing.map((f) => f.label).join(', ')}.</p>}
        {ex && <p className="mt-2 text-[11px] text-slate-400">Bars show each factor's share of the positive SHAP contribution (hover for the raw SHAP value). Model: {ex.model} ({ex.feature_set} features).</p>}
      </div>
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-5">
        <h3 className="font-bold text-slate-800">Explanation (Plain Language)</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
          {ex?.increasing?.slice(0, 4).map((f) => <li key={f.feature}>{f.explanation}</li>)}
          {(!ex || ex.increasing.length === 0) && (d.evidence.length ? d.evidence.map((e, i) => <li key={i}>{e.message}</li>) : <li>No integrity signals were raised; the ML model sees nothing unusual.</li>)}
        </ul>
        <p className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-600"><b>Recommended action:</b> Human Review Required. An authorised officer should check the source deed and mutation file before any decision. This analysis does not confirm fraud or decide ownership.</p>
      </div>
    </div>)
}
