export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  user_type: "tenant" | "owner" | "admin"
  avatar_url?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}
