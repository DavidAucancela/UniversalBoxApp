<template>
  <div class="container">
    <h1 class="page-header">Gestión de Usuarios</h1>
    <p class="page-subtitle">Administra usuarios, roles y permisos del sistema</p>
    
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Usuarios</h3>
        <p class="stat-number">{{ totalUsuarios }}</p>
      </div>
      <div class="stat-card">
        <h3>Usuarios Activos</h3>
        <p class="stat-number">{{ usuariosActivos }}</p>
      </div>
      <div class="stat-card">
        <h3>Nuevos este mes</h3>
        <p class="stat-number">{{ nuevosEsteMes }}</p>
      </div>
    </div>

    <div class="actions-section">
      <button @click="mostrarFormulario = true" class="btn-primary">
        Agregar nuevo usuario
      </button>
      <button @click="cargarUsuarios" class="btn-secondary">
        Actualizar usuarios
      </button>
    </div>

    <!-- Tabla de usuarios -->
    <div class="table-container">
      <h2>Lista de Usuarios</h2>
      <table v-if="usuarios.length" class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Fecha Registro</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="usuario in usuarios" :key="usuario.id">
            <td>{{ usuario.id }}</td>
            <td>{{ usuario.nombres }} {{ usuario.apellidos }}</td>
            <td>{{ usuario.email }}</td>
            <td>
              <span class="role-badge" :class="getRoleClass(usuario.role_id)">
                {{ getRoleName(usuario.role_id) }}
              </span>
            </td>
            <td>{{ formatDate(usuario.fecha_creada) }}</td>
            <td>
              <span class="status-badge active">Activo</span>
            </td>
            <td>
              <button @click="editarUsuario(usuario)" class="btn-small btn-edit">
                ✏️
              </button>
              <button @click="eliminarUsuario(usuario.id)" class="btn-small btn-delete">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!usuarios.length && !loading" class="no-data">
        No hay usuarios registrados.
      </p>
    </div>

    <!-- Formulario modal para agregar/editar usuario -->
    <div v-if="mostrarFormulario" class="modal-overlay" @click="cerrarFormulario()">
      <div class="modal-content" @click.stop>
        <h2>{{ editando ? 'Editar' : 'Agregar' }} Usuario</h2>
        <form @submit.prevent="guardarUsuario">
          <div class="form-group">
            <label>Nombre:</label>
            <input v-model="formData.nombres" type="text" required />
          </div>
          <div class="form-group">
            <label>Apellidos:</label>
            <input v-model="formData.apellidos" type="text" required />
          </div>
          <div class="form-group">
            <label>Email:</label>
            <input v-model="formData.email" type="email" required />
          </div>
          <div class="form-group">
            <label>Rol:</label>
            <select v-model="formData.role_id" required>
              <option value="">Seleccionar rol</option>
              <option value="1">Gerente</option>
              <option value="2">Administrador</option>
              <option value="3">Digitador</option>
            </select>
          </div>
          <div v-if="!editando" class="form-group">
            <label>Contraseña:</label>
            <input v-model="formData.password" type="password" required minlength="6" placeholder="Mínimo 6 caracteres" />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="loading">
              {{ editando ? 'Actualizar' : 'Guardar' }}
            </button>
            <button type="button" @click="cerrarFormulario()" class="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
        <div v-if="successMessage" class="success-message" style="margin-top:1rem;">{{ successMessage }}</div>
        <div v-if="error" class="error-message" style="margin-top:1rem;">{{ error }}</div>
      </div>
    </div>

    <div v-if="loading" class="loading">Cargando usuarios...</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSupabase } from "../composables/useSupabase"
import { useAuth } from "../composables/useAuth"

const { signUp } = useAuth()

const usuarios = ref([])
const loading = ref(false)
const error = ref(null)
const mostrarFormulario = ref(false)
const editando = ref(false)
const totalUsuarios = ref(0)
const usuariosActivos = ref(0)
const nuevosEsteMes = ref(0)
const successMessage = ref(null)

const formData = ref({
  nombres: '',
  apellidos: '',
  email: '',
  password: '',
  role_id: ''
})

