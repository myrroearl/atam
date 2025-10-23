"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

interface ProfileContextType {
  profilePictureUrl: string | null
  setProfilePictureUrl: (url: string | null) => void
  isLoading: boolean
  refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

interface ProfileProviderProps {
  children: ReactNode
}

export function ProfileProvider({ children }: ProfileProviderProps) {
  const { data: session } = useSession()
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshProfile = async () => {
    if (!session?.user?.account_id) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      
      // Fetch profile picture via API to avoid server-side issues
      const response = await fetch('/api/student/profile', { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        const student = data.student
        if (student?.profile_picture_url) {
          setProfilePictureUrl(student.profile_picture_url)
        } else {
          setProfilePictureUrl(null)
        }
      } else {
        console.error('Failed to fetch profile data')
        setProfilePictureUrl(null)
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
      setProfilePictureUrl(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshProfile()
  }, [session?.user?.account_id, session?.user?.role])

  const value: ProfileContextType = {
    profilePictureUrl,
    setProfilePictureUrl,
    isLoading,
    refreshProfile
  }

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}