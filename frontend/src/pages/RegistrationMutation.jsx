import { useOutletContext } from 'react-router-dom'
import { AlertCircle, CheckCircle2, MinusCircle } from 'lucide-react'

const find = (c, f) => c.rows.find((r) => r.field === f)
function Rec({ title, head, rows }) {
  return (
    <div className="card overflow-hidden">
      <div className={`px-5 py-3 text-lg font-bold ${head}`}>{title}</div>
      <dl>{rows.map(([k, v, bad]) => (
        <div key={k} className="flex justify-between gap-4 border-b border-slate-100 px-5 py-2.5 text-sm last:border-0"><dt className="text-slate-500">{k}</dt><dd className={`text-right font-semibold ${bad ? 'text-red-600' : 'text-slate-800'}`}>{v}</dd></div>))}</dl>
    </div>)
}
const Icon = ({ m }) => m === null ? <MinusCircle className="h-4 w-4 text-slate-300" /> : m ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />

export default function RegistrationMutation() {
  const { d } = useOutletContext()
  const c = d.comparison
  const g = (f) => find(c, f)
  const bad = c.rows.filter((r) => r.match === false)
  const rr = (f, side) => [f, g(f)[side], g(f)[side === 'registration' ? 'registration_match' : 'mutation_match'] === false]
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Rec title="Registration Record" head="bg-sky-100 text-sky-900" rows={[
          ['Transaction ID', c.transaction_id, false], ['Registration ID', g('Record ID').registration, !c.has_registration], ['Seller', g('Seller / Previous owner').registration, g('Seller / Previous owner').registration_match === false],
          ['Buyer', g('Buyer / New owner').registration, g('Buyer / New owner').registration_match === false], ['Area (Decimal)', g('Area (decimal)').registration, g('Area (decimal)').registration_match === false],
          ['Date', g('Date').registration, g('Date').registration_match === false], ['Document No.', g('Document / reference').registration, false]]} />
        <Rec title="Mutation Record" head="bg-emerald-100 text-emerald-900" rows={[
          ['Mutation ID', g('Record ID').mutation, !c.has_mutation], ['Previous Owner', g('Seller / Previous owner').mutation, g('Seller / Previous owner').mutation_match === false],
          ['New Owner', g('Buyer / New owner').mutation, g('Buyer / New owner').mutation_match === false], ['Area (Decimal)', g('Area (decimal)').mutation, g('Area (decimal)').mutation_match === false],
          ['Date', g('Date').mutation, g('Date').mutation_match === false], ['Status', g('Status').mutation, false], ['Reference', g('Document / reference').mutation, false]]} />
      </div>
      {bad.length > 0 ? (
        <div className="card border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2 font-bold text-red-600"><AlertCircle className="h-5 w-5" />{bad.length} inconsistenc{bad.length === 1 ? 'y' : 'ies'} detected</div>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-red-700">{bad.map((r) => (
            <li key={r.field}><b>{r.field}</b>: transaction “{r.transaction}”, registration “{r.registration}”, mutation “{r.mutation}”</li>))}</ol>
        </div>) : <div className="card border-emerald-200 bg-emerald-50 p-5 font-semibold text-emerald-700">Registration and mutation records agree with the transaction.</div>}
      <details className="card p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Full field-by-field comparison (transaction · registration · mutation)</summary>
        <div className="mt-3 overflow-x-auto"><table className="w-full text-sm">
          <thead className="text-xs text-slate-500"><tr><th className="p-2 text-left">Field</th><th className="text-left">Transaction</th><th className="text-left">Registration</th><th className="text-left">Mutation</th></tr></thead>
          <tbody>{c.rows.map((r) => (
            <tr key={r.field} className={`border-t border-slate-100 ${r.match === false ? 'bg-red-50' : ''}`}><td className="flex items-center gap-2 p-2 font-semibold text-slate-600"><Icon m={r.match} />{r.field}</td><td>{r.transaction}</td>
              <td className={r.registration_match === false ? 'font-bold text-red-600' : ''}>{r.registration}</td><td className={r.mutation_match === false ? 'font-bold text-red-600' : ''}>{r.mutation}</td></tr>))}</tbody></table></div>
        <p className="mt-2 text-xs text-slate-400">Registration should match the transaction; mutation should match the registration. Area tolerance 0.01 decimal.</p>
      </details>
    </div>
  )
}
