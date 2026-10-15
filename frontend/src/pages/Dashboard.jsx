import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Card, ErrorBox, LevelBadge, PageHeader, Spinner } from '../components/ui'
import { CHART_COLORS, dateFmt, fmt } from '../utils/format'
import { useLanguage } from '../i18n'

const CARDS = [
  ['parcels_analyzed', 'Parcels Analyzed', 'border-sky-200 bg-sky-50 text-sky-700'], ['transactions_analyzed', 'Transactions Analyzed', 'border-slate-200 bg-white text-slate-800'],
  ['high_concern', 'High Concern', 'border-red-200 bg-red-50 text-red-600'], ['review_required', 'Review Required', 'border-orange-200 bg-orange-50 text-orange-600'],
  ['consistent', 'Consistent', 'border-emerald-200 bg-emerald-50 text-emerald-600'],
]
const RISK_COLOR = { Critical: '#b91c1c', High: '#ef4444', Medium: '#f59e0b', Low: '#84cc16', Normal: '#22c55e' }

const DonutWithLegend = ({ data, colorOf }) => {
  const total = data.reduce((a, b) => a + b.value, 0) || 1
  return (
    <div className="flex items-center gap-3">
      <div className="h-32 w-32 shrink-0 sm:h-40 sm:w-40"><ResponsiveContainer width="100%" height="100%"><PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={34} outerRadius={70} paddingAngle={1} stroke="#fff">{data.map((d, i) => <Cell key={d.name} fill={colorOf(d, i)} />)}</Pie>
        <Tooltip formatter={(v) => fmt(v)} /></PieChart></ResponsiveContainer></div>
      <ul className="min-w-0 flex-1 space-y-1 text-[11px] text-slate-600">{data.map((d, i) => (
        <li key={d.name} className="flex items-center gap-1.5"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colorOf(d, i) }} /><span className="truncate">{d.name}</span><span className="ml-auto font-semibold text-slate-800">{Math.round((100 * d.value) / total)}%</span></li>))}</ul>
    </div>
  )
}
const mLabel = (m) => { const [y, mo] = m.split('-'); return new Date(+y, +mo - 1).toLocaleString('en', { month: 'short' }) + " '" + y.slice(2) }

export default function Dashboard() {
  const { language } = useLanguage()
  const { data, loading, error, reload } = useApi(() => api.stats(), [])
  if (loading) return <Spinner label="Loading dashboard…" />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  const monthly = data.monthly_suspicious.map((m) => ({ ...m, label: mLabel(m.m) }))
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Live statistics computed from the imported datasets and the ভূমি প্রহরী engine." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CARDS.map(([k, label, style]) => (
          <div key={k} className={`rounded-xl border p-4 ${style}`}><div className="text-3xl font-extrabold">{data.cards[k].toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}</div><div className="mt-0.5 text-xs font-semibold">{label}</div></div>))}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Alert Distribution"><DonutWithLegend data={data.alert_distribution} colorOf={(_, i) => CHART_COLORS[i % CHART_COLORS.length]} /></Card>
        <Card title="Risk Level Distribution"><DonutWithLegend data={data.risk_distribution} colorOf={(d) => RISK_COLOR[d.name]} /></Card>
        <Card title="Monthly Suspicious Transactions">
          <div className="h-40"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly} margin={{ left: -20, right: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" fontSize={9} interval={0} angle={-35} textAnchor="end" height={42} /><YAxis fontSize={10} />
            <Tooltip formatter={(v) => fmt(v)} /><Bar dataKey="high" name="High / Critical" fill="#3b82f6" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>
          <p className="text-[11px] text-slate-400">High / Critical priority transactions, latest 12 months in the data.</p>
        </Card>
      </div>
      <Card title="Recent Suspicious Transactions" className="mt-4" right={<Link to="/alerts" className="text-sm font-semibold text-brand-700 hover:underline">All alerts →</Link>}>
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-2">Parcel ID</th><th>Type</th><th>Risk Level</th><th>Location</th><th>Date</th><th>Status</th><th /></tr></thead>
          <tbody>{data.recent_suspicious.map((r) => (
            <tr key={r.transaction_id} className="border-t border-slate-100">
              <td className="p-2 font-semibold">{r.parcel_id}</td><td>{r.primary_label}</td><td><LevelBadge level={r.priority_level} /></td>
              <td>{r.upazila}, {r.district}</td><td>{dateFmt(r.transaction_date)}</td>
              <td><span className="rounded border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600">Review</span></td>
              <td><Link className="text-xs font-semibold text-brand-700 hover:underline" to={`/alerts/${r.transaction_id}`}>Open →</Link></td>
            </tr>))}</tbody></table></div>
      </Card>
    </div>
  )
}
