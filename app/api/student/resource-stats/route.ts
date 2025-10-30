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

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');

    if (!resourceId) {
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
    }

    // Get resource open statistics
    const { data: resourceStats, error: resourceError } = await supabase
      .from('resource_open_stats')
      .select('*')
      .eq('resource_id', resourceId)
      .single();

    if (resourceError) {
      console.error('Supabase error fetching resource stats:', resourceError);
      return NextResponse.json({ error: 'Failed to fetch resource statistics' }, { status: 500 });
    }

    // Get current student's open count for this resource
    const accountId = session.user.account_id;
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('student_id')
      .eq('account_id', accountId)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const { data: studentOpens, error: studentOpensError } = await supabase
      .from('resource_link_opens')
      .select('id')
      .eq('student_id', student.student_id)
      .eq('resource_id', resourceId);

    if (studentOpensError) {
      console.error('Supabase error fetching student opens:', studentOpensError);
      return NextResponse.json({ error: 'Failed to fetch student opens' }, { status: 500 });
    }

    return NextResponse.json({
      resourceStats: resourceStats || { total_opens: 0, unique_students: 0 },
      studentOpens: studentOpens?.length || 0
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}