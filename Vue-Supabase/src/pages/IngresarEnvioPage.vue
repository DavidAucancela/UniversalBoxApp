<template>
  <div class="container">
    <div class="ingresar-envio-section">
      <h1 class="page-header">Ingresar Envíos Manualmente</h1>
      <p class="page-subtitle">Agrega envíos uno por uno y visualiza la tabla en tiempo real</p>

      <!-- Formulario para agregar envío -->
      <div class="form-card">
        <h3>Nuevo Envío</h3>
        
        <div class="form-grid">
          <div class="form-group">
            <label for="hawb">HAWB</label>
            <input 
              id="hawb"
              v-model="nuevoEnvio.hawb" 
              type="text" 
              placeholder="Número de HAWB"
              required
            >
          </div>

          <div class="form-group">
            <label for="consignatario">Consignatario</label>
            <input 
              id="consignatario"
              v-model="nuevoEnvio.consignatario" 
              type="text" 
              placeholder="Nombre del consignatario"
              required
            >
          </div>

          <div class="form-group">
            <label for="cedula">Cédula</label>
            <input 
              id="cedula"
              v-model="nuevoEnvio.cedula" 
              type="text" 
              placeholder="Número de cédula"
              required
            >
          </div>

          <div class="form-group">
            <label for="peso">Peso (kg)</label>
            <input 
              id="peso"
              v-model="nuevoEnvio.peso" 
              type="number" 
              step="0.01"
              placeholder="0.00"
              required
            >
          </div>

          <div class="form-group">
            <label for="descripcion">Descripción</label>
            <textarea 
              id="descripcion"
              v-model="nuevoEnvio.descripcion" 
              placeholder="Descripción del envío"
              rows="2"
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label for="cantidad">Cantidad</label>
            <input 
              id="cantidad"
              v-model="nuevoEnvio.cantidad" 
              type="number" 
              min="1"
              placeholder="1"
              required
            >
          </div>

          <div class="form-group">
            <label for="factura">Factura Comercial</label>
            <input 
              id="factura"
              v-model="nuevoEnvio.factura" 
              type="text" 
              placeholder="Número de factura"
              required
            >
          </div>

          <div class="form-group">
            <label for="fechaEmision">Fecha de Emisión</label>
            <input 
              id="fechaEmision"
              v-model="nuevoEnvio.fechaEmision" 
              type="date" 
              required
            >
          </div>
        </div>

        <div class="form-actions">
          <button 
            @click="agregarEnvio" 
            :disabled="!esFormularioValido || agregando"
            class="add-button"
          >
            <span v-if="agregando" class="loading-spinner">⏳</span>
            {{ agregando ? 'Agregando...' : 'Agregar Envío' }}
          </button>
          
          <button 
            @click="limpiarFormulario" 
            class="clear-button"
          >
            Limpiar
          </button>
        </div>
      </div>

      <!-- Tabla de envíos -->
      <div v-if="envios.length > 0" class="table-section">
        <div class="table-header">
          <h3>Envíos Agregados ({{ envios.length }})</h3>
          <div class="table-actions">
            <button 
              @click="guardarArchivo" 
              :disabled="guardando || envios.length === 0"
              class="save-button"
            >
              <span v-if="guardando" class="loading-spinner">⏳</span>
              {{ guardando ? 'Guardando...' : 'Guardar como Excel' }}
            </button>
            
            <button 
              @click="limpiarTodos" 
              class="clear-all-button"
            >
              Limpiar Todos
            </button>
          </div>
        </div>

        <div class="table-container">
          <table class="envios-table">
            <thead>
              <tr>
                <th>#</th>
                <th>HAWB</th>
                <th>Consignatario</th>
                <th>Cédula</th>
                <th>Peso (kg)</th>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Factura</th>
                <th>Fecha Emisión</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(envio, index) in envios" :key="index" class="envio-row">
                <td>{{ index + 1 }}</td>
                <td>{{ envio.hawb }}</td>
                <td>{{ envio.consignatario }}</td>
                <td>{{ envio.cedula }}</td>
                <td>{{ envio.peso }}</td>
                <td class="descripcion-cell">{{ envio.descripcion }}</td>
                <td>{{ envio.cantidad }}</td>
                <td>{{ envio.factura }}</td>
                <td>{{ formatDate(envio.fechaEmision) }}</td>
                <td>
                  <button 
                    @click="editarEnvio(index)" 
                    class="action-button edit"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button 
                    @click="eliminarEnvio(index)" 
                    class="action-button delete"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mensaje cuando no hay envíos -->
      <div v-else class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>No hay envíos agregados</h3>
        <p>Comienza agregando tu primer envío usando el formulario de arriba</p>
      </div>

      <!-- Mensajes de estado -->
      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useExcelFiles } from '../composables/useExcelFiles'
