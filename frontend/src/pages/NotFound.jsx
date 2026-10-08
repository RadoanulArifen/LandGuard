import { Link } from 'react-router-dom'
export default function NotFound() {
  return <div className="card p-10 text-center"><h1 className="text-xl font-bold">Page not found</h1><p className="mt-1 text-slate-500">The page you asked for does not exist.</p><Link className="btn-primary mt-4" to="/dashboard">Go to Dashboard</Link></div>
}
