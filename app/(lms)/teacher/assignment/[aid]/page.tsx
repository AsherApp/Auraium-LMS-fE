"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { useAssignment, useGradingStats } from "@/services/assignments/hook"
import { useAssignmentSubmissions } from "@/services/assignments/hook"
import { type Assignment, type Submission, type AssignmentType } from "@/services/assignments/api"

type GradingStats = {
  total_submissions: number
  submitted_count: number
  graded_submissions: number
  pending_grading: number
  average_grade: number
  late_count: number
  completion_rate: number
  grading_progress: number
  grade_distribution: { [key: string]: number }
}
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { FluidTabs } from "@/components/ui/fluid-tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { http } from "@/services/http"
import { 
  ArrowLeft, 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3,
  Calendar,
  Target,
  TrendingUp,
  Award,
  RefreshCw,
  BookOpen,
  Edit,
  Save,
  Trash2,
  Plus,
  Eye,
  Download,
  Share2,
  Settings,
  PieChart,
  Activity,
  Layers,
  FolderOpen,
  BookMarked,
  User,
  SortAsc,
  SortDesc
} from "lucide-react"
import { GradingInterface } from "@/components/teacher/grading-interface"

type AssignmentWithStats = Assignment & {
  stats?: GradingStats
}

// Submissions Table View Component
function SubmissionsTableView({ assignment }: { assignment: AssignmentWithStats }) {
  const { submissions, loading, error } = useAssignmentSubmissions(assignment.id)
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "graded" | "returned">("all")
  const [sortBy, setSortBy] = useState<"name" | "submitted_at" | "grade">("submitted_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Filter submissions
  const filteredSubmissions = submissions.filter(submission => {
    switch (statusFilter) {
      case "pending":
        return submission.status === "submitted" && submission.grade === null
      case "graded":
        return submission.grade !== null
      case "returned":
        return submission.status === "returned"
      default:
        return true
    }
  })

  // Sort submissions
  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case "name":
        comparison = (a.student_name || '').localeCompare(b.student_name || '')
        break
      case "submitted_at":
        comparison = new Date(a.submitted_at || '').getTime() - new Date(b.submitted_at || '').getTime()
        break
      case "grade":
        comparison = (a.grade || 0) - (b.grade || 0)
        break
    }
    return sortOrder === "asc" ? comparison : -comparison
  })

  const getStatusBadge = (submission: Submission) => {
    switch (submission.status) {
      case 'graded':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Graded</Badge>
      case 'submitted':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Submitted</Badge>
      case 'returned':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Returned for Resubmission</Badge>
      default:
        return <Badge variant="outline" className="border-slate-500 text-slate-400">Draft</Badge>
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not submitted'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const toggleSubmissionSelection = (submissionId: string) => {
    const newSelected = new Set(selectedSubmissions)
    if (newSelected.has(submissionId)) {
      newSelected.delete(submissionId)
    } else {
      newSelected.add(submissionId)
    }
    setSelectedSubmissions(newSelected)
  }

  const selectAllSubmissions = (checked: boolean) => {
    if (checked) {
      setSelectedSubmissions(new Set(filteredSubmissions.map(s => s.student_id || s.student_email)))
    } else {
      setSelectedSubmissions(new Set())
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
        <span className="ml-2 text-slate-400">Loading submissions...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        {/* Header and Filters */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Student Submissions</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">
              {filteredSubmissions.length} of {submissions.length} submissions
            </span>
          </div>
        </div>
        
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Submissions</SelectItem>
              <SelectItem value="pending">Pending Grading</SelectItem>
              <SelectItem value="graded">Graded</SelectItem>
              <SelectItem value="returned">Returned for Resubmission</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="submitted_at">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="grade">Grade</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
          >
            {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-slate-300">
                  <Checkbox 
                    checked={selectedSubmissions.size === filteredSubmissions.length && filteredSubmissions.length > 0}
                    onCheckedChange={selectAllSubmissions}
                  />
                </TableHead>
                <TableHead className="text-slate-300">Student</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Submitted</TableHead>
                <TableHead className="text-slate-300">Grade</TableHead>
                <TableHead className="text-slate-300">Attempt</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSubmissions.map((submission) => (
                <TableRow key={submission.student_id || submission.student_email} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <Checkbox 
                      checked={selectedSubmissions.has(submission.student_id || submission.student_email)}
                      onCheckedChange={() => toggleSubmissionSelection(submission.student_id || submission.student_email)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{submission.student_name}</div>
                        <div className="text-sm text-slate-400">{submission.student_email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(submission)}</TableCell>
                  <TableCell className="text-slate-300">{formatDate(submission.submitted_at || null)}</TableCell>
                  <TableCell>
                    {submission.grade !== null && submission.grade !== undefined ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{submission.grade}/{assignment.points}</span>
                        <span className="text-sm text-slate-400">
                          ({Math.round((submission.grade / assignment.points) * 100)}%)
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">Not graded</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-300">{submission.attempt_number}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={() => window.open(`/teacher/assignment/${assignment.id}/submission/${submission.id}`, '_blank')}
                        className="border-white/20 text-white hover:bg-white/10"
                        size="sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {submission.status === 'submitted' && (
                        <Button 
                          className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                          size="sm"
                        >
                          <Award className="h-4 w-4 mr-1" />
                          Grade
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {filteredSubmissions.length === 0 && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No submissions found</h3>
            <p className="text-slate-400">No submissions match your current filter criteria.</p>
          </div>
        )}
      </GlassCard>
    </div>
  )
}

// Helper function to calculate stats from submissions data
const calculateStatsFromSubmissions = (submissions: any[]) => {
  const totalSubmissions = submissions.length
  const submittedCount = submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length
  const gradedCount = submissions.filter(s => s.status === 'graded').length
  const lateCount = submissions.filter(s => s.late_submission).length
  
  const gradedSubmissions = submissions.filter(s => s.grade !== null && s.grade !== undefined)
  const averageGrade = gradedSubmissions.length > 0
    ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
    : 0

  // Calculate grade distribution
  const gradeDistribution: { [key: string]: number } = {}
  gradedSubmissions.forEach(s => {
    const grade = s.grade || 0
    let range = ''
    if (grade >= 90) range = 'A (90-100)'
    else if (grade >= 80) range = 'B (80-89)'
    else if (grade >= 70) range = 'C (70-79)'
    else if (grade >= 60) range = 'D (60-69)'
    else range = 'F (0-59)'
    
    gradeDistribution[range] = (gradeDistribution[range] || 0) + 1
  })

  return {
    total_submissions: totalSubmissions,
    submitted_count: submittedCount,
    graded_submissions: gradedCount,
    pending_grading: submittedCount - gradedCount,
    average_grade: Math.round(averageGrade * 100) / 100,
    late_count: lateCount,
    completion_rate: totalSubmissions > 0 ? (submittedCount / totalSubmissions) * 100 : 0,
    grading_progress: totalSubmissions > 0 ? (gradedCount / totalSubmissions) * 100 : 0,
    grade_distribution: gradeDistribution
  }
}

// Helper function to get assignment scope level
const getAssignmentScope = (assignment: Assignment) => {
  if (assignment.lesson_id) return 'lesson'
  if (assignment.module_id) return 'module'
  return 'course'
}

// Helper function to get scope color
const getScopeColor = (level: string) => {
  switch (level) {
    case 'course':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'module':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    case 'lesson':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

// Helper function to get scope label
const getScopeLabel = (level: string) => {
  switch (level) {
    case 'course':
      return 'COURSE LEVEL'
    case 'module':
      return 'MODULE LEVEL'
    case 'lesson':
      return 'LESSON LEVEL'
    default:
      return 'COURSE LEVEL'
  }
}

// Helper function to get scope icon
const getScopeIcon = (level: string) => {
  switch (level) {
    case 'course':
      return <BookOpen className="h-5 w-5 text-blue-400" />
    case 'module':
      return <FolderOpen className="h-5 w-5 text-purple-400" />
    case 'lesson':
      return <BookMarked className="h-5 w-5 text-green-400" />
    default:
      return <BookOpen className="h-5 w-5 text-blue-400" />
  }
}

export default function TeacherAssignmentDetailPage() {
  const params = useParams<{ aid: string }>()
  const router = useRouter()
  
  const { assignment, loading, error } = useAssignment(params?.aid || '')
  const { stats } = useGradingStats(params?.aid || '')
  const [courseInfo, setCourseInfo] = useState<any>(null)
  const [moduleInfo, setModuleInfo] = useState<any>(null)
  const [lessonInfo, setLessonInfo] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    instructions: "",
    points: 0,
    due_at: "",
    type: "essay" as AssignmentType,
    allow_late_submissions: false,
    late_penalty_percent: 0,
    max_attempts: 1
  })

  // Update course info when assignment loads
  useEffect(() => {
    if (assignment) {
      setCourseInfo({
        id: assignment.course_id,
        title: assignment.course_title || `Course ${assignment.course_id}`
      })
      
      if (assignment.module_id) {
        setModuleInfo({
          id: assignment.module_id,
          title: `Module ${assignment.module_id}`
        })
      }
      
      if (assignment.lesson_id) {
        setLessonInfo({
          id: assignment.lesson_id,
          title: `Lesson ${assignment.lesson_id}`
        })
      }
      
      // Populate edit form
      setEditForm({
        title: assignment.title,
        description: assignment.description,
        instructions: assignment.description, // Use description as instructions
        points: assignment.points,
        due_at: assignment.due_at ? new Date(assignment.due_at).toISOString().split('T')[0] : "",
        type: assignment.type,
        allow_late_submissions: false, // Default value
        late_penalty_percent: 0, // Default value
        max_attempts: 1 // Default value
      })
    }
  }, [assignment])

  const handleSaveEdit = async () => {
    if (!assignment) return
    
    try {
      // Mock update - just update local state
      const updatedAssignment = {
        ...assignment,
        title: editForm.title,
        description: editForm.description,
        instructions: editForm.instructions,
        points: editForm.points,
        due_at: editForm.due_at ? new Date(editForm.due_at).toISOString() : null,
        type: editForm.type,
        allow_late_submissions: editForm.allow_late_submissions,
        late_penalty_percent: editForm.late_penalty_percent,
        max_attempts: editForm.max_attempts,
        updated_at: new Date().toISOString()
      }
      
      // Assignment will be updated by the hook
      setEditing(false)
      
      // Show success message
      console.log('Assignment updated successfully (mock)')
    } catch (error) {
      console.error('Failed to update assignment:', error)
    }
  }

  const handleDeleteAssignment = async () => {
    if (!assignment) return
    
    try {
      // Mock delete - just navigate back
      console.log('Assignment deleted successfully (mock)')
      router.push('/teacher/assignments')
    } catch (error) {
      console.error('Failed to delete assignment:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-8">
          <div className="text-center text-slate-300">Loading assignment...</div>
        </GlassCard>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Assignment Not Found</h3>
            <p className="text-slate-400 mb-4">
              This assignment doesn't exist or you don't have access to it.
            </p>
            <Button 
              onClick={() => router.push('/teacher/assignments')}
              className="bg-blue-600/80 hover:bg-blue-600 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assignments
            </Button>
          </div>
        </GlassCard>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading assignment...</p>
        </div>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading assignment</p>
          <Button onClick={() => router.push('/teacher/assignments')}>
            Back to Assignments
          </Button>
        </div>
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
              onClick={() => router.push('/teacher/assignments')}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assignments
            </Button>
            <div className="flex items-center gap-3">
              <Badge className={getScopeColor(getAssignmentScope(assignment))}>
                {getScopeLabel(getAssignmentScope(assignment))}
              </Badge>
            </div>
          </div>
          
          {/* Assignment Header Card */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {getScopeIcon(getAssignmentScope(assignment))}
                <div>
                  <h1 className="text-3xl font-bold text-white">{assignment.title}</h1>
                  <p className="text-slate-400">Assignment Management & Analytics</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{assignment.points}</div>
                <div className="text-sm text-slate-400">points</div>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Due: {assignment.due_at ? new Date(assignment.due_at).toLocaleDateString() : 'No due date'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="capitalize">{assignment.type?.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{stats?.total_submissions || 0} submissions</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Assignment Stats Overview */}
        <GlassCard className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600/20 rounded-lg">
                <Target className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{assignment.points}</p>
                <p className="text-sm text-slate-400">Total Points</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-600/20 rounded-lg">
                <Users className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.total_submissions || 0}</p>
                <p className="text-sm text-slate-400">Submissions</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-600/20 rounded-lg">
                <Award className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {stats?.average_grade ? Math.round(stats.average_grade) : 0}%
                </p>
                <p className="text-sm text-slate-400">Average Grade</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-600/20 rounded-lg">
                <Activity className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.pending_grading || 0}</p>
                <p className="text-sm text-slate-400">Pending Grading</p>
              </div>
            </div>
          </div>
        </GlassCard>


        {/* Main Content Tabs */}
        <div className="w-full">
          <div className="flex justify-center mb-8">
            <FluidTabs
              tabs={[
                {
                  id: 'overview',
                  label: 'Overview',
                  icon: <Eye className="h-4 w-4" />
                },
                {
                  id: 'submissions',
                  label: 'Submissions',
                  icon: <Users className="h-4 w-4" />,
                  badge: stats?.total_submissions || 0
                },
                {
                  id: 'analytics',
                  label: 'Analytics',
                  icon: <BarChart3 className="h-4 w-4" />
                },
                {
                  id: 'settings',
                  label: 'Settings',
                  icon: <Settings className="h-4 w-4" />
                }
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              variant="default"
              width="wide"
            />
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Assignment Details */}
              <div className="lg:col-span-2">
                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <h3 className="text-xl font-semibold text-white">Assignment Details</h3>
                  </div>
                
                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-400">Title</Label>
                      <Input
                        value={editForm.title}
                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-slate-400">Description</Label>
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-slate-400">Instructions</Label>
                      <Textarea
                        value={editForm.instructions}
                        onChange={(e) => setEditForm({...editForm, instructions: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                        rows={4}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-slate-400">Points</Label>
                        <Input
                          type="number"
                          value={editForm.points}
                          onChange={(e) => setEditForm({...editForm, points: parseInt(e.target.value)})}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-400">Type</Label>
                        <Select value={editForm.type} onValueChange={(value: any) => setEditForm({...editForm, type: value})}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900/95 text-white border-white/10">
                            <SelectItem value="essay">Essay</SelectItem>
                            <SelectItem value="file_upload">File Upload</SelectItem>
                            <SelectItem value="quiz">Quiz</SelectItem>
                            <SelectItem value="project">Project</SelectItem>
                            <SelectItem value="discussion">Discussion</SelectItem>
                            <SelectItem value="presentation">Presentation</SelectItem>
                            <SelectItem value="code_submission">Code Submission</SelectItem>
                            <SelectItem value="peer_review">Peer Review</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-slate-400">Due Date</Label>
                      <Input
                        type="date"
                        value={editForm.due_at}
                        onChange={(e) => setEditForm({...editForm, due_at: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    
                    <div className="flex gap-4">
                      <Button onClick={handleSaveEdit} className="bg-green-600/80 hover:bg-green-600 text-white">
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => setEditing(false)}
                        className="text-slate-300 hover:text-white hover:bg-white/10"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-400">Type</label>
                      <p className="text-white capitalize">{assignment.type.replace('_', ' ')}</p>
                    </div>
                    
                    {assignment.description && (
                      <div>
                        <label className="text-sm font-medium text-slate-400">Description</label>
                        <p className="text-slate-300">{assignment.description}</p>
                      </div>
                    )}
                    
                    {assignment.description && (
                      <div>
                        <label className="text-sm font-medium text-slate-400">Instructions</label>
                        <p className="text-slate-300">{assignment.description}</p>
                      </div>
                    )}
                    
                    {assignment.due_at && (
                      <div>
                        <label className="text-sm font-medium text-slate-400">Due Date</label>
                        <p className="text-white">{new Date(assignment.due_at).toLocaleDateString()}</p>
                      </div>
                    )}
                    
                    <div>
                      <label className="text-sm font-medium text-slate-400">Scope</label>
                      <p className="text-white capitalize">{getAssignmentScope(assignment)}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-400">Max Attempts</label>
                      <p className="text-white">1</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-400">Late Penalty</label>
                      <p className="text-white">0%</p>
                    </div>
                  </div>
                )}
                </GlassCard>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Assignment Context */}
                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Settings className="h-5 w-5 text-slate-400" />
                    <h3 className="text-lg font-semibold text-white">Assignment Context</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Course Context - Always shown */}
                    {courseInfo && (
                      <div className="flex items-center gap-3 text-slate-300">
                        <BookOpen className="h-4 w-4 text-blue-400" />
                        <div>
                          <span className="font-medium">Course:</span>
                          <p className="text-white">{courseInfo.title}</p>
                        </div>
                      </div>
                    )}

                    {/* Module Context - Show if module or lesson scoped */}
                    {moduleInfo && (getAssignmentScope(assignment) === 'module' || getAssignmentScope(assignment) === 'lesson') && (
                      <div className="flex items-center gap-3 text-slate-300">
                        <FolderOpen className="h-4 w-4 text-purple-400" />
                        <div>
                          <span className="font-medium">Module:</span>
                          <p className="text-white">{moduleInfo.title}</p>
                        </div>
                      </div>
                    )}

                    {/* Lesson Context - Show if lesson scoped */}
                    {lessonInfo && getAssignmentScope(assignment) === 'lesson' && (
                      <div className="flex items-center gap-3 text-slate-300">
                        <BookMarked className="h-4 w-4 text-green-400" />
                        <div>
                          <span className="font-medium">Lesson:</span>
                          <p className="text-white">{lessonInfo.title}</p>
                        </div>
                      </div>
                    )}

                    {/* Scope Level Info */}
                    <div className="pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {getAssignmentScope(assignment).toUpperCase()} LEVEL
                        </Badge>
                      </div>
                      {getAssignmentScope(assignment) === 'course' && (
                        <p className="text-xs text-slate-400">Available to all students in this course</p>
                      )}
                      {getAssignmentScope(assignment) === 'module' && (
                        <p className="text-xs text-slate-400">Specific to this module</p>
                      )}
                      {getAssignmentScope(assignment) === 'lesson' && (
                        <p className="text-xs text-slate-400">Specific to this lesson</p>
                      )}
                    </div>
                  </div>
                </GlassCard>

                {/* Quick Stats */}
                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="h-5 w-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Quick Stats</h3>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Completion Rate:</span>
                      <span className="text-white font-medium">
                        {stats?.completion_rate ? Math.round(stats.completion_rate) : 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Grading Progress:</span>
                      <span className="text-white font-medium">
                        {stats?.grading_progress ? Math.round(stats.grading_progress) : 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Late Submissions:</span>
                      <span className="text-white font-medium">{stats?.late_count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Max Attempts:</span>
                      <span className="text-white font-medium">1</span>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          )}

        {activeTab === "submissions" && (
          <SubmissionsTableView assignment={{...assignment, stats: stats || undefined}} />
        )}

          {activeTab === "analytics" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Submission Statistics */}
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <PieChart className="h-5 w-5 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">Submission Statistics</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <span className="text-slate-300">Total Submissions</span>
                    </div>
                    <span className="text-white font-semibold text-lg">{stats?.total_submissions || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="text-slate-300">Graded</span>
                    </div>
                    <span className="text-white font-semibold text-lg">{stats?.graded_submissions || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                      <span className="text-slate-300">Pending Grading</span>
                    </div>
                    <span className="text-white font-semibold text-lg">{stats?.pending_grading || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                      <span className="text-slate-300">Average Grade</span>
                    </div>
                    <span className="text-white font-semibold text-lg">
                      {stats?.average_grade ? `${stats.average_grade.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                </div>
              </GlassCard>
              
              {/* Grade Distribution */}
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="h-5 w-5 text-green-400" />
                  <h3 className="text-xl font-semibold text-white">Grade Distribution</h3>
                </div>
                
                <div className="space-y-3">
                  {stats?.grade_distribution && Object.entries(stats.grade_distribution).map(([grade, count]) => (
                    <div key={grade} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-slate-300 font-medium">{grade}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-400 to-green-400 rounded-full"
                            style={{ width: `${((count as number) / (stats?.total_submissions || 1)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-white font-semibold w-8 text-right">{count as number}</span>
                      </div>
                    </div>
                  ))}
                  
                  {(!stats?.grade_distribution || Object.keys(stats.grade_distribution).length === 0) && (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-400">No grade data available yet</p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assignment Settings */}
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Settings className="h-5 w-5 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">Assignment Settings</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <h4 className="text-md font-medium text-white">Late Submissions</h4>
                      <p className="text-sm text-slate-400">Allow students to submit after the due date</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                      onClick={() => {
                        // Toggle late submissions setting
                      }}
                    >
                      Disabled
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <h4 className="text-md font-medium text-white">Anonymous Grading</h4>
                      <p className="text-sm text-slate-400">Hide student names during grading</p>
                    </div>
                    <Button
                      variant={assignment.settings?.anonymous_grading ? "default" : "outline"}
                      size="sm"
                      className={assignment.settings?.anonymous_grading ? "bg-green-600/80 hover:bg-green-600" : "border-white/20 text-white hover:bg-white/10"}
                    >
                      {assignment.settings?.anonymous_grading ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <h4 className="text-md font-medium text-white">Show Grades Immediately</h4>
                      <p className="text-sm text-slate-400">Students can see their grades right after submission</p>
                    </div>
                    <Button
                      variant={assignment.settings?.show_grades_immediately ? "default" : "outline"}
                      size="sm"
                      className={assignment.settings?.show_grades_immediately ? "bg-green-600/80 hover:bg-green-600" : "border-white/20 text-white hover:bg-white/10"}
                    >
                      {assignment.settings?.show_grades_immediately ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                </div>
              </GlassCard>

              {/* Assignment Information */}
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="h-5 w-5 text-green-400" />
                  <h3 className="text-xl font-semibold text-white">Assignment Information</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h4 className="text-md font-medium text-white mb-2">Assignment Type</h4>
                    <p className="text-slate-300 capitalize">{assignment.type?.replace('_', ' ')}</p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h4 className="text-md font-medium text-white mb-2">Total Points</h4>
                    <p className="text-slate-300">{assignment.points} points</p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h4 className="text-md font-medium text-white mb-2">Max Attempts</h4>
                    <p className="text-slate-300">1 attempt</p>
                  </div>
                  
                  {assignment.due_at && (
                    <div className="p-4 bg-white/5 rounded-lg">
                      <h4 className="text-md font-medium text-white mb-2">Due Date</h4>
                      <p className="text-slate-300">{new Date(assignment.due_at).toLocaleDateString()}</p>
                    </div>
                  )}
                  
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h4 className="text-md font-medium text-white mb-2">Late Penalty</h4>
                    <p className="text-slate-300">0% per day</p>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
    </div>
  )
}
