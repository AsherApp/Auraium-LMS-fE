import { http } from '../http'

// =====================================================
// TYPES
// =====================================================

export type TeacherSubmission = {
  id: string
  assignment_id: string
  student_id: string
  student_email: string
  student_name: string
  content: any
  response: string
  status: 'submitted' | 'graded' | 'returned'
  attempt_number: number
  grade: number | null
  feedback: string | null
  submitted_at: string
  graded_at: string | null
  graded_by: string | null
  created_at: string
  updated_at: string
}

export type GradeSubmissionData = {
  grade: number
  feedback?: string
  requestResubmission?: boolean
}

// =====================================================
// API FUNCTIONS
// =====================================================

// Get submissions for an assignment (teachers only)
export async function getAssignmentSubmissions(assignmentId: string): Promise<TeacherSubmission[]> {
  const response = await http<TeacherSubmission[]>(`/api/submissions/assignment/${assignmentId}`, {
    headers: getAuthHeaders()
  })
  return response
}

// Get a single submission
export async function getSubmission(submissionId: string): Promise<TeacherSubmission> {
  const response = await http<TeacherSubmission>(`/api/submissions/${submissionId}`, {
    headers: getAuthHeaders()
  })
  return response
}

// Grade a submission
export async function gradeSubmission(submissionId: string, data: GradeSubmissionData): Promise<{ message: string; submission: TeacherSubmission }> {
  const response = await http<{ message: string; submission: TeacherSubmission }>(`/api/submissions/${submissionId}/grade`, {
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

export const TeacherSubmissionsAPI = {
  getAssignmentSubmissions,
  getSubmission,
  gradeSubmission
}
