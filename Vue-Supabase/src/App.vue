<template>
  <div class="app-layout">
    <!-- Navbar fijo superior -->
    <header class="navbar">
      <nav>
        <RouterLink to="/login">Ingresar</RouterLink>
        <RouterLink to="/register">Registrar</RouterLink>
        <RouterLink to="/test">Prueba</RouterLink>
      </nav>
    </header>

    <!-- Contenido principal con espacio reservado entre navbar y footer -->
    <main class="main-content">
      <RouterView />
    </main>

    <!-- Footer fijo inferior -->
    <footer class="footer">
      <p>© 2025 Universal Box</p>
    </footer>
  </div>
</template>

<script setup>
  import { RouterLink, RouterView } from 'vue-router'
</script>
