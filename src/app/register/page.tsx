'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Barangay } from '@/lib/types'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [barangayId, setBarangayId] = useState('')
  const [barangaySearch, setBarangaySearch] = useState('')
  const [street, setStreet] = useState('')
  const [validId, setValidId] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [barangays, setBarangays] = useState<Barangay[]>([])
  const [showBrgyPicker, setShowBrgyPicker] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const idRef = useRef<HTMLInputElement>(null)
  const selfieRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.from('barangays').select('id, name').order('name').then(({ data }) => {
      if (data) setBarangays(data)
    })
  }, [])

  const filteredBrgys = barangaySearch
    ? barangays.filter(b => b.name.toLowerCase().includes(barangaySearch.toLowerCase()))
    : barangays

  const selectedBrgy = barangays.find(b => String(b.id) === barangayId)

  const uploadFile = async (file: File, folder: string) => {
    const ext = file.name.split('.').pop()
    const path = `${folder}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('citizen-uploads').upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from('citizen-uploads').getPublicUrl(path)
    return data.publicUrl
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name || !email || !password) { setError('Please fill all required fields'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (!birthdate) { setError('Please select your birthdate'); return }
    if (!barangayId) { setError('Please select your barangay'); return }
    if (!validId) { setError('Please upload a valid ID'); return }
    if (!selfie) { setError('Please take a selfie'); return }

    setLoading(true)
    try {
      const { data: auth, error: authErr } = await supabase.auth.signUp({ email, password })
      if (authErr) throw authErr
      if (!auth.user) throw new Error('Registration failed')

      const idUrl = await uploadFile(validId, 'valid-ids')
      const selfieUrl = await uploadFile(selfie, 'selfies')
      const qr = `BRG-${crypto.randomUUID().substring(0, 8).toUpperCase()}`

      const { error: insertErr } = await supabase.from('citizens').insert({
        user_id: auth.user.id,
        full_name: name,
        email,
        phone,
        birthdate,
        barangay_id: parseInt(barangayId),
        street_address: street,
        valid_id_url: idUrl,
        selfie_url: selfieUrl,
        citizen_qr_code: qr,
        status: 'pending',
      })
      if (insertErr) throw insertErr
      router.push('/')
    } catch (e: unknown) {
      setError((e instanceof Error ? e.message : 'Registration failed').replace('AuthApiError: ', ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header */}
      <div className="bg-[var(--navy)] text-white px-4 py-3 safe-top">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/login" className="text-white p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-lg font-bold">Register</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6">
        {/* City Seal */}
        <div className="flex justify-center mb-3">
          <div className="w-[60px] h-[60px] rounded-full border-2 border-[var(--gold)] overflow-hidden">
            <img src="/city-seal.png" alt="" className="w-full h-full object-cover" />
          </div>
        </div>
        <h2 className="text-center text-xl font-bold text-[var(--navy)] mb-5">Citizen Registration</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
          <IconInput icon="person" label="Full Name *" value={name} onChange={setName} />
          <IconInput icon="email" label="Email *" type="email" value={email} onChange={setEmail} />
          <IconInput icon="lock" label="Password *" type="password" value={password} onChange={setPassword} />

          {/* Birthdate */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </span>
            <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-300 bg-white focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy)]/20 outline-none" />
          </div>

          <IconInput icon="phone" label="Phone" type="tel" value={phone} onChange={setPhone} />

          {/* Barangay picker */}
          <div className="relative" onClick={() => setShowBrgyPicker(true)}>
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </span>
            <div className="w-full pl-11 pr-10 py-3.5 rounded-xl border border-gray-300 bg-white cursor-pointer">
              <span className={selectedBrgy ? 'text-gray-900' : 'text-gray-400'}>
                {selectedBrgy?.name || 'Barangay *'}
              </span>
            </div>
            <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>

          <IconInput icon="home" label="Street Address" value={street} onChange={setStreet} />

          {/* Document uploads */}
          <p className="font-bold text-[var(--navy)] pt-2">Upload Documents</p>

          <DocUpload label="Valid ID *" subtitle="Government-issued ID" file={validId}
            inputRef={idRef} accept="image/*" onSelect={f => setValidId(f)} />

          <DocUpload label="Selfie *" subtitle="Take a clear photo of your face" file={selfie}
            inputRef={selfieRef} accept="image/*" capture="user" onSelect={f => setSelfie(f)} />

          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-[var(--navy)] text-white font-semibold rounded-xl disabled:opacity-50 mt-2">
            {loading ? <span className="flex items-center justify-center"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /></span> : 'Register'}
          </button>

          <p className="text-center text-sm text-gray-500 pb-8">
            Already have an account?{' '}
            <Link href="/login" className="text-[var(--navy)] font-bold">Sign In</Link>
          </p>
        </form>
      </div>

      {/* Barangay Bottom Sheet */}
      {showBrgyPicker && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={() => setShowBrgyPicker(false)}>
          <div className="bg-white rounded-t-2xl max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
              <h3 className="text-base font-bold text-[var(--navy)] mb-3">Select Barangay</h3>
              <input type="text" value={barangaySearch} onChange={e => setBarangaySearch(e.target.value)}
                placeholder="Search barangay..." autoFocus
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[var(--navy)]" />
            </div>
            <div className="overflow-y-auto flex-1">
              {filteredBrgys.map(b => (
                <button key={b.id}
                  className={`w-full px-4 py-3 text-left flex items-center gap-3 border-b border-gray-50 active:bg-gray-50 ${String(b.id) === barangayId ? 'bg-[var(--navy)]/5' : ''}`}
                  onClick={() => { setBarangayId(String(b.id)); setShowBrgyPicker(false); setBarangaySearch('') }}>
                  <svg className="w-4 h-4 text-[var(--navy)] opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                  <span className="text-sm">{b.name}</span>
                  {String(b.id) === barangayId && <span className="ml-auto text-[var(--navy)]">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function IconInput({ icon, label, type = 'text', value, onChange }: {
  icon: string; label: string; type?: string; value: string; onChange: (v: string) => void
}) {
  const icons: Record<string, React.ReactNode> = {
    person: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    email: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    lock: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
    phone: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
    home: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  }
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{icons[icon]}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={label}
        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-300 bg-white focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy)]/20 outline-none" />
    </div>
  )
}

function DocUpload({ label, subtitle, file, inputRef, accept, capture, onSelect }: {
  label: string; subtitle: string; file: File | null; inputRef: React.RefObject<HTMLInputElement | null>; accept: string; capture?: string; onSelect: (f: File) => void
}) {
  return (
    <div onClick={() => inputRef.current?.click()}
      className={`p-4 rounded-xl border cursor-pointer transition flex items-center gap-3 ${file ? 'border-green-300 bg-white' : 'border-gray-300 bg-white'}`}>
      <input ref={inputRef} type="file" accept={accept} capture={capture as unknown as boolean} className="hidden"
        onChange={e => { if (e.target.files?.[0]) onSelect(e.target.files[0]) }} />
      <div className={`flex-shrink-0 ${file ? 'text-green-500' : 'text-gray-400'}`}>
        {file ? (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        ) : (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className={`text-xs ${file ? 'text-green-600' : 'text-gray-500'}`}>{file ? 'File selected ✓' : subtitle}</p>
      </div>
      {file && (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  )
}
