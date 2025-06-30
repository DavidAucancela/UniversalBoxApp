<template>
  <div class="container">
    <div class="upload-section">
      <h1 class="page-header">Subir Archivos Excel</h1>
      <p class="page-subtitle">Carga y procesa archivos Excel para gestionar envíos</p>

      <!-- Formulario de subida -->
      <div class="upload-card">
        <div class="upload-area" 
             @drop="handleDrop" 
             @dragover.prevent 
             @dragenter.prevent
             :class="{ 'drag-over': isDragOver }"
             @dragleave="isDragOver = false"
             @dragenter="isDragOver = true">
          
          <div class="upload-content">
            <div class="upload-icon">📊</div>
            <h3>Arrastra tu archivo Excel aquí</h3>
            <p>o haz clic para seleccionar</p>
            <input 
              type="file" 
              ref="fileInput" 
              @change="handleFileSelect" 
              accept=".xlsx,.xls,.csv"
              class="file-input"
            >
            <button @click="$refs.fileInput.click()" class="select-button">
              Seleccionar archivo
            </button>
          </div>
        </div>

        <!-- Información del archivo seleccionado -->
        <div v-if="selectedFile" class="file-info">
          <div class="file-details">
            <div class="file-icon">📄</div>
            <div class="file-text">
              <h4>{{ selectedFile.name }}</h4>
              <p>{{ formatFileSize(selectedFile.size) }} • {{ selectedFile.type }}</p>
            </div>
            <button @click="removeFile" class="remove-button">❌</button>
          </div>
        </div>

        <!-- información extra (descripción) del archivo a cargar -->
        <div v-if="selectedFile" class="metadata-section">
          <h4>Información adicional</h4>
          <div class="form-group">
            <label for="descripcion">Descripción</label>
            <textarea 
              id="descripcion"
              v-model="metadata.descripcion" 
              placeholder="Describe el contenido del archivo..."
              rows="3"
            ></textarea>
          </div>
          
          <!-- <div class="form-group">
            <label for="etiquetas">Etiquetas</label>
            <input 
              id="etiquetas"
              v-model="metadata.etiquetas" 
              placeholder="etiqueta1, etiqueta2, etiqueta3..."
              type="text"
            >
            <small>Separa las etiquetas con comas</small>
          </div> -->
        </div>

        <!-- Botón de subida -->
        <div v-if="selectedFile" class="upload-actions">
          <button 
            @click="uploadFile" 
            :disabled="uploading"
            class="upload-button"
          >
            <span v-if="uploading" class="loading-spinner">⏳</span>
            {{ uploading ? 'Subiendo...' : 'Cargar archivo' }}
          </button>
        </div>
      </div>

      <!-- Mensajes de estado -->
      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>

      <!-- Progreso de subida -->
      <div v-if="uploadProgress > 0 && uploadProgress < 100" class="progress-section">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
        </div>
        <p class="progress-text">{{ uploadProgress }}% completado</p>
      </div>
    </div>

    <!-- Sección de archivos recientes -->
    <div v-if="recentFiles.length > 0" class="recent-files">
      <h2>Archivos recientes</h2>
      <div class="files-grid">
        <div v-for="file in recentFiles" :key="file.id" class="file-card">
          <div class="file-header">
            <div class="file-icon">📊</div>
            <div class="file-info">
              <h4>{{ file.nombre_archivo }}</h4>
              <p>{{ formatFileSize(file.tamaño_bytes) }}</p>
              <p class="file-date">{{ formatDate(file.fecha_subida) }}</p>
            </div>
            <div class="file-status" :class="file.estado">
              {{ getStatusText(file.estado) }}
            </div>
          </div>
          
          <div v-if="file.descripcion" class="file-description">
            <p>{{ file.descripcion }}</p>
          </div>
          
          <div class="file-actions">
            <button @click="viewFile(file)" class="action-button ">
              Ver
            </button>
            <button @click="downloadFile(file)" class="action-button">
              Descargar
            </button>
            <button @click="deleteFile(file.id)" class="action-button danger">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- intrucciones
    <div class="instructions">
      <h3>Limites</h3>
      <div class="instructions-grid">
        <div class="instruction-card">
          <div class="instruction-icon">📊</div>
          <h4>Formatos </h4>
          <p>Excel (.xlsx, .xls) y CSV (.csv)</p>
        </div>
        
        <div class="instruction-card">
          <div class="instruction-icon">📏</div>
          <h4>Tamaño máximo</h4>
          <p>Hasta 5 MB por archivo</p>
        </div>
        
        <div class="instruction-card">
          <div class="instruction-icon">🔒</div>
          <h4>Seguridad</h4>
          <p>Tus archivos están protegidos y son privados</p>
        </div>
        
        <div class="instruction-card">
          <div class="instruction-icon">⚡</div>
          <h4>Procesamiento</h4>
          <p>Los datos se extraen automáticamente</p>
        </div>
      </div>
    </div> -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useExcelFiles } from '../composables/useExcelFiles'
