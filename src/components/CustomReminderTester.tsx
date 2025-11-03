import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { customReminderService, CustomReminder } from '../services/customReminderService'
import { useToast } from './ui/toast'
import { TestTube, CheckCircle, AlertTriangle, Bell } from 'lucide-react'

interface TestResult {
    test: string
    success: boolean
    data?: any
    error?: string
    timestamp: string
}

export const CustomReminderTester: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [testResults, setTestResults] = useState<TestResult[]>([])
    const [reminders, setReminders] = useState<CustomReminder[]>([])
    const { addToast } = useToast()

    const addTestResult = (test: string, success: boolean, data?: any, error?: string) => {
        const result: TestResult = {
            test,
            success,
            data,
            error,
            timestamp: new Date().toLocaleTimeString()
        }
        setTestResults(prev => [result, ...prev.slice(0, 9)]) // Keep last 10 results
    }

    const testGetAllReminders = async () => {
        try {
            setIsLoading(true)
            const allReminders = await customReminderService.getAllReminders()
            setReminders(allReminders)
            addTestResult('Get All Reminders', true, { count: allReminders.length, reminders: allReminders })
            addToast({
                type: 'success',
                title: 'Test Passed',
                description: `Found ${allReminders.length} custom reminders`,
                duration: 3000
            })
        } catch (error: any) {
            addTestResult('Get All Reminders', false, null, error.message)
            addToast({
                type: 'error',
                title: 'Test Failed',
                description: error.message,
                duration: 4000
            })
        } finally {
            setIsLoading(false)
        }
    }

    const testCreateReminder = async () => {
        try {
            setIsLoading(true)
            const testReminder = {
                title: 'Test Reminder',
                time: '09:00',
                frequency: 'daily',
                isActive: true,
                notes: 'Created by test component'
            }

            const created = await customReminderService.createReminder(testReminder)
            addTestResult('Create Reminder', true, { reminder: created })
            addToast({
                type: 'success',
                title: 'Reminder Created',
                description: `Created test reminder: ${created.title}`,
                duration: 3000
            })

            // Refresh the list
            await testGetAllReminders()
        } catch (error: any) {
            addTestResult('Create Reminder', false, null, error.message)
            addToast({
                type: 'error',
                title: 'Creation Failed',
                description: error.message,
                duration: 4000
            })
        } finally {
            setIsLoading(false)
        }
    }

    const clearResults = () => {
        setTestResults([])
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TestTube className="w-5 h-5 text-blue-600" />
                        Custom Reminder Service Tester
                    </CardTitle>
                    <CardDescription>
                        Test the custom reminder service functionality
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Test Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Button
                            onClick={testGetAllReminders}
                            disabled={isLoading}
                            className="flex items-center gap-2"
                        >
                            <Bell className="w-4 h-4" />
                            Get All Reminders
                        </Button>

                        <Button
                            onClick={testCreateReminder}
                            disabled={isLoading}
                            className="flex items-center gap-2"
                        >
                            <TestTube className="w-4 h-4" />
                            Create Test Reminder
                        </Button>

                        {testResults.length > 0 && (
                            <Button
                                variant="outline"
                                onClick={clearResults}
                                className="flex items-center gap-2"
                            >
                                Clear Results
                            </Button>
                        )}
                    </div>

                    {/* Current Reminders Display */}
                    {reminders.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Current Reminders ({reminders.length})</h3>
                            <div className="space-y-2">
                                {reminders.slice(0, 5).map((reminder) => (
                                    <div key={reminder.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                        <div>
                                            <span className="font-medium">{reminder.title}</span>
                                            <span className="text-sm text-muted-foreground ml-2">at {reminder.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={reminder.isActive ? 'success' : 'secondary'}>
                                                {reminder.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                            <Badge variant="outline">{reminder.frequency}</Badge>
                                        </div>
                                    </div>
                                ))}
                                {reminders.length > 5 && (
                                    <p className="text-sm text-muted-foreground">... and {reminders.length - 5} more</p>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Test Results */}
            {testResults.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Test Results</h3>
                    {testResults.map((result, index) => (
                        <Card key={index} className={`border-l-4 ${result.success ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'
                            }`}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {result.success ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <AlertTriangle className="w-5 h-5 text-red-600" />
                                        )}
                                        <h4 className="font-medium">{result.test}</h4>
                                        <Badge variant={result.success ? 'success' : 'destructive'}>
                                            {result.success ? 'PASS' : 'FAIL'}
                                        </Badge>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{result.timestamp}</span>
                                </div>

                                {result.error && (
                                    <p className="text-sm text-red-600 mb-2">Error: {result.error}</p>
                                )}

                                {result.data && (
                                    <details className="text-sm">
                                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                            View Response Data
                                        </summary>
                                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                                            {JSON.stringify(result.data, null, 2)}
                                        </pre>
                                    </details>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

export default CustomReminderTester