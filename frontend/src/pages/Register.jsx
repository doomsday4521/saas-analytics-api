import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Activity } from 'lucide-react'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await register(form.name, form.email, form.password)
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
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
          <h2 className="text-sm font-mono font-semibold text-text mb-1">Create account</h2>
          <p className="text-xs text-text-dim mb-6">Start tracking your API usage</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {['name', 'email', 'password'].map(field => (
              <div key={field} className="space-y-1.5">
                <label className="text-xs text-text-dim font-mono uppercase tracking-wider">{field}</label>
                <input
                  type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-accent transition-colors"
                  required
                />
              </div>
            ))}

            {error && (
              <p className="text-xs text-danger font-mono bg-danger/10 px-3 py-2 rounded">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-bg font-mono font-semibold text-sm py-2 rounded hover:bg-accent-dim transition-colors disabled:opacity-40"
            >
              {loading ? 'Creating...' : 'Create account'}
            </button>
          </form>

          <p className="text-xs text-text-dim text-center mt-4">
            Have an account?{' '}
            <Link to="/login" className="text-accent hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
