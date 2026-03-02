import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bsigkxsqvdqagcphwkto.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzaWdreHNxdmRxYWdjcGh3a3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMzEwNTAsImV4cCI6MjA4NjgwNzA1MH0.FECxFdXfk4keNtEjEB-zNrKc9fsNJ_YUDGVEgPCvxuc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
