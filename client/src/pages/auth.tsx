import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { Edit, BarChart3, Zap } from 'lucide-react'

export default function AuthPage() {
  const { signInWithGoogle } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      await signInWithGoogle()
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <LoadingSpinner className="w-8 h-8 border-white border-t-transparent mx-auto mb-4" />
          <p className="text-white">Signing you in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background Layers */}
      <div className="fixed inset-0 bg-animated-gradient"></div>
      <div className="fixed inset-0 grid-pattern"></div>
      <div className="fixed inset-0 mesh-gradient"></div>
      
      {/* Floating Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="floating-orb"></div>
        <div className="floating-orb"></div>
        <div className="floating-orb"></div>
      </div>
      
      {/* Gradient Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/40"></div>
      
      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-sm text-gray-400">AI Impact Media</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 min-h-[calc(100vh-200px)]">
        <div className="text-center max-w-4xl mx-auto">
          {/* Title */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight animate-fade-in">
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              YouTube ScriptWriter
            </span><br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-glow">
              Agent
            </span>
          </h1>
          
          {/* Description */}
          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed animate-slide-up">
            Streamline your YouTube content creation process with AI-powered 
            scriptwriting assistance. Create, manage, and optimize your video scripts all 
            in one place.
          </p>
          
          {/* Google Sign In Button */}
          <div className="mb-16 flex justify-center animate-slide-up">
            <Button 
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="bg-white hover:bg-gray-100 text-black font-medium py-4 px-8 rounded-full transition-all duration-300 inline-flex items-center justify-center space-x-3 border border-gray-200 hover:border-gray-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 group"
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-lg">Sign in with Google</span>
            </Button>
          </div>
          
          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="text-center group hover:scale-105 transition-all duration-300 p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800/50 hover:border-gray-700/50 backdrop-blur-sm">
              <div className="mb-4">
                <Edit className="w-10 h-10 mx-auto text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-white transition-colors duration-300">Create Scripts</h3>
              <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">
                Generate engaging YouTube scripts with AI assistance
              </p>
            </div>
            
            <div className="text-center group hover:scale-105 transition-all duration-300 p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800/50 hover:border-gray-700/50 backdrop-blur-sm">
              <div className="mb-4">
                <BarChart3 className="w-10 h-10 mx-auto text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-white transition-colors duration-300">Manage Projects</h3>
              <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">
                Keep all your YouTube content organized in one place
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}