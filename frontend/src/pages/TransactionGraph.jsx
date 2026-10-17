import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactFlow, { BaseEdge, Background, Controls, EdgeLabelRenderer, Handle, MarkerType, Position, getBezierPath } from 'reactflow'
import 'reactflow/dist/style.css'
import { api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Card, Empty, ErrorBox, LevelBadge, Spinner } from '../components/ui'
import { dateFmt, dec } from '../utils/format'
import { useLanguage } from '../i18n'
import { banglaDisplay, bnTerm, displayDate } from '../utils/banglaText'

const H = () => <><Handle type="target" position={Position.Top} className="!opacity-0" /><Handle type="source" position={Position.Bottom} className="!opacity-0" /></>
const OWNER = {
  normal: 'border-sky-400 bg-sky-50 text-sky-900', multi: 'border-orange-400 bg-orange-50 text-orange-900', current: 'border-red-400 bg-red-50 text-red-800',
}
const OwnerNode = ({ data, selected }) => (
  <div className={`w-44 rounded-xl border-2 px-3 py-2 text-center shadow-sm ${OWNER[data.status]} ${selected ? 'ring-2 ring-brand-600' : ''}`}>
    <H /><div className="truncate text-sm font-bold">{data.label}</div><div className="text-xs opacity-80">({data.areaLabel})</div>
  </div>)
const ParcelNode = ({ data }) => <div className="rounded-lg bg-brand-800 px-4 py-1.5 text-center text-xs font-bold text-white"><Handle type="source" position={Position.Bottom} className="!opacity-0" />{data.label}</div>
const TxnEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd, style }) => {
  const [path, lx, ly] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <button className="nodrag nopan absolute rounded-md border bg-white px-1.5 py-0.5 text-[11px] font-semibold shadow-sm hover:bg-slate-50" style={{ transform: `translate(-50%,-50%) translate(${lx}px,${ly}px)`, pointerEvents: 'all', borderColor: data.color, color: data.color }}
          onClick={() => data.select(data.tid)}>{data.label}</button>
      </EdgeLabelRenderer>
    </>)
}
const nodeTypes = { owner: OwnerNode, parcel: ParcelNode }
const edgeTypes = { txn: TxnEdge }
const COLORS = { normal: '#3b82f6', multi: '#f59e0b', conflict: '#ef4444' }

