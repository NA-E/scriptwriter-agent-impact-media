import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Play, CheckCircle, Circle, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useParams, useLocation } from 'wouter'
import { supabase, type Database } from '@/lib/supabase'

type Project = Database['public']['Tables']['projects']['Row']

export default function ProjectPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [, setLocation] = useLocation()
  const params = useParams()
  const projectId = params.id

  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)

  const steps = [
    { id: 1, name: 'Transcript Analysis', status: 'current' },
    { id: 2, name: 'Research', status: 'upcoming' },
    { id: 3, name: 'Script Outline Generation', status: 'upcoming' }
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
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('created_by', user.id)
        .single()

      if (error) {
        throw error
      }

      if (!data) {
        toast({
          title: "Error",
          description: "Project not found",
          variant: "destructive"
        })
        setLocation('/dashboard')
        return
      }

      setProject(data)
      setCurrentStep(Math.max(1, (data.current_step || 0) + 1))
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
    if (!project) return
    
    setIsProcessing(true)
    try {
      // TODO: Implement webhook call to N8N
      // const response = await fetch('/api/webhook/transcript-analysis', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ projectId: project.id })
      // })
      
      // For now, simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Processing Started",
        description: "Transcript analysis has been initiated",
      })
      
      // TODO: Poll database for results
      
    } catch (error: any) {
      console.error('Error starting transcript analysis:', error)
      toast({
        title: "Error",
        description: "Failed to start transcript analysis",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getStepIcon = (step: typeof steps[0]) => {
    if (step.id < currentStep) {
      return <CheckCircle className="h-6 w-6 text-green-500" />
    } else if (step.id === currentStep) {
      return <Clock className="h-6 w-6 text-blue-500" />
    } else {
      return <Circle className="h-6 w-6 text-gray-400" />
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

        {/* Step Content */}
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Step 1: Transcript Analysis
              </h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Context
                  </label>
                  <div className="bg-gray-700 rounded-lg p-3 text-gray-300">
                    {project.context}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    YouTube URL
                  </label>
                  <div className="bg-gray-700 rounded-lg p-3 text-gray-300">
                    {project.youtube_url}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleStartTranscriptAnalysis}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin mr-2" />
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
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Step 2: Research
              </h2>
              <p className="text-gray-400">Research step content will be shown here...</p>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Step 3: Script Outline Generation
              </h2>
              <p className="text-gray-400">Script outline generation content will be shown here...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}