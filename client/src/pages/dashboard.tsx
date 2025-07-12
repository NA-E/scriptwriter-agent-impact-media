import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { LogOut, Box, User, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
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



  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-50"></div>
      <div className="fixed inset-0 bg-gradient-radial from-white/10 via-transparent to-blue-500/10"></div>
      
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Box className="text-black w-4 h-4" />
            </div>
            <span className="text-xl font-semibold">YouTube ScriptWriter Agent</span>
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
              <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
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
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
                <p className="text-gray-400">Manage your YouTube scriptwriting projects</p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                + New Project
              </Button>
            </div>
            
            {/* Search and Filter */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <select className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Status</option>
                <option>Draft</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
            
            {/* Projects Table */}
            <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700/50 border-b border-gray-600">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-300">Project Name</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-300">Client</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-300">Status</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-300">Date</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-300">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    <tr className="hover:bg-gray-700/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-white font-medium text-sm">A</span>
                          </div>
                          <div>
                            <div className="text-white font-medium">abc</div>
                            <div className="text-gray-400 text-sm">avfgr</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white">acb</td>
                      <td className="px-6 py-4">
                        <span className="bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded-full text-xs">
                          Draft
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white">Jul 12, 2025</div>
                        <div className="text-gray-400 text-sm">0 days ago</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{width: '20%'}}></div>
                          </div>
                          <span className="text-gray-400 text-sm">1/5</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-400">
              Showing 1 of 1 projects
            </div>
          </div>
        </div>
      </main>

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
