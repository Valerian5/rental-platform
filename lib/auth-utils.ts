import { supabase } from "@/lib/supabase"

export async function getSupabaseToken(): Promise<string | null> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Erreur récupération session:", error)
      return null
    }

    return session?.access_token || null
  } catch (error) {
    console.error("Erreur getSupabaseToken:", error)
    return null
  }
}

export async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getSupabaseToken()
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  return headers
}
