"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useSequentialLearning } from "@/hooks/use-sequential-learning"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { useToast } from "@/hooks/use-toast"
import { CongratulationBalloon } from "@/components/shared/congratulation-balloon"
import { RestrictedVideoPlayer } from "@/components/shared/restricted-video-player"
import { DocumentViewer } from "@/components/shared/document-viewer"
import { QuizWithTimer } from "@/components/student/quiz-with-timer"
import { InlineNotes } from "@/components/student/inline-notes"
import {
  BookOpen,
  Video,
  FileText,
  ClipboardList,
  CheckCircle,
  Lock,
  ArrowLeft,
  ArrowRight,
  Clock,
  Target,
  Award,
  ExternalLink,
  Play
} from "lucide-react"

interface EnhancedStudyAreaProps {
  courseId: string
  title?: string
}

interface Lesson {
  id: string
  title: string
  type: string
  content: any
  description?: string
  duration: number
  points: number
  position: number
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
  position: number
}

interface Course {
  id: string
  title: string
  modules: Module[]
}

export function EnhancedStudyArea({ courseId, title }: EnhancedStudyAreaProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNotes, setShowNotes] = useState(false)

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId || !user?.email) return
      
      setLoading(true)
      setError(null)
      
      try {
        const courseResponse = await http<any>(`/api/courses/${courseId}`)
        
        // Fetch modules
        const modulesResponse = await http<any>(`/api/modules/course/${courseId}`)
        const modules = modulesResponse.items || []
        
        // Fetch lessons for each module
        const modulesWithLessons = await Promise.all(
          modules.map(async (module: any) => {
            try {
              const lessonsResponse = await http<any>(`/api/lessons/module/${module.id}`)
              return {
                ...module,
                lessons: lessonsResponse.items || []
              }
            } catch (err) {
              console.error(`Failed to fetch lessons for module ${module.id}:`, err)
              return {
                ...module,
                lessons: []
              }
            }
          })
        )
        
        const courseData = {
          ...courseResponse,
          modules: modulesWithLessons
        }
        
        setCourse(courseData)
      } catch (err: any) {
        setError(err.message || "Failed to load course")
      } finally {
        setLoading(false)
      }
    }
    
    fetchCourseData()
  }, [courseId, user?.email])

  // Use sequential learning hook
  const {
    currentModuleIndex,
    currentLessonIndex,
    completedLessons,
    accessibleLessons,
    contentCompletion,
    courseCompleted,
    courseCompletionPercentage,
    isAutoAdvancing,
    showCompletionCelebration,
    loading: progressLoading,
    navigateToLesson,
    navigateToNext,
    navigateToPrevious,
    markLessonCompleted,
    markCourseCompleted,
    updateVideoProgress,
    updateContentScroll,
    updateFileView,
    submitQuiz,
    resetContentCompletion,
    getCurrentLesson,
    getCurrentModule,
    isLessonAccessible,
    isLessonCompleted,
    isModuleAccessible,
    isModuleCompleted,
    isCurrentContentCompleted,
    hasNextLesson,
    hasPreviousLesson
  } = useSequentialLearning(course, courseId, user?.email || '')

  // Reset content completion when lesson changes
  useEffect(() => {
    resetContentCompletion()
  }, [currentModuleIndex, currentLessonIndex, resetContentCompletion])

  const currentLesson = getCurrentLesson()
  const currentModule = getCurrentModule()

  // Handle lesson completion
  const handleLessonCompletion = async () => {
    if (!currentLesson) return

    const isCompleted = isCurrentContentCompleted()
    if (!isCompleted) {
      toast({
        title: "Complete Requirements",
        description: "Please complete all lesson requirements before proceeding.",
        variant: "destructive"
      })
      return
    }

    const success = await markLessonCompleted(currentLesson.id, 0)
    if (success) {
      toast({
        title: "Lesson Completed! 🎉",
        description: `Great job completing "${currentLesson.title}"`,
      })

      // Auto-advance to next lesson after a short delay
      setTimeout(() => {
        if (hasNextLesson()) {
          navigateToNext()
          toast({
            title: "Moving to Next Lesson",
            description: "Automatically advancing to the next lesson...",
          })
        } else {
          // Check if all modules are completed
          const allModulesCompleted = course?.modules.every(module => 
            module.lessons.every(lesson => completedLessons.has(lesson.id))
          )
          
          if (allModulesCompleted) {
            toast({
              title: "All Modules Completed! 🏆",
              description: "You can now mark the course as complete to receive your certificate.",
            })
          }
        }
      }, 2000)
    }
  }

  // Handle course completion
  const handleMarkCourseComplete = async () => {
    if (!course) return

    const allModulesCompleted = course.modules.every(module => 
      module.lessons.every(lesson => completedLessons.has(lesson.id))
    )

    if (!allModulesCompleted) {
      toast({
        title: "Course Not Complete",
        description: "Please complete all modules and lessons before marking the course as complete.",
        variant: "destructive"
      })
      return
    }

    const success = await markCourseCompleted()
    if (success) {
      toast({
        title: "Course Completed! 🎓",
        description: `Congratulations! You've successfully completed "${course.title}". Your certificate is now available for download.`,
      })
    }
  }

  if (loading || progressLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading course content...</p>
        </GlassCard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <Target className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Course</h2>
          <p className="text-slate-300 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </GlassCard>
      </div>
    )
  }

  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <div className="text-slate-400 mb-4">
            <BookOpen className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No Content Available</h2>
          <p className="text-slate-300">This course doesn't have any content yet.</p>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="text-slate-300 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-white">{course.title}</h1>
                <p className="text-sm text-slate-400">
                  Module {currentModuleIndex + 1} • Lesson {currentLessonIndex + 1}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotes(!showNotes)}
                className="text-slate-300 hover:text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                Notes
              </Button>
              
              {courseCompleted && (
                <Button
                  onClick={handleMarkCourseComplete}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Award className="h-4 w-4 mr-2" />
                  Mark Course Complete
                </Button>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-slate-300 mb-2">
              <span>Course Progress</span>
              <span>{courseCompletionPercentage}%</span>
            </div>
            <Progress value={courseCompletionPercentage} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Course Structure */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Course Structure</h3>
              
              <div className="space-y-4">
                {course.modules.map((module, moduleIndex) => (
                  <div key={module.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        isModuleCompleted(module.id) ? 'bg-green-500' : 
                        isModuleAccessible(module.id) ? 'bg-blue-500' : 'bg-slate-500'
                      }`} />
                      <span className={`text-sm font-medium ${
                        isModuleCompleted(module.id) ? 'text-green-400' : 
                        isModuleAccessible(module.id) ? 'text-white' : 'text-slate-400'
                      }`}>
                        Module {moduleIndex + 1}: {module.title}
                      </span>
                    </div>
                    
                    <div className="ml-4 space-y-1">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <button
                          key={lesson.id}
                          onClick={() => navigateToLesson(moduleIndex, lessonIndex)}
                          disabled={!isLessonAccessible(lesson.id)}
                          className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                            currentModuleIndex === moduleIndex && currentLessonIndex === lessonIndex
                              ? 'bg-blue-600 text-white'
                              : isLessonCompleted(lesson.id)
                              ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                              : isLessonAccessible(lesson.id)
                              ? 'bg-slate-700/50 text-white hover:bg-slate-700'
                              : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isLessonCompleted(lesson.id) ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : isLessonAccessible(lesson.id) ? (
                              <Play className="h-4 w-4" />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                            <span className="truncate">{lesson.title}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <GlassCard className="p-8">
              {/* Lesson Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {currentLesson.type === 'video' && <Video className="h-5 w-5 text-blue-400" />}
                  {currentLesson.type === 'quiz' && <ClipboardList className="h-5 w-5 text-purple-400" />}
                  {currentLesson.type === 'text' && <FileText className="h-5 w-5 text-green-400" />}
                  {currentLesson.type === 'file' && <ExternalLink className="h-5 w-5 text-orange-400" />}
                  <span className="text-sm text-slate-400 capitalize">{currentLesson.type}</span>
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">{currentLesson.title}</h2>
                {currentLesson.description && (
                  <p className="text-slate-300">{currentLesson.description}</p>
                )}
              </div>

              {/* Content Renderer */}
              <div className="mb-8">
                {currentLesson.type === 'video' && currentLesson.content?.video?.url && (
                  <RestrictedVideoPlayer
                    src={currentLesson.content.video.url}
                    onProgress={(time, duration) => updateVideoProgress(time, duration)}
                    onComplete={() => {
                      toast({
                        title: "Video Completed",
                        description: "You can now proceed to the next lesson.",
                      })
                    }}
                  />
                )}

                {currentLesson.type === 'text' && currentLesson.content?.text_content && (
                  <div 
                    className="prose prose-invert max-w-none"
                    onScroll={(e) => {
                      const target = e.target as HTMLElement
                      const scrollPercentage = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100
                      updateContentScroll(scrollPercentage)
                    }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: currentLesson.content.text_content }} />
                  </div>
                )}

                {currentLesson.type === 'file' && currentLesson.content?.file?.url && (
                  <DocumentViewer
                    fileUrl={currentLesson.content.file.url}
                    fileName={currentLesson.content.file.name || 'Document'}
                    onView={(viewTime) => updateFileView(viewTime)}
                  />
                )}

                {currentLesson.type === 'quiz' && currentLesson.content?.quiz_questions && (
                  <QuizWithTimer
                    questions={currentLesson.content.quiz_questions}
                    timeLimit={currentLesson.content.time_limit}
                    passingScore={currentLesson.content.passing_score || 70}
                    onSubmit={(score, total, timeTaken) => {
                      const result = submitQuiz(score, total, currentLesson.content.passing_score || 70)
                      if (result.passed) {
                        toast({
                          title: "Quiz Passed! 🎉",
                          description: `You scored ${Math.round((score / total) * 100)}%`,
                        })
                      } else {
                        toast({
                          title: "Quiz Failed",
                          description: result.canRetry 
                            ? `You can retry. ${result.attemptsRemaining} attempts remaining.`
                            : "You've reached the maximum attempts. You can still proceed.",
                          variant: "destructive"
                        })
                      }
                    }}
                  />
                )}
              </div>

              {/* Completion Status */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-slate-300">Completion Status:</span>
                  {isCurrentContentCompleted() ? (
                    <Badge className="bg-green-600 text-white">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-slate-500 text-slate-400">
                      In Progress
                    </Badge>
                  )}
                </div>
                
                {currentLesson.type === 'video' && (
                  <div className="text-sm text-slate-400">
                    Watch Progress: {Math.round(contentCompletion.videoWatchPercentage)}%
                  </div>
                )}
                
                {currentLesson.type === 'text' && (
                  <div className="text-sm text-slate-400">
                    Scroll Progress: {Math.round(contentCompletion.contentScrollPercentage)}%
                  </div>
                )}
                
                {currentLesson.type === 'file' && (
                  <div className="text-sm text-slate-400">
                    View Progress: {Math.round(contentCompletion.fileViewPercentage)}%
                  </div>
                )}
                
                {currentLesson.type === 'quiz' && (
                  <div className="text-sm text-slate-400">
                    Attempts: {contentCompletion.quizAttempts}/2 | 
                    Score: {Math.round(contentCompletion.quizScore)}% | 
                    Passing: {contentCompletion.quizPassingScore}%
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={navigateToPrevious}
                  disabled={!hasPreviousLesson()}
                  className="border-slate-500 text-slate-300 hover:bg-slate-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <Button
                  onClick={handleLessonCompletion}
                  disabled={!isCurrentContentCompleted()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isCurrentContentCompleted() ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Lesson
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Complete Requirements
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={navigateToNext}
                  disabled={!hasNextLesson() || !isCurrentContentCompleted()}
                  className="border-slate-500 text-slate-300 hover:bg-slate-700"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Notes Panel */}
      {showNotes && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Study Notes</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotes(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ×
                </Button>
              </div>
              <InlineNotes
                courseId={courseId}
                lessonId={currentLesson.id}
                lessonTitle={currentLesson.title}
              />
            </div>
          </GlassCard>
        </div>
      )}

      {/* Completion Celebrations */}
      {showCompletionCelebration && (
        <CongratulationBalloon
          title="🎉 Module Completed!"
          message="Great job! You've completed this module. The next module is now unlocked."
          onClose={() => {
            // This will be handled by the hook internally
          }}
        />
      )}
    </div>
  )
}
