export interface Citizen {
  id: string
  user_id: string
  full_name: string
  email: string
  phone?: string
  birthdate?: string
  barangay_id?: number
  street_address?: string
  valid_id_url?: string
  selfie_url?: string
  avatar_url?: string
  citizen_qr_code?: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  created_at?: string
  barangays?: { name: string }
}

export interface Service {
  id: number
  name: string
  description?: string
  icon?: string
  is_active: boolean
}

export interface ServiceEnrollment {
  id: number
  citizen_id: string
  service_id: number
  status: string
  services?: { name: string }
}

export interface Barangay {
  id: number
  name: string
}
