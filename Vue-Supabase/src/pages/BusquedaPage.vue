<template>
  <div class="busqueda-container">
    <div class="search-header">
      <h1 class="page-header">Búsqueda en Archivos Excel</h1>
      <p class="page-subtitle">Busca contenido en todos tus archivos Excel procesados</p>
    </div>

    <!-- Barra de búsqueda -->
    <div class="search-bar">
      <div class="search-input-group">
        <input 
          v-model="searchTerm" 
          @input="debounceSearch"
          @keyup.enter="buscar"
          placeholder="Buscar por contenido, nombres de archivo, hojas..." 
          class="search-input"
        />
        <button @click="buscar" class="search-btn" :disabled="loading">
          {{ loading ? '⏳ Buscando...' : '🔍 Buscar' }}
        </button>
      </div>
      
      <!-- Filtros -->
      <div class="search-filters">
        <select v-model="selectedFile" class="filter-select">
          <option value="">Todos los archivos</option>
          <option v-for="file in files" :key="file.id" :value="file.id">
            {{ file.nombre_archivo }}
          </option>
        </select>
        
        <select v-model="selectedSheet" class="filter-select">
          <option value="">Todas las hojas</option>
          <option v-for="sheet in availableSheets" :key="sheet" :value="sheet">
            {{ sheet }}
          </option>
        </select>
      </div>
    </div>

    <!-- Estados de carga y error -->
    <div v-if="loading" class="loading-section">
      <div class="loading-spinner">⏳</div>
      <p>Buscando en archivos...</p>
    </div>

    <div v-else-if="error" class="error-section">
      <div class="error-icon">❌</div>
      <h3>Error en la búsqueda</h3>
      <p>{{ error }}</p>
      <button @click="buscar" class="retry-btn">🔄 Reintentar</button>
    </div>

    <!-- Resultados -->
    <div v-else-if="searchResults.length > 0" class="search-results">
      <div class="results-header">
        <h3>Resultados de búsqueda</h3>
        <span class="results-count">{{ envios.length }} registros encontrados</span>
      </div>

      <div class="results-grid">
        <table class="data-table">
          <thead>
            <tr>
              <th v-for="col in columnasDeseadasRaw" :key="col">{{ col }}</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="envio in envios" :key="`${envio.archivo_id}-${envio.hoja_nombre}-${envio.fila_numero}`">
              <td v-for="col in columnasDeseadas" :key="col">{{ getFieldValue(envio.envio, col) }}</td>
              <td>
                <button @click="viewFile(envio.archivo_id)" class="action-btn view-btn">
                  Ver archivo
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Sin resultados -->
    <div v-else-if="hasSearched" class="no-results">
      <div class="no-results-icon">🔍</div>
      <h3>No se encontraron resultados</h3>
      <p>Intenta con otros términos de búsqueda o verifica que tengas archivos procesados.</p>
    </div>

    <!-- Estado inicial -->
    <div v-else class="initial-state">
      <div class="initial-icon">📊</div>
      <h3>Busca en tus archivos Excel</h3>
      <p>Escribe un término de búsqueda para encontrar contenido en tus archivos procesados.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabase } from '../composables/useSupabase'
import { useExcelFiles } from '../composables/useExcelFiles'

const router = useRouter()
const { getUserFiles } = useExcelFiles()

// Estado del componente
const searchTerm = ref('')
const selectedFile = ref('')
const selectedSheet = ref('')
const searchResults = ref([])
const files = ref([])
const loading = ref(false)
const error = ref(null)
const hasSearched = ref(false)
const searchTimeout = ref(null)

// Hojas disponibles (se actualiza según el archivo seleccionado)
const availableSheets = computed(() => {
  if (!selectedFile.value) {
    // Obtener todas las hojas únicas de todos los archivos
    const allSheets = new Set()
    files.value.forEach(file => {
      if (file.hojas_excel) {
        file.hojas_excel.forEach(hoja => {
          allSheets.add(hoja.nombre_hoja)
        })
      }
    })
    return Array.from(allSheets)
  }
  
  const selectedFileData = files.value.find(f => f.id === selectedFile.value)
  return selectedFileData?.hojas_excel?.map(h => h.nombre_hoja) || []
})

