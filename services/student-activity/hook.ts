import { useState, useEffect, useCallback } from 'react'
import { StudentActivityAPI, StudentActivity, ActivitySummary } from './api'

export function useStudentActivity(studentId?: string) {
  const [activities, setActivities] = useState<StudentActivity[]>([])
  const [summary, setSummary] = useState<ActivitySummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = useCallback(async (options?: {
    limit?: number
    offset?: number
    activity_type?: string
  }) => {
    if (!studentId) return

    try {
      setLoading(true)
      setError(null)
      const response = await StudentActivityAPI.getStudentActivities(studentId, options)
      setActivities(response.items)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activities')
      console.error('Error fetching activities:', err)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  const fetchSummary = useCallback(async () => {
    if (!studentId) return

    try {
      const response = await StudentActivityAPI.getStudentActivitySummary(studentId)
      setSummary(response)
    } catch (err: any) {
      console.error('Error fetching activity summary:', err)
    }
  }, [studentId])

  const logActivity = useCallback(async (data: {
    activity_type: string
    activity_data?: Record<string, any>
    course_id?: string
    lesson_id?: string
    assignment_id?: string
  }) => {
    if (!studentId) return

    try {
      await StudentActivityAPI.logActivity({
        student_id: studentId,
        ...data
      })
      
      // Refresh activities after logging
      fetchActivities()
      fetchSummary()
    } catch (err: any) {
      console.error('Error logging activity:', err)
      throw err
    }
  }, [studentId, fetchActivities, fetchSummary])

  useEffect(() => {
    if (studentId) {
      fetchActivities()
      fetchSummary()
    }
  }, [studentId, fetchActivities, fetchSummary])

  return {
    activities,
    summary,
    loading,
    error,
    fetchActivities,
    fetchSummary,
    logActivity,
    // Helper methods for common activities
    logCourseActivity: useCallback((activityType: string, courseId: string, additionalData?: Record<string, any>) => 
      logActivity({ activity_type: activityType, course_id: courseId, activity_data: additionalData }), [logActivity]),
    logLessonActivity: useCallback((activityType: string, courseId: string, lessonId: string, additionalData?: Record<string, any>) => 
      logActivity({ activity_type: activityType, course_id: courseId, lesson_id: lessonId, activity_data: additionalData }), [logActivity]),
    logAssignmentActivity: useCallback((activityType: string, courseId: string, assignmentId: string, additionalData?: Record<string, any>) => 
      logActivity({ activity_type: activityType, course_id: courseId, assignment_id: assignmentId, activity_data: additionalData }), [logActivity])
  }
}

export function useStudentActivitiesOverview() {
  const [activities, setActivities] = useState<StudentActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await StudentActivityAPI.getActivitiesOverview()
      setActivities(response.items)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activities overview')
      console.error('Error fetching activities overview:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  return {
    activities,
    loading,
    error,
    fetchOverview
  }
}
