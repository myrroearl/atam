# 🚀 Code Checker Tool - Quick Start Guide

## 🎯 What Was Built

A complete **Code Execution and Evaluation System** for professors to check student programming assignments with:

- ✅ **Monaco Editor** integration with syntax highlighting
- ✅ **10+ Programming Languages** (JavaScript, Python, C, C++, Java, TypeScript, Go, Rust, PHP, Ruby)
- ✅ **LeetCode-style Test Cases** with input/output validation
- ✅ **Real-time Code Execution** via Piston API
- ✅ **Automated Evaluation** with pass/fail indicators
- ✅ **Modern UI** with dark mode support

## 📂 Files Created

### 1. Frontend Page
**`app/professor/ai-tools/code-checker/page.tsx`**
- Main code checker interface
- Monaco Editor integration
- Test case management
- Results visualization

### 2. API Route
**`app/api/professor/run-code/route.ts`**
- Code execution endpoint
- Piston API integration
- Test case processing
- Result formatting

### 3. Documentation
**`CODE_CHECKER_DOCUMENTATION.md`**
- Complete technical documentation
- Usage examples
- API reference
- Future enhancements roadmap

## 🔗 Access the Tool

Navigate to:
```
http://localhost:3000/professor/ai-tools/code-checker
```

Or click **"Check Programming Code"** from the AI Tools dashboard.

## 🎮 Quick Usage

### Basic Flow:

1. **Select Language** → Choose from dropdown (e.g., Python)
2. **Write Code** → Use Monaco Editor
3. **Add Test Cases** → Define input & expected output
4. **Run Code** → Click "Run Code" button
5. **View Results** → See pass/fail status for each test

### Example Test Case:

**Language:** Python

**Code:**
```python
a, b = map(int, input().split())
print(a + b)
```

**Test Case 1:**
- Input: `5 3`
- Expected Output: `8`

**Result:** ✅ Test Passed!

## 🧰 Technical Stack

- **Next.js 15** (App Router)
- **Monaco Editor** (@monaco-editor/react) ← Installed ✅
- **TailwindCSS** + shadcn/ui
- **Piston API** (Free code execution)
- **TypeScript**

## 📦 Installation Completed

```bash
✅ npm install @monaco-editor/react
```

The Monaco Editor package has been successfully installed.

## 🎨 Features Highlight

### Multi-Language Support
- JavaScript, Python, Java, C++, C, TypeScript
- Go, Rust, PHP, Ruby
- Auto syntax highlighting
- Language-specific templates

### Test Case System
- Unlimited test cases
- Custom stdin input
- Expected output validation
- Individual test results
- Pass/fail indicators

### Results Display
- Overall pass percentage
- Side-by-side output comparison
- Error messages display
- Color-coded status
- Detailed test breakdowns

## 🛠️ How It Works

1. **User writes code** in Monaco Editor
2. **Defines test cases** with input/expected output
3. **Clicks "Run Code"**
4. **Frontend sends** code + language + test cases to API
5. **API calls Piston** for each test case
6. **Compares outputs** (actual vs expected)
7. **Returns results** with pass/fail status
8. **UI displays** results with visual feedback

## 🔐 Security

- Code executes in **sandboxed environment** (Piston API)
- **No direct server execution**
- **Rate limits** enforced by Piston
- **Timeout protection** (~3 seconds)

## 🎯 Key Features

✅ **Real-time Execution** - No database required, instant results
✅ **Professional Editor** - Monaco (same as VS Code)
✅ **LeetCode-Style** - Multiple test cases with auto-grading
✅ **Multi-Language** - 10+ programming languages
✅ **Responsive Design** - Works on all devices
✅ **Dark Mode** - Theme support included

## 🧪 Test the Implementation

### Test 1: JavaScript Hello World
```javascript
console.log("Hello World")
```
- Expected Output: `Hello World`

### Test 2: Python Addition
```python
a, b = map(int, input().split())
print(a + b)
```
- Input: `10 20`
- Expected Output: `30`

### Test 3: C++ Fibonacci
```cpp
#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    cout << n * 2 << endl;
    return 0;
}
```
- Input: `5`
- Expected Output: `10`

## 🚀 Next Steps (Optional)

If you want to extend this tool:

1. **Database Integration**
   - Save problems to Supabase
   - Track student submissions
   - Store test cases

2. **Additional Features**
   - Code templates library
   - Execution time tracking
   - Memory usage stats
   - Plagiarism detection
   - Batch evaluation

3. **Student Portal**
   - Student-facing submission page
   - Assignment history
   - Personal statistics
   - Leaderboard integration

## 📝 Important Notes

- **Piston API** is free but rate-limited
- **Timeouts** occur after ~3 seconds
- **Output comparison** is exact match (case-sensitive, whitespace-sensitive)
- **No AI integration** - this is pure code execution, not AI-based analysis

## 🐛 Troubleshooting

### Monaco Editor not loading?
```bash
npm install @monaco-editor/react
```

### Code not executing?
- Check Piston API status: https://emkc.org/api/v2/piston
- Verify language is supported
- Check for syntax errors in code

### Test cases not matching?
- Ensure exact output match (including whitespace)
- Check for trailing newlines
- Verify input format

## 📞 Support

- Full documentation: `CODE_CHECKER_DOCUMENTATION.md`
- API details: `/app/api/professor/run-code/route.ts`
- Frontend code: `/app/professor/ai-tools/code-checker/page.tsx`

---

**✨ Ready to use! Navigate to `/professor/ai-tools/code-checker` and start checking code!**

