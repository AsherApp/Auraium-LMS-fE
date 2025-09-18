export type HttpOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: unknown
}

export const apiBase = process.env.NEXT_PUBLIC_API_BASE || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://auraiumlmsbk.up.railway.app')

// Get JWT token from localStorage
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  
  // Get JWT token from localStorage
  const token = localStorage.getItem('auth-token')
  return token
}

export async function http<T>(path: string, opts: HttpOptions = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${apiBase}${path}`
  
  // Get authentication token
  const token = getAuthToken()
  
  // Check if body is FormData
  const isFormData = opts.body instanceof FormData
  
  // Prepare headers
  const headers: Record<string, string> = {
    // Only set Content-Type for non-FormData requests
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(opts.headers || {}),
  }
  
  // Add JWT authentication if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  // Prepare body
  let body: string | FormData | undefined
  if (opts.body) {
    if (isFormData) {
      body = opts.body as FormData
    } else {
      body = JSON.stringify(opts.body)
    }
  }
  
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    body,
    cache: 'no-store',
  })
  
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    
    
    // Handle authentication errors
    if (res.status === 401) {
      // Clear invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token')
        localStorage.removeItem('auth-store')
        localStorage.removeItem('user-email')
        localStorage.removeItem('user-role')
        
        // Show user-friendly session expired message
        if (window.location.pathname !== '/login') {
          // Create a custom event for session expiration
          const sessionExpiredEvent = new CustomEvent('session-expired', {
            detail: {
              title: "Session Expired",
              description: "Your session has expired. Please log in again to continue.",
              variant: "destructive"
            }
          })
          window.dispatchEvent(sessionExpiredEvent)
          
          // Redirect to login after a short delay
          setTimeout(() => {
            window.location.href = '/login'
          }, 2000)
        }
      }
      throw new Error('Session expired. Please log in again.')
    }
    
    // Try to parse JSON error response
    try {
      const errorData = JSON.parse(text)
      if (errorData.error) {
        throw new Error(errorData.error)
      }
      // If no error field, use the full response
      throw new Error(JSON.stringify(errorData))
    } catch (parseError) {
      // If JSON parsing fails, use the raw text
      throw new Error(text || `HTTP ${res.status}`)
    }
  }
  
  if (res.status === 204) return undefined as unknown as T
  return (await res.json()) as T
}

// Convenience methods for common HTTP operations
export const httpClient = {
  get: <T>(path: string, headers?: Record<string, string>) => 
    http<T>(path, { method: 'GET', headers }),
  
  post: <T>(path: string, body?: unknown, headers?: Record<string, string>) => 
    http<T>(path, { method: 'POST', body, headers }),
  
  put: <T>(path: string, body?: unknown, headers?: Record<string, string>) => 
    http<T>(path, { method: 'PUT', body, headers }),
  
  patch: <T>(path: string, body?: unknown, headers?: Record<string, string>) => 
    http<T>(path, { method: 'PATCH', body, headers }),
  
  delete: <T>(path: string, headers?: Record<string, string>) => 
    http<T>(path, { method: 'DELETE', headers }),
}

