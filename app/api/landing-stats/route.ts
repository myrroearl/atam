import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('🚀 Landing stats API called');
    
    // Check environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing Supabase environment variables');
      return NextResponse.json({
        error: 'Supabase configuration missing',
        message: 'Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file',
        fallback: true
      }, { status: 500 });
    }

    console.log('✅ Environment variables found');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...');

    // Create Supabase client inside the function to ensure env vars are available
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('🔗 Supabase client created');

    // Test basic connection first
    const { error: testError } = await supabase
      .from('accounts')
      .select('account_id')
      .limit(1);
    
    if (testError) {
      console.error('Supabase connection test failed:', testError);
      throw new Error(`Supabase connection failed: ${testError?.message || 'Unknown error'}`);
    }
    
    console.log('Supabase connection test successful');

    console.log('Fetching landing stats from Supabase...');
    
    // Fetch statistics from Supabase based on actual schema
    const [
      studentsResult,
      professorsResult,
      classesResult,
      gradeEntriesResult,
      aiToolsUsageResult,
      scholarshipsResult
    ] = await Promise.all([
      // Count all students (no deleted_at field in schema)
      supabase
        .from('students')
        .select('student_id', { count: 'exact', head: true }),
      
      // Count all professors (no deleted_at field in schema)
      supabase
        .from('professors')
        .select('prof_id', { count: 'exact', head: true }),
      
      // Count all classes (no status field in schema)
      supabase
        .from('classes')
        .select('class_id', { count: 'exact', head: true }),
      
      // Count total grade entries
      supabase
        .from('grade_entries')
        .select('grade_id', { count: 'exact', head: true })
        .eq('status', 'active'),
      
      // Count AI tools usage
      supabase
        .from('ai_tools_usage')
        .select('usage_id', { count: 'exact', head: true })
        .eq('success', true),
      
      // Count available scholarships
      supabase
        .from('scholarships')
        .select('scholarship_id', { count: 'exact', head: true })
    ]);

    console.log('Query results:', {
      students: studentsResult,
      professors: professorsResult,
      classes: classesResult,
      gradeEntries: gradeEntriesResult,
      aiToolsUsage: aiToolsUsageResult,
      scholarships: scholarshipsResult
    });

    const stats = {
      totalStudents: studentsResult.count || 0,
      totalProfessors: professorsResult.count || 0,
      totalClasses: classesResult.count || 0,
      totalGradeEntries: gradeEntriesResult.count || 0,
      aiToolsUsed: aiToolsUsageResult.count || 0,
      scholarshipsAvailable: scholarshipsResult.count || 0
    };

    console.log('Final stats:', stats);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching landing stats:', error);
    
    // Return fallback stats in case of error - always return JSON
    return NextResponse.json({
      totalStudents: 0,
      totalProfessors: 0,
      totalClasses: 0,
      totalGradeEntries: 0,
      aiToolsUsed: 0,
      scholarshipsAvailable: 0,
      error: true,
      message: 'Failed to fetch data from database'
    });
  }
}
