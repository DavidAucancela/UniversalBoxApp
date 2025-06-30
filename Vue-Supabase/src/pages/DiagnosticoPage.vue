<template>
  <div class="container">
    <h1 class="page-header">Diagnóstico del Sistema</h1>
    <p class="page-subtitle">Monitorea el estado y rendimiento de la aplicación</p>
    
    <div class="diagnostic-section">
      <h2>Estado de Autenticación</h2>
      <div class="status-cards-grid">
        <div class="status-card">
          <h3>Usuario Actual</h3>
          <pre>{{ JSON.stringify(user, null, 2) }}</pre>
        </div>
        <div class="status-card">
          <h3>Perfil del Usuario</h3>
          <pre>{{ JSON.stringify(userProfile, null, 2) }}</pre>
        </div>
        <div class="status-card">
          <h3>Estado de Autenticación</h3>
          <p><strong>Autenticado:</strong> {{ isAuthenticated }}</p>
          <p><strong>Es Admin:</strong> {{ isAdmin }}</p>
          <p><strong>Es Editor:</strong> {{ isEditor }}</p>
          <p><strong>Es Manager:</strong> {{ isManager }}</p>
        </div>
      </div>
    </div>

    <div class="diagnostic-section">
      <h2>Gestión de Usuarios</h2>
      <div class="actions">
        <button @click="verificarTablaUsuarios" class="btn-primary">
          🔍 Verificar Tabla Usuarios
        </button>
        <button @click="verificarTablaProfiles" class="btn-primary">
          🔍 Verificar Tabla Profiles
        </button>
        <button @click="verificarTrigger" class="btn-primary">
          🔍 Verificar Trigger
        </button>
      </div>
      <div v-if="resultados.length" class="results">
        <h3>Resultados de Verificación</h3>
        <div v-for="(resultado, index) in resultados" :key="index" class="result-item">
          <h4>{{ resultado.titulo }}</h4>
          <pre>{{ JSON.stringify(resultado.data, null, 2) }}</pre>
          <p v-if="resultado.error" class="error">Error: {{ resultado.error }}</p>
        </div>
      </div>
    </div>

    <div class="diagnostic-section">
      <h2>Prueba de Registro Manual</h2>
      <form @submit.prevent="probarRegistro" class="test-form">
        <div class="form-group">
          <label>Email de prueba:</label>
          <input v-model="testData.email" type="email" placeholder="test@example.com" required />
        </div>
        <div class="form-group">
          <label>Nombres:</label>
          <input v-model="testData.nombres" type="text" placeholder="Test" required />
        </div>
        <div class="form-group">
          <label>Apellidos:</label>
          <input v-model="testData.apellidos" type="text" placeholder="User" required />
        </div>
        <div class="form-group">
          <label>Rol:</label>
          <select v-model="testData.role_id" required>
            <option value="1">Administrador</option>
            <option value="2">Editor</option>
            <option value="3">Gerente</option>
          </select>
        </div>
        <button type="submit" class="btn-primary">🧪 Probar Registro</button>
      </form>
      <div v-if="testResult" class="test-result">
        <h3>Resultado de la Prueba</h3>
        <pre>{{ JSON.stringify(testResult, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useSupabase } from '../composables/useSupabase'

const { user, userProfile, isAuthenticated, isAdmin, isEditor, isManager } = useAuth()

const resultados = ref([])
const testResult = ref(null)

const testData = ref({
  email: '',
  nombres: '',
  apellidos: '',
  role_id: '2'
})

const verificarTablaUsuarios = async () => {
  try {
    const { data, error } = await useSupabase
      .from('usuarios')
      .select('*')
      .limit(5)

    resultados.value.push({
      titulo: 'Tabla Usuarios',
      data: data,
      error: error?.message
    })
  } catch (err) {
    resultados.value.push({
      titulo: 'Tabla Usuarios',
      data: null,
      error: err.message
    })
  }
}

const verificarTablaProfiles = async () => {
  try {
    const { data, error } = await useSupabase
      .from('profiles')
      .select('*')
      .limit(5)

    resultados.value.push({
      titulo: 'Tabla Profiles',
      data: data,
      error: error?.message
    })
  } catch (err) {
    resultados.value.push({
      titulo: 'Tabla Profiles',
      data: null,
      error: err.message
    })
  }
}

const verificarTrigger = async () => {
  try {
    // Verificar si existe la función
    const { error } = await useSupabase
      .rpc('handle_new_user', { test: true })

    resultados.value.push({
      titulo: 'Función handle_new_user',
      data: { message: 'Función encontrada' },
      error: error?.message
    })
  } catch (err) {
    resultados.value.push({
      titulo: 'Función handle_new_user',
      data: null,
      error: err.message
    })
  }
}

const probarRegistro = async () => {
  try {
    console.log('🧪 Probando registro con datos:', testData.value)
    
    const { data, error } = await useSupabase.auth.signUp({
      email: testData.value.email,
      password: 'test123456',
      options: {
        data: {
          nombres: testData.value.nombres,
          apellidos: testData.value.apellidos,
          role_id: parseInt(testData.value.role_id)
        }
      }
    })

    testResult.value = {
      success: !error,
      data: data,
      error: error?.message
    }

    console.log('🧪 Resultado de prueba:', testResult.value)
  } catch (err) {
    testResult.value = {
      success: false,
      error: err.message
    }
  }
}
</script>

<style scoped>
:root {
  --primary-color: #007bff;
  --primary-light: #339cff;
  --dark-color: #222;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  color: #111;
  background: #fafbfc;
}

.diagnostic-section {
  margin-bottom: 3rem;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  color: #111;
}

.status-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}

.status-card {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  color: #111;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.status-card h3 {
  margin: 0 0 1rem 0;
  color: #111;
}

.status-card pre {
  background: #fff;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.9rem;
  color: #111;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--primary-light);
}

.results {
  margin-top: 2rem;
}

.result-item {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  color: #111;
}

.result-item h4 {
  margin: 0 0 1rem 0;
  color: #111;
}

.result-item pre {
  background: #fff;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.9rem;
  color: #111;
}

.result-item .error {
  color: #dc3545;
  font-weight: 500;
}

.test-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  color: #111;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #111;
}

.form-group input,
.form-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  color: #111;
  background: #fff;
}

.test-result {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  color: #111;
}

.test-result pre {
  background: #fff;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.9rem;
  color: #111;
}

h1, h2, h3, h4, h5, h6, p, label, span, div, button {
  color: #111 !important;
}
</style> 