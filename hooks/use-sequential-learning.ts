"use client"

import { useState, useEffect, useCallback } from 'react'
import { ProgressAPI } from '@/services/progress/api'
import { CertificateAPI } from '@/services/certificates/api'
import { useToast } from '@/hooks/use-toast'

interface Lesson {
  id: string
  title: string
  type: string
  content: any
  description?: string
  duration: number
  points: number
  position: number
  is_completed?: boolean
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
  position: number
  is_completed?: boolean
}

interface Course {
  id: string
  title: string
  modules: Module[]
  is_completed?: boolean
}

interface ContentCompletionState {
  // Video tracking
  videoWatched: boolean
  videoWatchTime: number
  videoDuration: number
  videoWatchPercentage: number
  
  // Quiz tracking
  quizCompleted: boolean
  quizAttempts: number
  quizPassed: boolean
  quizScore: number
  quizPassingScore: number
  
  // Text content tracking
  contentRead: boolean
  contentReadTime: number
  contentScrollPercentage: number
  
  // File tracking
  fileViewed: boolean
  fileViewTime: number
  fileViewPercentage: number
}

interface SequentialLearningState {
  // Current position
  currentModuleIndex: number
  currentLessonIndex: number
  currentContentIndex: number
  
  // Completion tracking
  completedLessons: Set<string>
  completedModules: Set<string>
  accessibleLessons: Set<string>
  accessibleModules: Set<string>
  
  // Content completion
  contentCompletion: ContentCompletionState
  
  // Course completion
  courseCompleted: boolean
  courseCompletionPercentage: number
  
  // Auto-advance
  isAutoAdvancing: boolean
  showCompletionCelebration: boolean
}

