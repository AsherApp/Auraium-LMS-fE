import { http } from '../http'

export interface Certificate {
  id: string
  course_id: string
  student_email: string
  student_name: string
  course_title: string
  completion_date: string
  certificate_config: any
  status: string
  created_at: string
}

export interface CertificateStats {
  total_students: number
  certificates_issued: number
  pending_completion: number
}

export class CertificateAPI {
  // Get certificate statistics for a course
  static async getCourseStats(courseId: string): Promise<CertificateStats> {
    return http.get(`/api/certificates/course/${courseId}/stats`)
  }

  // Get all certificates for a course
  static async getCourseCertificates(courseId: string): Promise<Certificate[]> {
    return http.get(`/api/certificates/course/${courseId}`)
  }

  // Get certificate by ID
  static async getCertificate(certificateId: string): Promise<Certificate> {
    return http.get(`/api/certificates/${certificateId}`)
  }

  // Get all certificates for current user (student)
  static async getMyCertificates(): Promise<Certificate[]> {
    return http.get('/api/certificates')
  }

  // Generate certificate for a student
  static async generateCertificate(courseId: string, studentEmail: string): Promise<Certificate> {
    return http.post('/api/certificates/generate', {
      courseId,
      studentEmail
    })
  }

  // Auto-generate certificate when student completes course
  static async autoGenerateCertificate(courseId: string): Promise<Certificate> {
    return http.post('/api/certificates/generate', {
      courseId,
      studentEmail: 'auto' // This will be replaced with the current user's email on the backend
    })
  }
}
