"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

interface PrivacySettings {
  profileVisibility: 'public' | 'private'
}

interface PrivacyContextType {
  privacySettings: PrivacySettings
  setPrivacySettings: (settings: PrivacySettings) => void
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => Promise<void>
  isLoading: boolean
  error: string | null
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined)

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'public'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPrivacySettings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/student/privacy-settings', {
        cache: 'no-store',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[Privacy Context] Loaded privacy settings:', data)
        setPrivacySettings(data.privacySettings || { profileVisibility: 'public' })
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('[Privacy Context] Failed to load privacy settings:', response.status, errorData)
        setError(errorData.error || 'Failed to load privacy settings')
        // Set default settings on error
        setPrivacySettings({ profileVisibility: 'public' })
      }
    } catch (err: any) {
      console.error('[Privacy Context] Error loading privacy settings:', err)
      setError(err.message || 'Error loading privacy settings')
      // Set default settings on error
      setPrivacySettings({ profileVisibility: 'public' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load privacy settings when session is available
  useEffect(() => {
    if (session?.user?.account_id && session?.user?.role === 'student') {
      loadPrivacySettings()
    } else {
      // If not authenticated as student, stop loading
      setIsLoading(false)
    }
  }, [session?.user?.account_id, session?.user?.role, loadPrivacySettings])

  const updatePrivacySettings = async (newSettings: Partial<PrivacySettings>) => {
    try {
      setError(null)
      
      const updatedSettings = { ...privacySettings, ...newSettings }
      
      const response = await fetch('/api/student/privacy-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[Privacy Context] Updated privacy settings:', data)
        setPrivacySettings(data.privacySettings)
        return data.privacySettings
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Failed to update privacy settings'
        console.error('Failed to update privacy settings:', response.status, errorData)
        setError(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (err: any) {
      console.error('Error updating privacy settings:', err)
      const errorMessage = err.message || 'Error updating privacy settings'
      setError(errorMessage)
      throw err
    }
  }

  return (
    <PrivacyContext.Provider
      value={{
        privacySettings,
        setPrivacySettings,
        updatePrivacySettings,
        isLoading,
        error,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  )
}

export function usePrivacy() {
  const context = useContext(PrivacyContext)
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider')
  }
  return context
}