import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Play, CheckCircle, Circle, Clock, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useParams, useLocation } from 'wouter'
import { supabase, type Database } from '@/lib/supabase'

type Project = Database['public']['Tables']['projects']['Row']
type ProjectStep = {
  id: string
  project_id: string | null
  step_number: number
  step_name: string
  status: string
  step_data: any
  raw_response: string | null
  error_message: string | null
  processing_time: number | null
  started_at: string | null
  completed_at: string | null
  updated_by: string | null
  created_at: string | null
  updated_at: string | null
  processing_cost: number | null
}

export default function ProjectPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [, setLocation] = useLocation()
  const params = useParams()
  const projectId = params.id

  const [project, setProject] = useState<Project | null>(null)
  const [projectSteps, setProjectSteps] = useState<ProjectStep[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState('transcript')
  const [isSaving, setIsSaving] = useState(false)

  const steps = [
    { id: 1, name: 'Transcript Analysis', key: 'transcript', status: 'current' },
    { id: 2, name: 'Research', key: 'research', status: 'upcoming' },
    { id: 3, name: 'Script Outline', key: 'outline', status: 'upcoming' }
  ]

  useEffect(() => {
    if (projectId && user?.id) {
      fetchProject()
    }
  }, [projectId, user?.id])

  const fetchProject = async () => {
    if (!projectId || !user?.id) return

    setIsLoading(true)
    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('created_by', user.id)
        .single()

      if (projectError) {
        throw projectError
      }

      if (!projectData) {
        toast({
          title: "Error",
          description: "Project not found",
          variant: "destructive"
        })
        setLocation('/dashboard')
        return
      }

      // Fetch project steps
      const { data: stepsData, error: stepsError } = await supabase
        .from('project_steps')
        .select('*')
        .eq('project_id', projectId)
        .order('step_number', { ascending: true })

      if (stepsError) {
        console.error('Error fetching project steps:', stepsError)
      }

      setProject(projectData)
      setProjectSteps(stepsData || [])
      setCurrentStep(Math.max(1, (projectData.current_step || 0) + 1))
    } catch (error: any) {
      console.error('Error fetching project:', error)
      toast({
        title: "Error",
        description: "Failed to load project",
        variant: "destructive"
      })
      setLocation('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartTranscriptAnalysis = async () => {
    if (!project || !user?.id) return
    
    setIsProcessing(true)
    try {
      const response = await fetch('/api/webhook/transcript-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'youtube-url': project.youtube_url,
          'client-info': project.client_info || '',
          'context': project.context,
          'project-id': project.id,
          'user-id': user.id
        })
      })

      if (!response.ok) {
        throw new Error('Webhook request failed')
      }

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Processing Started",
          description: "Transcript analysis has been initiated",
        })
        
        // Start polling for results
        startPollingForResults()
      } else {
        throw new Error(result.message || 'Webhook failed')
      }
      
    } catch (error: any) {
      console.error('Error starting transcript analysis:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to start transcript analysis",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const startPollingForResults = () => {
    const pollInterval = setInterval(async () => {
      try {
        const { data: stepsData, error } = await supabase
          .from('project_steps')
          .select('*')
          .eq('project_id', projectId)
          .eq('step_number', 1)
          .eq('status', 'completed')

        if (error) {
          console.error('Error polling for results:', error)
          return
        }

        if (stepsData && stepsData.length > 0) {
          // Results found, update state and stop polling
          setProjectSteps(prev => {
            const existing = prev.find(step => step.step_number === 1)
            if (existing) {
              return prev.map(step => 
                step.step_number === 1 ? stepsData[0] : step
              )
            } else {
              return [...prev, stepsData[0]]
            }
          })
          
          clearInterval(pollInterval)
          toast({
            title: "Analysis Complete",
            description: "Transcript analysis has been completed successfully",
          })
        }
      } catch (error) {
        console.error('Error polling for results:', error)
      }
    }, 3000) // Poll every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
    }, 300000)
  }

  const saveProjectChanges = async (updatedProject: Partial<Project>) => {
    if (!projectId || !user?.id) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('projects')
        .update(updatedProject)
        .eq('id', projectId)
        .eq('created_by', user.id)

      if (error) {
        throw error
      }

      toast({
        title: "Saved",
        description: "Project changes saved successfully",
      })
    } catch (error: any) {
      console.error('Error saving project:', error)
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getStepIcon = (step: typeof steps[0]) => {
    const stepData = projectSteps.find(s => s.step_number === step.id)
    
    if (stepData && stepData.status === 'completed') {
      return <CheckCircle className="h-6 w-6 text-green-500" />
    } else if (stepData && stepData.status === 'processing') {
      return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
    } else if (step.id === currentStep) {
      return <Clock className="h-6 w-6 text-blue-500" />
    } else {
      return <Circle className="h-6 w-6 text-gray-400" />
    }
  }

  const getStepStatus = (stepId: number) => {
    const stepData = projectSteps.find(s => s.step_number === stepId)
    if (stepData) {
      return stepData.status
    }
    return stepId <= currentStep ? 'available' : 'upcoming'
  }

  const renderAnalysisData = (stepData: ProjectStep) => {
    if (!stepData.raw_response) return null

    try {
      const data = JSON.parse(stepData.raw_response)

      const renderValue = (value: any) => {
        if (Array.isArray(value)) {
          // Handle arrays (like Target Audience, Transitional Phrases, etc.)
          return (
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              {value.map((item, index) => (
                <li key={index}>{String(item)}</li>
              ))}
            </ul>
          )
        } else if (typeof value === 'object' && value !== null) {
          // Handle objects (like nested key-value pairs)
          return (
            <div className="space-y-2 ml-4">
              {Object.entries(value).map(([subKey, subValue]) => (
                <div key={subKey} className="space-y-1">
                  <h4 className="font-medium text-gray-400 text-sm">
                    {subKey.replace(/[-_]/g, ' ')}
                  </h4>
                  <div className="text-gray-300">
                    {String(subValue)}
                  </div>
                </div>
              ))}
            </div>
          )
        } else {
          // Handle strings
          return (
            <div className="text-gray-300 whitespace-pre-wrap">
              {String(value)}
            </div>
          )
        }
      }

      return (
        <div className="space-y-6">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="space-y-3">
              <h3 className="font-bold text-white text-lg capitalize">
                {key.replace(/[-_]/g, ' ')}
              </h3>
              {renderValue(value)}
            </div>
          ))}
        </div>
      )
    } catch (error) {
      console.error('Error parsing raw response:', error)
      return (
        <div className="text-gray-400">
          Unable to parse analysis data
        </div>
      )
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading project...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Project not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="relative z-10 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setLocation('/dashboard')}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
          
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-white">{project.title}</h1>
            <div className="flex items-center space-x-4 mt-2 text-gray-400">
              <span>Client: {project.client_info || 'N/A'}</span>
              <span>•</span>
              <span>Status: {project.status}</span>
            </div>
            <div className="mt-2 text-sm text-gray-400">
              YouTube URL: {project.youtube_url}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center space-x-2">
                  {getStepIcon(step)}
                  <div className="text-white font-medium">{step.name}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-24 h-0.5 bg-gray-600 ml-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
            {steps.map((step) => {
              const stepStatus = getStepStatus(step.id)
              const isActive = activeTab === step.key
              const isCompleted = stepStatus === 'completed'
              const isDisabled = stepStatus === 'upcoming'
              
              return (
                <button
                  key={step.key}
                  onClick={() => !isDisabled && setActiveTab(step.key)}
                  disabled={isDisabled}
                  className={`
                    flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : isCompleted 
                        ? 'text-green-400 hover:bg-gray-700' 
                        : isDisabled 
                          ? 'text-gray-500 cursor-not-allowed' 
                          : 'text-gray-300 hover:bg-gray-700'
                    }
                  `}
                >
                  {step.name}
                  {isCompleted && (
                    <CheckCircle className="inline ml-2 h-4 w-4" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
          {activeTab === 'transcript' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Transcript Analysis
              </h2>
              
              {(() => {
                const stepData = projectSteps.find(s => s.step_number === 1)
                
                if (stepData && stepData.status === 'completed') {
                  return (
                    <div>
                      <div className="mb-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                        <div className="flex items-center text-green-400">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Analysis completed successfully
                        </div>
                      </div>
                      {renderAnalysisData(stepData)}
                    </div>
                  )
                } else if (stepData && stepData.status === 'processing') {
                  return (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                      <p className="text-gray-400">Processing transcript analysis...</p>
                    </div>
                  )
                } else {
                  return (
                    <div>
                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Project Context
                          </label>
                          <textarea
                            value={project.context}
                            onChange={(e) => {
                              const newContext = e.target.value
                              setProject(prev => prev ? { ...prev, context: newContext } : null)
                            }}
                            onBlur={(e) => {
                              saveProjectChanges({ context: e.target.value })
                            }}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-gray-300 resize-vertical min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter project context..."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            YouTube URL
                          </label>
                          <input
                            type="url"
                            value={project.youtube_url}
                            onChange={(e) => {
                              const newUrl = e.target.value
                              setProject(prev => prev ? { ...prev, youtube_url: newUrl } : null)
                            }}
                            onBlur={(e) => {
                              saveProjectChanges({ youtube_url: e.target.value })
                            }}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://youtube.com/watch?v=..."
                          />
                        </div>
                      </div>

                      <Button
                        onClick={handleStartTranscriptAnalysis}
                        disabled={isProcessing}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Start Transcript Analysis
                          </>
                        )}
                      </Button>
                    </div>
                  )
                }
              })()}
            </div>
          )}

          {activeTab === 'research' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Research
              </h2>
              {(() => {
                const stepData = projectSteps.find(s => s.step_number === 2)
                
                if (stepData && stepData.status === 'completed') {
                  return renderAnalysisData(stepData)
                } else if (stepData && stepData.status === 'processing') {
                  return (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                      <p className="text-gray-400">Processing research...</p>
                    </div>
                  )
                } else {
                  return (
                    <div className="text-center py-8">
                      <p className="text-gray-400">Complete transcript analysis first to unlock research step</p>
                    </div>
                  )
                }
              })()}
            </div>
          )}

          {activeTab === 'outline' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Script Outline
              </h2>
              {(() => {
                const stepData = projectSteps.find(s => s.step_number === 3)
                
                if (stepData && stepData.status === 'completed') {
                  return renderAnalysisData(stepData)
                } else if (stepData && stepData.status === 'processing') {
                  return (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                      <p className="text-gray-400">Generating script outline...</p>
                    </div>
                  )
                } else {
                  return (
                    <div className="text-center py-8">
                      <p className="text-gray-400">Complete research step first to unlock script outline generation</p>
                    </div>
                  )
                }
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}