'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { BottomNav } from '@/components/BottomNav'
import { supabase } from '@/lib/supabase'

interface ServiceData {
  id: number; name: string; description?: string; eligibility_type?: string; is_active: boolean
}
interface EnrollmentData {
  id: number; service_id: number; status: string; extra_data?: Record<string, string>
}

const serviceConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
  'Libre Sakay': { icon: '🚌', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Libre Medisina': { icon: '💊', color: 'text-red-600', bgColor: 'bg-red-50' },
  'Senior Citizen Allowance': { icon: '👴', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'Student Allowance': { icon: '🎓', color: 'text-teal-600', bgColor: 'bg-teal-50' },
}

const serviceColorMap: Record<string, string> = {
  'Libre Sakay': 'bg-blue-600', 'Libre Medisina': 'bg-red-600',
  'Senior Citizen Allowance': 'bg-purple-600', 'Student Allowance': 'bg-teal-600',
}

function ServicesContent() {
  const { user, citizen, loading } = useAuth()
  const router = useRouter()
  const [services, setServices] = useState<ServiceData[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [school, setSchool] = useState('')
  const [studentId, setStudentId] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [docFile, setDocFile] = useState<File | null>(null)
  const docRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  useEffect(() => {
    supabase.from('services').select('*').eq('is_active', true).order('name').then(({ data }) => setServices(data || []))
  }, [])

  const loadEnrollments = async () => {
    if (!citizen) return
    const { data } = await supabase.from('service_enrollments').select('*').eq('citizen_id', citizen.id)
    setEnrollments(data || [])
  }

  useEffect(() => { if (citizen) loadEnrollments() }, [citizen])

  const getAge = () => {
    if (!citizen?.birthdate) return 0
    const bd = new Date(citizen.birthdate)
    const now = new Date()
    let age = now.getFullYear() - bd.getFullYear()
    if (now.getMonth() < bd.getMonth() || (now.getMonth() === bd.getMonth() && now.getDate() < bd.getDate())) age--
    return age
  }

  const getEnrollment = (sid: number) => enrollments.find(e => e.service_id === sid)
  const isApproved = citizen?.status === 'approved'

  const enroll = async (service: ServiceData) => {
    if (!citizen) return
    setEnrolling(true)
    try {
      const extra: Record<string, string> = {}
      const isStudent = service.eligibility_type === 'student'

      if (isStudent && (!school || !studentId || !gradeLevel)) {
        alert('Please fill all student fields')
        setEnrolling(false)
        return
      }

      if (docFile) {
        const ext = docFile.name.split('.').pop()
        const path = `${citizen.id}/${service.name.toLowerCase().replace(/ /g, '-')}-${crypto.randomUUID()}.${ext}`
        await supabase.storage.from('citizen-uploads').upload(path, docFile)
        const { data } = supabase.storage.from('citizen-uploads').getPublicUrl(path)
        extra.supporting_document = data.publicUrl
      }

      if (isStudent) {
        extra.school_name = school
        extra.student_id = studentId
        extra.grade_level = gradeLevel
      }

      await supabase.from('service_enrollments').insert({
        citizen_id: citizen.id,
        service_id: service.id,
        status: 'pending',
        ...(Object.keys(extra).length > 0 && { extra_data: extra }),
      })

      await loadEnrollments()
      setExpanded(null)
      setDocFile(null)
      setSchool('')
      setStudentId('')
      setGradeLevel('')
    } catch (e) {
      console.error(e)
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-[var(--navy)] border-t-transparent rounded-full" /></div>

  return (
    <div className="min-h-screen pb-20 bg-[#F5F7FA]">
      <div className="max-w-lg mx-auto px-4 py-5">
        <h1 className="text-[22px] font-bold text-[var(--navy)]">City Services</h1>
        <p className="text-gray-500 text-sm mb-4">Enroll in government programs</p>

        {!isApproved && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 flex items-start gap-2">
            <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-sm">Your account must be verified before enrolling in services.</span>
          </div>
        )}

        <div className="space-y-3">
          {services.map(s => {
            const enrollment = getEnrollment(s.id)
            const config = serviceConfig[s.name] || { icon: '📋', color: 'text-gray-600', bgColor: 'bg-gray-50' }
            const isExpanded = expanded === String(s.id)
            const isStudent = s.eligibility_type === 'student'
            const isSenior = s.eligibility_type === 'senior'
            const needsForm = isStudent || s.name === 'Libre Sakay' || s.name === 'Libre Medisina'

            let eligible = !!isApproved
            let reason = ''
            if (isSenior && getAge() < 60) { eligible = false; reason = 'Must be 60+ years old' }

            return (
              <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center text-2xl flex-shrink-0`}>{config.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[15px] text-[var(--navy)]">{s.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{s.description || ''}</p>
                  </div>
                </div>

                <div className="mt-3">
                  {enrollment ? (
                    <StatusBadge status={enrollment.status} />
                  ) : !eligible && reason ? (
                    <p className="text-xs text-red-600">{reason}</p>
                  ) : eligible ? (
                    <button
                      onClick={() => needsForm ? setExpanded(isExpanded ? null : String(s.id)) : enroll(s)}
                      disabled={enrolling}
                      className={`w-full py-3 text-white font-semibold rounded-xl text-sm ${serviceColorMap[s.name] || 'bg-[var(--navy)]'} disabled:opacity-50`}>
                      {enrolling ? 'Submitting...' : 'Apply Now'}
                    </button>
                  ) : null}
                </div>

                {/* Expandable form */}
                {isExpanded && !enrollment && (
                  <div className={`mt-3.5 p-3.5 rounded-xl ${config.bgColor} space-y-3`}>
                    {isStudent ? (
                      <>
                        <p className="font-semibold text-sm">Student Information</p>
                        <input value={school} onChange={e => setSchool(e.target.value)} placeholder="School Name *"
                          className="w-full px-3.5 py-3 rounded-xl border border-gray-300 bg-white text-sm outline-none focus:border-[var(--navy)]" />
                        <input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Student ID *"
                          className="w-full px-3.5 py-3 rounded-xl border border-gray-300 bg-white text-sm outline-none focus:border-[var(--navy)]" />
                        <input value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} placeholder="Grade/Year Level *"
                          className="w-full px-3.5 py-3 rounded-xl border border-gray-300 bg-white text-sm outline-none focus:border-[var(--navy)]" />
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-sm">Upload Supporting Document</p>
                        <p className="text-[11px] text-gray-500">E.g., proof of residency, barangay clearance</p>
                      </>
                    )}

                    <div onClick={() => docRef.current?.click()}
                      className={`p-3.5 rounded-xl bg-white border cursor-pointer flex items-center gap-2.5 ${docFile ? 'border-green-300' : 'border-gray-300'}`}>
                      <input ref={docRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) setDocFile(e.target.files[0]) }} />
                      <svg className={`w-5 h-5 ${docFile ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      <span className={`text-sm ${docFile ? 'text-green-700' : 'text-gray-500'}`}>{docFile ? 'Document selected' : 'Tap to upload'}</span>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => enroll(s)} disabled={enrolling}
                        className={`flex-1 py-3 text-white font-semibold rounded-xl text-sm ${serviceColorMap[s.name] || 'bg-[var(--navy)]'} disabled:opacity-50`}>
                        {enrolling ? 'Submitting...' : 'Submit Application'}
                      </button>
                      <button onClick={() => { setExpanded(null); setDocFile(null) }}
                        className="px-4 py-3 text-gray-500 text-sm font-medium">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-700', pending: 'bg-orange-100 text-orange-700',
    rejected: 'bg-red-100 text-red-700', suspended: 'bg-gray-100 text-gray-700',
  }
  const labels: Record<string, string> = {
    active: '✓ Active', pending: '⏳ Pending Approval', rejected: '✗ Rejected', suspended: 'Suspended',
  }
  return (
    <div className={`w-full text-center py-2 rounded-lg text-sm font-semibold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {labels[status] || status}
    </div>
  )
}

export default function ServicesPage() {
  return <AuthProvider><ServicesContent /></AuthProvider>
}
