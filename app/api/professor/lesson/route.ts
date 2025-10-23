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
}

interface LessonPlanResponse {
  title: string;
  gradeLevel: string;
  duration: string;
  subject: string;
  objectives: string[];
  materials: string[];
  activities: Array<{
    phase: string;
    type: string;
    description: string;
  }>;
  assessment: string[];
}

export async function POST(request: NextRequest) {
  const body: LessonPlanRequest = await request.json();
    
  const { gradeLevel, subject, duration, classSize, learningGoal, topic, customRequirements } = body;
  try {
    

    // Validate required fields
    if (!gradeLevel || !subject || !duration || !learningGoal || !topic) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the prompt for Gemini
    const prompt = `
You are an expert educational curriculum designer. Create a comprehensive lesson plan based on the following requirements:

**Lesson Requirements:**
- Grade Level: ${gradeLevel}
- Subject: ${subject}
- Duration: ${duration} hours
- Class Size: ${classSize || 'Not specified'}
- Learning Goal: ${learningGoal}
- Topic: ${topic}
${customRequirements ? `- Custom Requirements: ${customRequirements}` : ''}

**Instructions:**
1. Create a detailed lesson plan that follows best educational practices
2. Include engaging activities appropriate for the grade level
3. Ensure activities fit within the specified duration
4. Include formative and summative assessments
5. Provide a comprehensive materials list
6. Each phase provide a script to guide the professor in the lesson.

**IMPORTANT: Return your response as a valid JSON object with this exact structure:**

{
  "title": "Engaging lesson title",
  "gradeLevel": "${gradeLevel}",
  "duration": "${duration} hours",
  "subject": "${subject}",
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
      "description": "Detailed description of the opening activity"
    },
    {
      "phase": "Main Activity (X minutes)",
      "type": "Direct Instruction",
      "description": "Detailed description of the main teaching activity"
    },
    {
      "phase": "Practice (X minutes)",
      "type": "Guided Practice",
      "description": "Detailed description of practice activity"
    },
    {
      "phase": "Closure (X minutes)",
      "type": "Wrap-up",
      "description": "Detailed description of closure activity"
    }
  ],
  "assessment": [
    "Formative assessment strategy",
    "Summative assessment strategy",
    "Additional assessment method"
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