// Normaliza los nombres de columna para comparar
function normalize(str) {
  return (str || '').toString().trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
}

// Columnas relevantes a mostrar (normalizadas)
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

// Función para agrupar y reconstruir los envíos a partir de los resultados de búsqueda
const buildEnviosFromSearch = (results) => {
  if (!results || results.length === 0) return [];

  // Agrupar por archivo, hoja y fila
  const agrupados = {};
  results.forEach(cell => {
    const key = `${cell.archivo_id}|${cell.hoja_nombre}|${cell.fila_numero}`;
    if (!agrupados[key]) {
      agrupados[key] = {
        archivo_id: cell.archivo_id,
        hoja_nombre: cell.hoja_nombre,
        fila_numero: cell.fila_numero,
        envio: {}
      };
    }
    agrupados[key].envio[cell.columna_nombre] = cell.valor_texto;
  });

  // Buscar la cabecera (fila 1) de esa hoja y archivo
  const cabeceras = {};
  results.forEach(cell => {
    if (cell.fila_numero === 1) {
      const key = `${cell.archivo_id}|${cell.hoja_nombre}`;
      if (!cabeceras[key]) cabeceras[key] = {};
      cabeceras[key][cell.columna_nombre] = cell.valor_texto;
    }
  });

  // Reconstruir los envíos usando la cabecera
  const envios = [];
  Object.values(agrupados).forEach(grp => {
    const keyCab = `${grp.archivo_id}|${grp.hoja_nombre}`;
    const cab = cabeceras[keyCab] || {};
    const envioObj = {};
    
    for (const colLetra in grp.envio) {
      // Normaliza el nombre de la columna de la cabecera
      const colName = cab[colLetra] ? normalize(cab[colLetra]) : colLetra;
      envioObj[colName] = grp.envio[colLetra];
    }
    
    envios.push({
      archivo_id: grp.archivo_id,
      hoja_nombre: grp.hoja_nombre,
      fila_numero: grp.fila_numero,
      envio: envioObj
    });
  });

  console.log('🔍 Envíos reconstruidos de búsqueda:', envios.length);
  return envios;
};

// Computed para los envíos de búsqueda
const envios = computed(() => buildEnviosFromSearch(searchResults.value));

