import { useQuery } from '@tanstack/react-query'
import { getUsageLogs, getAnomalies, getInvoices, getPlans } from '../api/endpoints'
import { StatCard, Card, Spinner, PageHeader, Badge, ProgressBar, EmptyState } from '../components/ui'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { format } from 'date-fns'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface border border-border rounded px-3 py-2 text-xs font-mono">
        <p className="text-text-dim mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: () => getUsageLogs({ limit: 100 })
  })

  const { data: anomalies } = useQuery({
    queryKey: ['anomalies'],
    queryFn: getAnomalies
  })

  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: getInvoices
  })

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: getPlans
  })

  if (logsLoading) return <Spinner />

  const totalCalls = logs?.length ?? 0
  const errorCount = logs?.filter(l => l.status_code >= 400).length ?? 0
  const errorRate = totalCalls > 0 ? ((errorCount / totalCalls) * 100).toFixed(1) : '0.0'
  const avgResponseTime = totalCalls > 0
    ? (logs.reduce((a, b) => a + b.response_time_ms, 0) / totalCalls).toFixed(0)
    : '0'

  // Build daily usage chart data
  const dailyMap = {}
  logs?.forEach(log => {
    const day = format(new Date(log.created_at), 'MM/dd')
    dailyMap[day] = (dailyMap[day] || 0) + 1
  })
  const chartData = Object.entries(dailyMap).map(([date, calls]) => ({ date, calls })).slice(-14)

  // Error trend
  const errorMap = {}
  logs?.filter(l => l.status_code >= 400).forEach(log => {
    const day = format(new Date(log.created_at), 'MM/dd')
    errorMap[day] = (errorMap[day] || 0) + 1
  })
  const errorData = Object.entries(errorMap).map(([date, errors]) => ({ date, errors })).slice(-14)

  const latestInvoice = invoices?.[0]
  const currentPlan = plans?.[0]

  return (
    <div className="p-6">
      <PageHeader title="Dashboard" sub="Your API usage at a glance" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Calls" value={totalCalls.toLocaleString()} accent />
        <StatCard label="Error Rate" value={`${errorRate}%`} sub={`${errorCount} errors`} />
        <StatCard label="Avg Response" value={`${avgResponseTime}ms`} />
        <StatCard label="Anomalies" value={anomalies?.anomalies?.length ?? 0} sub="detected this period" />
      </div>

      {/* Usage progress */}
      {latestInvoice && currentPlan && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-mono text-text-dim uppercase tracking-wider">Monthly Usage</p>
            <span className="text-xs font-mono text-text-dim">
              {latestInvoice.total_units.toLocaleString()} / {currentPlan.monthly_limit.toLocaleString()} units
            </span>
          </div>
          <ProgressBar value={latestInvoice.total_units} max={currentPlan.monthly_limit} />
          <p className="text-xs text-text-dim mt-2">
            {latestInvoice.total_units > currentPlan.monthly_limit
              ? <span className="text-danger">In overage — extra units being billed at ${currentPlan.price_per_unit}/unit</span>
              : `${((latestInvoice.total_units / currentPlan.monthly_limit) * 100).toFixed(1)}% of plan used`
            }
          </p>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <p className="text-xs font-mono text-text-dim uppercase tracking-wider mb-4">Requests (last 14 days)</p>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="calls" stroke="#6ee7b7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No data yet" />}
        </Card>

        <Card>
          <p className="text-xs font-mono text-text-dim uppercase tracking-wider mb-4">Errors (last 14 days)</p>
          {errorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={errorData}>
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="errors" fill="#f87171" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No errors" />}
        </Card>
      </div>

      {/* Recent logs */}
      <Card>
        <p className="text-xs font-mono text-text-dim uppercase tracking-wider mb-4">Recent Logs</p>
        {logs?.slice(0, 10).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border">
                  {['Customer', 'Endpoint', 'Method', 'Status', 'Response Time', 'Time'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-text-dim">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 10).map(log => (
                  <tr key={log.id} className="border-b border-border/40">
                    <td className="px-3 py-2 text-text-dim">{log.customer_id}</td>
                    <td className="px-3 py-2 text-text">{log.endpoint}</td>
                    <td className="px-3 py-2 text-accent">{log.method}</td>
                    <td className="px-3 py-2">
                      <Badge variant={log.status_code >= 400 ? 'danger' : 'success'}>{log.status_code}</Badge>
                    </td>
                    <td className="px-3 py-2 text-text-dim">{log.response_time_ms}ms</td>
                    <td className="px-3 py-2 text-text-dim">{format(new Date(log.created_at), 'HH:mm:ss')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState message="No logs yet. Start sending requests." />}
      </Card>
    </div>
  )
}
