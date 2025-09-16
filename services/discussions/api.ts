import { http } from "../http"
import { useAuthStore } from "@/store/auth-store"

export type Discussion = {
  id: string
  course_id: string
  title: string
  description?: string
  created_by: string
  creator_name?: string
  creator_email?: string
  is_pinned: boolean
  is_locked: boolean
  allow_student_posts: boolean
  require_approval: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  posts_count?: number
  course_title?: string
}

export type DiscussionPost = {
  id: string
  discussion_id: string
  author_email: string
  author_name?: string
  author_role: string
  content: string
  parent_post_id?: string
  is_approved: boolean
  created_at: string
  updated_at: string
}

const getHeadersWithUserEmail = () => {
  const { user } = useAuthStore.getState()
  return {
    'x-user-email': user?.email || '',
    'x-user-role': user?.role || ''
  }
}

export const DiscussionsService = {
  async getByCourse(course_id: string): Promise<Discussion[]> {
    const response = await http<{ items: Discussion[] }>(`/api/discussions/course/${course_id}`, {
      headers: getHeadersWithUserEmail()
    })
    return response.items
  },

  async create(data: {
    course_id: string
    title: string
    description?: string
    allow_student_posts?: boolean
    require_approval?: boolean
  }): Promise<Discussion> {
    const response = await http<Discussion>('/api/discussions', {
      method: 'POST',
      headers: getHeadersWithUserEmail(),
      body: data
    })
    return response
  },

  async getById(discussion_id: string): Promise<{ discussion: Discussion; posts: DiscussionPost[] }> {
    const response = await http<{ discussion: Discussion; posts: DiscussionPost[] }>(`/api/discussions/${discussion_id}`, {
      headers: getHeadersWithUserEmail()
    })
    return response
  },

  async createPost(discussion_id: string, data: {
    content: string
    parent_post_id?: string
  }): Promise<DiscussionPost> {
    const response = await http<DiscussionPost>(`/api/discussions/${discussion_id}/posts`, {
      method: 'POST',
      headers: getHeadersWithUserEmail(),
      body: data
    })
    return response
  },

  async approvePost(post_id: string, is_approved: boolean): Promise<DiscussionPost> {
    const response = await http<DiscussionPost>(`/api/discussions/posts/${post_id}/approve`, {
      method: 'POST',
      headers: getHeadersWithUserEmail(),
      body: { is_approved }
    })
    return response
  },

  async deletePost(post_id: string): Promise<void> {
    await http(`/api/discussions/posts/${post_id}`, {
      method: 'DELETE',
      headers: getHeadersWithUserEmail()
    })
  },

  async getStats(discussion_id: string): Promise<{
    total_posts: number
    unique_participants: number
    teacher_posts: number
    student_posts: number
    approved_posts: number
    pending_posts: number
  }> {
    const response = await http<{
      total_posts: number
      unique_participants: number
      teacher_posts: number
      student_posts: number
      approved_posts: number
      pending_posts: number
    }>(`/api/discussions/${discussion_id}/stats`, {
      headers: getHeadersWithUserEmail()
    })
    return response
  }
}
