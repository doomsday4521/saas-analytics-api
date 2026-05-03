import clsx from 'clsx'

export function Card({ children, className }) {
  return (
    <div className={clsx('bg-surface border border-border rounded-lg p-5', className)}>
      {children}
    </div>
  )
}

export function StatCard({ label, value, sub, accent }) {
  return (
    <Card>
      <p className="text-xs text-text-dim font-mono uppercase tracking-wider mb-2">{label}</p>
      <p className={clsx('text-2xl font-mono font-semibold', accent ? 'text-accent' : 'text-text')}>{value}</p>
      {sub && <p className="text-xs text-text-dim mt-1">{sub}</p>}
    </Card>
  )
}

export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-border text-text-dim',
    success: 'bg-accent/10 text-accent',
    danger: 'bg-danger/10 text-danger',
    warning: 'bg-warning/10 text-warning',
  }
  return (
    <span className={clsx('text-xs font-mono px-2 py-0.5 rounded', variants[variant])}>
      {children}
    </span>
  )
}

export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, className }) {
  const variants = {
    primary: 'bg-accent text-bg hover:bg-accent-dim font-semibold',
    ghost: 'border border-border text-text-dim hover:text-text hover:border-muted',
    danger: 'border border-danger/30 text-danger hover:bg-danger/10',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'rounded transition-all font-mono',
        variants[variant],
        sizes[size],
        disabled && 'opacity-40 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  )
}

export function Input({ label, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs text-text-dim font-mono uppercase tracking-wider">{label}</label>}
      <input
        className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-accent transition-colors"
        {...props}
      />
    </div>
  )
}

export function Select({ label, children, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs text-text-dim font-mono uppercase tracking-wider">{label}</label>}
      <select
        className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-accent transition-colors"
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
    </div>
  )
}

export function PageHeader({ title, sub, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-lg font-mono font-semibold text-text">{title}</h1>
        {sub && <p className="text-sm text-text-dim mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function Table({ headers, children, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {headers.map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-mono text-text-dim uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
      {empty}
    </div>
  )
}

export function Tr({ children, onClick }) {
  return (
    <tr
      onClick={onClick}
      className={clsx(
        'border-b border-border/50 transition-colors',
        onClick && 'cursor-pointer hover:bg-border/30'
      )}
    >
      {children}
    </tr>
  )
}

export function Td({ children, mono }) {
  return (
    <td className={clsx('px-4 py-3 text-text-dim', mono && 'font-mono text-xs')}>
      {children}
    </td>
  )
}

export function ProgressBar({ value, max }) {
  const pct = Math.min((value / max) * 100, 100)
  const color = pct >= 90 ? 'bg-danger' : pct >= 70 ? 'bg-warning' : 'bg-accent'
  return (
    <div className="w-full bg-border rounded-full h-1.5 mt-2">
      <div className={clsx('h-1.5 rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function EmptyState({ message }) {
  return (
    <div className="text-center py-12 text-text-dim text-sm font-mono">
      {message}
    </div>
  )
}
