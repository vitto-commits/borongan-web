'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'

function LibreSakayContent() {
  const { user, citizen, loading } = useAuth()
  const router = useRouter()
  const [enrolled, setEnrolled] = useState(false)
  const [rides, setRides] = useState<Record<string, string>[]>([])
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  useEffect(() => {
    if (!citizen) return
    const load = async () => {
      const { data: enrollments } = await supabase.from('service_enrollments')
        .select('*, services!inner(name)').eq('citizen_id', citizen.id).eq('services.name', 'Libre Sakay')
      const isActive = enrollments && enrollments.length > 0 && enrollments[0].status === 'active'
      setEnrolled(!!isActive)

      if (isActive) {
        const { data: r } = await supabase.from('libre_sakay_rides').select()
          .eq('citizen_id', citizen.id).order('scanned_at', { ascending: false }).limit(50)
        setRides(r || [])
      }
      setPageLoading(false)
    }
    load()
  }, [citizen])

  if (loading || pageLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-[var(--navy)] border-t-transparent rounded-full" /></div>

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header */}
      <div className="bg-[var(--navy)] text-white px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
          <h1 className="text-lg font-bold">Libre Sakay</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {!enrolled ? (
          <div className="text-center py-16">
            <span className="text-6xl block mb-4">🚌</span>
            <h2 className="text-xl font-bold text-[var(--navy)]">Not Enrolled</h2>
            <p className="text-gray-500 text-sm mt-2">You need to be enrolled and approved for Libre Sakay to use this feature.</p>
            <button onClick={() => router.push('/services')} className="mt-5 px-6 py-3 bg-[var(--navy)] text-white rounded-xl font-semibold text-sm">Go to Services</button>
          </div>
        ) : citizen && (
          <>
            {/* QR Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 text-center">
              <h2 className="text-lg font-bold text-[var(--navy)]">Your Bus Pass</h2>
              <p className="text-sm text-gray-500 mt-1">Show this QR to the bus conductor</p>
              <div className="mt-5 inline-block p-3 border-2 border-[var(--gold)] rounded-2xl">
                <div className="w-[200px] h-[200px] bg-gray-100 rounded-xl flex items-center justify-center">
                  <svg className="w-24 h-24 text-[var(--navy)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                </div>
              </div>
              <p className="mt-3 font-semibold text-[var(--navy)]">{citizen.full_name}</p>
              <p className="text-sm text-gray-500">Brgy. {citizen.barangays?.name}</p>
            </div>

            {/* Ride History */}
            <h3 className="font-bold text-[var(--navy)] mb-3">Ride History ({rides.length})</h3>
            {rides.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-gray-400 text-sm">No rides recorded yet</div>
            ) : (
              <div className="space-y-2">
                {rides.map((r, i) => (
                  <div key={i} className="bg-white rounded-xl p-3.5 flex items-center gap-3">
                    <span className="text-blue-500">🚌</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{r.route || 'Unknown Route'}</p>
                      <p className="text-xs text-gray-500">{new Date(r.scanned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    {r.bus_id && <span className="text-xs text-gray-400">Bus {r.bus_id}</span>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function LibreSakayPage() {
  return <AuthProvider><LibreSakayContent /></AuthProvider>
}
