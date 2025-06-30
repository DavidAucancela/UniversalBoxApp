<template>
  <div class="busqueda-semantica-container">
    <div class="search-header">
      <h1 class="page-header">Búsqueda Semántica Inteligente</h1>
      <p class="page-subtitle">Busca contenido en tus archivos Excel usando inteligencia artificial</p>
    </div>

    <!-- Panel de búsqueda semántica -->
    <div class="semantic-search-panel">
      <div class="search-input-section">
        <div class="search-input-group">
          <textarea 
            v-model="semanticQuery" 
            @input="debounceSemanticSearch"
            @keyup.enter="realizarBusquedaSemantica"
            placeholder="Describe lo que buscas en lenguaje natural... Ej: 'envíos pesados de más de 10kg' o 'facturas del mes de enero'" 
            class="semantic-input"
            rows="3"
          ></textarea>
          <button @click="realizarBusquedaSemantica" class="semantic-search-btn" :disabled="loading">
            <span v-if="loading" class="loading-spinner">⏳</span>
            {{ loading ? 'Analizando...' : '🔍 Buscar Semánticamente' }}
          </button>
        </div>
      </div>

      <!-- Sugerencias de búsqueda -->
      <div class="search-suggestions">
        <h4>💡 Sugerencias de búsqueda:</h4>
        <div class="suggestions-grid">
          <button 
            v-for="suggestion in searchSuggestions" 
            :key="suggestion"
            @click="aplicarSugerencia(suggestion)"
            class="suggestion-btn"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>

      <!-- Filtros avanzados -->
      <div class="advanced-filters">
        <h4>🔧 Filtros Avanzados</h4>
        <div class="filters-grid">
          <div class="filter-group">
            <label>Archivo específico:</label>
            <select v-model="selectedFile" class="filter-select">
              <option value="">Todos los archivos</option>
              <option v-for="file in files" :key="file.id" :value="file.id">
                {{ file.nombre_archivo }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label>Rango de fechas:</label>
            <div class="date-range">
              <input 
                v-model="dateFrom" 
                type="date" 
                class="date-input"
                placeholder="Desde"
              >
              <span>hasta</span>
              <input 
                v-model="dateTo" 
                type="date" 
                class="date-input"
                placeholder="Hasta"
              >
            </div>
          </div>

          <div class="filter-group">
            <label>Rango de peso (kg):</label>
            <div class="weight-range">
              <input 
                v-model="weightFrom" 
                type="number" 
                step="0.01"
                class="weight-input"
                placeholder="Mín"
              >
              <span>a</span>
              <input 
                v-model="weightTo" 
                type="number" 
                step="0.01"
                class="weight-input"
                placeholder="Máx"
              >
            </div>
          </div>

          <div class="filter-group">
            <label>Confianza mínima:</label>
            <select v-model="confidenceThreshold" class="filter-select">
              <option value="0.5">50% - Más resultados</option>
              <option value="0.7">70% - Balanceado</option>
              <option value="0.8">80% - Más preciso</option>
              <option value="0.9">90% - Muy preciso</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Estados de carga y error -->
    <div v-if="loading" class="loading-section">
      <div class="loading-spinner">🧠</div>
      <h3>Analizando tu consulta...</h3>
      <p>Nuestro sistema de IA está procesando tu búsqueda semántica</p>
    </div>

    <div v-else-if="error" class="error-section">
      <div class="error-icon">❌</div>
      <h3>Error en la búsqueda semántica</h3>
      <p>{{ error }}</p>
      <button @click="realizarBusquedaSemantica" class="retry-btn">🔄 Reintentar</button>
    </div>

    <!-- Resultados semánticos -->
    <div v-else-if="semanticResults.length > 0" class="semantic-results">
      <div class="results-header">
        <h3>🎯 Resultados Semánticos</h3>
        <div class="results-info">
          <span class="results-count">{{ semanticResults.length }} registros encontrados</span>
          <span class="confidence-info">Confianza promedio: {{ averageConfidence }}%</span>
        </div>
      </div>

      <!-- Análisis de la consulta -->
      <div class="query-analysis">
        <h4>📊 Análisis de tu consulta:</h4>
        <div class="analysis-grid">
          <div class="analysis-item">
            <strong>Consulta interpretada:</strong>
            <span>{{ queryAnalysis.interpretedQuery }}</span>
          </div>
          <div class="analysis-item">
            <strong>Entidades detectadas:</strong>
            <span>{{ queryAnalysis.entities.join(', ') }}</span>
          </div>
          <div class="analysis-item">
            <strong>Criterios aplicados:</strong>
            <span>{{ queryAnalysis.criteria.join(', ') }}</span>
          </div>
        </div>
      </div>

      <!-- Resultados con puntuación de confianza -->
      <div class="results-grid">
        <table class="semantic-table">
          <thead>
            <tr>
              <th>Confianza</th>
              <th v-for="col in columnasDeseadasRaw" :key="col">{{ col }}</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="result in semanticResults" :key="`${result.archivo_id}-${result.hoja_nombre}-${result.fila_numero}`" 
                :class="getConfidenceClass(result.confidence)">
              <td class="confidence-cell">
                <div class="confidence-bar">
                  <div class="confidence-fill" :style="{ width: `${result.confidence * 100}%` }"></div>
                </div>
                <span class="confidence-text">{{ Math.round(result.confidence * 100) }}%</span>
              </td>
              <td v-for="col in columnasDeseadas" :key="col">{{ getFieldValue(result.envio, col) }}</td>
              <td>
                <button @click="viewFile(result.archivo_id)" class="action-btn view-btn">
                  Ver archivo
                </button>
                <button @click="showDetails(result)" class="action-btn details-btn">
                  Detalles
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Estadísticas de resultados -->
      <div class="results-stats">
        <div class="stat-item">
          <span class="stat-label">Total de registros:</span>
          <span class="stat-value">{{ semanticResults.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Confianza alta (>80%):</span>
          <span class="stat-value">{{ highConfidenceCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Confianza media (60-80%):</span>
          <span class="stat-value">{{ mediumConfidenceCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Confianza baja (60%):</span>
          <span class="stat-value">{{ lowConfidenceCount }}</span>
        </div>
      </div>
    </div>

    <!-- Sin resultados -->
    <div v-else-if="hasSearched" class="no-results">
      <div class="no-results-icon">🧠</div>
      <h3>No se encontraron resultados semánticos</h3>
      <p>Intenta reformular tu consulta o usar términos más específicos.</p>
      <div class="no-results-suggestions">
        <h4>Sugerencias:</h4>
        <ul>
          <li>Usa términos más específicos</li>
          <li>Incluye rangos de valores</li>
          <li>Menciona fechas o períodos</li>
          <li>Describe características del producto</li>
        </ul>
      </div>
    </div>

    <!-- Estado inicial -->
    <div v-else class="initial-state">
      <div class="initial-icon">🧠</div>
      <h3>Búsqueda Semántica Inteligente</h3>
      <p>Describe lo que buscas en lenguaje natural y nuestro sistema de IA encontrará los resultados más relevantes.</p>
      <div class="initial-examples">
        <h4>Ejemplos de consultas:</h4>
        <ul>
          <li>"Envíos pesados de más de 5 kilogramos"</li>
          <li>"Facturas comerciales del mes pasado"</li>
          <li>"Consignatarios con cédula que empiece con 1"</li>
          <li>"Productos electrónicos con alto valor"</li>
        </ul>
      </div>
    </div>

    <!-- Modal de detalles -->
    <div v-if="showDetailsModal" class="modal-overlay" @click="closeDetailsModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Detalles del Resultado</h3>
          <button @click="closeDetailsModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-item">
            <strong>Confianza:</strong> {{ Math.round(selectedResult.confidence * 100) }}%
          </div>
          <div class="detail-item">
            <strong>Archivo:</strong> {{ getFileName(selectedResult.archivo_id) }}
          </div>
          <div class="detail-item">
            <strong>Hoja:</strong> {{ selectedResult.hoja_nombre }}
          </div>
          <div class="detail-item">
            <strong>Fila:</strong> {{ selectedResult.fila_numero }}
          </div>
          <div class="detail-item">
            <strong>Razones de coincidencia:</strong>
            <ul>
              <li v-for="reason in selectedResult.reasons" :key="reason">{{ reason }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
//import { useSupabase } from '../composables/useSupabase'
import { useExcelFiles } from '../composables/useExcelFiles'

const router = useRouter()
const { getUserFiles } = useExcelFiles()

// Estado del componente
const semanticQuery = ref('')
const selectedFile = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const weightFrom = ref('')
const weightTo = ref('')
const confidenceThreshold = ref('0.7')
const semanticResults = ref([])
const files = ref([])
const loading = ref(false)
const error = ref(null)
const hasSearched = ref(false)
const searchTimeout = ref(null)
const showDetailsModal = ref(false)
const selectedResult = ref(null)

// Análisis de la consulta
const queryAnalysis = ref({
  interpretedQuery: '',
  entities: [],
  criteria: []
})

// Sugerencias de búsqueda
const searchSuggestions = [
  'Envíos pesados de más de 10kg',
  'Facturas del mes de enero',
  'Consignatarios con cédula que empiece con 1',
  'Productos electrónicos',
  'Envíos con alto valor',
  'Facturas comerciales recientes',
  'Envíos de ropa o textiles',
  'Productos de tecnología'
]

// Normaliza los nombres de columna para comparar
function normalize(str) {
  return (str || '').toString().trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
}

// Columnas relevantes a mostrar
const columnasDeseadasRaw = [
  'HAWB',
  'CONSIGNATARIO',
  'CEDULA',
  'PESO',
  'DESCRIPCIÓN',
  'CANTIDAD',
  'FACTURA COMERCIAL',
  'FECHA DE EMISIÓN'
];
const columnasDeseadas = columnasDeseadasRaw.map(normalize);

// Computed properties
const averageConfidence = computed(() => {
  if (semanticResults.value.length === 0) return 0
  const total = semanticResults.value.reduce((sum, result) => sum + result.confidence, 0)
  return Math.round((total / semanticResults.value.length) * 100)
})

const highConfidenceCount = computed(() => {
  return semanticResults.value.filter(result => result.confidence > 0.8).length
})

const mediumConfidenceCount = computed(() => {
  return semanticResults.value.filter(result => result.confidence > 0.6 && result.confidence <= 0.8).length
})

const lowConfidenceCount = computed(() => {
  return semanticResults.value.filter(result => result.confidence <= 0.6).length
})

// Función para aplicar sugerencia
const aplicarSugerencia = (suggestion) => {
  semanticQuery.value = suggestion
  realizarBusquedaSemantica()
}

// Función para realizar búsqueda semántica
const realizarBusquedaSemantica = async () => {
  if (!semanticQuery.value.trim()) {
    mostrarMensaje('Por favor ingresa una consulta semántica', 'error')
    return
  }

  try {
    loading.value = true
    error.value = null
    hasSearched.value = true

    // Simular análisis semántico (en un caso real, esto se conectaría con un servicio de IA)
    const analysis = await analizarConsultaSemantica(semanticQuery.value)
    queryAnalysis.value = analysis

    // Realizar búsqueda basada en el análisis
    const results = await buscarDatosSemanticos(analysis)
    
    // Aplicar filtros
    const filteredResults = aplicarFiltros(results)
    
    // Calcular confianza para cada resultado
    semanticResults.value = calcularConfianza(filteredResults, analysis)

  } catch (err) {
    console.error('Error en búsqueda semántica:', err)
    error.value = 'Error al realizar la búsqueda semántica. Por favor, intenta de nuevo.'
  } finally {
    loading.value = false
  }
}

// Función para analizar la consulta semántica
const analizarConsultaSemantica = async (query) => {
  // Simulación de análisis semántico
  const analysis = {
    interpretedQuery: query,
    entities: [],
    criteria: []
  }

  // Detectar entidades y criterios basados en palabras clave
  const lowerQuery = query.toLowerCase()
  
  // Detectar criterios de peso
  if (lowerQuery.includes('pesado') || lowerQuery.includes('peso')) {
    analysis.criteria.push('Filtro por peso')
    const pesoMatch = query.match(/(\d+(?:\.\d+)?)\s*kg/i)
    if (pesoMatch) {
      analysis.entities.push(`Peso mínimo: ${pesoMatch[1]}kg`)
    }
  }

  // Detectar criterios de fecha
  if (lowerQuery.includes('mes') || lowerQuery.includes('fecha') || lowerQuery.includes('reciente')) {
    analysis.criteria.push('Filtro por fecha')
    if (lowerQuery.includes('enero')) analysis.entities.push('Mes: Enero')
    if (lowerQuery.includes('febrero')) analysis.entities.push('Mes: Febrero')
    if (lowerQuery.includes('marzo')) analysis.entities.push('Mes: Marzo')
    // ... más meses
  }

  // Detectar criterios de cédula
  if (lowerQuery.includes('cédula') || lowerQuery.includes('cedula')) {
    analysis.criteria.push('Filtro por cédula')
    if (lowerQuery.includes('empiece con 1')) {
      analysis.entities.push('Cédula empieza con 1')
    }
  }

  // Detectar tipos de productos
  if (lowerQuery.includes('electrónic') || lowerQuery.includes('tecnolog')) {
    analysis.criteria.push('Filtro por tipo de producto')
    analysis.entities.push('Productos electrónicos')
  }

  if (lowerQuery.includes('ropa') || lowerQuery.includes('textil')) {
    analysis.criteria.push('Filtro por tipo de producto')
    analysis.entities.push('Productos textiles')
  }

  return analysis
}

// Función para buscar datos semánticos
const buscarDatosSemanticos = async (analysis) => {
  // Obtener todos los archivos del usuario
  const userFiles = await getUserFiles()
  files.value = userFiles

  // Simular búsqueda en los datos
  const results = []
  
  // Aquí se implementaría la lógica real de búsqueda semántica
  // Por ahora, simulamos resultados basados en el análisis
  console.log('Análisis recibido:', analysis)

  return results
}

// Función para aplicar filtros
const aplicarFiltros = (results) => {
  let filtered = results

  // Filtro por archivo
  if (selectedFile.value) {
    filtered = filtered.filter(result => result.archivo_id === selectedFile.value)
  }

  // Filtro por fecha
  if (dateFrom.value || dateTo.value) {
    filtered = filtered.filter(result => {
      const fecha = new Date(result.envio['FECHA DE EMISIÓN'])
      const from = dateFrom.value ? new Date(dateFrom.value) : null
      const to = dateTo.value ? new Date(dateTo.value) : null
      
      if (from && fecha < from) return false
      if (to && fecha > to) return false
      return true
    })
  }

  // Filtro por peso
  if (weightFrom.value || weightTo.value) {
    filtered = filtered.filter(result => {
      const peso = parseFloat(result.envio['PESO'])
      const from = weightFrom.value ? parseFloat(weightFrom.value) : null
      const to = weightTo.value ? parseFloat(weightTo.value) : null
      
      if (from && peso < from) return false
      if (to && peso > to) return false
      return true
    })
  }

  return filtered
}

// Función para calcular confianza
const calcularConfianza = (results, analysis) => {
  return results.map(result => {
    let confidence = 0.5 // Confianza base
    
    // Ajustar confianza basado en criterios
    if (analysis.criteria.includes('Filtro por peso')) {
      const peso = parseFloat(result.envio['PESO'])
      if (peso > 10) confidence += 0.2
      if (peso > 5) confidence += 0.1
    }

    if (analysis.criteria.includes('Filtro por fecha')) {
      const fecha = new Date(result.envio['FECHA DE EMISIÓN'])
      const now = new Date()
      const diffDays = (now - fecha) / (1000 * 60 * 60 * 24)
      if (diffDays < 30) confidence += 0.2
      if (diffDays < 90) confidence += 0.1
    }

    // Agregar razones de coincidencia
    result.reasons = []
    if (confidence > 0.6) result.reasons.push('Coincidencia alta con criterios de búsqueda')
    if (confidence > 0.8) result.reasons.push('Datos muy relevantes para la consulta')

    return {
      ...result,
      confidence: Math.min(confidence, 1.0)
    }
  }).filter(result => result.confidence >= parseFloat(confidenceThreshold.value))
}

// Función para obtener valor del campo
const getFieldValue = (envio, columna) => {
  return envio[columna] || ''
}

// Función para obtener clase de confianza
const getConfidenceClass = (confidence) => {
  if (confidence > 0.8) return 'high-confidence'
  if (confidence > 0.6) return 'medium-confidence'
  return 'low-confidence'
}

// Función para obtener nombre del archivo
const getFileName = (archivoId) => {
  const file = files.value.find(f => f.id === archivoId)
  return file ? file.nombre_archivo : 'Archivo desconocido'
}

// Función para ver archivo
const viewFile = (archivoId) => {
  router.push(`/ver-archivo/${archivoId}`)
}

// Función para mostrar detalles
const showDetails = (result) => {
  selectedResult.value = result
  showDetailsModal.value = true
}

// Función para cerrar modal de detalles
const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedResult.value = null
}

// Función para mostrar mensaje
const mostrarMensaje = (texto, tipo) => {
  // Implementar sistema de mensajes
  console.log(`${tipo}: ${texto}`)
}

// Debounce para búsqueda semántica
const debounceSemanticSearch = () => {
  clearTimeout(searchTimeout.value)
  searchTimeout.value = setTimeout(() => {
    if (semanticQuery.value.trim()) {
      realizarBusquedaSemantica()
    }
  }, 1000)
}

// Cargar archivos al montar el componente
onMounted(async () => {
  try {
    const userFiles = await getUserFiles()
    files.value = userFiles
  } catch (err) {
    console.error('Error cargando archivos:', err)
  }
})
</script>

<style scoped>
.busqueda-semantica-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.search-header {
  text-align: center;
  margin-bottom: 30px;
}

.search-header h1 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
}

.search-header p {
  color: #666;
  font-size: 1.1rem;
}

.semantic-search-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 30px;
  margin-bottom: 30px;
}

.search-input-section {
  margin-bottom: 25px;
}

.search-input-group {
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.semantic-input {
  flex: 1;
  padding: 15px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.3s ease;
}

.semantic-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.semantic-search-btn {
  padding: 15px 25px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
}

.semantic-search-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.semantic-search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-suggestions {
  margin-bottom: 25px;
}

.search-suggestions h4 {
  margin: 0 0 15px;
  color: #333;
  font-size: 1.1rem;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.suggestion-btn {
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  text-align: left;
}

.suggestion-btn:hover {
  background: #e9ecef;
  border-color: #667eea;
}

.advanced-filters {
  border-top: 1px solid #eee;
  padding-top: 25px;
}

.advanced-filters h4 {
  margin: 0 0 15px;
  color: #333;
  font-size: 1.1rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group label {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.filter-select,
.date-input,
.weight-input {
  padding: 10px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.3s ease;
}

.filter-select:focus,
.date-input:focus,
.weight-input:focus {
  outline: none;
  border-color: #667eea;
}

.date-range,
.weight-range {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-range span,
.weight-range span {
  color: #666;
  font-size: 0.9rem;
}

.loading-section {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  font-size: 3rem;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-section {
  text-align: center;
  padding: 60px 20px;
  color: #721c24;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 20px;
}

.retry-btn {
  padding: 10px 20px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 15px;
}

.semantic-results {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.results-header {
  background: #f8f9fa;
  padding: 20px 30px;
  border-bottom: 1px solid #eee;
}

.results-header h3 {
  margin: 0 0 10px;
  color: #333;
}

.results-info {
  display: flex;
  gap: 20px;
  color: #666;
  font-size: 0.9rem;
}

.query-analysis {
  padding: 20px 30px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.query-analysis h4 {
  margin: 0 0 15px;
  color: #333;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.analysis-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.analysis-item strong {
  color: #333;
  font-size: 0.9rem;
}

.analysis-item span {
  color: #666;
  font-size: 0.9rem;
}

.results-grid {
  overflow-x: auto;
}

.semantic-table {
  width: 100%;
  border-collapse: collapse;
}

.semantic-table th,
.semantic-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.semantic-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
  position: sticky;
  top: 0;
  z-index: 10;
}

.confidence-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 100px;
}

.confidence-bar {
  width: 60px;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #dc3545, #ffc107, #28a745);
  transition: width 0.3s ease;
}

.confidence-text {
  font-size: 0.8rem;
  font-weight: 600;
  min-width: 35px;
}

.high-confidence {
  background: rgba(40, 167, 69, 0.1);
}

.medium-confidence {
  background: rgba(255, 193, 7, 0.1);
}

.low-confidence {
  background: rgba(220, 53, 69, 0.1);
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  margin-right: 5px;
  transition: all 0.3s ease;
}

.view-btn {
  background: #007bff;
  color: white;
}

.view-btn:hover {
  background: #0056b3;
}

.details-btn {
  background: #6c757d;
  color: white;
}

.details-btn:hover {
  background: #545b62;
}

.results-stats {
  display: flex;
  justify-content: space-around;
  padding: 20px 30px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

.no-results,
.initial-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.no-results-icon,
.initial-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.no-results h3,
.initial-state h3 {
  margin: 0 0 10px;
  color: #333;
}

.no-results-suggestions {
  margin-top: 30px;
  text-align: left;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.no-results-suggestions h4 {
  margin: 0 0 15px;
  color: #333;
}

.no-results-suggestions ul {
  list-style: none;
  padding: 0;
}

.no-results-suggestions li {
  padding: 5px 0;
  color: #666;
}

.no-results-suggestions li:before {
  content: "• ";
  color: #667eea;
  font-weight: bold;
}

.initial-examples {
  margin-top: 30px;
  text-align: left;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.initial-examples h4 {
  margin: 0 0 15px;
  color: #333;
}

.initial-examples ul {
  list-style: none;
  padding: 0;
}

.initial-examples li {
  padding: 8px 0;
  color: #666;
  border-bottom: 1px solid #eee;
}

.initial-examples li:before {
  content: "💡 ";
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.detail-item {
  margin-bottom: 15px;
}

.detail-item strong {
  display: block;
  margin-bottom: 5px;
  color: #333;
}

.detail-item ul {
  margin: 5px 0;
  padding-left: 20px;
}

/* Responsive */
@media (max-width: 768px) {
  .search-input-group {
    flex-direction: column;
  }
  
  .semantic-search-btn {
    align-self: stretch;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .date-range,
  .weight-range {
    flex-direction: column;
    align-items: stretch;
  }
  
  .results-info {
    flex-direction: column;
    gap: 5px;
  }
  
  .results-stats {
    flex-direction: column;
    gap: 15px;
  }
  
  .semantic-table {
    font-size: 0.8rem;
  }
  
  .semantic-table th,
  .semantic-table td {
    padding: 8px;
  }
}
</style> 