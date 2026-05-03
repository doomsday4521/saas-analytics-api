import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Activity } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Activity size={20} className="text-accent" />
          <span className="font-mono font-semibold text-text tracking-wide">NexusMetrics</span>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-sm font-mono font-semibold text-text mb-1">Sign in</h2>
          <p className="text-xs text-text-dim mb-6">Access your analytics dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-text-dim font-mono uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-accent transition-colors"
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-text-dim font-mono uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-accent transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-xs text-danger font-mono bg-danger/10 px-3 py-2 rounded">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-bg font-mono font-semibold text-sm py-2 rounded hover:bg-accent-dim transition-colors disabled:opacity-40"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-text-dim text-center mt-4">
            No account?{' '}
            <Link to="/register" className="text-accent hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
