<template>
  <div class="archivos-container">
    <div class="files-list-view">
      <div class="list-header">
        <h1 class="page-header">Historial de Archivos</h1>
        <p class="page-subtitle">Gestiona y visualiza todos los archivos procesados</p>
      </div>
    </div>
    <div v-if="loading" class="loading">Cargando archivos...</div>
    <div v-else>
      <div v-if="files.length === 0" class="no-files">No tienes archivos subidos.</div>
      <table v-else class="archivos-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Fecha subida</th>
            <th>Tamaño</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="archivo in files" :key="archivo.id">
            <td>{{ archivo.nombre_archivo }}</td>
            <td>{{ formatFecha(archivo.fecha_subida) }}</td>
            <td>{{ formatTamaño(archivo.tamaño_bytes) }}</td>
            <td>{{ archivo.estado }}</td>
            <td>
              <a :href="archivo.metadata?.url_publica" target="_blank" v-if="archivo.metadata?.url_publica">Ver</a>
              <button @click="eliminarArchivo(archivo.id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useExcelFiles } from '../composables/useExcelFiles'

const { files, loading, getUserFiles, deleteFile } = useExcelFiles()

onMounted(() => {
  getUserFiles()
})

const formatFecha = (fecha) => {
  if (!fecha) return '-'
  return new Date(fecha).toLocaleString('es-ES')
}

const formatTamaño = (bytes) => {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const eliminarArchivo = async (id) => {
  if (confirm('¿Seguro que deseas eliminar este archivo?')) {
    await deleteFile(id)
    await getUserFiles()
  }
}
</script>

<style scoped>
.archivos-container {
  max-width: 900px;
  margin: 2rem auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  padding: 2rem;
  color: #111;
}

.archivos-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1.5rem;
  color: #111;
}
.archivos-table th, .archivos-table td {
  border: 1px solid #e0e0e0;
  padding: 0.75rem 1rem;
  text-align: left;
}
.archivos-table th {
  background: #f8f9fa;
  font-weight: 600;
}
.archivos-table tr:nth-child(even) {
  background: #f6f8fa;
}
.loading {
  color: #007bff;
  font-weight: 500;
  margin: 2rem 0;
}
.no-files {
  color: #888;
  font-size: 1.1rem;
  margin: 2rem 0;
}
button {
  background: #dc3545;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.4rem 1rem;
  cursor: pointer;
  margin-left: 0.5rem;
  transition: background 0.2s;
}
button:hover {
  background: #b52a37;
}
a {
  color: #007bff;
  text-decoration: underline;
  margin-right: 0.5rem;
}
</style>
