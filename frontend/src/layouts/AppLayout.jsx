import { useState } from 'react'
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { BarChart3, FileText, Home, LayoutDashboard, Menu, Search, Siren, X, UserRound } from 'lucide-react'
import DemoBar from '../components/DemoBar'
import { Disclaimer } from '../components/ui'
import brandMark from '../image/ভূমি প্রহরী_ নিরাপদ জমির প্রতীক.png'
import { useAuth } from '../hooks/useAuth'

const NAV = [
  ['/', 'Home', Home], ['/dashboard', 'Dashboard', LayoutDashboard], ['/investigate', 'Investigate', Search],
  ['/alerts', 'Alerts', Siren], ['/analytics', 'Analytics', BarChart3], ['/reports', 'Reports', FileText],
]

export const Logo = ({ light = true }) => (
  <Link to="/" className={`brand-link group flex items-center gap-2 text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-brand-900'}`}>
    <span className="brand-mark relative h-12 w-12 shrink-0 overflow-hidden">
      <img src={brandMark} alt="" aria-hidden="true" className="absolute left-1/2 top-0 h-auto w-[108px] max-w-none -translate-x-1/2 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-[-3deg] motion-reduce:transition-none motion-reduce:group-hover:transform-none" />
    </span>
    <span className="transition-colors duration-200 group-hover:text-brand-200">ভূমি প্রহরী</span>
  </Link>
)

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()
  const isParcelOverview = /^\/parcel\/[^/]+\/overview\/?$/.test(location.pathname)
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col bg-brand-950 p-4 text-white lg:flex">
        <div className="mb-8 mt-1"><Logo /></div>
        <nav className="flex flex-col gap-1">
          {NAV.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-3 text-lg font-semibold transition-all duration-200 hover:translate-x-1 hover:scale-[1.02] hover:bg-white/15 hover:text-white hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:scale-100 ${isActive && to !== '/' ? 'bg-brand-800 text-white shadow-inner' : 'text-brand-100/75'}`}>
              <Icon className="h-5 w-5" />{label}
            </NavLink>
          ))}
          <NavLink to="/profile" className={({ isActive }) => `mt-3 flex items-center gap-3 rounded-lg px-3 py-3 text-lg font-semibold transition-colors hover:bg-white/15 ${isActive ? 'bg-brand-800 text-white' : 'text-brand-100/75'}`}><UserRound className="h-5 w-5"/><span className="min-w-0 truncate">{user?.name || 'Profile'}</span></NavLink>
        </nav>
        <div className="mt-auto rounded-lg bg-white/5 p-3 text-xs text-brand-100/70">Decision-support only. Human review is required for every alert.</div>
      </aside>
      <div className="min-w-0 flex-1">
        <DemoBar />
        <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 bg-brand-950 px-4 py-3 lg:hidden">
          <Logo />
          <button type="button" aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)} className="rounded-lg p-2 text-white transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          {mobileMenuOpen && <nav className="absolute left-0 right-0 top-full flex flex-col gap-1 border-t border-white/10 bg-brand-950 p-3 shadow-xl">
            {NAV.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-3 text-base font-semibold transition-colors hover:bg-white/10 hover:text-white ${isActive ? 'bg-brand-800 text-white' : 'text-brand-100/80'}`}>
              <Icon className="h-5 w-5" />{label}
            </NavLink>)}
            <NavLink to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-semibold text-brand-100/80 hover:bg-white/10"><UserRound className="h-5 w-5"/>{user?.name || 'Profile'}</NavLink>
          </nav>}
        </header>
        <main className="mx-auto w-full max-w-6xl min-w-0 px-4 pb-24 pt-4 sm:p-5 md:p-8"><Outlet />{!isParcelOverview && <Disclaimer />}</main>
      </div>
    </div>
  )
}
