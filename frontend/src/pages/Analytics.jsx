import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Card, ErrorBox, PageHeader, Spinner } from '../components/ui'
import { CHART_COLORS, fmt } from '../utils/format'
import { useLanguage } from '../i18n'

const pct = (x) => (x === null || x === undefined ? '—' : `${(x * 100).toFixed(1)}%`)
const bnValues = {
  Normal: 'স্বাভাবিক', Review: 'পর্যালোচনা', 'High Concern': 'উচ্চ ঝুঁকি',
  'Double-Sale / Overlapping Transfer': 'একাধিক বিক্রি / হস্তান্তরের ওভারল্যাপ',
  'Over-Transfer': 'অতিরিক্ত হস্তান্তর', 'Rapid Transfer': 'দ্রুত হস্তান্তর',
  'Ownership Chain Break': 'মালিকানার ধারাবাহিকতা ভাঙা', 'Registration Mismatch': 'রেজিস্ট্রেশনের অমিল',
  'Registration–Mutation Mismatch': 'রেজিস্ট্রেশন ও নামজারির অমিল', 'Temporal Inconsistency': 'তারিখের অসংগতি',
  GIFT: 'দান', INHERITANCE: 'উত্তরাধিকার', PARTITION: 'বণ্টন', SALE: 'বিক্রয়', TRANSFER: 'হস্তান্তর',
  Chattogram: 'চট্টগ্রাম', Chittagong: 'চট্টগ্রাম', Dhaka: 'ঢাকা', Narayanganj: 'নারায়ণগঞ্জ', Gazipur: 'গাজীপুর',
  Rajshahi: 'রাজশাহী', Khulna: 'খুলনা', Sylhet: 'সিলেট', Cumilla: 'কুমিল্লা', Bogura: 'বগুড়া', Mymensingh: 'ময়মনসিংহ', Tangail: 'টাঙ্গাইল', Barishal: 'বরিশাল',
}
const bnNotes = {
  'fraud_labels.csv is synthetic ground truth derived from deterministic rules over the same records.': 'fraud_labels.csv একই নথিতে নির্দিষ্ট নিয়ম প্রয়োগ করে তৈরি কৃত্রিম সত্য-মান।',
  "'pattern' = raw history/timing features only; 'records' adds record-comparison features; 'full' adds the rule signals and is shown only to demonstrate label leakage.": "'pattern'-এ শুধু ইতিহাস ও সময়ের বৈশিষ্ট্য আছে; 'records'-এ নথি তুলনার বৈশিষ্ট্য যোগ হয়; 'full'-এ নিয়মের সংকেতও থাকে, যা শুধু লেবেল লিকেজ দেখানোর জন্য।",
  'Stored ML scores are 5-fold out-of-fold predictions, so no transaction is scored by a model that saw its label.': 'সংরক্ষিত ML স্কোর ৫-ভাঁজ out-of-fold পূর্বাভাস; কোনো লেনদেনের লেবেল দেখা মডেল সেটির স্কোর দেয়নি।',
  'The Investigation Priority Score is NOT a fraud probability.': 'তদন্তের অগ্রাধিকার স্কোর জালিয়াতির সম্ভাবনা নয়।',
}

