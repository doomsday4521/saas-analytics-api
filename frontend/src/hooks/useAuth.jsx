import { createContext, useContext, useState } from 'react'
import { login as loginApi, register as registerApi, logout as logoutApi } from '../api/endpoints'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = sessionStorage.getItem('access_token')
    return token ? { token } : null
  })

  const login = async (email, password) => {
    const data = await loginApi({ email, password })
    sessionStorage.setItem('access_token', data.access_token)
    sessionStorage.setItem('refresh_token', data.refresh_token)
    setUser({ token: data.access_token })
    return data
  }

  const register = async (name, email, password) => {
    const data = await registerApi({ name, email, password })
    return data
  }

  const logout = async () => {
    const refresh_token = sessionStorage.getItem('refresh_token')
    try { await logoutApi(refresh_token) } catch {}
    sessionStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
