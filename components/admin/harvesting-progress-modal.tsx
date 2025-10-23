"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle, AlertCircle, Database, Globe, Filter } from "lucide-react"

interface HarvestingProgressModalProps {
  isOpen: boolean
  onClose: () => void
}

interface HarvestingStatus {
  stage: 'initializing' | 'fetching' | 'cleaning' | 'inserting' | 'completed' | 'error'
  progress: number
  message: string
  details?: {
    totalCollected?: number
    uniqueInserted?: number
    duplicatesSkipped?: number
    invalidSkipped?: number
    error?: string
  }
}

export function HarvestingProgressModal({ isOpen, onClose }: HarvestingProgressModalProps) {
  const [status, setStatus] = useState<HarvestingStatus>({
    stage: 'initializing',
    progress: 0,
    message: 'Initializing data harvesting process...'
  })

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setStatus({
        stage: 'initializing',
        progress: 0,
        message: 'Initializing data harvesting process...'
      })
    }
  }, [isOpen])

  const startHarvesting = async () => {
    try {
      // Stage 1: Initializing
      setStatus({
        stage: 'initializing',
        progress: 10,
        message: 'Initializing harvesting process...'
      })

      await new Promise(resolve => setTimeout(resolve, 300))

      // Stage 2: Fetching data from the internet
      setStatus({
        stage: 'fetching',
        progress: 30,
        message: 'Fetching educational resources from the internet...'
      })

      // Make actual API call
      const response = await fetch('/api/admin/learning-resources/harvest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to harvest resources')
      }

      // Stage 3: Data cleaning and validation
      setStatus({
        stage: 'cleaning',
        progress: 60,
        message: 'Cleaning and validating data...',
        details: {
          totalCollected: result.breakdown?.totalCollected || 0
        }
      })

      await new Promise(resolve => setTimeout(resolve, 800))

      // Stage 4: Inserting into database
      setStatus({
        stage: 'inserting',
        progress: 85,
        message: 'Saving validated resources to database...',
        details: {
          totalCollected: result.breakdown?.totalCollected || 0,
          duplicatesSkipped: result.breakdown?.duplicatesSkipped || 0,
          invalidSkipped: result.breakdown?.invalidSkipped || 0
        }
      })

      await new Promise(resolve => setTimeout(resolve, 500))

      // Stage 5: Completed
      setStatus({
        stage: 'completed',
        progress: 100,
        message: result.success 
          ? `Successfully harvested ${result.resourcesAdded} unique resources!` 
          : result.message,
        details: {
          totalCollected: result.breakdown?.totalCollected || 0,
          uniqueInserted: result.resourcesAdded || 0,
          duplicatesSkipped: result.breakdown?.duplicatesSkipped || 0,
          invalidSkipped: result.breakdown?.invalidSkipped || 0
        }
      })

    } catch (error) {
      console.error('Harvesting error:', error)
      setStatus({
        stage: 'error',
        progress: 100,
        message: 'An error occurred during harvesting',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    }
  }

  // Start harvesting when modal opens
  useEffect(() => {
    if (isOpen && status.stage === 'initializing' && status.progress === 0) {
      startHarvesting()
    }
  }, [isOpen])

  const getStageIcon = () => {
    switch (status.stage) {
      case 'initializing':
        return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
      case 'fetching':
        return <Globe className="h-6 w-6 text-blue-500 animate-pulse" />
      case 'cleaning':
        return <Filter className="h-6 w-6 text-orange-500 animate-pulse" />
      case 'inserting':
        return <Database className="h-6 w-6 text-green-500 animate-pulse" />
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />
      case 'error':
        return <XCircle className="h-6 w-6 text-red-500" />
      default:
        return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
    }
  }

  const getProgressColor = () => {
    if (status.stage === 'completed') return 'bg-green-500'
    if (status.stage === 'error') return 'bg-red-500'
    return 'bg-blue-500'
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Allow closing only when completed or error
      if (!open && (status.stage === 'completed' || status.stage === 'error')) {
        onClose()
      }
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStageIcon()}
            Data Harvesting in Progress
          </DialogTitle>
          <DialogDescription>
            Please wait while we harvest learning resources from multiple sources
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{status.message}</span>
              <span className="text-muted-foreground">{status.progress}%</span>
            </div>
            <Progress value={status.progress} className={getProgressColor()} />
          </div>

          {/* Stage Indicators */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-4 rounded-lg border transition-all ${status.stage === 'fetching' || status.progress >= 30 ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-200 bg-gray-50 dark:bg-gray-900'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Globe className={`h-4 w-4 ${status.stage === 'fetching' ? 'text-blue-500 animate-pulse' : status.progress >= 30 ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className="text-xs font-medium">Fetching Data</span>
              </div>
              <p className="text-xs text-muted-foreground">From the Internet</p>
            </div>

            <div className={`p-4 rounded-lg border transition-all ${status.stage === 'cleaning' || status.progress >= 60 ? 'border-orange-500 bg-orange-50 dark:bg-orange-950' : 'border-gray-200 bg-gray-50 dark:bg-gray-900'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Filter className={`h-4 w-4 ${status.stage === 'cleaning' ? 'text-orange-500 animate-pulse' : status.progress >= 60 ? 'text-orange-500' : 'text-gray-400'}`} />
                <span className="text-xs font-medium">Data Cleaning</span>
              </div>
              <p className="text-xs text-muted-foreground">Validation & Deduplication</p>
            </div>

            <div className={`p-4 rounded-lg border transition-all ${status.stage === 'inserting' || status.progress >= 85 ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-gray-200 bg-gray-50 dark:bg-gray-900'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Database className={`h-4 w-4 ${status.stage === 'inserting' ? 'text-green-500 animate-pulse' : status.progress >= 85 ? 'text-green-500' : 'text-gray-400'}`} />
                <span className="text-xs font-medium">Database Insert</span>
              </div>
              <p className="text-xs text-muted-foreground">Saving Resources</p>
            </div>
          </div>

          {/* Statistics */}
          {status.details && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              {status.details.totalCollected !== undefined && (
                <div>
                  <p className="text-xs text-muted-foreground">Total Collected</p>
                  <p className="text-2xl font-bold">{status.details.totalCollected}</p>
                </div>
              )}
              {status.details.uniqueInserted !== undefined && (
                <div>
                  <p className="text-xs text-muted-foreground">Unique Inserted</p>
                  <p className="text-2xl font-bold text-green-500">{status.details.uniqueInserted}</p>
                </div>
              )}
              {status.details.duplicatesSkipped !== undefined && status.details.duplicatesSkipped > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Duplicates Skipped</p>
                  <p className="text-lg font-semibold text-yellow-500">{status.details.duplicatesSkipped}</p>
                </div>
              )}
              {status.details.invalidSkipped !== undefined && status.details.invalidSkipped > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Invalid Skipped</p>
                  <p className="text-lg font-semibold text-red-500">{status.details.invalidSkipped}</p>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {status.stage === 'error' && status.details?.error && (
            <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-950 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">Error Details</p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">{status.details.error}</p>
              </div>
            </div>
          )}

          {/* Completion Message */}
          {status.stage === 'completed' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="text-sm text-green-900 dark:text-green-100">
                  Harvesting completed successfully!
                </p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    onClose()
                    window.location.reload()
                  }}
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

