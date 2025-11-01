"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Calendar, GraduationCap, Camera, Save, Shield, Bell, Globe, Eye, EyeOff, BookOpen, Mail, Phone, MapPin, Edit3, Upload, X, Loader2, CheckCircle } from "lucide-react"
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/contexts/profile-context";
import { usePrivacy } from "@/contexts/privacy-context";
import { ImageCropper } from "@/components/ui/image-cropper";
import { UploadConfirmationModal } from "@/components/ui/upload-confirmation-modal";

type ProfileForm = {
  firstName: string
  middleName?: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: string
  address?: string
  studentId?: string
  major?: string
  year?: string
  section?: string
  gpa?: string
  expectedGraduation?: string
}

// Icon mapping for activity types
const iconMap: { [key: string]: any } = {
  'Camera': Camera,
  'X': X,
  'Shield': Shield,
  'Edit3': Edit3,
  'Mail': Mail,
  'Eye': Eye,
  'Bell': Bell,
  'Activity': User
};

const privacySettingsConfig = [
  {
    title: "Profile Visibility",
    description: "Who can see your profile information in leaderboards and dashboards",
    options: ["Public", "Private"],
    current: "Public",
  },
]

const defaultNotificationPreferences = [
  { id: "emailNotifications", label: "Email Notifications", description: "Receive notifications via email", enabled: true },
  { id: "pushNotifications", label: "Push Notifications", description: "Receive push notifications on your device", enabled: true },
  { id: "gradeUpdates", label: "Grade Updates", description: "Get notified when new grades are posted", enabled: true },
]

// Current subjects data - will be fetched from API
const defaultSubjects = [
  {
    id: 1,
    subjectCode: "COMP 101",
    subjectName: "Introduction to Computing",
    units: 3,
    professor: "Prof. Dawn Bernadette Menor, MSIT",
    semester: "1st Semester",
    year: "1st Year",
    status: "Enrolled",
    color: "from-blue-500 to-cyan-500",
    icon: "💻"
  },
  {
    id: 2,
    subjectCode: "COMP 102",
    subjectName: "Fundamentals of Programming (C++)",
    units: 3,
    professor: "Prof. Juanito Alvarez Jr., MIT",
    semester: "1st Semester",
    year: "1st Year",
    status: "Enrolled",
    color: "from-green-500 to-emerald-500",
    icon: "🔧"
  },
  {
    id: 3,
    subjectCode: "IT 101",
    subjectName: "Discrete Mathematics",
    units: 3,
    professor: "Dr. Laura Altea",
    semester: "2nd Semester",
    year: "1st Year",
    status: "Enrolled",
    color: "from-purple-500 to-pink-500",
    icon: "📊"
  },
  {
    id: 4,
    subjectCode: "IT 102",
    subjectName: "Quantitative Methods",
    units: 3,
    professor: "Prof. Fr",
    semester: "2nd Semester",
    year: "1st Year",
    status: "Enrolled",
    color: "from-red-500 to-orange-500",
    icon: "📈"
  }
]

// Custom hook to handle hydration safely
function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  
  useEffect(() => {
    setHydrated(true);
  }, []);
  
  return hydrated;
}

