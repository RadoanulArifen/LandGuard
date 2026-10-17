import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Brain, Database, FileSearch, GitBranch, Menu, Network, Play, ScanSearch, ShieldCheck, Siren, UserCheck, X } from 'lucide-react'
import bannerImage from '../image/banner.jpg'
import { Logo } from '../layouts/AppLayout'
import { useAuth } from '../hooks/useAuth'

const NAV = [['/', 'Home'], ['/dashboard', 'Dashboard'], ['/investigate', 'Investigate'], ['/alerts', 'Alerts'], ['/analytics', 'Analytics'], ['/reports', 'Reports']]
const HIGHLIGHTS = [[ScanSearch, 'Double-Selling Detection'], [Network, 'Ownership Graph'], [Siren, 'AI-Powered Anomaly Detection'], [Brain, 'Explainable Evidence']]
const STEPS = [
  [Database, 'Link records', 'Parcel, owner, transaction, registration and mutation records are joined into one view.'],
  [GitBranch, 'Build the ownership graph', 'A time-aware graph shows who transferred what to whom, and when.'],
  [ShieldCheck, 'Run integrity rules', 'Seven deterministic checks look for overlaps, excess transfers, chain breaks and mismatches.'],
  [Siren, 'Prioritise with ML', 'A local machine-learning model ranks transactions so reviewers start with the most unusual ones.'],
  [Brain, 'Explain', 'Every alert shows the records and the factors behind it, in plain language.'],
  [UserCheck, 'Human review', 'Officials make the decision. ভূমি প্রহরী never confirms fraud or ownership.'],
]
const CAPS = ['Double-sale / overlapping transfer', 'Over-transfer vs recorded share', 'Rapid transfer patterns', 'Ownership chain validation',
  'Registration ↔ mutation mismatch', 'Temporal consistency (transaction ≤ registration ≤ mutation)', 'Investigation Priority Score (0–100)', 'PDF investigation report']

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user } = useAuth()
  const navItems = user ? [...NAV, ['/profile', 'Profile']] : []
  return (
    <div className="min-h-screen bg-white">
      <section className="relative isolate min-h-[580px] overflow-hidden text-white sm:min-h-[620px]">
        <div className="absolute inset-0 -z-10"><img src={bannerImage} alt="Aerial view of vibrant agricultural fields" className="h-full w-full object-cover" /></div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950/95 via-brand-950/70 to-brand-950/10" />
        <nav className="relative z-20 mx-auto flex max-w-6xl flex-wrap items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
          <Logo />
          {user ? <div className="hidden gap-5 text-lg font-bold text-white/90 lg:flex">{navItems.map(([to, l]) => <Link key={to} to={to} className="group relative rounded-md px-2 py-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15 hover:text-white hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white after:absolute after:bottom-0 after:left-2 after:h-0.5 after:w-0 after:bg-brand-300 after:transition-all after:duration-300 hover:after:w-[calc(100%-1rem)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">{l}</Link>)}</div> : <Link to="/login" className="ml-auto rounded-lg bg-white px-5 py-2 text-sm font-bold text-brand-950 shadow transition-colors hover:bg-brand-100">Login</Link>}
          {user && <button type="button" aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)} className="rounded-lg p-2 text-white transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white lg:hidden">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>}
          {mobileMenuOpen && <div className="absolute left-0 right-0 top-full flex flex-col gap-1 rounded-b-xl border-t border-white/15 bg-brand-950/95 p-3 shadow-xl backdrop-blur lg:hidden">
            {navItems.map(([to, label]) => <Link key={to} to={to} onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-3 text-base font-semibold text-white/90 transition-all hover:translate-x-1 hover:bg-white/10 hover:text-white motion-reduce:transition-none motion-reduce:hover:translate-x-0">{label}</Link>)}
          </div>}
        </nav>
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pb-12 sm:pt-12">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">ভূমি প্রহরী</h1>
          <p className="mt-3 max-w-xl text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">Explainable Land Transaction Integrity and Fraud Detection</p>
          <p className="mt-5 max-w-md text-base text-white/90 sm:text-lg">Detect suspicious land transactions before they become ownership disputes.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            {user && <Link to="/investigate" className="btn bg-brand-500 px-4 py-3 text-sm text-white hover:bg-brand-600 sm:px-6 sm:text-base">Investigate a Parcel <ArrowRight className="h-4 w-4" /></Link>}
            {user && <Link to="/demo" className="btn border border-white/40 bg-white/10 px-4 py-3 text-sm text-white backdrop-blur hover:bg-white/20 sm:px-6 sm:text-base"><Play className="h-4 w-4" />View Demo</Link>}
          </div>
          <div className="mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {HIGHLIGHTS.map(([Icon, t]) => <div key={t} className="rounded-xl bg-white p-4 text-slate-800 shadow-lg"><Icon className="mb-2 h-7 w-7 text-slate-700" /><div className="text-sm font-bold leading-snug">{t}</div></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-2">
        <div><h2 className="text-sm font-bold uppercase tracking-wide text-brand-700">The problem</h2>
          <p className="mt-2 text-2xl font-bold text-slate-900">One correct record does not make a correct history.</p>
          <p className="mt-3 text-slate-600">A parcel passes through the sub-registry office (registration) and the AC Land office (mutation). When these records disagree — or the same interest appears to be sold twice — disputes follow years later.</p></div>
        <div><h2 className="text-sm font-bold uppercase tracking-wide text-brand-700">The solution</h2>
          <p className="mt-2 text-2xl font-bold text-slate-900">Check whether linked records make sense together.</p>
          <p className="mt-3 text-slate-600">Government systems maintain records. ভূমি প্রহরী adds an integrity-analysis layer on top of them: it connects the records, tests them against clear rules, and ranks what a human should look at first.</p></div>
      </section>
      <section className="bg-slate-50 py-16"><div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center text-3xl font-bold text-slate-900">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">{STEPS.map(([Icon, t, d], i) => (
          <div key={t} className="card p-5"><div className="mb-3 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-800">{i + 1}</span><Icon className="h-5 w-5 text-brand-700" /></div>
            <div className="font-bold text-slate-900">{t}</div><p className="mt-1 text-sm text-slate-600">{d}</p></div>))}</div></div></section>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-2">
        <div><h2 className="text-3xl font-bold text-slate-900">Core capabilities</h2>
          <ul className="mt-5 grid gap-2">{CAPS.map((c) => <li key={c} className="flex items-start gap-2 text-slate-700"><FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />{c}</li>)}</ul></div>
        <div className="card bg-brand-50 p-6"><Brain className="h-8 w-8 text-brand-700" /><h2 className="mt-2 text-2xl font-bold text-slate-900">Explainable AI</h2>
          <p className="mt-2 text-slate-700">Each alert says <b>what</b> was found, <b>why</b> it was flagged and <b>which records</b> are responsible. SHAP shows how much each factor pushed the model's priority up — in plain language.</p>
          <p className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-600">ভূমি প্রহরী produces an <b>Investigation Priority Score</b>, not a fraud probability. AI never makes a legal decision; every alert ends in <b>Human Review Required</b>.</p></div>
      </section>
      <footer className="bg-brand-950 py-6 text-center text-xs text-brand-200">Synthetic data only · LandTech 2026 · P3 Fraud &amp; Double-Selling Detection</footer>
    </div>
  )
}
