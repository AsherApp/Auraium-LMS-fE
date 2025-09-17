"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
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
  Send,
  Calendar,
  Timer,
  BarChart3,
  Edit,
  Settings,
  Target,
  BookOpen,
  MessageSquare,
  Presentation,
  Code,
  Upload,
  X,
  File,
  Image,
  Video,
  Music,
  Archive,
  Plus,
  Minus,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trash2
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
  const [isGrading, setIsGrading] = useState(false)

  // Load existing grade and feedback
  useEffect(() => {
    if (submission) {
      setGrade(submission.grade || 0)
      setFeedback(submission.feedback || "")
    }
  }, [submission])

  const handleGradeSubmission = async () => {
    if (!submission || !assignment) return
    
    setIsGrading(true)
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
    } finally {
      setIsGrading(false)
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

  const getAssignmentTypeIcon = (type: string) => {
    switch (type) {
      case 'essay':
        return <FileText className="h-5 w-5 text-blue-400" />
      case 'quiz':
        return <HelpCircle className="h-5 w-5 text-green-400" />
      case 'project':
        return <Target className="h-5 w-5 text-purple-400" />
      case 'discussion':
        return <MessageSquare className="h-5 w-5 text-orange-400" />
      case 'presentation':
        return <Presentation className="h-5 w-5 text-pink-400" />
      case 'code_submission':
        return <Code className="h-5 w-5 text-cyan-400" />
      case 'peer_review':
        return <Users className="h-5 w-5 text-yellow-400" />
      case 'file_upload':
        return <Upload className="h-5 w-5 text-indigo-400" />
      default:
        return <BookOpen className="h-5 w-5 text-slate-400" />
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
    <div className="space-y-6">
        {/* Header with Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
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
          
          {/* Assignment Progress */}
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {getAssignmentTypeIcon(assignment.type)}
                <div>
                  <h1 className="text-2xl font-bold text-white">{assignment.title}</h1>
                  <p className="text-slate-400">Student: {submission.student_name || submission.student_email}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{grade}/{assignment.points}</div>
                <div className="text-sm text-slate-400">points</div>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Due: {assignment.due_at ? new Date(assignment.due_at).toLocaleDateString() : 'No due date'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Submitted: {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="capitalize">{assignment.type?.replace('_', ' ')}</span>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Assignment Instructions */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="h-5 w-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Assignment Instructions</h2>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-slate-300 whitespace-pre-wrap prose prose-invert max-w-none" 
                     dangerouslySetInnerHTML={{ __html: assignment.description || "No specific instructions provided." }} />
              </div>
            </GlassCard>

            {/* Student Response */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Edit className="h-5 w-5 text-green-400" />
                <h2 className="text-xl font-semibold text-white">Student Response</h2>
              </div>
              
              <div className="space-y-4">
                {/* Essay Content */}
                {submission.essay_content && submission.essay_content.trim() && (
                  <div>
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-400" />
                      Essay Response
                    </h4>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-slate-300 whitespace-pre-wrap prose prose-invert max-w-none" 
                           dangerouslySetInnerHTML={{ __html: submission.essay_content }} />
                    </div>
                  </div>
                )}
                
                {/* Project Content */}
                {submission.project_description && submission.project_description.trim() && (
                  <div>
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-400" />
                      Project Description
                    </h4>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-slate-300 whitespace-pre-wrap prose prose-invert max-w-none" 
                           dangerouslySetInnerHTML={{ __html: submission.project_description }} />
                    </div>
                  </div>
                )}
                
                {/* Discussion Content */}
                {submission.discussion_response && submission.discussion_response.trim() && (
                  <div>
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-orange-400" />
                      Discussion Response
                    </h4>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-slate-300 whitespace-pre-wrap prose prose-invert max-w-none" 
                           dangerouslySetInnerHTML={{ __html: submission.discussion_response }} />
                    </div>
                  </div>
                )}
                
                {/* Quiz Content */}
                {submission.quiz_answers && assignment?.settings?.quiz_questions && (
                  <div>
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-green-400" />
                      Quiz Response
                    </h4>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <QuizViewer
                        questions={assignment.settings.quiz_questions}
                        submission={Object.entries(submission.quiz_answers || {}).map(([questionId, answer]) => ({
                          questionId,
                          answer,
                          isCorrect: false, // Will be calculated by QuizViewer
                          pointsEarned: 0 // Will be calculated by QuizViewer
                        }))}
                        isTeacherView={true}
                      />
                    </div>
                  </div>
                )}
                
                {/* Code Submission */}
                {submission.code_submission && submission.code_submission.trim() && (
                  <div>
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <Code className="h-4 w-4 text-cyan-400" />
                      Code Submission
                    </h4>
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
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-yellow-400" />
                      Peer Review
                    </h4>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-slate-300 whitespace-pre-wrap prose prose-invert max-w-none" 
                           dangerouslySetInnerHTML={{ __html: submission.peer_review_content }} />
                    </div>
                  </div>
                )}

                {/* Presentation Content */}
                {submission.presentation_notes && submission.presentation_notes.trim() && (
                  <div>
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <Presentation className="h-4 w-4 text-pink-400" />
                      Presentation Notes
                    </h4>
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
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <Upload className="h-4 w-4 text-indigo-400" />
                      Uploaded Files
                    </h4>
                    <div className="space-y-2">
                      {submission.uploaded_files.map((file: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                          <div className="flex items-center gap-3">
                            <File className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-300">{file.name || `File ${index + 1}`}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
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
                  <div className="text-center text-slate-400 py-12">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No response provided</p>
                    <p className="text-sm">The student hasn't submitted any content yet.</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Grading Panel */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Award className="h-5 w-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Grading</h3>
              </div>
              
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
                    placeholder="Enter grade"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Feedback
                  </label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide detailed feedback for the student..."
                    className="bg-white/5 border-white/10 text-white min-h-[120px]"
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
                  disabled={isGrading}
                  className="w-full bg-blue-600/80 hover:bg-blue-600 text-white"
                >
                  {isGrading ? (
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

            {/* Submission Details */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="h-5 w-5 text-slate-400" />
                <h3 className="text-lg font-semibold text-white">Submission Details</h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Student:</span>
                  <span className="text-white font-medium">{submission.student_name || submission.student_email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Attempt:</span>
                  <span className="text-white">#{submission.attempt_number}</span>
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
                    <span className="text-slate-300">Status:</span>
                    <span className="text-red-400 font-medium">Late Submission</span>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Quick Actions */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
              </div>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-slate-300 border-slate-600 hover:bg-slate-700"
                  onClick={() => router.push(`/teacher/assignment/${assignmentId}`)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Assignment
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-slate-300 border-slate-600 hover:bg-slate-700"
                  onClick={() => window.print()}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Print Submission
                </Button>
              </div>
            </GlassCard>
          </div>
        </div>
    </div>
  )
}