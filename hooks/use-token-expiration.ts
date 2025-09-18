"use client"

import { useEffect, useState } from 'react'
import { useToast } from './use-toast'

interface TokenInfo {
  exp: number
  iat: number
}

export function useTokenExpiration() {
  const [tokenExpiry, setTokenExpiry] = useState<number | null>(null)
  const [warningShown, setWarningShown] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const checkTokenExpiration = () => {
      if (typeof window === 'undefined') return

      const token = localStorage.getItem('auth-token')
      if (!token) {
        setTokenExpiry(null)
        setWarningShown(false)
        return
      }

      try {
        // Decode JWT token to get expiration
        const payload = JSON.parse(atob(token.split('.')[1])) as TokenInfo
        const expirationTime = payload.exp * 1000 // Convert to milliseconds
        const currentTime = Date.now()
        const timeUntilExpiry = expirationTime - currentTime

        setTokenExpiry(expirationTime)

        // Show warning if token expires in less than 5 minutes
        if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0 && !warningShown) {
          const minutesLeft = Math.ceil(timeUntilExpiry / (60 * 1000))
          
          toast({
            title: "Session Expiring Soon",
            description: `Your session will expire in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}. Please save your work and refresh the page to continue.`,
            variant: "destructive",
            duration: 10000 // Show for 10 seconds
          })
          
          setWarningShown(true)
        }

        // If token is already expired, clear it
        if (timeUntilExpiry <= 0) {
          localStorage.removeItem('auth-token')
          localStorage.removeItem('auth-store')
          localStorage.removeItem('user-email')
          localStorage.removeItem('user-role')
          setTokenExpiry(null)
          setWarningShown(false)
        }
      } catch (error) {
        console.error('Error checking token expiration:', error)
        // If token is malformed, clear it
        localStorage.removeItem('auth-token')
        localStorage.removeItem('auth-store')
        localStorage.removeItem('user-email')
        localStorage.removeItem('user-role')
        setTokenExpiry(null)
        setWarningShown(false)
      }
    }

    // Listen for session expired events from http service
    const handleSessionExpired = (event: CustomEvent) => {
      const { title, description, variant } = event.detail
      toast({
        title,
        description,
        variant: variant as "destructive"
      })
    }

    // Check immediately
    checkTokenExpiration()

    // Check every minute
    const interval = setInterval(checkTokenExpiration, 60 * 1000)

    // Listen for session expired events
    window.addEventListener('session-expired', handleSessionExpired as EventListener)

    return () => {
      clearInterval(interval)
      window.removeEventListener('session-expired', handleSessionExpired as EventListener)
    }
  }, [toast, warningShown])

  return {
    tokenExpiry,
    isExpired: tokenExpiry ? tokenExpiry <= Date.now() : false,
    timeUntilExpiry: tokenExpiry ? Math.max(0, tokenExpiry - Date.now()) : null
  }
}
