import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getUsageLogs } from '../api/endpoints'
import { Card, Spinner, PageHeader, Badge, EmptyState, Input } from '../components/ui'
import { format } from 'date-fns'

export default function Customers() {
  const navigate = useNavigate()
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortBy, setSortBy] = useState('total_requests')

  const { data: logs, isLoading } = useQuery({
    queryKey: ['logs', 'all'],
    queryFn: () => getUsageLogs({ limit: 1000 })
  })

  const customers = useMemo(() => {
    if (!logs) return []

    let filtered = logs
    if (fromDate) filtered = filtered.filter(l => new Date(l.created_at) >= new Date(fromDate))
    if (toDate) filtered = filtered.filter(l => new Date(l.created_at) <= new Date(toDate))

    const map = {}
    filtered.forEach(log => {
      if (!map[log.customer_id]) {
        map[log.customer_id] = {
          customer_id: log.customer_id,
          total_requests: 0,
          error_count: 0,
          total_response_time: 0,
          last_seen: log.created_at
        }
      }
      const c = map[log.customer_id]
      c.total_requests++
      if (log.status_code >= 400) c.error_count++
      c.total_response_time += log.response_time_ms
      if (new Date(log.created_at) > new Date(c.last_seen)) c.last_seen = log.created_at
    })

    return Object.values(map)
      .map(c => ({ ...c, avg_latency: Math.round(c.total_response_time / c.total_requests) }))
      .sort((a, b) => b[sortBy] - a[sortBy])
  }, [logs, fromDate, toDate, sortBy])

  if (isLoading) return <Spinner />

  return (
    <div className="p-6">
      <PageHeader title="Customers" sub="Per-customer API usage breakdown" />

      <div className="flex gap-3 mb-5">
        <Input label="From" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        <Input label="To" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
        <div className="space-y-1.5">
          <label className="text-xs text-text-dim font-mono uppercase tracking-wider">Sort by</label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-bg border border-border rounded px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-accent"
          >
            <option value="total_requests">Requests</option>
            <option value="error_count">Errors</option>
            <option value="avg_latency">Latency</option>
          </select>
        </div>
      </div>

      <Card>
        {customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Customer ID', 'Total Requests', 'Errors', 'Avg Latency', 'Last Seen'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-mono text-text-dim uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr
                    key={c.customer_id}
                    onClick={() => navigate(`/customers/${c.customer_id}`)}
                    className="border-b border-border/40 cursor-pointer hover:bg-border/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-accent text-sm">{c.customer_id}</td>
                    <td className="px-4 py-3 font-mono text-text-dim text-sm">{c.total_requests.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.error_count > 0 ? 'danger' : 'success'}>{c.error_count}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-text-dim text-sm">{c.avg_latency}ms</td>
                    <td className="px-4 py-3 font-mono text-text-dim text-xs">{format(new Date(c.last_seen), 'MMM d, HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState message="No customer data yet." />}
      </Card>
    </div>
  )
}
