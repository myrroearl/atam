"use client"

import type React from "react"
import { useState, useRef } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Eye, EyeOff } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
import { ReCAPTCHAComponent, ReCAPTCHARef } from "@/components/ui/recaptcha"
import loginLogo from "@/public/test-logo.png"
import userSetting from "@/public/user-setting.png"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHARef>(null)
  const router = useRouter()

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
        router.push("/admin/dashboard")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
      recaptchaRef.current?.reset()
      setRecaptchaToken(null)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center h-screen bg-[#f0f5f0] rounded-[40px]">
      <div className="flex w-[900px] h-[600px] shadow-md rounded-[40px]">
        {/* Left Panel - Dark Green */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-1/2 h-full"
        >
          <div className="bg-[#1A5319] h-full flex items-center justify-center p-8 rounded-l-[40px]">
            <Image src={loginLogo} alt="logo" width={300} height={300} />
          </div>
        </motion.div>

        {/* Right Panel - White */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="w-1/2 h-full">
          <div className="bg-white w-full h-full flex flex-col items-center justify-center p-8 rounded-r-[40px]">
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="text-center p-0 bg-white space-y-1 mb-4">
                <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center relative">
                  <Image src={userSetting} alt="logo" width={100} height={100} />
                </div>
                <CardTitle className="text-2xl font-bold text-black">Academic Management System</CardTitle>
                <CardDescription className="text-black">Sign in to your administrator account</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-black">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 rounded-lg px-4 text-black placeholder-gray-500 caret-green-600 focus:!outline focus:!outline-2 focus:!outline-green-600 focus:!outline-offset-0 focus:!ring-0 focus:!border-none border border-gray-300"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="password" className="text-black">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-12 border border-gray-300 rounded-lg px-4 pr-12 text-black placeholder-gray-500 focus:outline-none outline-none focus-visible:border-none focus:border-none caret-green-600"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent text-gray-500 hover:text-gray-700 rounded-lg"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between !mt-2">
                    <span className="text-black text-xs">Forgot password? </span>
                    <button type="button" className="text-green-600 hover:text-green-700 font-medium text-xs">
                      Reset Password
                    </button>
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
                  
                  {error && (
                    <div className="text-red-500 text-sm text-center">
                      {error}
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-[#1A5319] hover:bg-[#1e3f1e] text-white font-bold rounded-lg"
                    disabled={isLoading || !recaptchaToken}
                  >
                    {isLoading ? "Logging in..." : "Log in"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}