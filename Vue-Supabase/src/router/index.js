import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../pages/HomePage.vue'),
      meta: { 
        title: 'Inicio - Universal Box',
        requiresAuth: false 
      }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/LoginPage.vue'),
      meta: { 
        title: 'Iniciar Sesión - Universal Box',
        requiresAuth: false 
      }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../pages/RegisterPage.vue'),
      meta: { 
        title: 'Registrarse - Universal Box',
        requiresAuth: false 
      }
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('../pages/ResetPasswordPage.vue'),
      meta: { 
        title: 'Restablecer Contraseña - Universal Box',
        requiresAuth: false 
      }
    },
    {
      path: '/subir-archivo',
      name: 'subir-archivo',
      component: () => import('../pages/SubirArchivoPage.vue'),
      meta: { 
        title: 'Subir Archivo - Universal Box',
        requiresAuth: true 
      }
    },
    {
      path: '/ingresar-envio',
      name: 'ingresar-envio',
      component: () => import('../pages/IngresarEnvioPage.vue'),
      meta: { 
        title: 'Ingresar Envíos - Universal Box',
        requiresAuth: true 
      }
    },
    {
      path: '/ver-archivo',
      name: 'ver-archivo',
      component: () => import('../pages/VerArchivoPage.vue'),
      meta: { 
        title: 'Ver archivos - Universal Box',
        requiresAuth: true 
      }
    },
    {
      path: '/historial-archivos',
      name: 'historial',
      component: () => import('../pages/ArchivosPage.vue'),
      meta: { 
        title: 'Ver archivos - Universal Box',
        requiresAuth: true 
      }
    },
    {
      path: '/ver-archivo/:id',
      name: 'ver-archivo-detalle',
      component: () => import('../pages/VerArchivoPage.vue'),
      meta: { 
        title: 'Ver archivo - Universal Box',
        requiresAuth: true 
      }
    },
    {
      path: '/test',
      name: 'test',
      component: () => import('../pages/TestPage.vue'),
      meta: { 
        title: 'Consultar Datos - Universal Box',
        requiresAuth: true 
      }
    },
    {
      path: '/gestion-usuarios',
      name: 'gestion-usuarios',
      component: () => import('../pages/GestionUsuariosPage.vue'),
      meta: { 
        title: 'Gestión de Usuarios - Universal Box',
        requiresAuth: true,
        //requiresAdmin: true 
      }
    },
    {
      path: '/diagnostico',
      name: 'diagnostico',
      component: () => import('../pages/DiagnosticoPage.vue'),
      meta: { 
        title: 'Diagnóstico - Universal Box',
        requiresAuth: true 
      }
    },
    {
      path: '/busqueda',
      name: 'busqueda',
      component: () => import('../pages/BusquedaPage.vue'),
      meta: {
        title: 'Búsqueda - Universal Box',
        requiresAuth: true,
      }
    },
    {
      path: '/busqueda-semantica',
      name: 'busqueda-semantica',
      component: () => import('../pages/BusquedaSemanticaPage.vue'),
      meta: {
        title: 'Búsqueda Semántica - Universal Box',
        requiresAuth: true,
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../pages/NotFoundPage.vue'),
      meta: { 
        title: 'Página No Encontrada - Universal Box',
        requiresAuth: false 
      }
    }
  ]
})

// Guard de navegación
router.beforeEach(async (to, from, next) => {
  console.log('🛡️ Guard de navegación ejecutándose...')
  console.log('📍 Ruta destino:', to.path)
  console.log('📍 Meta:', to.meta)

  // Actualizar título de la página
  if (to.meta.title) {
    document.title = to.meta.title
  }

  // Obtener estado de autenticación
  const { isAuthenticated, userProfile, isAdmin, isEditor, isManager } = useAuth()
  
  console.log('🔐 Estado de autenticación:', {
    isAuthenticated: isAuthenticated.value,
    userProfile: userProfile.value ? 'Cargado' : 'No cargado',
    isAdmin: isAdmin.value,
    isEditor: isEditor.value,
    isManager: isManager.value
  })

  // Verificar si la ruta requiere autenticación
  if (to.meta.requiresAuth) {
    console.log('🔒 Ruta requiere autenticación')
    
    if (!isAuthenticated.value) {
      console.log('❌ Usuario no autenticado, redirigiendo a login')
      next('/login')
      return
    }

    // Protección por rol
    if (to.meta.requiresAdmin && !isAdmin.value) {
      console.log('❌ Usuario no es administrador, redirigiendo a home')
      next('/')
      return
    }
    if (to.meta.requiresGerente && !isManager.value) {
      console.log('❌ Usuario no es gerente, redirigiendo a home')
      next('/')
      return
    }

    // Protección para archivos y gestión solo para admin/editor
    if ((to.path.startsWith('/subir-archivo') || to.path.startsWith('/dashboard') || to.path.startsWith('/test')) && !(isAdmin.value || isEditor.value)) {
      console.log('❌ Usuario no tiene permisos para acceder a esta ruta')
      next('/')
      return
    }

    // Gestión de usuarios solo admin
    if (to.path.startsWith('/gestion-usuarios') && !isAdmin.value) {
      console.log('❌ Usuario no es administrador, redirigiendo a home')
      next('/')
      return
    }

    console.log('✅ Usuario autenticado y autorizado')
  } else {
    console.log('🔓 Ruta pública')
  }

  // Si el usuario está autenticado y va a login/register, redirigir a home
  if (isAuthenticated.value && (to.name === 'login')) {
    console.log('🔄 Usuario autenticado intentando acceder a login, redirigiendo a home')
    next('/')
    return
  }

  console.log('✅ Navegación permitida')
  next()
})

export default router
