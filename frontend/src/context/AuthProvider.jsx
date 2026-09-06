import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, clearToken, getStoredToken, isDemoMode, setToken } from '../services/api'
import { AuthContext } from './authContext'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isChecking, setIsChecking] = useState(Boolean(getStoredToken()))
  const navigate = useNavigate()

  useEffect(() => {
    if (!getStoredToken()) return
    api.auth.me()
      .then((response) => setUser(response.user || response))
      .catch(() => clearToken())
      .finally(() => setIsChecking(false))
  }, [])

  const login = async (credentials) => {
    const response = await api.auth.login(credentials)
    if (!response.token || !response.user) throw new Error('The login response is incomplete.')
    setToken(response.token)
    setUser(response.user)
    return response.user
  }

  const signup = async (details) => {
    const response = await api.auth.signup(details)
    if (!response.token || !response.user) throw new Error('The signup response is incomplete.')
    setToken(response.token)
    setUser(response.user)
    return response.user
  }

  const logout = async () => {
    try { await api.auth.logout() } catch { /* local logout must still complete */ }
    clearToken()
    setUser(null)
    navigate('/', { replace: true })
  }

  return (
    <AuthContext.Provider value={{ user, isChecking, isAuthenticated: Boolean(user), isDemoMode, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
