<template>
  <div class="login-wrapper">
    <div class="card">
      <h1 class="title">👋 ¡Bienvenido de nuevo!</h1>
      <p class="subtitle">Inicia sesión para acceder a tu cuenta</p>
      
      <!-- Mensaje de éxito al actualizar contraseña -->
      <div v-if="passwordUpdated" class="success-message">
        ✅ Tu contraseña ha sido actualizada. Por favor, inicia sesión.
      </div>
      
      <form @submit.prevent="handleLogin">
        <!-- Email -->
        <div class="form-group">
          <label for="email">Correo Electrónico</label>
          <input 
            id="email"
            type="email"
            v-model="email"
            required
            placeholder="tu@correo.com"
          />
        </div>
        
        <!-- Contraseña -->
        <div class="form-group">
          <div class="label-group">
            <label for="password">Contraseña</label>
            <RouterLink to="/reset-password" class="forgot-password-link">
              ¿Olvidaste tu contraseña?
            </RouterLink>
          </div>
          <input 
            id="password"
            type="password"
            v-model="password"
            required
            placeholder="********"
          />
        </div>

        <!-- Mensaje de error -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <!-- Botón de Login -->
        <button type="submit" :disabled="loading" class="btn-primary">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
        </button>
      </form>
      
      <div class="register-link">
        <p>¿No tienes una cuenta? 
          <RouterLink to="/register">Regístrate aquí</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const route = useRoute()
const { signIn } = useAuth()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const passwordUpdated = ref(false)

const handleLogin = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const { success, error } = await signIn(email.value, password.value)
    if (success) {
      router.push('/')
    } else {
      errorMessage.value = error?.message || 'Correo o contraseña incorrectos.'
    }
  } catch (err) {
    errorMessage.value = err.message || 'Ocurrió un error inesperado.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (route.query.passwordUpdated) {
    passwordUpdated.value = true
  }
})
</script>

<style scoped>
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 4rem 1rem;
  min-height: calc(100vh - 120px);
}

.card {
  width: 100%;
  max-width: 420px;
}

.title {
  text-align: center;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
}

.label-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.forgot-password-link {
  font-size: 0.85rem;
  color: var(--primary-color);
  text-decoration: none;
}

.forgot-password-link:hover {
  text-decoration: underline;
}

.btn-primary {
  width: 100%;
  margin-top: 1rem;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  border-top-color: #fff;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.register-link {
  text-align: center;
  margin-top: 2rem;
  font-size: 0.9rem;
}

.register-link a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>
