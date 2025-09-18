import { useState, useEffect, useCallback } from 'react'
import { http } from '../http'
import { useToast } from '@/hooks/use-toast'

export interface Discussion {
  id: string
  title: string
  content: string
  course_id: string
  teacher_email: string
  created_at: string
  updated_at: string
  posts_count: number
  is_approved: boolean
  course?: {
    title: string
  }
  teacher?: {
    name: string
    email: string
  }
}

export interface DiscussionPost {
  id: string
  content: string
  discussion_id: string
  student_email: string
  created_at: string
  updated_at: string
  is_approved: boolean
  student?: {
    name: string
    email: string
  }
}

export interface CreateDiscussionData {
  title: string
  content: string
  course_id: string
}

export interface CreatePostData {
  content: string
  discussion_id: string
}

// Enhanced discussions hook with optimistic updates
export function useRealtimeDiscussions(courseId?: string) {
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchDiscussions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const endpoint = courseId ? `/api/discussions/course/${courseId}` : '/api/discussions'
      const response = await http<{ items: Discussion[] }>(endpoint)
      setDiscussions(response.items || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch discussions')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchDiscussions()
  }, [fetchDiscussions])

  const createDiscussion = useCallback(async (data: CreateDiscussionData) => {
    const tempId = `temp_${Date.now()}`
    const optimisticDiscussion: Discussion = {
      id: tempId,
      title: data.title,
      content: data.content,
      course_id: data.course_id,
      teacher_email: '', // Will be filled by backend
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      posts_count: 0,
      is_approved: false
    }
    
    setDiscussions(prev => [optimisticDiscussion, ...prev])
    
    try {
      const response = await http<Discussion>('/api/discussions', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      
      setDiscussions(prev => prev.map(d => d.id === tempId ? response : d))
      
      toast({
        title: "Discussion Created",
        description: `${response.title} has been created successfully`,
        duration: 3000,
      })
      
      return response
    } catch (err: any) {
      setDiscussions(prev => prev.filter(d => d.id !== tempId))
      setError(err.message || 'Failed to create discussion')
      
      toast({
        title: "Error",
        description: "Failed to create discussion",
        variant: "destructive",
        duration: 3000,
      })
      
      throw err
    }
  }, [toast])

  const updateDiscussion = useCallback(async (id: string, data: Partial<CreateDiscussionData>) => {
    const originalDiscussion = discussions.find(d => d.id === id)
    if (!originalDiscussion) throw new Error('Discussion not found')
    
    const optimisticDiscussion = { 
      ...originalDiscussion, 
      ...data, 
      updated_at: new Date().toISOString() 
    }
    setDiscussions(prev => prev.map(d => d.id === id ? optimisticDiscussion : d))
    
    try {
      const response = await http<Discussion>(`/api/discussions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
      
      setDiscussions(prev => prev.map(d => d.id === id ? response : d))
      
      toast({
        title: "Discussion Updated",
        description: `${response.title} has been updated successfully`,
        duration: 3000,
      })
      
      return response
    } catch (err: any) {
      setDiscussions(prev => prev.map(d => d.id === id ? originalDiscussion : d))
      setError(err.message || 'Failed to update discussion')
      
      toast({
        title: "Error",
        description: "Failed to update discussion",
        variant: "destructive",
        duration: 3000,
      })
      
      throw err
    }
  }, [discussions, toast])

  const deleteDiscussion = useCallback(async (id: string) => {
    const originalDiscussion = discussions.find(d => d.id === id)
    if (!originalDiscussion) throw new Error('Discussion not found')
    
    setDiscussions(prev => prev.filter(d => d.id !== id))
    
    try {
      await http(`/api/discussions/${id}`, { method: 'DELETE' })
      
      toast({
        title: "Discussion Deleted",
        description: `${originalDiscussion.title} has been deleted successfully`,
        duration: 3000,
      })
      
      return true
    } catch (err: any) {
      setDiscussions(prev => [originalDiscussion, ...prev])
      setError(err.message || 'Failed to delete discussion')
      
      toast({
        title: "Error",
        description: "Failed to delete discussion",
        variant: "destructive",
        duration: 3000,
      })
      
      throw err
    }
  }, [discussions, toast])

  return {
    discussions,
    loading,
    error,
    createDiscussion,
    updateDiscussion,
    deleteDiscussion,
    refetch: fetchDiscussions
  }
}

// Enhanced discussion posts hook with optimistic updates
export function useRealtimeDiscussionPosts(discussionId: string) {
  const [posts, setPosts] = useState<DiscussionPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchPosts = useCallback(async () => {
    if (!discussionId) return
    
    try {
      setLoading(true)
      setError(null)
      const response = await http<{ items: DiscussionPost[] }>(`/api/discussions/${discussionId}/posts`)
      setPosts(response.items || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch posts')
    } finally {
      setLoading(false)
    }
  }, [discussionId])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const createPost = useCallback(async (data: CreatePostData) => {
    const tempId = `temp_${Date.now()}`
    const optimisticPost: DiscussionPost = {
      id: tempId,
      content: data.content,
      discussion_id: data.discussion_id,
      student_email: '', // Will be filled by backend
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_approved: false
    }
    
    setPosts(prev => [optimisticPost, ...prev])
    
    try {
      const response = await http<DiscussionPost>(`/api/discussions/${data.discussion_id}/posts`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
      
      setPosts(prev => prev.map(p => p.id === tempId ? response : p))
      
      toast({
        title: "Post Created",
        description: "Your post has been submitted successfully",
        duration: 3000,
      })
      
      return response
    } catch (err: any) {
      setPosts(prev => prev.filter(p => p.id !== tempId))
      setError(err.message || 'Failed to create post')
      
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
        duration: 3000,
      })
      
      throw err
    }
  }, [toast])

  const updatePost = useCallback(async (postId: string, data: Partial<CreatePostData>) => {
    const originalPost = posts.find(p => p.id === postId)
    if (!originalPost) throw new Error('Post not found')
    
    const optimisticPost = { 
      ...originalPost, 
      ...data, 
      updated_at: new Date().toISOString() 
    }
    setPosts(prev => prev.map(p => p.id === postId ? optimisticPost : p))
    
    try {
      const response = await http<DiscussionPost>(`/api/discussions/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
      
      setPosts(prev => prev.map(p => p.id === postId ? response : p))
      
      toast({
        title: "Post Updated",
        description: "Your post has been updated successfully",
        duration: 3000,
      })
      
      return response
    } catch (err: any) {
      setPosts(prev => prev.map(p => p.id === postId ? originalPost : p))
      setError(err.message || 'Failed to update post')
      
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
        duration: 3000,
      })
      
      throw err
    }
  }, [posts, toast])

  const deletePost = useCallback(async (postId: string) => {
    const originalPost = posts.find(p => p.id === postId)
    if (!originalPost) throw new Error('Post not found')
    
    setPosts(prev => prev.filter(p => p.id !== postId))
    
    try {
      await http(`/api/discussions/posts/${postId}`, { method: 'DELETE' })
      
      toast({
        title: "Post Deleted",
        description: "Your post has been deleted successfully",
        duration: 3000,
      })
      
      return true
    } catch (err: any) {
      setPosts(prev => [originalPost, ...prev])
      setError(err.message || 'Failed to delete post')
      
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
        duration: 3000,
      })
      
      throw err
    }
  }, [posts, toast])

  return {
    posts,
    loading,
    error,
    createPost,
    updatePost,
    deletePost,
    refetch: fetchPosts
  }
}
