<template>
  <div>
      <h1>Registrar usarios</h1>
      <form @submit.prevent="handleSignup">
        <input
          type="email"
          placeholder="Tu correo electrónico"
          v-model="email"
        />
        <input
          type="password"
          placeholder="Tu contraseña"
          v-model="password"
        />
        <button type="submit">Registrarse</button>
      </form>
      <p>
        Ya tienes una cuenta?
        <router-link to="/register">Ingresar</router-link>
      </p>
    </div>
</template>
_____________________________________________________________________________________________________

<script>
import { ref } from "vue";
import { useSupabase } from "../composables/useSupabase";

export default {
  setup() {
    const email = ref("");
    const password = ref("");

    const handleSignup = async () => {
      try {
        // Use the Supabase provided method to handle the signup
        const { error } = await useSupabase.auth.signUp({
          email: email.value,
          password: password.value,
        });
        if (error) throw error;
      } catch (error) {
        alert(error.error_description || error.message);
      }
    };

    return {
      email,
      password,
      handleSignup,
    };
  },
};
</script>
