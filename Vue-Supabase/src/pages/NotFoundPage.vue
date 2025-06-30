<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-icon">🔍</div>
      <h1>404</h1>
      <h2>Página No Encontrada</h2>
      <p>Lo sentimos, la página que buscas no existe o ha sido movida.</p>
      
      <div class="actions">
        <RouterLink to="/" class="action-button primary">
          🏠 Volver al Inicio
        </RouterLink>
        <RouterLink to="/dashboard" class="action-button secondary">
          📊 Ir al Dashboard
        </RouterLink>
      </div>
      
      <div class="suggestions">
        <h3>Páginas disponibles:</h3>
        <div class="suggestions-grid">
          <RouterLink to="/" class="suggestion-card">
            <div class="suggestion-icon">🏠</div>
            <h4>Inicio</h4>
            <p>Página principal</p>
          </RouterLink>
          
          <RouterLink to="/subir-archivo" class="suggestion-card">
            <div class="suggestion-icon">📤</div>
            <h4>Subir Archivo</h4>
            <p>Cargar archivos Excel</p>
          </RouterLink>
          
          <RouterLink to="/dashboard" class="suggestion-card">
            <div class="suggestion-icon">📊</div>
            <h4>Dashboard</h4>
            <p>Gestionar archivos</p>
          </RouterLink>
          
          <RouterLink to="/test" class="suggestion-card">
            <div class="suggestion-icon">🔍</div>
            <h4>Consultar Datos</h4>
            <p>Buscar información</p>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.not-found-container {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.not-found-content {
  text-align: center;
  max-width: 600px;
  background: white;
  padding: 3rem;
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.not-found-content h1 {
  font-size: 6rem;
  font-weight: bold;
  color: #4361ee;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.not-found-content h2 {
  font-size: 2rem;
  color: #333;
  margin: 0 0 1rem 0;
}

.not-found-content p {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.action-button.primary {
  background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%);
  color: white;
}

.action-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(67, 97, 238, 0.4);
}

.action-button.secondary {
  background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
  color: white;
}

.action-button.secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(108, 117, 125, 0.4);
}

.suggestions {
  text-align: left;
}

.suggestions h3 {
  color: #333;
  margin-bottom: 1.5rem;
  text-align: center;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.suggestion-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
}

.suggestion-card:hover {
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border-color: #4361ee;
}

.suggestion-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.suggestion-card h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1rem;
}

.suggestion-card p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 768px) {
  .not-found-container {
    padding: 1rem;
  }
  
  .not-found-content {
    padding: 2rem;
  }
  
  .not-found-content h1 {
    font-size: 4rem;
  }
  
  .not-found-content h2 {
    font-size: 1.5rem;
  }
  
  .actions {
    flex-direction: column;
  }
  
  .suggestions-grid {
    grid-template-columns: 1fr;
  }
}
</style> 