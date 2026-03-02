'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message.replace('AuthApiError: ', ''))
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#F5F7FA]">
      <div className="w-full max-w-sm">
        {/* City Seal */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full border-2 border-[var(--gold)] overflow-hidden">
            <img src="/city-seal.png" alt="Borongan City" className="w-full h-full object-cover" />
          </div>
        </div>

        <h1 className="text-center text-2xl font-bold text-[var(--navy)] mb-1">Welcome Back</h1>
        <p className="text-center text-gray-500 text-sm mb-8">Sign in to your citizen account</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-300 bg-white focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy)]/20 outline-none" placeholder="Email" />
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </span>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-300 bg-white focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy)]/20 outline-none" placeholder="Password" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-[var(--navy)] text-white font-semibold rounded-xl hover:bg-[var(--navy-light)] transition disabled:opacity-50">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[var(--navy)] font-bold">Register</Link>
        </p>
      </div>
    </div>
  )
}
