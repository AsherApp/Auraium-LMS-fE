import { useState, useEffect, useCallback } from 'react'
import { TeacherSubmissionsAPI, type TeacherSubmission, type GradeSubmissionData } from '@/services/teacher-submissions/api'

// =====================================================
// HOOKS
// =====================================================

// Hook for getting submissions for an assignment
export function useAssignmentSubmissions(assignmentId: string) {
  const [submissions, setSubmissions] = useState<TeacherSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubmissions = useCallback(async () => {
    if (!assignmentId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await TeacherSubmissionsAPI.getAssignmentSubmissions(assignmentId)
      setSubmissions(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch submissions')
    } finally {
      setLoading(false)
    }
  }, [assignmentId])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  const gradeSubmission = useCallback(async (submissionId: string, data: GradeSubmissionData) => {
    try {
      const result = await TeacherSubmissionsAPI.gradeSubmission(submissionId, data)
      // Refresh submissions after grading
      await fetchSubmissions()
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to grade submission')
      throw err
    }
  }, [fetchSubmissions])

  return {
    submissions,
    loading,
    error,
    gradeSubmission,
    refetch: fetchSubmissions
  }
}

// Hook for getting a single submission
export function useSubmission(submissionId: string) {
  const [submission, setSubmission] = useState<TeacherSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubmission = useCallback(async () => {
    if (!submissionId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await TeacherSubmissionsAPI.getSubmission(submissionId)
      setSubmission(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch submission')
    } finally {
      setLoading(false)
    }
  }, [submissionId])

  useEffect(() => {
    fetchSubmission()
  }, [fetchSubmission])

  return {
    submission,
    loading,
    error,
    refetch: fetchSubmission
  }
}
