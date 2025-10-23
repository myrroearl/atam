'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Code2,
  Terminal,
  TestTube,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px] bg-muted rounded-md">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

interface TestResult {
  testCaseNumber: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  error?: string | null;
}

interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string | null;
  allPassed?: boolean;
  passedCount?: number;
  totalTests?: number;
  testResults?: TestResult[];
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', default: 'console.log("Hello, World!");' },
  { value: 'python', label: 'Python', default: 'print("Hello, World!")' },
  { value: 'java', label: 'Java', default: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}' },
  { value: 'cpp', label: 'C++', default: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}' },
  { value: 'c', label: 'C', default: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}' },
  { value: 'typescript', label: 'TypeScript', default: 'console.log("Hello, World!");' },
  { value: 'go', label: 'Go', default: 'package main\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}' },
  { value: 'rust', label: 'Rust', default: 'fn main() {\n    println!("Hello, World!");\n}' },
  { value: 'php', label: 'PHP', default: '<?php\necho "Hello, World!";\n?>' },
  { value: 'ruby', label: 'Ruby', default: 'puts "Hello, World!"' },
];

export default function CodeCheckerPage() {
  const [code, setCode] = useState<string>(LANGUAGES[0].default);
  const [language, setLanguage] = useState<string>(LANGUAGES[0].value);
  const [testCases, setTestCases] = useState<TestCase[]>([
    { id: '1', input: '', expectedOutput: '' },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>('testcases');

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    const selectedLang = LANGUAGES.find((lang) => lang.value === value);
    if (selectedLang) {
      setCode(selectedLang.default);
    }
  };

  const addTestCase = () => {
    const newId = (testCases.length + 1).toString();
    setTestCases([...testCases, { id: newId, input: '', expectedOutput: '' }]);
  };

  const removeTestCase = (id: string) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((tc) => tc.id !== id));
    } else {
      toast.error('You must have at least one test case');
    }
  };

  const updateTestCase = (id: string, field: 'input' | 'expectedOutput', value: string) => {
    setTestCases(
      testCases.map((tc) => (tc.id === id ? { ...tc, [field]: value } : tc))
    );
  };

  const runCode = async () => {
    setIsRunning(true);
    setExecutionResult(null);

    try {
      const response = await fetch('/api/professor/run-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          testCases: testCases.map((tc) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
          })),
        }),
      });

      const result: ExecutionResult = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Failed to execute code');
        setExecutionResult({ success: false, error: result.error });
        return;
      }

      setExecutionResult(result);
      setActiveTab('results');

      if (result.allPassed) {
        toast.success(`All ${result.totalTests} test cases passed! ✅`);
      } else {
        toast.warning(`${result.passedCount}/${result.totalTests} test cases passed`);
      }
    } catch (error) {
      console.error('Error running code:', error);
      toast.error('Failed to execute code. Please try again.');
      setExecutionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/professor/ai-tools">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Code2 className="h-8 w-8" />
              Code Checker Tool
            </h1>
            <p className="text-muted-foreground mt-1">
              Execute and evaluate student code with automated test cases
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm">
          Powered by Atam AI
        </Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Side - Code Editor */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Code Editor
            </CardTitle>
            <CardDescription>Write or paste student code to evaluate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Language Selector */}
            <div className="space-y-2">
              <Label htmlFor="language">Programming Language</Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Monaco Editor */}
            <div className="space-y-2">
              <Label>Code</Label>
              <div className="border rounded-md overflow-hidden">
                <MonacoEditor
                  height="500px"
                  language={language === 'cpp' ? 'cpp' : language}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                  }}
                />
              </div>
            </div>

            {/* Run Button */}
            <Button
              onClick={runCode}
              disabled={isRunning || !code.trim()}
              className="w-full"
              size="lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Code...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Code
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right Side - Test Cases & Results */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Cases & Results
            </CardTitle>
            <CardDescription>
              Define test cases and view execution results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="testcases">Test Cases</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
              </TabsList>

              {/* Test Cases Tab */}
              <TabsContent value="testcases" className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base">Test Cases ({testCases.length})</Label>
                  <Button onClick={addTestCase} size="sm" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Test Case
                  </Button>
                </div>

                <ScrollArea className="h-[520px] pr-4">
                  <div className="space-y-4">
                    {testCases.map((testCase, index) => (
                      <Card key={testCase.id} className="p-4">
                        <div className="flex justify-between items-center mb-3">
                          <Label className="font-semibold">Test Case {index + 1}</Label>
                          <Button
                            onClick={() => removeTestCase(testCase.id)}
                            size="sm"
                            variant="ghost"
                            disabled={testCases.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`input-${testCase.id}`} className="text-sm">
                              Input (stdin)
                            </Label>
                            <Textarea
                              id={`input-${testCase.id}`}
                              placeholder="Enter input for this test case..."
                              value={testCase.input}
                              onChange={(e) =>
                                updateTestCase(testCase.id, 'input', e.target.value)
                              }
                              className="mt-1 font-mono text-sm"
                              rows={3}
                            />
                          </div>

                          <div>
                            <Label htmlFor={`output-${testCase.id}`} className="text-sm">
                              Expected Output
                            </Label>
                            <Textarea
                              id={`output-${testCase.id}`}
                              placeholder="Enter expected output..."
                              value={testCase.expectedOutput}
                              onChange={(e) =>
                                updateTestCase(testCase.id, 'expectedOutput', e.target.value)
                              }
                              className="mt-1 font-mono text-sm"
                              rows={3}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Results Tab */}
              <TabsContent value="results" className="mt-4">
                {!executionResult ? (
                  <div className="flex flex-col items-center justify-center h-[520px] text-center">
                    <Terminal className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Run your code to see the execution results and test case evaluations
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[520px] pr-4">
                    <div className="space-y-4">
                      {/* Overall Result */}
                      {executionResult.success && executionResult.testResults && (
                        <Card
                          className={`p-4 ${
                            executionResult.allPassed
                              ? 'border-green-500 bg-green-50 dark:bg-green-950'
                              : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {executionResult.allPassed ? (
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                              ) : (
                                <XCircle className="h-6 w-6 text-yellow-600" />
                              )}
                              <div>
                                <p className="font-semibold">
                                  {executionResult.allPassed
                                    ? 'All Tests Passed!'
                                    : 'Some Tests Failed'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {executionResult.passedCount} / {executionResult.totalTests} test
                                  cases passed
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={executionResult.allPassed ? 'default' : 'secondary'}
                              className="text-lg px-3 py-1"
                            >
                              {Math.round(
                                ((executionResult.passedCount || 0) /
                                  (executionResult.totalTests || 1)) *
                                  100
                              )}
                              %
                            </Badge>
                          </div>
                        </Card>
                      )}

                      {/* Error Display */}
                      {!executionResult.success && executionResult.error && (
                        <Card className="p-4 border-destructive bg-destructive/10">
                          <div className="flex items-start gap-2">
                            <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                            <div>
                              <p className="font-semibold text-destructive">Execution Error</p>
                              <pre className="text-sm mt-2 text-destructive/90 whitespace-pre-wrap font-mono">
                                {executionResult.error}
                              </pre>
                            </div>
                          </div>
                        </Card>
                      )}

                      {/* Individual Test Results */}
                      {executionResult.testResults &&
                        executionResult.testResults.map((result) => (
                          <Card key={result.testCaseNumber} className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {result.passed ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-destructive" />
                                )}
                                <Label className="font-semibold">
                                  Test Case {result.testCaseNumber}
                                </Label>
                              </div>
                              <Badge variant={result.passed ? 'default' : 'destructive'}>
                                {result.passed ? 'Passed' : 'Failed'}
                              </Badge>
                            </div>

                            <div className="space-y-3">
                              {result.input && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">Input</Label>
                                  <pre className="mt-1 p-2 bg-muted rounded text-sm font-mono">
                                    {result.input || '(empty)'}
                                  </pre>
                                </div>
                              )}

                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Expected Output
                                </Label>
                                <pre className="mt-1 p-2 bg-muted rounded text-sm font-mono">
                                  {result.expectedOutput || '(empty)'}
                                </pre>
                              </div>

                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Actual Output
                                </Label>
                                <pre
                                  className={`mt-1 p-2 rounded text-sm font-mono ${
                                    result.passed ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'
                                  }`}
                                >
                                  {result.actualOutput || '(empty)'}
                                </pre>
                              </div>

                              {result.error && (
                                <div>
                                  <Label className="text-xs text-destructive">Error</Label>
                                  <pre className="mt-1 p-2 bg-destructive/10 rounded text-sm font-mono text-destructive">
                                    {result.error}
                                  </pre>
                                </div>
                              )}
                            </div>

                            {result.testCaseNumber < executionResult.testResults!.length && (
                              <Separator className="mt-4" />
                            )}
                          </Card>
                        ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

