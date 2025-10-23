import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { templateId, slideCount } = await request.json();
    
    console.log('Making request to Google Apps Script with:', { templateId, slideCount });
    
    // Call your Google Apps Script web app URL
    const response = await fetch('https://script.google.com/macros/s/AKfycbxlzhu33vkBeJg37tFbKfPbumy5afWIgJxsGNpcbVfTYML0ewhII1_4KM1XmA8pnon2JA/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        function: 'createPresentationFromTemplate',
        parameters: [templateId, slideCount]
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