"use client";

import { useState, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VideoModal({ isOpen, onClose }: VideoModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-6xl max-h-[95vh] bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden animate-fade-in-up flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="ml-4 text-sm font-medium text-gray-700 dark:text-gray-300">
              Academic Management System - Demo Video
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Video Container */}
        <div className="relative bg-black flex-1 min-h-0">
          <div className="aspect-video w-full h-full min-h-[200px] sm:min-h-[300px] md:min-h-[400px]">
            <iframe
              src="https://drive.google.com/file/d/1quSy5Ld-UdkBCRN1eFbHbQU_7QKLvQt4/preview"
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title="Academic Management System Demo"
            />
          </div>
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {isMuted ? (
                <VolumeX className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </Button>
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {isMuted ? 'Muted' : 'Unmuted'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Fullscreen
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 border-t border-green-200 dark:border-green-800 flex-shrink-0">
          <div className="flex items-start gap-2 sm:gap-3">
            <Play className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-1 text-sm sm:text-base">
                Demo Instructions
              </h4>
              <p className="text-xs sm:text-sm text-green-700 dark:text-green-300">
                This video demonstrates the key features of our Academic Management System. 
                You can use the controls above to adjust volume and enter fullscreen mode. 
                Click outside the video or press ESC to close.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
