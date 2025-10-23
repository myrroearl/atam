"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, Shield, CheckCircle, X, Upload } from 'lucide-react'

interface UploadConfirmationModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function UploadConfirmationModal({ 
  isOpen, 
  onConfirm, 
  onCancel 
}: UploadConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <Card className="w-full max-w-md mx-4 bg-white dark:bg-gray-900">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center space-x-2">
            <Camera className="w-5 h-5 text-purple-600" />
            <span>Upload Profile Picture</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Requirements Display */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Camera className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-purple-900 dark:text-purple-100">
                    Supported formats:
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    JPG, PNG, WebP
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Maximum size:
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    2MB
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              What happens next:
            </p>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Select your image file</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Crop and adjust your photo</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Preview and confirm upload</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={onConfirm}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Photo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}