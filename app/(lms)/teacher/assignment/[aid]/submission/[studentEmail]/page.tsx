"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAssignment } from "@/services/assignments/hook"
import { useSubmission, useSubmissionManagement } from "@/services/assignments/hook"
import { http } from "@/services/http"
import { 
  ArrowLeft, 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Award,
  Download,
  Eye,
  Save,
  Send
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { FileList } from "@/components/shared/file-list"
import { QuizViewer } from "@/components/assignment/quiz-viewer"
import { CodeViewer } from "@/components/shared/code-viewer"
import { PeerReviewViewer } from "@/components/shared/peer-review-viewer"
import { FileUploadViewer } from "@/components/shared/file-upload-viewer"

export default function TeacherSubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  // Extract parameters from the URL
  const assignmentId = params?.aid as string
  const submissionId = params?.studentEmail as string // This is actually submission ID
  
  const { assignment, loading: assignmentLoading } = useAssignment(assignmentId)
  const { submission, loading: submissionLoading, error: submissionError } = useSubmission(submissionId)
  const { gradeSubmission, loading: grading } = useSubmissionManagement()
  
  // Grading state
  const [grade, setGrade] = useState<number>(0)
  const [feedback, setFeedback] = useState("")
  const [requestResubmission, setRequestResubmission] = useState(false)

  // Load existing grade and feedback
  useEffect(() => {
    if (submission) {
      setGrade(submission.grade || 0)
      setFeedback(submission.feedback || "")
    }
  }, [submission])

  const handleGradeSubmission = async () => {
    if (!submission || !assignment) return
    
    try {
      await gradeSubmission(submission.id, {
        grade,
        feedback,
        requestResubmission
      })
      
      toast({
        title: requestResubmission ? "Submission returned for resubmission" : "Submission graded successfully",
        description: `Grade: ${grade}/${assignment?.points}`,
      })
      
      // Refresh the page to get updated data
      window.location.reload()
    } catch (error: any) {
      console.error('Failed to grade submission:', error)
      toast({
        title: "Failed to grade submission",
        description: error.message || "Please try again",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'graded':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Graded
          </Badge>
        )
      case 'submitted':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Submitted
          </Badge>
        )
      case 'returned':
        return (
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Returned for Resubmission
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="border-slate-500 text-slate-400">
            {status}
          </Badge>
        )
    }
  }

  if (assignmentLoading || submissionLoading) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-8">
          <div className="text-center text-slate-300">Loading submission...</div>
        </GlassCard>
      </div>
    )
  }

  if (submissionError || !assignment || !submission) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">Submission Not Found</h3>
            <p className="text-slate-400 mb-4">
              {submissionError || "This submission doesn't exist or you don't have access to it."}
            </p>
            <Button 
              onClick={() => router.push(`/teacher/assignment/${assignmentId}`)}
              className="bg-blue-600/80 hover:bg-blue-600 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assignment
            </Button>
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/teacher/assignment/${assignmentId}`)}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignment
          </Button>
          <div className="flex items-center gap-3">
            {getStatusBadge(submission.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Assignment Details */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-5 w-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">{assignment.title}</h2>
              </div>
              <p className="text-slate-300 mb-4">{assignment.description}</p>
              
              <div className="flex items-center gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  <span>{assignment.points} points</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="capitalize">{assignment.type?.replace('_', ' ')}</span>
                </div>
              </div>
            </GlassCard>

            {/* Instructions */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Instructions</h3>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-slate-300 whitespace-pre-wrap">{assignment.description || "No specific instructions provided."}</p>
              </div>
            </GlassCard>

            {/* Student Response */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Student Response</h3>
              
              {submission.response ? (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Student Response</h4>
                  <p className="text-slate-300 whitespace-pre-wrap">{submission.response}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Essay Content */}
                  {submission.essay_content && submission.essay_content.trim() && (
                    <div>
                      <h4 className="font-medium text-white mb-2">Essay Response</h4>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="text-slate-300 whitespace-pre-wrap prose prose-invert max-w-none" 
                             dangerouslySetInnerHTML={{ __html: submission.essay_content }} />
                      </div>
                    </div>
                  )}
                  
                  {/* Project Content */}
                  {submission.project_description && submission.project_description.trim() && (
                    <div>
                      <h4 className="font-medium text-white mb-2">Project Description</h4>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="text-slate-300 whitespace-pre-wrap prose prose-invert max-w-none" 
                             dangerouslySetInnerHTML={{ __html: submission.project_description }} />
                      </div>
                    </div>
                  )}
                  
                  {/* Discussion Content */}
                  {submission.discussion_response && submission.discussion_response.trim() && (
                    <div>
                      <h4 className="font-medium text-white mb-2">Discussion Response</h4>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="text-slate-300 whitespace-pre-wrap prose prose-invert max-w-none" 
                             dangerouslySetInnerHTML={{ __html: submission.discussion_response }} />
                      </div>
                    </div>
                  )}
                  
                  {/* Quiz Content */}
                  {submission.quiz_answers && assignment?.settings?.quiz_questions && (
                    <div>
                      <h4 className="font-medium text-white mb-2">Quiz Response</h4>
                      <QuizViewer
                        questions={assignment.settings.quiz_questions}
                        submission={submission.quiz_answers}
                        isTeacherView={true}
                      />
                    </div>
                  )}
                  
                  {/* Code Submission */}
                  {submission.code_submission && submission.code_submission.trim() && (
                    <div>
                      <h4 className="font-medium text-white mb-2">Code Submission</h4>
                      <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                        <CodeViewer 
                          code={submission.code_submission}
                          language="javascript"
                          readOnly={true}
                        />
                      </div>
                    </div>
                  )}

                  {/* Peer Review Content */}
                  {submission.peer_review_content && (
                    <div>
                      <h4 className="font-medium text-white mb-2">Peer Review</h4>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="text-slate-300 whitespace-pre-wrap prose prose-invert max-w-none" 
                             dangerouslySetInnerHTML={{ __html: submission.peer_review_content }} />
                      </div>
                    </div>
                  )}

                  {/* Presentation Content */}
                  {submission.presentation_notes && submission.presentation_notes.trim() && (
                    <div>
                      <h4 className="font-medium text-white mb-2">Presentation Notes</h4>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div 
                          className="text-slate-300 whitespace-pre-wrap prose prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: submission.presentation_notes }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Uploaded Files */}
                  {submission.uploaded_files && Array.isArray(submission.uploaded_files) && submission.uploaded_files.length > 0 && (
                    <div>
                      <h4 className="font-medium text-white mb-2">Uploaded Files</h4>
                      <div className="space-y-2">
                        {submission.uploaded_files.map((file: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-300">{file.name || `File ${index + 1}`}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:text-white"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No content fallback */}
                  {!submission.essay_content && !submission.project_description && !submission.discussion_response && 
                   !submission.quiz_answers && !submission.code_submission && !submission.peer_review_content && 
                   !submission.presentation_notes && (!submission.uploaded_files || submission.uploaded_files.length === 0) && (
                    <div className="text-center text-slate-400 py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4" />
                      <p>No response provided</p>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Actions Panel */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Grade (out of {assignment.points})
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max={assignment.points}
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Feedback
                  </label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide feedback for the student..."
                    className="bg-white/5 border-white/10 text-white min-h-[100px]"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requestResubmission"
                    checked={requestResubmission}
                    onChange={(e) => setRequestResubmission(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="requestResubmission" className="text-sm text-slate-300">
                    Request resubmission
                  </label>
                </div>
                
                <Button
                  onClick={handleGradeSubmission}
                  disabled={grading}
                  className="w-full bg-blue-600/80 hover:bg-blue-600 text-white"
                >
                  {grading ? (
                    <>
                      <Save className="h-4 w-4 mr-2 animate-spin" />
                      Grading...
                    </>
                  ) : (
                    <>
                      <Award className="h-4 w-4 mr-2" />
                      {requestResubmission ? 'Return for Resubmission' : 'Submit Grade'}
                    </>
                  )}
                </Button>
              </div>
            </GlassCard>

            {/* Settings Panel */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Settings</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Student:</span>
                  <span className="text-white">{submission.student_name || submission.student_email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Attempt:</span>
                  <span className="text-white">{submission.attempt_number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Submitted:</span>
                  <span className="text-white">{submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Time:</span>
                  <span className="text-white">{submission.submitted_at ? new Date(submission.submitted_at).toLocaleTimeString() : 'N/A'}</span>
                </div>
                
                {assignment.due_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Due Date:</span>
                    <span className="text-white">{new Date(assignment.due_at).toLocaleDateString()}</span>
                  </div>
                )}
                
                {assignment.due_at && submission.submitted_at && new Date(submission.submitted_at) > new Date(assignment.due_at) && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Late Penalty:</span>
                    <span className="text-red-400">10%</span>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}