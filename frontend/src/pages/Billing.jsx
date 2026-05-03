import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPlans, getInvoices, generateInvoice, subscribeToPlan, getCurrentPlan, finalizeInvoice } from '../api/endpoints'
import { Card, StatCard, Spinner, PageHeader, Button, Badge, EmptyState } from '../components/ui'
import { format } from 'date-fns'
import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

const planColors = { free: 'default', basic: 'success', pro: 'warning' }

function InvoiceRow({ inv }) {
  const [expanded, setExpanded] = useState(false)
  const qc = useQueryClient()

  const finalize = useMutation({
    mutationFn: () => finalizeInvoice(inv.id),
    onSuccess: () => qc.invalidateQueries(['invoices'])
  })

  return (
    <>
      <tr
        className="border-b border-border/40 cursor-pointer hover:bg-border/20 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-4 py-3 font-mono text-xs text-text-dim">{inv.id.slice(0, 8)}...</td>
        <td className="px-4 py-3 font-mono text-xs text-text-dim">{format(new Date(inv.billing_period_start), 'MMM yyyy')}</td>
        <td className="px-4 py-3 font-mono text-xs text-text-dim">{inv.total_units.toLocaleString()}</td>
        <td className="px-4 py-3 font-mono text-sm text-text">${inv.amount_due.toFixed(2)}</td>
        <td className="px-4 py-3">
          <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : inv.status === 'draft' ? 'warning' : 'default'}>
            {inv.status}
          </Badge>
        </td>
        <td className="px-4 py-3 font-mono text-xs text-text-dim">{format(new Date(inv.created_at), 'MMM d, yyyy')}</td>
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          {inv.status === 'draft' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => finalize.mutate()}
              disabled={finalize.isPending}
            >
              {finalize.isPending ? 'Finalizing...' : 'Finalize'}
            </Button>
          )}
        </td>
        <td className="px-4 py-3 text-text-dim">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </td>
      </tr>

      {expanded && inv.line_items?.length > 0 && (
        <tr className="border-b border-border/40 bg-bg">
          <td colSpan={8} className="px-6 py-4">
            <p className="text-xs font-mono text-text-dim uppercase tracking-wider mb-3">Billing Breakdown</p>
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border">
                  {['Plan', 'Period', 'Days', 'Units', 'Base', 'Overage', 'Total'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-text-dim">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inv.line_items.map((item, i) => (
                  <tr key={i} className="border-b border-border/30">
                    <td className="px-3 py-2 text-accent">{item.plan_name}</td>
                    <td className="px-3 py-2 text-text-dim">
                      {format(new Date(item.period_start), 'MMM d')} — {format(new Date(item.period_end), 'MMM d')}
                    </td>
                    <td className="px-3 py-2 text-text-dim">{item.days}</td>
                    <td className="px-3 py-2 text-text-dim">{item.units_used.toLocaleString()}</td>
                    <td className="px-3 py-2 text-text-dim">${item.base_amount.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      {item.overage_units > 0
                        ? <span className="text-warning">{item.overage_units} units · ${item.overage_amount.toFixed(2)}</span>
                        : <span className="text-text-dim">—</span>
                      }
                    </td>
                    <td className="px-3 py-2 text-text font-semibold">${item.total_amount.toFixed(2)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={6} className="px-3 py-2 text-right text-text-dim">Total</td>
                  <td className="px-3 py-2 text-accent font-semibold">${inv.amount_due.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  )
}

export default function Billing() {
  const qc = useQueryClient()

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: getPlans
  })

  const { data: currentPlanData, isLoading: currentPlanLoading } = useQuery({
    queryKey: ['current-plan'],
    queryFn: getCurrentPlan
  })

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: getInvoices
  })

  const subscribe = useMutation({
    mutationFn: subscribeToPlan,
    onSuccess: () => qc.invalidateQueries()
  })

  const genInvoice = useMutation({
    mutationFn: generateInvoice,
    onSuccess: () => qc.invalidateQueries(['invoices'])
  })

  if (plansLoading || invoicesLoading || currentPlanLoading) return <Spinner />

  const latestInvoice = invoices?.[0]
  const activePlanId = currentPlanData?.active_plan?.plan_id
  const hasDraft = invoices?.some(inv => inv.status === 'draft')

  return (
    <div className="p-6">
      <PageHeader
        title="Billing"
        sub="Plans, usage, and invoices"
        action={
          <Button onClick={() => genInvoice.mutate()} disabled={genInvoice.isPending}>
            {genInvoice.isPending ? 'Generating...' : hasDraft ? 'Refresh Invoice' : 'Generate Invoice'}
          </Button>
        }
      />

      {currentPlanData?.active_plan && (
        <Card className="mb-6 border-accent/20 bg-accent/5">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-accent" />
            <p className="text-sm font-mono text-text">
              Current plan: <span className="text-accent font-semibold">{currentPlanData.active_plan.name}</span>
              <span className="text-text-dim ml-2">— since {format(new Date(currentPlanData.active_plan.started_at), 'MMM d, yyyy')}</span>
            </p>
          </div>
        </Card>
      )}

      {latestInvoice && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Units" value={latestInvoice.total_units.toLocaleString()} accent />
          <StatCard label="Amount Due" value={`$${latestInvoice.amount_due.toFixed(2)}`} />
          <StatCard label="Billing Period" value={format(new Date(latestInvoice.billing_period_start), 'MMM yyyy')} />
          <StatCard label="Status" value={latestInvoice.status} />
        </div>
      )}

      <p className="text-xs font-mono text-text-dim uppercase tracking-wider mb-3">Available Plans</p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {plans?.map(plan => {
          const isActive = plan.id === activePlanId
          return (
            <Card key={plan.id} className={isActive ? 'border-accent/40' : ''}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono font-semibold text-text">{plan.name}</span>
                <div className="flex items-center gap-2">
                  {isActive && <Badge variant="success">Active</Badge>}
                  <Badge variant={planColors[plan.plan_type] ?? 'default'}>{plan.plan_type}</Badge>
                </div>
              </div>
              <p className="text-2xl font-mono font-bold text-accent mb-1">
                ${plan.base_price}<span className="text-sm text-text-dim">/mo</span>
              </p>
              <p className="text-xs text-text-dim font-mono mb-1">{plan.monthly_limit.toLocaleString()} units included</p>
              <p className="text-xs text-text-dim font-mono mb-4">${plan.price_per_unit}/unit overage</p>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => !isActive && subscribe.mutate(plan.id)}
                disabled={isActive || subscribe.isPending}
              >
                {isActive ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <CheckCircle size={13} className="text-accent" /> Current Plan
                  </span>
                ) : 'Subscribe'}
              </Button>
            </Card>
          )
        })}
      </div>

      <p className="text-xs font-mono text-text-dim uppercase tracking-wider mb-3">Invoice History</p>
      <Card>
        {invoices?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Invoice ID', 'Period', 'Units', 'Amount', 'Status', 'Created', '', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-mono text-text-dim uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => <InvoiceRow key={inv.id} inv={inv} />)}
              </tbody>
            </table>
          </div>
        ) : <EmptyState message="No invoices yet. Generate your first invoice above." />}
      </Card>
    </div>
  )
}