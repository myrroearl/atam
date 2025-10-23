"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface LoadingContextType {
  isLoading: boolean
  loadingStates: Record<string, boolean>
  setLoading: (key: string, loading: boolean) => void
  setGlobalLoading: (loading: boolean) => void
  isAnyLoading: boolean
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

interface LoadingProviderProps {
  children: ReactNode
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }))
  }, [])

  const setGlobalLoading = useCallback((loading: boolean) => {
    setIsLoading(loading)
  }, [])

  const isAnyLoading = isLoading || Object.values(loadingStates).some(Boolean)

  const value: LoadingContextType = {
    isLoading,
    loadingStates,
    setLoading,
    setGlobalLoading,
    isAnyLoading
  }

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}
