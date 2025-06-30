<template>
  <div class="app-layout" @click="closeAllMenus">
    <!-- Navbar fijo superior -->
    <header class="navbar">
      <div class="navbar-container">
        


        <div class="navbar-brand">
          <RouterLink to="/" class="brand-link">
            <h1>Universal Box</h1>
          </RouterLink>
        </div>
        


        <!-- Menú de navegación - Solo visible si está autenticado y no está cargando -->
        <nav v-if=" isAuthenticated" class="navbar-menu">
          <!-- Sección de ARCHIVOS en NAV -->
          <div v-if="isAdmin || isEditor" class="menu-item" @click.stop>
            <button 
              @click="toggleMenu('archivos')" 
              class="menu-button" 
              :class="{ active: activeMenu === 'archivos' }"
            >
              Archivos
              <span class="arrow" :class="{ rotated: activeMenu === 'archivos' }">▼</span>
            </button>


            <div class="submenu" v-show="activeMenu === 'archivos'">
              
              <RouterLink to="/subir-archivo" class="submenu-item" @click="closeAllMenus">
                Subir envíos (.xls)
              </RouterLink>              
              <RouterLink to="/ingresar-envio" class="submenu-item" @click="closeAllMenus">
                Ingresar envío 
              </RouterLink>
              <RouterLink to="/ver-archivo" class="submenu-item" @click="closeAllMenus">
                Listar envíos 
              </RouterLink>
            </div>
          </div>


          <!-- Sección de USUARIOS en NAV -->
          <div v-if="isAdmin" class="menu-item" @click.stop>
            <button 
              @click="toggleMenu('usuarios')" 
              class="menu-button" 
              :class="{ active: activeMenu === 'usuarios' }"
            >
              Usuarios
              <span class="arrow" :class="{ rotated: activeMenu === 'usuarios' }">▼</span>
            </button>
            <div class="submenu" v-show="activeMenu === 'usuarios'">
              <RouterLink to="/register" class="submenu-item" @click="closeAllMenus">
                Registrar usuario
              </RouterLink>
              <RouterLink to="/gestion-usuarios" class="submenu-item" @click="closeAllMenus">
                Listar usuarios
              </RouterLink>
            </div>
          </div>


          <!-- Sección de CONFIGURACION en NAV -->
          <div v-if="isAdmin" class="menu-item" @click.stop>
            <button 
              @click="toggleMenu('sistema')" 
              class="menu-button" 
              :class="{ active: activeMenu === 'sistema' }"
            >
              Configuración
              <span class="arrow" :class="{ rotated: activeMenu === 'sistema' }">▼</span>
            </button>
            <div class="submenu" v-show="activeMenu === 'sistema'">
              <RouterLink to="/diagnostico" class="submenu-item" @click="closeAllMenus">
                Diagnóstico
              </RouterLink>
              <RouterLink to="/test" class="submenu-item" @click="closeAllMenus">
                Pruebas
              </RouterLink>

            </div>
          </div>


          <!-- Sección de BUSQUEDA en NAV -->
          <div v-if="isAdmin || isGerente" class="menu-item" @click.stop>
            <button 
              @click="toggleMenu('busqueda')" 
              class="menu-button" 
              :class="{ active: activeMenu === 'busqueda' }"
            >
              Búsqueda
              <span class="arrow" :class="{ rotated: activeMenu === 'busqueda' }">▼</span>
            </button>
            <div class="submenu" v-show="activeMenu === 'busqueda'">
              <RouterLink to="/busqueda" class="submenu-item" @click="closeAllMenus">
                Busqueda básica
              </RouterLink>
              <RouterLink to="/busqueda-semantica" class="submenu-item" @click="closeAllMenus">
                Busqueda semántica
              </RouterLink>

            </div>
          </div>
        </nav>

        <!-- Información del usuario - Solo visible si está autenticado y no está cargando -->
        <div v-if=" isAuthenticated && userProfile" class="user-info-section">
          <div class="user-avatar">
            {{ userProfile.nombres?.charAt(0) }}{{ userProfile.apellidos?.charAt(0) }}
          </div>
          <div class="user-details">
            <div class="user-name">{{ userProfile.nombres }} {{ userProfile.apellidos }}</div>
            <div class="user-role">{{ getRoleName(userProfile.role_id) }}</div>
          </div>
          <button @click="handleLogout" class="logout-button">
            🚪
          </button>
        </div>

        <!-- Botón de login - Solo visible si NO está autenticado y no está cargando -->
        <!-- <div v-if="isAuthenticated" class="auth-section">
          <RouterLink to="/login" class="menu-button">
            🚪 Iniciar Sesión
          </RouterLink>
        </div>


        <button @click="handleLogout" class="logout-button">
          🚪 Cerrar sesión
        </button> -->
      </div>
    </header>

    <!-- Contenido principal -->
    <main class="main-content">
      <RouterView />
    </main>

    <!-- Footer fijo inferior -->
    <footer class="footer">
      <p>© 2025 Universal Box - Sistema de Gestión de Archivos</p>
    </footer>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { ref } from 'vue'
import { useAuth } from './composables/useAuth'
import { onMounted } from 'vue'

const { isAuthenticated, userProfile, isAdmin, isEditor, isGerente, signOut, getSession, setupAuthListener } = useAuth()

onMounted(() => {
  getSession()
  setupAuthListener()
})
const activeMenu = ref(null)

const toggleMenu = (menuName) => {
  activeMenu.value = activeMenu.value === menuName ? null : menuName
}

const closeAllMenus = () => {
  activeMenu.value = null
}

const getRoleName = (roleId) => {
  const roles = {
    1: 'Administrador',
    2: 'Editor',
    3: 'Gerente'
  }
  return roles[roleId] || 'Usuario'
}

const handleLogout = async () => {
  await signOut()
}


</script>
