"use client"

import { useState, useEffect } from 'react'

interface DashboardStats {
  active_students: {
    total: number
    growth_percentage: number
    period: string
  }
  active_professors: {
    total: number
    growth_percentage: number
    period: string
  }
  top_performers: {
    total: number
    growth_percentage: number
    period: string
  }
  unauthorized_logs: {
    total: number
    growth_percentage: number
    period: string
  }
}

interface DashboardData {
  dashboard_stats: DashboardStats
  raw_data: any
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/dashboard/stats')
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }
        
        const result = await response.json()
        setData(result)
        setError(null)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const refreshData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/dashboard/stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      
      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err) {
      console.error('Error refreshing dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return {
    data,
    loading,
    error,
    refreshData
  }
}
