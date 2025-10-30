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

    // Get total opens by all users
    const { data, error } = await supabase
      .from('resource_link_opens')
      .select('id', { count: 'exact' });

    if (error) {
      console.error('Supabase error fetching all users opens:', error);
      return NextResponse.json({ error: 'Failed to fetch total opens' }, { status: 500 });
    }

    return NextResponse.json({ 
      totalOpens: data?.length || 0
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}