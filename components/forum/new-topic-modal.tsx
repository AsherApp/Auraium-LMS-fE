"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { useToast } from "@/hooks/use-toast"
import { MessageCircle, BookOpen } from "lucide-react"

interface ForumCategory {
  id: string
  name: string
  description: string
  color: string
  icon: string
}

interface Course {
  id: string
  title: string
  description: string
}

interface NewTopicModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTopicCreated?: () => void
}

export function NewTopicModal({ open, onOpenChange, onTopicCreated }: NewTopicModalProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category_id: "",
    course_id: "none",
  })

  useEffect(() => {
    if (open) {
      fetchCategories()
      if (user?.role === "teacher") {
        fetchCourses()
      }
    }
  }, [open, user])

  const fetchCategories = async () => {
    try {
      // For discussions, we don't need categories, just set a default
      setCategories([{
        id: 'general',
        name: 'General Discussion',
        description: 'General course discussions',
        color: '#3b82f6',
        icon: 'message-circle'
      }])
      setFormData(prev => ({ ...prev, category_id: 'general' }))
    } catch (error: any) {
      console.error('Failed to fetch categories:', error)
      toast({
        title: "Error",
        description: "Failed to load discussion categories",
        variant: "destructive"
      })
    }
  }

  const fetchCourses = async () => {
    try {
      const response = await http<{ items: Course[] }>('/api/courses')
      setCourses(response.items || [])
    } catch (error: any) {
      console.error('Failed to fetch courses:', error)
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.course_id || formData.course_id === "none") {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields and select a course",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await http<any>('/api/discussions', {
        method: 'POST',
        body: {
          title: formData.title.trim(),
          description: formData.content.trim(),
          course_id: formData.course_id === "none" ? null : formData.course_id || null,
          allow_student_posts: true,
          require_approval: false
        }
      })

      toast({
        title: "Discussion created successfully",
        description: "Your discussion topic has been created",
        duration: 3000
      })

      // Reset form
      setFormData({
        title: "",
        content: "",
        category_id: categories.length > 0 ? categories[0].id : "",
        course_id: "none",
      })

      // Close modal and refresh
      onOpenChange(false)
      if (onTopicCreated) {
        onTopicCreated()
      }
    } catch (error: any) {
      console.error('Failed to create topic:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create topic",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="auto" className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900/95 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-400" />
            Create New Discussion Topic
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Topic Title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter a clear, descriptive title for your discussion"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-400"
              maxLength={100}
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              {formData.title.length}/100 characters
            </p>
          </div>

          {/* Course Selection (Teachers only) */}
          {user?.role === "teacher" && (
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Course *
              </label>
              <Select
                value={formData.course_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}
                required
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 text-white border-white/10">
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-400" />
                        {course.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}


          {/* Content */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Discussion Content *
            </label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Share your thoughts, questions, or start a discussion..."
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 min-h-[200px]"
              maxLength={2000}
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              {formData.content.length}/2000 characters
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              variant="default"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Create Topic
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