export function ProfileSettings() {
  const router = useRouter();
  const { profilePictureUrl, setProfilePictureUrl, refreshProfile } = useProfile();
  const { privacySettings, updatePrivacySettings, isLoading: privacyLoading, error: privacyError } = usePrivacy();
  const hydrated = useHydrated();
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    email: "",
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [subjects, setSubjects] = useState(defaultSubjects)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [sectionInfo, setSectionInfo] = useState<any>(null)
  const [currentSemester, setCurrentSemester] = useState<any>(null)
  const [academicInfo, setAcademicInfo] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [notificationPreferences, setNotificationPreferences] = useState(defaultNotificationPreferences)
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/student/profile', { cache: 'no-store' })
        if (!res.ok) {
          const b = await res.json().catch(() => ({}))
          throw new Error(b.error || `Failed: ${res.status}`)
        }
        const b = await res.json()
        const s = b.student
        if (!active || !s) return
        
        // Store academic info if available
        if (s.academicInfo) {
          setAcademicInfo(s.academicInfo)
        }
        
        setFormData({
          firstName: s.first_name,
          middleName: s.middle_name || "",
          lastName: s.last_name,
          email: s.accounts?.email || "",
          phone: s.contact_number || "",
          dateOfBirth: s.birthday || "",
          address: s.address || "",
          studentId: String(s.student_id),
          major: s.sections?.year_level?.courses?.course_name || "",
          year: s.sections?.year_level?.name || "",
          section: s.sections?.section_name || "",
          gpa: s.academicInfo?.gpa?.toString() || "",
          expectedGraduation: s.academicInfo?.expectedGraduationYear?.toString() || "",
        })
      } catch (e: any) {
        if (active) setError(e.message || 'Failed to load profile')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [passwordMsg, setPasswordMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Fetch activity logs when component mounts
  useEffect(() => {
    if (hydrated) {
      fetchActivityLogs();
      fetchSubjects();
      fetchDashboardData();
      fetchNotificationPreferences();
    }
  }, [hydrated]);

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const response = await fetch('/api/student/subjects', { 
        cache: 'no-store',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.subjects && Array.isArray(data.subjects)) {
          // Store section and semester info
          if (data.sectionInfo) {
            setSectionInfo(data.sectionInfo);
          }
          if (data.currentSemester) {
            setCurrentSemester(data.currentSemester);
          }

          // Transform API data to match our component structure
          const transformedSubjects = data.subjects.map((subject: any, index: number) => ({
            id: subject.subjects?.subject_id || index + 1,
            subjectCode: subject.subjects?.subject_code || 'N/A',
            subjectName: subject.subjects?.subject_name || 'Unknown Subject',
            units: subject.subjects?.units || 0,
            professor: subject.professors ? 
              `Prof. ${subject.professors.first_name} ${subject.professors.last_name}` : 
              'TBA',
            semester: data.currentSemester?.semesterName || 'Current Semester',
            year: data.sectionInfo?.yearLevel || 'Current Year',
            status: 'Enrolled',
            color: [
              "from-blue-500 to-cyan-500",
              "from-green-500 to-emerald-500", 
              "from-purple-500 to-pink-500",
              "from-red-500 to-orange-500",
              "from-indigo-500 to-blue-500",
              "from-yellow-500 to-orange-500"
            ][index % 6],
            icon: ["💻", "🔧", "📊", "📈", "🌐", "⚙️"][index % 6]
          }));
          setSubjects(transformedSubjects);
        }
      } else {
        console.error('Failed to fetch subjects:', response.status);
        // Keep default subjects if API fails
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      // Keep default subjects if API fails
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/student/dashboard', { 
        cache: 'no-store',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        console.error('Failed to fetch dashboard data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchNotificationPreferences = async () => {
    try {
      setLoadingNotifications(true);
      const response = await fetch('/api/student/notification-preferences', { 
        cache: 'no-store',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          // Merge with default preferences to ensure all preferences exist
          const mergedPreferences = defaultNotificationPreferences.map(defaultPref => {
            const savedPref = data.preferences.find((p: any) => p.id === defaultPref.id);
            return savedPref || defaultPref;
          });
          setNotificationPreferences(mergedPreferences);
        }
      } else {
        console.error('Failed to fetch notification preferences:', response.status);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const updateNotificationPreference = async (preferenceId: string, enabled: boolean) => {
    try {
      // Optimistically update UI
      setNotificationPreferences(prev =>
        prev.map(pref => pref.id === preferenceId ? { ...pref, enabled } : pref)
      );

      const response = await fetch('/api/student/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferenceId,
          enabled
        })
      });

      if (!response.ok) {
        // Revert on error
        setNotificationPreferences(prev =>
          prev.map(pref => pref.id === preferenceId ? { ...pref, enabled: !enabled } : pref)
        );
        throw new Error('Failed to update notification preference');
      }

      const data = await response.json();
      showNotification('success', `Notification preference updated successfully`);
      
      return data;
    } catch (error: any) {
      console.error('Error updating notification preference:', error);
      showNotification('error', error.message || 'Failed to update notification preference');
      throw error;
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string, autoHideMs = 3000) => {
    setNotification({ type, message });
    if (autoHideMs > 0) {
      setTimeout(() => setNotification(null), autoHideMs);
    }
  };

  const fetchActivityLogs = async () => {
    if (isFetching) return;
    
    try {
      setIsFetching(true);
      setLoadingLogs(true);
      
      const response = await fetch('/api/student/activity-logs', { 
        cache: 'no-store',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.activityLogs && Array.isArray(data.activityLogs)) {
          setActivityLogs(data.activityLogs);
        } else {
          setActivityLogs([]);
        }
      } else {
        console.error('Failed to fetch activity logs:', response.status);
        setActivityLogs([]);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      setActivityLogs([]);
    } finally {
      setLoadingLogs(false);
      setIsFetching(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    // In a real app, this would save to the backend
    // Show success message
  }

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showNotification('error', 'Invalid file type. Only JPG, PNG, and WebP images are allowed.');
        return;
      }

      // Validate file size (2MB limit)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        showNotification('error', 'File too large. Maximum size is 2MB.');
        return;
      }

      // Show cropper with the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadProfilePicture = async () => {
    const fileInput = fileInputRef.current;
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
      showNotification('error', 'Please select an image file.');
      return;
    }

    const file = fileInput.files[0];
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/profile/upload-picture', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload profile picture');
      }

      // Update the global profile context
      setProfilePictureUrl(result.profilePictureUrl);
      
      // Clear preview and file input
      setPreviewImage(null);
      fileInput.value = '';
      
      showNotification('success', '🎉 Profile picture updated successfully! Your new photo is now visible across all components.');
      
      // Refresh activity logs to show the new upload
      fetchActivityLogs();
      
    } catch (error: any) {
      console.error('Upload error:', error);
      showNotification('error', error.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!profilePictureUrl) return;

    setUploading(true);
    try {
      const response = await fetch('/api/profile/upload-picture', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove profile picture');
      }

      // Update the global profile context
      setProfilePictureUrl(null);
      setPreviewImage(null);
      
      showNotification('success', '✅ Profile picture removed successfully!');
      
      // Refresh activity logs to show the removal
      fetchActivityLogs();
      
    } catch (error: any) {
      console.error('Remove error:', error);
      showNotification('error', error.message || 'Failed to remove profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleCancelUpload = () => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = (croppedImageBlob: Blob) => {
    // Convert blob to preview URL
    const previewUrl = URL.createObjectURL(croppedImageBlob);
    setPreviewImage(previewUrl);
    setShowCropper(false);
    setOriginalImage(null);
    
    // Store the cropped blob for upload
    const croppedFile = new File([croppedImageBlob], 'profile-picture.jpg', {
      type: 'image/jpeg'
    });
    
    // Create a new FileList-like object
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(croppedFile);
    
    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files;
    }
    
    showNotification('info', 'Image cropped successfully! Click "Upload" to save your new profile picture.');
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setOriginalImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  const handleUploadConfirm = () => {
    setShowUploadModal(false);
    fileInputRef.current?.click();
  };

  const handleUploadCancel = () => {
    setShowUploadModal(false);
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordUpdate = async () => {
    setPasswordMsg("");
    
    // Validation
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setPasswordMsg("Please fill in all password fields.");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setPasswordMsg("New passwords do not match.");
      return;
    }
    if (passwords.new.length < 6) {
      setPasswordMsg("New password must be at least 6 characters long.");
      return;
    }

    try {
      // Update password in database
      const response = await fetch('/api/student/update-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new
        })
      });

      // Safely parse the response
      let result: any = {};
      const contentType = response.headers.get('content-type');
      
      // Only parse JSON if the response has JSON content
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (text) {
          try {
            result = JSON.parse(text);
          } catch (parseError) {
            console.error('Failed to parse JSON response:', parseError);
            result = { error: 'Invalid server response' };
          }
        }
      } else {
        // If not JSON, get the text response
        const text = await response.text();
        if (text) {
          result = { message: text };
        }
      }

      if (!response.ok) {
        setPasswordMsg(result.error || result.message || "Failed to update password.");
        return;
      }

      setPasswordMsg("Password updated successfully!");
      setPasswords({ current: "", new: "", confirm: "" });
      setTimeout(() => setPasswordMsg(""), 5000);

      // Log the password change activity
      try {
        const logResponse = await fetch('/api/student/log-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'Password Changed',
            description: 'Account password was successfully updated'
          })
        });

        if (logResponse.ok) {
          // Refresh activity logs to show the new entry
          fetchActivityLogs();
        }
      } catch (error) {
        console.error('Failed to log password change activity:', error);
      }

    } catch (error) {
      console.error('Password update error:', error);
      setPasswordMsg("An error occurred while updating password. Please try again.");
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  };

  // Show error state
  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">⚠️ Error loading profile settings</div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button 
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state before hydration
  if (!hydrated) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <div className="text-sm text-muted-foreground">Loading profile...</div>
        </div>
      </div>
    );
  }

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <div className="text-sm text-muted-foreground">Loading profile data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="text-sm text-red-500">{error}</div>
      )}
      {notification && (
        <div
          className={`flex items-center justify-between p-3 rounded-lg border-2 shadow-md transition-colors ${
            notification.type === 'success'
              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : notification.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
          }`}
        >
          <span className="text-sm font-medium">{notification.message}</span>
          <button
            className="ml-4 text-xs underline opacity-80 hover:opacity-100"
            onClick={() => setNotification(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload Confirmation Modal */}
      <UploadConfirmationModal
        isOpen={showUploadModal}
        onConfirm={handleUploadConfirm}
        onCancel={handleUploadCancel}
      />

      {/* Image Cropper Modal */}
      {showCropper && originalImage && (
        <ImageCropper
          imageSrc={originalImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
        />
      )}

      {/* Header */}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-3">
            <h1 className="text-4xl font-bold text-foreground bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text">
              Profile Settings
            </h1>
            <p className="text-lg text-muted-foreground">Manage your account settings and preferences</p>
            
            {/* Privacy Status Indicator */}
            {privacySettings.profileVisibility === 'private' && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Your profile is in private mode - your name will be hidden in leaderboards and public views
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 shadow-lg">
          <TabsTrigger value="profile" className="text-sm font-medium">Profile</TabsTrigger>
          <TabsTrigger value="academic" className="text-sm font-medium">Academic</TabsTrigger>
          <TabsTrigger value="privacy" className="text-sm font-medium">Privacy</TabsTrigger>
          <TabsTrigger value="notifications" className="text-sm font-medium">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
            <div className="space-y-6">
              {/* Profile Picture */}
              <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl">
                <CardHeader className="text-center pb-4">  
                  <CardTitle className="text-xl font-semibold">Profile Picture</CardTitle>
                  <CardDescription>Update your profile photo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center space-y-6">
                    <div className="relative group">
                      <Avatar className="w-36 h-36 ring-4 ring-purple-100 dark:ring-purple-900/30 shadow-2xl">
                        {previewImage ? (
                          <AvatarImage src={previewImage} alt="Profile Preview" />
                        ) : profilePictureUrl ? (
                          <AvatarImage src={profilePictureUrl} alt="Profile" />
                        ) : (
                          <AvatarImage src="/placeholder-user.jpg" alt="Profile" />
                        )}
                        <AvatarFallback className="text-3xl bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold">
                          {formData.firstName?.[0] || 'U'}
                          {formData.lastName?.[0] || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    
                    {previewImage ? (
                      <div className="w-full space-y-3">
                        <div className="flex space-x-2">
                          <Button 
                            onClick={handleUploadProfilePicture}
                            disabled={uploading}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            {uploading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Confirm Upload
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={handleCancelUpload}
                            disabled={uploading}
                            className="px-3"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              Ready to upload!
                            </p>
                          </div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Click "Confirm Upload" to save your new profile picture
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full space-y-3">
                        <Button 
                          variant="outline" 
                          className="w-full bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-200 dark:border-purple-700 dark:from-purple-950/20 dark:to-blue-950/20 shadow-md hover:shadow-lg transition-all duration-200" 
                          onClick={handleUploadClick}
                          disabled={uploading}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          {profilePictureUrl ? 'Change Photo' : 'Upload Photo'}
                        </Button>
                        
                        {profilePictureUrl && (
                          <Button 
                            variant="outline"
                            onClick={handleRemoveProfilePicture}
                            disabled={uploading}
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-800"
                          >
                            {uploading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Removing...
                              </>
                            ) : (
                              <>
                                <X className="w-4 h-4 mr-2" />
                                Remove Photo
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                    
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleProfilePicChange}
                    />
                    
                  </div>
                  </CardContent>
                </Card>

                {/* Profile Update Logs */}
              <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-500 to-slate-500 flex items-center justify-center shadow-md">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">Update History</CardTitle>
                      <CardDescription className="text-sm">Recent profile changes and activities</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 h-[calc(100%-120px)] max-h-[517px] flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-0">
                    {loadingLogs ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading activity logs...</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activityLogs && activityLogs.length > 0 ? (
                          activityLogs.map((log, index) => {
                            if (!log || !log.id) return null;
                            const Icon = iconMap[log.icon] || User;
                            const date = log.timestamp ? new Date(log.timestamp) : new Date();
                            const timeAgo = getTimeAgo(date);
                            
                            return (
                              <div 
                                key={log.id || index} 
                                className={`p-3 rounded-lg border ${log.bgColor || 'bg-gray-50 dark:bg-gray-950/20'} ${log.borderColor || 'border-gray-200 dark:border-gray-800'} shadow-sm hover:shadow-md transition-all duration-200`}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className={`w-6 h-6 rounded-full ${log.bgColor || 'bg-gray-100 dark:bg-gray-800'} flex items-center justify-center flex-shrink-0`}>
                                    <Icon className={`w-3 h-3 ${log.color || 'text-gray-600 dark:text-gray-400'}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                        {log.action || 'Activity'}
                                      </h4>
                                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                        {timeAgo}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                      {log.description || 'No description available'}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${log.bgColor || 'bg-gray-100 dark:bg-gray-800'} ${log.color || 'text-gray-600 dark:text-gray-400'} border ${log.borderColor || 'border-gray-200 dark:border-gray-800'}`}>
                                        {log.type || 'Activity'}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {date.toLocaleDateString()}
                                      </span>
                                      {log.metadata && log.metadata.file_size && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          • {(log.metadata.file_size / (1024 * 1024)).toFixed(1)}MB
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <BookOpen className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">No activity logs yet</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Your profile activities will appear here</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <Button 
                      variant="ghost" 
                      onClick={fetchActivityLogs}
                      disabled={loadingLogs}
                      className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                    >
                      {loadingLogs ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        'Refresh Logs'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

           
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl">
                <CardHeader className="pb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                      <User className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">Personal Information</CardTitle>  
                      <CardDescription className="text-base">View and manage your personal details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="firstName" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        disabled
                        className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="middleName" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Middle Name
                      </Label>
                      <Input
                        id="middleName"
                        value={formData.middleName}
                        disabled
                        className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="lastName" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        disabled
                        className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>Email Address</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>Phone Number</span>
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        disabled
                        className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="dateOfBirth" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Date of Birth</span>
                      </Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth || ''}
                        disabled
                        className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="address" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                        <span>Address</span>
                    </Label>
                      <Input
                      id="address"
                      value={formData.address || ''}
                      disabled
                      className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security */}
              <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center space-x-3 text-2xl font-bold">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span>Security</span>
                  </CardTitle>
                  <CardDescription className="text-base">Manage your account security and password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="currentPassword" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Current Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter current password"
                        value={passwords.current}
                        onChange={e => handlePasswordChange("current", e.target.value)}
                        className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 pr-12"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="newPassword" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        New Password
                      </Label>
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={passwords.new}
                        onChange={e => handlePasswordChange("new", e.target.value)}
                        className="h-12 text-base border-2 border-gray-200 dark:border-gray-700"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="confirmPassword" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={passwords.confirm}
                        onChange={e => handlePasswordChange("confirm", e.target.value)}
                        className="h-12 text-base border-2 border-gray-200 dark:border-gray-700"
                      />
                    </div>
                  </div>
                  <Button 
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200" 
                    onClick={handlePasswordUpdate}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Update Password
                  </Button>
                  {passwordMsg && (
                    <div className={`text-sm text-center p-3 rounded-lg border-2 ${
                      passwordMsg.includes("success") 
                        ? "text-green-700 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" 
                        : "text-red-700 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                    }`}>
                      {passwordMsg}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="academic" className="space-y-6">
          <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Academic Information</CardTitle>
                  <CardDescription className="text-base">Your academic details and progress</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 bg-card border border-slate-200 dark:border-slate-700  rounded-2xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-md">
                      <User className="w-4 h-4 text-foreground" />
                    </div>
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Student ID</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formData.studentId || 'Loading...'}</p>
                </div>
                <div className="p-6 bg-card border border-slate-200 dark:border-slate-700  rounded-2xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center shadow-md">
                      <BookOpen className="w-4 h-4 text-foreground" />
                    </div>
                    <span className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Major</span>
                  </div>
                  <p className="text-xl font-bold text-purple-900 dark:text-purple-100">{formData.major || 'Loading...'}</p>
                </div>
                <div className="p-6 bg-card border border-slate-200 dark:border-slate-700  rounded-2xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center shadow-md">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wide">Section</span>
                  </div>
                  <p className="text-2xl font-bold text-teal-900 dark:text-teal-100">{formData.section || 'Loading...'}</p>
                </div>
                <div className="p-6 bg-card border border-slate-200 dark:border-slate-700  rounded-2xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shadow-md">
                      <Calendar className="w-4 h-4 text-foreground" />
                    </div>
                    <span className="text-sm font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide">Academic Year</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{formData.year || 'Loading...'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="p-6 bg-card border border-slate-200 dark:border-slate-700  rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide mb-2">Current GPA</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {dashboardData?.overallGPA ? dashboardData.overallGPA.toFixed(2) : 'Loading...'}
                      </p>
                      {dashboardData?.totalUnits && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {dashboardData.totalUnits} units completed
                        </p>
                      )}
                    </div>
                    <Badge className={`shadow-md px-3 py-1 text-sm font-semibold ${
                      dashboardData?.overallGPA <= 1.5 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      dashboardData?.overallGPA <= 2.0 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      dashboardData?.overallGPA <= 2.5 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      dashboardData?.overallGPA <= 3.0 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {dashboardData?.overallGPA <= 1.5 ? 'Excellent' :
                       dashboardData?.overallGPA <= 2.0 ? 'Very Good' :
                       dashboardData?.overallGPA <= 2.5 ? 'Good' :
                       dashboardData?.overallGPA <= 3.0 ? 'Satisfactory' :
                       'Needs Improvement'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Subjects Section */}
          <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold">Current Subjects</CardTitle>
                  <CardDescription className="text-base">Your enrolled subjects for this semester</CardDescription>
                  {sectionInfo && (
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      
                      <span className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{sectionInfo.yearLevel} - {sectionInfo.sectionName}</span>
                      </span>
                      {currentSemester && (
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{currentSemester.semesterName} - {currentSemester.schoolYear}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingSubjects ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading subjects...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subjects
                    .filter(subject => subject.status === 'Enrolled')
                    .map((subject) => (
                      <div 
                        key={subject.id} 
                        className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800/50"
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${subject.color} flex items-center justify-center text-lg flex-shrink-0`}>
                            {subject.icon}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{subject.subjectCode}</h3>
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 text-xs font-semibold">
                                {subject.status}
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-base mb-2">{subject.subjectName}</h4>
                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                              <p><span className="font-medium">Professor:</span> {subject.professor}</p>
                              <p><span className="font-medium">Units:</span> {subject.units} units</p>
                        
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {subjects.filter(s => s.status === 'Enrolled').length} subjects enrolled
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={fetchSubjects}
                    disabled={loadingSubjects}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    {loadingSubjects ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      'Refresh Subjects'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Privacy Settings</CardTitle>
                  <CardDescription className="text-base">Control who can see your information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {privacyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading privacy settings...</span>
                </div>
              ) : privacyError ? (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-4">⚠️ Error loading privacy settings</div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{privacyError}</p>
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="outline"
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                privacySettingsConfig.map((setting: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200">
                  <div>
                    <h4 className="font-semibold text-lg">{setting.title}</h4>
                    <p className="text-muted-foreground">{setting.description}</p>
                  </div>
                  <Select 
                    value={privacySettings.profileVisibility}
                    onValueChange={async (value) => {
                      try {
                        // Update privacy settings
                        await updatePrivacySettings({ profileVisibility: value as 'public' | 'private' });
                        
                        // Log privacy settings change
                        try {
                          await fetch('/api/student/log-activity', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              action: 'Privacy Settings Updated',
                              description: `Changed profile visibility to ${value.charAt(0).toUpperCase() + value.slice(1)}`
                            })
                          });
                        } catch (logError) {
                          console.error('Failed to log privacy change:', logError);
                        }
                        
                        // Show success notification
                        showNotification('success', `Profile visibility set to ${value.charAt(0).toUpperCase() + value.slice(1)}`);
                        
                        // Refresh activity logs
                        fetchActivityLogs();
                      } catch (error: any) {
                        console.error('Failed to update privacy settings:', error);
                        showNotification('error', error.message || 'Failed to update privacy settings');
                      }
                    }}
                  >
                    <SelectTrigger className="w-40 h-12 border-2 border-gray-200 dark:border-gray-700 shadow-md">
                      <SelectValue placeholder="Select visibility">
                        {privacySettings.profileVisibility === 'public' ? 'Public' : 
                         privacySettings.profileVisibility === 'private' ? 'Private' : 
                         'Select visibility'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {setting.options.map((option: string) => (
                        <SelectItem key={option} value={option.toLowerCase()}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                ))
              )}

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-6">Data & Privacy</h3>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start bg-transparent border-2 border-gray-200 dark:border-gray-700 h-12 shadow-md hover:shadow-lg transition-all duration-200">
                    <Shield className="w-4 h-4 mr-2" />
                    Privacy Policy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Notification Preferences</CardTitle>
                  <CardDescription className="text-base">Choose how you want to be notified</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingNotifications ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading notification preferences...</span>
                </div>
              ) : (
                notificationPreferences.map((pref, index) => (
                  <div key={pref.id || index} className="flex items-center justify-between p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200">
                    <div>
                      <h4 className="font-semibold text-lg">{pref.label}</h4>
                      <p className="text-muted-foreground">{pref.description}</p>
                    </div>
                    <Switch 
                      checked={pref.enabled}
                      className="shadow-md" 
                      onCheckedChange={async (checked) => {
                        try {
                          // Update notification preference
                          await updateNotificationPreference(pref.id, checked);
                          
                          // Log notification preference change
                          try {
                            await fetch('/api/student/log-activity', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                action: 'Notification Preferences',
                                description: `${pref.label} ${checked ? 'enabled' : 'disabled'}`
                              })
                            });
                            fetchActivityLogs();
                          } catch (error) {
                            console.error('Failed to log notification change:', error);
                          }
                        } catch (error) {
                          console.error('Failed to update notification preference:', error);
                        }
                      }}
                    />
                  </div>
                ))
              )}

             
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}