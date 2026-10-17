import { useState } from 'react'
import { KeyRound, LogOut, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [feedback, setFeedback] = useState(null)
  async function changePassword(event) {
    event.preventDefault(); setFeedback(null)
    if (next.length < 8) return setFeedback({ error: 'New password must be at least 8 characters.' })
    if (next !== confirm) return setFeedback({ error: 'New passwords do not match.' })
    try { const result = await api.changePassword(current, next); setFeedback({ success: result.message }); setCurrent(''); setNext(''); setConfirm(''); setOpen(false) }
    catch (err) { setFeedback({ error: err.message }) }
  }
  function signOut() { logout(); navigate('/', { replace: true }) }
  const fields = [['Name', user?.name], ['Email', user?.email], ['Role', user?.role], ['Office', user?.office], ['ID', user?.id], ['Status', user?.status]]
  return <>
    <PageHeader title="Profile" subtitle="Investigator account details" />
    <div className="mx-auto max-w-2xl space-y-4">
      <section className="card overflow-hidden">
        <div className="flex items-center gap-4 bg-brand-950 p-6 text-white"><div className="rounded-full bg-white/10 p-3"><UserRound className="h-8 w-8"/></div><div><h2 className="text-xl font-bold">Investigator</h2><p className="text-sm text-brand-100/80">{user?.name}</p></div></div>
        <dl className="divide-y divide-slate-100 px-5">{fields.map(([label, value]) => <div key={label} className="grid grid-cols-2 gap-3 py-3 text-sm sm:grid-cols-[minmax(130px,1fr)_2fr]"><dt className="font-semibold text-slate-500">{label}</dt><dd className="break-words font-medium text-slate-900">{value}</dd></div>)}</dl>
        <div className="flex flex-col gap-2 border-t border-slate-100 p-5 sm:flex-row sm:justify-end"><button className="btn-outline" onClick={() => { setOpen((v) => !v); setFeedback(null) }}><KeyRound size={16}/>Change Password</button><button className="btn-primary" onClick={signOut}><LogOut size={16}/>Logout</button></div>
      </section>
      {feedback && <p role="status" className={`rounded-lg border p-3 text-sm ${feedback.error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{feedback.error || feedback.success}</p>}
      {open && <section className="card p-5"><h2 className="mb-4 font-bold text-slate-900">Change Password</h2><form className="space-y-3" onSubmit={changePassword}><div><label className="label" htmlFor="current-password">Current password</label><input className="input" id="current-password" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)}/></div><div><label className="label" htmlFor="new-password">New password</label><input className="input" id="new-password" type="password" autoComplete="new-password" minLength={8} required value={next} onChange={(e) => setNext(e.target.value)}/></div><div><label className="label" htmlFor="confirm-password">Confirm new password</label><input className="input" id="confirm-password" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}/></div><div className="flex justify-end gap-2"><button className="btn-outline" type="button" onClick={() => setOpen(false)}>Cancel</button><button className="btn-primary">Save Password</button></div></form></section>}
    </div>
  </>
}
