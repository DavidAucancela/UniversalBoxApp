<template>
  <div class="reset-password-container">
    <div class="card">
      <h1 class="title">🔑 Restablecer Contraseña</h1>

      <!-- Estado 1: Formulario para solicitar el correo de reseteo -->
      <div v-if="!sent && !isUpdateMode" class="form-section">
        <p class="subtitle">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>
        <form @submit.prevent="handleResetRequest">
          <div class="form-group">
            <label for="email">Correo Electrónico</label>
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              placeholder="tu@correo.com" 
              required
            />
          </div>
          <button type="submit" class="btn-primary" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Enviando...' : 'Enviar Enlace de Reseteo' }}
          </button>
        </form>
      </div>

      <!-- Estado 2: Mensaje de confirmación de envío -->
      <div v-if="sent" class="confirmation-section">
        <div class="icon success">✔️</div>
        <h2 class="subtitle">Correo Enviado</h2>
        <p>
          Hemos enviado un enlace de reseteo a <strong>{{ email }}</strong>. 
          Por favor, revisa tu bandeja de entrada (y la carpeta de spam).
        </p>
        <button @click="sent = false" class="btn-secondary">
          ¿No lo recibiste? Intenta de nuevo
        </button>
      </div>

      <!-- Estado 3: Formulario para establecer nueva contraseña -->
      <div v-if="isUpdateMode" class="form-section">
        <p class="subtitle">
          Ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.
        </p>
        <form @submit.prevent="handlePasswordUpdate">
          <div class="form-group">
            <label for="password">Nueva Contraseña</label>
            <input 
              type="password" 
              id="password" 
              v-model="newPassword" 
              placeholder="********" 
              required
            />
          </div>
          <div class="form-group">
            <label for="confirmPassword">Confirmar Nueva Contraseña</label>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="confirmPassword" 
              placeholder="********" 
              required
            />
          </div>
          <button type="submit" class="btn-primary" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Actualizando...' : 'Actualizar Contraseña' }}
          </button>
        </form>
      </div>
      
      <!-- Mensajes de error -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      
      <div class="back-to-login">
        <RouterLink to="/login">← Volver a Iniciar Sesión</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const { resetPassword, updatePassword } = useAuth()
const router = useRouter()
const route = useRoute()

const email = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const loading = ref(false)
const sent = ref(false)
const errorMessage = ref('')
const isUpdateMode = ref(false)

// Manejar solicitud de reseteo de contraseña
const handleResetRequest = async () => {
  loading.value = true
  errorMessage.value = ''
  
  const result = await resetPassword(email.value)
  
  if (result.success) {
    sent.value = true
  } else {
    errorMessage.value = result.error || 'Ocurrió un error al enviar el correo.'
  }
  
  loading.value = false
}

// Manejar actualización de contraseña
const handlePasswordUpdate = async () => {
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Las contraseñas no coinciden.'
    return
  }
  if (newPassword.value.length < 6) {
    errorMessage.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }
  
  loading.value = true
  errorMessage.value = ''
  
  const result = await updatePassword(newPassword.value)
  
  if (result.success) {
    // Redirigir a login con un mensaje
    router.push({ name: 'login', query: { passwordUpdated: 'true' } })
  } else {
    errorMessage.value = result.error || 'Ocurrió un error al actualizar la contraseña.'
  }
  
  loading.value = false
}

// Comprobar si estamos en modo de actualización al montar
onMounted(() => {
  // Supabase usa el hash para el token de reseteo
  if (route.hash.includes('access_token')) {
    isUpdateMode.value = true
  }
})
</script>

<style scoped>
.reset-password-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 4rem 1rem;
  min-height: calc(100vh - 120px);
}

.card {
  width: 100%;
  max-width: 450px;
}

.title {
  text-align: center;
  margin-bottom: 0.5rem;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
}

.form-section, .confirmation-section {
  width: 100%;
}

.form-group {
  margin-bottom: 1.5rem;
}

.btn-primary {
  width: 100%;
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

.confirmation-section {
  text-align: center;
}

.icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.icon.success {
  color: #28a745;
}

.back-to-login {
  text-align: center;
  margin-top: 2rem;
}

.back-to-login a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.back-to-login a:hover {
  text-decoration: underline;
}
</style>
