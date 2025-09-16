"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, X, CheckCircle, AlertCircle, Info, MessageSquare, BookOpen, Users, Activity, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/store/auth-store"
import { useNotificationStore } from "@/store/notification-store"
import { http } from "@/services/http"

interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning' | 'announcement' | 'assignment' | 'course' | 'live' | 'grade' | 'deadline' | 'enrollment' | 'module_completed' | 'course_completed' | 'quiz_available' | 'live_session' | 'message' | 'system' | 'discussion' | 'live_class'
  timestamp: string
  read: boolean
  courseTitle?: string
  courseId?: string
  metadata?: any
}

export function NotificationSystem() {
  const { user } = useAuthStore()
  const { 
    notifications, 
    unreadCount, 
    showNotificationCenter, 
    setShowNotificationCenter,
    markAsRead, 
    markAllAsRead, 
    removeNotification,
    addNotification,
    addNotificationSilent
  } = useNotificationStore()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Fetch real notifications from API
  const fetchNotifications = async () => {
    if (!user?.email || !user?.role) {
      console.log('Skipping notification fetch - user not authenticated:', { email: user?.email, role: user?.role })
      return
    }

    // Check if we have a valid auth token
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null
    if (!token) {
      console.log('Skipping notification fetch - no auth token')
      return
    }

    try {
      setLoading(true)
      console.log('Fetching notifications for user:', user.email)
      const response = await http<{ items: Notification[] }>(`/api/notifications/me`)
      const fetchedNotifications = response.items || []
      
      // Transform API data to match our interface and filter out inappropriate notifications
      const transformedNotifications = fetchedNotifications
        .filter((notification: any) => {
          // Filter out old signup notifications that shouldn't be shown repeatedly
          const isOldSignup = notification.type === 'signup' || notification.type === 'teacher_signup'
          const isOld = notification.created_at && new Date(notification.created_at) < new Date(Date.now() - 24 * 60 * 60 * 1000) // Older than 24 hours
          
          // Don't show old signup notifications
          if (isOldSignup && isOld) {
            return false
          }
          
          return true
        })
        .map((notification: any) => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type || 'info',
          timestamp: notification.created_at || notification.timestamp,
          read: notification.read || false,
          courseTitle: notification.course_title,
          courseId: notification.course_id,
          metadata: notification.metadata
        }))
      
      // Add notifications to store (without showing toast for old notifications)
      transformedNotifications.forEach(notification => {
        // Check if notification already exists to avoid duplicates
        const exists = notifications.some(n => n.id === notification.id)
        if (!exists) {
          // Add to store silently (these are old notifications from database)
          addNotificationSilent({
            type: notification.type as any,
            title: notification.title,
            message: notification.message,
            actionUrl: notification.courseId ? `/student/course/${notification.courseId}` : undefined,
            metadata: {
              courseId: notification.courseId,
              courseTitle: notification.courseTitle,
              ...notification.metadata
            }
          })
        }
      })
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        user: user?.email,
        apiBase: process.env.NEXT_PUBLIC_API_BASE
      })
      // Don't show error toast for notification fetching failures
      // as it might be due to network issues or missing API endpoint
      // Keep existing notifications if API fails
      console.log('Notification fetch failed, keeping existing notifications')
    } finally {
      setLoading(false)
    }
  }

  // Mark notification as read (using store function)
  const handleMarkAsRead = async (id: string) => {
    try {
      await http(`/api/notifications/me`, {
        method: 'PUT',
        body: JSON.stringify({
          notificationId: id,
          action: 'mark_read'
        })
      })
      markAsRead(id)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      // Update locally even if API fails
      markAsRead(id)
    }
  }

  // Mark all as read (using store function)
  const handleMarkAllAsRead = async () => {
    try {
      await http(`/api/notifications/me`, {
        method: 'PUT',
        body: JSON.stringify({
          action: 'mark_all_read'
        })
      })
      markAllAsRead()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      // Update locally even if API fails
      markAllAsRead()
    }
  }

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    if (user?.email && user?.role) {
      // Add a small delay to ensure user is fully authenticated
      const timer = setTimeout(() => {
        fetchNotifications()
      }, 1000)
      
      // Poll for new notifications every 60 seconds (reduced frequency)
      const interval = setInterval(fetchNotifications, 60000)
      
      return () => {
        clearTimeout(timer)
        clearInterval(interval)
      }
    }
  }, [user?.email, user?.role]) // Only depend on email, not the entire user object

  // Show toast for new notifications (only for very recent ones)
  useEffect(() => {
    const newNotifications = notifications.filter(n => 
      !n.read && 
      new Date(n.timestamp) > new Date(Date.now() - 10000) // Only show toasts for notifications less than 10 seconds old
    )
    
    newNotifications.forEach(notification => {
      // Don't show toast for system notifications or old signup notifications
      if (notification.type !== 'system' && 
          !notification.title.includes('Account successfully created') &&
          !notification.title.includes('Welcome')) {
        toast({
          title: notification.title,
          description: notification.message,
          duration: 5000,
        })
      }
    })
  }, [notifications, toast])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-400" />
      case 'announcement':
        return <Bell className="h-4 w-4 text-purple-400" />
      case 'assignment':
        return <BookOpen className="h-4 w-4 text-orange-400" />
      case 'course':
        return <BookOpen className="h-4 w-4 text-blue-400" />
      case 'live':
      case 'live_session':
        return <Activity className="h-4 w-4 text-green-400" />
      case 'grade':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'deadline':
        return <AlertCircle className="h-4 w-4 text-red-400" />
      case 'enrollment':
        return <Users className="h-4 w-4 text-blue-400" />
      case 'module_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'course_completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'quiz_available':
        return <BookOpen className="h-4 w-4 text-blue-500" />
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-400" />
      case 'system':
        return <Info className="h-4 w-4 text-gray-400" />
      default:
        return <Info className="h-4 w-4 text-gray-400" />
    }
  }

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white'
      case 'error':
        return 'bg-red-500 text-white'
      case 'warning':
        return 'bg-yellow-500 text-white'
      case 'info':
        return 'bg-blue-500 text-white'
      case 'announcement':
        return 'bg-purple-500 text-white'
      case 'assignment':
        return 'bg-orange-500 text-white'
      case 'course':
        return 'bg-blue-500 text-white'
      case 'live':
        return 'bg-green-500 text-white'
      case 'grade':
        return 'bg-green-500 text-white'
      case 'deadline':
        return 'bg-red-500 text-white'
      case 'enrollment':
        return 'bg-blue-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return time.toLocaleDateString()
  }

  return (
    <div className="fixed top-4 right-4 z-[9999999] isolate">
      {/* Notification Badge - Positioned over navbar bell */}
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute -top-1 -right-1 z-10"
        >
          <Badge 
            className={`h-4 w-4 rounded-full p-0 text-xs flex items-center justify-center ${
              getNotificationBadgeColor('default')
            }`}
          >
            <motion.span
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [1, 0.8, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          </Badge>
        </motion.div>
      )}

      {/* Enhanced Notification Panel - Fixed overlay positioning */}
      <AnimatePresence>
        {showNotificationCenter && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999998]"
              style={{ zIndex: 9999998 }}
              onClick={() => setShowNotificationCenter(false)}
            />
            
            {/* Notification Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed right-4 top-20 w-80 bg-slate-800/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl overflow-hidden"
              style={{ zIndex: 9999999 }}
            >
              {/* Panel Header */}
              <div className="p-4 border-b border-white/10 bg-gradient-to-r from-slate-800 to-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-400" />
                    <h3 className="text-white font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <Badge className="bg-blue-500 text-white text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleMarkAllAsRead}
                        className="text-slate-400 hover:text-white text-xs"
                      >
                        Mark all read
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowNotificationCenter(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications yet</p>
                    <p className="text-xs">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`p-4 hover:bg-white/5 transition-colors duration-200 cursor-pointer ${
                          !notification.read ? 'bg-blue-500/10 border-l-2 border-blue-500' : ''
                        }`}
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium text-white truncate">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 line-clamp-2 mb-2">
                              {notification.message}
                            </p>
                            {(notification.metadata as any)?.courseTitle && (
                              <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                                <BookOpen className="h-3 w-3" />
                                <span>{(notification.metadata as any).courseTitle}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Clock className="h-3 w-3" />
                              <span>{formatTimestamp(typeof notification.timestamp === 'string' ? notification.timestamp : notification.timestamp.toString())}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Panel Footer */}
              {notifications.length > 0 && (
                <div className="p-4 border-t border-white/10 bg-gradient-to-r from-slate-700 to-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
                    <span>{unreadCount} unread</span>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
