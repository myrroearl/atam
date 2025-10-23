"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Camera, Save, Lock } from "lucide-react"

export function ProfileContent() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <User className="h-8 w-8 text-primary" />
          Profile Settings
        </h1>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Update your profile photo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/placeholder.svg?height=96&width=96" />
                <AvatarFallback className="text-lg">SJ</AvatarFallback>
              </Avatar>
              <Button variant="outline">
                <Camera className="mr-2 h-4 w-4" />
                Change Photo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <Input defaultValue="Sarah" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input defaultValue="Johnson" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input type="email" defaultValue="sarah.johnson@university.edu" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input type="tel" defaultValue="+1 (555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Input defaultValue="Mathematics" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Office Location</label>
                <Input defaultValue="Science Building, Room 301" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <Textarea
                  defaultValue="Professor of Mathematics with 15 years of experience in calculus and mathematical analysis."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Lock className="mr-2 h-4 w-4" />
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Mail className="mr-2 h-4 w-4" />
                Update Email Preferences
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="lg">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