// Cargar archivos disponibles
const loadFiles = async () => {
  try {
    loading.value = true
    error.value = null
    
    const result = await getUserFiles()
    if (result.success) {
      files.value = result.data || []
      console.log('✅ Archivos cargados para búsqueda:', files.value.length)
    } else {
      throw new Error(result.error)
    }
  } catch (err) {
    console.error('❌ Error cargando archivos:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Búsqueda con debounce
const debounceSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  searchTimeout.value = setTimeout(() => {
    if (searchTerm.value.trim()) {
      buscar()
    }
  }, 500)
}

// Función para obtener el valor de un campo con múltiples variaciones
const getFieldValue = (envio, normalizedField) => {
  // Buscar el campo normalizado
  if (envio[normalizedField]) return envio[normalizedField];
  
  // Si no se encuentra, buscar variaciones
  const variations = [
    normalizedField,
    normalizedField.toLowerCase(),
    normalizedField.charAt(0).toUpperCase() + normalizedField.slice(1).toLowerCase()
  ];
  
  for (const variation of variations) {
    if (envio[variation]) return envio[variation];
  }
  
  return '-';
};

// Función de búsqueda
const buscar = async () => {
  if (!searchTerm.value.trim()) {
    searchResults.value = []
    hasSearched.value = false
    return
  }

  try {
    loading.value = true
    error.value = null
    hasSearched.value = true
    
    console.log('🔍 Buscando:', searchTerm.value)
    
    // Construir query de búsqueda
    let query = useSupabase
      .from('datos_excel')
      .select('*')
      .ilike('valor_texto', `%${searchTerm.value}%`)
    
    // Aplicar filtros
    if (selectedFile.value) {
      query = query.eq('archivo_id', selectedFile.value)
    }
    
    if (selectedSheet.value) {
      query = query.eq('hoja_nombre', selectedSheet.value)
    }
    
    // Ejecutar búsqueda
    const { data, error: searchError } = await query
      .order('archivo_id', { ascending: true })
      .order('fila_numero', { ascending: true })
      .limit(500) // Aumentar límite para obtener más resultados
    
    if (searchError) throw searchError
    
    searchResults.value = data || []
    console.log('✅ Resultados encontrados:', searchResults.value.length)
    
    // Si encontramos resultados, obtener datos adicionales para reconstruir envíos completos
    if (searchResults.value.length > 0) {
      await loadAdditionalDataForSearch();
    }
    
  } catch (err) {
    console.error('❌ Error en búsqueda:', err)
    error.value = err.message
    searchResults.value = []
  } finally {
    loading.value = false
  }
}

// Cargar datos adicionales para reconstruir envíos completos
const loadAdditionalDataForSearch = async () => {
  try {
    // Obtener hojas únicos de los resultados
    const uniqueSheets = [...new Set(searchResults.value.map(r => `${r.archivo_id}|${r.hoja_nombre}`))];
    
    // Obtener datos adicionales para cada archivo/hoja
    const additionalData = [];
    
    for (const fileSheet of uniqueSheets) {
      const [archivoId, hojaNombre] = fileSheet.split('|');
      
      // Obtener todos los datos de esta hoja para reconstruir envíos completos
      const { data: sheetData, error } = await useSupabase
        .from('datos_excel')
        .select('*')
        .eq('archivo_id', archivoId)
        .eq('hoja_nombre', hojaNombre)
        .order('fila_numero', { ascending: true })
        .order('columna_nombre', { ascending: true });
      
      if (!error && sheetData) {
        additionalData.push(...sheetData);
      }
    }
    
    // Combinar resultados de búsqueda con datos adicionales
    const allData = [...searchResults.value, ...additionalData];
    
    // Eliminar duplicados basados en archivo_id, hoja_nombre, fila_numero, columna_nombre
    const uniqueData = allData.filter((item, index, self) => 
      index === self.findIndex(t => 
        t.archivo_id === item.archivo_id && 
        t.hoja_nombre === item.hoja_nombre && 
        t.fila_numero === item.fila_numero && 
        t.columna_nombre === item.columna_nombre
      )
    );
    
    searchResults.value = uniqueData;
    console.log('✅ Datos adicionales cargados, total:', searchResults.value.length);
    
  } catch (err) {
    console.error('❌ Error cargando datos adicionales:', err);
  }
}

// Obtener nombre del archivo por ID
// const getFileName = (archivoId) => {
//   const file = files.value.find(f => f.id === archivoId)
//   return file?.nombre_archivo || 'Archivo desconocido'
// }

// Ver archivo específico
const viewFile = (archivoId) => {
  router.push(`/ver-archivo/${archivoId}`)
}

// Cargar datos al montar
onMounted(() => {
  loadFiles()
})
</script>

<style scoped>
.busqueda-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.search-header {
  text-align: center;
  margin-bottom: 2rem;
}

.search-header h1 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 2rem;
}

.search-header p {
  color: #666;
  margin: 0;
}

.search-bar {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.search-input-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #4361ee;
}

.search-btn {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.search-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(67, 97, 238, 0.4);
}

.search-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.search-filters {
  display: flex;
  gap: 1rem;
}

.filter-select {
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
}

.loading-section,
.error-section {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  font-size: 3rem;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1rem;
}

.search-results {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.results-header {
  padding: 2rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.results-header h3 {
  margin: 0;
  color: #333;
}

.results-count {
  color: #666;
  font-size: 0.9rem;
}

.results-grid {
  padding: 2rem;
  display: grid;
  gap: 1.5rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.75rem;
  text-align: left;
}

.data-table th {
  background-color: #f8f9fa;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.view-btn {
  background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%);
  color: white;
}

.view-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(67, 97, 238, 0.4);
}

.no-results,
.initial-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.no-results-icon,
.initial-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-results h3,
.initial-state h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.no-results p,
.initial-state p {
  color: #666;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .busqueda-container {
    padding: 1rem;
  }
  
  .search-input-group {
    flex-direction: column;
  }
  
  .search-filters {
    flex-direction: column;
  }
  
  .results-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .result-header {
    flex-direction: column;
    gap: 1rem;
  }
}
</style> 