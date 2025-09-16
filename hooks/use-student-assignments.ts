import { useState, useEffect, useCallback } from 'react'
import { StudentAssignmentsAPI, type StudentAssignment, type CreateSubmissionData } from '@/services/student-assignments/api'

// =====================================================
// HOOKS
// =====================================================

// Hook for getting all student assignments
export function useStudentAssignments() {
  const [assignments, setAssignments] = useState<StudentAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await StudentAssignmentsAPI.getStudentAssignments()
      setAssignments(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assignments')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  const submitAssignment = useCallback(async (assignmentId: string, data: CreateSubmissionData) => {
    try {
      const result = await StudentAssignmentsAPI.submitAssignment(assignmentId, data)
      // Refresh assignments after submission
      await fetchAssignments()
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to submit assignment')
      throw err
    }
  }, [fetchAssignments])

  const updateSubmission = useCallback(async (submissionId: string, data: CreateSubmissionData) => {
    try {
      const result = await StudentAssignmentsAPI.updateSubmission(submissionId, data)
      // Refresh assignments after update
      await fetchAssignments()
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to update submission')
      throw err
    }
  }, [fetchAssignments])

  return {
    assignments,
    loading,
    error,
    submitAssignment,
    updateSubmission,
    refreshAssignments: fetchAssignments
  }
}

// Hook for getting a single assignment
export function useStudentAssignment(assignmentId: string) {
  const [assignment, setAssignment] = useState<StudentAssignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssignment = useCallback(async () => {
    if (!assignmentId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await StudentAssignmentsAPI.getStudentAssignment(assignmentId)
      setAssignment(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assignment')
    } finally {
      setLoading(false)
    }
  }, [assignmentId])

  useEffect(() => {
    fetchAssignment()
  }, [fetchAssignment])

  const submitAssignment = useCallback(async (data: CreateSubmissionData) => {
    if (!assignmentId) throw new Error('Assignment ID is required')
    
    try {
      const result = await StudentAssignmentsAPI.submitAssignment(assignmentId, data)
      // Refresh assignment after submission
      await fetchAssignment()
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to submit assignment')
      throw err
    }
  }, [assignmentId, fetchAssignment])

  const updateSubmission = useCallback(async (submissionId: string, data: CreateSubmissionData) => {
    try {
      const result = await StudentAssignmentsAPI.updateSubmission(submissionId, data)
      // Refresh assignment after update
      await fetchAssignment()
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to update submission')
      throw err
    }
  }, [fetchAssignment])

  return {
    assignment,
    loading,
    error,
    submitAssignment,
    updateSubmission,
    refreshAssignment: fetchAssignment
  }
}