export default function TransactionGraph() {
  const { parcelId } = useParams()
  const { data, loading, error, reload } = useApi(() => api.graph(parcelId), [parcelId])
  const [sel, setSel] = useState(null)
  const { language } = useLanguage()
  const bn = language === 'bn'
  const date = (v) => bn ? displayDate(v, language) : dateFmt(v)

  const built = useMemo(() => {
    if (!data) return null
    const txn = Object.fromEntries(data.nodes.filter((n) => n.type === 'txn').map((n) => [n.id, n]))
    const owners = data.nodes.filter((n) => n.type === 'owner')
    const parcel = data.nodes.find((n) => n.type === 'parcel')
    const ends = {}
    data.edges.forEach((e) => { const t = e.data.transaction_id; if (!t) return; ends[t] = ends[t] || {}; if (txn[e.source]) ends[t].buyer = e.target; else ends[t].seller = e.source })
    const outCount = {}
    Object.keys(ends).forEach((t) => { outCount[ends[t].seller] = (outCount[ends[t].seller] || 0) + 1 })
    const sorted = Object.values(txn).sort((a, b) => a.data.date.localeCompare(b.data.date))
    const received = {}
    sorted.forEach((t) => { const b = ends[t.id]?.buyer; if (b && received[b] === undefined) received[b] = t.data.area })
    const first = sorted[0]
    const origin = ends[first?.id]?.seller
    if (origin && received[origin] === undefined) received[origin] = ((parcel?.data.area || 0) * (first.data.seller_share_before ?? 100)) / 100
    const current = data.nodes.find((n) => n.type === 'owner' && n.data.is_current)?.id
    const nodes = [...owners.map((o) => ({ ...o, data: { ...o.data, label: bn ? banglaDisplay(o.data.label) : o.data.label, area: received[o.id], areaLabel: `${bn ? banglaDisplay(dec(received[o.id])) : dec(received[o.id])} ${bn ? 'শতক' : 'Dec'}`, status: o.id === current ? 'current' : outCount[o.id] > 1 ? 'multi' : 'normal' } })), ...(parcel ? [{ ...parcel, data: { ...parcel.data, label: bn ? `জমি ${parcel.id}` : parcel.data.label } }] : [])]
    const edges = sorted.map((t) => {
      const hi = ['High', 'Critical'].includes(t.data.priority_level)
      const kind = hi ? 'conflict' : outCount[ends[t.id].seller] > 1 ? 'multi' : 'normal'
      return { id: t.id, source: ends[t.id].seller, target: ends[t.id].buyer, type: 'txn', animated: hi,
        style: { stroke: COLORS[kind], strokeWidth: hi ? 2.5 : 1.8 }, markerEnd: { type: MarkerType.ArrowClosed, color: COLORS[kind] },
        data: { tid: t.id, color: COLORS[kind], label: `${bn ? banglaDisplay(dec(t.data.area)) : dec(t.data.area)} ${bn ? 'শতক' : 'Dec'} (${bn ? banglaDisplay(t.data.date.slice(0, 4)) : t.data.date.slice(0, 4)})`, select: (tid) => setSel({ type: 'txn', data: txn[tid].data }) } }
    })
    if (origin && parcel) edges.push({ id: 'origin', source: parcel.id, target: origin, style: { stroke: '#94a3b8', strokeDasharray: '5 4' } })
    return { nodes, edges }
  }, [data, bn])

  if (loading) return <Spinner label="Building ownership graph…" />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  if (data.transaction_count === 0) return <Empty title="No transactions on this parcel" hint="There is nothing to draw." />
  const dot = { Consistent: 'bg-emerald-500', 'Review Required': 'bg-amber-500', 'Conflict Detected': 'bg-red-500' }[data.status]
  const d = sel?.data
  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="card relative overflow-hidden" style={{ height: Math.max(480, Math.min(900, 200 + data.owner_count * 120)) }}>
        <ReactFlow nodes={built.nodes} edges={built.edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView fitViewOptions={{ padding: 0.25 }}
          onNodeClick={(_, n) => setSel({ type: n.type, data: n.data })} onPaneClick={() => setSel(null)} nodesConnectable={false} minZoom={0.3}>
          <Background gap={22} color="#e2e8f0" /><Controls showInteractive={false} />
        </ReactFlow>
        <div className="pointer-events-none absolute right-3 top-3 rounded-lg border border-slate-200 bg-white/95 p-3 text-[11px] text-slate-600 shadow-sm">
          <div className="mb-1 flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-sky-500" />{bn ? 'মালিক (স্বাভাবিক)' : 'Owner (Normal)'}</div>
          <div className="mb-1 flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" />{bn ? 'বর্তমান মালিক' : 'Current Owner'}</div>
          <div className="mb-1 flex items-center gap-1.5"><span className="h-0.5 w-4 bg-blue-500" />{bn ? 'হস্তান্তর' : 'Transfer'}</div>
          <div className="mb-1 flex items-center gap-1.5"><span className="h-0.5 w-4 bg-amber-500" />{bn ? 'একাধিক হস্তান্তর' : 'Multiple Transfer'}</div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />{bn ? 'বিতর্ক' : 'Conflict'}</div>
        </div>
      </div>
      <div className="space-y-4">
        <Card title={bn ? 'গ্রাফের অবস্থা' : 'Graph status'}><div className="flex items-center gap-2 font-bold"><span className={`h-3 w-3 rounded-full ${dot}`} />{bn ? bnTerm(data.status) : data.status}</div>
          <p className="mt-1 text-xs text-slate-500">{bn ? `${banglaDisplay(data.owner_count)} জন মালিক · ${banglaDisplay(data.transaction_count)}টি লেনদেন` : `${data.owner_count} owners · ${data.transaction_count} transactions`}</p></Card>
        <Card title={bn ? 'বিস্তারিত' : 'Details'}>
          {!sel && <p className="text-sm text-slate-500">{bn ? 'বিস্তারিত দেখতে গ্রাফে কোনো মালিক বা হস্তান্তরের ওপর ক্লিক করুন।' : 'Click an owner or a transfer label on the graph.'}</p>}
          {d && sel.type === 'txn' && (
            <dl className="space-y-1 text-sm">
              <div className="flex items-center justify-between"><b>{d.transaction_id}</b><LevelBadge level={d.priority_level} /></div>
              <div>{bn ? 'তারিখ' : 'Date'}: <b>{date(d.date)}</b></div><div>{bn ? 'ধরন' : 'Type'}: <b>{bn ? bnTerm(d.type) : d.type}</b> ({bn ? bnTerm(d.status) : d.status})</div><div>{bn ? 'বিক্রেতা' : 'Seller'}: <b>{bn ? banglaDisplay(d.seller) : d.seller}</b></div><div>{bn ? 'ক্রেতা' : 'Buyer'}: <b>{bn ? banglaDisplay(d.buyer) : d.buyer}</b></div>
              <div>{bn ? 'জমির পরিমাণ' : 'Area'}: <b>{bn ? banglaDisplay(dec(d.area)) : dec(d.area)} {bn ? 'শতক' : 'decimal'}</b> · {bn ? 'অংশ' : 'Share'}: <b>{bn ? banglaDisplay(dec(d.share)) : dec(d.share)}%</b></div>
              {d.issues.length > 0 && <div className="text-red-700">{bn ? 'সংকেত' : 'Signals'}: {bn ? d.issues.map(bnTerm).join(', ') : d.issues.join(', ')}</div>}
              <Link className="mt-2 inline-block font-semibold text-brand-700 hover:underline" to={`/alerts/${d.transaction_id}`}>{bn ? 'তদন্ত খুলুন →' : 'Open investigation →'}</Link>
            </dl>)}
          {d && sel.type === 'owner' && (
            <dl className="space-y-1 text-sm"><div className="font-bold">{bn ? banglaDisplay(d.label) : d.label}</div><div className="text-slate-500">{d.owner_id}{d.is_current ? (bn ? ' · বর্তমান মালিক' : ' · current owner') : ''}</div>
              <div>{bn ? 'ধরন' : 'Type'}: <b>{bn ? bnTerm(d.owner_type) : d.owner_type}</b></div><div>{bn ? 'অবস্থা' : 'Status'}: <b>{bn ? bnTerm(d.owner_status) : d.owner_status}</b></div><div>{bn ? 'পেশা' : 'Occupation'}: <b>{bn ? bnTerm(d.occupation) : d.occupation}</b></div><div>{bn ? 'জেলা' : 'District'}: <b>{bn ? banglaDisplay(d.district) : d.district}</b></div><div>{bn ? 'মালিকানাধীন জমি' : 'Parcels owned'}: <b>{bn ? banglaDisplay(d.ownership_count) : d.ownership_count}</b></div>
              {d.status === 'multi' && <div className="text-amber-700">{bn ? 'এই জমির একাধিক হস্তান্তরে বিক্রেতা হিসেবে দেখা যাচ্ছে।' : 'Appears as seller in more than one transfer of this parcel.'}</div>}</dl>)}
          {d && sel.type === 'parcel' && <div className="text-sm"><b>{bn ? `জমি ${parcelId}` : d.label}</b><div>{bn ? 'মোট জমির পরিমাণ' : 'Total area'}: {bn ? banglaDisplay(dec(d.area)) : dec(d.area)} {bn ? 'শতক' : 'decimal'}</div></div>}
        </Card>
      </div>
    </div>
  )
}
