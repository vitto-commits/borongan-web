'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { BottomNav } from '@/components/BottomNav'
import { supabase } from '@/lib/supabase'

interface EnrollmentData { id: number; service_id: number; status: string; services?: { name: string } }
interface DocData { id: number; service_id?: number; label: string; file_url: string; file_name: string; uploaded_at?: string; services?: { name: string } }

function ProfileContent() {
  const { user, citizen, loading, refreshCitizen, signOut } = useAuth()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [street, setStreet] = useState('')
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([])
  const [documents, setDocuments] = useState<DocData[]>([])
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const avatarRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  const loadData = async () => {
    if (!citizen) return
    setName(citizen.full_name || '')
    setPhone(citizen.phone || '')
    setStreet(citizen.street_address || '')
    const { data: e } = await supabase.from('service_enrollments').select('*, services(name)').eq('citizen_id', citizen.id)
    const { data: d } = await supabase.from('citizen_documents').select('*, services(name)').eq('citizen_id', citizen.id).order('uploaded_at', { ascending: false })
    setEnrollments(e || [])
    setDocuments(d || [])
  }

  useEffect(() => { if (citizen) loadData() }, [citizen])

  const handleSave = async () => {
    if (!citizen) return
    setSaving(true)
    await supabase.from('citizens').update({ full_name: name, phone, street_address: street }).eq('id', citizen.id)
    await refreshCitizen()
    setSaving(false)
    setEditing(false)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !citizen) return
    setUploadingAvatar(true)
    try {
      const file = e.target.files[0]
      const ext = file.name.split('.').pop()
      const path = `avatars/${citizen.id}.${ext}`
      await supabase.storage.from('citizen-uploads').upload(path, file, { upsert: true })
      const { data } = supabase.storage.from('citizen-uploads').getPublicUrl(path)
      await supabase.from('citizens').update({ avatar_url: data.publicUrl }).eq('id', citizen.id)
      await refreshCitizen()
    } catch (err) {
      console.error(err)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-[var(--navy)] border-t-transparent rounded-full" /></div>
  if (!citizen) return null

  const avatar = citizen.avatar_url || citizen.selfie_url
  const docsByService: Record<number, DocData[]> = {}
  for (const doc of documents) {
    const sid = doc.service_id ?? 0
    if (!docsByService[sid]) docsByService[sid] = []
    docsByService[sid].push(doc)
  }

  return (
    <div className="min-h-screen pb-20 bg-[#F5F7FA]">
      <div className="max-w-lg mx-auto px-4 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-[22px] font-bold text-[var(--navy)]">Profile</h1>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="p-2"><svg className="w-5 h-5 text-[var(--navy)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
          ) : (
            <button onClick={handleSave} disabled={saving} className="text-[var(--navy)] font-bold text-sm">{saving ? 'Saving...' : 'Save'}</button>
          )}
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative cursor-pointer" onClick={() => avatarRef.current?.click()}>
            <div className="w-[90px] h-[90px] rounded-full border-[3px] border-[var(--gold)] overflow-hidden bg-gray-200">
              {uploadingAvatar ? (
                <div className="w-full h-full flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-[var(--navy)] border-t-transparent rounded-full" /></div>
              ) : avatar ? (
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">👤</div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-[30px] h-[30px] bg-[var(--navy)] rounded-full border-2 border-white flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <p className="mt-2.5 text-xl font-bold text-[var(--navy)]">{citizen.full_name}</p>
          <p className="text-sm text-gray-500">{citizen.email}</p>
        </div>

        {/* Rejection notice */}
        {citizen.status === 'rejected' && (
          <div className="bg-red-50 rounded-xl p-3 mb-4 flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <p className="font-bold text-sm">Registration Rejected</p>
              <p className="text-sm text-gray-600">{citizen.rejection_reason || 'No reason provided'}</p>
            </div>
          </div>
        )}

        {/* Personal Info */}
        <h3 className="font-bold text-[var(--navy)] mb-3">Personal Information</h3>
        <div className="space-y-3 mb-6">
          {editing ? (
            <>
              <EditField label="Full Name" value={name} onChange={setName} />
              <EditField label="Phone" value={phone} onChange={setPhone} />
              <EditField label="Street Address" value={street} onChange={setStreet} />
            </>
          ) : (
            <>
              <ReadField label="Full Name" value={name} />
              <ReadField label="Phone" value={phone} />
              <ReadField label="Street Address" value={street} />
            </>
          )}
          <ReadField label="Barangay" value={citizen.barangays?.name || '—'} />
          <ReadField label="Birthdate" value={citizen.birthdate || '—'} />
          <ReadField label="Status" value={citizen.status || '—'} />
        </div>

        {/* ID Documents */}
        {(citizen.valid_id_url || citizen.selfie_url) && (
          <>
            <h3 className="font-bold text-[var(--navy)] mb-3">ID Documents</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {citizen.valid_id_url && <DocThumb label="Valid ID" url={citizen.valid_id_url} onPreview={setPreviewUrl} />}
              {citizen.selfie_url && <DocThumb label="Selfie" url={citizen.selfie_url} onPreview={setPreviewUrl} />}
            </div>
          </>
        )}

        {/* Enrolled Services */}
        <h3 className="font-bold text-[var(--navy)] mb-3">Enrolled Services</h3>
        {enrollments.length === 0 ? (
          <p className="text-gray-400 text-sm mb-6">No services enrolled</p>
        ) : (
          <div className="space-y-2 mb-6">
            {enrollments.map(e => (
              <div key={e.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
                <svg className={`w-5 h-5 ${e.status === 'active' ? 'text-green-500' : 'text-orange-500'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                <span className="flex-1 text-sm font-medium">{e.services?.name}</span>
                <span className={`text-xs ${e.status === 'active' ? 'text-green-600' : 'text-orange-600'}`}>{e.status}</span>
              </div>
            ))}
          </div>
        )}

        {/* My Documents */}
        {documents.length > 0 && (
          <>
            <h3 className="font-bold text-[var(--navy)] mb-3">My Documents</h3>
            <p className="text-xs text-gray-400 mb-3">Organized by service. Tap to preview.</p>
            {Object.entries(docsByService).map(([sid, docs]) => {
              const serviceName = sid === '0' ? 'General' : docs[0]?.services?.name || 'Service'
              return (
                <div key={sid} className="bg-white rounded-xl border border-gray-200 mb-3 overflow-hidden">
                  <div className="bg-gray-50 px-3.5 py-2.5 flex items-center gap-2">
                    <span className="text-sm">📁</span>
                    <span className="font-semibold text-sm text-gray-600">{serviceName}</span>
                    <span className="ml-auto text-xs text-gray-400">{docs.length} file(s)</span>
                  </div>
                  {docs.map(doc => (
                    <div key={doc.id} className="px-3.5 py-2.5 border-t border-gray-100 flex items-center gap-2 cursor-pointer active:bg-gray-50"
                      onClick={() => setPreviewUrl(doc.file_url)}>
                      <span className="text-blue-500">🖼️</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{doc.file_name}</p>
                        <p className="text-[11px] text-gray-400">{doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </>
        )}

        {/* Logout */}
        <button onClick={handleSignOut}
          className="w-full mt-6 py-3.5 border border-red-300 text-red-500 font-semibold rounded-xl flex items-center justify-center gap-2 active:bg-red-50 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Log Out
        </button>
      </div>

      {/* Image Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <button className="absolute top-4 right-4 text-white" onClick={() => setPreviewUrl(null)}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img src={previewUrl} alt="" className="max-w-full max-h-[80vh] object-contain rounded-lg" />
        </div>
      )}

      <BottomNav />
    </div>
  )
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl p-3.5">
      <p className="text-[11px] text-gray-400 font-medium">{label}</p>
      <p className="text-[15px] mt-0.5">{value || '—'}</p>
    </div>
  )
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="bg-white rounded-xl p-3.5">
      <label className="block text-[11px] text-gray-400 font-medium mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)}
        className="w-full text-[15px] border-b border-[var(--navy)]/20 pb-1 outline-none focus:border-[var(--navy)]" />
    </div>
  )
}

function DocThumb({ label, url, onPreview }: { label: string; url: string; onPreview: (url: string) => void }) {
  return (
    <div className="h-[100px] rounded-xl border border-gray-300 overflow-hidden relative cursor-pointer" onClick={() => onPreview(url)}>
      <img src={url} alt={label} className="w-full h-full object-cover" />
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-1">
        <p className="text-white text-[11px] text-center">{label}</p>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return <AuthProvider><ProfileContent /></AuthProvider>
}
