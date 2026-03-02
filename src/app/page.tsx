'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { BottomNav } from '@/components/BottomNav'

function HomeContent() {
  const { user, citizen, loading } = useAuth()
  const router = useRouter()
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  if (loading) return <Loading />
  if (!citizen) return null

  const firstName = (citizen.full_name || '').split(' ')[0]
  const avatar = citizen.avatar_url || citizen.selfie_url
  const qrCode = citizen.citizen_qr_code || ''
  const idDisplay = qrCode.length >= 8 ? qrCode.substring(0, 8).toUpperCase() : qrCode.toUpperCase()
  const isApproved = citizen.status === 'approved'

  return (
    <div className="min-h-screen pb-20 bg-[#F5F7FA]">
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <img src="/city-seal.png" alt="" className="w-9 h-9 rounded-full object-cover" />
          <div className="flex-1">
            <p className="text-xl font-bold text-[var(--navy)]">Hello, {firstName} 👋</p>
            <p className="text-xs text-gray-500">Borongan City Citizen Portal</p>
          </div>
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--navy)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        {/* Flippable ID Card */}
        <div className="mb-5" style={{ perspective: '1000px' }} onClick={() => setFlipped(!flipped)}>
          <div className={`card-inner w-full ${flipped ? 'flipped' : ''}`} style={{ aspectRatio: '3.375/2.125' }}>
            {/* FRONT */}
            <div className="card-front rounded-2xl overflow-hidden shadow-lg" style={{ background: 'linear-gradient(135deg, var(--navy), var(--navy-dark))' }}>
              {/* Card Header */}
              <div className="flex items-center justify-center gap-2 py-2 bg-white/10">
                <img src="/city-seal.png" alt="" className="w-5 h-5 rounded-full" />
                <div className="text-center">
                  <p className="text-[6px] text-white/70 tracking-wider">REPUBLIC OF THE PHILIPPINES</p>
                  <p className="text-[9px] font-bold text-white tracking-wider">CITY OF BORONGAN</p>
                  <p className="text-[7px] text-[var(--gold-light)] tracking-widest">CITIZEN IDENTIFICATION CARD</p>
                </div>
                <img src="/city-seal.png" alt="" className="w-5 h-5 rounded-full" />
              </div>
              <div className="h-0.5 bg-[var(--gold)]" />

              {/* Card Body */}
              <div className="flex gap-3 px-3.5 py-2.5 flex-1">
                {/* Photo */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-[70px] h-[84px] rounded-lg border-[1.5px] border-white/30 overflow-hidden bg-white/10 flex-shrink-0">
                    {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/50 text-2xl">👤</div>}
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold text-white ${isApproved ? 'bg-green-500' : 'bg-orange-500'}`}>
                    {isApproved ? '✓ VERIFIED' : '⏳ PENDING'}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{citizen.full_name}</p>
                  <div className="mt-1.5 space-y-0.5">
                    <InfoRow label="Address" value={`Brgy. ${citizen.barangays?.name || ''}, Borongan City`} />
                    <InfoRow label="Birthday" value={citizen.birthdate || ''} />
                    <InfoRow label="ID No." value={idDisplay} />
                  </div>
                </div>

                {/* QR */}
                <div className="flex-shrink-0 self-center">
                  <div className="bg-white rounded-md p-1">
                    <div className="w-[60px] h-[60px] bg-gray-200 rounded flex items-center justify-center">
                      <svg className="w-10 h-10 text-[var(--navy)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-center gap-1 py-1.5 bg-white/5">
                <span className="text-[7px] text-white/40">Issued by the City Government of Borongan</span>
                <svg className="w-2.5 h-2.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                <span className="text-[7px] text-white/30">Tap to flip</span>
              </div>
            </div>

            {/* BACK */}
            <div className="card-back rounded-2xl overflow-hidden shadow-lg" style={{ background: 'linear-gradient(135deg, var(--navy-dark), var(--navy))' }}>
              <div className="flex items-center justify-center py-2 bg-white/10">
                <p className="text-[11px] font-bold text-[var(--gold-light)] tracking-widest">SCAN TO VERIFY</p>
              </div>
              <div className="h-0.5 bg-[var(--gold)]" />
              <div className="flex-1 flex items-center justify-center gap-4 py-4">
                <div className="bg-white rounded-xl p-2.5">
                  <div className="w-[110px] h-[110px] bg-gray-200 rounded flex items-center justify-center">
                    <svg className="w-16 h-16 text-[var(--navy)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{citizen.full_name}</p>
                  <div className="mt-1.5 px-2.5 py-1 bg-white/10 rounded-md">
                    <p className="text-[10px] text-[var(--gold-light)] font-semibold tracking-wider">ID: {idDisplay}</p>
                  </div>
                  <p className="text-[10px] text-white/60 mt-1.5">Brgy. {citizen.barangays?.name || ''}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-1 py-1.5 bg-white/5">
                <svg className="w-2.5 h-2.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                <span className="text-[7px] text-white/30">Tap to flip back</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <h3 className="text-lg font-bold text-[var(--navy)] mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <ActionCard icon="🚌" label="Libre Sakay" color="blue" href="/services/libre-sakay" />
          <ActionCard icon="💊" label="Libre Medisina" color="red" href="/services/libre-medisina" />
          <ActionCard icon="👴" label="Senior Allowance" color="purple" href="/services/allowance" />
          <ActionCard icon="🎓" label="Student Allowance" color="teal" href="/services/allowance" />
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <span className="w-12 text-[8px] text-white/50 font-medium">{label}</span>
      <span className="text-[10px] text-white font-medium truncate">{value}</span>
    </div>
  )
}

function ActionCard({ icon, label, color, href }: { icon: string; label: string; color: string; href: string }) {
  const router = useRouter()
  const bgColors: Record<string, string> = { blue: 'bg-blue-50', red: 'bg-red-50', purple: 'bg-purple-50', teal: 'bg-teal-50' }
  return (
    <div onClick={() => router.push(href)}
      className="bg-white rounded-2xl p-5 shadow-sm cursor-pointer active:scale-[0.98] transition flex flex-col items-center gap-2.5">
      <div className={`w-12 h-12 rounded-xl ${bgColors[color]} flex items-center justify-center text-2xl`}>{icon}</div>
      <p className="text-[13px] font-semibold text-[var(--navy)] text-center">{label}</p>
    </div>
  )
}

function Loading() {
  return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-[var(--navy)] border-t-transparent rounded-full" /></div>
}

export default function HomePage() {
  return <AuthProvider><HomeContent /></AuthProvider>
}
