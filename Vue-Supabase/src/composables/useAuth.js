import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabase } from './useSupabase'

// Estado global de autenticación
const user = ref(null)
const userProfile = ref(null)
const loading = ref(false)

export function useAuth() {
  const router = useRouter()

  // Computed properties
  // isAdmin: Administrador, isEditor: Digitador, isManager: Gerente
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => userProfile.value?.role_id === 1)
  const isEditor = computed(() => userProfile.value?.role_id === 2)
  const isManager = computed(() => userProfile.value?.role_id === 3)

  // Obtener sesión actual
  const getSession = async () => {
    try {
      loading.value = true
      console.log('🔍 Obteniendo sesión actual...')
      
      const { data: { session }, error } = await useSupabase.auth.getSession()
      
      if (error) {
        console.error('❌ Error obteniendo sesión:', error)
        throw error
      }
      
      console.log('🔍 Sesión obtenida:', session)
      
      if (session?.user) {
        user.value = session.user
        console.log('✅ Usuario encontrado en sesión:', session.user.email)
        await loadUserProfile(session.user.id)
      } else {
        console.log('ℹ️ No hay sesión activa')
      }
      
      return session
    } catch (error) {
      console.error('❌ Error obteniendo sesión:', error)
      return null
    } finally {
      loading.value = false
    }
  }

  // Cargar perfil del usuario
  const loadUserProfile = async (userId) => {
    try {
      console.log('🔍 Cargando perfil para usuario:', userId)
      // Timeout de 5 segundos para evitar cuelgues eternos
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('⏰ Timeout al cargar perfil')), 5000)
      )
  
      const query = useSupabase
        .from('usuarios')
        .select(`
          id,
          nombres,
          apellidos,
          fecha_creada,
          estado,
          role_id
        `)
        .eq('id', userId)
        .single()
  
      const { data, error } = await Promise.race([query, timeout])
  
      if (error) {
        console.error('❌ Error cargando perfil:', error)
        return null
      }
  
      console.log('✅ Perfil cargado:', data)
      userProfile.value = data
      return data
    } catch (error) {
      console.error('❌ Error en loadUserProfile:', error)
      return null
    }
  }

  // Registro de usuario
  const signUp = async (userData) => {
    try {
      console.log('🔍 Iniciando registro para:', userData.email)
      
      const { data, error } = await useSupabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            nombres: userData.nombres,
            apellidos: userData.apellidos,
            role_id: parseInt(userData.role_id)
          }
        }
      })

      if (error) {
        console.error('❌ Error en signUp:', error)
        throw error
      }

      console.log('✅ Registro exitoso:', data)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Error en signUp:', error)
      return { success: false, error }
    }
  }

  // Inicio de sesión
  const signIn = async (email, password) => {
    try {
      console.log('🔍 Iniciando login para:', email)
      
      const { data, error } = await useSupabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('❌ Error en signIn:', error)
        throw error
      }

      if (data.user) {
        console.log('✅ Login exitoso:', data.user.email)
        user.value = data.user
        
        // Verificar confirmación de email
        if (!data.user.email_confirmed_at) {
          console.log('⚠️ Email no confirmado')
          throw new Error('Email not confirmed')
        }

        // Cargar perfil del usuario
        await loadUserProfile(data.user.id)
      }

      return { success: true, data }
    } catch (error) {
      console.error('❌ Error en signIn:', error)
      return { success: false, error }
    }
  }

  // Cerrar sesión
  const signOut = async () => {
    try {
      console.log('🔍 Cerrando sesión...')
      
      const { error } = await useSupabase.auth.signOut()
      
      if (error) {
        console.error('❌ Error en signOut:', error)
        throw error
      }

      // Limpiar estado
      user.value = null
      userProfile.value = null
      console.log('✅ Sesión cerrada')
      
      // Redirigir al login
      router.push('/login')
      
      return { success: true }
    } catch (error) {
      console.error('❌ Error en signOut:', error)
      return { success: false, error }
    }
  }

  // Restablecer contraseña
  const resetPassword = async (email) => {
    try {
      const { error } = await useSupabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error en resetPassword:', error)
      return { success: false, error }
    }
  }

  // Actualizar contraseña
  const updatePassword = async (newPassword) => {
    try {
      const { error } = await useSupabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error en updatePassword:', error)
      return { success: false, error }
    }
  }

  // Escuchar cambios de autenticación
  const setupAuthListener = () => {
    console.log('🔍 Configurando listener de autenticación...')
    useSupabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email)
      if (event === 'SIGNED_IN' && session?.user) {
        loading.value = true
        user.value = session.user
        await loadUserProfile(session.user.id)
        loading.value = false
      } else if (event === 'SIGNED_OUT') {
        user.value = null
        userProfile.value = null
      }
    })
  }

  return {
    // Estado
    user: computed(() => user.value),
    userProfile: computed(() => userProfile.value),
    loading: computed(() => loading.value),
    isAuthenticated,
    isAdmin,
    isEditor,
    isManager,

    // Métodos
    getSession,
    loadUserProfile,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    setupAuthListener
  }
}
