<template>
  <div class="container">
    <h1>Bienvenido</h1>
    <button @click="logout">Cerrar sesión</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useSupabase } from "../composables/useSupabase";

const router = useRouter()

const logout = async () => {
  await useSupabase.auth.signOut()
  router.push('/login')
}
</script>
