'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'

interface Medicine { id: number; name: string; generic_name?: string; category?: string; available_qty: number; unit?: string }
interface Claim { id: number; medicine_id: number; quantity: number; status: string; created_at: string; prescription_url?: string; medicines?: { name: string } }

function LibreMedisinaContent() {
  const { user, citizen, loading } = useAuth()
  const router = useRouter()
  const [enrolled, setEnrolled] = useState(false)
  const [tab, setTab] = useState<'medicines' | 'claims'>('medicines')
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [search, setSearch] = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const [requestingMed, setRequestingMed] = useState<Medicine | null>(null)
  const [qty, setQty] = useState(1)
  const [prescription, setPrescription] = useState<File | null>(null)
  const prescRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  const load = async () => {
    if (!citizen) return
    const { data: enrollments } = await supabase.from('service_enrollments')
      .select('*, services!inner(name)').eq('citizen_id', citizen.id).eq('services.name', 'Libre Medisina')
    const isActive = enrollments && enrollments.length > 0 && enrollments[0].status === 'active'
    setEnrolled(!!isActive)

    if (isActive) {
      const { data: meds } = await supabase.from('medicines').select().order('name')
      const { data: cls } = await supabase.from('medicine_claims').select('*, medicines(name)')
        .eq('citizen_id', citizen.id).order('created_at', { ascending: false })
      setMedicines(meds || [])
      setClaims(cls || [])
    }
    setPageLoading(false)
  }

  useEffect(() => { if (citizen) load() }, [citizen])

  const filtered = search
    ? medicines.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || (m.generic_name || '').toLowerCase().includes(search.toLowerCase()))
    : medicines

  const submitRequest = async () => {
    if (!requestingMed || !citizen) return
    let prescUrl: string | undefined
    if (prescription) {
      const path = `${citizen.id}/prescriptions/${crypto.randomUUID()}`
      await supabase.storage.from('citizen-uploads').upload(path, prescription)
      const { data } = supabase.storage.from('citizen-uploads').getPublicUrl(path)
      prescUrl = data.publicUrl
    }
    await supabase.from('medicine_claims').insert({
      citizen_id: citizen.id, medicine_id: requestingMed.id, quantity: qty, prescription_url: prescUrl, status: 'pending',
    })
    setRequestingMed(null)
    setQty(1)
    setPrescription(null)
    load()
  }

  if (loading || pageLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-[var(--navy)] border-t-transparent rounded-full" /></div>

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      {/* Header */}
      <div className="bg-[var(--navy)] text-white">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
          <h1 className="text-lg font-bold">Libre Medisina</h1>
        </div>
        {enrolled && (
          <div className="max-w-lg mx-auto flex border-b border-white/20">
            <button onClick={() => setTab('medicines')}
              className={`flex-1 py-2.5 text-sm font-semibold text-center ${tab === 'medicines' ? 'border-b-2 border-[var(--gold)] text-white' : 'text-white/60'}`}>Medicines</button>
            <button onClick={() => setTab('claims')}
              className={`flex-1 py-2.5 text-sm font-semibold text-center ${tab === 'claims' ? 'border-b-2 border-[var(--gold)] text-white' : 'text-white/60'}`}>My Claims</button>
          </div>
        )}
      </div>

      {!enrolled ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-8">
            <span className="text-6xl block mb-4">💊</span>
            <h2 className="text-xl font-bold text-[var(--navy)]">Not Enrolled</h2>
            <p className="text-gray-500 text-sm mt-2">Enroll in Libre Medisina from the Services page.</p>
            <button onClick={() => router.push('/services')} className="mt-5 px-6 py-3 bg-[var(--navy)] text-white rounded-xl font-semibold text-sm">Go to Services</button>
          </div>
        </div>
      ) : (
        <div className="flex-1 max-w-lg mx-auto w-full">
          {tab === 'medicines' ? (
            <div className="flex flex-col h-full">
              <div className="p-3">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medicines..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white border-none shadow-sm text-sm outline-none" />
              </div>
              <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
                {filtered.length === 0 ? <p className="text-center text-gray-400 text-sm py-8">No medicines found</p> : (
                  filtered.map(m => (
                    <div key={m.id} className="bg-white rounded-2xl p-3.5 shadow-sm flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">💊</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{m.name}</p>
                        <p className="text-xs text-gray-500 truncate">{m.generic_name} • {m.category}</p>
                        <p className="text-xs text-gray-400">Available: {m.available_qty} {m.unit}</p>
                      </div>
                      <button onClick={() => { setRequestingMed(m); setQty(1) }} disabled={m.available_qty <= 0}
                        className="px-3 py-1.5 bg-[var(--navy)] text-white text-xs font-semibold rounded-lg disabled:opacity-30">Request</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="px-3 py-4 space-y-2">
              {claims.length === 0 ? <p className="text-center text-gray-400 text-sm py-8">No claims yet</p> : (
                claims.map(c => {
                  const colors: Record<string, string> = { pending: 'text-orange-600 bg-orange-100', approved: 'text-blue-600 bg-blue-100', dispensed: 'text-green-600 bg-green-100', rejected: 'text-red-600 bg-red-100' }
                  return (
                    <div key={c.id} className="bg-white rounded-2xl p-3.5 shadow-sm flex items-center gap-3">
                      <span className={`text-lg ${c.status === 'dispensed' ? 'text-green-500' : c.status === 'rejected' ? 'text-red-500' : 'text-orange-500'}`}>💊</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{c.medicines?.name || 'Medicine'}</p>
                        <p className="text-xs text-gray-500">Qty: {c.quantity} • {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${colors[c.status] || 'bg-gray-100 text-gray-600'}`}>{c.status.toUpperCase()}</span>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Request Modal */}
      {requestingMed && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setRequestingMed(null)}>
          <div className="w-full max-w-lg mx-auto bg-white rounded-t-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto" />
            <h3 className="text-lg font-bold text-[var(--navy)]">Request: {requestingMed.name}</h3>
            {requestingMed.generic_name && <p className="text-sm text-gray-500">{requestingMed.generic_name}</p>}

            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm">Quantity:</span>
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xl">−</button>
              <span className="text-lg font-bold w-6 text-center">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xl">+</button>
            </div>

            <div onClick={() => prescRef.current?.click()}
              className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 ${prescription ? 'border-green-300' : 'border-gray-300'}`}>
              <input ref={prescRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) setPrescription(e.target.files[0]) }} />
              <svg className={`w-5 h-5 ${prescription ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              <span className="text-sm">{prescription ? 'Prescription uploaded' : 'Upload prescription (optional)'}</span>
            </div>

            <button onClick={submitRequest} className="w-full py-3.5 bg-[var(--navy)] text-white font-semibold rounded-xl text-sm">Submit Request</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LibreMedisinaPage() {
  return <AuthProvider><LibreMedisinaContent /></AuthProvider>
}
