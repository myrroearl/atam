import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    const { resourceId } = body;

    if (!resourceId) {
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
    }

    // Get student_id from account_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('student_id')
      .eq('account_id', accountId)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Insert the resource link open record
    const { data, error } = await supabase
      .from('resource_link_opens')
      .insert({
        student_id: student.student_id,
        resource_id: resourceId,
        opened_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Supabase error inserting resource link open:', error);
      return NextResponse.json({ error: 'Failed to record resource open' }, { status: 500 });
    }

    return NextResponse.json({ success: true, record: data[0] });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const accountId = session.user.account_id;
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID not found in session' }, { status: 400 });
    }

    // Get student_id from account_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('student_id')
      .eq('account_id', accountId)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get student's resource open statistics
    const { data: stats, error: statsError } = await supabase
      .from('student_resource_stats')
      .select('*')
      .eq('student_id', student.student_id)
      .single();

    if (statsError) {
      console.error('Supabase error fetching student stats:', statsError);
      return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }

    // Get individual resource open counts for the student
    const { data: resourceCounts, error: resourceError } = await supabase
      .from('resource_link_opens')
      .select(`
        resource_id,
        learning_resources!inner(title)
      `)
      .eq('student_id', student.student_id);

    if (resourceError) {
      console.error('Supabase error fetching resource counts:', resourceError);
      return NextResponse.json({ error: 'Failed to fetch resource counts' }, { status: 500 });
    }

    // Count opens per resource
    const resourceOpenCounts = resourceCounts?.reduce((acc: Record<string, number>, record: any) => {
      const resourceId = record.resource_id;
      acc[resourceId] = (acc[resourceId] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({ 
      stats: stats || { total_opens: 0, unique_resources_opened: 0 },
      resourceCounts: resourceOpenCounts
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}