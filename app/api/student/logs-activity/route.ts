import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseServer } from '@/lib/student/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { action, description } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // Log the activity
    const { error: logError } = await supabaseServer
      .from('activity_logs')
      .insert({
        account_id: session.user.account_id,
        action: action,
        description: description || ''
      });

    if (logError) {
      console.error('Failed to log activity:', logError);
      return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}