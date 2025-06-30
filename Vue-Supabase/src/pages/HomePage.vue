<template>
  <div class="home-container">
    <!-- informacion del usuario -->
    <section v-if="isAuthenticated && userProfile" class="welcome-section">
      <div class="welcome-card">
        <div class="welcome-header">
          <div class="welcome-avatar">
            {{ userProfile.nombres?.charAt(0) }}{{ userProfile.apellidos?.charAt(0) }}
          </div>
          <div class="welcome-info">
            <h2>¡Hola, {{ userProfile.nombres + " " + userProfile.apellidos }}!</h2>
            <p>{{ getRoleName(userProfile.role_id) }} - {{ userProfile.empresa || 'Universal Box' }}</p>
          </div>
        </div>
        <!-- <div class="welcome-actions">
          <RouterLink to="/subir-archivo" class="action-button primary">
            📤 Subir Archivo
          </RouterLink>
          <RouterLink to="/dashboard" class="action-button secondary">
            📋 Ver Archivos
          </RouterLink>
        </div> -->
      </div>
    </section>

    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Bienvenido a Universal Box</h1>
        <p class="hero-subtitle">Sistema de almacenamiento web</p>
        <div class="hero-stats" v-if="isAuthenticated">
          
          <!--archivos-->
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.totalFiles || 0 }}</div>
              <div class="stat-label">Archivos</div>
            </div>
          </div>
          
          <!-- usuarios
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.totalUsers || 0 }}</div>
              <div class="stat-label">Usuarios</div>
            </div>
          </div> -->
          
          <!--almacenamiento-->
          <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.totalSize || '0 MB' }}</div>
              <div class="stat-label">Almacenamiento</div>
            </div>
          </div>
        </div>
      </div>
    </section>


    <!-- Acciones rápidas - acciones del sistema -->
    <section v-if="isAuthenticated" class="quick-actions">
      <h3>Acciones Rápidas</h3>
      <div class="actions-grid">
        <RouterLink v-if="isAdmin || isEditor" to="/subir-archivo" class="action-card">
          <div class="action-icon">📤</div>
          <h4>Subir Archivo</h4>
          <p>Carga archivos Excel para su gestión</p>
        </RouterLink>
        <RouterLink v-if="isAdmin || isManager" to="/busqueda" class="action-card">
          <div class="action-icon">🗂️</div>
          <h4>Registro envíos</h4>
          <p>Ingresa un nuevo registro de envío</p>
        </RouterLink>
        <RouterLink v-if="isAdmin || isEditor" to="/test" class="action-card">
          <div class="action-icon">⁉️</div>
          <h4>Pruebas</h4>
          <p>Verificaciones de Supabase</p>
        </RouterLink>
        <RouterLink v-if="isAdmin || isEditor" to="/busqueda" class="action-card">
          <div class="action-icon">🔍</div>
          <h4>Búsqueda</h4>
          <p>Busca en los archivos Excel cargados</p>
        </RouterLink>
        <RouterLink v-if="isAdmin" to="/gestion-usuarios" class="action-card">
          <div class="action-icon">👥</div>
          <h4>Gestión usuarios</h4>
          <p>Administra usuarios del sistema</p>
        </RouterLink>
        <RouterLink v-if="isAdmin" to="/login" class="action-card">
          <div class="action-icon">👤</div>
          <h4>Registro usuario</h4>
          <p>Ingresa un nuevo usuario en el sistema</p>
        </RouterLink>
        <RouterLink v-if="isAdmin || isManager" to="/diagnostico" class="action-card">
          <div class="action-icon">📊</div>
          <h4>Diagnóstico</h4>
          <p>Estado del sistema</p>
        </RouterLink>
        <RouterLink v-if="isAdmin || isManager || isEditor" to="/reset-password" class="action-card">
          <div class="action-icon">🔑</div>
          <h4>Contraseña</h4>
          <p>Restablecer la contraseña</p>
        </RouterLink>
      </div>
    </section>

    <!-- caracteristicas del sistemas
    <section class="features-section">
      <h3>Características del sistema</h3>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🔒</div>
          <h4>Seguridad</h4>
          <p>Control de secciones mediante token y gestión de usuarios</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">📊</div>
          <h4>Gestión de archivos</h4>
          <p>Carga, visualización y consulta de archivos Excel</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h4>Búsqueda semántica</h4>
          <p>acceso a la información mediante NPL</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">📱</div>
          <h4>Diseño responsive </h4>
          <p>Interfaz adaptada para todos los dispositivos</p>
        </div>
      </div>
    </section> -->

    <!-- para usuarios no autentificados -->
    <section v-if="!isAuthenticated" class="login-prompt">
      <div class="prompt-card">
        <h3>Accede a tu cuenta</h3>
        <p>Inicia sesión para comenzar a gestionar tus archivos</p>
        <div class="prompt-actions">
          <RouterLink to="/login" class="action-button primary">
            🚪 Iniciar Sesión
          </RouterLink>
          <RouterLink to="/register" class="action-button secondary">
            📝 Registrarse
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useSupabase } from '@/composables/useSupabase'

