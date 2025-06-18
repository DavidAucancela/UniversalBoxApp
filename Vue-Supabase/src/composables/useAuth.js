import { useRouter } from 'vue-router'
import { useSupabase } from './useSupabase'
import { useUser } from './useUser'

export function useAuth() {
  const { supabase } = useSupabase()
  const { setUser } = useUser()
  const router = useRouter()

  const loginWithMagicLink = async ({ email }) => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) throw error
  }

  const getSession = async () => {
    const { data, error } = await supabase.auth.getSession()

    if (error) throw error

    if (data.session && data.session.user) {
      setUser(data.session.user)
    }

    return data.session
  }

  const signUpWithPassw = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    if (error) throw error

    setUser(data.user)
    router.push('/')
  }

  const loginWithPassw = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error

    setUser(data.user)
    router.push('/')
  }

  return {
    loginWithMagicLink,
    getSession,
    signUpWithPassw,
    loginWithPassw
  }
}