export default function Analytics() {
  const { language } = useLanguage()
  const bn = language === 'bn'
  const t = (en, bnText) => bn ? bnText : en
  const chartData = (items) => items?.map((item) => ({ ...item, name: bn ? (bnValues[item.name] || item.name) : item.name }))
  const { data, loading, error, reload } = useApi(() => api.analytics(), [])
  if (loading) return <Spinner label="Loading analytics…" />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  const m = data.model_metrics
  const rows = m && [
    [t('Rules only', 'শুধু নিয়ম'), m.baseline_rules_only], [`${t('ML only', 'শুধু ML')} (${m.baseline_ml_only.model})`, m.baseline_ml_only], [`ভূমি প্রহরী ${t('hybrid (rules +', 'সমন্বিত (নিয়ম +')} ${m.hybrid_rules_plus_ml.model})`, m.hybrid_rules_plus_ml],
  ]
  return (
    <div>
      <PageHeader title={t('Analytics', 'বিশ্লেষণ')} subtitle={t(`Overall picture across ${fmt(data.total_transactions)} transactions.`, `${fmt(data.total_transactions)}টি লেনদেনের সার্বিক চিত্র।`)} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title={t('Normal vs suspicious', 'স্বাভাবিক বনাম সন্দেহজনক')}>
          <ResponsiveContainer width="100%" height={230}><PieChart><Pie data={chartData(data.split)} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} label={(e) => `${e.percent}%`}>
            {data.split.map((d, i) => <Cell key={d.name} fill={['#22c55e', '#f59e0b', '#ef4444'][i]} />)}</Pie><Tooltip formatter={(v) => fmt(v)} /><Legend /></PieChart></ResponsiveContainer>
        </Card>
        <Card title={t('Cases by signal', 'সংকেত অনুযায়ী ঘটনা')} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={230}><BarChart data={chartData(data.by_signal)} margin={{ bottom: 40 }}><CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={10} interval={0} angle={-20} textAnchor="end" height={60} /><YAxis fontSize={11} /><Tooltip formatter={(v) => fmt(v)} /><Bar dataKey="value" fill="#15803d" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
        </Card>
        <Card title={t('Top districts by high-priority transactions', 'উচ্চ অগ্রাধিকারের লেনদেন অনুযায়ী শীর্ষ জেলা')} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}><BarChart data={chartData(data.by_district)}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={10} interval={0} angle={-25} textAnchor="end" height={60} /><YAxis fontSize={11} />
            <Tooltip formatter={(v) => fmt(v)} /><Legend /><Bar dataKey="flagged" name={t('With signals', 'সংকেতসহ')} fill="#f59e0b" /><Bar dataKey="high" name={t('High / Critical', 'উচ্চ / গুরুতর')} fill="#ef4444" /></BarChart></ResponsiveContainer>
        </Card>
        <Card title={t('Signals per transaction', 'প্রতি লেনদেনে সংকেত')}>
          <ResponsiveContainer width="100%" height={260}><BarChart data={data.signals_per_transaction}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><Tooltip formatter={(v) => fmt(v)} /><Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
        </Card>
      </div>
      <Card title={t('By transaction type', 'লেনদেনের ধরন অনুযায়ী')} className="mt-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">{data.by_type.map((item, i) => (
          <div key={item.name} className="rounded-lg border border-slate-200 p-3"><div className="text-xs font-bold uppercase text-slate-500">{bn ? (bnValues[item.name] || item.name) : item.name}</div><div className="text-xl font-extrabold">{fmt(item.total)}</div>
            <div className="text-xs" style={{ color: CHART_COLORS[i] }}>{(100 * item.flagged / item.total).toFixed(0)}% {t('with signals', 'সংকেত রয়েছে')}</div></div>))}</div>
      </Card>
      {m ? (
        <Card title={t('Model evaluation (real results from the held-out 20% test split)', 'মডেল মূল্যায়ন (আলাদা রাখা ২০% পরীক্ষামূলক ডেটার ফলাফল)')} className="mt-4">
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">{t('Approach', 'পদ্ধতি')}</th><th>{t('Precision', 'নির্ভুলতা')}</th><th>{t('Recall', 'রিকল')}</th><th>F1</th><th>{t('False-positive rate', 'ভুল ইতিবাচক ফলের হার')}</th></tr></thead>
            <tbody>{rows.map(([n, v]) => <tr key={n} className="border-t border-slate-100"><td className="py-2 font-semibold">{n}</td><td>{pct(v.precision)}</td><td>{pct(v.recall)}</td><td>{pct(v.f1)}</td><td>{pct(v.false_positive_rate)}</td></tr>)}</tbody></table></div>
          <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">{t('Model / feature set', 'মডেল / বৈশিষ্ট্যের সেট')}</th><th>{t('Precision', 'নির্ভুলতা')}</th><th>{t('Recall', 'রিকল')}</th><th>F1</th><th>ROC-AUC</th><th>5-fold CV F1</th><th>TN / FP / FN / TP</th></tr></thead>
            <tbody>{Object.entries(m.models).map(([k, v]) => (
              <tr key={k} className={`border-t border-slate-100 ${k === m.deployed_model ? 'bg-brand-50 font-semibold' : ''}`}>
                <td className="py-2">{k}{k === m.deployed_model && ` (${t('deployed', 'চালু')})`}</td><td>{pct(v.test.precision)}</td><td>{pct(v.test.recall)}</td><td>{pct(v.test.f1)}</td><td>{v.test.roc_auc?.toFixed(3)}</td><td>{pct(m.cv[k].f1)}</td>
                <td className="font-mono text-xs">{v.test.confusion_matrix.tn} / {v.test.confusion_matrix.fp} / {v.test.confusion_matrix.fn} / {v.test.confusion_matrix.tp}</td></tr>))}</tbody></table></div>
          <ul className="mt-4 list-inside list-disc space-y-1 text-xs text-slate-500">{m.notes.map((n) => <li key={n}>{bn ? (bnNotes[n] || n) : n}</li>)}</ul>
        </Card>) : null}
    </div>
  )
}
