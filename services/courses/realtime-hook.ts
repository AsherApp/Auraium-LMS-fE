import { useState, useEffect, useCallback } from 'react'
import { http } from '../http'
import { useToast } from '@/hooks/use-toast'

export interface Course {
  id: string
  title: string
  description: string
  teacher_email: string
  is_public: boolean
  created_at: string
  updated_at: string
  student_count: number
  teacher?: {
    name: string
    email: string
  }
}

export interface Student {
  id: string
  name: string
  email: string
  student_code: string
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  enrolled_at: string
  student?: Student
  course?: Course
}

export interface CreateCourseData {
  title: string
  description: string
  is_public: boolean
}

export interface EnrollStudentData {
  student_code: string
  course_id: string
}

// Enhanced courses hook with optimistic updates
export function useRealtimeCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await http<{ items: Course[] }>('/api/courses')
      setCourses(response.items || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch courses')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const createCourse = useCallback(async (data: CreateCourseData) => {
    const tempId = `temp_${Date.now()}`
    const optimisticCourse: Course = {
      id: tempId,
      title: data.title,
      description: data.description,
      teacher_email: '', // Will be filled by backend
      is_public: data.is_public,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      student_count: 0
    }
    
    setCourses(prev => [optimisticCourse, ...prev])
    
    try {
      const response = await http<Course>('/api/courses', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      
      setCourses(prev => prev.map(c => c.id === tempId ? response : c))
      
      toast({
        title: "Course Created",
        description: `${response.title} has been created successfully`,
        duration: 3000,
      })
      
      return response
    } catch (err: any) {
      setCourses(prev => prev.filter(c => c.id !== tempId))
      setError(err.message || 'Failed to create course')
      
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
        duration: 3000,
      })
      
      throw err
    }
  }, [toast])

  const updateCourse = useCallback(async (id: string, data: Partial<CreateCourseData>) => {
    const originalCourse = courses.find(c => c.id === id)
    if (!originalCourse) throw new Error('Course not found')
    
    const optimisticCourse = { 
      ...originalCourse, 
      ...data, 
      updated_at: new Date().toISOString() 
    }
    setCourses(prev => prev.map(c => c.id === id ? optimisticCourse : c))
    
    try {
      const response = await http<Course>(`/api/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
      
      setCourses(prev => prev.map(c => c.id === id ? response : c))
      
      toast({
        title: "Course Updated",
        description: `${response.title} has been updated successfully`,
        duration: 3000,
      })
      
      return response
    } catch (err: any) {
      setCourses(prev => prev.map(c => c.id === id ? originalCourse : c))
      setError(err.message || 'Failed to update course')
      
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive",
        duration: 3000,
      })
      
      throw err
    }
  }, [courses, toast])

  const deleteCourse = useCallback(async (id: string) => {
    const originalCourse = courses.find(c => c.id === id)
    if (!originalCourse) throw new Error('Course not found')
    
    setCourses(prev => prev.filter(c => c.id !== id))
    
    try {
      await http(`/api/courses/${id}`, { method: 'DELETE' })
      
      toast({
        title: "Course Deleted",
        description: `${originalCourse.title} has been deleted successfully`,
        duration: 3000,
      })
      
      return true
    } catch (err: any) {
      setCourses(prev => [originalCourse, ...prev])
      setError(err.message || 'Failed to delete course')
      
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
        duration: 3000,
      })
      
      throw err
    }
  }, [courses, toast])

  return {
    courses,
    loading,
    error,
    createCourse,
    updateCourse,
    deleteCourse,
    refetch: fetchCourses
  }
}

// Enhanced student enrollment hook with optimistic updates
export function useRealtimeEnrollments(courseId?: string) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchEnrollments = useCallback(async () => {
    if (!courseId) return
    
    try {
      setLoading(true)
      setError(null)
      const response = await http<{ items: Enrollment[] }>(`/api/enrollments?course_id=${courseId}`)
      setEnrollments(response.items || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch enrollments')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchEnrollments()
  }, [fetchEnrollments])

  const enrollStudent = useCallback(async (data: EnrollStudentData) => {
    try {
      const response = await http<Enrollment>('/api/enrollments', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      
      setEnrollments(prev => [response, ...prev])
      
      toast({
        title: "Student Enrolled",
        description: `${response.student?.name || 'Student'} has been enrolled successfully`,
        duration: 3000,
      })
      
      return response
    } catch (err: any) {
      setError(err.message || 'Failed to enroll student')
      
      toast({
        title: "Error",
        description: "Failed to enroll student",
        variant: "destructive",
        duration: 3000,
      })
      
      throw err
    }
  }, [toast])

  const unenrollStudent = useCallback(async (enrollmentId: string) => {
    const originalEnrollment = enrollments.find(e => e.id === enrollmentId)
    if (!originalEnrollment) throw new Error('Enrollment not found')
    
    setEnrollments(prev => prev.filter(e => e.id !== enrollmentId))
    
    try {
      await http(`/api/enrollments/${enrollmentId}`, { method: 'DELETE' })
      
      toast({
        title: "Student Unenrolled",
        description: `${originalEnrollment.student?.name || 'Student'} has been unenrolled successfully`,
        duration: 3000,
      })
      
      return true
    } catch (err: any) {
      setEnrollments(prev => [originalEnrollment, ...prev])
      setError(err.message || 'Failed to unenroll student')
      
      toast({
        title: "Error",
        description: "Failed to unenroll student",
        variant: "destructive",
        duration: 3000,
      })
      
      throw err
    }
  }, [enrollments, toast])

  return {
    enrollments,
    loading,
    error,
    enrollStudent,
    unenrollStudent,
    refetch: fetchEnrollments
  }
}

// Enhanced student courses hook for student dashboard
export function useRealtimeStudentCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await http<{ items: Course[] }>('/api/courses/student')
      setCourses(response.items || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch courses')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const enrollInCourse = useCallback(async (courseId: string) => {
    try {
      const response = await http<Enrollment>('/api/enrollments', {
        method: 'POST',
        body: JSON.stringify({ course_id: courseId })
      })
      
      // Refresh courses to show new enrollment
      await fetchCourses()
      
      toast({
        title: "Enrolled Successfully",
        description: "You have been enrolled in the course",
        duration: 3000,
      })
      
      return response
    } catch (err: any) {
      setError(err.message || 'Failed to enroll in course')
      
      toast({
        title: "Error",
        description: "Failed to enroll in course",
        variant: "destructive",
        duration: 3000,
      })
      
      throw err
    }
  }, [fetchCourses, toast])

  return {
    courses,
    loading,
    error,
    enrollInCourse,
    refetch: fetchCourses
  }
}
