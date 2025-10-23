import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyDSnDgk8LUcsArTuJ_7uwHWCUlrYqH1vmM';
const genAI = new GoogleGenerativeAI(API_KEY);

export async function POST(request: Request) {
  try {
    const { userPrompt, placeholders, gradeLevel, style, additionalNotes } = await request.json();
    
    // Create a structured prompt for Gemini
    const prompt = `
      Create content for a ${style} presentation about "${userPrompt}" for ${gradeLevel} level audience.
      ${additionalNotes ? `Additional requirements: ${additionalNotes}` : ''}
      
      The presentation has ${placeholders.length} slides with the following structure:
      ${placeholders.map((slide: { slideIndex: number; placeholders: string[] }) => {
        return `Slide ${slide.slideIndex}: ${slide.placeholders.join(', ')}`;
      }).join('\n')}
      
      Generate appropriate content for each placeholder. Return ONLY a valid JSON object with this exact structure:
      {
        "slides": [
          {
            "slideIndex": 1,
            "content": {
              "{{placeholder1}}": "content for placeholder1",
              "{{placeholder2}}": "content for placeholder2"
            }
          },
          ...
        ]
      }
    `;
    
    // Get the model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const generatedText = response.text();
    
    // Extract the JSON from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/); // Extract JSON object
    
    if (jsonMatch) {
      return NextResponse.json(JSON.parse(jsonMatch[0]));
    } else {
      throw new Error('Failed to parse JSON from AI response');
    }
  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}