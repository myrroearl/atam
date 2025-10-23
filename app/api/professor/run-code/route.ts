import { NextRequest, NextResponse } from 'next/server';

// Piston API endpoint
const PISTON_API = 'https://emkc.org/api/v2/piston/execute';

// Language mapping for Piston API
const languageMap: Record<string, string> = {
  javascript: 'javascript',
  python: 'python',
  java: 'java',
  cpp: 'c++',
  c: 'c',
  csharp: 'csharp',
  ruby: 'ruby',
  go: 'go',
  rust: 'rust',
  php: 'php',
  typescript: 'typescript',
};

interface TestCase {
  input: string;
  expectedOutput: string;
}

interface RunCodeRequest {
  code: string;
  language: string;
  testCases: TestCase[];
  stdin?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RunCodeRequest = await request.json();
    const { code, language, testCases, stdin } = body;

    // Validate required fields
    if (!code || !language) {
      return NextResponse.json(
        { error: 'Code and language are required' },
        { status: 400 }
      );
    }

    // Map language to Piston format
    const pistonLanguage = languageMap[language.toLowerCase()];
    if (!pistonLanguage) {
      return NextResponse.json(
        { error: `Unsupported language: ${language}` },
        { status: 400 }
      );
    }

    // If no test cases, run once with optional stdin
    if (!testCases || testCases.length === 0) {
      const response = await fetch(PISTON_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: pistonLanguage,
          version: '*',
          files: [
            {
              name: getFileName(pistonLanguage),
              content: code,
            },
          ],
          stdin: stdin || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute code');
      }

      const result = await response.json();

      return NextResponse.json({
        success: true,
        output: result.run.stdout || result.run.stderr || '',
        error: result.run.stderr || null,
        executionTime: result.run.output ? 'N/A' : 'N/A',
        testResults: [],
      });
    }

    // Run code for each test case
    const testResults = [];
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];

      const response = await fetch(PISTON_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: pistonLanguage,
          version: '*',
          files: [
            {
              name: getFileName(pistonLanguage),
              content: code,
            },
          ],
          stdin: testCase.input || '',
        }),
      });

      if (!response.ok) {
        testResults.push({
          testCaseNumber: i + 1,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          passed: false,
          error: 'Failed to execute code',
        });
        continue;
      }

      const result = await response.json();
      const actualOutput = (result.run.stdout || '').trim();
      const expectedOutput = testCase.expectedOutput.trim();
      const passed = actualOutput === expectedOutput;
      const error = result.run.stderr || null;

      testResults.push({
        testCaseNumber: i + 1,
        input: testCase.input,
        expectedOutput: expectedOutput,
        actualOutput: actualOutput,
        passed: passed,
        error: error,
      });
    }

    const allPassed = testResults.every((result) => result.passed);
    const passedCount = testResults.filter((result) => result.passed).length;

    return NextResponse.json({
      success: true,
      allPassed,
      passedCount,
      totalTests: testCases.length,
      testResults,
    });
  } catch (error) {
    console.error('Error executing code:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

function getFileName(language: string): string {
  const fileNames: Record<string, string> = {
    javascript: 'main.js',
    python: 'main.py',
    java: 'Main.java',
    'c++': 'main.cpp',
    c: 'main.c',
    csharp: 'Main.cs',
    ruby: 'main.rb',
    go: 'main.go',
    rust: 'main.rs',
    php: 'main.php',
    typescript: 'main.ts',
  };
  return fileNames[language] || 'main.txt';
}

