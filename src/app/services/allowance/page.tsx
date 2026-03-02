'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'

function AllowanceContent() {
  const { user, citizen, loading } = useAuth()
  const router = useRouter()
  const [enrolled, setEnrolled] = useState(false)
  const [payments, setPayments] = useState<Record<string, unknown>[]>([])
  const [distributions, setDistributions] = useState<Record<string, unknown>[]>([])
  const [serviceType, setServiceType] = useState('')
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  useEffect(() => {
    if (!citizen) return
    const load = async () => {
      const getAge = () => {
        if (!citizen.birthdate) return 0
        const bd = new Date(citizen.birthdate)
        const now = new Date()
        let age = now.getFullYear() - bd.getFullYear()
        if (now.getMonth() < bd.getMonth() || (now.getMonth() === bd.getMonth() && now.getDate() < bd.getDate())) age--
        return age
      }
      const type = getAge() >= 60 ? 'Senior Citizen Allowance' : 'Student Allowance'
      setServiceType(type)

      const { data: enrollments } = await supabase.from('service_enrollments').select('*, services!inner(name)').eq('citizen_id', citizen.id)
      const seniorActive = enrollments?.some((e: Record<string, unknown>) => (e.services as Record<string, unknown>)?.name === 'Senior Citizen Allowance' && e.status === 'active')
      const studentActive = enrollments?.some((e: Record<string, unknown>) => (e.services as Record<string, unknown>)?.name === 'Student Allowance' && e.status === 'active')
      setEnrolled(!!(seniorActive || studentActive))

      if (seniorActive || studentActive) {
        const { data: pays } = await supabase.from('allowance_payments')
          .select('*, allowance_distributions(period_label, distribution_date, status)')
          .eq('citizen_id', citizen.id).order('created_at', { ascending: false })
        const { data: dists } = await supabase.from('allowance_distributions').select().order('distribution_date', { ascending: false }).limit(5)
        setPayments(pays || [])
        setDistributions(dists || [])
      }
      setPageLoading(false)
    }
    load()
  }, [citizen])

  if (loading || pageLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-[var(--navy)] border-t-transparent rounded-full" /></div>

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[var(--navy)] text-white px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
          <h1 className="text-lg font-bold">Allowance Tracker</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {!enrolled ? (
          <div className="text-center py-16">
            <span className="text-6xl block mb-4">💰</span>
            <h2 className="text-xl font-bold text-[var(--navy)]">Not Enrolled</h2>
            <p className="text-gray-500 text-sm mt-2">Enroll in {serviceType} from the Services page to track your allowance payments.</p>
            <button onClick={() => router.push('/services')} className="mt-5 px-6 py-3 bg-[var(--navy)] text-white rounded-xl font-semibold text-sm">Go to Services</button>
          </div>
        ) : (
          <>
            {distributions.length > 0 && (
              <>
                <h3 className="font-bold text-[var(--navy)] mb-2">Next Distribution</h3>
                <div className="rounded-2xl p-4 mb-6 text-white" style={{ background: 'linear-gradient(135deg, var(--navy), var(--navy-light))' }}>
                  <p className="font-bold">{distributions[0].period_label as string}</p>
                  <p className="text-sm text-white/80 mt-1">Date: {(distributions[0].distribution_date as string) || 'TBD'}</p>
                  <p className="text-sm text-[var(--gold-light)]">Status: {distributions[0].status as string}</p>
                </div>
              </>
            )}

            <h3 className="font-bold text-[var(--navy)] mb-3">Payment History ({payments.length})</h3>
            {payments.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-gray-400 text-sm">No payments recorded yet</div>
            ) : (
              <div className="space-y-2">
                {payments.map((p, i) => {
                  const status = (p.status as string) || ''
                  const dist = p.allowance_distributions as Record<string, string> | null
                  const colors: Record<string, string> = { pending: 'text-orange-600', paid: 'text-green-600', unclaimed: 'text-red-600' }
                  const icons: Record<string, string> = { pending: '⏳', paid: '✅', unclaimed: '❌' }
                  return (
                    <div key={i} className="bg-white rounded-2xl p-3.5 shadow-sm flex items-center gap-3">
                      <span className="text-lg">{icons[status] || '⏳'}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{dist?.period_label || 'Distribution'}</p>
                        <p className="text-xs text-gray-500">
                          {p.paid_at ? `Paid: ${new Date(p.paid_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Pending'}
                        </p>
                      </div>
                      <span className={`text-base font-bold ${colors[status] || 'text-gray-600'}`}>₱{p.amount as number || 0}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function AllowancePage() {
  return <AuthProvider><AllowanceContent /></AuthProvider>
}
