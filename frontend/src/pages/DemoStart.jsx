import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { useDemo } from '../hooks/useDemo'
import { demoSteps } from '../components/DemoBar'
import { ErrorBox, Spinner } from '../components/ui'

// Picks a showcase parcel from the real data and starts the guided judge demo.
export default function DemoStart() {
  const { start } = useDemo()
  const nav = useNavigate()
  const { data, error, reload } = useApi(() => api.demo(), [])
  useEffect(() => {
    if (!data) return
    const d = { parcelId: data.parcel_id, txId: data.transaction_id }
    start(d)
    nav(demoSteps(d)[0].path, { replace: true })
  }, [data])  // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="p-10">{error ? <ErrorBox error={error} onRetry={reload} /> : <Spinner label="Preparing the demo parcel…" />}</div>
}
