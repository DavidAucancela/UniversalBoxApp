<template>
  <div>
    <h1>Ingresar usuario</h1>
    <form @submit.prevent="signIn">
      <input
        type="email"
        placeholder="Tú correo electrónico"
        v-model="email"
        required
      />
      <input
        type="password"
        placeholder="Tú contraseña"
        v-model="password"
        required
      />
      <button type="submit">Iniciar Sesión</button>
    </form>

    <p>
      ¿No recuerdas tu contraseña?
      <router-link to="/reset-password">Restablecer contraseña</router-link>
    </p>

    <p>
      ¿No tienes una cuenta?
      <router-link to="/login">Crear cuenta</router-link>
    </p>

    <p v-if="error">{{ error }}</p>
  </div>
</template>
-----------------------------------------------------------------------------
<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useSupabase } from "../composables/useSupabase";

const email = ref("");
const password = ref("");
const error = ref(null);
const router = useRouter();

const signIn = async () => {
  error.value = null;

  const { data, error: authError } = await useSupabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });

  if (authError) {
    error.value = "Credenciales incorrectas.";
    return;
  }

  console.log("Usuario autenticado:", data);
  const userId = data.user.id;

  const { data: perfil, error: perfilError } = await useSupabase
    .from("usuarios")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (perfilError) {
    error.value = "No se encontró el perfil del usuario.";
  } else {
    console.log("Perfil del usuario:", perfil);
    // Redirige a Home.vue
    router.push("/home");
  }
};
</script>
