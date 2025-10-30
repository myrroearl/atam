import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get account_id directly from session (just like the profile route does)
    const accountId = session.user.account_id;
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID not found in session' }, { status: 400 });
    }

    // Fetch activity logs for the student's account, ordered by most recent first
    const { data: activityLogs, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(20); // Limit to last 20 activities

    if (error) {
      console.error('Supabase error fetching activity logs:', error);
      return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
    }

    // Transform the data to match the expected format
    const transformedLogs = activityLogs.map(log => {
      const activityType = inferActivityType(log.action);
      return {
        id: log.log_id,
        action: log.action,
        description: log.description || '',
        timestamp: log.created_at,
        type: activityType.replace(/_/g, ' '), // Convert snake_case to readable format
        icon: getIconForActivityType(activityType),
        color: getColorForActivityType(activityType),
        bgColor: getBgColorForActivityType(activityType),
        borderColor: getBorderColorForActivityType(activityType),
        metadata: {} // Your existing table doesn't have metadata column
      };
    });

    return NextResponse.json({ activityLogs: transformedLogs });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const accountId = session.user.account_id;
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID not found in session' }, { status: 400 });
    }

    const body = await request.json();
    const { action, description, metadata } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // Insert the activity log
    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        account_id: accountId,
        action: action,
        description: description || null,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Supabase error inserting activity log:', error);
      return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
    }

    return NextResponse.json({ success: true, log: data[0] });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to infer activity type from action text
function inferActivityType(action: string): string {
  const actionLower = action.toLowerCase();
  
  if (actionLower.includes('profile picture') || actionLower.includes('photo') || actionLower.includes('avatar')) {
    return actionLower.includes('remove') || actionLower.includes('delete') ? 'profile_picture_remove' : 'profile_picture_upload';
  }
  if (actionLower.includes('password')) return 'password_change';
  if (actionLower.includes('email')) return 'email_verification';
  if (actionLower.includes('privacy') || actionLower.includes('visibility')) return 'privacy_settings_update';
  if (actionLower.includes('notification')) return 'notification_preferences';
  if (actionLower.includes('login')) return 'login';
  if (actionLower.includes('logout')) return 'logout';
  if (actionLower.includes('profile') || actionLower.includes('update')) return 'profile_update';
  
  // Bookmark activities
  if (actionLower.includes('bookmark')) return 'bookmark_activity';
  
  // Student link clicks
  if (actionLower.includes('student_link_click') || actionLower.includes('clicked on')) return 'student_link_click';
  
  // Resource link clicks
  if (actionLower.includes('resource_link_click') || actionLower.includes('opened resource')) return 'link_opened';
  
  return 'general_activity';
}

// Helper functions to get appropriate icons and colors for different activity types
function getIconForActivityType(activityType: string) {
  const iconMap: { [key: string]: string } = {
    'profile_picture_upload': 'Camera',
    'profile_picture_remove': 'X',
    'password_change': 'Shield',
    'profile_update': 'Edit3',
    'email_verification': 'Mail',
    'privacy_settings_update': 'Eye',
    'notification_preferences': 'Bell',
    'login': 'LogIn',
    'logout': 'LogOut',
    'bookmark_activity': 'Bookmark',
    'student_link_click': 'ExternalLink',
    'link_opened': 'ExternalLink'
  };
  return iconMap[activityType] || 'Activity';
}

function getColorForActivityType(activityType: string) {
  const colorMap: { [key: string]: string } = {
    'profile_picture_upload': 'text-blue-500',
    'profile_picture_remove': 'text-red-500',
    'password_change': 'text-green-500',
    'profile_update': 'text-purple-500',
    'email_verification': 'text-purple-500',
    'privacy_settings_update': 'text-orange-500',
    'notification_preferences': 'text-indigo-500',
    'login': 'text-green-500',
    'logout': 'text-gray-500',
    'bookmark_activity': 'text-yellow-500',
    'student_link_click': 'text-purple-500',
    'link_opened': 'text-green-500'
  };
  return colorMap[activityType] || 'text-gray-500';
}

function getBgColorForActivityType(activityType: string) {
  const bgColorMap: { [key: string]: string } = {
    'profile_picture_upload': 'bg-blue-50 dark:bg-blue-950/20',
    'profile_picture_remove': 'bg-red-50 dark:bg-red-950/20',
    'password_change': 'bg-green-50 dark:bg-green-950/20',
    'profile_update': 'bg-purple-50 dark:bg-purple-950/20',
    'email_verification': 'bg-purple-50 dark:bg-purple-950/20',
    'privacy_settings_update': 'bg-orange-50 dark:bg-orange-950/20',
    'notification_preferences': 'bg-indigo-50 dark:bg-indigo-950/20',
    'login': 'bg-green-50 dark:bg-green-950/20',
    'logout': 'bg-gray-50 dark:bg-gray-950/20',
    'bookmark_activity': 'bg-yellow-50 dark:bg-yellow-950/20',
    'student_link_click': 'bg-purple-50 dark:bg-purple-950/20',
    'link_opened': 'bg-green-50 dark:bg-green-950/20'
  };
  return bgColorMap[activityType] || 'bg-gray-50 dark:bg-gray-950/20';
}

function getBorderColorForActivityType(activityType: string) {
  const borderColorMap: { [key: string]: string } = {
    'profile_picture_upload': 'border-blue-200 dark:border-blue-800',
    'profile_picture_remove': 'border-red-200 dark:border-red-800',
    'password_change': 'border-green-200 dark:border-green-800',
    'profile_update': 'border-purple-200 dark:border-purple-800',
    'email_verification': 'border-purple-200 dark:border-purple-800',
    'privacy_settings_update': 'border-orange-200 dark:border-orange-800',
    'notification_preferences': 'border-indigo-200 dark:border-indigo-800',
    'login': 'border-green-200 dark:border-green-800',
    'logout': 'border-gray-200 dark:border-gray-800',
    'bookmark_activity': 'border-yellow-200 dark:border-yellow-800',
    'student_link_click': 'border-purple-200 dark:border-purple-800',
    'link_opened': 'border-green-200 dark:border-green-800'
  };
  return borderColorMap[activityType] || 'border-gray-200 dark:border-gray-800';
}