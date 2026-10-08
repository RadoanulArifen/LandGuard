import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useDemo } from '../hooks/useDemo'

export function demoSteps({ parcelId: p, txId: t }) {
  return [
    { title: 'Search a parcel', path: `/investigate?parcel_id=${p}` },
    { title: 'Parcel overview', path: `/parcel/${p}/overview` },
    { title: 'Ownership history', path: `/parcel/${p}/ownership` },
    { title: 'Transaction graph', path: `/parcel/${p}/graph` },
    { title: 'Detect suspicious transaction', path: `/parcel/${p}/alerts` },
    { title: 'Integrity alert', path: `/alerts?parcel_id=${p}` },
    { title: 'Registration vs mutation', path: `/alerts/${t}/comparison` },
    { title: 'AI analysis', path: `/alerts/${t}/ai` },
    { title: 'Evidence', path: `/alerts/${t}` },
    { title: 'Generate report', path: `/reports?tx=${t}` },
  ]
}

export default function DemoBar() {
  const { demo, stop } = useDemo()
  const nav = useNavigate()
  const loc = useLocation()
  if (!demo) return null
  const steps = demoSteps(demo)
  const here = loc.pathname + loc.search
  let idx = steps.findIndex((s) => s.path === here)
  if (idx < 0) idx = steps.findIndex((s) => s.path.split('?')[0] === loc.pathname)
  const go = (i) => nav(steps[Math.min(Math.max(i, 0), steps.length - 1)].path)
  return (
    <div className="sticky top-0 z-30 border-b border-brand-700 bg-brand-900 px-4 py-2 text-white">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded bg-white/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wide">Judge demo</span>
        <div className="flex flex-1 flex-wrap gap-1">
          {steps.map((s, i) => (
            <button key={s.title} onClick={() => go(i)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${i === idx ? 'bg-white text-brand-900' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}>
              {i + 1}. {s.title}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button className="rounded p-1 hover:bg-white/15" onClick={() => go(idx - 1)} aria-label="Previous step"><ChevronLeft className="h-4 w-4" /></button>
          <button className="rounded p-1 hover:bg-white/15" onClick={() => go(idx + 1)} aria-label="Next step"><ChevronRight className="h-4 w-4" /></button>
          <button className="rounded p-1 hover:bg-white/15" onClick={stop} aria-label="Close demo"><X className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  )
}
