"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react"
import Image from "next/image"
import { ThemeToggle } from "@/components/student/theme-toggle"
import { Separator } from "@/components/ui/separator"
import { ReCAPTCHAComponent, ReCAPTCHARef } from "@/components/ui/recaptcha"
import loginLogo from "@/public/logo.jpg"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHARef>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Show message if redirected back with an AccessDenied error
  useEffect(() => {
    const err = searchParams.get("error")
    if (err === "AccessDenied") {
      setError("Your account is invalid or not permitted to sign in here.")
      setIsLoading(false)
    }
  }, [searchParams])

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token)
    if (error && token) {
      setError("")
    }
  }

  const handleRecaptchaExpired = () => {
    setRecaptchaToken(null)
  }

  const handleRecaptchaError = () => {
    setRecaptchaToken(null)
    setError("reCAPTCHA verification failed. Please try again.")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    
    // if (!email.endsWith("@plpasig.edu.ph")) {
    //   setError("Only PLP email addresses are allowed.")
    //   setIsLoading(false)
    //   return
    // }

    // Check if reCAPTCHA is completed
    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA verification")
      setIsLoading(false)
      return
    }

    try {
      // Verify reCAPTCHA token with our API
      const recaptchaResponse = await fetch('/api/verify-recaptcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: recaptchaToken }),
      })

      if (!recaptchaResponse.ok) {
        setError("reCAPTCHA verification failed. Please try again.")
        recaptchaRef.current?.reset()
        setRecaptchaToken(null)
        setIsLoading(false)
        return
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid credentials")
        recaptchaRef.current?.reset()
        setRecaptchaToken(null)
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/student/dashboard")
        }, 2000)
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
      recaptchaRef.current?.reset()
      setRecaptchaToken(null)
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("google-student", {
        redirect: false,
        callbackUrl: "/student/dashboard"
      })

      if (result?.error) {
        if (result.error === "Configuration") {
          setError("Google Sign-In is not configured. Please contact your administrator.")
        } else {
          setError("Failed to sign in. Please ensure you have a student account.")
        }
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/student/dashboard")
        }, 2000)
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 flex items-center justify-center">
            <Image
              src={loginLogo}
              alt="PLP Logo"
              width={80}
              height={80} 
              className="rounded-full"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Student Portal
          </CardTitle>
          <CardDescription className="text-muted-foreground">Sign in to access your academic dashboard</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your student email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-all duration-200 pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            {error && <div className="text-red-500 text-sm text-center mb-2">{error}</div>}

            {/* reCAPTCHA */}
            <div className="flex justify-center">
              <ReCAPTCHAComponent
                ref={recaptchaRef}
                siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
                onChange={handleRecaptchaChange}
                onExpired={handleRecaptchaExpired}
                onError={handleRecaptchaError}
                theme="light"
                size="normal"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || !recaptchaToken}
              className="w-full bg-[#1A5319] hover:bg-[#1e3f1e] text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="relative my-6">
              <Separator className="bg-gray-300 dark:bg-gray-600" />
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 px-4 text-sm text-gray-500 dark:text-gray-400">
                or continue with
              </span>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          </form>

        </CardContent>
      </Card>

      {/* Success Modal */}
      {success && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-in zoom-in-95 duration-500">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Welcome Back!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Successfully signed in to your student portal
                </p>
              </div>
              
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Redirecting to dashboard...</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}