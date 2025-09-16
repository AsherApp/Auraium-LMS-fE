import { http } from '../http'

// =====================================================
// TYPES
// =====================================================

export type AssignmentType = 'essay' | 'quiz' | 'project' | 'file_upload' | 'code_submission' | 'discussion' | 'peer_review' | 'presentation'

export type SubmissionStatus = 'not_started' | 'submitted' | 'graded' | 'awaiting_response'

export type Assignment = {
  id: string
  title: string
  description: string
  course_id: string
  module_id?: string
  lesson_id?: string
  type: AssignmentType
  points: number
  due_at?: string
  available_from?: string
  available_until?: string
  is_published: boolean
  settings?: any
  created_at: string
  updated_at: string
  // Computed fields
  course_title?: string
  is_available?: boolean
  is_overdue?: boolean
  is_late?: boolean
  // Student-specific fields
  is_submitted?: boolean
  is_graded?: boolean
  status?: SubmissionStatus
  can_resubmit?: boolean
  student_submission?: Submission
  time_remaining?: number
  // Teacher-specific fields
  submission_count?: number
  graded_count?: number
}

export type Submission = {
  id: string
  assignment_id: string
  student_id: string
  student_email: string
  student_name?: string
  content?: any
  response?: string
  status: 'submitted' | 'graded' | 'returned'
  attempt_number: number
  grade?: number | null
  feedback?: string
  submitted_at?: string
  graded_at?: string
  graded_by?: string
  created_at: string
  updated_at: string
  // Additional fields from joins
  assignment_title?: string
  assignment_points?: number
  assignment_type?: string
}

export type CreateAssignmentData = {
  title: string
  description: string
  course_id: string
  module_id?: string
  lesson_id?: string
  type: AssignmentType
  points: number
  due_at?: string
  available_from?: string
  available_until?: string
  settings?: any
}

export type UpdateAssignmentData = {
  title?: string
  description?: string
  points?: number
  due_at?: string
  available_from?: string
  available_until?: string
  settings?: any
}

export type CreateSubmissionData = {
  assignment_id: string
  content?: any
  response?: string
}

export type UpdateSubmissionData = {
  content?: any
  response?: string
}

export type GradeSubmissionData = {
  grade: number
  feedback?: string
  requestResubmission?: boolean
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
// ASSIGNMENT API
// =====================================================

// Get all assignments (teacher only)
export async function getAssignments(): Promise<Assignment[]> {
  const response = await http<Assignment[]>('/api/assignments', {
    headers: getAuthHeaders()
  })
  return response
}

// Get assignments for a specific course (student)
export async function getCourseAssignments(courseId: string): Promise<Assignment[]> {
  const response = await http<Assignment[]>(`/api/assignments/course/${courseId}`, {
    headers: getAuthHeaders()
  })
  return response
}

// Get single assignment with student submission data
export async function getAssignment(assignmentId: string): Promise<Assignment> {
  const response = await http<Assignment>(`/api/assignments/${assignmentId}`, {
    headers: getAuthHeaders()
  })
  return response
}

// Create assignment (teacher only)
export async function createAssignment(data: CreateAssignmentData): Promise<Assignment> {
  const response = await http<Assignment>('/api/assignments', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: data
  })
  return response
}

// Update assignment (teacher only)
export async function updateAssignment(id: string, data: UpdateAssignmentData): Promise<Assignment> {
  const response = await http<Assignment>(`/api/assignments/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: data
  })
  return response
}

// Delete assignment (teacher only)
export async function deleteAssignment(id: string): Promise<{ message: string }> {
  const response = await http<{ message: string }>(`/api/assignments/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  return response
}

// Get all student assignments (from all enrolled courses)
export async function getMyAssignments(): Promise<Assignment[]> {
  const response = await http<Assignment[]>('/api/assignments/student', {
    headers: getAuthHeaders()
  })
  return response
}

// =====================================================
// SUBMISSION API
// =====================================================

// Get submissions for an assignment (teacher only)
export async function getAssignmentSubmissions(assignmentId: string): Promise<Submission[]> {
  const response = await http<Submission[]>(`/api/submissions/assignment/${assignmentId}`, {
    headers: getAuthHeaders()
  })
  return response
}

// Get single submission
export async function getSubmission(submissionId: string): Promise<Submission> {
  const response = await http<Submission>(`/api/submissions/${submissionId}`, {
    headers: getAuthHeaders()
  })
  return response
}

// Create submission (student only)
export async function createSubmission(data: CreateSubmissionData): Promise<Submission> {
  const response = await http<Submission>('/api/submissions', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: data
  })
  return response
}

// Update submission (student only)
export async function updateSubmission(submissionId: string, data: UpdateSubmissionData): Promise<Submission> {
  const response = await http<Submission>(`/api/submissions/${submissionId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: data
  })
  return response
}

// Grade submission (teacher only)
export async function gradeSubmission(submissionId: string, data: GradeSubmissionData): Promise<{ message: string; submission: Submission }> {
  const response = await http<{ message: string; submission: Submission }>(`/api/submissions/${submissionId}/grade`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: data
  })
  return response
}

// Delete submission
export async function deleteSubmission(submissionId: string): Promise<{ message: string }> {
  const response = await http<{ message: string }>(`/api/submissions/${submissionId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  return response
}

// =====================================================
// EXPORTS
// =====================================================

export const AssignmentAPI = {
  // Assignment methods
  getAssignments,
  getCourseAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  // Submission methods
  getAssignmentSubmissions,
  getSubmission,
  createSubmission,
  updateSubmission,
  gradeSubmission,
  deleteSubmission
}