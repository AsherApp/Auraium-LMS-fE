"use client"

import { useState } from "react"
import Link from "next/link"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AnimationWrapper, StaggeredAnimationWrapper } from "@/components/shared/animation-wrapper"
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Copy, 
  Trash2,
  Clock,
  FileText,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Eye,
  Users,
  CheckCircle,
  AlertTriangle
} from "lucide-react"
import { useRealtimeAssignments } from "@/services/assignments/realtime-hook"
import { type Assignment } from "@/services/assignments/api"
import { AssignmentCreator } from "@/components/teacher/assignment-creator"

export default function TeacherAssignmentsPage() {
  // State Management - Using Real API
  const { assignments, loading, error, createAssignment, updateAssignment, deleteAssignment } = useRealtimeAssignments()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "pending" | "graded" | "overdue">("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = searchTerm === "" || 
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assignment.course_title || assignment.course_id).toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesFilter = true
    switch (filterType) {
      case "pending":
        matchesFilter = (assignment.submission_count || 0) > (assignment.graded_count || 0)
        break
      case "graded":
        matchesFilter = (assignment.graded_count || 0) > 0
        break
      case "overdue":
        matchesFilter = !!(assignment.due_at && new Date(assignment.due_at) < new Date())
        break
      default:
        matchesFilter = true
    }
    
    return matchesSearch && matchesFilter
  })

  // Helper Functions
  const getAssignmentIcon = (type: string) => {
    switch (type) {
      case 'essay': return <FileText className="h-5 w-5 text-blue-400" />
      case 'project': return <BarChart3 className="h-5 w-5 text-green-400" />
      case 'quiz': return <CheckCircle2 className="h-5 w-5 text-purple-400" />
      case 'discussion': return <Users className="h-5 w-5 text-orange-400" />
      case 'presentation': return <Eye className="h-5 w-5 text-indigo-400" />
      case 'code_submission': return <FileText className="h-5 w-5 text-emerald-400" />
      case 'peer_review': return <Users className="h-5 w-5 text-pink-400" />
      case 'file_upload': return <FileText className="h-5 w-5 text-cyan-400" />
      default: return <FileText className="h-5 w-5 text-slate-400" />
    }
  }

  const getStatusBadge = (assignment: Assignment) => {
    if (assignment.due_at && new Date(assignment.due_at) < new Date()) {
      return <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Overdue</Badge>
    } else if ((assignment.submission_count || 0) > (assignment.graded_count || 0)) {
      return <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">Needs Grading</Badge>
    } else if ((assignment.submission_count || 0) > 0) {
      return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">Complete</Badge>
    } else {
      return <Badge variant="outline" className="border-slate-500 text-slate-400">Active</Badge>
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <AnimationWrapper>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Assignments</h1>
            <p className="text-slate-400">Manage and track all your course assignments</p>
          </div>
          <Dialog  open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600/80 hover:bg-blue-600 text-white transition-all duration-200 hover:scale-105">
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white sm:max-w-[1200px] w-[95vw] max-h-[95vh] overflow-y-auto">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-semibold text-white">Create New Assignment</DialogTitle>
                <p className="text-slate-400 text-sm">Create a new assignment for your students</p>
              </DialogHeader>
              <AssignmentCreator 
                onSave={async (data) => {
                  try {
                    await createAssignment(data)
                    setShowCreateDialog(false)
                  } catch (error) {
                    console.error('Failed to create assignment:', error)
                  }
                }}
                onCancel={() => setShowCreateDialog(false)}
                onClose={() => setShowCreateDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </AnimationWrapper>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Assignments - Circular */}
        <AnimationWrapper delay={0.1}>
          <GlassCard className="p-6 text-center hover:bg-white/5 transition-all duration-300 hover:scale-105">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{assignments.length}</div>
            <div className="text-sm text-slate-400">Total Assignments</div>
          </GlassCard>
        </AnimationWrapper>
        
        {/* Pending Grading - Rectangular with icon */}
        <AnimationWrapper delay={0.2}>
          <GlassCard className="p-6 hover:bg-white/5 transition-all duration-300 hover:scale-105">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Clock className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">
                  {assignments.reduce((sum, a) => sum + ((a.submission_count || 0) - (a.graded_count || 0)), 0)}
                </div>
                <div className="text-sm text-slate-400">Pending Grading</div>
              </div>
            </div>
          </GlassCard>
        </AnimationWrapper>
        
        {/* Total Submissions - Circular */}
        <AnimationWrapper delay={0.3}>
          <GlassCard className="p-6 text-center hover:bg-white/5 transition-all duration-300 hover:scale-105">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <Users className="h-8 w-8 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-400 mb-1">
              {assignments.reduce((sum, a) => sum + (a.submission_count || 0), 0)}
            </div>
            <div className="text-sm text-slate-400">Total Submissions</div>
          </GlassCard>
        </AnimationWrapper>
        
        {/* Overdue - Rectangular with warning */}
        <AnimationWrapper delay={0.4}>
          <GlassCard className="p-6 hover:bg-white/5 transition-all duration-300 hover:scale-105">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">
                  {assignments.filter(a => a.due_at && new Date(a.due_at) < new Date()).length}
                </div>
                <div className="text-sm text-slate-400">Overdue</div>
              </div>
            </div>
          </GlassCard>
        </AnimationWrapper>
      </div>

      {/* Main Navigation */}
      <AnimationWrapper delay={0.1}>
        <div className="flex justify-center">
          <div className="bg-white/5 rounded-lg p-1">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 text-white rounded-md">
              <FileText className="h-4 w-4" />
              <span>Assignments</span>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {assignments.length}
              </Badge>
            </div>
          </div>
        </div>
      </AnimationWrapper>

      {/* Assignments Content */}
      <div className="space-y-6">
          {/* Search and Filters */}
          <AnimationWrapper delay={0.2}>
            <GlassCard className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search assignments or courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder-slate-400"
                  />
                </div>
                <div className="flex gap-2">
                  {["all", "pending", "graded", "overdue"].map((filter) => (
                    <Button
                      key={filter}
                      variant={filterType === filter ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setFilterType(filter as any)}
                      className={filterType === filter ? "bg-blue-600/80 text-white" : "text-slate-300 hover:text-white hover:bg-white/10"}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </GlassCard>
          </AnimationWrapper>

          {/* Assignments Grid */}
          {filteredAssignments.length === 0 ? (
            <AnimationWrapper delay={0.3}>
              <GlassCard className="p-8">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No assignments found</h3>
                  <p className="text-slate-400">Try adjusting your search or filter criteria</p>
                </div>
              </GlassCard>
            </AnimationWrapper>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredAssignments.map((assignment, index) => {
                const hasPendingSubmissions = (assignment.submission_count || 0) > (assignment.graded_count || 0)
                return (
                <AnimationWrapper key={assignment.id} delay={index * 0.1}>
                  <GlassCard className="p-4 hover:bg-white/10 transition-all duration-300 hover:scale-105 relative">
                    {/* Interactive Status Dot */}
                    <div className="absolute -top-2 -right-2 z-10 group">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all duration-300 group-hover:scale-125 ${
                        assignment.due_at && new Date(assignment.due_at) < new Date() 
                          ? 'bg-red-500 group-hover:bg-red-400' 
                          : hasPendingSubmissions 
                            ? 'bg-orange-500 group-hover:bg-orange-400'
                            : (assignment.submission_count || 0) > 0
                              ? 'bg-green-500 group-hover:bg-green-400'
                              : 'bg-blue-500 group-hover:bg-blue-400'
                      }`}>
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                      
                      {/* Hover Tooltip */}
                      <div className="absolute top-6 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-none">
                        <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-2 text-xs text-white whitespace-nowrap shadow-xl">
                          {assignment.due_at && new Date(assignment.due_at) < new Date() ? (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-red-400" />
                              <span>Overdue</span>
                            </div>
                          ) : hasPendingSubmissions ? (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-orange-400" />
                              <span>Needs Grading</span>
                            </div>
                          ) : (assignment.submission_count || 0) > 0 ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-400" />
                              <span>Complete</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-blue-400" />
                              <span>Active</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {/* Header with Title and Menu */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="text-base font-semibold text-white truncate leading-tight">
                            {assignment.title}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {assignment.course_title || assignment.course_id}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white p-1 flex-shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Assignment Type and Description */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-white/10 rounded-md">
                            {getAssignmentIcon(assignment.type)}
                          </div>
                          <span className="text-xs text-slate-300 capitalize font-medium">
                            {assignment.type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {assignment.description}
                        </p>
                      </div>

                      {/* Stats and Due Date */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Users className="h-3.5 w-3.5" />
                            <span>{assignment.submission_count || 0} submissions</span>
                          </div>
                          {assignment.avg_grade && assignment.avg_grade > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-green-400">
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span>{assignment.avg_grade.toFixed(1)} avg</span>
                            </div>
                          )}
                        </div>
                        {assignment.due_at && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Due {new Date(assignment.due_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1.5 pt-1">
                        <Link href={`/teacher/assignment/${assignment.id}`} className="flex-1">
                          <Button size="sm" className="w-full bg-blue-600/80 hover:bg-blue-600 text-white text-xs h-8">
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            View Details
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/10 h-8 w-8 p-0">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                </AnimationWrapper>
                )
              })}
            </div>
          )}
      </div>

    </div>
  )
}