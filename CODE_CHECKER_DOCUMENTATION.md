# 🚀 Code Checker Tool - Documentation

## Overview

The **Code Checker Tool** is a powerful web-based code execution and evaluation system built for professors to assess student programming assignments. It provides real-time code execution with automated test case validation, similar to LeetCode's testing system.

## 🎯 Features

### ✅ Core Features
- **Monaco Editor Integration** - Professional code editor with syntax highlighting
- **Multi-Language Support** - JavaScript, Python, C, C++, Java, TypeScript, Go, Rust, PHP, Ruby
- **Real-Time Code Execution** - Powered by Piston API for secure code execution
- **LeetCode-Style Test Cases** - Multiple test cases with input/output validation
- **Automated Evaluation** - Automatic comparison of expected vs actual output
- **Beautiful UI** - Modern, responsive design with dark mode support

### 📋 Test Case Management
- Add unlimited test cases
- Define custom input (stdin) for each test
- Set expected output for validation
- Remove individual test cases
- Visual feedback for pass/fail status

### 📊 Results Display
- Overall pass rate percentage
- Individual test case results
- Side-by-side comparison of expected vs actual output
- Error messages and stderr output
- Color-coded status indicators

## 🏗️ Architecture

### Files Created

1. **`app/professor/ai-tools/code-checker/page.tsx`**
   - Main frontend component
   - Monaco Editor integration
   - Test case management UI
   - Results visualization

2. **`app/api/professor/run-code/route.ts`**
   - API endpoint for code execution
   - Piston API integration
   - Test case processing
   - Result formatting

