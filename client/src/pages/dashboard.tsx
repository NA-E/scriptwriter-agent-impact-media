import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { LogOut, Box, User, ChevronDown, X, Loader2, Trash2, ChevronUp } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { supabase, type Database } from '@/lib/supabase'
import { useLocation } from 'wouter'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [, setLocation] = useLocation()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [projects, setProjects] = useState<Database['public']['Tables']['projects']['Row'][]>([])
  const [projectForm, setProjectForm] = useState({
    name: '',
    clientName: '',
    youtubeUrl: '',
    context: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sortBy, setSortBy] = useState<'title' | 'client_info' | 'updated_at' | 'current_step'>('updated_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const menuRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
        variant: "destructive"
      })
    }
  }

  const getUserInitials = () => {
    if (!user?.email) return 'U'
    return user.email.charAt(0).toUpperCase()
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleProjectFormChange = (field: string, value: string) => {
    setProjectForm(prev => ({ ...prev, [field]: value }))
  }

  const handleCreateProject = async () => {
    console.log('=== CREATE PROJECT DEBUG ===')
    console.log('Form data:', projectForm)
    console.log('User ID:', user?.id)
    console.log('Component state - isCreating:', isCreating)
    console.log('Modal state - isNewProjectModalOpen:', isNewProjectModalOpen)

    if (!projectForm.name || !projectForm.clientName || !projectForm.youtubeUrl || !projectForm.context) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive"
      })
      return
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create a project",
        variant: "destructive"
      })
      return
    }

    // Check if already creating to prevent double-click issues
    if (isCreating) {
      console.log('Already creating, ignoring duplicate request')
      return
    }

    setIsCreating(true)
    console.log('Starting project creation...')

    try {
      console.log('About to insert project with data:', {
        title: projectForm.name,
        youtube_url: projectForm.youtubeUrl,
        context: projectForm.context,
        client_info: projectForm.clientName,
        status: 'draft',
        current_step: 0,
        created_by: user.id
      })

      const { data, error } = await supabase
        .from('projects')
        .insert({
          title: projectForm.name,
          youtube_url: projectForm.youtubeUrl,
          context: projectForm.context,
          client_info: projectForm.clientName,
          status: 'draft',
          current_step: 0,
          created_by: user.id
        })
        .select()
        .single()

      console.log('Insert result:', { data, error })

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('Project created successfully:', data)

      // Add new project to the list
      setProjects(prev => [data, ...prev])

      toast({
        title: "Success",
        description: "Project created successfully",
      })
      
      // Reset form and close modal
      setProjectForm({ name: '', clientName: '', youtubeUrl: '', context: '' })
      
      // Force modal close with slight delay to ensure state updates
      setTimeout(() => {
        setIsNewProjectModalOpen(false)
        console.log('Modal closed and form reset')
      }, 100)
    } catch (error: any) {
      console.error('Error creating project:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive"
      })
    } finally {
      console.log('Setting isCreating to false')
      setIsCreating(false)
    }
  }

  // Add useEffect to monitor state changes
  useEffect(() => {
    console.log('Dashboard state changed - isCreating:', isCreating, 'modalOpen:', isNewProjectModalOpen)
  }, [isCreating, isNewProjectModalOpen])

  const handleCancelProject = () => {
    setProjectForm({ name: '', clientName: '', youtubeUrl: '', context: '' })
    setIsNewProjectModalOpen(false)
  }

  const handleDeleteProject = async () => {
    if (!projectToDelete || !user?.id) return

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDelete)
        .eq('created_by', user.id) // Ensure user can only delete their own projects

      if (error) {
        throw error
      }

      // Remove project from the list
      setProjects(prev => prev.filter(p => p.id !== projectToDelete))

      toast({
        title: "Success",
        description: "Project deleted successfully",
      })
      
      setProjectToDelete(null)
    } catch (error: any) {
      console.error('Error deleting project:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete project",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const fetchProjects = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('projects')
        .select('*')
        .order(sortBy, { ascending: sortDirection === 'asc' })

      // Apply search filter if search query exists
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,client_info.ilike.%${searchQuery}%,youtube_url.ilike.%${searchQuery}%`)
      }

      // Apply status filter if not 'all'
      if (statusFilter !== 'all') {
        // Map display status to database values
        const statusMap: Record<string, string> = {
          'draft': 'draft',
          'in_progress': 'in_progress', 
          'completed': 'completed'
        }
        if (statusMap[statusFilter]) {
          query = query.eq('status', statusMap[statusFilter])
        }
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setProjects(data || [])
    } catch (error: any) {
      console.error('Error fetching projects:', error)
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getProjectInitial = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getDaysAgo = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays === 0 ? 'Today' : `${diffDays} days ago`
  }

  const handleSort = (column: 'title' | 'client_info' | 'updated_at' | 'current_step') => {
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
      ? <ChevronUp className="h-4 w-4 text-blue-400" />
      : <ChevronDown className="h-4 w-4 text-blue-400" />
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-yellow-600/20 text-yellow-400'
      case 'in_progress':
        return 'bg-blue-600/20 text-blue-400'
      case 'completed':
        return 'bg-green-600/20 text-green-400'
      default:
        return 'bg-gray-600/20 text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'Draft'
      case 'in_progress':
        return 'In Progress'
      case 'completed':
        return 'Completed'
      default:
        return status
    }
  }

  // Load projects on component mount
  useEffect(() => {
    fetchProjects()
  }, [])

  // Load projects when sorting or status filter changes
  useEffect(() => {
    fetchProjects()
  }, [sortBy, sortDirection, statusFilter])

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProjects()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])



  return (
    <div className="min-h-screen dark-world-bg text-white">
      {/* Navigation */}
      <nav className="relative z-50 px-8 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 glass-card rounded-lg flex items-center justify-center">
              <Box className="text-gray-400 w-4 h-4" />
            </div>
            <span className="text-lg font-medium tracking-wide text-gray-300">A IMPACT MEDIA</span>
          </div>
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-2 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">{getUserInitials()}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            
            {isUserMenuOpen && (
              <div className="fixed right-6 top-16 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-[99999]">
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">{getUserInitials()}</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">User</div>
                      <div className="text-gray-400 text-sm break-all">{user?.email}</div>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Projects Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-bold mb-3 text-white tracking-wide">PROJECTS</h1>
                <p className="text-gray-400">Manage your YouTube scriptwriting projects</p>
              </div>
              <Button 
                onClick={() => setIsNewProjectModalOpen(true)}
                className="glass-card hover:bg-white/5 text-white px-6 py-3 rounded-full border-blue-500/30 hover:border-blue-400/50 transition-all duration-300"
              >
                + New Project
              </Button>
            </div>
            
            {/* Search and Filter */}
            <div className="flex gap-4 mb-8">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full glass-card rounded-xl px-4 py-3 pl-12 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-all duration-300"
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="glass-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all duration-300"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            {/* Projects Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700/50 border-b border-gray-600">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-300">
                        <button 
                          onClick={() => handleSort('title')}
                          className="group flex items-center space-x-1 hover:text-white transition-colors"
                        >
                          <span>Project Name</span>
                          {getSortIcon('title')}
                        </button>
                      </th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-300">
                        <button 
                          onClick={() => handleSort('client_info')}
                          className="group flex items-center space-x-1 hover:text-white transition-colors"
                        >
                          <span>Client</span>
                          {getSortIcon('client_info')}
                        </button>
                      </th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-300">
                        <button 
                          onClick={() => handleSort('updated_at')}
                          className="group flex items-center space-x-1 hover:text-white transition-colors"
                        >
                          <span>Last Update Date</span>
                          {getSortIcon('updated_at')}
                        </button>
                      </th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-300">
                        <button 
                          onClick={() => handleSort('current_step')}
                          className="group flex items-center space-x-1 hover:text-white transition-colors"
                        >
                          <span>Progress</span>
                          {getSortIcon('current_step')}
                        </button>
                      </th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                            <span className="text-gray-400">Loading projects...</span>
                          </div>
                        </td>
                      </tr>
                    ) : projects.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="text-gray-400">
                            <p className="text-lg mb-2">No projects yet</p>
                            <p className="text-sm">Create your first project to get started</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      projects.map((project) => (
                        <tr 
                          key={project.id} 
                          className="hover:bg-gray-700/30 cursor-pointer"
                          onClick={() => setLocation(`/project/${project.id}`)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                                <span className="text-white font-medium text-sm">
                                  {getProjectInitial(project.title)}
                                </span>
                              </div>
                              <div>
                                <div className="text-white font-medium">{project.title}</div>
                                <div className="text-gray-400 text-sm truncate max-w-xs">
                                  {project.youtube_url}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-white">{project.client_info || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <div className="text-white">{formatDate(project.updated_at)}</div>
                            <div className="text-gray-400 text-sm">{getDaysAgo(project.updated_at)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{width: `${((project.current_step || 0) / 3) * 100}%`}}
                                ></div>
                              </div>
                              <span className="text-gray-400 text-sm">{project.current_step || 0}/3</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setProjectToDelete(project.id)
                              }}
                              className="text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-500/10"
                              title="Delete project"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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
              Showing {projects.length} of {projects.length} projects
            </div>
          </div>
        </div>
      </main>

      {/* New Project Modal */}
      <Dialog open={isNewProjectModalOpen} onOpenChange={setIsNewProjectModalOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              Create New Project
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="projectName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Project Name
              </Label>
              <Input
                id="projectName"
                value={projectForm.name}
                onChange={(e) => handleProjectFormChange('name', e.target.value)}
                placeholder="Enter project name..."
                className="mt-1 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="clientName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Client Name
              </Label>
              <Input
                id="clientName"
                value={projectForm.clientName}
                onChange={(e) => handleProjectFormChange('clientName', e.target.value)}
                placeholder="Enter client name..."
                className="mt-1 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="youtubeUrl" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                YouTube URL
              </Label>
              <Input
                id="youtubeUrl"
                value={projectForm.youtubeUrl}
                onChange={(e) => handleProjectFormChange('youtubeUrl', e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="mt-1 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="context" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Project Context
              </Label>
              <Textarea
                id="context"
                value={projectForm.context}
                onChange={(e) => handleProjectFormChange('context', e.target.value)}
                placeholder="Describe the video concept, target audience, key points to cover..."
                className="mt-1 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white min-h-20"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              onClick={handleCancelProject}
              variant="outline"
              className="px-6 py-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={isCreating}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={projectToDelete !== null} onOpenChange={() => setProjectToDelete(null)}>
        <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              Delete Project
            </DialogTitle>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete this project? This action cannot be undone and will permanently remove all project data including analysis results.
            </p>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              onClick={() => setProjectToDelete(null)}
              variant="outline"
              className="px-6 py-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Project'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-gray-400">
            © 2025 YouTube ScriptWriter Agent. All rights reserved.
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
