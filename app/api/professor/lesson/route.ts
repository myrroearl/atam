import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Google AI API key
const API_KEY = 'AIzaSyDSnDgk8LUcsArTuJ_7uwHWCUlrYqH1vmM';
const genAI = new GoogleGenerativeAI(API_KEY);

interface LessonPlanRequest {
  gradeLevel: string;
  subject: string;
  duration: string;
  classSize: string;
  learningGoal: string;
  topic: string;
  customRequirements?: string;
  teachingStyle?: string[];
}

interface LessonPlanResponse {
  title: string;
  gradeLevel: string;
  duration: string;
  subject: string;
  summary?: string;
  objectives: string[];
  materials: string[];
  activities: Array<{
    phase: string;
    type: string;
    description: string;
  }>;
  assessment: string[];
  extensions?: string[];
}

export async function POST(request: NextRequest) {
  const body: LessonPlanRequest = await request.json();
    
  const { gradeLevel, subject, duration, classSize, learningGoal, topic, customRequirements, teachingStyle } = body;
  try {
    

    // Validate required fields
    if (!gradeLevel || !subject || !duration || !learningGoal || !topic) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the prompt for Gemini
    const teachingStyleText = teachingStyle && teachingStyle.length > 0 
      ? `\n- Teaching Style Preferences: ${teachingStyle.join(', ')}` 
      : '';
      
    const prompt = `
You are an expert educational curriculum designer. Create a comprehensive lesson plan based on the following requirements:

**Lesson Requirements:**
- Grade Level: ${gradeLevel}
- Subject: ${subject}
- Duration: ${duration} hours
- Class Size: ${classSize || 'Not specified'}
- Learning Goal: ${learningGoal}
- Topic: ${topic}${teachingStyleText}${customRequirements ? `\n- Custom Requirements: ${customRequirements}` : ''}

**Instructions:**
1. Create a detailed lesson plan that follows best educational practices
2. Align the lesson structure and activities with the selected teaching style preferences (${teachingStyle?.join(', ') || 'general education best practices'})
3. Include engaging activities appropriate for the grade level
4. Ensure activities fit within the specified duration
5. Include formative and summative assessments
6. Provide a comprehensive materials list
7. Use clear and professional formatting in descriptions:
   - Use **bold text** for key concepts, terms, and important points (e.g., **HashMap**, **O(1) complexity**)
   - Use bullet points (- item) for lists of multiple concepts or items
   - Use numbered lists (1. First step, 2. Second step) for sequential instructions
   - Avoid mixing bullet points with bold sub-headings; use either lists OR paragraph form with bold terms
   - Keep descriptions clear and conversational
8. For objectives, assessment, and extensions: Write clear, complete sentences without markdown formatting
   - These fields should be readable as plain text with proper capitalization
   - If you must emphasize, use **bold** sparingly for key terms only
   - Keep each item concise and professional
9. Add a brief lesson summary/introduction that explains what students will learn and why
10. Include optional extended activities for advanced students

**IMPORTANT: Return your response as a valid JSON object with this exact structure:**

{
  "title": "Engaging and descriptive lesson title",
  "gradeLevel": "${gradeLevel}",
  "duration": "${duration} hours",
  "subject": "${subject}",
  "summary": "A brief 2-3 sentence overview of the lesson and what students will learn.",
  "objectives": [
    "Specific learning objective 1",
    "Specific learning objective 2",
    "Specific learning objective 3"
  ],
  "materials": [
    "Material 1",
    "Material 2",
    "Material 3"
  ],
  "activities": [
    {
      "phase": "Opening (X minutes)",
      "type": "Engagement",
      "description": "Use clear paragraph form with **bold terms** OR bullet points. Example: 'Introduce the topic by asking thought-provoking questions about **core concepts**. Engage students with a quick demonstration showing **real-world applications**.' Or use: '- Ask opening questions\n- Show brief demo\n- Explain **key concept**'"
    },
    {
      "phase": "Main Activity (X minutes)",
      "type": "Direct Instruction",
      "description": "Use either paragraph form with **bold terms** for emphasis OR organize as bullet/numbered list. Keep formatting consistent within each description."
    },
    {
      "phase": "Practice (X minutes)",
      "type": "Guided Practice",
      "description": "Provide detailed practice instructions. Use **bold** to highlight important steps or concepts, but choose either paragraph form OR list form, not both mixed together."
    },
    {
      "phase": "Closure (X minutes)",
      "type": "Wrap-up",
      "description": "Summarize key points. Use **bold** for takeaway concepts. Keep formatting clean and professional."
    }
  ],
  "assessment": [
    "Formative assessment strategy",
    "Summative assessment strategy",
    "Additional assessment method"
  ],
  "extensions": [
    "Optional extended activity for advanced students 1",
    "Optional extended activity for advanced students 2"
  ]
}

**Return only the JSON object, no additional text or formatting.**
`;

    // Get the model with generation config
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
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
    let lessonPlan: LessonPlanResponse;
    try {
      // Try to parse the response directly
      lessonPlan = JSON.parse(generatedContent.trim());
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON from the text
      // Find the first '{' and the last '}' to extract the JSON object
      const startIndex = generatedContent.indexOf('{');
      const endIndex = generatedContent.lastIndexOf('}');
      
      if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        const jsonString = generatedContent.substring(startIndex, endIndex + 1);
        lessonPlan = JSON.parse(jsonString);
      } else {
        throw new Error('Failed to find JSON object in AI response');
      }
    }
    // Validate the lesson plan structure
    if (!lessonPlan.title || !lessonPlan.objectives || !lessonPlan.activities || !lessonPlan.assessment) {
      throw new Error('Invalid lesson plan structure');
    }

    return NextResponse.json(lessonPlan);
    
  } catch (error: any) {
    console.error('Error generating lesson plan:', error);
    
    // If parsing fails, provide a fallback lesson plan structure
    const fallbackLessonPlan: LessonPlanResponse = {
      title: `${topic} - ${subject} Lesson`,
      gradeLevel: gradeLevel,
      duration: `${duration} hours`,
      subject: subject,
      objectives: [
        `Students will understand the key concepts of ${topic}`,
        `Students will be able to apply ${topic} knowledge in practical scenarios`,
        `Students will demonstrate comprehension through assessments`
      ],
      materials: [
        'Whiteboard/Projector',
        'Handouts',
        'Computers/Tablets',
        'Reference materials'
      ],
      activities: [
        {
          phase: 'Opening (20 minutes)',
          type: 'Engagement',
          description: `Introduction to ${topic} with engaging questions and examples`
        },
        {
          phase: 'Main Lesson (60 minutes)',
          type: 'Direct Instruction',
          description: `Detailed explanation and demonstration of ${topic} concepts`
        },
        {
          phase: 'Practice Activity (30 minutes)',
          type: 'Guided Practice',
          description: `Hands-on activities and exercises related to ${topic}`
        },
        {
          phase: 'Closure (10 minutes)',
          type: 'Wrap-up',
          description: 'Summary of key points and preview of next lesson'
        }
      ],
      assessment: [
        'Formative: Observation during activities',
        'Summative: End-of-lesson quiz',
        'Homework: Practice assignments'
      ]
    };

    return NextResponse.json(fallbackLessonPlan);
  }
}
