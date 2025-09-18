"use client"

import { motion } from "framer-motion"
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  loading: boolean
  success?: boolean
  error?: string | null
  children: React.ReactNode
  className?: string
}

export function LoadingState({ 
  loading, 
  success, 
  error, 
  children, 
  className 
}: LoadingStateProps) {
  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 text-blue-500"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading...</span>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("flex items-center gap-2 text-red-500 p-2", className)}
      >
        <XCircle className="h-4 w-4" />
        <span className="text-sm">{error}</span>
      </motion.div>
    )
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("flex items-center gap-2 text-green-500 p-2", className)}
      >
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">Success!</span>
      </motion.div>
    )
  }

  return <>{children}</>
}

interface OptimisticButtonProps {
  onClick: () => Promise<void>
  loading: boolean
  success?: boolean
  error?: string | null
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function OptimisticButton({
  onClick,
  loading,
  success,
  error,
  children,
  className,
  disabled
}: OptimisticButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-blue-500/20 flex items-center justify-center"
        >
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        </motion.div>
      )}
      
      {success && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 bg-green-500/20 flex items-center justify-center"
        >
          <CheckCircle className="h-4 w-4 text-green-500" />
        </motion.div>
      )}
      
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 bg-red-500/20 flex items-center justify-center"
        >
          <XCircle className="h-4 w-4 text-red-500" />
        </motion.div>
      )}
      
      <span className={cn(
        "transition-opacity duration-200",
        (loading || success || error) && "opacity-0"
      )}>
        {children}
      </span>
    </motion.button>
  )
}

interface OptimisticCardProps {
  loading: boolean
  success?: boolean
  error?: string | null
  children: React.ReactNode
  className?: string
}

export function OptimisticCard({
  loading,
  success,
  error,
  children,
  className
}: OptimisticCardProps) {
  return (
    <motion.div
      className={cn(
        "relative transition-all duration-200",
        loading && "opacity-70",
        success && "ring-2 ring-green-500/50",
        error && "ring-2 ring-red-500/50",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10"
        >
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </motion.div>
      )}
      
      {success && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-2 right-2 z-10"
        >
          <CheckCircle className="h-5 w-5 text-green-500" />
        </motion.div>
      )}
      
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-2 right-2 z-10"
        >
          <XCircle className="h-5 w-5 text-red-500" />
        </motion.div>
      )}
      
      {children}
    </motion.div>
  )
}

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "bg-gray-200 rounded",
            i === lines - 1 ? "w-3/4" : "w-full",
            "h-4 mb-2"
          )}
        />
      ))}
    </div>
  )
}

interface InlineLoadingProps {
  loading: boolean
  children: React.ReactNode
  className?: string
}

export function InlineLoading({ loading, children, className }: InlineLoadingProps) {
  return (
    <div className={cn("relative", className)}>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10"
        >
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        </motion.div>
      )}
      {children}
    </div>
  )
}
