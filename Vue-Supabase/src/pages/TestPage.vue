<template>
  <div class="container">
    <h1>Probar conexión con Supabase</h1>
    <button @click="fetchData">Consultar Datos</button>

    <ul v-if="data.length">
      <li v-for="item in data" :key="item.id">{{ item.name }}</li>
    </ul>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSupabase } from "../composables/useSupabase";

const data = ref([])
const error = ref(null)

//funcion para consultar datos de la tabla 'test_data'
const fetchData = async () => {
  const { data: rows, error: err } = await useSupabase.from('test_data').select('*')
  if (err) {
    console.error('Error al consultar:', err)
    error.value = err.message
  } else {
    console.log('Datos obtenidos:', rows)
    data.value = rows
  }
}
</script>
