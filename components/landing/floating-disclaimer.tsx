"use client";

import { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FloatingDisclaimer() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the disclaimer
    const dismissed = localStorage.getItem('plp-disclaimer-dismissed');
    if (!dismissed) {
      // Show disclaimer after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-fade-in-up">
      <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-lg shadow-lg p-4 relative">
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Content */}
        <div className="flex items-start space-x-3 pr-6">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Info className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Capstone Project Disclaimer
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              This is a <strong>capstone project</strong> for academic purposes only. 
              It is <strong>not an official website</strong> of Pamantasan ng Lungsod ng Pasig (PLP).
            </p>
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismiss}
                className="text-xs h-7 px-3 border-green-200 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
              >
                I Understand
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-green-300 rounded-full animate-pulse delay-1000"></div>
      </div>
    </div>
  );
}
