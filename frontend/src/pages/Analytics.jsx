import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Card, ErrorBox, PageHeader, Spinner } from '../components/ui'
import { CHART_COLORS, fmt } from '../utils/format'

const pct = (x) => (x === null || x === undefined ? '—' : `${(x * 100).toFixed(1)}%`)

export default function Analytics() {
  const { data, loading, error, reload } = useApi(() => api.analytics(), [])
  if (loading) return <Spinner label="Loading analytics…" />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  const m = data.model_metrics
  const rows = m && [
    ['Rules only', m.baseline_rules_only], [`ML only (${m.baseline_ml_only.model})`, m.baseline_ml_only], [`LandGuard hybrid (rules + ${m.hybrid_rules_plus_ml.model})`, m.hybrid_rules_plus_ml],
  ]
  return (
    <div>
      <PageHeader title="Analytics" subtitle={`Overall picture across ${fmt(data.total_transactions)} transactions.`} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Normal vs suspicious">
          <ResponsiveContainer width="100%" height={230}><PieChart><Pie data={data.split} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} label={(e) => `${e.percent}%`}>
            {data.split.map((d, i) => <Cell key={d.name} fill={['#22c55e', '#f59e0b', '#ef4444'][i]} />)}</Pie><Tooltip formatter={(v) => fmt(v)} /><Legend /></PieChart></ResponsiveContainer>
        </Card>
        <Card title="Cases by signal" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={230}><BarChart data={data.by_signal} margin={{ bottom: 40 }}><CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={10} interval={0} angle={-20} textAnchor="end" height={60} /><YAxis fontSize={11} /><Tooltip formatter={(v) => fmt(v)} /><Bar dataKey="value" fill="#15803d" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
        </Card>
        <Card title="Top districts by high-priority transactions" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}><BarChart data={data.by_district}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={10} interval={0} angle={-25} textAnchor="end" height={60} /><YAxis fontSize={11} />
            <Tooltip formatter={(v) => fmt(v)} /><Legend /><Bar dataKey="flagged" name="With signals" fill="#f59e0b" /><Bar dataKey="high" name="High / Critical" fill="#ef4444" /></BarChart></ResponsiveContainer>
        </Card>
        <Card title="Signals per transaction">
          <ResponsiveContainer width="100%" height={260}><BarChart data={data.signals_per_transaction}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><Tooltip formatter={(v) => fmt(v)} /><Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
        </Card>
      </div>
      <Card title="By transaction type" className="mt-4">
        <div className="grid gap-3 sm:grid-cols-5">{data.by_type.map((t, i) => (
          <div key={t.name} className="rounded-lg border border-slate-200 p-3"><div className="text-xs font-bold uppercase text-slate-500">{t.name}</div><div className="text-xl font-extrabold">{fmt(t.total)}</div>
            <div className="text-xs" style={{ color: CHART_COLORS[i] }}>{(100 * t.flagged / t.total).toFixed(0)}% with signals</div></div>))}</div>
      </Card>
      {m ? (
        <Card title="Model evaluation (real results from the held-out 20% test split)" className="mt-4">
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">Approach</th><th>Precision</th><th>Recall</th><th>F1</th><th>False-positive rate</th></tr></thead>
            <tbody>{rows.map(([n, v]) => <tr key={n} className="border-t border-slate-100"><td className="py-2 font-semibold">{n}</td><td>{pct(v.precision)}</td><td>{pct(v.recall)}</td><td>{pct(v.f1)}</td><td>{pct(v.false_positive_rate)}</td></tr>)}</tbody></table></div>
          <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">Model / feature set</th><th>Precision</th><th>Recall</th><th>F1</th><th>ROC-AUC</th><th>5-fold CV F1</th><th>TN / FP / FN / TP</th></tr></thead>
            <tbody>{Object.entries(m.models).map(([k, v]) => (
              <tr key={k} className={`border-t border-slate-100 ${k === m.deployed_model ? 'bg-brand-50 font-semibold' : ''}`}>
                <td className="py-2">{k}{k === m.deployed_model && ' (deployed)'}</td><td>{pct(v.test.precision)}</td><td>{pct(v.test.recall)}</td><td>{pct(v.test.f1)}</td><td>{v.test.roc_auc?.toFixed(3)}</td><td>{pct(m.cv[k].f1)}</td>
                <td className="font-mono text-xs">{v.test.confusion_matrix.tn} / {v.test.confusion_matrix.fp} / {v.test.confusion_matrix.fn} / {v.test.confusion_matrix.tp}</td></tr>))}</tbody></table></div>
          <ul className="mt-4 list-inside list-disc space-y-1 text-xs text-slate-500">{m.notes.map((n) => <li key={n}>{n}</li>)}</ul>
        </Card>) : null}
    </div>
  )
}
