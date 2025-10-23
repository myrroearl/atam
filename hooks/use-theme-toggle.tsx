"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function useThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = theme === "system" ? systemTheme : theme
  const isDark = currentTheme === "dark"

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return {
    theme: currentTheme,
    isDark,
    toggleTheme,
    mounted,
    setTheme
  }
} 