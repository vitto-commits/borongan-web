'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { BottomNav } from '@/components/BottomNav'
import { ServiceEnrollment } from '@/lib/types'
import { supabase } from '@/lib/supabase'

function HomeContent() {
  const { user, citizen, loading } = useAuth()
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<ServiceEnrollment[]>([])

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  useEffect(() => {
    if (citizen) {
      supabase.from('service_enrollments').select('*, services(name)')
        .eq('citizen_id', citizen.id).then(({ data }) => setEnrollments(data || []))
    }
  }, [citizen])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-navy border-t-transparent rounded-full" /></div>
  if (!citizen) return null

  const avatar = citizen.avatar_url || citizen.selfie_url

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-navy text-white px-4 pt-6 pb-16 safe-top">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-gold overflow-hidden bg-white/10">
              {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/50">👤</div>}
            </div>
            <div>
              <p className="text-xs text-gold">Welcome back</p>
              <p className="font-bold">{citizen.full_name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-12">
        {/* ID Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-navy to-navy-light px-5 py-3 flex items-center gap-3">
            <img src="/city-seal.png" alt="" className="w-8 h-8 rounded-full border border-gold/50" />
            <div>
              <p className="text-white font-bold text-sm">BORONGAN CITY</p>
              <p className="text-gold text-[10px]">Citizen Identification Card</p>
            </div>
          </div>
          <div className="p-5 flex gap-4">
            <div className="w-20 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
              {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">👤</div>}
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="font-bold text-navy text-lg leading-tight truncate">{citizen.full_name}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                <span className="truncate">Brgy. {citizen.barangays?.name || '—'}, Borongan City</span>
              </div>
              {citizen.phone && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <span>{citizen.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  citizen.status === 'approved' ? 'bg-green-100 text-green-700' :
                  citizen.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {citizen.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          {citizen.citizen_qr_code && (
            <div className="border-t border-gray-100 px-5 py-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
              <span className="text-[11px] text-gray-400 font-mono">{citizen.citizen_qr_code}</span>
            </div>
          )}
        </div>

        {/* Rejection notice */}
        {citizen.status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 font-semibold text-sm">Registration Rejected</p>
            <p className="text-red-600 text-xs mt-1">{citizen.rejection_reason || 'No reason provided'}</p>
          </div>
        )}

        {/* Enrolled Services */}
        <h3 className="font-bold text-navy mb-3">My Services</h3>
        {enrollments.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center">
            <p className="text-gray-400 text-sm">No services enrolled yet</p>
            <button onClick={() => router.push('/services')} className="mt-2 text-navy text-sm font-semibold">Browse Services →</button>
          </div>
        ) : (
          <div className="space-y-2">
            {enrollments.map(e => (
              <div key={e.id} className="bg-white rounded-xl p-4 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${e.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="text-sm font-medium flex-1">{e.services?.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${e.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {e.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

export default function HomePage() {
  return <AuthProvider><HomeContent /></AuthProvider>
}