export function useSequentialLearning(
  course: Course | null,
  courseId: string,
  userEmail: string
) {
  const { toast } = useToast()
  
  const [state, setState] = useState<SequentialLearningState>({
    currentModuleIndex: 0,
    currentLessonIndex: 0,
    currentContentIndex: 0,
    completedLessons: new Set(),
    completedModules: new Set(),
    accessibleLessons: new Set(),
    accessibleModules: new Set(),
    contentCompletion: {
      videoWatched: false,
      videoWatchTime: 0,
      videoDuration: 0,
      videoWatchPercentage: 0,
      quizCompleted: false,
      quizAttempts: 0,
      quizPassed: false,
      quizScore: 0,
      quizPassingScore: 70, // Default passing score
      contentRead: false,
      contentReadTime: 0,
      contentScrollPercentage: 0,
      fileViewed: false,
      fileViewTime: 0,
      fileViewPercentage: 0
    },
    courseCompleted: false,
    courseCompletionPercentage: 0,
    isAutoAdvancing: false,
    showCompletionCelebration: false
  })

  const [loading, setLoading] = useState(true)
  const [courseProgress, setCourseProgress] = useState<any>(null)

  // Fetch course progress and determine accessible content
  useEffect(() => {
    const fetchProgress = async () => {
      if (!course || !courseId || !userEmail) return

      setLoading(true)
      try {
        const progress = await ProgressAPI.getCourseProgress(courseId)
        setCourseProgress(progress)

        // Get completed lessons and modules
        const completedLessons = new Set<string>()
        const completedModules = new Set<string>()
        const accessibleLessons = new Set<string>()
        const accessibleModules = new Set<string>()

        if (progress?.detailedProgress) {
          progress.detailedProgress.forEach((p: any) => {
            if (p.type === 'lesson_completed' && p.status === 'completed') {
              completedLessons.add(p.lesson_id)
            }
            if (p.type === 'module_completed' && p.status === 'completed') {
              completedModules.add(p.module_id)
            }
          })
        }

        // Determine accessible content (sequential unlocking)
        let foundFirstIncomplete = false
        
        for (let moduleIndex = 0; moduleIndex < course.modules.length; moduleIndex++) {
          const module = course.modules[moduleIndex]
          
          // Check if previous module is completed
          if (moduleIndex === 0 || completedModules.has(course.modules[moduleIndex - 1].id)) {
            accessibleModules.add(module.id)
            
            for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex++) {
              const lesson = module.lessons[lessonIndex]
              
              if (!foundFirstIncomplete) {
                // First lesson is always accessible
                if (moduleIndex === 0 && lessonIndex === 0) {
                  accessibleLessons.add(lesson.id)
                } else {
                  // Check if previous lesson is completed
                  const prevLesson = getPreviousLesson(course, moduleIndex, lessonIndex)
                  if (prevLesson && completedLessons.has(prevLesson.id)) {
                    accessibleLessons.add(lesson.id)
                  } else {
                    foundFirstIncomplete = true
                    break
                  }
                }
              }
            }
          }
          
          if (foundFirstIncomplete) break
        }

        // Calculate course completion percentage
        const totalLessons = course.modules.reduce((total, module) => total + module.lessons.length, 0)
        const completedCount = completedLessons.size
        const completionPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

        setState(prev => ({
          ...prev,
          completedLessons,
          completedModules,
          accessibleLessons,
          accessibleModules,
          courseCompletionPercentage: completionPercentage,
          courseCompleted: completionPercentage === 100
        }))

      } catch (error) {
        console.error('Error fetching course progress:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [course, courseId, userEmail])

  // Get the previous lesson in sequence
  const getPreviousLesson = (course: Course, moduleIndex: number, lessonIndex: number): Lesson | null => {
    if (lessonIndex > 0) {
      return course.modules[moduleIndex].lessons[lessonIndex - 1]
    } else if (moduleIndex > 0) {
      const prevModule = course.modules[moduleIndex - 1]
      return prevModule.lessons[prevModule.lessons.length - 1]
    }
    return null
  }

  // Get the next lesson in sequence
  const getNextLesson = (course: Course, moduleIndex: number, lessonIndex: number): { moduleIndex: number; lessonIndex: number; lesson: Lesson } | null => {
    if (lessonIndex < course.modules[moduleIndex].lessons.length - 1) {
      return {
        moduleIndex,
        lessonIndex: lessonIndex + 1,
        lesson: course.modules[moduleIndex].lessons[lessonIndex + 1]
      }
    } else if (moduleIndex < course.modules.length - 1) {
      return {
        moduleIndex: moduleIndex + 1,
        lessonIndex: 0,
        lesson: course.modules[moduleIndex + 1].lessons[0]
      }
    }
    return null
  }

  // Check if a lesson is accessible
  const isLessonAccessible = useCallback((lessonId: string): boolean => {
    return state.accessibleLessons.has(lessonId)
  }, [state.accessibleLessons])

  // Check if a lesson is completed
  const isLessonCompleted = useCallback((lessonId: string): boolean => {
    return state.completedLessons.has(lessonId)
  }, [state.completedLessons])

  // Check if a module is accessible
  const isModuleAccessible = useCallback((moduleId: string): boolean => {
    return state.accessibleModules.has(moduleId)
  }, [state.accessibleModules])

  // Check if a module is completed
  const isModuleCompleted = useCallback((moduleId: string): boolean => {
    return state.completedModules.has(moduleId)
  }, [state.completedModules])

  // Get current lesson
  const getCurrentLesson = useCallback((): Lesson | null => {
    if (!course || !course.modules[state.currentModuleIndex]) return null
    return course.modules[state.currentModuleIndex].lessons[state.currentLessonIndex] || null
  }, [course, state.currentModuleIndex, state.currentLessonIndex])

  // Get current module
  const getCurrentModule = useCallback((): Module | null => {
    if (!course || !course.modules[state.currentModuleIndex]) return null
    return course.modules[state.currentModuleIndex] || null
  }, [course, state.currentModuleIndex])

  // Navigate to a specific lesson (only if accessible)
  const navigateToLesson = useCallback((moduleIndex: number, lessonIndex: number) => {
    if (!course) return false

    const lesson = course.modules[moduleIndex]?.lessons[lessonIndex]
    if (!lesson || !isLessonAccessible(lesson.id)) {
      toast({
        title: "Lesson Locked",
        description: "Complete the previous lessons to unlock this lesson.",
        variant: "destructive"
      })
      return false
    }

    setState(prev => ({
      ...prev,
      currentModuleIndex: moduleIndex,
      currentLessonIndex: lessonIndex,
      currentContentIndex: 0
    }))
    return true
  }, [course, isLessonAccessible, toast])

  // Navigate to next lesson (auto-advance)
  const navigateToNext = useCallback(() => {
    if (!course) return false

    const next = getNextLesson(course, state.currentModuleIndex, state.currentLessonIndex)
    if (!next) return false

    setState(prev => ({
      ...prev,
      currentModuleIndex: next.moduleIndex,
      currentLessonIndex: next.lessonIndex,
      currentContentIndex: 0,
      isAutoAdvancing: true
    }))

    // Reset auto-advancing flag after a short delay
    setTimeout(() => {
      setState(prev => ({ ...prev, isAutoAdvancing: false }))
    }, 1000)

    return true
  }, [course, state.currentModuleIndex, state.currentLessonIndex])

  // Navigate to previous lesson (always allowed)
  const navigateToPrevious = useCallback(() => {
    if (!course) return false

    const prev = getPreviousLesson(course, state.currentModuleIndex, state.currentLessonIndex)
    if (!prev) return false

    // Find the module and lesson index of the previous lesson
    for (let moduleIndex = 0; moduleIndex < course.modules.length; moduleIndex++) {
      const module = course.modules[moduleIndex]
      for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex++) {
        if (module.lessons[lessonIndex].id === prev.id) {
          setState(prev => ({
            ...prev,
            currentModuleIndex: moduleIndex,
            currentLessonIndex: lessonIndex,
            currentContentIndex: 0
          }))
          return true
        }
      }
    }
    return false
  }, [course, state.currentModuleIndex, state.currentLessonIndex])

  // Content completion tracking
  const updateVideoProgress = useCallback((watchTime: number, duration: number) => {
    const percentage = duration > 0 ? (watchTime / duration) * 100 : 0
    const watched = percentage >= 95 // 95% watched to consider complete
    
    setState(prev => ({
      ...prev,
      contentCompletion: {
        ...prev.contentCompletion,
        videoWatchTime: watchTime,
        videoDuration: duration,
        videoWatchPercentage: percentage,
        videoWatched: watched
      }
    }))
  }, [])

  const updateContentScroll = useCallback((scrollPercentage: number) => {
    const read = scrollPercentage >= 90 // 90% scrolled to consider complete
    
    setState(prev => ({
      ...prev,
      contentCompletion: {
        ...prev.contentCompletion,
        contentScrollPercentage: scrollPercentage,
        contentRead: read
      }
    }))
  }, [])

  const updateFileView = useCallback((viewTime: number, totalTime: number = 10) => {
    const percentage = (viewTime / totalTime) * 100
    const viewed = viewTime >= totalTime
    
    setState(prev => ({
      ...prev,
      contentCompletion: {
        ...prev.contentCompletion,
        fileViewTime: viewTime,
        fileViewPercentage: percentage,
        fileViewed: viewed
      }
    }))
  }, [])

  const submitQuiz = useCallback((score: number, totalQuestions: number, passingScore: number = 70) => {
    const percentage = (score / totalQuestions) * 100
    const passed = percentage >= passingScore
    const completed = passed || state.contentCompletion.quizAttempts + 1 >= 2 // Max 2 attempts

    setState(prev => ({
      ...prev,
      contentCompletion: {
        ...prev.contentCompletion,
        quizAttempts: prev.contentCompletion.quizAttempts + 1,
        quizScore: percentage,
        quizPassed: passed,
        quizCompleted: completed,
        quizPassingScore: passingScore
      }
    }))

    return {
      passed,
      canRetry: !passed && state.contentCompletion.quizAttempts + 1 < 2,
      attemptsRemaining: 2 - (state.contentCompletion.quizAttempts + 1)
    }
  }, [state.contentCompletion.quizAttempts])

  // Check if current content is completed
  const isCurrentContentCompleted = useCallback((): boolean => {
    const currentLesson = getCurrentLesson()
    if (!currentLesson) return false

    const { contentCompletion } = state

    switch (currentLesson.type) {
      case 'video':
        return contentCompletion.videoWatched
      case 'quiz':
        return contentCompletion.quizCompleted && contentCompletion.quizPassed
      case 'text':
      case 'content':
        return contentCompletion.contentRead
      case 'file':
      case 'document':
        return contentCompletion.fileViewed
      default:
        // Mixed content - check if any content is completed
        if (currentLesson.content?.video?.url) {
          return contentCompletion.videoWatched
        }
        if (currentLesson.content?.quiz?.questions || currentLesson.content?.quiz_questions) {
          return contentCompletion.quizCompleted && contentCompletion.quizPassed
        }
        if (currentLesson.content?.text_content) {
          return contentCompletion.contentRead
        }
        if (currentLesson.content?.file_url || currentLesson.content?.file?.url) {
          return contentCompletion.fileViewed
        }
        return false
    }
  }, [state.contentCompletion, getCurrentLesson])

  // Mark lesson as completed and unlock next lesson
  const markLessonCompleted = useCallback(async (lessonId: string, timeSpentSeconds: number = 0) => {
    if (!course || !courseId) return false

    try {
      const currentLesson = getCurrentLesson()
      if (!currentLesson || currentLesson.id !== lessonId) return false

      // Record completion
      await ProgressAPI.recordLessonCompletion({
        courseId,
        moduleId: course.modules[state.currentModuleIndex].id,
        lessonId,
        lessonTitle: currentLesson.title,
        timeSpentSeconds
      })

      // Update local state
      setState(prev => {
        const newCompleted = new Set(prev.completedLessons)
        newCompleted.add(lessonId)

        const newAccessible = new Set(prev.accessibleLessons)
        
        // Unlock next lesson
        const next = getNextLesson(course, prev.currentModuleIndex, prev.currentLessonIndex)
        if (next) {
          newAccessible.add(next.lesson.id)
        }

        return {
          ...prev,
          completedLessons: newCompleted,
          accessibleLessons: newAccessible
        }
      })

      // Check if module is completed
      const currentModule = getCurrentModule()
      if (currentModule) {
        const allLessonsInModule = currentModule.lessons.map(l => l.id)
        const completedLessonsInModule = allLessonsInModule.filter(id => 
          state.completedLessons.has(id) || id === lessonId
        )
        
        if (completedLessonsInModule.length === allLessonsInModule.length) {
          // Module completed
          await markModuleCompleted(currentModule.id)
        }
      }

      // Refresh course progress
      const progress = await ProgressAPI.getCourseProgress(courseId)
      setCourseProgress(progress)

      return true
    } catch (error) {
      console.error('Error marking lesson as completed:', error)
      return false
    }
  }, [course, courseId, state.currentModuleIndex, state.currentLessonIndex, getCurrentLesson, getCurrentModule, state.completedLessons])

  // Mark module as completed
  const markModuleCompleted = useCallback(async (moduleId: string) => {
    if (!course || !courseId) return false

    try {
      await ProgressAPI.recordModuleCompletion({
        courseId,
        moduleId,
        moduleTitle: course.modules.find(m => m.id === moduleId)?.title || '',
        timeSpentSeconds: 0
      })

      setState(prev => {
        const newCompleted = new Set(prev.completedModules)
        newCompleted.add(moduleId)

        const newAccessible = new Set(prev.accessibleModules)
        
        // Unlock next module
        const currentModuleIndex = course.modules.findIndex(m => m.id === moduleId)
        if (currentModuleIndex < course.modules.length - 1) {
          const nextModule = course.modules[currentModuleIndex + 1]
          newAccessible.add(nextModule.id)
        }

        return {
          ...prev,
          completedModules: newCompleted,
          accessibleModules: newAccessible,
          showCompletionCelebration: true
        }
      })

      // Show module completion celebration
      toast({
        title: "Module Completed! 🎉",
        description: `Congratulations! You've completed the module.`,
      })

      return true
    } catch (error) {
      console.error('Error marking module as completed:', error)
      return false
    }
  }, [course, courseId, toast])

  // Mark course as completed
  const markCourseCompleted = useCallback(async () => {
    if (!course || !courseId) return false

    try {
      await ProgressAPI.recordCourseCompletion({
        courseId,
        courseTitle: course.title,
        completionPercentage: 100,
        timeSpentSeconds: 0
      })

      // Generate certificate if certificates are enabled for this course
      try {
        if (course.certificate_config?.enabled) {
          await CertificateAPI.autoGenerateCertificate(courseId)
        }
      } catch (certError) {
        console.error('Error generating certificate:', certError)
        // Don't fail the course completion if certificate generation fails
      }

      setState(prev => ({
        ...prev,
        courseCompleted: true,
        showCompletionCelebration: true
      }))

      // Show course completion celebration
      toast({
        title: "Course Completed! 🏆",
        description: `Congratulations! You've completed the entire course. Your certificate is now available.`,
      })

      return true
    } catch (error) {
      console.error('Error marking course as completed:', error)
      return false
    }
  }, [course, courseId, toast])

  // Check if there's a next lesson
  const hasNextLesson = useCallback((): boolean => {
    if (!course) return false
    return getNextLesson(course, state.currentModuleIndex, state.currentLessonIndex) !== null
  }, [course, state.currentModuleIndex, state.currentLessonIndex])

  // Check if there's a previous lesson
  const hasPreviousLesson = useCallback((): boolean => {
    if (!course) return false
    return getPreviousLesson(course, state.currentModuleIndex, state.currentLessonIndex) !== null
  }, [course, state.currentModuleIndex, state.currentLessonIndex])

  // Reset content completion state
  const resetContentCompletion = useCallback(() => {
    setState(prev => ({
      ...prev,
      contentCompletion: {
        videoWatched: false,
        videoWatchTime: 0,
        videoDuration: 0,
        videoWatchPercentage: 0,
        quizCompleted: false,
        quizAttempts: 0,
        quizPassed: false,
        quizScore: 0,
        quizPassingScore: 70,
        contentRead: false,
        contentReadTime: 0,
        contentScrollPercentage: 0,
        fileViewed: false,
        fileViewTime: 0,
        fileViewPercentage: 0
      }
    }))
  }, [])

  return {
    // State
    currentModuleIndex: state.currentModuleIndex,
    currentLessonIndex: state.currentLessonIndex,
    currentContentIndex: state.currentContentIndex,
    completedLessons: state.completedLessons,
    completedModules: state.completedModules,
    accessibleLessons: state.accessibleLessons,
    accessibleModules: state.accessibleModules,
    contentCompletion: state.contentCompletion,
    courseCompleted: state.courseCompleted,
    courseCompletionPercentage: state.courseCompletionPercentage,
    isAutoAdvancing: state.isAutoAdvancing,
    showCompletionCelebration: state.showCompletionCelebration,
    courseProgress,
    loading,

    // Actions
    navigateToLesson,
    navigateToNext,
    navigateToPrevious,
    markLessonCompleted,
    markModuleCompleted,
    markCourseCompleted,
    updateVideoProgress,
    updateContentScroll,
    updateFileView,
    submitQuiz,
    resetContentCompletion,

    // Getters
    getCurrentLesson,
    getCurrentModule,
    isLessonAccessible,
    isLessonCompleted,
    isModuleAccessible,
    isModuleCompleted,
    isCurrentContentCompleted,
    hasNextLesson,
    hasPreviousLesson
  }
}
