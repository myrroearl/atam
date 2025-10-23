import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { presentationId, contentJson } = await request.json();
    
    console.log('Injection request data:', {
      presentationId,
      contentJsonKeys: Object.keys(contentJson || {}),
      slidesCount: contentJson?.slides?.length || 0
    });
    
    if (!presentationId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing presentationId' 
      }, { status: 400 });
    }
    
    if (!contentJson || !contentJson.slides) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing or invalid contentJson' 
      }, { status: 400 });
    }
    
    // Call your Google Apps Script web app URL (replace with your actual deployment URL)
    const response = await fetch('https://script.google.com/macros/s/AKfycbw_L-iDhWFtJeiY1TkcZaYn7t8d2npfobzgaTNR_mbkz_M8o1U2bryNVHH0AGih25j1uA/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        function: 'injectContentIntoPresentation',
        parameters: [presentationId, contentJson]
      }),
    });
    
    console.log('Google Apps Script response status:', response.status);
    console.log('Google Apps Script response headers:', Object.fromEntries(response.headers.entries()));
    
    // Check if response is okay
    if (!response.ok) {
      console.error('HTTP error response:', response.status, response.statusText);
      return NextResponse.json({ 
        success: false, 
        error: `Google Apps Script HTTP error: ${response.status} ${response.statusText}` 
      }, { status: 500 });
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response from Google Apps Script:', text.substring(0, 500));
      return NextResponse.json({ 
        success: false, 
        error: 'Google Apps Script returned non-JSON response. Check your deployment settings and permissions.' 
      }, { status: 500 });
    }
    
    const data = await response.json();
    console.log('Google Apps Script response data:', data);
    
    // Check if the Google Apps Script returned an error
    if (data.error) {
      console.error('Google Apps Script error:', data.error);
      return NextResponse.json({ 
        success: false, 
        error: `Google Apps Script error: ${data.error}` 
      }, { status: 500 });
    }
    
    // Ensure success is true
    if (!data.success) {
      console.error('Google Apps Script returned success: false without error message');
      return NextResponse.json({ 
        success: false, 
        error: 'Content injection failed for unknown reason' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      presentationUrl: data.presentationUrl
    });
    
  } catch (error) {
    console.error('Error in inject-content route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      success: false, 
      error: `Failed to inject content: ${errorMessage}` 
    }, { status: 500 });
  }
}