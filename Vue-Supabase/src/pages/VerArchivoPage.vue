<template>
  <div class="ver-archivo-container">
    <!-- Vista de lista de archivos (cuando no hay ID específico) -->
    <div v-if="!fileId" class="files-list-view">
      <div class="list-header">
        <h1>Histórico de registros de envíos</h1>
        <button @click="loadFiles" class="refresh-btn">Actualizar</button>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-section">
        <div class="loading-spinner">⏳</div>
        <p>Cargando archivos...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="error-section">
        <div class="error-icon">❌</div>
        <h3>Error al cargar archivos</h3>
        <p>{{ error }}</p>
        <button @click="loadFiles" class="retry-btn">🔄 Reintentar</button>
      </div>

      <!-- Lista de archivos -->
      <div v-else-if="files.length > 0" class="files-grid">
        <div v-for="file in files" :key="file.id" class="file-card">
          <div class="file-header">
            <div class="file-icon">📊</div>
            <div class="file-info">
              <h3>{{ file.nombre_archivo }}</h3>
              <p class="file-meta">
                <span>{{ formatFileSize(file.tamaño_bytes) }}</span>
                <span>{{ formatDate(file.fecha_subida) }}</span>
              </p>
              <div class="file-status" :class="file.estado">
                {{ getStatusText(file.estado) }}
              </div>
            </div>
          </div>
          
          <div v-if="file.descripcion" class="file-description">
            <p>{{ file.descripcion }}</p>
          </div>
          
          <div class="file-actions">
            <button @click="viewFile(file.id)" class="action-btn view-btn">
              Ver
            </button>
            <button @click="downloadFile(file)" class="action-btn download-btn">
              Descargar
            </button>
            <button @click="deleteFile(file.id)" class="action-btn delete-btn">
              Eliminar
            </button>
          </div>
        </div>
      </div>

      <!-- Sin archivos -->
      <div v-else class="no-files">
        <div class="no-files-icon">📭</div>
        <h3>No tienes archivos subidos</h3>
        <p>Sube tu primer archivo Excel para comenzar.</p>
        <RouterLink to="/subir-archivo" class="upload-link">
          Subir Archivo
        </RouterLink>
      </div>
    </div>

    <!-- Vista de detalle de archivo (cuando hay ID específico) -->
    <div v-else class="file-detail-view">
      <!-- Header con información del archivo -->
      <div class="file-header">
        <button @click="goBack" class="action-btn back-btn">
            Volver
        </button>
        <div class="file-info">
          <h1 class="page-header">Visualizar Archivos</h1>
          <p class="page-subtitle">Explora y gestiona todos tus archivos Excel procesados</p>
          <div class="file-meta">
            <span class="meta-item">
              <strong>Tamaño:</strong> {{ formatFileSize(archivo?.tamaño_bytes) }}
            </span>
            <span class="meta-item">
              <strong>Subido:</strong> {{ formatDate(archivo?.fecha_subida) }}
            </span>
            <span class="meta-item">
              <strong>Estado:</strong> 
              <span :class="['status-badge', archivo?.estado]">
                {{ getStatusText(archivo?.estado) }}
              </span>
            </span>
          </div>
          <div v-if="archivo?.descripcion" class="file-description">
            <strong>Descripción:</strong> {{ archivo.descripcion }}
          </div>
        </div>

      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-section">
        <div class="loading-spinner">⏳</div>
        <p>Cargando contenido del archivo...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="error-section">
        <div class="error-icon">❌</div>
        <h3>Error al cargar el archivo</h3>
        <p>{{ error }}</p>
        <button @click="loadFileInfo" class="retry-btn">🔄 Reintentar</button>

      </div>
      
      <!-- Content when loaded -->
      <div v-else-if="archivo" class="file-content">
        <!-- Selector de hojas -->
        <div class="sheets-selector">
          <h3>Hojas del archivo</h3>
          <div class="sheets-tabs">
            <button 
              v-for="hoja in hojas" 
              :key="hoja.id"
              @click="selectSheet(hoja.nombre_hoja)"
              :class="['sheet-tab', { active: selectedSheet === hoja.nombre_hoja }]"
            >
              {{ hoja.nombre_hoja }}
              <span class="sheet-info">({{ hoja.numero_filas }} filas, {{ hoja.numero_columnas }} columnas)</span>
            </button>
          </div>
        </div>

        <!-- Nueva tabla de envíos -->
        <div v-if="selectedSheet && envios.length > 0" class="envios-table">
          <div class="sheet-header">
            <h3>Registros de envíos</h3>
            <div class="data-info">
              <span>{{ envios.length }} registros mostrados</span>
              <button @click="loadMoreData" v-if="envios.length < totalRows" class="load-more-btn">
                Cargar más datos
              </button>
            </div>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>HAWB</th>
                  <th>Consignatario</th>
                  <th>Cédula</th>
                  <th>Peso (kg)</th>
                  <th>Valor ($)</th>
                  <th>Descripción</th>
                  <th>Cantidad</th>
                  <th>Factura Comercial</th>
                  <th>Fecha de Emisión</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(envio, idx) in envios" :key="idx">
                  <td>{{ getFieldValue(envio, ['HAWB', 'hawb', 'Hawb']) }}</td>
                  <td>{{ getFieldValue(envio, ['CONSIGNATARIO', 'consignatario', 'Consignatario']) }}</td>
                  <td>{{ getFieldValue(envio, ['CEDULA', 'cedula', 'Cédula', 'CEDULA']) }}</td>
                  <td>{{ getFieldValue(envio, ['PESO', 'peso', 'Peso']) }}</td>
                  <td>{{ getFieldValue(envio, ['VALOR', 'valor', 'Valor']) }}</td>
                  <td>{{ getFieldValue(envio, ['DESCRIPCIÓN', 'descripcion', 'Descripción', 'DESCRIPCION']) }}</td>
                  <td>{{ getFieldValue(envio, ['CANTIDAD', 'cantidad', 'Cantidad']) }}</td>
                  <td>{{ getFieldValue(envio, ['FACTURA COMERCIAL', 'factura', 'Factura Comercial', 'FACTURA']) }}</td>
                  <td>{{ getFieldValue(envio, ['FECHA DE EMISIÓN', 'fecha', 'Fecha de Emisión', 'FECHA']) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sin datos -->
        <div v-else-if="selectedSheet" class="no-data">
          <div class="no-data-icon">📭</div>
          <h3>No hay datos en esta hoja</h3>
          <p>La hoja "{{ selectedSheet }}" no contiene datos procesados.</p>
        </div>

        <!-- Sin hojas -->
        <div v-else class="no-sheets">
          <div class="no-sheets-icon">📋</div>
          <h3>No se encontraron hojas</h3>
          <p>Este archivo no tiene hojas procesadas o el procesamiento aún está en curso.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExcelFiles } from '../composables/useExcelFiles'
import { useSupabase } from '../composables/useSupabase'

const route = useRoute()
const router = useRouter()
const { getFileData } = useExcelFiles()

// Estado del componente
const archivo = ref(null)
const files = ref([])
const hojas = ref([])
const selectedSheet = ref(null)
const sheetData = ref([])
const loading = ref(false)
const error = ref(null)
const limit = ref(100)
const totalRows = ref(0)

// Obtener ID del archivo desde la URL
const fileId = computed(() => route.params.id || route.query.file)

// Función para reconstruir la tabla de envíos a partir de sheetData
const buildEnviosTable = (sheetData) => {
  if (!sheetData || sheetData.length === 0) return [];

  // 1. Encuentra la cabecera (fila 1)
  const headerRow = sheetData.filter(cell => cell.fila_numero === 1);
  const colMap = {}; // { "A": "HAWB", ... }
  
  headerRow.forEach(cell => {
    const normalizedHeader = cell.valor_texto.trim().toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
    colMap[cell.columna_nombre] = normalizedHeader;
  });

  console.log('📋 Mapeo de columnas:', colMap);

  // 2. Agrupa por fila
  const rows = {};
  sheetData.forEach(cell => {
    if (cell.fila_numero === 1) return; // omite cabecera
    if (!rows[cell.fila_numero]) rows[cell.fila_numero] = {};
    
    const colName = colMap[cell.columna_nombre] || cell.columna_nombre;
    rows[cell.fila_numero][colName] = cell.valor_texto;
  });

  // 3. Devuelve como array y ordena por número de fila
  const result = Object.entries(rows)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([, data]) => data);

  console.log('📊 Envíos reconstruidos:', result.length);
  return result;
};

