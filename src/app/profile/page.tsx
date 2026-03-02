'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { BottomNav } from '@/components/BottomNav'
import { supabase } from '@/lib/supabase'
import { ServiceEnrollment } from '@/lib/types'

function ProfileContent() {
  const { user, citizen, loading, refreshCitizen, signOut } = useAuth()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [street, setStreet] = useState('')
  const [enrollments, setEnrollments] = useState<ServiceEnrollment[]>([])
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  useEffect(() => {
    if (citizen) {
      setName(citizen.full_name || '')
      setPhone(citizen.phone || '')
      setStreet(citizen.street_address || '')
      supabase.from('service_enrollments').select('*, services(name)')
        .eq('citizen_id', citizen.id).then(({ data }) => setEnrollments(data || []))
    }
  }, [citizen])

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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-navy border-t-transparent rounded-full" /></div>
  if (!citizen) return null

  const avatar = citizen.avatar_url || citizen.selfie_url

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-navy text-white px-4 py-4 safe-top">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold">Profile</h1>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="text-gold text-sm font-semibold">Edit</button>
          ) : (
            <button onClick={handleSave} disabled={saving} className="text-gold text-sm font-semibold">
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative" onClick={() => avatarRef.current?.click()}>
            <div className="w-24 h-24 rounded-full border-3 border-gold overflow-hidden bg-gray-100 cursor-pointer">
              {uploadingAvatar ? (
                <div className="w-full h-full flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-navy border-t-transparent rounded-full" /></div>
              ) : avatar ? (
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">👤</div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-navy rounded-full border-2 border-white flex items-center justify-center cursor-pointer">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <p className="mt-3 font-bold text-navy text-lg">{citizen.full_name}</p>
          <p className="text-gray-400 text-xs">{citizen.email}</p>
        </div>

        {/* Info fields */}
        <div className="space-y-3">
          <h3 className="font-bold text-navy text-sm">Personal Information</h3>
          <Field label="Full Name" value={name} editing={editing} onChange={setName} />
          <Field label="Phone" value={phone} editing={editing} onChange={setPhone} />
          <Field label="Street Address" value={street} editing={editing} onChange={setStreet} />
          <ReadOnly label="Barangay" value={citizen.barangays?.name || '—'} />
          <ReadOnly label="Birthdate" value={citizen.birthdate || '—'} />
          <ReadOnly label="Status" value={citizen.status} />
        </div>

        {/* ID docs */}
        {(citizen.valid_id_url || citizen.selfie_url) && (
          <div className="mt-6">
            <h3 className="font-bold text-navy text-sm mb-3">ID Documents</h3>
            <div className="grid grid-cols-2 gap-3">
              {citizen.valid_id_url && <DocThumb label="Valid ID" url={citizen.valid_id_url} />}
              {citizen.selfie_url && <DocThumb label="Selfie" url={citizen.selfie_url} />}
            </div>
          </div>
        )}

        {/* Services */}
        {enrollments.length > 0 && (
          <div className="mt-6">
            <h3 className="font-bold text-navy text-sm mb-3">Enrolled Services</h3>
            <div className="space-y-2">
              {enrollments.map(e => (
                <div key={e.id} className="bg-white rounded-xl p-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${e.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-sm flex-1">{e.services?.name}</span>
                  <span className="text-xs text-gray-400">{e.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <button onClick={handleSignOut}
          className="w-full mt-8 py-3 border border-red-300 text-red-500 font-semibold rounded-xl active:bg-red-50 transition">
          Log Out
        </button>
      </div>
      <BottomNav />
    </div>
  )
}

function Field({ label, value, editing, onChange }: { label: string; value: string; editing: boolean; onChange: (v: string) => void }) {
  if (!editing) return <ReadOnly label={label} value={value || '—'} />
  return (
    <div className="bg-white rounded-xl p-3">
      <label className="block text-[10px] text-gray-400 font-medium mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)}
        className="w-full text-sm outline-none border-b border-navy/20 pb-1 focus:border-navy" />
    </div>
  )
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl p-3">
      <p className="text-[10px] text-gray-400 font-medium">{label}</p>
      <p className="text-sm text-gray-800 mt-0.5">{value}</p>
    </div>
  )
}

function DocThumb({ label, url }: { label: string; url: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer rounded-xl overflow-hidden border border-gray-200 relative h-24 bg-gray-100">
        <img src={url} alt={label} className="w-full h-full object-cover" />
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
          <p className="text-white text-[10px] text-center">{label}</p>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <img src={url} alt={label} className="max-w-full max-h-[80vh] object-contain rounded-lg" />
        </div>
      )}
    </>
  )
}

export default function ProfilePage() {
  return <AuthProvider><ProfileContent /></AuthProvider>
}
