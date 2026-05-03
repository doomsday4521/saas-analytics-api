import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getUsageSummary, getUsageLogs } from '../api/endpoints'
import { Card, StatCard, Spinner, PageHeader, Badge, Button, EmptyState } from '../components/ui'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'

export default function CustomerDetail() {
  const { customerId } = useParams()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const limit = 20

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ['summary', customerId],
    queryFn: () => getUsageSummary(customerId)
  })

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['logs', customerId, page],
    queryFn: () => getUsageLogs({ limit, skip: page * limit })
  })

  const customerLogs = logs?.filter(l => l.customer_id === customerId) ?? []

  // Build trend chart
  const trendMap = {}
  customerLogs.forEach(log => {
    const day = format(new Date(log.created_at), 'MM/dd')
    trendMap[day] = (trendMap[day] || 0) + 1
  })
  const trendData = Object.entries(trendMap).map(([date, calls]) => ({ date, calls }))

  if (sumLoading) return <Spinner />

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/customers')}
        className="flex items-center gap-2 text-xs font-mono text-text-dim hover:text-text mb-5 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Customers
      </button>

      <PageHeader title={customerId} sub="Customer detail view" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Calls" value={summary?.total_calls?.toLocaleString() ?? 0} accent />
        <StatCard label="Total Units" value={summary?.total_units?.toLocaleString() ?? 0} />
        <StatCard label="Avg Response" value={`${Math.round(summary?.avg_response_time ?? 0)}ms`} />
        <StatCard label="Error Rate" value={`${(summary?.error_rate ?? 0).toFixed(1)}%`} />
      </div>

      <Card className="mb-6">
        <p className="text-xs font-mono text-text-dim uppercase tracking-wider mb-4">Usage Trend</p>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendData}>
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="calls" stroke="#6ee7b7" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : <EmptyState message="No trend data" />}
      </Card>

      <Card>
        <p className="text-xs font-mono text-text-dim uppercase tracking-wider mb-4">Request Logs</p>
        {logsLoading ? <Spinner /> : customerLogs.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border">
                    {['Endpoint', 'Method', 'Status', 'Response Time', 'Timestamp'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-text-dim">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customerLogs.map(log => (
                    <tr key={log.id} className="border-b border-border/40">
                      <td className="px-3 py-2 text-text">{log.endpoint}</td>
                      <td className="px-3 py-2 text-accent">{log.method}</td>
                      <td className="px-3 py-2">
                        <Badge variant={log.status_code >= 400 ? 'danger' : 'success'}>{log.status_code}</Badge>
                      </td>
                      <td className="px-3 py-2 text-text-dim">{log.response_time_ms}ms</td>
                      <td className="px-3 py-2 text-text-dim">{format(new Date(log.created_at), 'MMM d, HH:mm:ss')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
              <Button size="sm" variant="ghost" onClick={() => setPage(p => p + 1)} disabled={customerLogs.length < limit}>Next</Button>
            </div>
          </>
        ) : <EmptyState message="No logs for this customer" />}
      </Card>
    </div>
  )
}