// import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'

// const router = useRouter()
const { uploadExcelFile } = useExcelFiles()

// Estado del componente
const envios = ref([])
const agregando = ref(false)
const guardando = ref(false)
const message = ref('')
const messageType = ref('')
const editandoIndex = ref(-1)

// Formulario de nuevo envío
const nuevoEnvio = ref({
  hawb: '',
  consignatario: '',
  cedula: '',
  peso: '',
  descripcion: '',
  cantidad: '',
  factura: '',
  fechaEmision: ''
})

// Validar formulario
const esFormularioValido = computed(() => {
  return nuevoEnvio.value.hawb.trim() !== '' &&
         nuevoEnvio.value.consignatario.trim() !== '' &&
         nuevoEnvio.value.cedula.trim() !== '' &&
         nuevoEnvio.value.peso !== '' &&
         nuevoEnvio.value.descripcion.trim() !== '' &&
         nuevoEnvio.value.cantidad !== '' &&
         nuevoEnvio.value.factura.trim() !== '' &&
         nuevoEnvio.value.fechaEmision !== ''
})

// Agregar envío
const agregarEnvio = () => {
  if (!esFormularioValido.value) {
    mostrarMensaje('Por favor completa todos los campos', 'error')
    return
  }

  if (editandoIndex.value >= 0) {
    // Actualizar envío existente
    envios.value[editandoIndex.value] = { ...nuevoEnvio.value }
    editandoIndex.value = -1
    mostrarMensaje('Envío actualizado correctamente', 'success')
  } else {
    // Agregar nuevo envío
    envios.value.push({ ...nuevoEnvio.value })
    mostrarMensaje('Envío agregado correctamente', 'success')
  }

  limpiarFormulario()
}

// Editar envío
const editarEnvio = (index) => {
  nuevoEnvio.value = { ...envios.value[index] }
  editandoIndex.value = index
  mostrarMensaje('Modo edición activado', 'info')
}

// Eliminar envío
const eliminarEnvio = (index) => {
  envios.value.splice(index, 1)
  if (editandoIndex.value === index) {
    editandoIndex.value = -1
    limpiarFormulario()
  }
  mostrarMensaje('Envío eliminado correctamente', 'success')
}

// Limpiar formulario
const limpiarFormulario = () => {
  nuevoEnvio.value = {
    hawb: '',
    consignatario: '',
    cedula: '',
    peso: '',
    descripcion: '',
    cantidad: '',
    factura: '',
    fechaEmision: ''
  }
  editandoIndex.value = -1
}

// Limpiar todos los envíos
const limpiarTodos = () => {
  envios.value = []
  limpiarFormulario()
  mostrarMensaje('Todos los envíos han sido eliminados', 'info')
}

