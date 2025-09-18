import { useState, useEffect } from 'react'
import { ClassworkAPI, type Classwork } from './api'

export function useClasswork() {
  const [classwork, setClasswork] = useState<Classwork[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClasswork = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await ClassworkAPI.getAll()
      setClasswork(response.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch classwork')
      console.error('Failed to fetch classwork:', err)
    } finally {
      setLoading(false)
    }
  }

  const createClasswork = async (sessionId: string, data: {
    title: string
    description: string
    due_at?: string
  }) => {
    try {
      const newClasswork = await ClassworkAPI.create(sessionId, data)
      setClasswork(prev => [newClasswork, ...prev])
      return newClasswork
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create classwork')
      throw err
    }
  }

  const updateClasswork = async (classworkId: string, data: {
    title: string
    description: string
    due_at?: string
  }) => {
    try {
      const updatedClasswork = await ClassworkAPI.update(classworkId, data)
      setClasswork(prev => prev.map(item => 
        item.id === classworkId ? updatedClasswork : item
      ))
      return updatedClasswork
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update classwork')
      throw err
    }
  }

  const deleteClasswork = async (classworkId: string) => {
    try {
      await ClassworkAPI.delete(classworkId)
      setClasswork(prev => prev.filter(item => item.id !== classworkId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete classwork')
      throw err
    }
  }

  useEffect(() => {
    fetchClasswork()
  }, [])

  return {
    classwork,
    loading,
    error,
    createClasswork,
    updateClasswork,
    deleteClasswork,
    refetch: fetchClasswork
  }
}
