"use client"

import { notFound, useParams, useRouter } from "next/navigation"
import { useMemo, useState, useEffect } from "react"
import { EnhancedStudyArea } from "@/components/student/enhanced-study-area"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { GlassCard } from "@/components/shared/glass-card"

export default function StudyAreaPage() {
  const params = useParams<{ id: string; slug?: string[] }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [moduleId, lessonId] = useMemo(() => {
    const segs = params.slug || []
    return [segs[0] || "", segs[1] || ""]
  }, [params.slug])

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      if (!params.id || !user?.email) return
      
      setLoading(true)
      setError(null)
      
      try {
        const courseResponse = await http<any>(`/api/courses/${params.id}`)
        
        // Check if course is in public mode
        // Note: Public mode is now handled by hiding features in the same pages
        // No need to redirect to separate public pages
        
        setCourse(courseResponse)
      } catch (err: any) {
        setError(err.message || "Failed to load course")
      } finally {
        setLoading(false)
      }
    }
    
    fetchCourse()
  }, [params.id, user?.email])

  if (loading) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-6">
          <div className="text-slate-300">Loading course...</div>
        </GlassCard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-6">
          <div className="text-red-300">Error: {error}</div>
        </GlassCard>
      </div>
    )
  }

  if (!course) {
    return notFound()
  }

  return (
    <div className="space-y-6">
      <EnhancedStudyArea
        courseId={course.id}
        title="Study Area"
      />
    </div>
  )
}