## 🔧 Technical Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **UI Library**: shadcn/ui components, TailwindCSS
- **Code Editor**: Monaco Editor (@monaco-editor/react)
- **Code Execution**: Piston API (https://emkc.org/api/v2/piston)
- **Icons**: Lucide React

## 📦 Installation

The Monaco Editor package has been installed:

```bash
npm install @monaco-editor/react
```

## 🚀 Usage

### Accessing the Tool

Navigate to:
```
/professor/ai-tools/code-checker
```

### Step-by-Step Guide

#### 1. Select Programming Language
- Click the language dropdown
- Choose from 10+ supported languages
- The editor will auto-populate with a "Hello World" template

#### 2. Write or Paste Code
- Use the Monaco Editor to write code
- Features include:
  - Syntax highlighting
  - Line numbers
  - Auto-completion
  - Code formatting

#### 3. Define Test Cases
- Click "Add Test Case" to create new tests
- For each test case:
  - **Input (stdin)**: Enter the input data the program will receive
  - **Expected Output**: Enter what the program should output

#### 4. Run the Code
- Click the "Run Code" button
- The system will:
  - Execute code for each test case
  - Capture output and errors
  - Compare actual vs expected output
  - Display results

#### 5. View Results
- Switch to the "Results" tab
- See:
  - Overall pass/fail summary
  - Pass rate percentage
  - Individual test results
  - Detailed comparisons
  - Any runtime errors

## 💡 Example Workflow

### Example 1: Python Sum Function

**Problem**: Write a function that adds two numbers

**Code**:
```python
a, b = map(int, input().split())
print(a + b)
```

**Test Case 1**:
- Input: `5 3`
- Expected Output: `8`

**Test Case 2**:
- Input: `10 20`
- Expected Output: `30`

**Result**: ✅ 2/2 tests passed (100%)

---

### Example 2: JavaScript Array Sum

**Problem**: Sum all numbers in an array

**Code**:
```javascript
const input = require('fs').readFileSync(0, 'utf-8').trim();
const numbers = input.split(' ').map(Number);
const sum = numbers.reduce((a, b) => a + b, 0);
console.log(sum);
```

**Test Case 1**:
- Input: `1 2 3 4 5`
- Expected Output: `15`

**Test Case 2**:
- Input: `10 20 30`
- Expected Output: `60`

---

### Example 3: C++ Fibonacci

**Problem**: Print nth Fibonacci number

**Code**:
```cpp
#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    
    int a = 0, b = 1, c;
    for(int i = 2; i <= n; i++) {
        c = a + b;
        a = b;
        b = c;
    }
    
    cout << (n == 0 ? a : b) << endl;
    return 0;
}
```

**Test Case 1**:
- Input: `5`
- Expected Output: `5`

**Test Case 2**:
- Input: `10`
- Expected Output: `55`

## 🔌 API Reference

### Endpoint: `POST /api/professor/run-code`

**Request Body**:
```typescript
{
  code: string;              // The source code to execute
  language: string;          // Programming language
  testCases: Array<{         // Array of test cases
    input: string;           // stdin input
    expectedOutput: string;  // Expected output
  }>;
  stdin?: string;            // Optional: single stdin input
}
```

**Response**:
```typescript
{
  success: boolean;
  allPassed?: boolean;       // All tests passed
  passedCount?: number;      // Number of passed tests
  totalTests?: number;       // Total number of tests
  testResults?: Array<{
    testCaseNumber: number;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    error?: string | null;
  }>;
  output?: string;           // Direct output (if no test cases)
  error?: string;            // Error message
}
```

## 🎨 Supported Languages

| Language   | File Extension | Version |
|------------|----------------|---------|
| JavaScript | .js            | Latest  |
| Python     | .py            | Latest  |
| Java       | .java          | Latest  |
| C++        | .cpp           | Latest  |
| C          | .c             | Latest  |
| TypeScript | .ts            | Latest  |
| Go         | .go            | Latest  |
| Rust       | .rs            | Latest  |
| PHP        | .php           | Latest  |
| Ruby       | .rb            | Latest  |

## 🔒 Security

- Code execution is isolated using Piston API
- No direct server execution
- Sandboxed environment
- Resource limits enforced by Piston

## 🚀 Future Enhancements

### Planned Features
- [ ] Save test cases to database (Supabase)
- [ ] Create problem templates
- [ ] Student submission tracking
- [ ] Execution time measurement
- [ ] Memory usage tracking
- [ ] Batch student code evaluation
- [ ] Export results to PDF/CSV
- [ ] Code plagiarism detection
- [ ] Syntax error highlighting
- [ ] Code complexity analysis
- [ ] Assignment creation wizard
- [ ] Student leaderboard integration

### Database Schema (Future)
```sql
-- Problems table
CREATE TABLE code_problems (
  id UUID PRIMARY KEY,
  professor_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  language TEXT,
  template_code TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Test cases table
CREATE TABLE test_cases (
  id UUID PRIMARY KEY,
  problem_id UUID REFERENCES code_problems(id),
  input TEXT,
  expected_output TEXT,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Submissions table
CREATE TABLE code_submissions (
  id UUID PRIMARY KEY,
  problem_id UUID REFERENCES code_problems(id),
  student_id UUID REFERENCES users(id),
  code TEXT,
  language TEXT,
  passed_tests INTEGER,
  total_tests INTEGER,
  execution_time FLOAT,
  submitted_at TIMESTAMP DEFAULT NOW()
);
```

## 🐛 Troubleshooting

### Common Issues

1. **Monaco Editor not loading**
   - Solution: Monaco is dynamically imported. Ensure `@monaco-editor/react` is installed
   - Run: `npm install @monaco-editor/react`

2. **Code execution timeout**
   - Solution: Piston API has execution limits. Check code for infinite loops
   - Timeout: ~3 seconds per execution

3. **Incorrect output comparison**
   - Solution: Outputs are trimmed before comparison. Ensure no extra whitespace
   - Tip: Use exact string matching

4. **Language not supported**
   - Solution: Check Piston API documentation for supported languages
   - URL: https://github.com/engineer-man/piston

5. **API rate limiting**
   - Solution: Piston API is free but rate-limited
   - Consider implementing caching or request throttling

## 📝 Code Examples

### Adding Custom Language Support

```typescript
// In app/professor/ai-tools/code-checker/page.tsx
const LANGUAGES = [
  // Add new language
  { 
    value: 'kotlin', 
    label: 'Kotlin', 
    default: 'fun main() {\n    println("Hello, World!")\n}' 
  },
  // ...
];
```

### Modifying Test Case Validation

```typescript
// In app/api/professor/run-code/route.ts
const passed = actualOutput === expectedOutput; // Exact match

// Change to case-insensitive:
const passed = actualOutput.toLowerCase() === expectedOutput.toLowerCase();

// Change to contains:
const passed = actualOutput.includes(expectedOutput);

// Change to regex:
const passed = new RegExp(expectedOutput).test(actualOutput);
```

## 📞 Support

For issues or feature requests, refer to the main project documentation or contact the development team.

## 📄 License

This feature is part of the Academic Management System project.

---

**Built with ❤️ for educators and students**

