import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let active = true
    api.me().then((profile) => { if (active) setUser(profile) }).catch(() => {
      try { localStorage.removeItem('lg_auth_token') } catch { /* storage may be disabled */ }
    }).finally(() => { if (active) setReady(true) })
    return () => { active = false }
  }, [])
  const login = async (email, password) => {
    const result = await api.login(email, password)
    localStorage.setItem('lg_auth_token', result.access_token)
    setUser(result.user)
  }
  const logout = () => {
    try { localStorage.removeItem('lg_auth_token') } catch { /* storage may be disabled */ }
    setUser(null)
  }
  return <AuthContext.Provider value={{ user, ready, login, logout }}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
