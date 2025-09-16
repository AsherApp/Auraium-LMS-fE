"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Link, 
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  readOnly?: boolean
  className?: string
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Start writing...", 
  readOnly = false,
  className = ""
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Only set initial content, don't update on every value change
  useEffect(() => {
    if (editorRef.current && !readOnly && !isInitialized) {
      editorRef.current.innerHTML = value || ''
      setIsInitialized(true)
    }
  }, [value, readOnly, isInitialized])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const execCommand = (command: string, value?: string) => {
    if (readOnly) return
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    updateValue()
  }

  const updateValue = useCallback(() => {
    if (editorRef.current && !readOnly) {
      const newValue = editorRef.current.innerHTML
      // Only call onChange if the value actually changed
      if (newValue !== value) {
        onChange(newValue)
      }
    }
  }, [onChange, value, readOnly])

  // Debounced version for typing
  const debouncedUpdateValue = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      updateValue()
    }, 100)
  }, [updateValue])

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
    updateValue()
  }

  const insertLink = () => {
    if (readOnly) return
    const url = prompt('Enter URL:')
    if (url) {
      execCommand('createLink', url)
    }
  }

  const insertImage = () => {
    if (readOnly) return
    const url = prompt('Enter image URL:')
    if (url) {
      execCommand('insertImage', url)
    }
  }

  const toolbarButtons = [
    { icon: Bold, command: 'bold', title: 'Bold' },
    { icon: Italic, command: 'italic', title: 'Italic' },
    { icon: Underline, command: 'underline', title: 'Underline' },
    { icon: Heading1, command: 'formatBlock', value: '<h1>', title: 'Heading 1' },
    { icon: Heading2, command: 'formatBlock', value: '<h2>', title: 'Heading 2' },
    { icon: Heading3, command: 'formatBlock', value: '<h3>', title: 'Heading 3' },
    { icon: List, command: 'insertUnorderedList', title: 'Bullet List' },
    { icon: ListOrdered, command: 'insertOrderedList', title: 'Numbered List' },
    { icon: Quote, command: 'formatBlock', value: '<blockquote>', title: 'Quote' },
    { icon: Code, command: 'formatBlock', value: '<pre>', title: 'Code Block' },
    { icon: AlignLeft, command: 'justifyLeft', title: 'Align Left' },
    { icon: AlignCenter, command: 'justifyCenter', title: 'Align Center' },
    { icon: AlignRight, command: 'justifyRight', title: 'Align Right' },
    { icon: Link, command: 'custom', action: insertLink, title: 'Insert Link' },
    { icon: Image, command: 'custom', action: insertImage, title: 'Insert Image' },
  ]

  return (
    <div className={`border border-white/10 rounded-lg bg-white/5 ${className}`}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-white/10 bg-white/5 rounded-t-lg">
          {toolbarButtons.map((button, index) => (
            <Button
              key={index}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (button.action) {
                  button.action()
                } else {
                  execCommand(button.command, button.value)
                }
              }}
              className="h-8 w-8 p-0 text-slate-300 hover:text-white hover:bg-white/10"
              title={button.title}
            >
              <button.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      )}
      
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={debouncedUpdateValue}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          rich-text-editor min-h-[300px] p-4 outline-none
          ${readOnly ? 'cursor-default' : 'cursor-text'}
          ${isFocused && !readOnly ? 'ring-2 ring-blue-500/50' : ''}
        `}
        style={{
          fontFamily: 'inherit',
          lineHeight: '1.6'
        }}
        data-placeholder={placeholder}
      />
      
      {/* Placeholder */}
      {!value && !readOnly && (
        <div className="absolute top-0 left-0 p-4 text-slate-400 pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  )
}

// Helper function to convert HTML to plain text
export function htmlToText(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

// Helper function to convert plain text to HTML
export function textToHtml(text: string): string {
  return text.replace(/\n/g, '<br>')
}
