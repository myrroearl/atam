import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Google AI API key
const API_KEY = 'AIzaSyDSnDgk8LUcsArTuJ_7uwHWCUlrYqH1vmM';
const genAI = new GoogleGenerativeAI(API_KEY);

// Google Apps Script Web App URL
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby_FnO6wzz2-ZUpJWnfNUzCGSdlt4UgOu4W-AR_U769IE3Rw6qju45GMSP4bRvzHcgO/exec';

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

    // Parse the request body
    const body = await request.json();
    const { prompt, numQuestions, difficulty, questionTypes } = body;
    
    // Validate input
    if (!prompt || !numQuestions || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt, numQuestions, or difficulty' },
        { status: 400 }
      );
    }
    
    // Validate question types
    const validQuestionTypes = ['multiple_choice', 'true_false', 'short_answer', 'fill_blank', 'identification'];
    const selectedTypes = questionTypes || ['multiple_choice', 'true_false', 'short_answer'];
    
    if (!Array.isArray(selectedTypes) || selectedTypes.length === 0) {
      return NextResponse.json(
        { error: 'At least one question type must be selected' },
        { status: 400 }
      );
    }
    
    // Validate that all question types are valid
    const invalidTypes = selectedTypes.filter(type => !validQuestionTypes.includes(type));
    if (invalidTypes.length > 0) {
      return NextResponse.json(
        { error: `Invalid question types: ${invalidTypes.join(', ')}` },
        { status: 400 }
      );
    }
    
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Difficulty must be one of: easy, medium, hard' },
        { status: 400 }
      );
    }
    
    if (typeof numQuestions !== 'number' || numQuestions < 1 || numQuestions > 100) {
      return NextResponse.json(
        { error: 'numQuestions must be a number between 1 and 100' },
        { status: 400 }
      );
    }

    // Generate a short quiz title
    const quizTitle = await generateShortTitle(prompt);
    
    // Call Gemini API to generate quiz questions
    const questions = await generateQuizQuestions(prompt, numQuestions, difficulty, selectedTypes);
    
    // Create Google Form using the Google Apps Script Web App with shortened title
    const formResponse = await createGoogleForm(quizTitle, questions, session.user.email);
    
    // Return the form link and questions with the quiz title
    return NextResponse.json({ 
      link: formResponse.link,
      editLink: formResponse.editLink,
      questions: questions,
      quizTitle: quizTitle 
    });
    
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}

async function generateShortTitle(prompt: string): Promise<string> {
  try {
    // If the prompt is very long (likely extracted file content), ask Gemini for a short title
    if (prompt.length > 200) {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const titlePrompt = `Based on this content, generate a concise, professional quiz title (maximum 8 words, no quotes needed):\n\n${prompt.substring(0, 1000)}`;
      
      try {
        const result = await model.generateContent(titlePrompt);
        const response = result.response;
        let title = response.text().trim();
        
        // Remove any quotes if present
        title = title.replace(/^["']|["']$/g, '');
        
        // Limit to 8 words max
        const words = title.split(' ');
        if (words.length > 8) {
          title = words.slice(0, 8).join(' ');
        }
        
        return title;
      } catch (error) {
        console.error('Error generating short title:', error);
        // Fall through to default logic
      }
    }
    
    // For shorter prompts, extract the first few words
    const words = prompt.split(/\s+/);
    if (words.length > 8) {
      return words.slice(0, 8).join(' ');
    }
    return prompt.substring(0, 50);
  } catch (error) {
    console.error('Error in generateShortTitle:', error);
    return 'Quiz';
  }
}

async function generateQuizQuestions(prompt: string, numQuestions: number, difficulty: string, questionTypes: string[]) {
  try {
    // Map question types to descriptions
    const typeDescriptions: { [key: string]: string } = {
      'multiple_choice': 'Multiple choice questions (with 4 options)',
      'true_false': 'True/False questions',
      'short_answer': 'Short answer questions',
      'identification': 'Identification questions (naming or identifying items)',
      'fill_blank': 'Fill in the blank questions'
    };
    
    // Build the question types string for the prompt
    const typesList = questionTypes.map(type => `- ${typeDescriptions[type]}`).join('\n');
    
    // Build JSON structure examples for selected types
    const typeExamples: { [key: string]: string } = {
      'multiple_choice': '{ "type": "multiple_choice", "question": "Question text?", "choices": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"], "answer": "A", "points": 1 }',
      'true_false': '{ "type": "true_false", "question": "Statement to evaluate.", "answer": "True", "points": 1 }',
      'short_answer': '{ "type": "short_answer", "question": "Question requiring a short response?", "answer": "Sample answer", "points": 2 }',
      'identification': '{ "type": "identification", "question": "What is this item called?", "answer": "Correct identification", "points": 2 }',
      'fill_blank': '{ "type": "fill_blank", "question": "Complete the sentence: The capital of France is _____.", "answer": "Paris", "points": 1 }'
    };
    
    const examples = questionTypes.map(type => typeExamples[type]).join('\n\n      ');
    
    // Construct the prompt for Gemini
    const geminiPrompt = `
      Create a quiz with ${numQuestions} questions about: ${prompt}.
      Difficulty level: ${difficulty}.
      
      Include ONLY the following question types:
      ${typesList}
      
      Format the response as a valid JSON array with the following structure for each question type:
      
      ${examples}
      
      Assign points based on difficulty: easy questions = 1 point, medium = 2 points, hard = 3 points.
      Distribute the questions evenly across the selected types.
      
      Return ONLY the JSON array with no additional text.
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
    const result = await model.generateContent(geminiPrompt);
    const response = result.response;
    const generatedText = response.text();
    
    // Parse the JSON response
    // We need to handle potential JSON formatting issues from the AI response
    let questions;
    try {
      // Try to parse the response directly
      questions = JSON.parse(generatedText.trim());
    } catch (e) {
      // If direct parsing fails, try to extract JSON from the text
      // Find the first '[' and the last ']' to extract the JSON array
      const startIndex = generatedText.indexOf('[');
      const endIndex = generatedText.lastIndexOf(']');
      
      if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        const jsonString = generatedText.substring(startIndex, endIndex + 1);
        questions = JSON.parse(jsonString);
      } else {
        throw new Error('Failed to find JSON array in Model response');
      }
    }
    
    // Validate the questions format
    if (!Array.isArray(questions)) {
      throw new Error('Model did not return an array of questions');
    }
    
    return questions;
  } catch (error: any) {
    console.error('Error calling the Model', error);
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
}

async function createGoogleForm(title: string, questions: any[], userEmail: string) {
  try {
    // Prepare the questions for the Google Form
    // Include the correct answers and points for each question
    const formQuestions = questions.map(q => ({
      question: q.question,
      type: q.type,
      choices: q.choices || undefined,
      answer: q.answer, // Include the correct answer
      points: q.points || 1 // Default to 1 point if not specified
    }));
    
    // Send request to Google Apps Script Web App
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `Quiz: ${title}`,
        questions: formQuestions,
        userEmail: userEmail, // Pass the user's email for permissions
      })
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script error: ${response.statusText}`);
    }

    const data = await response.json();
    return data; // Should contain { link: "...", editLink: "...", totalPoints: ..., questionCount: ... }
  } catch (error: any) {
    console.error('Error creating Google Form:', error);
    throw new Error(`Failed to create Google Form: ${error.message}`);
  }
}