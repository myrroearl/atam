import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Google AI API key
const API_KEY = 'AIzaSyDSnDgk8LUcsArTuJ_7uwHWCUlrYqH1vmM';
const genAI = new GoogleGenerativeAI(API_KEY);

// Google Apps Script Web App URL
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxWD1sG0zQ1DA9_srBN88YApyoJrT7LmhUQqpyHZkP9nUc2ZqXj0PWr5E5tnc62o6TP/exec';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { prompt, numQuestions, difficulty } = body;
    
    // Validate input
    if (!prompt || !numQuestions || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt, numQuestions, or difficulty' },
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

    // Call Gemini API to generate quiz questions
    const questions = await generateQuizQuestions(prompt, numQuestions, difficulty);
    
    // Create Google Form using the Google Apps Script Web App
    const formResponse = await createGoogleForm(prompt, questions);
    
    // Return the form link and questions
    return NextResponse.json({ 
      link: formResponse.link,
      editLink: formResponse.editLink,
      questions: questions 
    });
    
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}

async function generateQuizQuestions(prompt: string, numQuestions: number, difficulty: string) {
  try {
    // Construct the prompt for Gemini
    const geminiPrompt = `
      Create a quiz with ${numQuestions} questions about: ${prompt}.
      Difficulty level: ${difficulty}.
      
      Include a mix of question types:
      - Multiple choice questions (with 4 options)
      - True/False questions
      - Short answer questions
      
      Format the response as a valid JSON array with the following structure for each question type:
      
      For multiple choice:
      { "type": "multiple_choice", "question": "Question text?", "choices": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"], "answer": "A", "points": 1 }
      
      For true/false:
      { "type": "true_false", "question": "Statement to evaluate.", "answer": "True", "points": 1 }
      
      For short answer:
      { "type": "short_answer", "question": "Question requiring a short response?", "answer": "Sample answer", "points": 2 }
      
      Assign points based on difficulty: easy questions = 1 point, medium = 2 points, hard = 3 points.
      
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

async function createGoogleForm(title: string, questions: any[]) {
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