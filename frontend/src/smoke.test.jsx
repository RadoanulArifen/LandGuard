// Smoke test: renders every route against the RUNNING backend (http://127.0.0.1:8000) and checks it shows real content.
// Start the backend first, then run:  npm test
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import App from './App'
import { DemoProvider } from './hooks/useDemo'

beforeAll(() => {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
  globalThis.DOMMatrixReadOnly = class { constructor() { this.m22 = 1 } }
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 600 })
})
afterEach(cleanup)

const P = 'P-014133', T = 'T-010491'
const show = (path) => render(<MemoryRouter initialEntries={[path]}><DemoProvider><App /></DemoProvider></MemoryRouter>)

const CASES = [
  ['/', /Detect suspicious land transactions/i],
  ['/dashboard', /Parcels Analyzed/i],
  ['/investigate?parcel_id=' + P, /Investigate a Parcel|Integrity Status/i],
  [`/parcel/${P}/overview`, /Integrity Status/i],
  [`/parcel/${P}/ownership`, /Original Owner/i],
  [`/parcel/${P}/graph`, /Graph status/i],
  [`/parcel/${P}/timeline`, /Original Ownership/i],
  [`/parcel/${P}/alerts`, /View Details/i],
  ['/alerts', /Integrity Alerts/i],
  [`/alerts/${T}`, /Human Review Required/i],
  [`/alerts/${T}/comparison`, /Registration Record/i],
  [`/alerts/${T}/ai`, /Why this transaction is flagged/i],
  ['/analytics', /Model evaluation/i],
  ['/reports?tx=' + T, /Download PDF/i],
]

describe('LandGuard pages render with real data', () => {
  for (const [path, re] of CASES) {
    it(path, async () => {
      show(path)
      await waitFor(() => expect(screen.getAllByText(re).length).toBeGreaterThan(0), { timeout: 20000 })
      expect(screen.queryByText(/Could not load this page/i)).toBeNull()
    })
  }
})
