import { http } from '../http'

// =====================================================
// TYPES
// =====================================================

export type StudentAssignment = {
  id: string
  title: string
  description: string
  type: string
  points: number
  due_at: string | null
  available_from: string | null
  available_until: string | null
  course_id: string
  course_title: string
  module_id?: string
  lesson_id?: string
  
  // Computed fields from backend
  is_available: boolean
  is_overdue: boolean
  is_published: boolean
  status: 'not_started' | 'submitted' | 'graded' | 'awaiting_response'
  is_submitted: boolean
  is_graded: boolean
  can_resubmit: boolean
  
  // Student submission data
  student_submission?: {
    id: string
    content: any
    response: string
    status: 'submitted' | 'graded' | 'returned'
    attempt_number: number
    grade: number | null
    feedback: string | null
    submitted_at: string
    graded_at: string | null
  }
}

export type CreateSubmissionData = {
  content: any
  response?: string
}

// =====================================================
// API FUNCTIONS
// =====================================================

// Get all assignments for the current student
export async function getStudentAssignments(): Promise<StudentAssignment[]> {
  const response = await http<StudentAssignment[]>('/api/assignments', {
    headers: getAuthHeaders()
  })
  return response
}

// Get a specific assignment with student submission data
export async function getStudentAssignment(assignmentId: string): Promise<StudentAssignment> {
  const response = await http<StudentAssignment>(`/api/assignments/${assignmentId}`, {
    headers: getAuthHeaders()
  })
  return response
}

// Create or update a submission
export async function submitAssignment(assignmentId: string, data: CreateSubmissionData): Promise<any> {
  const response = await http(`/api/submissions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: {
      assignment_id: assignmentId,
      ...data
    }
  })
  return response
}

// Update an existing submission
export async function updateSubmission(submissionId: string, data: CreateSubmissionData): Promise<any> {
  const response = await http(`/api/submissions/${submissionId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: data
  })
  return response
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  }
}

// =====================================================
// EXPORT
// =====================================================

export const StudentAssignmentsAPI = {
  getStudentAssignments,
  getStudentAssignment,
  submitAssignment,
  updateSubmission
}
