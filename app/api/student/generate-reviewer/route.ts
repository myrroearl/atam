import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Google AI API key
const API_KEY = 'AIzaSyDSnDgk8LUcsArTuJ_7uwHWCUlrYqH1vmM';
const genAI = new GoogleGenerativeAI(API_KEY);

export async function POST(request: Request) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { content, title, format } = body;
    
    // Validate input
    if (!content || content.trim().length < 100) {
      return NextResponse.json(
        { error: 'Content must be at least 100 characters long' },
        { status: 400 }
      );
    }

    // Build the prompt for generating a comprehensive reviewer
    const prompt = `
You are an expert educational content creator. Create a comprehensive study reviewer/guide based on the following content.

**Source Content:**
${content}

**Instructions:**
1. Create a well-structured study reviewer that helps students review and understand the key concepts
2. Include the following sections:
   - Overview/Introduction: Brief summary of the main topic
   - Key Concepts: List and explain the most important concepts (with definitions)
   - Detailed Breakdown: Organize content by subtopics with clear explanations
   - Important Terms & Definitions: Glossary of key terminology
   - Study Tips: How to effectively learn and remember this material
   - Practice Questions: 5-10 review questions to test understanding
   - Summary: Concise recap of essential points

3. Use clear formatting with **bold** for emphasis on key terms
4. Structure content logically and pedagogically
5. Make it student-friendly and easy to review

**IMPORTANT: Return your response as a valid JSON object with this exact structure:**

{
  "title": "Title of the Study Reviewer",
  "overview": "Brief overview paragraph",
  "keyConcepts": [
    {
      "concept": "Concept name",
      "definition": "Clear definition",
      "importance": "Why this matters"
    }
  ],
  "sections": [
    {
      "title": "Section title",
      "content": "Detailed explanation with **bold terms** for emphasis"
    }
  ],
  "terms": [
    {
      "term": "Term name",
      "definition": "Definition"
    }
  ],
  "studyTips": [
    "Practical study tip 1",
    "Practical study tip 2"
  ],
  "practiceQuestions": [
    {
      "question": "Question text",
      "hint": "Optional hint"
    }
  ],
  "summary": "Concise summary paragraph"
}

**Return only the JSON object, no additional text or formatting.**
`;

    // Get the model with generation config
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        }
      ]
    });

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const generatedContent = response.text();
    
    if (!generatedContent) {
      throw new Error('No content generated from AI API');
    }

    // Parse the JSON response from Gemini
    let reviewer: any;
    try {
      // Try to parse the response directly
      reviewer = JSON.parse(generatedContent.trim());
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON from the text
      const startIndex = generatedContent.indexOf('{');
      const endIndex = generatedContent.lastIndexOf('}');
      
      if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        const jsonString = generatedContent.substring(startIndex, endIndex + 1);
        reviewer = JSON.parse(jsonString);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // Validate the reviewer structure
    if (!reviewer.title || !reviewer.overview) {
      throw new Error('Invalid reviewer structure');
    }

    // Log the activity
    try {
      await fetch(`${request.url.split('/api')[0]}/api/student/activity-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          action: 'reviewer_generated',
          description: `Generated study reviewer: ${reviewer.title}`,
          metadata: {
            title: reviewer.title,
            contentLength: content.length
          }
        })
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    return NextResponse.json({ 
      reviewer,
      success: true
    });
    
  } catch (error: any) {
    console.error('Error generating reviewer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate reviewer' },
      { status: 500 }
    );
  }
}

