import { createClient } from '@supabase/supabase-js'
//import { useUser } from './useUser'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const useSupabase = createClient(supabaseUrl, supabaseKey)

// supabase.auth.onAuthStateChange((event, session) => {
//   const { setUser } = useUser()

//   setUser(session?.user)
// })8

// export function useSupabase() {
//   return { supabase }
// }
