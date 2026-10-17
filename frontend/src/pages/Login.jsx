import { useState } from 'react'
import { Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Logo } from '../layouts/AppLayout'

export default function Login() {
  const { user, ready, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const fillDemoCredentials = () => { setEmail('admin@gmail.com'); setPassword('Admin@123'); setError('') }
  if (!ready) return <div className="min-h-screen bg-slate-100" />
  if (user) return <Navigate to="/" replace />
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true)
    try { await login(email, password); navigate('/', { replace: true }) }
    catch (err) {
      setError(err.status === 404
        ? 'The connected backend does not have the login endpoint yet. Deploy the latest LandGuard backend, then try again.'
        : err.message || 'Unable to log in. Please try again.')
    }
    finally { setBusy(false) }
  }
  return <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
    <section className="card w-full max-w-md p-6 sm:p-8">
      <div className="mb-7 flex justify-center rounded-lg bg-brand-950 p-3"><Logo /></div>
      <div className="mb-6 text-center"><ShieldCheck className="mx-auto mb-2 h-8 w-8 text-brand-700"/><h1 className="text-2xl font-bold text-slate-900">Investigator Login</h1><p className="mt-1 text-sm text-slate-500">Sign in to LandGuard</p></div>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label" htmlFor="email">Email</label><input id="email" className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="label" htmlFor="password">Password</label><div className="relative"><input id="password" className="input pr-12" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-2.5 text-slate-500">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></div>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Login'}</button>
      </form>
      <aside className="mt-5 rounded-lg border border-brand-100 bg-brand-50 p-3.5 text-sm text-brand-950" aria-label="Demo login credentials">
        <div className="mb-2 flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4"/>Demo credentials</div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs sm:text-sm">
          <dt className="font-medium text-slate-600">Email</dt><dd className="break-all font-mono">admin@gmail.com</dd>
          <dt className="font-medium text-slate-600">Password</dt><dd className="font-mono">Admin@123</dd>
        </dl>
        <button type="button" onClick={fillDemoCredentials} className="mt-3 text-xs font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-900">Use demo credentials</button>
      </aside>
    </section>
  </div>
}
