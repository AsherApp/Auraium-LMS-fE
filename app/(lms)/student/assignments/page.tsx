"use client"

import { useState } from "react"
import Link from "next/link"
import { GlassCard } from "@/components/shared/glass-card"
import { AnimationWrapper } from "@/components/shared/animation-wrapper"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useStudentAssignments } from "@/hooks/use-student-assignments"
import { 
  ClipboardList, 
  Calendar, 
  CheckCircle, 
  Clock, 
  FileText, 
  BarChart3,
  Eye,
  AlertTriangle
} from "lucide-react"

export default function StudentAssignmentsPage() {
  const { assignments, loading, error } = useStudentAssignments()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "submitted" | "overdue" | "awaiting_response">("all")

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = searchTerm === "" || 
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.course_title?.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesFilter = true
    switch (filterStatus) {
      case "pending":
        matchesFilter = assignment.status === 'not_started'
        break
      case "submitted":
        matchesFilter = assignment.status === 'submitted'
        break
      case "overdue":
        matchesFilter = assignment.is_overdue && assignment.status !== 'submitted'
        break
      case "awaiting_response":
        matchesFilter = assignment.status === 'awaiting_response'
        break
      default:
        matchesFilter = true
    }
    
    return matchesSearch && matchesFilter
  })

  // Calculate progress data
  const progressData = {
    totalAssignments: assignments.length,
    completedAssignments: assignments.filter(a => a.is_graded).length,
    submittedAssignments: assignments.filter(a => a.is_submitted).length,
    pendingAssignments: assignments.filter(a => a.status === 'not_started').length,
    awaitingResponse: assignments.filter(a => a.status === 'awaiting_response').length
  }

  const getStatusBadge = (assignment: any) => {
    switch (assignment.status) {
      case 'graded':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Graded</Badge>
      case 'awaiting_response':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Awaiting Response</Badge>
      case 'submitted':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Submitted</Badge>
      case 'not_started':
        if (assignment.is_overdue) {
          return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Overdue</Badge>
        }
        return <Badge variant="outline" className="border-slate-500 text-slate-400">Not Started</Badge>
      default:
        return <Badge variant="outline" className="border-slate-500 text-slate-400">Unknown</Badge>
    }
  }

  const getAssignmentIcon = (type: string) => {
    switch (type) {
      case 'essay': return <FileText className="h-5 w-5 text-blue-400" />
      case 'quiz': return <BarChart3 className="h-5 w-5 text-green-400" />
      case 'project': return <ClipboardList className="h-5 w-5 text-purple-400" />
      default: return <FileText className="h-5 w-5 text-slate-400" />
    }
  }

  const getActionButton = (assignment: any) => {
    const href = `/student/assignment/${assignment.id}`
    
    switch (assignment.status) {
      case 'graded':
        return (
          <Link href={href}>
            <Button className="w-full bg-green-600/20 text-green-300 border-green-600/30 hover:bg-green-600/30">
              <Eye className="h-4 w-4 mr-2" />
              View Result
            </Button>
          </Link>
        )
      case 'awaiting_response':
        return (
          <Link href={href}>
            <Button className="w-full bg-orange-600/20 text-orange-300 border-orange-600/30 hover:bg-orange-600/30">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Resubmit
            </Button>
          </Link>
        )
      case 'submitted':
        return (
          <Link href={href}>
            <Button className="w-full bg-blue-600/20 text-blue-300 border-blue-600/30 hover:bg-blue-600/30">
              <Eye className="h-4 w-4 mr-2" />
              View Submission
            </Button>
          </Link>
        )
      default:
        return (
          <Link href={href}>
            <Button className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Start Assignment
            </Button>
          </Link>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading assignments...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="text-red-400 text-xl mb-4">Error loading assignments</div>
            <p className="text-slate-400">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <AnimationWrapper>
          <GlassCard className="p-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-2">My Assignments</h1>
              <p className="text-slate-400">Track your progress and manage your work</p>
            </div>
          </GlassCard>
        </AnimationWrapper>

        {/* Progress Summary */}
        <AnimationWrapper delay={0.1}>
          <GlassCard className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{progressData.totalAssignments}</div>
                <div className="text-slate-400 text-sm">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{progressData.submittedAssignments}</div>
                <div className="text-slate-400 text-sm">Submitted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{progressData.completedAssignments}</div>
                <div className="text-slate-400 text-sm">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{progressData.awaitingResponse}</div>
                <div className="text-slate-400 text-sm">Awaiting Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-400">{progressData.pendingAssignments}</div>
                <div className="text-slate-400 text-sm">Pending</div>
              </div>
            </div>
          </GlassCard>
        </AnimationWrapper>

        {/* Search and Filters */}
        <AnimationWrapper delay={0.2}>
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search assignments or courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder-slate-400"
                />
              </div>
              <div className="flex gap-2">
                {["all", "pending", "submitted", "overdue", "awaiting_response"].map((filter) => (
                  <Button
                    key={filter}
                    variant={filterStatus === filter ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilterStatus(filter as any)}
                    className={filterStatus === filter ? "bg-blue-600/80 text-white" : "text-slate-300 hover:text-white hover:bg-white/10"}
                  >
                    {filter === 'awaiting_response' ? 'Awaiting Response' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </GlassCard>
        </AnimationWrapper>

        {/* Assignments Grid */}
        <AnimationWrapper delay={0.3}>
          {filteredAssignments.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <ClipboardList className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No assignments found</h3>
              <p className="text-slate-400">
                {searchTerm || filterStatus !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "You don't have any assignments yet."}
              </p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignments.map((assignment, index) => (
                <AnimationWrapper key={assignment.id} delay={0.1 * index}>
                  <GlassCard className="p-6 hover:bg-white/5 transition-all duration-300">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">{assignment.title}</h3>
                          <p className="text-slate-400 text-sm">{assignment.course_title}</p>
                        </div>
                        {getStatusBadge(assignment)}
                      </div>

                      {/* Assignment Type */}
                      <div className="flex items-center gap-2">
                        {getAssignmentIcon(assignment.type)}
                        <span className="text-slate-300 text-sm capitalize">{assignment.type}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-300 text-sm">{assignment.points} points</span>
                      </div>

                      {/* Description */}
                      {assignment.description && (
                        <p className="text-slate-400 text-sm line-clamp-2">{assignment.description}</p>
                      )}

                      {/* Due Date */}
                      {assignment.due_at && (
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {new Date(assignment.due_at).toLocaleDateString()}</span>
                        </div>
                      )}

                      {/* Action Button */}
                      {getActionButton(assignment)}
                    </div>
                  </GlassCard>
                </AnimationWrapper>
              ))}
            </div>
          )}
        </AnimationWrapper>
      </div>
    </div>
  )
}