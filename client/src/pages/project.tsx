import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, ArrowRight, Play, CheckCircle, Circle, Clock, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useParams, useLocation } from 'wouter'
import { supabase, type Database } from '@/lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
  const [isResearchProcessing, setIsResearchProcessing] = useState(false)
  const [isOutlineProcessing, setIsOutlineProcessing] = useState(false)
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
    if (!projectId || !user?.id) {
      console.log('Missing projectId or user.id:', { projectId, userId: user?.id })
      return
    }

    setIsLoading(true)
    console.log('=== PROJECT FETCH DEBUG ===')
    console.log('Project ID:', projectId)
    console.log('User ID:', user.id)
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
    
    try {
      // Add timeout to prevent infinite hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000)
      )

      // Test basic connection with timeout
      console.log('Testing Supabase connection with timeout...')
      const connectionTest = supabase
        .from('projects')
        .select('id')
        .limit(1)

      const { data: testData, error: testError } = await Promise.race([
        connectionTest,
        timeoutPromise
      ]) as any

      console.log('Connection test result:', { testData, testError })

      if (testError) {
        console.error('Connection test failed:', testError)
        throw new Error(`Connection failed: ${testError.message}`)
      }

      // If connection works, fetch the specific project
      console.log('Connection successful, fetching project...')
      const projectQuery = supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      const { data: projectData, error: projectError } = await Promise.race([
        projectQuery,
        timeoutPromise
      ]) as any

      console.log('Project query complete:', { projectData, projectError })

      if (projectError) {
        console.error('Project fetch error:', projectError)
        throw projectError
      }

      if (!projectData) {
        console.log('No project found with ID:', projectId)
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

  // Reusable function to call any workflow step webhook
  const callWorkflowStep = async (
    stepNumber: number, 
    webhookPath: string, 
    payload: Record<string, any>,
    stepName: string,
    setProcessingState: (state: boolean) => void,
    switchTab?: string
  ) => {
    if (!project || !user?.id) return

    setProcessingState(true)
    if (switchTab) setActiveTab(switchTab)

    try {
      const response = await fetch(webhookPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Webhook request failed with status ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Processing Started",
          description: `${stepName} has been initiated`,
        })
        
        // Start polling for results
        startPollingForResults(stepNumber, stepName)
      } else {
        throw new Error(result.message || 'Webhook failed')
      }
      
    } catch (error: any) {
      console.error(`Error starting ${stepName}:`, error)
      
      // Show specific error message for different failure types
      let errorMessage = `Failed to start ${stepName}`
      if (error.message.includes('524')) {
        errorMessage = `${stepName} service is currently unavailable. Please try again later.`
      } else if (error.message.includes('timeout')) {
        errorMessage = `${stepName} request timed out. Please try again.`
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setProcessingState(false)
    }
  }

  const handleStartTranscriptAnalysis = async () => {
    if (!project || !user?.id) return
    
    await callWorkflowStep(
      1, 
      '/api/webhook/transcript-analysis',
      {
        'youtube-url': project.youtube_url,
        'client-info': project.client_info || '',
        'context': project.context,
        'project-id': project.id,
        'user-id': user.id
      },
      'Transcript analysis',
      setIsProcessing
    )
  }

  // Reusable polling function for any workflow step
  const startPollingForResults = (stepNumber: number, stepName: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const { data: stepsData, error } = await supabase
          .from('project_steps')
          .select('*')
          .eq('project_id', projectId)
          .eq('step_number', stepNumber)
          .eq('status', 'completed')

        if (error) {
          console.error('Error polling for results:', error)
          return
        }

        if (stepsData && stepsData.length > 0) {
          // Results found, update state and stop polling
          console.log('Step data from database:', JSON.stringify(stepsData[0], null, 2))
          console.log('Processing cost from database:', stepsData[0].processing_cost)
          setProjectSteps(prev => {
            const existing = prev.find(step => step.step_number === stepNumber)
            if (existing) {
              return prev.map(step => 
                step.step_number === stepNumber ? stepsData[0] : step
              )
            } else {
              return [...prev, stepsData[0]]
            }
          })
          
          clearInterval(pollInterval)
          toast({
            title: `${stepName} Complete`,
            description: `${stepName} has been completed successfully`,
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

  const startResearchStep = async () => {
    if (!project || !user?.id) return
    
    await callWorkflowStep(
      2,
      '/api/webhook/research', 
      {
        'project-id': project.id,
        'user-id': user.id
      },
      'Research',
      setIsResearchProcessing,
      'research'
    )
  }

  const startOutlineGeneration = async () => {
    if (!project || !user?.id) return
    
    await callWorkflowStep(
      3,
      '/api/webhook/outline-generation',
      {
        'project-id': project.id,
        'user-id': user.id
      },
      'Outline generation',
      setIsOutlineProcessing,
      'outline'
    )
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
    
    // Check if previous step is completed to determine availability
    if (stepId === 1) {
      return 'available' // First step is always available
    } else {
      const previousStepData = projectSteps.find(s => s.step_number === stepId - 1)
      if (previousStepData && previousStepData.status === 'completed') {
        return 'available'
      }
    }
    
    return 'upcoming'
  }

  const isStepUnlocked = (stepId: number) => {
    if (stepId === 1) return true // First step always unlocked
    
    const previousStepData = projectSteps.find(s => s.step_number === stepId - 1)
    return previousStepData && previousStepData.status === 'completed'
  }

  // Reusable component for success banner
  const renderSuccessBanner = (stepData: ProjectStep, message: string) => (
    <div className="mb-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
      <div className="flex items-center justify-between text-green-400">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          {message}
        </div>
        {typeof stepData.processing_cost === 'number' ? (
          <div className="text-sm text-green-300">
            Cost: ${stepData.processing_cost.toFixed(4)}
          </div>
        ) : (
          <div className="text-sm text-gray-400">
            Cost: {stepData.processing_cost === null ? 'N/A' : String(stepData.processing_cost)}
          </div>
        )}
      </div>
    </div>
  )

  // Reusable component for processing state
  const renderProcessingState = (message: string) => (
    <div className="text-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
      <p className="text-gray-400">{message}</p>
    </div>
  )

  // Reusable component for locked state
  const renderLockedState = (message: string) => (
    <div className="text-center py-8">
      <p className="text-gray-400">{message}</p>
    </div>
  )

  // Reusable component for ready state
  const renderReadyState = (message: string, subtitle?: string) => (
    <div className="text-center py-8">
      <p className="text-gray-400 mb-4">{message}</p>
      {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
    </div>
  )

  // Reusable step content renderer
  const renderStepContent = (
    stepNumber: number, 
    completedMessage: string,
    processingMessage: string,
    readyMessage: string,
    lockedMessage: string
  ) => {
    const stepData = projectSteps.find(s => s.step_number === stepNumber)
    
    if (stepData && stepData.status === 'completed') {
      return (
        <div>
          {renderSuccessBanner(stepData, completedMessage)}
          {renderAnalysisData(stepData)}
        </div>
      )
    } else if (stepData && stepData.status === 'processing') {
      return renderProcessingState(processingMessage)
    } else if (isStepUnlocked(stepNumber)) {
      // Step 2 (Research) specific handling
      if (stepNumber === 2) {
        return (
          <div>
            <div className="text-center py-8 mb-6">
              <p className="text-gray-400 mb-4">{readyMessage}</p>
            </div>
            
            <Button
              onClick={startResearchStep}
              disabled={isResearchProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isResearchProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Research
                </>
              )}
            </Button>
          </div>
        )
      }
      // Step 3 (Outline) specific handling  
      else if (stepNumber === 3) {
        return (
          <div>
            <div className="text-center py-8 mb-6">
              <p className="text-gray-400 mb-4">{readyMessage}</p>
            </div>
            
            <Button
              onClick={startOutlineGeneration}
              disabled={isOutlineProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isOutlineProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Outline Generation
                </>
              )}
            </Button>
          </div>
        )
      }
      // Default ready state for other steps
      else {
        return renderReadyState(readyMessage, "This step will be implemented in the next phase")
      }
    } else {
      return renderLockedState(lockedMessage)
    }
  }

  const renderAnalysisData = (stepData: ProjectStep) => {
    if (!stepData.raw_response) return null

    // For step 3 (outline), render as markdown
    if (stepData.step_number === 3) {
      return (
        <div className="prose prose-invert max-w-none text-gray-300">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({children}) => <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>,
              h2: ({children}) => <h2 className="text-xl font-semibold text-white mb-3">{children}</h2>,
              h3: ({children}) => <h3 className="text-lg font-medium text-white mb-2">{children}</h3>,
              p: ({children}) => <p className="text-gray-300 mb-3 leading-relaxed">{children}</p>,
              ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
              ol: ({children}) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
              li: ({children}) => <li className="text-gray-300">{children}</li>,
              strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
              em: ({children}) => <em className="italic text-gray-200">{children}</em>,
              code: ({children}) => <code className="bg-gray-700 px-2 py-1 rounded text-gray-100 text-sm">{children}</code>,
              blockquote: ({children}) => <blockquote className="border-l-4 border-blue-500 pl-4 my-4 text-gray-400 italic">{children}</blockquote>
            }}
          >
            {stepData.raw_response}
          </ReactMarkdown>
        </div>
      )
    }

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
          // Handle objects (like nested key-value pairs) - render inline with colons
          return (
            <div className="space-y-2 text-gray-300">
              {Object.entries(value).map(([subKey, subValue]) => (
                <div key={subKey} className="">
                  <span className="font-medium text-white">
                    {subKey.charAt(0).toUpperCase() + subKey.slice(1).replace(/[-_]/g, ' ')}:
                  </span>
                  <span> {String(subValue)}</span>
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
              const isDisabled = !isStepUnlocked(step.id)
              
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
                      {renderSuccessBanner(stepData, "Analysis completed successfully")}
                      {renderAnalysisData(stepData)}
                    </div>
                  )
                } else if (stepData && stepData.status === 'processing') {
                  return renderProcessingState("Processing transcript analysis...")
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
              
              {renderStepContent(
                2,
                "Research completed successfully",
                "Processing research...",
                "Ready to begin research phase. This will gather relevant information to enhance your script.",
                "Complete transcript analysis first to unlock research step"
              )}
            </div>
          )}

          {activeTab === 'outline' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Script Outline
              </h2>
              
              {renderStepContent(
                3,
                "Script outline completed successfully",
                "Generating script outline...",
                "Ready to generate your script outline. This will create a structured outline based on your transcript analysis and research.",
                "Complete research first to unlock outline generation step"
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}