import { useRouter } from 'vue-router'
import { useSupabase } from "../composables/useSupabase"


const router = useRouter()
const { uploadExcelFile, getUserFiles, deleteFile: deleteFileFromDB } = useExcelFiles()

// Estado del componente
const selectedFile = ref(null)
const isDragOver = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const message = ref('')
const messageType = ref('')
const recentFiles = ref([])

// Metadatos del archivo
const metadata = ref({
  descripcion: '',
  etiquetas: ''
})

// Manejar selección de archivo
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    validateAndSetFile(file)
  }
}

// Manejar drag and drop
const handleDrop = (event) => {
  isDragOver.value = false
  event.preventDefault()
  
  const files = event.dataTransfer.files
  if (files.length > 0) {
    validateAndSetFile(files[0])
  }
}

// Validar y establecer archivo
const validateAndSetFile = (file) => {
  // Validar tipo de archivo
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv'
  ]
  
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
    showMessage('❌ Solo se permiten archivos Excel (.xlsx, .xls) o CSV (.csv)', 'error')
    return
  }
  
  // Validar tamaño (50MB máximo)
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxSize) {
    showMessage('❌ El archivo es demasiado grande. Máximo 50MB', 'error')
    return
  }
  
  selectedFile.value = file
  showMessage('✅ Archivo seleccionado correctamente', 'success')
}

// Remover archivo seleccionado
const removeFile = () => {
  selectedFile.value = null
  metadata.value = { descripcion: '', etiquetas: '' }
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  message.value = ''
}

// Subir archivo
const uploadFile = async () => {
  if (!selectedFile.value) return
  
  try {
    uploading.value = true
    uploadProgress.value = 0
    
    // Simular progreso
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 200)
    
    // Preparar metadatos
    const fileMetadata = {
      descripcion: metadata.value.descripcion,
      etiquetas: metadata.value.etiquetas.split(',').map(tag => tag.trim()).filter(tag => tag)
    }
    
    // Subir archivo
    const result = await uploadExcelFile(selectedFile.value, fileMetadata)
    
    clearInterval(progressInterval)
    uploadProgress.value = 100
    
    if (result.success) {
      showMessage('✅ Archivo subido y procesado exitosamente', 'success')
      removeFile()
      loadRecentFiles() // Recargar lista de archivos
    } else {
      showMessage(`❌ Error: ${result.error}`, 'error')
    }
  } catch (error) {
    console.error('Error subiendo archivo:', error)
    showMessage(`❌ Error inesperado: ${error.message}`, 'error')
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

// Cargar archivos recientes
const loadRecentFiles = async () => {
  try {
    const result = await getUserFiles()
    if (result.success) {
      recentFiles.value = result.data.slice(0, 6) // Solo los 6 más recientes
    }
  } catch (error) {
    console.error('Error cargando archivos recientes:', error)
  }
}

// Eliminar archivo
const deleteFile = async (fileId) => {
  if (!confirm('¿Estás seguro de que quieres eliminar este archivo?')) return
  
  try {
    const result = await deleteFileFromDB(fileId)
    if (result.success) {
      showMessage('✅ Archivo eliminado exitosamente', 'success')
      loadRecentFiles()
    } else {
      showMessage(`❌ Error: ${result.error}`, 'error')
    }
  } catch (error) {
    console.error('Error eliminando archivo:', error)
    showMessage(`❌ Error inesperado: ${error.message}`, 'error')
  }
}

// Ver archivo
const viewFile = (file) => {
  router.push(`/ver-archivo/${file.id}`)
}

// Descargar archivo
const downloadFile = async (file) => {
  try {
    // Obtener URL de descarga
    const { data } = useSupabase.storage
      .from('archivos')
      .getPublicUrl(file.ruta_storage)
    
    // Crear enlace de descarga
    const link = document.createElement('a')
    link.href = data.publicUrl
    link.download = file.nombre_original
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    showMessage('✅ Descarga iniciada', 'success')
  } catch (error) {
    console.error('Error descargando archivo:', error)
    showMessage('❌ Error al descargar el archivo', 'error')
  }
}

// Utilidades
// conversion de medidas para poder indetificar el peso 
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusText = (status) => {
  const statusMap = {
    'activo': 'Activo',
    'procesando': 'Procesando',
    'error': 'Error',
    'eliminado': 'Eliminado'
  }
  return statusMap[status] || status
}

const showMessage = (text, type = 'info') => {
  message.value = text
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 5000)
}

// Referencias
const fileInput = ref(null)

// Cargar archivos al montar el componente
onMounted(() => {
  loadRecentFiles()
})
</script>