// Guardar como archivo Excel
const guardarArchivo = async () => {
  if (envios.value.length === 0) {
    mostrarMensaje('No hay envíos para guardar', 'error')
    return
  }

  try {
    guardando.value = true

    // Crear workbook
    const workbook = XLSX.utils.book_new()
    
    // Preparar datos para Excel
    const datos = envios.value.map(envio => ({
      'HAWB': envio.hawb,
      'CONSIGNATARIO': envio.consignatario,
      'CEDULA': envio.cedula,
      'PESO': envio.peso,
      'DESCRIPCIÓN': envio.descripcion,
      'CANTIDAD': envio.cantidad,
      'FACTURA COMERCIAL': envio.factura,
      'FECHA DE EMISIÓN': envio.fechaEmision
    }))

    // Crear worksheet
    const worksheet = XLSX.utils.json_to_sheet(datos)
    
    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Envios')

    // Generar archivo
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    // Crear archivo para subir
    const fileName = `envios_manuales_${new Date().toISOString().split('T')[0]}.xlsx`
    const file = new File([blob], fileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

    // Subir archivo usando el composable
    const metadata = {
      descripcion: `Envíos ingresados manualmente - ${envios.value.length} registros`,
      etiquetas: ['manual', 'envios'],
      tipo: 'envios_manuales'
    }

    const resultado = await uploadExcelFile(file, metadata)

    if (resultado.success) {
      mostrarMensaje('Archivo guardado exitosamente', 'success')
      // Limpiar envíos después de guardar
      envios.value = []
      limpiarFormulario()
    } else {
      throw new Error(resultado.error)
    }

  } catch (error) {
    console.error('Error guardando archivo:', error)
    mostrarMensaje(`Error al guardar: ${error.message}`, 'error')
  } finally {
    guardando.value = false
  }
}

// Mostrar mensaje
const mostrarMensaje = (texto, tipo) => {
  message.value = texto
  messageType.value = tipo
  setTimeout(() => {
    message.value = ''
    messageType.value = ''
  }, 5000)
}

// Formatear fecha
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES')
}

// Inicializar fecha actual
onMounted(() => {
  nuevoEnvio.value.fechaEmision = new Date().toISOString().split('T')[0]
})
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.ingresar-envio-section {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.ingresar-envio-section h1 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin: 0;
  padding: 30px;
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
}

.subtitle {
  text-align: center;
  color: #666;
  margin: 10px 0 30px;
  font-size: 1.1rem;
}

.form-card {
  padding: 30px;
  border-bottom: 1px solid #eee;
}

.form-card h3 {
  margin: 0 0 20px;
  color: #333;
  font-size: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.form-group input,
.form-group textarea {
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-start;
}

.add-button,
.clear-button,
.save-button,
.clear-all-button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.add-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.add-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.clear-button {
  background: #f8f9fa;
  color: #6c757d;
  border: 2px solid #e9ecef;
}

.clear-button:hover {
  background: #e9ecef;
}

.save-button {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.save-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
}

.clear-all-button {
  background: #dc3545;
  color: white;
}

.clear-all-button:hover {
  background: #c82333;
  transform: translateY(-2px);
}

.table-section {
  padding: 30px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.table-actions {
  display: flex;
  gap: 15px;
}

.table-container {
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.envios-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.envios-table th,
.envios-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.envios-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
  position: sticky;
  top: 0;
  z-index: 10;
}

.envios-table tr:hover {
  background: #f8f9fa;
}

.descripcion-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
  font-size: 1rem;
}

.action-button.edit:hover {
  background: #e3f2fd;
}

.action-button.delete:hover {
  background: #ffebee;
}

.empty-state {
  text-align: center;
  padding: 60px 30px;
  color: #666;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 10px;
  color: #333;
}

.message {
  margin: 20px 30px;
  padding: 15px;
  border-radius: 8px;
  font-weight: 500;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.message.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .table-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .table-actions {
    justify-content: center;
  }
  
  .envios-table {
    font-size: 0.9rem;
  }
  
  .envios-table th,
  .envios-table td {
    padding: 8px;
  }
}
</style>
