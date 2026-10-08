// Thin wrapper around fetch. All requests go to /api (proxied to FastAPI by Vite in development).
const BASE = import.meta.env.VITE_API_BASE || ''

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${BASE}/api${path}`, options)
  } catch {
    throw new Error('Cannot reach the LandGuard server. Make sure the backend is running on port 8000.')
  }
  if (!res.ok) {
    let msg = 'Something went wrong. Please try again.'
    try { msg = (await res.json()).detail || msg } catch { /* keep default */ }
    throw new Error(msg)
  }
  return res
}
const json = async (path, options) => (await request(path, options)).json()
const qs = (params = {}) => {
  const p = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, v) })
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const api = {
  health: () => json('/health'),
  stats: () => json('/dashboard/stats'),
  analytics: () => json('/analytics'),
  locations: (p) => json(`/meta/locations${qs(p)}`),
  demo: () => json('/demo'),
  parcels: (p) => json(`/parcels${qs(p)}`),
  parcel: (id) => json(`/parcels/${id}`),
  history: (id) => json(`/parcels/${id}/history`),
  timeline: (id) => json(`/parcels/${id}/timeline`),
  graph: (id) => json(`/parcels/${id}/graph`),
  parcelAlerts: (id) => json(`/parcels/${id}/alerts`),
  alerts: (p) => json(`/alerts${qs(p)}`),
  alert: (tid) => json(`/alerts/${tid}`),
  investigate: (tid) => json(`/investigate/${tid}`, { method: 'POST' }),
  comparison: (tid) => json(`/registration-mutation/${tid}`),
  modelMetrics: () => json('/model/metrics'),
  reportUrl: (tid) => `${BASE}/api/reports/${tid}`,
}
