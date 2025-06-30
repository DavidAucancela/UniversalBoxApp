import { ref } from 'vue'
import { useSupabase } from '@/composables/useSupabase'
import * as XLSX from 'xlsx'

export function useExcelFiles() {
  const files = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Subir archivo Excel
  const uploadExcelFile = async (file, metadata = {}) => {
    try {
      loading.value = true
      error.value = null

      console.log('Iniciando subida de archivo:', file.name)

      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `excel-files/${fileName}`

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await useSupabase.storage
        .from('archivos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Error al subir archivo: ${uploadError.message}`)
      }

      console.log('Archivo subido exitosamente')

      // Obtener URL pública del archivo
      const { data: urlData } = useSupabase.storage
        .from('archivos')
        .getPublicUrl(filePath)

      // Insertar registro en la base de datos
      const { data: dbData, error: dbError } = await useSupabase
        .from('archivos_excel')
        .insert({
          nombre_archivo: file.name,
          nombre_original: file.name,
          tipo_mime: file.type,
          tamaño_bytes: file.size,
          ruta_storage: filePath,
          descripcion: metadata.descripcion || '',
          etiquetas: metadata.etiquetas || [],
          metadata: {
            ...metadata,
            url_publica: urlData.publicUrl
          }
        })
        .select()
        .single()

      if (dbError) {
        // Si falla la inserción en BD, eliminar el archivo subido
        await useSupabase.storage.from('archivos').remove([filePath])
        throw new Error(`Error al guardar en base de datos: ${dbError.message}`)
      }

      console.log('Registro creado en base de datos:', dbData)

      // Procesar archivo Excel (extraer datos)
      await processExcelFile(dbData.id, file)

      return { success: true, data: dbData }
    } catch (err) {
      console.error('Error en uploadExcelFile:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }


  // Procesar archivo Excel y extraer datos
  const processExcelFile = async (archivoId, file) => {
    try {
      console.log('Procesando archivo Excel...')

      // Crear log de inicio de procesamiento
      await createProcessingLog(archivoId, 'procesar_excel', 'procesando', 'Iniciando procesamiento de Excel')

      // Leer archivo Excel usando SheetJS
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })



      // Extraer datos reales del archivo
      const excelData = extractExcelData(workbook)
      
      // Guardar datos extraídos
      await saveExcelData(archivoId, excelData)

      // Actualizar estado del archivo
      await useSupabase
        .from('archivos_excel')
        .update({ estado: 'activo' })
        .eq('id', archivoId)

      // Crear log de éxito
      await createProcessingLog(archivoId, 'procesar_excel', 'exitoso', 'Archivo procesado exitosamente')

      console.log('Archivo Excel procesado')
    } catch (err) {
      console.error('Error procesando Excel:', err)
      
      // Actualizar estado del archivo a error
      await useSupabase
        .from('archivos_excel')
        .update({ estado: 'error' })
        .eq('id', archivoId)

      // Crear log de error
      await createProcessingLog(archivoId, 'procesar_excel', 'error', err.message)
      
      throw err
    }
  }

  // Extraer datos reales del archivo Excel usando SheetJS
  const extractExcelData = (workbook) => {
    const hojas = []
    const columnasClave = [
      'HAWB',
      'CONSIGNATARIO',
      'CEDULA',
      'PESO',
      'DESCRIPCIÓN',
      'CANTIDAD',
      'FACTURA COMERCIAL',
      'FECHA DE EMISIÓN'
    ];
    function normalize(str) {
      return (str || '').toString().trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
    }
    
    workbook.SheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName]
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      const filteredData = rawData.filter(row => 
        row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
      )
      if (filteredData.length === 0) return
      // Normaliza cabecera
      const headerRow = filteredData[0].map(h => h ? normalize(h) : '')
      const colIndexMap = {};
      columnasClave.forEach(col => {
        const idx = headerRow.findIndex(h => h === normalize(col));
        if (idx !== -1) colIndexMap[col] = idx;
      });
      // Rellenar celdas vacías con el valor de la fila superior (solo columnas clave)
      for (let i = 1; i < filteredData.length; i++) {
        columnasClave.forEach(col => {
          const idx = colIndexMap[col];
          if (idx !== undefined) {
            // Si la celda está vacía o es undefined, busca hacia arriba la última fila con valor
            if (!filteredData[i][idx] || String(filteredData[i][idx]).trim() === '') {
              let found = false;
              for (let k = i - 1; k >= 1; k--) {
                if (filteredData[k][idx] && String(filteredData[k][idx]).trim() !== '') {
                  filteredData[i][idx] = filteredData[k][idx];
                  found = true;
                  break;
                }
              }
              if (!found) filteredData[i][idx] = '';
            }
          }
        });
      }
      // Limpiar espacios en todas las celdas
      for (let i = 0; i < filteredData.length; i++) {
        for (let j = 0; j < filteredData[i].length; j++) {
          filteredData[i][j] = filteredData[i][j] ? String(filteredData[i][j]).trim() : '';
        }
      }
      const datos = []
      const numRows = filteredData.length
      const numCols = Math.max(...filteredData.map(row => row.length))
      filteredData.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell !== null && cell !== undefined && String(cell).trim() !== '') {
            const colName = XLSX.utils.encode_col(colIndex)
            datos.push({
              fila: rowIndex + 1,
              columna: colName,
              valor: String(cell),
              tipo_dato: getDataType(cell)
            })
          }
        })
      })
      hojas.push({
        nombre: sheetName,
        indice: index,
        filas: numRows,
        columnas: numCols,
        datos: datos
      })
    })
    return { hojas }
  }

  // Determinar el tipo de dato de una celda
  const getDataType = (value) => {
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'entero' : 'decimal'
    } else if (typeof value === 'boolean') {
      return 'booleano'
    } else if (value instanceof Date) {
      return 'fecha'
    } else {
      return 'texto'
    }
  }

  // Guardar datos extraídos en la base de datos
  const saveExcelData = async (archivoId, excelData) => {
    try {
      for (const hoja of excelData.hojas) {
        // Insertar hoja
        const { error: hojaError } = await useSupabase
          .from('hojas_excel')
          .insert({
            archivo_id: archivoId,
            nombre_hoja: hoja.nombre,
            indice_hoja: hoja.indice,
            numero_filas: hoja.filas,
            numero_columnas: hoja.columnas
          })
          .select()
          .single()

        if (hojaError) throw hojaError

        // Insertar datos de la hoja
        const datosToInsert = hoja.datos.map(dato => ({
          archivo_id: archivoId,
          hoja_nombre: hoja.nombre,
          fila_numero: dato.fila,
          columna_nombre: dato.columna,
          valor_texto: dato.valor,
          tipo_dato: dato.tipo_dato
        }))

        if (datosToInsert.length > 0) {
          const { error: datosError } = await useSupabase
            .from('datos_excel')
            .insert(datosToInsert)

          if (datosError) throw datosError
        }
      }
    } catch (err) {
      console.error('❌ Error guardando datos Excel:', err)
      throw err
    }
  }

  // Crear log de procesamiento
  //agregar este log a configuracion como administrador
  const createProcessingLog = async (archivoId, operacion, estado, mensaje) => {
    try {
      await useSupabase
        .from('logs_procesamiento')
        .insert({
          archivo_id: archivoId,
          tipo_operacion: operacion,
          estado: estado,
          mensaje: mensaje
        })
    } catch (err) {
      console.error('Error creando log:', err)
    }
  }

  // Obtener archivos del usuario
  const getUserFiles = async () => {
    try {
      loading.value = true
      error.value = null

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
        .eq('estado', 'activo')
        .order('fecha_subida', { ascending: false })

      if (fetchError) throw fetchError

      files.value = data || []
      return { success: true, data }
    } catch (err) {
      console.error('❌ Error obteniendo archivos:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Obtener datos de un archivo específico
  const getFileData = async (archivoId, hojaNombre = null, limit = 100) => {
    try {
      loading.value = true
      error.value = null

      let query = useSupabase
        .from('datos_excel')
        .select('*')
        .eq('archivo_id', archivoId)

      if (hojaNombre) {
        query = query.eq('hoja_nombre', hojaNombre)
      }

      const { data, error: fetchError } = await query
        .order('fila_numero', { ascending: true })
        .order('columna_indice', { ascending: true })
        .limit(limit)

      if (fetchError) throw fetchError

      return { success: true, data }
    } catch (err) {
      console.error('❌ Error obteniendo datos del archivo:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Buscar en archivos Excel
  const searchInFiles = async (searchTerm, archivoId = null) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: searchError } = await useSupabase
        .rpc('buscar_en_excel', {
          p_termino_busqueda: searchTerm,
          p_archivo_id: archivoId
        })

      if (searchError) throw searchError

      return { success: true, data }
    } catch (err) {
      console.error('❌ Error buscando en archivos:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Eliminar archivo
  const deleteFile = async (archivoId) => {
    try {
      loading.value = true
      error.value = null

      // Obtener información del archivo
      const { data: fileData, error: fetchError } = await useSupabase
        .from('archivos_excel')
        .select('ruta_storage')
        .eq('id', archivoId)
        .single()

      if (fetchError) throw fetchError

      // Eliminar archivo de storage
      const { error: storageError } = await useSupabase.storage
        .from('archivos')
        .remove([fileData.ruta_storage])

      if (storageError) {
        console.warn('⚠️ Error eliminando archivo de storage:', storageError)
      }

      // Marcar como eliminado en BD (soft delete)
      const { error: deleteError } = await useSupabase
        .from('archivos_excel')
        .update({ estado: 'eliminado' })
        .eq('id', archivoId)

      if (deleteError) throw deleteError

      // Actualizar lista local
      files.value = files.value.filter(f => f.id !== archivoId)

      return { success: true }
    } catch (err) {
      console.error('❌ Error eliminando archivo:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Obtener estadísticas
  const getStats = async () => {
    try {
      const { data, error } = await useSupabase
        .rpc('obtener_estadisticas_archivos')

      if (error) throw error

      return { success: true, data }
    } catch (err) {
      console.error('❌ Error obteniendo estadísticas:', err)
      return { success: false, error: err.message }
    }
  }

  return {
    files,
    loading,
    error,
    uploadExcelFile,
    getUserFiles,
    getFileData,
    searchInFiles,
    deleteFile,
    getStats
  }
} 