"use client"

import React, { useRef, forwardRef, useImperativeHandle } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'

interface ReCAPTCHAProps {
  siteKey: string
  onChange?: (token: string | null) => void
  onExpired?: () => void
  onError?: () => void
  theme?: 'light' | 'dark'
  size?: 'compact' | 'normal' | 'invisible'
  className?: string
}

export interface ReCAPTCHARef {
  reset: () => void
  execute: () => void
  getValue: () => string | null
}

export const ReCAPTCHAComponent = forwardRef<ReCAPTCHARef, ReCAPTCHAProps>(
  ({ siteKey, onChange, onExpired, onError, theme = 'light', size = 'normal', className }, ref) => {
    const recaptchaRef = useRef<ReCAPTCHA>(null)

    useImperativeHandle(ref, () => ({
      reset: () => {
        recaptchaRef.current?.reset()
      },
      execute: () => {
        recaptchaRef.current?.execute()
      },
      getValue: () => {
        return recaptchaRef.current?.getValue() || null
      }
    }))

    return (
      <div className={className}>
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={siteKey}
          onChange={onChange}
          onExpired={onExpired}
          onErrored={onError}
          theme={theme}
          size={size}
        />
      </div>
    )
  }
)

ReCAPTCHAComponent.displayName = 'ReCAPTCHAComponent'
