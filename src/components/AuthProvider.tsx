'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { Citizen } from '@/lib/types'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  citizen: Citizen | null
  loading: boolean
  refreshCitizen: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null, citizen: null, loading: true,
  refreshCitizen: async () => {}, signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [citizen, setCitizen] = useState<Citizen | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCitizen = async (uid: string) => {
    const { data } = await supabase
      .from('citizens')
      .select('*, barangays(name)')
      .eq('user_id', uid)
      .single()
    setCitizen(data)
  }

  const refreshCitizen = async () => {
    if (user) await fetchCitizen(user.id)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setCitizen(null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchCitizen(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchCitizen(session.user.id)
      else setCitizen(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, citizen, loading, refreshCitizen, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
