import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useLocation } from 'wouter'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Edit } from 'lucide-react'
import { getStepName, isValidStepNumber, type StepNumber } from '@shared/constants'
import { formatDate, getDaysAgo } from '@/utils/dateFormatting'
import type { Database } from '@/lib/supabase'

type Prompt = Database['public']['Tables']['prompts']['Row']

export default function PromptsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [, setLocation] = useLocation()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'updated_at'>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchPrompts = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('is_active', true)
        .order('step_number', { ascending: true })

      if (error) {
        throw error
      }

      setPrompts(data || [])
    } catch (error: any) {
      console.error('Error fetching prompts:', error)
      toast({
        title: "Error",
        description: "Failed to load prompts",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSort = (column: 'name' | 'created_at' | 'updated_at') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ChevronDown className="h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-gray-300" />
      : <ChevronDown className="h-4 w-4 text-gray-300" />
  }

  const handleEditPrompt = (stepNumber: number) => {
    if (isValidStepNumber(stepNumber)) {
      setLocation(`/prompts/${stepNumber}`)
    }
  }



  // Apply sorting to the data
  const sortedPrompts = useMemo(() => {
    if (!prompts.length) return []
    
    return [...prompts].sort((a, b) => {
      let aVal: any, bVal: any
      
      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case 'created_at':
          aVal = new Date(a.created_at || '').getTime()
          bVal = new Date(b.created_at || '').getTime()
          break
        case 'updated_at':
          aVal = new Date(a.updated_at || '').getTime()
          bVal = new Date(b.updated_at || '').getTime()
          break
        default:
          return 0
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [prompts, sortBy, sortDirection])

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div>
      {/* Prompts Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th 
                  className="text-left py-4 px-6 text-sm font-medium text-gray-300 cursor-pointer group"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Name</span>
                    {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="text-left py-4 px-6 text-sm font-medium text-gray-300 cursor-pointer group"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Created At</span>
                    {getSortIcon('created_at')}
                  </div>
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-300">
                  User Prompt Text
                </th>
                <th 
                  className="text-left py-4 px-6 text-sm font-medium text-gray-300 cursor-pointer group"
                  onClick={() => handleSort('updated_at')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Last Updated</span>
                    {getSortIcon('updated_at')}
                  </div>
                </th>

              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading prompts...</p>
                  </td>
                </tr>
              ) : prompts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <p className="text-gray-400 text-lg">No prompts found</p>
                    <p className="text-gray-500 text-sm mt-2">Create your first prompt to get started</p>
                  </td>
                </tr>
              ) : (
                sortedPrompts.map((prompt) => (
                  <tr 
                    key={prompt.id} 
                    className="border-b border-gray-800/50 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => handleEditPrompt(prompt.step_number)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm mr-3">
                          {prompt.step_number}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {getStepName(prompt.step_number as StepNumber)}
                          </div>
                          <div className="text-gray-400 text-sm">
                            Version {prompt.version}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-white">{formatDate(prompt.created_at)}</div>
                      <div className="text-gray-400 text-sm">{getDaysAgo(prompt.created_at)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-300 text-sm">
                        {truncateText(prompt.user_prompt_text)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-white">{formatDate(prompt.updated_at)}</div>
                      <div className="text-gray-400 text-sm">{getDaysAgo(prompt.updated_at)}</div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Results Count */}
      <div className="mt-4 text-sm text-gray-400">
        Showing {prompts.length} of {prompts.length} prompts
      </div>
    </div>
  )
}