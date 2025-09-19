import { http } from '../http'

export interface StudentActivity {
  id: string
  student_id: string
  activity_type: string
  activity_data: Record<string, any>
  course_id?: string
  lesson_id?: string
  assignment_id?: string
  created_at: string
  courses?: {
    id: string
    title: string
  }
  lessons?: {
    id: string
    title: string
  }
  assignments?: {
    id: string
    title: string
  }
}

export interface ActivitySummary {
  total_activities: number
  activities_by_type: Record<string, number>
  last_activity: string | null
  activity_trend: Array<{
    date: string
    count: number
  }>
}

export class StudentActivityAPI {
  // Log a student activity
  static async logActivity(data: {
    student_id: string
    activity_type: string
    activity_data?: Record<string, any>
    course_id?: string
    lesson_id?: string
    assignment_id?: string
  }): Promise<StudentActivity> {
    return http.post('/api/student-activity/log', data)
  }

  // Get student activity history
  static async getStudentActivities(
    studentId: string,
    options: {
      limit?: number
      offset?: number
      activity_type?: string
    } = {}
  ): Promise<{ items: StudentActivity[] }> {
    const params = new URLSearchParams()
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.offset) params.append('offset', options.offset.toString())
    if (options.activity_type) params.append('activity_type', options.activity_type)

    const queryString = params.toString()
    const url = `/api/student-activity/student/${studentId}${queryString ? `?${queryString}` : ''}`
    
    return http.get(url)
  }

  // Get activity summary for a student
  static async getStudentActivitySummary(studentId: string): Promise<ActivitySummary> {
    return http.get(`/api/student-activity/student/${studentId}/summary`)
  }

  // Get all students activity overview (for teachers)
  static async getActivitiesOverview(): Promise<{ items: StudentActivity[] }> {
    return http.get('/api/student-activity/overview')
  }

  // Helper method to log common activities
  static async logCourseActivity(
    studentId: string,
    activityType: 'course_started' | 'course_completed' | 'course_accessed',
    courseId: string,
    additionalData?: Record<string, any>
  ): Promise<StudentActivity> {
    return this.logActivity({
      student_id: studentId,
      activity_type: activityType,
      activity_data: additionalData || {},
      course_id: courseId
    })
  }

  static async logLessonActivity(
    studentId: string,
    activityType: 'lesson_started' | 'lesson_completed' | 'lesson_accessed',
    courseId: string,
    lessonId: string,
    additionalData?: Record<string, any>
  ): Promise<StudentActivity> {
    return this.logActivity({
      student_id: studentId,
      activity_type: activityType,
      activity_data: additionalData || {},
      course_id: courseId,
      lesson_id: lessonId
    })
  }

  static async logAssignmentActivity(
    studentId: string,
    activityType: 'assignment_started' | 'assignment_submitted' | 'assignment_graded',
    courseId: string,
    assignmentId: string,
    additionalData?: Record<string, any>
  ): Promise<StudentActivity> {
    return this.logActivity({
      student_id: studentId,
      activity_type: activityType,
      activity_data: additionalData || {},
      course_id: courseId,
      assignment_id: assignmentId
    })
  }

  static async logQuizActivity(
    studentId: string,
    activityType: 'quiz_started' | 'quiz_completed' | 'quiz_attempted',
    courseId: string,
    assignmentId: string,
    additionalData?: Record<string, any>
  ): Promise<StudentActivity> {
    return this.logActivity({
      student_id: studentId,
      activity_type: activityType,
      activity_data: additionalData || {},
      course_id: courseId,
      assignment_id: assignmentId
    })
  }

  static async logLiveSessionActivity(
    studentId: string,
    activityType: 'live_session_joined' | 'live_session_left' | 'live_session_participated',
    courseId: string,
    additionalData?: Record<string, any>
  ): Promise<StudentActivity> {
    return this.logActivity({
      student_id: studentId,
      activity_type: activityType,
      activity_data: additionalData || {},
      course_id: courseId
    })
  }
}
