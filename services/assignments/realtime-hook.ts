import { useState, useEffect, useCallback } from 'react'
import { AssignmentAPI, getMyAssignments, type Assignment, type Submission, type CreateAssignmentData, type UpdateAssignmentData, type CreateSubmissionData, type UpdateSubmissionData, type GradeSubmissionData } from './api'
import { useToast } from '@/hooks/use-toast'

// Enhanced hook with optimistic updates and real-time feedback
export function useRealtimeAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  // Temporarily disabled global sync to prevent infinite loops
  // const addAssignmentUpdate = useSyncActions().addAssignmentUpdate

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
      setAssignments(prev => prev.map(a => a.id === tempId ? newAssignment : a))
      
      // Notify other components of the update
      // addAssignmentUpdate(newAssignment.id, 'created', newAssignment)
      
      toast({
        title: "Assignment Created",
        description: `${newAssignment.title} has been created successfully`,
        duration: 3000,
      })
      
      return newAssignment
    } catch (err: any) {
      setAssignments(prev => prev.filter(a => a.id !== tempId))
      setError(err.message || 'Failed to create assignment')
      
      toast({
        title: "Error",
        description: "Failed to create assignment",
        variant: "destructive",
        duration: 3000,
      })
      
      throw err
    }
  }, [toast])

  const updateAssignment = useCallback(async (id: string, data: UpdateAssignmentData) => {
    const originalAssignment = assignments.find(a => a.id === id)
    if (!originalAssignment) throw new Error('Assignment not found')
    
    const optimisticAssignment = { ...originalAssignment, ...data, updated_at: new Date().toISOString() }
    setAssignments(prev => prev.map(a => a.id === id ? optimisticAssignment : a))
    
    try {
      const updatedAssignment = await AssignmentAPI.updateAssignment(id, data)
      setAssignments(prev => prev.map(a => a.id === id ? updatedAssignment : a))
      
      // Notify other components of the update
      // addAssignmentUpdate(updatedAssignment.id, 'updated', updatedAssignment)
      
      toast({
        title: "Assignment Updated",
        description: `${updatedAssignment.title} has been updated successfully`,
        duration: 3000,
      })
      
      return updatedAssignment
    } catch (err: any) {
      setAssignments(prev => prev.map(a => a.id === id ? originalAssignment : a))
      setError(err.message || 'Failed to update assignment')
      
      toast({
        title: "Error",
        description: "Failed to update assignment",
        variant: "destructive",
        duration: 3000,
      })
      
      throw err
    }
  }, [assignments, toast])

  const deleteAssignment = useCallback(async (id: string) => {
    const originalAssignment = assignments.find(a => a.id === id)
    if (!originalAssignment) throw new Error('Assignment not found')
    
    setAssignments(prev => prev.filter(a => a.id !== id))
    
    try {
      await AssignmentAPI.deleteAssignment(id)
      
      // Notify other components of the update
      // addAssignmentUpdate(id, 'deleted', originalAssignment)
      
      toast({
        title: "Assignment Deleted",
        description: `${originalAssignment.title} has been deleted successfully`,
        duration: 3000,
      })
      
      return true
    } catch (err: any) {
      setAssignments(prev => [originalAssignment, ...prev])
      setError(err.message || 'Failed to delete assignment')
      
      toast({
        title: "Error",
        description: "Failed to delete assignment",
        variant: "destructive",
        duration: 3000,
      })
      
      throw err
    }
  }, [assignments, toast])

  return {
    assignments,
    loading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    refetch: fetchAssignments
  }
}

// Enhanced submission hook with optimistic updates
export function useRealtimeSubmissions(assignmentId: string) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchSubmissions = useCallback(async () => {
    if (!assignmentId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await AssignmentAPI.getSubmissions(assignmentId)
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

  const createSubmission = useCallback(async (data: CreateSubmissionData) => {
    try {
      const result = await AssignmentAPI.createSubmission(data)
      
      // Add to submissions list immediately
      setSubmissions(prev => [result, ...prev])
      
      toast({
        title: "Submission Created",
        description: "Your submission has been saved successfully",
        duration: 3000,
      })
      
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to create submission')
      
      toast({
        title: "Error",
        description: "Failed to save submission",
        variant: "destructive",
        duration: 3000,
      })
      
      throw err
    }
  }, [toast])

  const updateSubmission = useCallback(async (submissionId: string, data: UpdateSubmissionData) => {
    const originalSubmission = submissions.find(s => s.id === submissionId)
    if (!originalSubmission) throw new Error('Submission not found')
    
    const optimisticSubmission = { ...originalSubmission, ...data, updated_at: new Date().toISOString() }
    setSubmissions(prev => prev.map(s => s.id === submissionId ? optimisticSubmission : s))
    
    try {
      const result = await AssignmentAPI.updateSubmission(submissionId, data)
      setSubmissions(prev => prev.map(s => s.id === submissionId ? result : s))
      
      toast({
        title: "Submission Updated",
        description: "Your submission has been updated successfully",
        duration: 3000,
      })
      
      return result
    } catch (err: any) {
      setSubmissions(prev => prev.map(s => s.id === submissionId ? originalSubmission : s))
      setError(err.message || 'Failed to update submission')
      
      toast({
        title: "Error",
        description: "Failed to update submission",
        variant: "destructive",
        duration: 3000,
      })
      
      throw err
    }
  }, [submissions, toast])

  const gradeSubmission = useCallback(async (submissionId: string, data: GradeSubmissionData) => {
    const originalSubmission = submissions.find(s => s.id === submissionId)
    if (!originalSubmission) throw new Error('Submission not found')
    
    const optimisticSubmission = { 
      ...originalSubmission, 
      grade: data.grade,
      feedback: data.feedback,
      status: 'graded',
      updated_at: new Date().toISOString()
    }
    setSubmissions(prev => prev.map(s => s.id === submissionId ? optimisticSubmission : s))
    
    try {
      const result = await AssignmentAPI.gradeSubmission(submissionId, data)
      setSubmissions(prev => prev.map(s => s.id === submissionId ? result : s))
      
      toast({
        title: "Submission Graded",
        description: `Grade: ${data.grade}/${originalSubmission.assignment?.points || 0}`,
        duration: 3000,
      })
      
      return result
    } catch (err: any) {
      setSubmissions(prev => prev.map(s => s.id === submissionId ? originalSubmission : s))
      setError(err.message || 'Failed to grade submission')
      
      toast({
        title: "Error",
        description: "Failed to grade submission",
        variant: "destructive",
        duration: 3000,
      })
      
      throw err
    }
  }, [submissions, toast])

  return {
    submissions,
    loading,
    error,
    createSubmission,
    updateSubmission,
    gradeSubmission,
    refetch: fetchSubmissions
  }
}

// Enhanced student assignment hook with real-time updates
export function useRealtimeStudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getMyAssignments()
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
      const result = await AssignmentAPI.createSubmission(data)
      
      // Update the assignment's student_submission
      setAssignments(prev => prev.map(a => 
        a.id === assignmentId 
          ? { ...a, student_submission: result }
          : a
      ))
      
      toast({
        title: "Assignment Submitted",
        description: "Your assignment has been submitted successfully",
        duration: 3000,
      })
      
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to submit assignment')
      
      toast({
        title: "Error",
        description: "Failed to submit assignment",
        variant: "destructive",
        duration: 3000,
      })
      
      throw err
    }
  }, [toast])

  return {
    assignments,
    loading,
    error,
    submitAssignment,
    refetch: fetchAssignments
  }
}