const { isAuthenticated, userProfile, isAdmin, isEditor, isManager } = useAuth()
const stats = ref({
  totalFiles: 0,
  totalUsers: 0,
  totalSize: '0 MB'
})

const getRoleName = (roleId) => {
  const roles = {
    1: 'Administrador',
    2: 'Editor',
    3: 'Gerente'
  }
  return roles[roleId] || 'Usuario'
}

const loadStats = async () => {
  if (!isAuthenticated.value) {
    console.log('🔒 Usuario no autenticado, saltando carga de estadísticas')
    return
  }
  
  console.log('📊 Iniciando carga de estadísticas...')
  
  try {
    // Cargar estadísticas de archivos Excel
    console.log('📁 Consultando tabla archivos_excel...')
    const { count: filesCount, error: filesError } = await useSupabase
      .from('archivos_excel')
      .select('*', { count: 'exact', head: true })
    
    if (filesError) {
      console.error('❌ Error consultando archivos_excel:', filesError)
      throw filesError
    }
    
    console.log('✅ Archivos encontrados:', filesCount)
    
    // Cargar estadísticas de usuarios (solo para admin)
    let usersCount = 0
    if (isAdmin.value) {
      console.log('👥 Consultando tabla usuarios (admin)...')
      const { count, error: usersError } = await useSupabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
      
      if (usersError) {
        console.error('❌ Error consultando usuarios:', usersError)
        throw usersError
      }
      
      usersCount = count || 0
      console.log('✅ Usuarios encontrados:', usersCount)
    }
    
    // Calcular tamaño total de archivos
    let totalSize = '0 MB'
    if (filesCount > 0) {
      console.log('📏 Calculando tamaño total de archivos...')
      const { data: filesData, error: sizeError } = await useSupabase
        .from('archivos_excel')
        .select('tamaño_bytes')
      
      if (sizeError) {
        console.error('❌ Error consultando tamaños:', sizeError)
        throw sizeError
      }
      
      if (filesData && filesData.length > 0) {
        const totalBytes = filesData.reduce((sum, file) => sum + (file.tamaño_bytes || 0), 0)
        const totalMB = (totalBytes / (1024 * 1024)).toFixed(1)
        totalSize = `${totalMB} MB`
        console.log('✅ Tamaño total calculado:', totalSize)
      }
    }
    
    stats.value = {
      totalFiles: filesCount || 0,
      totalUsers: usersCount,
      totalSize
    }
    
    console.log('✅ Estadísticas actualizadas:', stats.value)
  } catch (error) {
    console.error('❌ Error cargando estadísticas:', error)
    console.error('Detalles del error:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    
    // Establecer valores por defecto en caso de error
    stats.value = {
      totalFiles: 0,
      totalUsers: 0,
      totalSize: '0 MB'
    }
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Hero Section */
.hero-section {
  text-align: center;
  padding: 3rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  margin-bottom: 3rem;
  color: white;
}

.hero-title {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.hero-subtitle {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem 1.5rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-icon {
  font-size: 2rem;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

/* Welcome Section */
.welcome-section {
  margin-bottom: 3rem;
}

.welcome-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.welcome-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.welcome-avatar {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
}

.welcome-info h2 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.welcome-info p {
  margin: 0.5rem 0 0 0;
  color: #666;
}

.welcome-actions {
  display: flex;
  gap: 1rem;
}

/* Quick Actions */
.quick-actions {
  margin-bottom: 3rem;
}

.quick-actions h3 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
  font-size: 1.8rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.action-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.action-card h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.2rem;
}

.action-card p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

/* Features Section */
.features-section {
  margin-bottom: 3rem;
}

.features-section h3 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
  font-size: 1.8rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.2rem;
}

.feature-card p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

/* Login Prompt */
.login-prompt {
  text-align: center;
}

.prompt-card {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.prompt-card h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.8rem;
}

.prompt-card p {
  margin: 0 0 2rem 0;
  color: #666;
  font-size: 1.1rem;
}

.prompt-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

/* Action Buttons */
.action-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.action-button.primary {
  background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%);
  color: white;
}

.action-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(67, 97, 238, 0.4);
}

.action-button.secondary {
  background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
  color: white;
}

.action-button.secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(108, 117, 125, 0.4);
}

/* Responsive */
@media (max-width: 768px) {
  .home-container {
    padding: 1rem;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .welcome-header {
    flex-direction: column;
    text-align: center;
  }
  
  .welcome-actions {
    flex-direction: column;
  }
  
  .actions-grid,
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .prompt-actions {
    flex-direction: column;
  }
}
</style>
