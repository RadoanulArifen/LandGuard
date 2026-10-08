import { NavLink, Outlet, Link } from 'react-router-dom'
import { BarChart3, FileText, Home, LayoutDashboard, Search, ShieldCheck, Siren } from 'lucide-react'
import DemoBar from '../components/DemoBar'
import { Disclaimer } from '../components/ui'

const NAV = [
  ['/', 'Home', Home], ['/dashboard', 'Dashboard', LayoutDashboard], ['/investigate', 'Investigate', Search],
  ['/alerts', 'Alerts', Siren], ['/analytics', 'Analytics', BarChart3], ['/reports', 'Reports', FileText],
]

export const Logo = ({ light = true }) => (
  <Link to="/" className={`flex items-center gap-2 text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-brand-900'}`}>
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500"><ShieldCheck className="h-5 w-5 text-white" /></span>LandGuard
  </Link>
)

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col bg-brand-950 p-4 text-white md:flex">
        <div className="mb-8 mt-1"><Logo /></div>
        <nav className="flex flex-col gap-1">
          {NAV.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive && to !== '/' ? 'bg-brand-800 text-white' : 'text-brand-100/75 hover:bg-white/10'}`}>
              <Icon className="h-4 w-4" />{label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-lg bg-white/5 p-3 text-xs text-brand-100/70">Decision-support only. Human review is required for every alert.</div>
      </aside>
      <div className="min-w-0 flex-1">
        <DemoBar />
        <header className="flex items-center justify-between gap-3 bg-brand-950 px-4 py-3 md:hidden">
          <Logo />
          <div className="flex gap-3 text-xs font-medium text-brand-100">{NAV.slice(1).map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}</div>
        </header>
        <main className="mx-auto max-w-6xl p-5 md:p-8"><Outlet /><Disclaimer /></main>
      </div>
    </div>
  )
}
