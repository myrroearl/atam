import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseServer } from "@/lib/student/supabaseServer"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.account_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only JPG, PNG, and WebP images are allowed." 
      }, { status: 400 })
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024 // 2MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "File too large. Maximum size is 2MB." 
      }, { status: 400 })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `${session.user.account_id}_${Date.now()}.${fileExtension}`
    const filePath = `avatars/${fileName}`

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseServer.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true // Replace existing file with same name
      })

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError)
      return NextResponse.json({ 
        error: "Failed to upload image" 
      }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseServer.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    // Update user's profile picture URL in database
    let updateQuery
    if (session.user.role === 'student') {
      updateQuery = supabaseServer
        .from('students')
        .update({ profile_picture_url: publicUrl })
        .eq('account_id', session.user.account_id)
    } else if (session.user.role === 'professor') {
      updateQuery = supabaseServer
        .from('professors')
        .update({ profile_picture_url: publicUrl })
        .eq('account_id', session.user.account_id)
    } else if (session.user.role === 'admin') {
      updateQuery = supabaseServer
        .from('accounts')
        .update({ profile_picture_url: publicUrl })
        .eq('account_id', session.user.account_id)
    }

    if (updateQuery) {
      const { error: updateError } = await updateQuery
      
      if (updateError) {
        console.error('Database update error:', updateError)
        // Clean up uploaded file if database update fails
        await supabaseServer.storage
          .from('avatars')
          .remove([filePath])
        
        return NextResponse.json({ 
          error: "Failed to update profile picture" 
        }, { status: 500 })
      }
    }

    // Log the activity for students
    if (session.user.role === 'student') {
      const { error: logError } = await supabaseServer
        .from('activity_logs')
        .insert({
          account_id: session.user.account_id,
          action: 'Profile Picture Updated',
          description: 'Changed profile photo to new image'
        });

      if (logError) {
        console.error('Failed to log activity:', logError);
        // Don't fail the request if logging fails
      }
    }

    return NextResponse.json({ 
      success: true,
      profilePictureUrl: publicUrl,
      message: "Profile picture updated successfully"
    })

  } catch (error) {
    console.error('Profile picture upload error:', error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.account_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current profile picture URL
    let query
    if (session.user.role === 'student') {
      query = supabaseServer
        .from('students')
        .select('profile_picture_url')
        .eq('account_id', session.user.account_id)
        .single()
    } else if (session.user.role === 'professor') {
      query = supabaseServer
        .from('professors')
        .select('profile_picture_url')
        .eq('account_id', session.user.account_id)
        .single()
    } else if (session.user.role === 'admin') {
      query = supabaseServer
        .from('accounts')
        .select('profile_picture_url')
        .eq('account_id', session.user.account_id)
        .single()
    }

    if (!query) {
      return NextResponse.json({ error: "Invalid user role" }, { status: 400 })
    }

    const { data, error: fetchError } = await query
    
    if (fetchError) {
      console.error('Error fetching current profile picture:', fetchError)
      return NextResponse.json({ error: "Failed to fetch current profile picture" }, { status: 500 })
    }

    const currentUrl = data?.profile_picture_url
    
    if (currentUrl) {
      // Extract file path from URL
      const urlParts = currentUrl.split('/')
      const fileName = urlParts[urlParts.length - 1]
      const filePath = `avatars/${fileName}`

      // Delete from storage
      const { error: deleteError } = await supabaseServer.storage
        .from('avatars')
        .remove([filePath])

      if (deleteError) {
        console.error('Error deleting file from storage:', deleteError)
      }
    }

    // Update database to remove profile picture URL
    let updateQuery
    if (session.user.role === 'student') {
      updateQuery = supabaseServer
        .from('students')
        .update({ profile_picture_url: null })
        .eq('account_id', session.user.account_id)
    } else if (session.user.role === 'professor') {
      updateQuery = supabaseServer
        .from('professors')
        .update({ profile_picture_url: null })
        .eq('account_id', session.user.account_id)
    } else if (session.user.role === 'admin') {
      updateQuery = supabaseServer
        .from('accounts')
        .update({ profile_picture_url: null })
        .eq('account_id', session.user.account_id)
    }

    if (updateQuery) {
      const { error: updateError } = await updateQuery
      
      if (updateError) {
        console.error('Database update error:', updateError)
        return NextResponse.json({ error: "Failed to remove profile picture" }, { status: 500 })
      }
    }

    // Log the activity for students
    if (session.user.role === 'student') {
      const { error: logError } = await supabaseServer
        .from('activity_logs')
        .insert({
          account_id: session.user.account_id,
          action: 'Profile Picture Removed',
          description: 'Removed profile photo'
        });

      if (logError) {
        console.error('Failed to log activity:', logError);
        // Don't fail the request if logging fails
      }
    }

    return NextResponse.json({ 
      success: true,
      message: "Profile picture removed successfully"
    })

  } catch (error) {
    console.error('Profile picture deletion error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}