// Computed para los envíos de la hoja seleccionada
const envios = computed(() => buildEnviosTable(sheetData.value));

// Cargar lista de archivos
const loadFiles = async () => {
  try {
    loading.value = true
    error.value = null
    console.log('📁 Cargando lista de archivos...')

    const { data, error: fetchError } = await useSupabase
      .from('archivos_excel')
      .select('*')
      .order('fecha_subida', { ascending: false })

    if (fetchError) {
      console.error('❌ Error cargando archivos:', fetchError)
      throw fetchError
    }

    files.value = data || []
    console.log('✅ Archivos cargados:', files.value.length)
  } catch (err) {
    console.error('❌ Error en loadFiles:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Cargar información del archivo específico
const loadFileInfo = async () => {
  try {
    loading.value = true
    error.value = null
    console.log('📄 Cargando información del archivo:', fileId.value)

    const { data, error: fetchError } = await useSupabase
      .from('archivos_excel')
      .select(`
        *,
        hojas_excel (
          id,
          nombre_hoja,
          numero_filas,
          numero_columnas
        )
      `)
      .eq('id', fileId.value)
      .single()

    if (fetchError) {
      console.error('❌ Error cargando archivo:', fetchError)
      throw fetchError
    }

    archivo.value = data
    hojas.value = data.hojas_excel || []
    console.log('✅ Archivo cargado:', archivo.value.nombre_archivo)
    console.log('✅ Hojas encontradas:', hojas.value.length)

    // Seleccionar la primera hoja por defecto
    if (hojas.value.length > 0) {
      selectedSheet.value = hojas.value[0].nombre_hoja
      await loadSheetData()
    }
  } catch (err) {
    console.error('❌ Error en loadFileInfo:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Cargar datos de una hoja específica
const loadSheetData = async () => {
  if (!selectedSheet.value) return

  try {
    loading.value = true
    error.value = null
    console.log('📊 Cargando datos de hoja:', selectedSheet.value)

    // Obtener total de filas para esta hoja
    const { count } = await useSupabase
      .from('datos_excel')
      .select('*', { count: 'exact', head: true })
      .eq('archivo_id', fileId.value)
      .eq('hoja_nombre', selectedSheet.value)
    
    totalRows.value = count || 0
    console.log('✅ Total de filas:', totalRows.value)

    // Cargar todos los datos sin límite
    const result = await getFileData(fileId.value, selectedSheet.value, totalRows.value)
    
    if (result.success) {
      sheetData.value = result.data || []
      console.log('✅ Datos cargados:', sheetData.value.length, 'registros')
    } else {
      throw new Error(result.error)
    }
  } catch (err) {
    console.error('❌ Error cargando datos de hoja:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Seleccionar hoja
const selectSheet = async (sheetName) => {
  selectedSheet.value = sheetName
  await loadSheetData()
}

// Ver archivo
const viewFile = (id) => {
  router.push(`/ver-archivo/${id}`)
}

// Descargar archivo
const downloadFile = async (file) => {
  try {
    console.log('⬇️ Descargando archivo:', file.nombre_archivo)
    
    const { data } = useSupabase.storage
      .from('archivos')
      .getPublicUrl(file.ruta_storage)
    
    const link = document.createElement('a')
    link.href = data.publicUrl
    link.download = file.nombre_original
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    console.log('✅ Descarga iniciada')
  } catch (err) {
    console.error('❌ Error descargando archivo:', err)
    alert('Error al descargar el archivo')
  }
}

// Eliminar archivo
const deleteFile = async (fileId) => {
  if (!confirm('¿Estás seguro de que quieres eliminar este archivo?')) return
  
  try {
    console.log('🗑️ Eliminando archivo:', fileId)
    
    const { error: deleteError } = await useSupabase
      .from('archivos_excel')
      .delete()
      .eq('id', fileId)
    
    if (deleteError) throw deleteError
    
    console.log('✅ Archivo eliminado')
    
    // Recargar lista si estamos en vista de lista
    if (!route.params.id) {
      await loadFiles()
    } else {
      // Si estamos viendo el archivo eliminado, volver a la lista
      router.push('/ver-archivo')
    }
  } catch (err) {
    console.error('❌ Error eliminando archivo:', err)
    alert('Error al eliminar el archivo')
  }
}

// Utilidades
const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
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
    'activo': '✅ Activo',
    'procesando': '⏳ Procesando',
    'error': '❌ Error',
    'eliminado': '🗑️ Eliminado'
  }
  return statusMap[status] || status
}

// Observar cambios en el fileId
watch(fileId, (newId) => {
  console.log('🔄 fileId cambió:', newId)
  if (newId) {
    loadFileInfo()
  } else {
    loadFiles()
  }
}, { immediate: true })

// Cargar datos al montar el componente
onMounted(() => {
  console.log('🚀 VerArchivoPage montado, fileId:', fileId.value)
  if (fileId.value) {
    loadFileInfo()
  } else {
    loadFiles()
  }
})

// Agrega la función goBack para el botón Volver
const goBack = () => {
  router.back();
}

// Nueva función para cargar más datos
const loadMoreData = async () => {
  if (envios.value.length >= totalRows.value) return
  
  try {
    loading.value = true
    const newLimit = Math.min(limit.value + 100, totalRows.value)
    limit.value = newLimit
    
    const result = await getFileData(fileId.value, selectedSheet.value, newLimit)
    
    if (result.success) {
      sheetData.value = result.data || []
      console.log('✅ Más datos cargados:', sheetData.value.length, 'registros')
    } else {
      throw new Error(result.error)
    }
  } catch (err) {
    console.error('❌ Error cargando más datos:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Nueva función para obtener el valor de un campo
const getFieldValue = (envio, fields) => {
  for (const field of fields) {
    if (envio[field]) return envio[field]
  }
  return '-'
}
</script>

<style scoped>
/* Tabs de hojas */
.sheets-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.sheet-tab {
  background: #f1f3f8;
  border: none;
  border-radius: 8px 8px 0 0;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  color: #3f37c9;
  margin-right: 0.25rem;
  outline: none;
}
.sheet-tab.active {
  background: #3f37c9;
  color: #fff;
  box-shadow: 0 2px 8px rgba(67, 97, 238, 0.08);
}
.sheet-tab:hover:not(.active) {
  background: #e0e7ff;
  color: #3f37c9;
}
.sheet-info {
  font-size: 0.85em;
  color: #888;
  margin-left: 0.5em;
}

/* Tabla de envíos mejorada */
.envios-table {
  margin-top: 2rem;
}
.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.data-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.load-more-btn {
  background: #3f37c9;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
}
.load-more-btn:hover {
  background: #2d2a8a;
}
.table-container {
  overflow-x: auto;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(67, 97, 238, 0.08);
  background: #fff;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}
.data-table thead th {
  position: sticky;
  top: 0;
  background: #3f37c9;
  color: #fff;
  font-weight: 600;
  padding: 1rem 0.75rem;
  z-index: 2;
  text-align: left;
}
.data-table tbody tr:nth-child(even) {
  background: #f8f9fa;
}
.data-table tbody tr:hover {
  background: #e0e7ff;
}
.data-table td {
  padding: 0.75rem;
  text-align: left;
  font-size: 1rem;
  vertical-align: middle;
  border-bottom: 1px solid #eee;
}
.data-table td .badge {
  display: inline-block;
  background: #eee;
  color: #888;
  border-radius: 6px;
  padding: 0.2em 0.7em;
  font-size: 0.9em;
  font-weight: 500;
}
/* Responsive */
@media (max-width: 900px) {
  .data-table {
    min-width: 600px;
  }
}
@media (max-width: 600px) {
  .data-table {
    min-width: 400px;
  }
  .sheets-tabs {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>
