import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// Global state for real-time updates
interface GlobalSyncState {
  // Assignment updates
  assignmentUpdates: {
    [key: string]: {
      type: 'created' | 'updated' | 'deleted'
      data: any
      timestamp: number
    }
  }
  
  // Submission updates
  submissionUpdates: {
    [key: string]: {
      type: 'created' | 'updated' | 'graded'
      data: any
      timestamp: number
    }
  }
  
  // Discussion updates
  discussionUpdates: {
    [key: string]: {
      type: 'created' | 'updated' | 'deleted'
      data: any
      timestamp: number
    }
  }
  
  // Post updates
  postUpdates: {
    [key: string]: {
      type: 'created' | 'updated' | 'deleted'
      data: any
      timestamp: number
    }
  }
  
  // Course updates
  courseUpdates: {
    [key: string]: {
      type: 'created' | 'updated' | 'deleted'
      data: any
      timestamp: number
    }
  }
  
  // Enrollment updates
  enrollmentUpdates: {
    [key: string]: {
      type: 'enrolled' | 'unenrolled'
      data: any
      timestamp: number
    }
  }
  
  // Actions
  addAssignmentUpdate: (id: string, type: 'created' | 'updated' | 'deleted', data: any) => void
  addSubmissionUpdate: (id: string, type: 'created' | 'updated' | 'graded', data: any) => void
  addDiscussionUpdate: (id: string, type: 'created' | 'updated' | 'deleted', data: any) => void
  addPostUpdate: (id: string, type: 'created' | 'updated' | 'deleted', data: any) => void
  addCourseUpdate: (id: string, type: 'created' | 'updated' | 'deleted', data: any) => void
  addEnrollmentUpdate: (id: string, type: 'enrolled' | 'unenrolled', data: any) => void
  
  // Cleanup
  clearUpdates: () => void
  clearOldUpdates: () => void
}

export const useGlobalSync = create<GlobalSyncState>()(
  subscribeWithSelector((set, get) => ({
    assignmentUpdates: {},
    submissionUpdates: {},
    discussionUpdates: {},
    postUpdates: {},
    courseUpdates: {},
    enrollmentUpdates: {},
    
    addAssignmentUpdate: (id, type, data) => {
      set(state => ({
        assignmentUpdates: {
          ...state.assignmentUpdates,
          [id]: { type, data, timestamp: Date.now() }
        }
      }))
    },
    
    addSubmissionUpdate: (id, type, data) => {
      set(state => ({
        submissionUpdates: {
          ...state.submissionUpdates,
          [id]: { type, data, timestamp: Date.now() }
        }
      }))
    },
    
    addDiscussionUpdate: (id, type, data) => {
      set(state => ({
        discussionUpdates: {
          ...state.discussionUpdates,
          [id]: { type, data, timestamp: Date.now() }
        }
      }))
    },
    
    addPostUpdate: (id, type, data) => {
      set(state => ({
        postUpdates: {
          ...state.postUpdates,
          [id]: { type, data, timestamp: Date.now() }
        }
      }))
    },
    
    addCourseUpdate: (id, type, data) => {
      set(state => ({
        courseUpdates: {
          ...state.courseUpdates,
          [id]: { type, data, timestamp: Date.now() }
        }
      }))
    },
    
    addEnrollmentUpdate: (id, type, data) => {
      set(state => ({
        enrollmentUpdates: {
          ...state.enrollmentUpdates,
          [id]: { type, data, timestamp: Date.now() }
        }
      }))
    },
    
    clearUpdates: () => {
      set({
        assignmentUpdates: {},
        submissionUpdates: {},
        discussionUpdates: {},
        postUpdates: {},
        courseUpdates: {},
        enrollmentUpdates: {}
      })
    },
    
    clearOldUpdates: () => {
      const now = Date.now()
      const maxAge = 5 * 60 * 1000 // 5 minutes
      
      set(state => {
        const filterOld = (updates: any) => 
          Object.fromEntries(
            Object.entries(updates).filter(([_, update]: [string, any]) => 
              now - update.timestamp < maxAge
            )
          )
        
        return {
          assignmentUpdates: filterOld(state.assignmentUpdates),
          submissionUpdates: filterOld(state.submissionUpdates),
          discussionUpdates: filterOld(state.discussionUpdates),
          postUpdates: filterOld(state.postUpdates),
          courseUpdates: filterOld(state.courseUpdates),
          enrollmentUpdates: filterOld(state.enrollmentUpdates)
        }
      })
    }
  }))
)

// Auto-cleanup old updates every minute
if (typeof window !== 'undefined') {
  setInterval(() => {
    useGlobalSync.getState().clearOldUpdates()
  }, 60000)
}

// Hook for subscribing to specific update types
export function useSyncUpdates(type: keyof Omit<GlobalSyncState, 'addAssignmentUpdate' | 'addSubmissionUpdate' | 'addDiscussionUpdate' | 'addPostUpdate' | 'addCourseUpdate' | 'addEnrollmentUpdate' | 'clearUpdates' | 'clearOldUpdates'>) {
  return useGlobalSync(state => state[type])
}

// Hook for triggering updates
export function useSyncActions() {
  return useGlobalSync(state => ({
    addAssignmentUpdate: state.addAssignmentUpdate,
    addSubmissionUpdate: state.addSubmissionUpdate,
    addDiscussionUpdate: state.addDiscussionUpdate,
    addPostUpdate: state.addPostUpdate,
    addCourseUpdate: state.addCourseUpdate,
    addEnrollmentUpdate: state.addEnrollmentUpdate,
    clearUpdates: state.clearUpdates
  }))
}
