import { http, httpClient } from '../http'

export interface Classwork {
  id: string
  session_id: string
  title: string
  description: string
  due_at?: string
  created_at: string
  updated_at?: string
  session_title?: string
  course_id?: string
}

export interface ClassworkSubmission {
  id: string
  classwork_id: string
  student_email: string
  payload: any
  submitted_at: string
  grade?: number
  feedback?: string
  graded_at?: string
}

export class ClassworkAPI {
  // Get all classwork for a teacher
  static async getAll(): Promise<{ items: Classwork[] }> {
    return httpClient.get('/api/classwork')
  }

  // Get classwork for a specific session
  static async getBySession(sessionId: string): Promise<{ items: Classwork[] }> {
    return httpClient.get(`/api/classwork/session/${sessionId}`)
  }

  // Create classwork for a session
  static async create(sessionId: string, data: {
    title: string
    description: string
    due_at?: string
  }): Promise<Classwork> {
    return httpClient.post(`/api/classwork/session/${sessionId}`, data)
  }

  // Update classwork
  static async update(classworkId: string, data: {
    title: string
    description: string
    due_at?: string
  }): Promise<Classwork> {
    return httpClient.put(`/api/classwork/${classworkId}`, data)
  }

  // Delete classwork
  static async delete(classworkId: string): Promise<{ success: boolean }> {
    return httpClient.delete(`/api/classwork/${classworkId}`)
  }

  // Get classwork submissions
  static async getSubmissions(classworkId: string): Promise<{ items: ClassworkSubmission[] }> {
    return httpClient.get(`/api/classwork/${classworkId}/submissions`)
  }

  // Grade classwork submission
  static async gradeSubmission(
    classworkId: string, 
    submissionId: string, 
    data: { grade: number; feedback: string }
  ): Promise<ClassworkSubmission> {
    return httpClient.put(`/api/classwork/${classworkId}/submissions/${submissionId}/grade`, data)
  }
}
