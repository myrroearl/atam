"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ScheduleTest() {
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testScheduleAPI = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/professor/schedule')
      const data = await response.json()
      setTestResult(data)
      console.log("Test result:", data)
    } catch (error) {
      console.error("Test error:", error)
      setTestResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Schedule API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testScheduleAPI} disabled={isLoading}>
            {isLoading ? "Testing..." : "Test Schedule API"}
          </Button>
          
          {testResult && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">API Response:</h3>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
