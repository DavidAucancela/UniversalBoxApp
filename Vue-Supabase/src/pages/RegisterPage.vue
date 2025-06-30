<template>
  <div class="login-wrapper">
    <div class="login-card">
      <h1 class="title">Crear Cuenta</h1>
      <p class="subtitle">Regístrate para acceder al sistema</p>

      <form @submit.prevent="handleSignup">
        <div class="form-group">
          <label for="nombres">Nombres</label>
          <input 
            id="nombres" 
            type="text" 
            v-model="formData.nombres" 
            placeholder="Ingresa tus nombres"
            required
          />
        </div>

        <div class="form-group">
          <label for="apellidos">Apellidos</label>
          <input 
            id="apellidos" 
            type="text" 
            v-model="formData.apellidos" 
            placeholder="Ingresa tus apellidos"
            required
          />
        </div>

        <div class="form-group">
          <label for="email">Correo electrónico</label>
          <input 
            id="email" 
            type="email" 
            v-model="formData.email" 
            placeholder="tu@email.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <input 
            id="password" 
            type="password" 
            v-model="formData.password" 
            placeholder="Mínimo 6 caracteres"
            required
            minlength="6"
          />
        </div>

        <div class="form-group">
          <label for="role_id">Rol</label>
          <select id="role_id" v-model="formData.role_id" required>
            <option value="">Selecciona un rol</option>
            <option value="1">Gerente</option>
            <option value="2">Administrador</option>
            <option value="3">Digitador</option>
          </select>
        </div>

        <button type="submit" class="login-button" :disabled="loading">
          <span v-if="loading">⏳ Creando cuenta...</span>
          <span v-else>Crear Cuenta</span>
        </button>
      </form>

      <p class="subtitle" style="margin-top: 1.5rem;">
        ¿Ya tienes una cuenta?
        <router-link class="reset-link" to="/login">Iniciar sesión</router-link>
      </p>

      <!-- Mensajes de estado -->
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
// import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";

//const router = useRouter();
const { signUp } = useAuth();
const loading = ref(false);
const error = ref(null);
const successMessage = ref(null);

const formData = ref({
  nombres: '',
  apellidos: '',
  email: '',
  password: '',
  role_id: ''
});

const handleSignup = async () => {
  // Validaciones
  if (!formData.value.nombres || !formData.value.apellidos || 
      !formData.value.email || !formData.value.password || 
      !formData.value.role_id) {
    error.value = "Por favor, completa todos los campos.";
    return;
  }

  if (formData.value.password.length < 6) {
    error.value = "La contraseña debe tener al menos 6 caracteres.";
    return;
  }

  try {
    loading.value = true;
    error.value = null;
    successMessage.value = null;

    console.log('Datos del formulario:', {
      email: formData.value.email,
      nombres: formData.value.nombres,
      apellidos: formData.value.apellidos,
      role_id: formData.value.role_id
    });

    // Usar el composable de autenticación
    const result = await signUp(formData.value);

    console.log('Resultado del registro:', result);

    // if (result.success) {
    //   successMessage.value = "¡Cuenta creada exitosamente! Revisa tu correo para confirmar tu cuenta.";
      
    //   // Limpiar formulario
    //   formData.value = {
    //     nombres: '',
    //     apellidos: '',
    //     email: '',
    //     password: '',
    //     role_id: ''
    //   };

    //   // Redirigir después de 3 segundos
    //   setTimeout(() => {
    //     router.push('/login');
    //   }, 3000);
    // } else {
    //   console.error('Error detallado:', result.error);
    //   throw result.error;
    // }

  } catch (err) {
    console.error('Error en registro:', err);
    
    // Manejar errores específicos de Supabase
    if (err.message.includes('email')) {
      error.value = "El correo electrónico ya está registrado.";
    } else if (err.message.includes('password')) {
      error.value = "La contraseña no cumple con los requisitos de seguridad.";
    } else if (err.message.includes('Database error saving new user')) {
      error.value = "Error en la base de datos. Verifica que el trigger esté configurado correctamente.";
      console.error('🔍 Error del trigger - Verifica la función handle_new_user() en Supabase');
    } else {
      error.value = "Error al crear la cuenta: " + err.message;
    }
  } finally {
    loading.value = false;
  }
};
</script>

