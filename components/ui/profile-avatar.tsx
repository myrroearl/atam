"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useProfile } from "@/contexts/profile-context"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProfileAvatarProps {
  className?: string
  fallbackClassName?: string
  size?: "sm" | "md" | "lg" | "xl"
  showFallbackIcon?: boolean
  firstName?: string
  lastName?: string
  customImageUrl?: string
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10", 
  lg: "w-12 h-12",
  xl: "w-16 h-16"
}

const fallbackSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base", 
  xl: "text-lg"
}

export function ProfileAvatar({ 
  className, 
  fallbackClassName,
  size = "md",
  showFallbackIcon = true,
  firstName,
  lastName,
  customImageUrl
}: ProfileAvatarProps) {
  const { profilePictureUrl, isLoading } = useProfile()
  
  const imageUrl = customImageUrl || profilePictureUrl
  const fallbackText = firstName && lastName 
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : "U"

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {imageUrl && !isLoading ? (
        <AvatarImage 
          src={imageUrl} 
          alt="Profile" 
          className="object-cover"
        />
      ) : (
        <AvatarImage 
          src="/placeholder-user.jpg" 
          alt="Default Profile" 
          className="object-cover"
        />
      )}
      <AvatarFallback 
        className={cn(
          "bg-gradient-to-br from-purple-500 to-blue-500 text-white font-semibold",
          fallbackSizeClasses[size],
          fallbackClassName
        )}
      >
        {showFallbackIcon && !firstName && !lastName ? (
          <User className="w-1/2 h-1/2" />
        ) : (
          fallbackText
        )}
      </AvatarFallback>
    </Avatar>
  )
}