'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { BottomNav } from '@/components/BottomNav'
import { Service, ServiceEnrollment } from '@/lib/types'
import { supabase } from '@/lib/supabase'

const serviceIcons: Record<string, string> = {
  'Libre Sakay': '🚌',
  'Libre Medisina': '💊',
  'Senior Citizen Allowance': '👴',
  'Student Allowance': '🎓',
}

function ServicesContent() {
  const { user, citizen, loading } = useAuth()
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [enrollments, setEnrollments] = useState<ServiceEnrollment[]>([])
  const [applying, setApplying] = useState<number | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  useEffect(() => {
    supabase.from('services').select('*').eq('is_active', true).order('name').then(({ data }) => setServices(data || []))
  }, [])

  useEffect(() => {
    if (citizen) {
      supabase.from('service_enrollments').select('*').eq('citizen_id', citizen.id).then(({ data }) => setEnrollments(data || []))
    }
  }, [citizen])

  const getEnrollment = (serviceId: number) => enrollments.find(e => e.service_id === serviceId)

  const apply = async (serviceId: number) => {
    if (!citizen) return
    setApplying(serviceId)
    try {
      await supabase.from('service_enrollments').insert({ citizen_id: citizen.id, service_id: serviceId, status: 'pending' })
      const { data } = await supabase.from('service_enrollments').select('*').eq('citizen_id', citizen.id)
      setEnrollments(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setApplying(null)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-navy border-t-transparent rounded-full" /></div>

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-navy text-white px-4 py-4 safe-top">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold">City Services</h1>
          <p className="text-xs text-white/60">Apply for available programs</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {services.map(s => {
          const enrollment = getEnrollment(s.id)
          const enrolled = !!enrollment
          return (
            <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{serviceIcons[s.name] || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-navy text-sm">{s.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{s.description || 'City service program'}</p>
                  {enrollment && (
                    <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      enrollment.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {enrollment.status === 'active' ? '✓ Active' : '⏳ Pending Approval'}
                    </span>
                  )}
                </div>
                {!enrolled && (
                  <button
                    onClick={() => apply(s.id)} disabled={applying === s.id}
                    className="px-3 py-1.5 bg-navy text-white text-xs font-semibold rounded-lg disabled:opacity-50 whitespace-nowrap"
                  >
                    {applying === s.id ? '...' : 'Apply'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {services.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">No services available</div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}

export default function ServicesPage() {
  return <AuthProvider><ServicesContent /></AuthProvider>
}
