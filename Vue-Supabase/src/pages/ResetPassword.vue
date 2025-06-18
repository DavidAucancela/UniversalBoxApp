<template>
  <div class="login-wrapper">
    <div class="login-card">
      <h1 class="title">Restablecer contraseña</h1>
      <p class="subtitle">Te enviaremos un enlace para cambiar tu contraseña</p>

      <form @submit.prevent="sendReset">
        <div class="form-group">
          <label for="email">Correo electrónico</label>
          <input type="email" v-model="email" id="email" required placeholder="usuario@correo.com" />
        </div>

        <button type="submit" class="login-button">Enviar enlace</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')

function sendReset() {
  alert(`Se envió un correo a: ${email.value}`)
}
</script>
