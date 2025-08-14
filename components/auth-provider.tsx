"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { authApi, getAuthToken, setAuthToken, removeAuthToken } from "@/lib/api"

interface User {
  _id: string
  email: string
  name: string
  preferences?: {
    alertDays: number
    defaultShelf: string
    theme: string
  }
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = getAuthToken()
      if (savedToken) {
        setToken(savedToken)

        // Verify token and get user profile
        const response = await authApi.getProfile()
        if (response.success && response.data) {
          setUser(response.data)
        } else {
          // Token is invalid, remove it
          removeAuthToken()
          setToken(null)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password })

      if (response.success && response.data) {
        const { user: userData, token: userToken } = response.data
        setUser(userData)
        setToken(userToken)
        setAuthToken(userToken)
        return { success: true }
      } else {
        return { success: false, error: response.error || "Login failed" }
      }
    } catch (error) {
      return { success: false, error: "Network error occurred" }
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await authApi.register({ email, password, name })

      if (response.success && response.data) {
        const { user: userData, token: userToken } = response.data
        setUser(userData)
        setToken(userToken)
        setAuthToken(userToken)
        return { success: true }
      } else {
        return { success: false, error: response.error || "Registration failed" }
      }
    } catch (error) {
      return { success: false, error: "Network error occurred" }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    removeAuthToken()
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
