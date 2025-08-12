import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Insert user into users table if they don't exist
      if (session?.user) {
        handleUserUpsert(session.user)
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Only manage loading for sign-out events, not sign-in
      if (event === 'SIGNED_OUT') {
        setLoading(false)
      } else if (session?.user) {
        // Don't set loading during user upsert to avoid animation flicker
        handleUserUpsert(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Function to insert or update user in users table
  const handleUserUpsert = async (user: User) => {
    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id, // Use Supabase auth UUID directly
          email: user.email!,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email!.split('@')[0],
          google_id: user.user_metadata?.sub || user.user_metadata?.provider_id || null,
          last_login: new Date().toISOString(),
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (error) {
        console.error('Error upserting user:', error)
      } else {
        console.log('User successfully upserted:', user.email)
      }
    } catch (error) {
      console.error('Error upserting user:', error)
    }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        skipBrowserRedirect: true, // This prevents page redirect and uses popup
        queryParams: {
          prompt: 'select_account' // Force Google to show account selection
        }
      }
    })
    if (error) throw error
  }



  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
