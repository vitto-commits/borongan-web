'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Barangay } from '@/lib/types'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
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
  const selfieRef = useRef<HTMLInputElement>(null)
  const idRef = useRef<HTMLInputElement>(null)

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

  const handleRegister = async () => {
    setLoading(true)
    setError('')
    try {
      if (!name || !email || !password || !birthdate || !barangayId) throw new Error('Please fill all required fields')
      if (password.length < 6) throw new Error('Password must be at least 6 characters')
      if (!validId || !selfie) throw new Error('Please upload your ID and selfie')

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
      const msg = e instanceof Error ? e.message : 'Registration failed'
      setError(msg.replace('AuthApiError: ', ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header */}
      <div className="bg-navy text-white px-4 py-4 safe-top">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/login" className="text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-lg font-bold">Register</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4">
        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${step >= s ? 'bg-navy' : 'bg-gray-200'}`} />
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-700 text-sm">{error}</div>
        )}

        {/* Step 1: Account */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-navy">Account Details</h2>
            <Input label="Full Name *" value={name} onChange={setName} />
            <Input label="Email *" type="email" value={email} onChange={setEmail} />
            <Input label="Password *" type="password" value={password} onChange={setPassword} placeholder="Min 6 characters" />
            <button onClick={() => { if (name && email && password.length >= 6) setStep(2); else setError('Fill all required fields (password min 6 chars)') }}
              className="w-full py-3 bg-navy text-white font-semibold rounded-xl">
              Next
            </button>
          </div>
        )}

        {/* Step 2: Personal */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-navy">Personal Information</h2>
            <Input label="Birthdate *" type="date" value={birthdate} onChange={setBirthdate} />
            <Input label="Phone" type="tel" value={phone} onChange={setPhone} />

            {/* Barangay picker */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Barangay *</label>
              <button
                type="button" onClick={() => setShowBrgyPicker(true)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-left flex justify-between items-center"
              >
                <span className={selectedBrgy ? 'text-gray-900' : 'text-gray-400'}>
                  {selectedBrgy?.name || 'Select barangay'}
                </span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
            </div>

            <Input label="Street Address" value={street} onChange={setStreet} />

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 border border-navy text-navy font-semibold rounded-xl">Back</button>
              <button onClick={() => { if (birthdate && barangayId) setStep(3); else setError('Birthdate and barangay required') }}
                className="flex-1 py-3 bg-navy text-white font-semibold rounded-xl">Next</button>
            </div>
          </div>
        )}

        {/* Step 3: Documents */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-navy">Upload Documents</h2>

            <FileUpload label="Valid Government ID *" file={validId} inputRef={idRef} accept="image/*"
              onSelect={f => setValidId(f)} />

            <FileUpload label="Selfie Photo *" file={selfie} inputRef={selfieRef} accept="image/*" capture="user"
              onSelect={f => setSelfie(f)} />

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3 border border-navy text-navy font-semibold rounded-xl">Back</button>
              <button onClick={handleRegister} disabled={loading}
                className="flex-1 py-3 bg-navy text-white font-semibold rounded-xl disabled:opacity-50">
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Barangay Bottom Sheet */}
      {showBrgyPicker && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={() => setShowBrgyPicker(false)}>
          <div className="bg-white rounded-t-2xl max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
              <h3 className="text-base font-bold text-navy mb-3">Select Barangay</h3>
              <input
                type="text" value={barangaySearch} onChange={e => setBarangaySearch(e.target.value)}
                placeholder="Search barangay..." autoFocus
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-navy"
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {filteredBrgys.map(b => (
                <button key={b.id}
                  className={`w-full px-4 py-3 text-left flex items-center gap-3 border-b border-gray-50 active:bg-gray-50 ${String(b.id) === barangayId ? 'bg-navy/5' : ''}`}
                  onClick={() => { setBarangayId(String(b.id)); setShowBrgyPicker(false); setBarangaySearch('') }}>
                  <svg className="w-4 h-4 text-navy/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-sm">{b.name}</span>
                  {String(b.id) === barangayId && <span className="ml-auto text-navy">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Input({ label, type = 'text', value, onChange, placeholder }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none transition" />
    </div>
  )
}

function FileUpload({ label, file, inputRef, accept, capture, onSelect }: {
  label: string; file: File | null; inputRef: React.RefObject<HTMLInputElement | null>; accept: string; capture?: string; onSelect: (f: File) => void
}) {
  return (
    <div
      onClick={() => inputRef.current?.click()}
      className={`p-4 rounded-xl border-2 border-dashed cursor-pointer transition ${file ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}
    >
      <input ref={inputRef} type="file" accept={accept} capture={capture as unknown as boolean} className="hidden"
        onChange={e => { if (e.target.files?.[0]) onSelect(e.target.files[0]) }} />
      <div className="flex items-center gap-3">
        {file ? (
          <>
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-700">{label.replace(' *', '')} ✓</p>
              <p className="text-xs text-gray-500 truncate">{file.name}</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{label}</p>
              <p className="text-xs text-gray-400">Tap to upload</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
