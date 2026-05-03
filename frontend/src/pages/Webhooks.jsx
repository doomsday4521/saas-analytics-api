import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWebhooks, createWebhook, deleteWebhook } from '../api/endpoints'
import { Card, Spinner, PageHeader, Button, Input, Badge, EmptyState } from '../components/ui'
import { Plus, Trash2 } from 'lucide-react'

const EVENT_TYPES = ['usage.limit.exceeded', 'usage.limit.warning']

export default function Webhooks() {
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ url: '', event_type: EVENT_TYPES[0] })
  const qc = useQueryClient()

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: getWebhooks
  })

  const create = useMutation({
    mutationFn: () => createWebhook(form),
    onSuccess: () => {
      setForm({ url: '', event_type: EVENT_TYPES[0] })
      setShowCreate(false)
      qc.invalidateQueries(['webhooks'])
    }
  })

  const remove = useMutation({
    mutationFn: deleteWebhook,
    onSuccess: () => qc.invalidateQueries(['webhooks'])
  })

  if (isLoading) return <Spinner />

  return (
    <div className="p-6">
      <PageHeader
        title="Webhooks"
        sub="Get notified when usage events fire"
        action={
          <Button onClick={() => setShowCreate(s => !s)}>
            <Plus size={14} className="inline mr-1" />Add Webhook
          </Button>
        }
      />

      {showCreate && (
        <Card className="mb-5">
          <p className="text-xs font-mono text-text-dim uppercase tracking-wider mb-3">New Webhook</p>
          <div className="space-y-3">
            <Input
              label="Endpoint URL"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="https://your-server.com/webhook"
            />
            <div className="space-y-1.5">
              <label className="text-xs text-text-dim font-mono uppercase tracking-wider">Event Type</label>
              <select
                value={form.event_type}
                onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}
                className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-accent"
              >
                {EVENT_TYPES.map(et => <option key={et} value={et}>{et}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => create.mutate()} disabled={!form.url || create.isPending}>
                {create.isPending ? 'Saving...' : 'Save Webhook'}
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {webhooks?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['URL', 'Event', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-mono text-text-dim uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {webhooks.map(wh => (
                  <tr key={wh.id} className="border-b border-border/40">
                    <td className="px-4 py-3 font-mono text-xs text-text-dim max-w-xs truncate">{wh.url}</td>
                    <td className="px-4 py-3">
                      <Badge>{wh.event_type}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={wh.is_active ? 'success' : 'danger'}>{wh.is_active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => remove.mutate(wh.id)}
                        disabled={remove.isPending}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState message="No webhooks registered. Add one to get notified on usage events." />}
      </Card>
    </div>
  )
}
