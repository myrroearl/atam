import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Get the user session to access user email
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'User not authenticated or email not available' },
        { status: 401 }
      );
    }

    const { templateId, slideCount } = await request.json();
    
    console.log('Making request to Google Apps Script with:', { templateId, slideCount, userEmail: session.user.email });
    
    // Call your Google Apps Script web app URL
    const response = await fetch('https://script.google.com/macros/s/AKfycbyweEslxhUSElgH0zuUd2wODdNhKM0Uq6x-0bXasfFkFKkBxnQQ0sLuflZ4wxSuCId6RQ/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        function: 'createPresentationFromTemplate',
        parameters: [templateId, slideCount],
        userEmail: session.user.email // Pass the user's email for permissions
      }),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.log('Non-JSON response:', textResponse.substring(0, 500));
      return NextResponse.json({ 
        error: 'Google Apps Script returned non-JSON response. Check deployment settings.' 
      }, { status: 500 });
    }
    
    const data = await response.json();
    console.log('Parsed response:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating presentation:', error);
    return NextResponse.json({ 
      error: 'Failed to create presentation: ' + error 
    }, { status: 500 });
  }
}