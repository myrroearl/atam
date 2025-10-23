"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Mail, Lock, Chrome, CheckCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ReCAPTCHAComponent, ReCAPTCHARef } from "@/components/ui/recaptcha"
import loginLogo from "@/public/logo.jpg"

export function LoginContent() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHARef>(null)
  const router = useRouter()
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

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
    setIsLoading(true)
    setError("")

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
        email: formData.email,
        password: formData.password,
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
          router.push("/professor/dashboard")
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
    setIsGoogleLoading(true)
    setError("")

    try {
      const result = await signIn("google-professor", {
        redirect: false,
        callbackUrl: "/professor/dashboard"
      })

      if (result?.error) {
        if (result.error === "Configuration") {
          setError("Google Sign-In is not configured. Please contact your administrator.")
        } else {
          setError("Failed to sign in. Please ensure you have a professor account.")
        }
        setIsGoogleLoading(false)
        return
      }

      if (result?.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/professor/dashboard")
        }, 2000)
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
      setIsGoogleLoading(false)
    }
  }

  // Display invalid account if redirected back with AccessDenied
  useEffect(() => {
    // Safe access to search params
    try {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params);
      const err = params.get("error");
      if (err === "AccessDenied") {
        setError("Your account is invalid or not permitted to sign in here.");
        setIsGoogleLoading(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.warn('Error accessing search params:', error);
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        {/* <div className="text-center mb-2">
          <div className="flex items-center justify-center mb-4">
            <Image src={loginLogo} alt="PLP Logo" width={70} height={70}/>
            <div className="bg-blue-600 p-3 rounded-full">
              <Logo className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sign In</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Sign in to your professor account</p>
        </div> */}

        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          
          <CardHeader className="space-y-1">
          <Image src={loginLogo} alt="PLP Logo" width={70} height={70} className="text-center mx-auto"/>
            <CardTitle className="text-2xl font-semibold text-center">PLP Professor Portal</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Google Login Button */}
            <Button
              variant="outline"
              className="w-full h-12 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 bg-transparent"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span>Signing in with Google...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Chrome className="h-5 w-5" />
                  <span>Continue with Google</span>
                </div>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="professor@plpasig.edu.ph"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 h-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    id="remember"
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400">
                    Remember me
                  </Label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Forgot password?
                </Link>
              </div>

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

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-[#1A5319] hover:bg-[#1e3f1e] text-white font-medium mt-4"
                disabled={isLoading || isGoogleLoading || !recaptchaToken}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>

          {/* <CardFooter className="flex flex-col space-y-4">
            <Separator />
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Sign up here
              </Link>
            </div>
          </CardFooter> */}
        </Card>

        {/* Demo Credentials */}
        {/* <Card className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Demo Credentials</h3>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <p>
                  <strong>Email:</strong> demo@professor.edu
                </p>
                <p>
                  <strong>Password:</strong> demo123
                </p>
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-500 dark:text-gray-400">
          <p>Note: If you want to import scores from Google Classroom, you should click the "Continue with Google" button above.</p>
          {/* <div className="flex justify-center space-x-4 mt-2">
            <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gray-700 dark:hover:text-gray-300">
              Terms of Service
            </Link>
            <Link href="/support" className="hover:text-gray-700 dark:hover:text-gray-300">
              Support
            </Link>
          </div> */}
        </div>
      </div>

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
                  Successfully signed in to your professor portal
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