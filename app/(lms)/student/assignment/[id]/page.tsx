"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useStudentAssignment } from "@/hooks/use-student-assignments"
import { 
  ArrowLeft, 
  FileText, 
  Award, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Send,
  Save
} from "lucide-react"

export default function StudentAssignmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = params.id as string
  
  const { assignment, loading, error, submitAssignment, updateSubmission } = useStudentAssignment(assignmentId)
  const [content, setContent] = useState<any>({})
  const [response, setResponse] = useState("")
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Initialize content based on assignment type
  useEffect(() => {
    if (assignment) {
      if (assignment.student_submission) {
        setContent(assignment.student_submission.content || {})
        setResponse(assignment.student_submission.response || "")
      } else {
        // Initialize empty content based on assignment type
        switch (assignment.type) {
          case 'essay':
            setContent({ essay: '' })
            break
          case 'quiz':
            setContent({ quiz: {} })
            break
          case 'project':
            setContent({ project: '' })
            break
          default:
            setContent({})
        }
      }
    }
  }, [assignment])

  const handleSave = async () => {
    if (!assignment) return
    
    setSaving(true)
    try {
      if (assignment.student_submission) {
        await updateSubmission(assignment.student_submission.id, { content, response })
      } else {
        await submitAssignment({ content, response })
      }
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!assignment) return
    
    setSubmitting(true)
    try {
      if (assignment.student_submission) {
        await updateSubmission(assignment.student_submission.id, { content, response })
      } else {
        await submitAssignment({ content, response })
      }
    } catch (err) {
      console.error('Submit failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = () => {
    if (!assignment) return null
    
    switch (assignment.status) {
      case 'graded':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Graded</Badge>
      case 'awaiting_response':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Awaiting Response</Badge>
      case 'submitted':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Submitted</Badge>
      default:
        return <Badge variant="outline" className="border-slate-500 text-slate-400">Not Started</Badge>
    }
  }

  const renderContentEditor = () => {
    if (!assignment) return null

    switch (assignment.type) {
      case 'essay':
        return (
          <div className="space-y-4">
            <Label className="text-white">Your Essay</Label>
            <Textarea
              value={content.essay || ''}
              onChange={(e) => setContent({ ...content, essay: e.target.value })}
              placeholder="Write your essay here..."
              className="min-h-[400px] bg-white/5 border-white/10 text-white placeholder-slate-400"
              disabled={assignment.status === 'submitted' || assignment.status === 'graded'}
            />
          </div>
        )
      
      case 'quiz':
        return (
          <div className="space-y-4">
            <Label className="text-white">Quiz Questions</Label>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-slate-400">Quiz questions will be displayed here</p>
            </div>
          </div>
        )
      
      case 'project':
        return (
          <div className="space-y-4">
            <Label className="text-white">Project Description</Label>
            <Textarea
              value={content.project || ''}
              onChange={(e) => setContent({ ...content, project: e.target.value })}
              placeholder="Describe your project..."
              className="min-h-[200px] bg-white/5 border-white/10 text-white placeholder-slate-400"
              disabled={assignment.status === 'submitted' || assignment.status === 'graded'}
            />
          </div>
        )
      
      default:
        return (
          <div className="space-y-4">
            <Label className="text-white">Response</Label>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Enter your response here..."
              className="min-h-[200px] bg-white/5 border-white/10 text-white placeholder-slate-400"
              disabled={assignment.status === 'submitted' || assignment.status === 'graded'}
            />
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading assignment...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="text-red-400 text-xl mb-4">Error loading assignment</div>
            <p className="text-slate-400">{error || 'Assignment not found'}</p>
            <Button 
              onClick={() => router.back()} 
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isReadOnly = assignment.status === 'submitted' || assignment.status === 'graded'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Button 
              onClick={() => router.back()} 
              variant="ghost" 
              className="text-slate-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {getStatusBadge()}
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">{assignment.title}</h1>
            <p className="text-slate-400">{assignment.course_title}</p>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span className="capitalize">{assignment.type}</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4" />
                <span>{assignment.points} points</span>
              </div>
              {assignment.due_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Due: {new Date(assignment.due_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Description */}
        {assignment.description && (
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
            <p className="text-slate-300">{assignment.description}</p>
          </GlassCard>
        )}

        {/* Content Editor */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Your Response</h3>
          {renderContentEditor()}
        </GlassCard>

        {/* Grade Display (if graded) */}
        {assignment.status === 'graded' && assignment.student_submission?.grade !== null && (
          <GlassCard className="p-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Award className="h-6 w-6 text-green-400" />
                <span className="text-green-400 font-bold text-xl">
                  {assignment.student_submission.grade}/{assignment.points}
                </span>
              </div>
              {assignment.student_submission.feedback && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Feedback</h4>
                  <p className="text-slate-300">{assignment.student_submission.feedback}</p>
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* Awaiting Response Message */}
        {assignment.status === 'awaiting_response' && (
          <GlassCard className="p-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <AlertTriangle className="h-6 w-6 text-orange-400" />
                <span className="text-orange-400 font-medium">Resubmission Required</span>
              </div>
              <p className="text-slate-300">
                Your teacher has requested a resubmission. Please review the feedback and submit your updated work.
              </p>
            </div>
          </GlassCard>
        )}

        {/* Action Buttons */}
        {!isReadOnly && (
          <GlassCard className="p-6">
            <div className="flex gap-4">
              <Button 
                onClick={handleSave}
                disabled={saving}
                variant="outline"
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              
              <Button 
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Submitting...' : 'Submit Assignment'}
              </Button>
            </div>
          </GlassCard>
        )}

        {/* Submitted Message */}
        {assignment.status === 'submitted' && (
          <GlassCard className="p-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <CheckCircle className="h-6 w-6 text-blue-400" />
                <span className="text-blue-400 font-medium">Assignment Submitted</span>
              </div>
              <p className="text-slate-300">
                Your assignment has been submitted and is awaiting grading.
              </p>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  )
}