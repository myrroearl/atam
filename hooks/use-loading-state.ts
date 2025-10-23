"use client"

import { useState, useEffect, useCallback } from 'react'

interface UseLoadingStateOptions {
  initialLoading?: boolean
  delay?: number // Minimum loading time to prevent flash
  timeout?: number // Maximum loading time
}

export function useLoadingState(options: UseLoadingStateOptions = {}) {
  const { initialLoading = false, delay = 0, timeout } = options
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [error, setError] = useState<string | null>(null)

  const startLoading = useCallback(() => {
    setError(null)
    setIsLoading(true)
  }, [])

  const stopLoading = useCallback(() => {
    setIsLoading(false)
  }, [])

  const setErrorState = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setIsLoading(false)
  }, [])

  // Auto-stop loading after timeout
  useEffect(() => {
    if (isLoading && timeout) {
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, timeout)

      return () => clearTimeout(timer)
    }
  }, [isLoading, timeout])

  // Minimum loading delay
  const stopLoadingWithDelay = useCallback(() => {
    if (delay > 0) {
      setTimeout(() => {
        setIsLoading(false)
      }, delay)
    } else {
      setIsLoading(false)
    }
  }, [delay])

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    stopLoadingWithDelay,
    setErrorState,
    setIsLoading
  }
}

// Hook for async operations with loading state
export function useAsyncLoading<T>(
  asyncFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const { isLoading, error, startLoading, stopLoading, setErrorState } = useLoadingState()

  const execute = useCallback(async () => {
    try {
      startLoading()
      const result = await asyncFn()
      stopLoading()
      return result
    } catch (err) {
      setErrorState(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }, dependencies)

  return {
    isLoading,
    error,
    execute
  }
}

// Hook for multiple loading states
export function useMultipleLoadingStates(keys: string[]) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    keys.reduce((acc, key) => ({ ...acc, [key]: false }), {})
  )

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }))
  }, [])

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false
  }, [loadingStates])

  const isAnyLoading = Object.values(loadingStates).some(Boolean)
  const isAllLoading = Object.values(loadingStates).every(Boolean)

  return {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    isAllLoading
  }
}
