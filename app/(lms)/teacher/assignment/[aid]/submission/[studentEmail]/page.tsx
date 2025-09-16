"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAssignment } from "@/services/assignments/hook"
import { useSubmission } from "@/hooks/use-teacher-submissions"
import { useToast } from "@/hooks/use-toast"
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Award,
  Save,
  Send,
  User,
  Calendar
} from "lucide-react"

export default function TeacherSubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  // Extract parameters from the URL
  const assignmentId = params.aid as string
  const submissionId = params.studentEmail as string // This is actually submission ID
  
  const { assignment, loading: assignmentLoading } = useAssignment(assignmentId)
  const { submission, loading: submissionLoading, error: submissionError } = useSubmission(submissionId)
  
  // Grading state
  const [grade, setGrade] = useState<number>(0)
  const [feedback, setFeedback] = useState("")
  const [requestResubmission, setRequestResubmission] = useState(false)
  const [grading, setGrading] = useState(false)

  // Initialize grading form when submission loads
  useEffect(() => {
    if (submission) {
      setGrade(submission.grade || 0)
      setFeedback(submission.feedback || "")
      setRequestResubmission(submission.status === 'returned')
    }
  }, [submission])

  const handleGradeSubmission = async () => {
    if (!submission || !assignment) return
    
    setGrading(true)
    try {
      const response = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          grade,
          feedback,
          requestResubmission
        })
      })

      if (!response.ok) {
        throw new Error('Failed to grade submission')
      }

      const result = await response.json()
      
      toast({
        title: requestResubmission ? "Submission returned for resubmission" : "Submission graded successfully",
        description: result.message
      })

      // Refresh the submission data
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to grade submission",
        variant: "destructive"
      })
    } finally {
      setGrading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'graded':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Graded</Badge>
      case 'returned':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Returned</Badge>
      case 'submitted':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Submitted</Badge>
      default:
        return <Badge variant="outline" className="border-slate-500 text-slate-400">Unknown</Badge>
    }
  }

  const renderSubmissionContent = () => {
    if (!submission) return null

    // If there's a response field, show it
    if (submission.response) {
      return (
        <div className="space-y-4">
          <h4 className="font-medium text-white">Student Response</h4>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-slate-300 whitespace-pre-wrap">{submission.response}</p>
          </div>
        </div>
      )
    }

    // If there's content, show it based on type
    if (submission.content) {
      return (
        <div className="space-y-4">
          <h4 className="font-medium text-white">Student Response</h4>
          
          {/* Essay content */}
          {submission.content.essay && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h5 className="text-white font-medium mb-2">Essay Response</h5>
              <p className="text-slate-300 whitespace-pre-wrap">{submission.content.essay}</p>
            </div>
          )}

          {/* Project content */}
          {submission.content.project && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h5 className="text-white font-medium mb-2">Project Description</h5>
              <p className="text-slate-300 whitespace-pre-wrap">{submission.content.project}</p>
            </div>
          )}

          {/* Quiz content */}
          {submission.content.quiz && Object.keys(submission.content.quiz).length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h5 className="text-white font-medium mb-2">Quiz Answers</h5>
              <pre className="text-slate-300 text-sm overflow-auto">
                {JSON.stringify(submission.content.quiz, null, 2)}
              </pre>
            </div>
          )}

          {/* Code submission */}
          {submission.content.code_submission && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h5 className="text-white font-medium mb-2">Code Submission</h5>
              <pre className="text-slate-300 text-sm overflow-auto">
                {submission.content.code_submission}
              </pre>
            </div>
          )}

          {/* Discussion content */}
          {submission.content.discussion && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h5 className="text-white font-medium mb-2">Discussion Response</h5>
              <p className="text-slate-300 whitespace-pre-wrap">{submission.content.discussion}</p>
            </div>
          )}

          {/* File uploads */}
          {submission.content.file_upload && Array.isArray(submission.content.file_upload) && submission.content.file_upload.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h5 className="text-white font-medium mb-2">Uploaded Files</h5>
              <div className="space-y-2">
                {submission.content.file_upload.map((file: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-slate-300">
                    <FileText className="h-4 w-4" />
                    <span>{file.name || `File ${index + 1}`}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="text-center text-slate-400 py-8">
        <FileText className="h-12 w-12 mx-auto mb-4" />
        <p>No response provided</p>
      </div>
    )
  }

  if (assignmentLoading || submissionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading submission...</p>
          </div>
        </div>
      </div>
    )
  }

  if (submissionError || !submission || !assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="text-red-400 text-xl mb-4">Error loading submission</div>
            <p className="text-slate-400">{submissionError || 'Submission not found'}</p>
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
              Back to Assignment
            </Button>
            {getStatusBadge(submission.status)}
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">{assignment.title}</h1>
            <p className="text-slate-400">Student Submission Review</p>
          </div>
        </GlassCard>

        {/* Student Information */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Student Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              <span className="text-slate-300">{submission.student_name || submission.student_email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-slate-300">
                {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'Unknown'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" />
              <span className="text-slate-300">Attempt {submission.attempt_number}</span>
            </div>
          </div>
        </GlassCard>

        {/* Submission Content */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Student Response</h3>
          {renderSubmissionContent()}
        </GlassCard>

        {/* Grading Interface */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Grading</h3>
          
          <div className="space-y-6">
            {/* Grade Input */}
            <div className="space-y-2">
              <Label className="text-white">Grade (out of {assignment.points})</Label>
              <Input
                type="number"
                min="0"
                max={assignment.points}
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Enter grade"
              />
            </div>

            {/* Feedback */}
            <div className="space-y-2">
              <Label className="text-white">Feedback</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[150px] bg-white/5 border-white/10 text-white placeholder-slate-400"
                placeholder="Provide feedback to the student..."
              />
            </div>

            {/* Resubmission Request */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requestResubmission"
                checked={requestResubmission}
                onChange={(e) => setRequestResubmission(e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
              />
              <Label htmlFor="requestResubmission" className="text-white">
                Request resubmission
              </Label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button 
                onClick={handleGradeSubmission}
                disabled={grading}
                className="flex-1"
              >
                {grading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Grading...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {requestResubmission ? 'Return for Resubmission' : 'Grade Submission'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Previous Grade Display (if already graded) */}
        {submission.status === 'graded' && submission.grade !== null && (
          <GlassCard className="p-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Award className="h-6 w-6 text-green-400" />
                <span className="text-green-400 font-bold text-xl">
                  {submission.grade}/{assignment.points}
                </span>
              </div>
              {submission.feedback && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Previous Feedback</h4>
                  <p className="text-slate-300">{submission.feedback}</p>
                </div>
              )}
              <p className="text-slate-400 text-sm mt-2">
                Graded on {submission.graded_at ? new Date(submission.graded_at).toLocaleString() : 'Unknown date'}
              </p>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  )
}