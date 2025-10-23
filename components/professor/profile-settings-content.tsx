"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Save,
  Shield,
  Palette,
  Phone,
  MapPin,
  Settings,
  Eye,
  EyeOff,
  Mail,
  Building2,
  Loader2,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

type ProfessorData = {
  firstName: string
  middleName: string
  lastName: string
  email: string
  phone: string
  address: string
  department: string
  departmentId: number
}

export function ProfileSettingsContent({ professor }: { professor: ProfessorData }) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Form state for profile information
  const [profileData, setProfileData] = useState({
    phone: professor.phone,
    address: professor.address,
  })

  // Form state for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Handle profile information update
  const handleProfileUpdate = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/professor/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: profileData.phone,
          address: profileData.address,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        })
        // Update local state with the new data
        setProfileData({
          phone: result.data?.contact_number || profileData.phone,
          address: result.data?.address || profileData.address,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update profile",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle password change
  const handlePasswordChange = async () => {
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    setIsPasswordLoading(true)
    try {
      const response = await fetch('/api/professor/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Password updated successfully",
        })
        // Clear password fields
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
        // Password change successful - no need to refresh
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update password",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Password update error:', error)
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPasswordLoading(false)
    }
  }

  // Check if profile data has changed
  const hasProfileChanges = 
    profileData.phone !== professor.phone || 
    profileData.address !== professor.address

  // Check if password form is valid
  const isPasswordFormValid = 
    passwordData.currentPassword && 
    passwordData.newPassword && 
    passwordData.confirmPassword &&
    passwordData.newPassword === passwordData.confirmPassword

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Profile Settings
          </h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Profile Settings
        </h1>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Personal Information */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>Update your personal details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" defaultValue={professor.firstName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name</Label>
                <Input id="middleName" defaultValue={professor.middleName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" defaultValue={professor.lastName} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input id="email" type="email" defaultValue={professor.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+63 XXX XXX XXXX" 
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Department
                </Label>
                <Input id="department" defaultValue={professor.department} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Contact admin to change department</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                <Input 
                  id="address" 
                  value={profileData.address}
                  onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your address" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security
            </CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                  id="newPassword" 
                  type="password" 
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password" 
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handlePasswordChange}
                disabled={!isPasswordFormValid || isPasswordLoading}
                variant="outline"
              >
                {isPasswordLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Appearance
            </CardTitle>
            <CardDescription>Customize your interface theme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Theme Preference</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light Mode</SelectItem>
                  <SelectItem value="dark">Dark Mode</SelectItem>
                  <SelectItem value="system">System Default</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Changes */}
      <div className="flex justify-end gap-4">
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => {
            setProfileData({
              phone: professor.phone,
              address: professor.address,
            })
          }}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          size="lg"
          onClick={handleProfileUpdate}
          disabled={!hasProfileChanges || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
