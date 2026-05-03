import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiKeys, createApiKey, revokeApiKey } from '../api/endpoints'
import { Card, Spinner, PageHeader, Button, Input, Badge, EmptyState } from '../components/ui'
import { Plus, Copy, Eye, EyeOff } from 'lucide-react'
import { format } from 'date-fns'

export default function ApiKeys() {
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [newKey, setNewKey] = useState(null)
  const [copied, setCopied] = useState(false)
  const qc = useQueryClient()

  const { data: keys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: getApiKeys
  })

  const create = useMutation({
    mutationFn: () => createApiKey({ name }),
    onSuccess: (data) => {
      setNewKey(data.key)
      setName('')
      setShowCreate(false)
      qc.invalidateQueries(['api-keys'])
    }
  })

  const revoke = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => qc.invalidateQueries(['api-keys'])
  })

  const copyKey = () => {
    navigator.clipboard.writeText(newKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) return <Spinner />

  return (
    <div className="p-6">
      <PageHeader
        title="API Keys"
        sub="Manage access credentials"
        action={
          <Button onClick={() => setShowCreate(s => !s)}>
            <Plus size={14} className="inline mr-1" />Create Key
          </Button>
        }
      />

      {/* New key banner */}
      {newKey && (
        <Card className="mb-5 border-accent/30 bg-accent/5">
          <p className="text-xs font-mono text-accent mb-2 uppercase tracking-wider">⚠ Copy this key now — it won't be shown again</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono text-text bg-bg px-3 py-2 rounded break-all">{newKey}</code>
            <Button size="sm" onClick={copyKey}>{copied ? 'Copied!' : <><Copy size={12} className="inline mr-1" />Copy</>}</Button>
          </div>
          <button onClick={() => setNewKey(null)} className="text-xs text-text-dim mt-2 hover:text-text">Dismiss</button>
        </Card>
      )}

      {/* Create form */}
      {showCreate && (
        <Card className="mb-5">
          <p className="text-xs font-mono text-text-dim uppercase tracking-wider mb-3">New API Key</p>
          <div className="flex gap-3 items-end">
            <Input label="Key Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. production-key" />
            <Button onClick={() => create.mutate()} disabled={!name || create.isPending}>
              {create.isPending ? 'Creating...' : 'Create'}
            </Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <Card>
        {keys?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Name', 'Key', 'Last Used', 'Created', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-mono text-text-dim uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keys.map(key => (
                  <tr key={key.id} className="border-b border-border/40">
                    <td className="px-4 py-3 font-mono text-text text-sm">{key.name}</td>
                    <td className="px-4 py-3 font-mono text-text-dim text-xs">
                        {key.key ? `${key.key.slice(0, 8)}••••` : '••••••••••••'}
                      </td>
                    <td className="px-4 py-3 font-mono text-text-dim text-xs">
                      {key.last_used_at ? format(new Date(key.last_used_at), 'MMM d, HH:mm') : 'Never'}
                    </td>
                    <td className="px-4 py-3 font-mono text-text-dim text-xs">{format(new Date(key.created_at), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3">
                      <Badge variant={key.is_active ? 'success' : 'danger'}>{key.is_active ? 'Active' : 'Revoked'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {key.is_active && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => revoke.mutate(key.id)}
                          disabled={revoke.isPending}
                        >
                          Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState message="No API keys yet. Create one to start logging usage." />}
      </Card>
    </div>
  )
}
