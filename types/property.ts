import type { User } from "./user"

export interface PropertyImage {
  id: string
  property_id: string
  url: string
  is_primary: boolean
  created_at: string
}

export interface Property {
  id: string
  title: string
  description: string
  price: number
  surface: number
  rooms: number
  bedrooms: number
  bathrooms: number
  address: string
  city: string
  postal_code: string
  latitude?: number
  longitude?: number
  property_type: "apartment" | "house" | "studio" | "loft"
  furnished: boolean
  available: boolean
  owner_id: string
  created_at: string
  updated_at: string

  // Relations
  owner?: User
  images?: PropertyImage[]
}