const cargarUsuarios = async () => {
  try {
    loading.value = true
    error.value = null
    
    const { data, error: err } = await useSupabase
      .from('usuarios')
      .select('*')
      .order('fecha_creada', { ascending: false })

    if (err) throw err
    
    usuarios.value = data
    totalUsuarios.value = data.length
    usuariosActivos.value = data.length
    nuevosEsteMes.value = data.filter(u => {
      const fecha = new Date(u.fecha_creada)
      const ahora = new Date()
      return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear()
    }).length
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const getRoleName = (roleId) => {
  const roles = {
    1: 'Administrador',
    2: 'Editor',
    3: 'Gerente'
  }
  return roles[roleId] || 'Desconocido'
}

const getRoleClass = (roleId) => {
  const classes = {
    1: 'role-admin',
    2: 'role-editor',
    3: 'role-manager'
  }
  return classes[roleId] || 'role-default'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-ES')
}

const editarUsuario = (usuario) => {
  editando.value = true
  formData.value = { ...usuario, password: '' }
  mostrarFormulario.value = true
  error.value = null
  successMessage.value = null
}

const eliminarUsuario = async (id) => {
  if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) return
  
  try {
    const { error: err } = await useSupabase
      .from('usuarios')
      .delete()
      .eq('id', id)
    
    if (err) throw err
    
    await cargarUsuarios()
  } catch (err) {
    error.value = err.message
  }
}

const guardarUsuario = async () => {
  // Validaciones
  if (!formData.value.nombres || !formData.value.apellidos || 
      !formData.value.email || !formData.value.role_id || (!editando.value && !formData.value.password)) {
    error.value = "Por favor, completa todos los campos.";
    successMessage.value = null;
    return;
  }
  if (!editando.value && formData.value.password.length < 6) {
    error.value = "La contraseña debe tener al menos 6 caracteres.";
    successMessage.value = null;
    return;
  }

  try {
    loading.value = true;
    error.value = null;
    successMessage.value = null;

    if (editando.value) {
      // Solo actualiza datos en la tabla usuarios
      const { error: err } = await useSupabase
        .from('usuarios')
        .update({
          nombres: formData.value.nombres,
          apellidos: formData.value.apellidos,
          email: formData.value.email,
          role_id: formData.value.role_id
        })
        .eq('id', formData.value.id)
      if (err) throw err
      successMessage.value = 'Usuario actualizado exitosamente.';
    } else {
      // Usa signUp para crear usuario en auth y tabla usuarios
      const result = await signUp({
        nombres: formData.value.nombres,
        apellidos: formData.value.apellidos,
        email: formData.value.email,
        password: formData.value.password,
        role_id: formData.value.role_id
      });
      if (!result.success) throw result.error
      successMessage.value = 'Usuario creado exitosamente. Se ha enviado un correo de confirmación.';
    }
    // Limpiar formulario y recargar usuarios
    cerrarFormulario(true)
    await cargarUsuarios()
  } catch (err) {
    error.value = err.message
    successMessage.value = null
  } finally {
    loading.value = false
  }
}

const cerrarFormulario = (exito = false) => {
  if (!exito) {
    mostrarFormulario.value = false
  } else {
    // Deja el modal abierto para mostrar el mensaje de éxito
    setTimeout(() => {
      mostrarFormulario.value = false
    }, 2000)
  }
  editando.value = false
  formData.value = {
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    role_id: ''
  }
  error.value = null
  if (!exito) successMessage.value = null
}

onMounted(cargarUsuarios)
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #4361ee;
  margin: 0.5rem 0 0 0;
}

.actions-section {
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #4361ee;
  color: white;
}

.btn-primary:hover {
  background: #3f37c9;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.table-container {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.data-table th,
.data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background: #f8f9fa;
  font-weight: 600;
}

.role-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.role-admin {
  background: #dc3545;
  color: white;
}

.role-editor {
  background: #28a745;
  color: white;
}

.role-manager {
  background: #ffc107;
  color: #212529;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.btn-small {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.25rem;
}

.btn-edit {
  background: #ffc107;
  color: #212529;
}

.btn-delete {
  background: #dc3545;
  color: white;
}

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
  padding: 2rem;
  border-radius: 12px;
  min-width: 400px;
  max-width: 500px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}

.no-data {
  text-align: center;
  color: #666;
  padding: 2rem;
}

.success-message {
  background: #d4edda;
  color: #155724;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}
</style> 