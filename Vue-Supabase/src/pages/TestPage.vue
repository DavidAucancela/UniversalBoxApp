<template>
  <div class="container">
    <h1 class="page-header">Pruebas del Sistema</h1>
    <p class="page-subtitle">Realiza pruebas y consultas de la base de datos</p>

    <!-- Sección Tabla PRUEBA -->
    <section>
      <h2>Usuarios AUTH.USERS</h2>
      <button @click="fetchTestData">Consultar </button>

      <table v-if="testData.length" class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Descripción</th>
            <th>Hora</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in testData" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.name }}</td>
            <td>{{ item.created_at }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!testData.length && !loading && !error">No hay datos disponibles.</p>
    </section>

    <!-- Sección Tabla USUARIOS -->
    <section>
      <h2>Usuarios</h2>
      <button @click="fetchUsuarios">Consultar </button>

      <table v-if="usersData.length" class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>nombre</th>
            <th>fecha creada</th>
            <th>id rol</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in usersData" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.nombres }}</td>
            <td>{{ user.fecha_creada }}</td>
            <td>{{ user.role_id }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!usersData.length && !loading && !error">No hay usuarios registrados.</p>
    </section>

    <!-- Sección Tabla USUARIOS combinada auth.users y profile-->
    <section>
      <h2>Usuarios combinados</h2>
      <button @click="fetchUsuariosComplet">Consultar </button>

      <table v-if="usersData2.length" class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre completo</th>
            <th>Email</th>
            <th>Contraseña (encrypt)</th>
            <th>Fecha creación</th>
            <th>Rol</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in usersData2" :key="user.usuario_id">
            <td>{{ user.usuario_id }}</td>
            <td>{{ user.full_name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.encrypted_password }}</td>
            <td>{{ user.fecha_creada }}</td>
            <td>{{ user.role_name }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!usersData2.length && !loading && !error">No hay usuarios registrados.</p>
    </section>

    <!-- Sección Agregar Usuario -->
    <section>
      <h2>Registro de Usuario</h2>
      <form @submit.prevent="addUser">
        <input type="text" v-model="nombre" placeholder="Nombre " />
        <input type="text" v-model="apellido" placeholder="Apellidos" />
        <input type="email" v-model="email" placeholder="Correo electrónico" />
        <input type="password" v-model="password" placeholder="Contraseña" />
        <select v-model="role_id">
          <option disabled value="">Selecciona un rol</option>
          <option value="1">Administrador</option>
          <option value="2">Editor</option>
          <option value="3">Gerente</option>
        </select>
        <button type="submit">Registrar</button>
      </form>
    </section>

    <!-- Mensajes de estado -->
    <div v-if="loading" class="status-message">Cargando datos...</div>
    <div v-if="error" class="error-message">Error: {{ error }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSupabase } from "../composables/useSupabase";

// Datos reactivos
const testData = ref([])
const usersData = ref([])
const usersData2 = ref([])

const error = ref(null)
const loading = ref(false)

const nombre = ref('')
const apellido = ref('')
const email = ref('')
const password = ref('')
const role_id = ref('')


// Consultar datos de prueba
const fetchTestData = async () => {
  try {
    loading.value = true
    error.value = null
    const { data: rows, error: err } = await useSupabase
      .from('test_data')
      .select('*')
      .order('created_at', { ascending: false })

    if (err) throw err
    testData.value = rows
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Consultar usuarios
const fetchUsuarios = async () => {
  try {
    loading.value = true
    error.value = null
    const { data: rows, error: err } = await useSupabase
      .from('usuarios')
      .select('*')
      .order('fecha_creada', { ascending: false })

    if (err) throw err
    usersData.value = rows
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Consultar usuarios unidos de auth.users y profile
const fetchUsuariosComplet = async () => {
  try {
    loading.value = true
    error.value = null

    const { data: rows, error: err } = await useSupabase
      .from('user_details_view')
      .select(`
        usuario_id,
        fecha_creada,
        email,
        encrypted_password,
        full_name,
        role_name
      `)
      .order('fecha_creada', { ascending: false })

    if (err) throw err
    usersData2.value = rows
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Función para agregar un usuario
const addUser = async () => {
  const role = parseInt(role_id.value);

  // Validación
  if (!nombre.value || !apellido.value || !email.value || !password.value || isNaN(role)) {
    alert('Por favor, completa todos los campos correctamente.');
    return;
  }

  try {
    // 1. Registro en Auth (signUp)
    const { data: authData, error: authError } = await useSupabase.auth.signUp({
      email: email.value,
      password: password.value
    })

    if (authError) throw authError

    const userId = authData.user?.id

    if (!userId) {
      throw new Error('El usuario no fue creado correctamente. ¿Está habilitada la confirmación por email?')
    }

    // 2. Insertar en tabla usuarios
    const { error: userError } = await useSupabase
      .from('usuarios')
      .insert({
        id: authData.user.id,
        nombres: nombre.value,
        apellidos: apellido.value,
        role_id: role,
        fecha_creada: new Date()
      });

    if (userError) throw userError;

    // 3. Insertar en tabla profiles
    const { error: profileError } = await useSupabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        // Agrega otros campos necesarios para profiles
        updated_at: new Date()
      });

    if (profileError) throw profileError;

    console.log('Usuario registrado correctamente en auth, usuarios y profiles');

    // Limpiar formulario
    nombre.value = '';
    apellido.value = '';
    email.value = '';
    password.value = '';
    role_id.value = '';

  } catch (error) {
    console.error('Error completo:', {
      message: error.message,
      details: error.details,
      status: error.status
    });
    alert(`Error al registrar: ${error.message}`);
  }
};
</script>
