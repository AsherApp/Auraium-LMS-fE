import { useState, useEffect, useCallback } from 'react'
import { AssignmentAPI, getMyAssignments, type Assignment, type Submission, type CreateAssignmentData, type UpdateAssignmentData, type CreateSubmissionData, type UpdateSubmissionData, type GradeSubmissionData } from './api'
import { http } from '../http'

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  }
}

// =====================================================
// ASSIGNMENT HOOKS
// =====================================================

// Hook for getting all assignments (teacher)
export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await AssignmentAPI.getAssignments()
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

  const createAssignment = useCallback(async (data: CreateAssignmentData) => {
    // Optimistic update - add assignment immediately
    const tempId = `temp_${Date.now()}`
    const optimisticAssignment: Assignment = {
      id: tempId,
      title: data.title,
      description: data.description || '',
      type: data.type,
      due_at: data.due_at,
      points: data.points || 0,
      course_id: data.course_id,
      module_id: data.module_id,
      lesson_id: data.lesson_id,
      settings: data.settings || {},
      is_published: data.is_published || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      course: data.course || null,
      student_submission: null,
      is_available: true,
      is_overdue: false,
      submission_count: 0,
      graded_count: 0
    }
    
    setAssignments(prev => [optimisticAssignment, ...prev])
    
    try {
      const newAssignment = await AssignmentAPI.createAssignment(data)
      // Replace optimistic assignment with real one
      setAssignments(prev => prev.map(a => a.id === tempId ? newAssignment : a))
      return newAssignment
    } catch (err: any) {
      // Revert optimistic update on error
      setAssignments(prev => prev.filter(a => a.id !== tempId))
      setError(err.message || 'Failed to create assignment')
      throw err
    }
  }, [])

  const updateAssignment = useCallback(async (id: string, data: UpdateAssignmentData) => {
    // Store original assignment for rollback
    const originalAssignment = assignments.find(a => a.id === id)
    if (!originalAssignment) throw new Error('Assignment not found')
    
    // Optimistic update
    const optimisticAssignment = { ...originalAssignment, ...data, updated_at: new Date().toISOString() }
    setAssignments(prev => prev.map(a => a.id === id ? optimisticAssignment : a))
    
    try {
      const updatedAssignment = await AssignmentAPI.updateAssignment(id, data)
      setAssignments(prev => prev.map(a => a.id === id ? updatedAssignment : a))
      return updatedAssignment
    } catch (err: any) {
      // Revert optimistic update on error
      setAssignments(prev => prev.map(a => a.id === id ? originalAssignment : a))
      setError(err.message || 'Failed to update assignment')
      throw err
    }
  }, [assignments])

  const deleteAssignment = useCallback(async (id: string) => {
    // Store original assignment for rollback
    const originalAssignment = assignments.find(a => a.id === id)
    if (!originalAssignment) throw new Error('Assignment not found')
    
    // Optimistic update - remove immediately
    setAssignments(prev => prev.filter(a => a.id !== id))
    
    try {
      await AssignmentAPI.deleteAssignment(id)
      return true
    } catch (err: any) {
      // Revert optimistic update on error
      setAssignments(prev => [originalAssignment, ...prev])
      setError(err.message || 'Failed to delete assignment')
      throw err
    }
  }, [assignments])

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment
  }
}

// Hook for getting course assignments (student)
export function useCourseAssignments(courseId: string) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCourseAssignments = useCallback(async () => {
    if (!courseId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await AssignmentAPI.getCourseAssignments(courseId)
      setAssignments(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch course assignments')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchCourseAssignments()
  }, [fetchCourseAssignments])

  return {
    assignments,
    loading,
    error,
    refetch: fetchCourseAssignments
  }
}

// Hook for getting single assignment
export function useAssignment(assignmentId: string) {
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssignment = useCallback(async () => {
    if (!assignmentId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await AssignmentAPI.getAssignment(assignmentId)
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

  return {
    assignment,
    loading,
    error,
    refetch: fetchAssignment
  }
}

// =====================================================
// SUBMISSION HOOKS
// =====================================================

// Hook for getting assignment submissions (teacher)
export function useAssignmentSubmissions(assignmentId: string) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubmissions = useCallback(async () => {
    if (!assignmentId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await AssignmentAPI.getAssignmentSubmissions(assignmentId)
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

  return {
    submissions,
    loading,
    error,
    refetch: fetchSubmissions
  }
}

// Hook for getting single submission
export function useSubmission(submissionId: string) {
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubmission = useCallback(async () => {
    if (!submissionId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await AssignmentAPI.getSubmission(submissionId)
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

// Hook for submission management
export function useSubmissionManagement() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createSubmission = useCallback(async (data: CreateSubmissionData) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await AssignmentAPI.createSubmission(data)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to create submission')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSubmission = useCallback(async (submissionId: string, data: UpdateSubmissionData) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await AssignmentAPI.updateSubmission(submissionId, data)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to update submission')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const gradeSubmission = useCallback(async (submissionId: string, data: GradeSubmissionData) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await AssignmentAPI.gradeSubmission(submissionId, data)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to grade submission')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteSubmission = useCallback(async (submissionId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await AssignmentAPI.deleteSubmission(submissionId)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to delete submission')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    createSubmission,
    updateSubmission,
    gradeSubmission,
    deleteSubmission
  }
}

// =====================================================
// CONVENIENCE HOOKS
// =====================================================

// Hook for getting student's submission for an assignment
export function useMySubmission(assignmentId: string) {
  const { assignment, loading, error, refetch } = useAssignment(assignmentId)
  
  return {
    submission: assignment?.student_submission || null,
    loading,
    error,
    refetch
  }
}

// Hook for getting all student assignments (from all enrolled courses)
export function useMyAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMyAssignments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getMyAssignments()
      setAssignments(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch my assignments')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMyAssignments()
  }, [fetchMyAssignments])

  return {
    assignments,
    loading,
    error,
    refetch: fetchMyAssignments
  }
}

// Hook for getting grading stats (teacher)
export function useGradingStats(assignmentId: string) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGradingStats = useCallback(async () => {
    if (!assignmentId) return
    
    try {
      setLoading(true)
      setError(null)
      const response = await http<any>(`/api/assignments/${assignmentId}/grading-stats`, {
        headers: getAuthHeaders()
      })
      setStats(response)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch grading stats')
    } finally {
      setLoading(false)
    }
  }, [assignmentId])

  useEffect(() => {
    fetchGradingStats()
  }, [fetchGradingStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchGradingStats
  }
}