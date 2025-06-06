export function getSupabaseToken(): string | null {
  if (typeof window === "undefined") return null

  // Essayer de récupérer le token depuis localStorage ou sessionStorage
  const localToken = localStorage.getItem("supabase.auth.token")
  const sessionToken = sessionStorage.getItem("supabase.auth.token")

  // Essayer aussi les clés alternatives
  const altLocalToken = localStorage.getItem("sb-ttetnxacihuszvcscbtl-auth-token")
  const altSessionToken = sessionStorage.getItem("sb-ttetnxacihuszvcscbtl-auth-token")

  return localToken || sessionToken || altLocalToken || altSessionToken
}

export function getAuthHeaders(): HeadersInit {
  const token = getSupabaseToken()
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  return headers
}
