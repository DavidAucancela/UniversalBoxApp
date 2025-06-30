import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { useAuth } from "./composables/useAuth";

const app = createApp(App)
app.use(router)

// Inicializar sistema de autenticación
const { setupAuthListener, getSession } = useAuth()

// Configurar listener de cambios de autenticación
setupAuthListener()

// Obtener sesión inicial
getSession()

// Guard de rutas protegidas
router.beforeEach(async (to, from, next) => {
  console.log('🔍 Guard de rutas - Ruta destino:', to.path)
  
  const { isAuthenticated, userProfile } = useAuth()
  
  console.log('🔍 Estado de autenticación:', {
    isAuthenticated: isAuthenticated.value,
    userProfile: userProfile.value,
    path: to.path
  })

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login', '/register', '/reset-password', '/']
  
  if (publicRoutes.includes(to.path)) {
    console.log('✅ Ruta pública, permitiendo acceso')
    return next()
  }

  // Verificar autenticación
  if (!isAuthenticated.value) {
    console.log('❌ No autenticado, redirigiendo a login')
    return next('/login')
  }

  console.log('✅ Usuario autenticado, permitiendo acceso')

  // Verificar rol si es requerido
  if (to.meta.role) {
    const userRole = userProfile.value?.role_id
    const requiredRole = to.meta.role
    
    console.log('🔍 Verificando rol:', { userRole, requiredRole })
    
    if (userRole !== requiredRole) {
      console.log('❌ Rol insuficiente, redirigiendo al dashboard')
      return next('/dashboard')
    }
  }

  next()
})

app.mount('#app')
