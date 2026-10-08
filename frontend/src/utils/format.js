export const LEVEL_STYLE = {
  Critical: 'bg-red-100 text-red-800 border-red-300',
  High: 'bg-red-50 text-red-700 border-red-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}
export const LEVEL_LABEL = { Critical: 'Critical Review Priority', High: 'High Review Priority', Medium: 'Medium Review Priority', Low: 'Low Review Priority' }
export const LEVEL_COLOR = { Critical: '#b91c1c', High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' }
export const STATUS_STYLE = {
  'High Concern': 'bg-red-50 text-red-700 border-red-200',
  'Review Required': 'bg-amber-50 text-amber-700 border-amber-200',
  Consistent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Conflict Detected': 'bg-red-50 text-red-700 border-red-200',
  'No transactions': 'bg-slate-100 text-slate-600 border-slate-200',
}
export const SIGNAL_OPTIONS = [
  ['double_sale', 'Double-Sale'], ['over_transfer', 'Over-Transfer'], ['rapid_transfer', 'Rapid Transfer'],
  ['ownership_chain_break', 'Ownership Chain Break'], ['registration_mismatch', 'Registration Mismatch'],
  ['mutation_mismatch', 'Registration–Mutation Mismatch'], ['temporal_inconsistency', 'Temporal Inconsistency'],
]
export const CHART_COLORS = ['#15803d', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#64748b']
export const fmt = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString())
export const dec = (n, d = 2) => (n === null || n === undefined ? '—' : Number(n).toFixed(d).replace(/\.?0+$/, ''))
export const dateFmt = (s) => (s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
export const SIGNAL_SUBTITLE = {
  double_sale: 'The same interest appears to have been transferred to more than one buyer.',
  over_transfer: 'Recorded ownership is lower than cumulative transferred area.',
  ownership_chain_break: 'The recorded seller does not match the recorded previous owner.',
  registration_mismatch: 'The registration record does not agree with the transaction record.',
  mutation_mismatch: 'The mutation record does not agree with the registration record.',
  temporal_inconsistency: 'Record dates are not in the expected order.',
  rapid_transfer: 'The parcel was transferred again after a very short interval.',
}
