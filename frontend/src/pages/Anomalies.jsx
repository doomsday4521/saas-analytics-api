import { useQuery } from '@tanstack/react-query'
import { getAnomalies } from '../api/endpoints'
import { Card, Spinner, PageHeader, Badge, EmptyState } from '../components/ui'
import { AlertTriangle } from 'lucide-react'

const severityVariant = { high: 'danger', medium: 'warning', low: 'default' }

export default function Anomalies() {
  const { data, isLoading } = useQuery({
    queryKey: ['anomalies'],
    queryFn: () => getAnomalies(200)
  })

  if (isLoading) return <Spinner />

  const anomalies = data?.anomalies ?? []
  const summary = data?.summary ?? ''

  return (
    <div className="p-6">
      <PageHeader title="Anomalies" sub="AI-detected issues in your usage patterns" />

      {summary && (
        <Card className="mb-5 border-warning/20 bg-warning/5">
          <div className="flex gap-3">
            <AlertTriangle size={16} className="text-warning mt-0.5 shrink-0" />
            <p className="text-sm text-text-dim leading-relaxed">{summary}</p>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {anomalies.length > 0 ? anomalies.map((a, i) => (
          <Card key={i}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant={severityVariant[a.severity] ?? 'default'}>{a.severity}</Badge>
                  <span className="text-xs font-mono text-text-dim uppercase tracking-wider">{a.type}</span>
                </div>
                <p className="text-sm text-text">{a.description}</p>
                {a.customer_id && (
                  <p className="text-xs font-mono text-text-dim mt-1">Customer: {a.customer_id}</p>
                )}
              </div>
              {a.timestamp && (
                <p className="text-xs font-mono text-text-dim whitespace-nowrap">{a.timestamp}</p>
              )}
            </div>
          </Card>
        )) : (
          <Card>
            <EmptyState message="No anomalies detected. Your usage looks healthy." />
          </Card>
        )}
      </div>
    </div>
  )
}
