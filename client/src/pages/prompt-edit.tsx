import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useRoute, useLocation } from 'wouter'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { getStepName, isValidStepNumber, type StepNumber } from '@shared/constants'
import type { Database } from '@/lib/supabase'

type Prompt = Database['public']['Tables']['prompts']['Row']

export default function PromptEditPage() {
  const [match, params] = useRoute('/prompts/:stepNumber')
  const { user } = useAuth()
  const { toast } = useToast()
  const [, setLocation] = useLocation()
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [userPromptText, setUserPromptText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const stepNumber = params?.stepNumber ? parseInt(params.stepNumber) : 0

  useEffect(() => {
    if (!match || !isValidStepNumber(stepNumber)) {
      setLocation('/dashboard')
      return
    }
    fetchPrompt()
  }, [stepNumber, match])

  const fetchPrompt = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('step_number', stepNumber)
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No prompt found
          toast({
            title: "Error",
            description: "Prompt not found",
            variant: "destructive"
          })
          setLocation('/dashboard')
          return
        }
        throw error
      }

      setPrompt(data)
      setUserPromptText(data.user_prompt_text)
    } catch (error: any) {
      console.error('Error fetching prompt:', error)
      toast({
        title: "Error",
        description: "Failed to load prompt",
        variant: "destructive"
      })
      setLocation('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!prompt || !userPromptText.trim()) {
      toast({
        title: "Error",
        description: "Prompt text cannot be empty",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    try {
      // Begin transaction: Get current version, deactivate current, insert new
      
      // 1. Get current version
      const { data: currentData, error: versionError } = await supabase
        .from('prompts')
        .select('version')
        .eq('step_number', stepNumber)
        .eq('is_active', true)
        .single()

      if (versionError) {
        throw versionError
      }

      const newVersion = currentData.version + 1

      // 2. Deactivate current prompt
      const { error: deactivateError } = await supabase
        .from('prompts')
        .update({ is_active: false })
        .eq('step_number', stepNumber)
        .eq('is_active', true)

      if (deactivateError) {
        throw deactivateError
      }

      // 3. Insert new prompt with incremented version
      const { data: newPrompt, error: insertError } = await supabase
        .from('prompts')
        .insert({
          step_number: stepNumber,
          name: getStepName(stepNumber as StepNumber),
          system_prompt_text: prompt.system_prompt_text,
          user_prompt_text: userPromptText.trim(),
          model_provider: prompt.model_provider,
          model_name: prompt.model_name,
          parameters: prompt.parameters,
          version: newVersion,
          is_active: true
        })
        .select()
        .single()

      if (insertError) {
        // Try to rollback by reactivating the old prompt
        await supabase
          .from('prompts')
          .update({ is_active: true })
          .eq('step_number', stepNumber)
          .eq('version', currentData.version)
          
        throw insertError
      }

      setPrompt(newPrompt)
      
      toast({
        title: "Success",
        description: `Prompt updated to version ${newVersion}`,
      })

      // Redirect back to dashboard prompts tab
      setTimeout(() => {
        setLocation('/dashboard?tab=prompts')
      }, 1500)

    } catch (error: any) {
      console.error('Error saving prompt:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save prompt",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    setLocation('/dashboard?tab=prompts')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!prompt) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Prompt not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <nav className="glass-card border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleBack}
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>

          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Edit {getStepName(stepNumber as StepNumber)} Prompt
          </h1>
          <p className="text-gray-400">
            Step {stepNumber} • Version {prompt.version}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8 space-y-6">
          {/* Read-only Information */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300">Step Name</Label>
              <div className="mt-1 text-white">
                {getStepName(stepNumber as StepNumber)}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300">Version</Label>
              <div className="mt-1 text-white">
                {prompt.version}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300">Created At</Label>
              <div className="mt-1 text-white">
                {prompt.created_at ? new Date(prompt.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300">Last Updated</Label>
              <div className="mt-1 text-white">
                {prompt.updated_at ? new Date(prompt.updated_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>



          {/* User Prompt (Editable) */}
          <div>
            <Label htmlFor="user-prompt" className="text-sm font-medium text-gray-300">
              User Prompt Text *
            </Label>
            <Textarea
              id="user-prompt"
              value={userPromptText}
              onChange={(e) => setUserPromptText(e.target.value)}
              placeholder="Enter your prompt text here..."
              className="mt-1 glass-card bg-gray-900/50 text-white placeholder-gray-500 border-gray-700 focus:border-blue-500 min-h-[300px]"
              required
            />
            <div className="mt-2 text-xs text-gray-400">
              This is the main prompt that will be used for processing. Make sure it's clear and specific.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-800">
            <Button
              onClick={handleBack}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !userPromptText.trim() || userPromptText === prompt.user_prompt_text}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}