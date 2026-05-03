import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  LayoutDashboard, Users, Key, CreditCard,
  AlertTriangle, Webhook, LogOut, Activity
} from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/api-keys', label: 'API Keys', icon: Key },
  { to: '/billing', label: 'Billing', icon: CreditCard },
  { to: '/anomalies', label: 'Anomalies', icon: AlertTriangle },
  { to: '/webhooks', label: 'Webhooks', icon: Webhook },
]

export default function Sidebar() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="w-56 min-h-screen bg-surface border-r border-border flex flex-col">
      <div className="px-5 py-6 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-accent" />
          <span className="font-mono font-semibold text-sm text-text tracking-wide">NexusMetrics</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2 rounded text-sm transition-all',
              isActive
                ? 'bg-accent/10 text-accent font-medium'
                : 'text-text-dim hover:text-text hover:bg-border/50'
            )}
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded text-sm text-text-dim hover:text-danger hover:bg-danger/10 transition-all"
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </aside>
  )
}
