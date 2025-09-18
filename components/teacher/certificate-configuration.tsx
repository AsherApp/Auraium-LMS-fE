"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { http } from "@/services/http"
import { 
  Award, 
  Palette, 
  Upload, 
  Save, 
  Eye,
  Settings,
  FileText,
  Calendar,
  Clock,
  Star,
  Image,
  X,
  CheckCircle,
  AlertCircle
} from "lucide-react"

interface CertificateConfig {
  enabled: boolean
  template: string
  custom_template_url?: string
  custom_text: string
  signature: string
  logo_url: string
  background_color: string
  text_color: string
  border_color: string
  show_completion_date: boolean
  show_course_duration: boolean
  show_grade: boolean
  custom_fields: Array<{
    label: string
    value: string
  }>
  dynamic_tags: Array<{
    id: string
    tag: string
    x: number
    y: number
    fontSize: number
    color: string
    fontFamily: string
    fontWeight: string
  }>
}

interface CertificateConfigurationProps {
  courseId: string
  onSave?: (config: CertificateConfig) => void
}

const TEMPLATES = [
  { value: "default", label: "Default", description: "Clean and professional" },
  { value: "classic", label: "Classic", description: "Traditional academic style" },
  { value: "modern", label: "Modern", description: "Contemporary design" },
  { value: "minimal", label: "Minimal", description: "Simple and elegant" },
  { value: "custom", label: "Custom Template", description: "Upload your own design" }
]

const COLOR_PRESETS = [
  { name: "Blue", background: "#1e293b", text: "#ffffff", border: "#3b82f6" },
  { name: "Green", background: "#064e3b", text: "#ffffff", border: "#10b981" },
  { name: "Purple", background: "#581c87", text: "#ffffff", border: "#8b5cf6" },
  { name: "Red", background: "#7f1d1d", text: "#ffffff", border: "#ef4444" },
  { name: "Orange", background: "#9a3412", text: "#ffffff", border: "#f97316" }
]

const AVAILABLE_TAGS = [
  { value: "{{student_name}}", label: "Student Name", description: "Full name of the student" },
  { value: "{{student_email}}", label: "Student Email", description: "Email address of the student" },
  { value: "{{course_name}}", label: "Course Name", description: "Name of the completed course" },
  { value: "{{completion_date}}", label: "Completion Date", description: "Date when course was completed" },
  { value: "{{course_duration}}", label: "Course Duration", description: "Total time spent on course" },
  { value: "{{final_grade}}", label: "Final Grade", description: "Overall grade achieved" },
  { value: "{{teacher_name}}", label: "Teacher Name", description: "Name of the course instructor" },
  { value: "{{institution_name}}", label: "Institution Name", description: "Name of the institution" },
  { value: "{{certificate_id}}", label: "Certificate ID", description: "Unique certificate identifier" }
]

