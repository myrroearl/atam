"use client"

import React, { useRef, useState, useCallback } from 'react'
import ReactCrop, { 
  centerCrop, 
  makeAspectCrop, 
  Crop, 
  PixelCrop,
  convertToPixelCrop 
} from 'react-image-crop'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, RotateCw, Download } from 'lucide-react'
import 'react-image-crop/dist/ReactCrop.css'

interface ImageCropperProps {
  imageSrc: string
  onCropComplete: (croppedImageBlob: Blob) => void
  onCancel: () => void
  aspectRatio?: number
}

export function ImageCropper({ 
  imageSrc, 
  onCropComplete, 
  onCancel, 
  aspectRatio = 1 
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [rotation, setRotation] = useState(0)
  const imgRef = useRef<HTMLImageElement>(null)

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspectRatio,
        width,
        height
      ),
      width,
      height
    )
    setCrop(crop)
  }

  const getCroppedImg = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    const image = imgRef.current
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = completedCrop.width
    canvas.height = completedCrop.height

    // Apply rotation
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-canvas.width / 2, -canvas.height / 2)

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    )

    ctx.restore()

    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        }
      }, 'image/jpeg', 0.9)
    })
  }, [completedCrop, rotation])

  const handleCropComplete = async () => {
    const croppedImageBlob = await getCroppedImg()
    if (croppedImageBlob) {
      onCropComplete(croppedImageBlob)
    }
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <Card className="w-full max-w-2xl mx-4 bg-white dark:bg-gray-900">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold">Crop Your Profile Picture</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              circularCrop
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imageSrc}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  maxHeight: '400px',
                  maxWidth: '100%'
                }}
                onLoad={onImageLoad}
                className="rounded-lg"
              />
            </ReactCrop>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
                className="flex items-center space-x-1"
              >
                <RotateCw className="w-4 h-4" />
                <span>Rotate</span>
              </Button>
              <span className="text-sm text-muted-foreground">
                Drag to crop • Scroll to zoom
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleCropComplete}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Use This Photo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}