export function CertificateConfiguration({ courseId, onSave }: CertificateConfigurationProps) {
  const [config, setConfig] = useState<CertificateConfig>({
    enabled: false,
    template: "default",
    custom_text: "",
    signature: "",
    logo_url: "",
    background_color: "#1e293b",
    text_color: "#ffffff",
    border_color: "#3b82f6",
    show_completion_date: true,
    show_course_duration: false,
    show_grade: false,
    custom_fields: [],
    dynamic_tags: []
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [uploadingTemplate, setUploadingTemplate] = useState(false)
  const [templatePreview, setTemplatePreview] = useState<string | null>(null)
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [showTagEditor, setShowTagEditor] = useState(false)
  const [selectedTag, setSelectedTag] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchCertificateConfig()
  }, [courseId])

  const fetchCertificateConfig = async () => {
    try {
      setLoading(true)
      const response = await http<any>(`/api/courses/${courseId}`)
      const course = response
      
      if (course.certificate_config) {
        setConfig({ ...config, ...course.certificate_config })
      }
    } catch (error: any) {
      console.error('Error fetching certificate config:', error)
      toast({
        title: "Error",
        description: "Failed to load certificate configuration",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const saveCertificateConfig = async () => {
    try {
      setSaving(true)
      
      const response = await http<any>(`/api/courses/${courseId}`, {
        method: 'PUT',
        body: {
          certificate_config: config
        }
      })

      toast({
        title: "Certificate Configuration Saved",
        description: "Your certificate settings have been updated successfully.",
      })

      onSave?.(config)
    } catch (error: any) {
      console.error('Error saving certificate config:', error)
      toast({
        title: "Error",
        description: "Failed to save certificate configuration",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (updates: Partial<CertificateConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    updateConfig({
      background_color: preset.background,
      text_color: preset.text,
      border_color: preset.border
    })
  }

  const addCustomField = () => {
    updateConfig({
      custom_fields: [...config.custom_fields, { label: "", value: "" }]
    })
  }

  const removeCustomField = (index: number) => {
    updateConfig({
      custom_fields: config.custom_fields.filter((_, i) => i !== index)
    })
  }

  const updateCustomField = (index: number, field: "label" | "value", value: string) => {
    const newFields = [...config.custom_fields]
    newFields[index][field] = value
    updateConfig({ custom_fields: newFields })
  }

  const handleTemplateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setTemplateError('Please upload an image file (PNG, JPG, JPEG)')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setTemplateError('File size must be less than 10MB')
      return
    }

    setUploadingTemplate(true)
    setTemplateError(null)

    try {
      // Create a preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setTemplatePreview(result)
      }
      reader.readAsDataURL(file)

      // Upload to storage
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'certificate-template')
      formData.append('courseId', courseId)

      const response = await http<any>('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.url) {
        // Update config with custom template
        updateConfig({ 
          template: 'custom',
          custom_template_url: response.url
        })
        
        toast({
          title: "Template Uploaded",
          description: "Your custom certificate template has been uploaded successfully.",
        })
      }
    } catch (error: any) {
      console.error('Error uploading template:', error)
      setTemplateError(error.message || 'Failed to upload template')
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload template. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploadingTemplate(false)
    }
  }

  const removeCustomTemplate = () => {
    setTemplatePreview(null)
    setTemplateError(null)
    updateConfig({ 
      template: 'default',
      custom_template_url: ''
    })
  }

  const addDynamicTag = (tagValue: string) => {
    const newTag = {
      id: `tag_${Date.now()}`,
      tag: tagValue,
      x: 50,
      y: 50,
      fontSize: 16,
      color: config.text_color,
      fontFamily: 'Arial',
      fontWeight: 'normal'
    }
    updateConfig({
      dynamic_tags: [...config.dynamic_tags, newTag]
    })
    setSelectedTag(newTag)
    setShowTagEditor(true)
  }

  const updateDynamicTag = (tagId: string, updates: Partial<any>) => {
    const updatedTags = config.dynamic_tags.map(tag => 
      tag.id === tagId ? { ...tag, ...updates } : tag
    )
    updateConfig({ dynamic_tags: updatedTags })
  }

  const removeDynamicTag = (tagId: string) => {
    updateConfig({
      dynamic_tags: config.dynamic_tags.filter(tag => tag.id !== tagId)
    })
    if (selectedTag?.id === tagId) {
      setSelectedTag(null)
      setShowTagEditor(false)
    }
  }

  const getTagPreview = (tag: any) => {
    const tagInfo = AVAILABLE_TAGS.find(t => t.value === tag.tag)
    return tagInfo ? tagInfo.label : tag.tag
  }

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading certificate configuration...</p>
          </div>
        </div>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Award className="h-6 w-6 text-yellow-400" />
            Certificate Configuration
          </h2>
          <p className="text-slate-400 mt-1">Configure certificates for course completion</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="bg-white/10 text-white hover:bg-white/20 border-white/20"
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button
            onClick={saveCertificateConfig}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      </div>

      {previewMode ? (
        /* Certificate Preview */
        <GlassCard className="p-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-6">Certificate Preview</h3>
            <div 
              className="mx-auto w-full max-w-2xl aspect-[8.5/11] rounded-lg border-4 shadow-2xl"
              style={{
                backgroundColor: config.background_color,
                borderColor: config.border_color,
                color: config.text_color
              }}
            >
              <div className="p-8 h-full flex flex-col justify-between">
                {/* Header */}
                <div className="text-center">
                  <h1 className="text-3xl font-bold mb-4" style={{ color: config.border_color }}>
                    CERTIFICATE OF COMPLETION
                  </h1>
                  <p className="text-lg mb-8">This is to certify that</p>
                </div>

                {/* Student Name */}
                <div className="text-center">
                  <h2 className="text-4xl font-bold mb-4">John Doe</h2>
                  <p className="text-lg mb-8">has successfully completed the course</p>
                </div>

                {/* Course Title */}
                <div className="text-center">
                  <h3 className="text-2xl font-semibold mb-4" style={{ color: config.border_color }}>
                    "Introduction to Programming"
                  </h3>
                  {config.custom_text && (
                    <p className="text-lg mb-4">{config.custom_text}</p>
                  )}
                </div>

                {/* Details */}
                <div className="text-center space-y-2">
                  {config.show_completion_date && (
                    <p className="text-lg">Completed on: {new Date().toLocaleDateString()}</p>
                  )}
                  {config.show_course_duration && (
                    <p className="text-lg">Course Duration: 8 weeks</p>
                  )}
                  {config.show_grade && (
                    <p className="text-lg">Final Grade: 95%</p>
                  )}
                </div>

                {/* Custom Fields */}
                {config.custom_fields.map((field, index) => (
                  <div key={index} className="text-center">
                    <p className="text-lg">{field.label}: {field.value}</p>
                  </div>
                ))}

                {/* Signature */}
                <div className="text-center mt-8">
                  <div className="border-t-2 w-48 mx-auto mb-2" style={{ borderColor: config.border_color }}></div>
                  <p className="text-lg font-semibold">{config.signature || 'AuraiumLMS'}</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      ) : (
        /* Configuration Form */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Settings */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Basic Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enabled" className="text-slate-300">Enable Certificates</Label>
                <Switch
                  id="enabled"
                  checked={config.enabled}
                  onCheckedChange={(checked) => updateConfig({ enabled: checked })}
                />
              </div>

              <div>
                <Label htmlFor="template" className="text-slate-300">Certificate Template</Label>
                <Select value={config.template} onValueChange={(value) => updateConfig({ template: value })}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {TEMPLATES.map((template) => (
                      <SelectItem key={template.value} value={template.value} className="bg-slate-800 hover:bg-slate-700 text-white">
                        <div>
                          <div className="font-medium">{template.label}</div>
                          <div className="text-sm text-slate-400">{template.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Template Upload */}
              {config.template === 'custom' && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Upload Custom Template</Label>
                    <p className="text-sm text-slate-400 mb-3">
                      Upload an A4 or Letter-sized template (PNG, JPG, JPEG). Max 10MB.
                    </p>
                    
                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-slate-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleTemplateUpload}
                        className="hidden"
                        id="template-upload"
                        disabled={uploadingTemplate}
                      />
                      <label
                        htmlFor="template-upload"
                        className="cursor-pointer flex flex-col items-center gap-3"
                      >
                        {uploadingTemplate ? (
                          <div className="flex items-center gap-2 text-blue-400">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                            <span>Uploading...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-slate-400" />
                            <div>
                              <p className="text-white font-medium">Click to upload template</p>
                              <p className="text-sm text-slate-400">A4 or Letter size recommended</p>
                            </div>
                          </>
                        )}
                      </label>
                    </div>

                    {templateError && (
                      <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                        <AlertCircle className="h-4 w-4" />
                        {templateError}
                      </div>
                    )}

                    {templatePreview && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-slate-300">Template Preview</Label>
                          <Button
                            onClick={removeCustomTemplate}
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="border border-slate-600 rounded-lg p-4 bg-slate-800/30">
                          <img
                            src={templatePreview}
                            alt="Template preview"
                            className="max-w-full h-auto max-h-64 mx-auto rounded"
                          />
                          <div className="flex items-center gap-2 text-green-400 text-sm mt-2">
                            <CheckCircle className="h-4 w-4" />
                            Template uploaded successfully
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dynamic Tags Section */}
              {config.template === 'custom' && templatePreview && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-slate-300">Dynamic Tags</Label>
                      <Button
                        onClick={() => setShowTagEditor(!showTagEditor)}
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        {showTagEditor ? 'Hide Editor' : 'Show Editor'}
                      </Button>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">
                      Add dynamic tags that will automatically populate with student data during certificate generation.
                    </p>

                    {/* Available Tags */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {AVAILABLE_TAGS.map((tag) => (
                        <Button
                          key={tag.value}
                          onClick={() => addDynamicTag(tag.value)}
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700 text-left justify-start"
                        >
                          <FileText className="h-3 w-3 mr-2" />
                          <div>
                            <div className="font-medium text-xs">{tag.label}</div>
                            <div className="text-xs text-slate-400">{tag.description}</div>
                          </div>
                        </Button>
                      ))}
                    </div>

                    {/* Current Tags */}
                    {config.dynamic_tags.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-slate-300">Current Tags</Label>
                        {config.dynamic_tags.map((tag) => (
                          <div
                            key={tag.id}
                            className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-600"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: tag.color }}
                              />
                              <div>
                                <div className="text-white font-medium">{getTagPreview(tag)}</div>
                                <div className="text-sm text-slate-400">
                                  Position: {tag.x}%, {tag.y}% | Size: {tag.fontSize}px
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => {
                                  setSelectedTag(tag)
                                  setShowTagEditor(true)
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => removeDynamicTag(tag.id)}
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tag Editor */}
                    {showTagEditor && selectedTag && (
                      <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-600">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-white font-medium">Edit Tag: {getTagPreview(selectedTag)}</h4>
                          <Button
                            onClick={() => {
                              setSelectedTag(null)
                              setShowTagEditor(false)
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-slate-300 text-sm">X Position (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={selectedTag.x}
                              onChange={(e) => {
                                const updatedTag = { ...selectedTag, x: parseInt(e.target.value) }
                                setSelectedTag(updatedTag)
                                updateDynamicTag(selectedTag.id, { x: parseInt(e.target.value) })
                              }}
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-300 text-sm">Y Position (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={selectedTag.y}
                              onChange={(e) => {
                                const updatedTag = { ...selectedTag, y: parseInt(e.target.value) }
                                setSelectedTag(updatedTag)
                                updateDynamicTag(selectedTag.id, { y: parseInt(e.target.value) })
                              }}
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-300 text-sm">Font Size (px)</Label>
                            <Input
                              type="number"
                              min="8"
                              max="72"
                              value={selectedTag.fontSize}
                              onChange={(e) => {
                                const updatedTag = { ...selectedTag, fontSize: parseInt(e.target.value) }
                                setSelectedTag(updatedTag)
                                updateDynamicTag(selectedTag.id, { fontSize: parseInt(e.target.value) })
                              }}
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-300 text-sm">Text Color</Label>
                            <Input
                              type="color"
                              value={selectedTag.color}
                              onChange={(e) => {
                                const updatedTag = { ...selectedTag, color: e.target.value }
                                setSelectedTag(updatedTag)
                                updateDynamicTag(selectedTag.id, { color: e.target.value })
                              }}
                              className="bg-slate-700 border-slate-600 text-white h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-300 text-sm">Font Family</Label>
                            <Select
                              value={selectedTag.fontFamily}
                              onValueChange={(value) => {
                                const updatedTag = { ...selectedTag, fontFamily: value }
                                setSelectedTag(updatedTag)
                                updateDynamicTag(selectedTag.id, { fontFamily: value })
                              }}
                            >
                              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Arial">Arial</SelectItem>
                                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                                <SelectItem value="Helvetica">Helvetica</SelectItem>
                                <SelectItem value="Georgia">Georgia</SelectItem>
                                <SelectItem value="Verdana">Verdana</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-slate-300 text-sm">Font Weight</Label>
                            <Select
                              value={selectedTag.fontWeight}
                              onValueChange={(value) => {
                                const updatedTag = { ...selectedTag, fontWeight: value }
                                setSelectedTag(updatedTag)
                                updateDynamicTag(selectedTag.id, { fontWeight: value })
                              }}
                            >
                              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="bold">Bold</SelectItem>
                                <SelectItem value="lighter">Light</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="custom_text" className="text-slate-300">Custom Text</Label>
                <Textarea
                  id="custom_text"
                  value={config.custom_text}
                  onChange={(e) => updateConfig({ custom_text: e.target.value })}
                  placeholder="Additional text to include on the certificate..."
                  className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-400"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="signature" className="text-slate-300">Signature/Authority</Label>
                <Input
                  id="signature"
                  value={config.signature}
                  onChange={(e) => updateConfig({ signature: e.target.value })}
                  placeholder="Your name or institution"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-400"
                />
              </div>
            </div>
          </GlassCard>

          {/* Display Options */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Display Options</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <Label htmlFor="show_completion_date" className="text-slate-300">Show Completion Date</Label>
                </div>
                <Switch
                  id="show_completion_date"
                  checked={config.show_completion_date}
                  onCheckedChange={(checked) => updateConfig({ show_completion_date: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <Label htmlFor="show_course_duration" className="text-slate-300">Show Course Duration</Label>
                </div>
                <Switch
                  id="show_course_duration"
                  checked={config.show_course_duration}
                  onCheckedChange={(checked) => updateConfig({ show_course_duration: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-slate-400" />
                  <Label htmlFor="show_grade" className="text-slate-300">Show Final Grade</Label>
                </div>
                <Switch
                  id="show_grade"
                  checked={config.show_grade}
                  onCheckedChange={(checked) => updateConfig({ show_grade: checked })}
                />
              </div>
            </div>
          </GlassCard>

          {/* Color Customization */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Color Customization</h3>
            </div>
            
            <div className="space-y-4">
              {/* Color Presets */}
              <div>
                <Label className="text-slate-300 mb-2 block">Color Presets</Label>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyColorPreset(preset)}
                      className="p-2 rounded-lg border border-slate-600 hover:border-slate-400 transition-colors"
                      style={{ backgroundColor: preset.background }}
                      title={preset.name}
                    >
                      <div className="w-full h-8 rounded" style={{ backgroundColor: preset.border }}></div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="background_color" className="text-slate-300">Background</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      id="background_color"
                      value={config.background_color}
                      onChange={(e) => updateConfig({ background_color: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-600"
                    />
                    <Input
                      value={config.background_color}
                      onChange={(e) => updateConfig({ background_color: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="text_color" className="text-slate-300">Text</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      id="text_color"
                      value={config.text_color}
                      onChange={(e) => updateConfig({ text_color: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-600"
                    />
                    <Input
                      value={config.text_color}
                      onChange={(e) => updateConfig({ text_color: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="border_color" className="text-slate-300">Border</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      id="border_color"
                      value={config.border_color}
                      onChange={(e) => updateConfig({ border_color: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-600"
                    />
                    <Input
                      value={config.border_color}
                      onChange={(e) => updateConfig({ border_color: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Custom Fields */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Custom Fields</h3>
              <Button
                onClick={addCustomField}
                size="sm"
                variant="outline"
                className="bg-white/10 text-white hover:bg-white/20 border-white/20"
              >
                Add Field
              </Button>
            </div>
            
            <div className="space-y-3">
              {config.custom_fields.map((field, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg">
                  <Input
                    value={field.label}
                    onChange={(e) => updateCustomField(index, "label", e.target.value)}
                    placeholder="Field label"
                    className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-400"
                  />
                  <Input
                    value={field.value}
                    onChange={(e) => updateCustomField(index, "value", e.target.value)}
                    placeholder="Field value"
                    className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-400"
                  />
                  <Button
                    onClick={() => removeCustomField(index)}
                    size="sm"
                    variant="destructive"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              
              {config.custom_fields.length === 0 && (
                <p className="text-slate-400 text-center py-4">
                  No custom fields added. Click "Add Field" to include additional information.
                </p>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
}
